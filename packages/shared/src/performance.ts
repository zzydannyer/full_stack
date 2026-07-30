import { z } from "zod"

export const performanceDatabaseDTO = z.enum(["postgresql", "mysql"])

export const performancePingVO = z.object({
  status: z.literal("ok"),
})

export const performanceJsonItemVO = z.object({
  index: z.number().int().nonnegative(),
  name: z.string(),
  active: z.boolean(),
  score: z.number().int().nonnegative(),
})

export const performanceJsonVO = z.object({
  count: z.number().int().positive(),
  items: z.array(performanceJsonItemVO),
})

export const performanceComputeVO = z.object({
  iterations: z.number().int().positive(),
  checksum: z.number().int().nonnegative(),
})

export const performanceRecordVO = z.object({
  id: z.number().int().positive(),
  runId: z.string(),
  payload: z.string(),
  score: z.number().int().nonnegative(),
  createdAt: z.string(),
})

export const performanceReadVO = z.object({
  database: performanceDatabaseDTO,
  count: z.number().int().nonnegative(),
  items: z.array(performanceRecordVO),
})

export const performanceWriteVO = z.object({
  database: performanceDatabaseDTO,
  runId: z.string(),
  count: z.number().int().positive(),
})

export const performanceCleanupVO = z.object({
  database: performanceDatabaseDTO,
  runId: z.string(),
  deleted: z.number().int().nonnegative(),
})

export type PerformanceDatabaseDTO = z.infer<typeof performanceDatabaseDTO>
export type PerformancePingVO = z.infer<typeof performancePingVO>
export type PerformanceJsonVO = z.infer<typeof performanceJsonVO>
export type PerformanceComputeVO = z.infer<typeof performanceComputeVO>
export type PerformanceRecordVO = z.infer<typeof performanceRecordVO>
export type PerformanceReadVO = z.infer<typeof performanceReadVO>
export type PerformanceWriteVO = z.infer<typeof performanceWriteVO>
export type PerformanceCleanupVO = z.infer<typeof performanceCleanupVO>
