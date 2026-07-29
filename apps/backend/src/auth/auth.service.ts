import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common"
import { JwtService } from "@nestjs/jwt"
import type {
  AuthToken,
  ChangePasswordBody,
  ForgotPasswordBody,
  LoginBody,
  RegisterBody,
  ResetPasswordBody,
  UpdateProfileBody,
  User,
} from "@full-stack/shared"
import { okResponse } from "@full-stack/shared"
import { compare, hash } from "bcryptjs"
import { AuditService } from "../audit/audit.service.js"
import { env } from "../config/env.js"
import type { Role, User as DbUser } from "../generated/prisma/client.js"
import { MailService } from "../mail/mail.service.js"
import { PrismaService } from "../prisma/prisma.service.js"
import { AuthSessionService } from "./auth-session.service.js"

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly authSession: AuthSessionService,
    private readonly mailService: MailService,
    private readonly auditService: AuditService,
  ) {}

  async register(input: RegisterBody) {
    const existed = await this.prisma.user.findUnique({
      where: { email: input.email },
    })
    if (existed) {
      throw new ConflictException("email already exists")
    }

    const username = await this.createUniqueUsername(input.email)
    const passwordHash = await hash(input.password, 10)
    const row = await this.prisma.user.create({
      data: {
        username,
        email: input.email,
        name: input.name,
        passwordHash,
        role: "user",
      },
    })

    await this.auditService.write("auth.register", row.id)
    const refreshToken = await this.authSession.createRefresh(row.id)
    return {
      body: okResponse({
        user: this.toUser(row),
        token: await this.signToken(row.id, row.email),
      }),
      refreshToken,
    }
  }

  async login(input: LoginBody) {
    const row = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: input.account }, { username: input.account }],
      },
    })
    if (!row) {
      await this.auditService.write("auth.login_failed", "", input.account)
      throw new UnauthorizedException("invalid account or password")
    }
    if (row.disabled) {
      await this.auditService.write("auth.login_disabled", row.id)
      throw new UnauthorizedException("user disabled")
    }

    const matched = await compare(input.password, row.passwordHash)
    if (!matched) {
      await this.auditService.write("auth.login_failed", row.id)
      throw new UnauthorizedException("invalid account or password")
    }

    await this.auditService.write("auth.login", row.id)
    const refreshToken = await this.authSession.createRefresh(row.id)
    return {
      body: okResponse({
        user: this.toUser(row),
        token: await this.signToken(row.id, row.email),
      }),
      refreshToken,
    }
  }

  async refresh(refreshToken: string) {
    const rotated = await this.authSession.rotateRefresh(refreshToken)
    if (!rotated) {
      throw new UnauthorizedException("invalid refresh token")
    }
    const row = await this.prisma.user.findUnique({
      where: { id: rotated.userId },
    })
    if (!row || row.disabled) {
      throw new UnauthorizedException("invalid refresh token")
    }
    return {
      body: okResponse({
        token: await this.signToken(row.id, row.email),
      }),
      refreshToken: rotated.refreshToken,
    }
  }

  async logout(refreshToken: string) {
    await this.authSession.revokeRefresh(refreshToken)
    return okResponse({})
  }

  me(row: DbUser) {
    return okResponse(this.toUser(row))
  }

  async updateProfile(row: DbUser, input: UpdateProfileBody) {
    if (input.email !== row.email) {
      const existed = await this.prisma.user.findUnique({
        where: { email: input.email },
      })
      if (existed) {
        throw new ConflictException("email already exists")
      }
    }

    const updated = await this.prisma.user.update({
      where: { id: row.id },
      data: {
        name: input.name,
        email: input.email,
      },
    })
    await this.auditService.write("auth.profile_update", row.id)
    return okResponse(this.toUser(updated))
  }

  async changePassword(row: DbUser, input: ChangePasswordBody) {
    const matched = await compare(input.oldPassword, row.passwordHash)
    if (!matched) {
      throw new UnauthorizedException("invalid old password")
    }

    const passwordHash = await hash(input.newPassword, 10)
    await this.prisma.user.update({
      where: { id: row.id },
      data: { passwordHash },
    })
    await this.authSession.revokeUserSessions(row.id)
    await this.auditService.write("auth.password_change", row.id)
    return okResponse({})
  }

  async forgotPassword(input: ForgotPasswordBody) {
    const row = await this.prisma.user.findUnique({
      where: { email: input.email },
    })
    if (row && !row.disabled) {
      const token = await this.authSession.createPasswordReset(row.id)
      const link = `${env.FRONTEND_ORIGIN}/reset-password?token=${token}`
      await this.mailService.sendPasswordReset(row.email, link)
      await this.auditService.write("auth.forgot_password", row.id)
    }
    return okResponse({})
  }

  async resetPassword(input: ResetPasswordBody) {
    const userId = await this.authSession.takePasswordReset(input.token)
    if (!userId) {
      throw new UnauthorizedException("invalid reset token")
    }
    const passwordHash = await hash(input.newPassword, 10)
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    })
    await this.authSession.revokeUserSessions(userId)
    await this.auditService.write("auth.reset_password", userId)
    return okResponse({})
  }

  private async signToken(userId: string, email: string): Promise<AuthToken> {
    const accessToken = await this.jwtService.signAsync({
      sub: userId,
      email,
    })
    return {
      accessToken,
      tokenType: "Bearer",
      expiresIn: env.JWT_EXPIRES_SECONDS,
    }
  }

  private async createUniqueUsername(email: string) {
    const base = email
      .split("@")[0]
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "_")
    const existed = await this.prisma.user.findUnique({
      where: { username: base },
    })
    if (!existed) return base
    return `${base}_${Date.now()}`
  }

  private toUser(row: {
    id: string
    username: string
    email: string
    name: string
    role: Role
    disabled: boolean
    createdAt: Date
    updatedAt: Date
  }): User {
    return {
      id: row.id,
      username: row.username,
      email: row.email,
      name: row.name,
      role: row.role,
      disabled: row.disabled,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    }
  }
}
