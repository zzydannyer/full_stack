import "dotenv/config"
import { PrismaPg } from "@prisma/adapter-pg"
import { hash } from "bcryptjs"
import { createPool } from "mysql2/promise"
import { z } from "zod"
import { PrismaClient } from "../src/generated/prisma/client.js"

const postgresqlUrl = z.string().min(1).parse(process.env.POSTGRESQL_URL)
const mysqlUrl = z.string().min(1).parse(process.env.MYSQL_URL)
const adapter = new PrismaPg({
  connectionString: postgresqlUrl,
})
const prisma = new PrismaClient({ adapter })
const mysqlPool = createPool(mysqlUrl)

async function main() {
  const passwordHash = await hash("888888", 10)
  await prisma.user.upsert({
    where: { username: "admin" },
    update: {
      passwordHash,
      role: "admin",
      name: "admin",
      email: "admin@example.com",
    },
    create: {
      username: "admin",
      email: "admin@example.com",
      name: "admin",
      passwordHash,
      role: "admin",
    },
  })
  const records = Array.from({ length: 10000 }, (_, index) => ({
    runId: "seed",
    payload: `benchmark-${index}`,
    score: index % 1000,
  }))
  await prisma.$transaction([
    prisma.benchmarkRecord.deleteMany({
      where: { runId: "seed" },
    }),
    prisma.benchmarkRecord.createMany({
      data: records,
    }),
  ])

  await mysqlPool.execute(`
    CREATE TABLE IF NOT EXISTS benchmark_record (
      id BIGINT NOT NULL AUTO_INCREMENT,
      run_id VARCHAR(100) NOT NULL,
      payload VARCHAR(255) NOT NULL,
      score INT NOT NULL,
      created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      PRIMARY KEY (id),
      INDEX benchmark_record_run_id_idx (run_id)
    )
  `)
  const connection = await mysqlPool.getConnection()
  await connection.beginTransaction()
  await connection.execute("DELETE FROM benchmark_record WHERE run_id = ?", ["seed"])
  for (const record of records) {
    await connection.execute(
      "INSERT INTO benchmark_record (run_id, payload, score) VALUES (?, ?, ?)",
      [record.runId, record.payload, record.score],
    )
  }
  await connection.commit()
  connection.release()
  await mysqlPool.end()
  await prisma.$disconnect()
}

main()
