import { resetPasswordBodySchema } from "@full-stack/shared"
import { createZodDto } from "nestjs-zod"

export class ResetPasswordBodyDto extends createZodDto(resetPasswordBodySchema) {}
