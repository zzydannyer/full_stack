function requiredEnv(name: string) {
  const value = Bun.env[name]
  if (!value) throw new Error(`${name} is required`)
  return value
}

export const postgresqlUrl = requiredEnv("POSTGRESQL_URL")
export const mysqlUrl = requiredEnv("MYSQL_URL")
export const frontendOrigin = requiredEnv("FRONTEND_ORIGIN")
export const port = requiredEnv("PORT")
