import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common"
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger"
import { okResponse } from "@full-stack/shared"
import type { Request, Response } from "express"
import { isString } from "lodash-es"
import type { User as DbUser } from "../generated/prisma/client.js"
import { AuthService } from "./auth.service.js"
import { CurrentUser } from "./current-user.decorator.js"
import { ChangePasswordBodyDto } from "./dto/change-password-body.dto.js"
import { ForgotPasswordBodyDto } from "./dto/forgot-password-body.dto.js"
import { LoginBodyDto } from "./dto/login-body.dto.js"
import { RegisterBodyDto } from "./dto/register-body.dto.js"
import { ResetPasswordBodyDto } from "./dto/reset-password-body.dto.js"
import { UpdateProfileBodyDto } from "./dto/update-profile-body.dto.js"
import { JwtAuthGuard } from "./jwt-auth.guard.js"
import { clearRefreshCookie, refreshCookieName, setRefreshCookie } from "./refresh-cookie.js"

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  async register(
    @Body() body: RegisterBodyDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.register(body)
    setRefreshCookie(response, result.refreshToken)
    return result.body
  }

  @Post("login")
  async login(@Body() body: LoginBodyDto, @Res({ passthrough: true }) response: Response) {
    const result = await this.authService.login(body)
    setRefreshCookie(response, result.refreshToken)
    return result.body
  }

  @Post("refresh")
  async refresh(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const refreshToken = request.cookies?.[refreshCookieName]
    if (!isString(refreshToken) || refreshToken.length === 0) {
      throw new UnauthorizedException("invalid refresh token")
    }
    const result = await this.authService.refresh(refreshToken)
    setRefreshCookie(response, result.refreshToken)
    return result.body
  }

  @Post("logout")
  async logout(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const refreshToken = request.cookies?.[refreshCookieName]
    if (isString(refreshToken) && refreshToken.length > 0) {
      await this.authService.logout(refreshToken)
    }
    clearRefreshCookie(response)
    return okResponse({})
  }

  @Post("forgot-password")
  forgotPassword(@Body() body: ForgotPasswordBodyDto) {
    return this.authService.forgotPassword(body)
  }

  @Post("reset-password")
  resetPassword(@Body() body: ResetPasswordBodyDto) {
    return this.authService.resetPassword(body)
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get("me")
  me(@CurrentUser() user: DbUser) {
    return this.authService.me(user)
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch("me")
  updateProfile(@CurrentUser() user: DbUser, @Body() body: UpdateProfileBodyDto) {
    return this.authService.updateProfile(user, body)
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post("change-password")
  changePassword(@CurrentUser() user: DbUser, @Body() body: ChangePasswordBodyDto) {
    return this.authService.changePassword(user, body)
  }
}
