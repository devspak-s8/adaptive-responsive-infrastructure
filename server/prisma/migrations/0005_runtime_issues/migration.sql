CREATE TABLE "ResponsiveIssueRecord" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "sessionId" TEXT,
    "title" TEXT NOT NULL,
    "route" TEXT,
    "element" TEXT,
    "category" TEXT NOT NULL DEFAULT 'overflow',
    "severity" TEXT NOT NULL DEFAULT 'Medium',
    "status" TEXT NOT NULL DEFAULT 'Open',
    "viewportWidth" INTEGER,
    "viewportHeight" INTEGER,
    "availableWidth" INTEGER,
    "cause" TEXT,
    "currentCss" TEXT,
    "recommendedFix" TEXT,
    "occurrenceCount" INTEGER NOT NULL DEFAULT 1,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB,
    CONSTRAINT "ResponsiveIssueRecord_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RuntimeAdaptation" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "issueId" TEXT,
    "sessionId" TEXT,
    "route" TEXT,
    "viewportWidth" INTEGER,
    "viewportHeight" INTEGER,
    "element" TEXT,
    "strategy" TEXT NOT NULL,
    "css" JSONB,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "rolledBack" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RuntimeAdaptation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ResponsiveIssueRecord_projectId_fingerprint_key" ON "ResponsiveIssueRecord"("projectId", "fingerprint");
CREATE INDEX "ResponsiveIssueRecord_projectId_status_lastSeenAt_idx" ON "ResponsiveIssueRecord"("projectId", "status", "lastSeenAt");
CREATE INDEX "RuntimeAdaptation_projectId_createdAt_idx" ON "RuntimeAdaptation"("projectId", "createdAt");
CREATE INDEX "RuntimeAdaptation_issueId_createdAt_idx" ON "RuntimeAdaptation"("issueId", "createdAt");

ALTER TABLE "ResponsiveIssueRecord" ADD CONSTRAINT "ResponsiveIssueRecord_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RuntimeAdaptation" ADD CONSTRAINT "RuntimeAdaptation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RuntimeAdaptation" ADD CONSTRAINT "RuntimeAdaptation_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "ResponsiveIssueRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;
