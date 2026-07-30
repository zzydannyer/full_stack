import type {
  PerformanceCleanupVO,
  PerformanceComputeVO,
  PerformanceJsonVO,
  PerformancePingVO,
  PerformanceReadVO,
  PerformanceWriteVO,
} from "@full-stack/shared"
import { Injectable } from "@nestjs/common"
import { BenchmarkRepository } from "./benchmark.repository.js"
import type {
  CleanupQueryDTO,
  ComputeQueryDTO,
  JsonQueryDTO,
  ReadQueryDTO,
  RunIdParamDTO,
  WriteQueryDTO,
} from "./dto/benchmark-query.dto.js"

@Injectable()
export class BenchmarkService {
  constructor(private readonly benchmarkRepository: BenchmarkRepository) {}

  ping(): PerformancePingVO {
    return { status: "ok" }
  }

  json(query: JsonQueryDTO): PerformanceJsonVO {
    const items = Array.from({ length: query.size }, (_, index) => ({
      index,
      name: `record-${index}`,
      active: index % 2 === 0,
      score: (index * 17) % 1000,
    }))
    return { count: query.size, items }
  }

  compute(query: ComputeQueryDTO): PerformanceComputeVO {
    let checksum = 0
    for (let index = 0; index < query.iterations; index += 1) {
      checksum = (checksum * 1664525 + 1013904223) % 4294967296
    }
    return { iterations: query.iterations, checksum }
  }

  read(query: ReadQueryDTO): Promise<PerformanceReadVO> {
    return this.benchmarkRepository.read(query.database, query.limit)
  }

  write(query: WriteQueryDTO): Promise<PerformanceWriteVO> {
    return this.benchmarkRepository.write(query.database, query.count, query.runId)
  }

  cleanup(query: CleanupQueryDTO, param: RunIdParamDTO): Promise<PerformanceCleanupVO> {
    return this.benchmarkRepository.cleanup(query.database, param.runId)
  }
}
