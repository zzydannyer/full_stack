-- CreateTable
CREATE TABLE "benchmark_record" (
    "id" BIGSERIAL NOT NULL,
    "run_id" VARCHAR(100) NOT NULL,
    "payload" VARCHAR(255) NOT NULL,
    "score" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "benchmark_record_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "benchmark_record_run_id_idx" ON "benchmark_record"("run_id");
