import type {
  PerformanceCleanupVO,
  PerformanceDatabaseDTO,
  PerformanceReadVO,
  PerformanceRecordVO,
  PerformanceWriteVO,
} from "@full-stack/shared"
import { Inject, Injectable } from "@nestjs/common"
import type { Pool as MysqlPool, ResultSetHeader, RowDataPacket } from "mysql2/promise"
import type { Pool as PostgresqlPool, QueryResultRow } from "pg"
import { MYSQL_BENCHMARK_POOL, POSTGRESQL_BENCHMARK_POOL } from "./database/pool.tokens.js"

interface PostgresqlBenchmarkRow extends QueryResultRow {
  id: number
  run_id: string
  payload: string
  score: number
  created_at: Date
}

interface MysqlBenchmarkRow extends RowDataPacket {
  id: number
  run_id: string
  payload: string
  score: number
  created_at: Date
}

@Injectable()
export class BenchmarkRepository {
  constructor(
    @Inject(POSTGRESQL_BENCHMARK_POOL)
    private readonly postgresqlPool: PostgresqlPool,
    @Inject(MYSQL_BENCHMARK_POOL)
    private readonly mysqlPool: MysqlPool,
  ) {}

  async read(database: PerformanceDatabaseDTO, limit: number): Promise<PerformanceReadVO> {
    if (database === "postgresql") {
      const result = await this.postgresqlPool.query<PostgresqlBenchmarkRow>(
        `SELECT id::integer AS id, run_id, payload, score, created_at
         FROM benchmark_record
         WHERE run_id = 'seed'
         ORDER BY id
         LIMIT $1`,
        [limit],
      )
      return this.readResult(database, result.rows)
    }

    const [rows] = await this.mysqlPool.execute<MysqlBenchmarkRow[]>(
      `SELECT CAST(id AS SIGNED) AS id, run_id, payload, score, created_at
       FROM benchmark_record
       WHERE run_id = 'seed'
       ORDER BY id
       LIMIT ?`,
      [limit],
    )
    return this.readResult(database, rows)
  }

  async write(
    database: PerformanceDatabaseDTO,
    count: number,
    runId: string,
  ): Promise<PerformanceWriteVO> {
    if (database === "postgresql") {
      await this.writePostgresql(count, runId)
      return { database, runId, count }
    }

    await this.writeMysql(count, runId)
    return { database, runId, count }
  }

  async cleanup(database: PerformanceDatabaseDTO, runId: string): Promise<PerformanceCleanupVO> {
    if (database === "postgresql") {
      const result = await this.postgresqlPool.query<{ id: number }>(
        "DELETE FROM benchmark_record WHERE run_id = $1 RETURNING id",
        [runId],
      )
      return { database, runId, deleted: result.rows.length }
    }

    const [result] = await this.mysqlPool.execute<ResultSetHeader>(
      "DELETE FROM benchmark_record WHERE run_id = ?",
      [runId],
    )
    return { database, runId, deleted: result.affectedRows }
  }

  async onModuleDestroy() {
    await Promise.all([this.postgresqlPool.end(), this.mysqlPool.end()])
  }

  private readResult(
    database: PerformanceDatabaseDTO,
    rows: PostgresqlBenchmarkRow[] | MysqlBenchmarkRow[],
  ): PerformanceReadVO {
    return {
      database,
      count: rows.length,
      items: rows.map(
        (row): PerformanceRecordVO => ({
          id: row.id,
          runId: row.run_id,
          payload: row.payload,
          score: row.score,
          createdAt: row.created_at.toISOString(),
        }),
      ),
    }
  }

  private async writePostgresql(count: number, runId: string) {
    const client = await this.postgresqlPool.connect()
    await client.query("BEGIN")
    for (let index = 0; index < count; index += 1) {
      await client.query({
        name: "insert-benchmark-record",
        text: "INSERT INTO benchmark_record (run_id, payload, score) VALUES ($1, $2, $3)",
        values: [runId, `benchmark-${index}`, index % 1000],
      })
    }
    await client.query("COMMIT")
    client.release()
  }

  private async writeMysql(count: number, runId: string) {
    const connection = await this.mysqlPool.getConnection()
    await connection.beginTransaction()
    for (let index = 0; index < count; index += 1) {
      await connection.execute(
        "INSERT INTO benchmark_record (run_id, payload, score) VALUES (?, ?, ?)",
        [runId, `benchmark-${index}`, index % 1000],
      )
    }
    await connection.commit()
    connection.release()
  }
}
