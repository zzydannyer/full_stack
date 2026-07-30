import { performanceDatabaseDTO } from "@full-stack/shared"
import { createZodDto } from "nestjs-zod"
import { z } from "zod"

const jsonQuery = z.object({
  size: z.coerce.number().int().min(1).max(50000),
})

const computeQuery = z.object({
  iterations: z.coerce.number().int().min(1).max(50000000),
})

const readQuery = z.object({
  database: performanceDatabaseDTO,
  limit: z.coerce.number().int().min(1).max(10000),
})

const writeQuery = z.object({
  database: performanceDatabaseDTO,
  count: z.coerce.number().int().min(1).max(1000),
  runId: z.string().min(1).max(100),
})

const cleanupQuery = z.object({
  database: performanceDatabaseDTO,
})

const runIdParam = z.object({
  runId: z.string().min(1).max(100),
})

export class JsonQueryDTO extends createZodDto(jsonQuery) {}
export class ComputeQueryDTO extends createZodDto(computeQuery) {}
export class ReadQueryDTO extends createZodDto(readQuery) {}
export class WriteQueryDTO extends createZodDto(writeQuery) {}
export class CleanupQueryDTO extends createZodDto(cleanupQuery) {}
export class RunIdParamDTO extends createZodDto(runIdParam) {}
