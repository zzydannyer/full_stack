import type {
  PerformanceCleanupVO,
  PerformanceComputeVO,
  PerformanceJsonVO,
  PerformancePingVO,
  PerformanceReadVO,
  PerformanceWriteVO,
} from "@full-stack/shared"
import { Controller, Delete, Get, HttpCode, Param, Post, Query } from "@nestjs/common"
import { ApiTags } from "@nestjs/swagger"
import { SkipThrottle } from "@nestjs/throttler"
import { BenchmarkService } from "./benchmark.service.js"
import {
  CleanupQueryDTO,
  ComputeQueryDTO,
  JsonQueryDTO,
  ReadQueryDTO,
  RunIdParamDTO,
  WriteQueryDTO,
} from "./dto/benchmark-query.dto.js"

@ApiTags("benchmark")
@SkipThrottle()
@Controller("benchmark")
export class BenchmarkController {
  constructor(private readonly benchmarkService: BenchmarkService) {}

  @Get("ping")
  ping(): PerformancePingVO {
    return this.benchmarkService.ping()
  }

  @Get("json")
  json(@Query() query: JsonQueryDTO): PerformanceJsonVO {
    return this.benchmarkService.json(query)
  }

  @Get("compute")
  compute(@Query() query: ComputeQueryDTO): PerformanceComputeVO {
    return this.benchmarkService.compute(query)
  }

  @Get("database/read")
  read(@Query() query: ReadQueryDTO): Promise<PerformanceReadVO> {
    return this.benchmarkService.read(query)
  }

  @Post("database/write")
  @HttpCode(200)
  write(@Query() query: WriteQueryDTO): Promise<PerformanceWriteVO> {
    return this.benchmarkService.write(query)
  }

  @Delete("database/write/:runId")
  cleanup(
    @Param() param: RunIdParamDTO,
    @Query() query: CleanupQueryDTO,
  ): Promise<PerformanceCleanupVO> {
    return this.benchmarkService.cleanup(query, param)
  }
}
