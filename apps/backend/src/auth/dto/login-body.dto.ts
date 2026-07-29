import { loginBodySchema } from "@full-stack/shared"
import { createZodDto } from "nestjs-zod"

export class LoginBodyDto extends createZodDto(loginBodySchema) {}
