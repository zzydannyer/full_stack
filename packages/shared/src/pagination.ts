import { z } from "zod"

export const pageLimit = {
  pageMin: 1,
  pageSizeMin: 1,
  pageSizeMax: 100,
  pageDefault: 1,
  pageSizeDefault: 20,
} as const

export const pageQuerySchema = z.object({
  page: z.coerce.number().int().min(pageLimit.pageMin).default(pageLimit.pageDefault),
  pageSize: z.coerce
    .number()
    .int()
    .min(pageLimit.pageSizeMin)
    .max(pageLimit.pageSizeMax)
    .default(pageLimit.pageSizeDefault),
})

export type PageQuery = z.infer<typeof pageQuerySchema>

export const pageResultSchema = <T extends z.ZodType>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    total: z.number().int().nonnegative(),
    page: z.number().int().min(pageLimit.pageMin),
    pageSize: z.number().int().min(pageLimit.pageSizeMin),
  })

export type PageResult<T> = {
  items: T[]
  total: number
  page: number
  pageSize: number
}
