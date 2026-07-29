import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common"
import type {
  CreateUserBody,
  PageQuery,
  PageResult,
  UpdateUserBody,
  User,
} from "@full-stack/shared"
import { okResponse } from "@full-stack/shared"
import { hash } from "bcryptjs"
import { AuthSessionService } from "../auth/auth-session.service.js"
import type { Role, User as DbUser } from "../generated/prisma/client.js"
import { PrismaService } from "../prisma/prisma.service.js"

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authSession: AuthSessionService,
  ) {}

  async list(query: PageQuery) {
    const total = await this.prisma.user.count()
    const rows = await this.prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    })
    const data: PageResult<User> = {
      items: rows.map((row) => this.toUser(row)),
      total,
      page: query.page,
      pageSize: query.pageSize,
    }
    return okResponse(data)
  }

  async detail(id: string) {
    const row = await this.prisma.user.findUnique({ where: { id } })
    if (!row) {
      throw new NotFoundException("user not found")
    }
    return okResponse(this.toUser(row))
  }

  async create(input: CreateUserBody) {
    await this.assertUnique(input.username, input.email)
    const passwordHash = await hash(input.password, 10)
    const row = await this.prisma.user.create({
      data: {
        username: input.username,
        email: input.email,
        name: input.name,
        passwordHash,
        role: input.role,
      },
    })
    return okResponse(this.toUser(row))
  }

  async update(id: string, input: UpdateUserBody) {
    const row = await this.prisma.user.findUnique({ where: { id } })
    if (!row) {
      throw new NotFoundException("user not found")
    }
    await this.assertUnique(input.username, input.email, id)
    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        username: input.username,
        email: input.email,
        name: input.name,
        role: input.role,
        disabled: input.disabled,
      },
    })
    if (input.disabled) {
      await this.authSession.revokeUserSessions(id)
    }
    return okResponse(this.toUser(updated))
  }

  async remove(id: string, current: DbUser) {
    if (id === current.id) {
      throw new ForbiddenException("cannot delete self")
    }
    const row = await this.prisma.user.findUnique({ where: { id } })
    if (!row) {
      throw new NotFoundException("user not found")
    }
    await this.authSession.revokeUserSessions(id)
    await this.prisma.user.delete({ where: { id } })
    return okResponse({})
  }

  private async assertUnique(username: string, email: string, excludeId = "") {
    const existed = await this.prisma.user.findFirst({
      where: {
        OR: [{ username }, { email }],
      },
    })
    if (!existed) return
    if (existed.id === excludeId) return
    if (existed.username === username) {
      throw new ConflictException("username already exists")
    }
    throw new ConflictException("email already exists")
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
