import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common"
import { okResponse } from "@full-stack/shared"
import { isObject, isUndefined } from "lodash-es"
import { map } from "rxjs"

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler) {
    return next.handle().pipe(
      map((payload) => {
        if (
          isObject(payload) &&
          !isUndefined((payload as { code: number }).code) &&
          !isUndefined((payload as { message: string }).message) &&
          !isUndefined((payload as { data: object }).data)
        ) {
          return payload
        }
        return okResponse(payload)
      }),
    )
  }
}
