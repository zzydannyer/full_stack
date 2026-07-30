import { updateUserBodySchema } from "@full-stack/shared"
import { createZodDto } from "nestjs-zod"

export class UpdateUserBodyDto extends createZodDto(updateUserBodySchema) {}
