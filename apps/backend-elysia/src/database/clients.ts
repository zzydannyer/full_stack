import { SQL } from "bun"
import { mysqlUrl, postgresqlUrl } from "../config/env"
import type { DatabaseName } from "../benchmark/dto"

const postgresql = new SQL(postgresqlUrl)
const mysql = new SQL(mysqlUrl)

export function selectDatabase(database: DatabaseName) {
  return database === "postgresql" ? postgresql : mysql
}
