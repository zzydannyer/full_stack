import { pageQuerySchema } from "@full-stack/shared"
import { createZodDto } from "nestjs-zod"

export class PageQueryDto extends createZodDto(pageQuerySchema) {}
