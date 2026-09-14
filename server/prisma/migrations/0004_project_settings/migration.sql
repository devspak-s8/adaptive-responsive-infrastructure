-- Persist the complete project settings surface.
ALTER TABLE "Project" ADD COLUMN "automaticRollback" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Project" ADD COLUMN "scanFrequency" TEXT NOT NULL DEFAULT 'continuous';
ALTER TABLE "Project" ADD COLUMN "notifyRegression" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Project" ADD COLUMN "notifyCritical" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Project" ADD COLUMN "notifyAutofix" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Project" ADD COLUMN "protectionLevel" TEXT NOT NULL DEFAULT 'safe';
