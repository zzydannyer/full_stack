import "dotenv/config"
import { PrismaPg } from "@prisma/adapter-pg"
import { hash } from "bcryptjs"
import { PrismaClient } from "../src/generated/prisma/client.js"

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
})
const prisma = new PrismaClient({ adapter })

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
  await prisma.$disconnect()
}

main()
