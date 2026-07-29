import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common"
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger"
import { CurrentUser } from "../auth/current-user.decorator.js"
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js"
import { Roles } from "../auth/roles.decorator.js"
import { RolesGuard } from "../auth/roles.guard.js"
import type { User as DbUser } from "../generated/prisma/client.js"
import { CreateUserBodyDto } from "./dto/create-user-body.dto.js"
import { PageQueryDto } from "./dto/page-query.dto.js"
import { UpdateUserBodyDto } from "./dto/update-user-body.dto.js"
import { UserService } from "./user.service.js"

@ApiTags("users")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("admin")
@Controller("users")
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  list(@Query() query: PageQueryDto) {
    return this.userService.list(query)
  }

  @Get(":id")
  detail(@Param("id") id: string) {
    return this.userService.detail(id)
  }

  @Post()
  create(@Body() body: CreateUserBodyDto) {
    return this.userService.create(body)
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() body: UpdateUserBodyDto) {
    return this.userService.update(id, body)
  }

  @Delete(":id")
  remove(@Param("id") id: string, @CurrentUser() user: DbUser) {
    return this.userService.remove(id, user)
  }
}
