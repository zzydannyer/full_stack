import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from "@nestjs/common"
import { ErrorCode, failResponse } from "@full-stack/shared"
import type { Response } from "express"
import { isError, isObject, isString } from "lodash-es"
import { ZodValidationException } from "nestjs-zod"

@Catch()
export class AllExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException | Error, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>()

    if (exception instanceof ZodValidationException) {
      response
        .status(HttpStatus.BAD_REQUEST)
        .json(failResponse(ErrorCode.validation, exception.message, exception.getResponse()))
      return
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus()
      const body = exception.getResponse()
      response
        .status(status)
        .json(
          failResponse(this.toErrorCode(status), this.readMessage(body, exception.message), body),
        )
      return
    }

    const message = isError(exception) ? exception.message : "internal error"
    response
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .json(failResponse(ErrorCode.internal, message, {}))
  }

  private readMessage(body: string | object, fallback: string) {
    if (isString(body)) return body
    if (isObject(body) && "message" in body && isString(body.message)) {
      return body.message
    }
    return fallback
  }

  private toErrorCode(status: number) {
    if (status === HttpStatus.UNAUTHORIZED) return ErrorCode.unauthorized
    if (status === HttpStatus.FORBIDDEN) return ErrorCode.forbidden
    if (status === HttpStatus.NOT_FOUND) return ErrorCode.notFound
    if (status === HttpStatus.CONFLICT) return ErrorCode.conflict
    if (status === HttpStatus.TOO_MANY_REQUESTS) return ErrorCode.tooManyRequests
    if (status === HttpStatus.BAD_REQUEST) return ErrorCode.validation
    return ErrorCode.internal
  }
}
