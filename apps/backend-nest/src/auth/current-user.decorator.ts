import { createParamDecorator, ExecutionContext } from "@nestjs/common"
import type { User as DbUser } from "../generated/prisma/client.js"

export const CurrentUser = createParamDecorator((_data: never, context: ExecutionContext) => {
  const request = context.switchToHttp().getRequest<{ user: DbUser }>()
  return request.user
})
