import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common"
import { FileInterceptor } from "@nestjs/platform-express"
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from "@nestjs/swagger"
import type { Response } from "express"
import { createReadStream } from "node:fs"
import { join } from "node:path"
import { isUndefined } from "lodash-es"
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js"
import { env } from "../config/env.js"
import { UploadService } from "./upload.service.js"

@ApiTags("uploads")
@Controller("uploads")
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        file: { type: "string", format: "binary" },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor("file", {
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  upload(@UploadedFile() file: Express.Multer.File) {
    if (isUndefined(file)) {
      throw new BadRequestException("file required")
    }
    return this.uploadService.save(file)
  }

  @Get("files/:filename")
  file(@Param("filename") filename: string, @Res() response: Response) {
    if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
      throw new BadRequestException("invalid filename")
    }
    const stream = createReadStream(join(env.UPLOAD_DIR, filename))
    stream.pipe(response)
  }
}
