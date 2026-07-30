import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common"
import type { Request, Response } from "express"
import { tap } from "rxjs"
import { MetricsService } from "./metrics.service.js"

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler) {
    const http = context.switchToHttp()
    const request = http.getRequest<Request>()
    const response = http.getResponse<Response>()
    return next.handle().pipe(
      tap(() => {
        this.metricsService.incrementRequest(request.method, request.path, response.statusCode)
      }),
    )
  }
}
