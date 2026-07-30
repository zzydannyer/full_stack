import { updateProfileBodySchema } from "@full-stack/shared"
import { createZodDto } from "nestjs-zod"

export class UpdateProfileBodyDto extends createZodDto(updateProfileBodySchema) {}
