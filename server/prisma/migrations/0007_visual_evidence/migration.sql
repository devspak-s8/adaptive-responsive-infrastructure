ALTER TABLE "ResponsiveIssueRecord"
  ADD COLUMN "beforeVisualSnapshot" TEXT,
  ADD COLUMN "afterVisualSnapshot" TEXT,
  ADD COLUMN "affectedViewports" JSONB;

ALTER TABLE "RuntimeAdaptation"
  ADD COLUMN "beforeVisualSnapshot" TEXT,
  ADD COLUMN "afterVisualSnapshot" TEXT,
  ADD COLUMN "beforeQuality" INTEGER,
  ADD COLUMN "afterQuality" INTEGER;
