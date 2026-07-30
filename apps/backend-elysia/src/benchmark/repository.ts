import { isString } from "lodash-es"
import { selectDatabase } from "../database/clients"
import type { DatabaseName } from "./dto"

type BenchmarkRow = {
  id: number | string
  run_id: string
  payload: string
  score: number
  created_at: Date
}

type BenchmarkIdRow = {
  id: number
}

export async function readBenchmark(databaseName: DatabaseName, limit: number) {
  const database = selectDatabase(databaseName)
  const rows = await database<BenchmarkRow[]>`
    SELECT id, run_id, payload, score, created_at
    FROM benchmark_record
    WHERE run_id = ${"seed"}
    ORDER BY id
    LIMIT ${limit}
  `
  const items = rows.map((row) => ({
    id: isString(row.id) ? parseInt(row.id, 10) : row.id,
    runId: row.run_id,
    payload: row.payload,
    score: row.score,
    createdAt: row.created_at.toISOString(),
  }))
  return {
    database: databaseName,
    count: items.length,
    items,
  }
}

export async function writeBenchmark(databaseName: DatabaseName, count: number, runId: string) {
  const database = selectDatabase(databaseName)
  await database.begin(async (transaction) => {
    for (let index = 0; index < count; index += 1) {
      await transaction`
        INSERT INTO benchmark_record (run_id, payload, score)
        VALUES (${runId}, ${`benchmark-${index}`}, ${index % 1000})
      `
    }
  })
  return {
    database: databaseName,
    runId,
    count,
  }
}

export async function deleteBenchmark(databaseName: DatabaseName, runId: string) {
  const database = selectDatabase(databaseName)
  const deleted = await database.begin(async (transaction) => {
    const rows = await transaction<BenchmarkIdRow[]>`
      SELECT id
      FROM benchmark_record
      WHERE run_id = ${runId}
    `
    await transaction`
      DELETE FROM benchmark_record
      WHERE run_id = ${runId}
    `
    return rows.length
  })
  return {
    database: databaseName,
    runId,
    deleted,
  }
}
