import { Injectable, UnauthorizedException } from "@nestjs/common"
import { PassportStrategy } from "@nestjs/passport"
import { ExtractJwt, Strategy } from "passport-jwt"
import { isString } from "lodash-es"
import { env } from "../config/env.js"
import { PrismaService } from "../prisma/prisma.service.js"

export type JwtPayload = {
  sub: string
  email: string
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: env.JWT_SECRET,
    })
  }

  async validate(payload: JwtPayload) {
    if (!isString(payload.sub)) {
      throw new UnauthorizedException("invalid token")
    }
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    })
    if (!user) {
      throw new UnauthorizedException("user not found")
    }
    if (user.disabled) {
      throw new UnauthorizedException("user disabled")
    }
    return user
  }
}
