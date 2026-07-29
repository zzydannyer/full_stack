import { createUserBodySchema } from "@full-stack/shared"
import { createZodDto } from "nestjs-zod"

export class CreateUserBodyDto extends createZodDto(createUserBodySchema) {}
