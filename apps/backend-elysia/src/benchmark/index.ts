import { Elysia } from "elysia"
import { okResponse } from "../common/response"
import {
  ComputeQueryDto,
  DatabaseDeleteQueryDto,
  DatabaseReadQueryDto,
  DatabaseWriteParamsDto,
  DatabaseWriteQueryDto,
  JsonQueryDto,
} from "./dto"
import { deleteBenchmark, readBenchmark, writeBenchmark } from "./repository"
import { createComputeResult, createJsonResult } from "./service"

export const benchmark = new Elysia({ prefix: "/api/benchmark" })
  .get("/ping", () => okResponse({ status: "ok" }))
  .get("/json", ({ query }) => okResponse(createJsonResult(query.size)), {
    query: JsonQueryDto,
  })
  .get("/compute", ({ query }) => okResponse(createComputeResult(query.iterations)), {
    query: ComputeQueryDto,
  })
  .get(
    "/database/read",
    async ({ query }) => okResponse(await readBenchmark(query.database, query.limit)),
    {
      query: DatabaseReadQueryDto,
    },
  )
  .post(
    "/database/write",
    async ({ query }) => okResponse(await writeBenchmark(query.database, query.count, query.runId)),
    {
      query: DatabaseWriteQueryDto,
    },
  )
  .delete(
    "/database/write/:runId",
    async ({ params, query }) => okResponse(await deleteBenchmark(query.database, params.runId)),
    {
      params: DatabaseWriteParamsDto,
      query: DatabaseDeleteQueryDto,
    },
  )
