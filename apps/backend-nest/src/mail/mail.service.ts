import { Injectable, Logger } from "@nestjs/common"
import { createTransport } from "nodemailer"
import { env } from "../config/env.js"

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name)

  async sendPasswordReset(email: string, link: string) {
    if (env.SMTP_HOST.length > 0) {
      const transport =
        env.SMTP_USER.length > 0
          ? createTransport({
              host: env.SMTP_HOST,
              port: env.SMTP_PORT,
              auth: {
                user: env.SMTP_USER,
                pass: env.SMTP_PASS,
              },
            })
          : createTransport({
              host: env.SMTP_HOST,
              port: env.SMTP_PORT,
            })
      await transport.sendMail({
        from: env.SMTP_FROM.length > 0 ? env.SMTP_FROM : env.SMTP_USER,
        to: email,
        subject: "Password reset",
        text: `Reset your password: ${link}`,
      })
      return
    }

    if (env.NODE_ENV === "development") {
      this.logger.log(`password reset link: ${link}`)
    }
  }
}
