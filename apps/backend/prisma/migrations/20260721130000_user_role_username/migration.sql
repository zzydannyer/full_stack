-- CreateEnum
CREATE TYPE "Role" AS ENUM ('user', 'admin');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "role" "Role" NOT NULL DEFAULT 'user';
ALTER TABLE "User" ADD COLUMN "username" TEXT;

-- Backfill is expected to be handled before NOT NULL in real environments.
UPDATE "User" SET "username" = split_part("email", '@', 1) WHERE "username" IS NULL;

ALTER TABLE "User" ALTER COLUMN "username" SET NOT NULL;
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
