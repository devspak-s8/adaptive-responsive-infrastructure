ALTER TABLE "Project"
  ADD COLUMN "creationIdempotencyKey" TEXT;

CREATE UNIQUE INDEX "Project_creationIdempotencyKey_key"
  ON "Project"("creationIdempotencyKey");
