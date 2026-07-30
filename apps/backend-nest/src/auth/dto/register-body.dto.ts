import { registerBodySchema } from "@full-stack/shared"
import { createZodDto } from "nestjs-zod"

export class RegisterBodyDto extends createZodDto(registerBodySchema) {}
