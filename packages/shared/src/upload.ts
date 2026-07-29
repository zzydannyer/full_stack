import { z } from "zod"

export const uploadResultSchema = z.object({
  url: z.string().min(1),
  filename: z.string().min(1),
  size: z.number().int().nonnegative(),
  mimeType: z.string().min(1),
})

export type UploadResult = z.infer<typeof uploadResultSchema>
