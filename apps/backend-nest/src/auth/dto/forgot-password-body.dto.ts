import { forgotPasswordBodySchema } from "@full-stack/shared"
import { createZodDto } from "nestjs-zod"

export class ForgotPasswordBodyDto extends createZodDto(forgotPasswordBodySchema) {}
