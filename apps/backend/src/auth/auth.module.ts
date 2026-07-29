import { Module } from "@nestjs/common"
import { JwtModule } from "@nestjs/jwt"
import { PassportModule } from "@nestjs/passport"
import { env } from "../config/env.js"
import { AuthSessionService } from "./auth-session.service.js"
import { AuthController } from "./auth.controller.js"
import { AuthService } from "./auth.service.js"
import { JwtStrategy } from "./jwt.strategy.js"
import { RolesGuard } from "./roles.guard.js"

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: "jwt" }),
    JwtModule.register({
      secret: env.JWT_SECRET,
      signOptions: {
        expiresIn: env.JWT_EXPIRES_SECONDS,
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthSessionService, JwtStrategy, RolesGuard],
  exports: [AuthService, AuthSessionService, JwtModule, RolesGuard],
})
export class AuthModule {}
