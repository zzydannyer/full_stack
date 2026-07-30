import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common"
import { Reflector } from "@nestjs/core"
import type { Role } from "@full-stack/shared"
import { isArray } from "lodash-es"
import type { User as DbUser } from "../generated/prisma/client.js"
import { ROLES_KEY } from "./roles.decorator.js"

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext) {
    const roles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    if (!isArray(roles) || roles.length === 0) return true

    const request = context.switchToHttp().getRequest<{ user: DbUser }>()
    if (roles.includes(request.user.role)) return true
    throw new ForbiddenException("forbidden")
  }
}
