import { Module } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"
import { BenchmarkController } from "./benchmark.controller.js"
import { BenchmarkRepository } from "./benchmark.repository.js"
import { BenchmarkService } from "./benchmark.service.js"
import { poolProviders } from "./database/pool.providers.js"

@Module({
  imports: [ConfigModule],
  controllers: [BenchmarkController],
  providers: [BenchmarkService, BenchmarkRepository, ...poolProviders],
})
export class BenchmarkModule {}
