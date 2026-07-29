import { Injectable } from "@nestjs/common"
import { PrismaService } from "../prisma/prisma.service.js"

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async write(action: string, userId = "", detail = "") {
    if (userId.length > 0) {
      await this.prisma.auditLog.create({
        data: { action, userId, detail },
      })
      return
    }
    await this.prisma.auditLog.create({
      data: { action, detail },
    })
  }
}
