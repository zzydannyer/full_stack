import { mkdir, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { randomBytes } from "node:crypto"
import { Injectable } from "@nestjs/common"
import type { UploadResult } from "@full-stack/shared"
import { okResponse } from "@full-stack/shared"
import { env } from "../config/env.js"

@Injectable()
export class UploadService {
  async save(file: Express.Multer.File) {
    await mkdir(env.UPLOAD_DIR, { recursive: true })
    const ext = file.originalname.includes(".")
      ? file.originalname.slice(file.originalname.lastIndexOf("."))
      : ""
    const filename = `${Date.now()}_${randomBytes(8).toString("hex")}${ext}`
    const filepath = join(env.UPLOAD_DIR, filename)
    await writeFile(filepath, file.buffer)
    const data: UploadResult = {
      url: `/api/uploads/files/${filename}`,
      filename,
      size: file.size,
      mimeType: file.mimetype,
    }
    return okResponse(data)
  }
}
