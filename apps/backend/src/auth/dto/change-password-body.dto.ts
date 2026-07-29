import { changePasswordBodySchema } from "@full-stack/shared"
import { createZodDto } from "nestjs-zod"

export class ChangePasswordBodyDto extends createZodDto(changePasswordBodySchema) {}
