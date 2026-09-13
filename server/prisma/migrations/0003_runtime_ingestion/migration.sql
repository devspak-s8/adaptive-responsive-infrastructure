-- Runtime SDK identity and telemetry storage.
ALTER TABLE "Project" ADD COLUMN "runtimeKey" TEXT;
ALTER TABLE "Project" ADD COLUMN "lastHeartbeatAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "Project_runtimeKey_key" ON "Project"("runtimeKey");

CREATE TABLE "RuntimeSession" (
    "projectId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RuntimeSession_pkey" PRIMARY KEY ("projectId", "sessionId")
);

CREATE TABLE "RuntimeEvent" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "path" TEXT,
    "viewportWidth" INTEGER,
    "viewportHeight" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RuntimeEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "RuntimeSession_projectId_lastSeenAt_idx" ON "RuntimeSession"("projectId", "lastSeenAt");
CREATE INDEX "RuntimeEvent_projectId_createdAt_idx" ON "RuntimeEvent"("projectId", "createdAt");

ALTER TABLE "RuntimeSession" ADD CONSTRAINT "RuntimeSession_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RuntimeEvent" ADD CONSTRAINT "RuntimeEvent_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
