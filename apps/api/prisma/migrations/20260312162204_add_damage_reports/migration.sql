-- CreateEnum
CREATE TYPE "DamageCategory" AS ENUM ('FLOODED_ROAD', 'COLLAPSED_STRUCTURE', 'DAMAGED_INFRASTRUCTURE');

-- CreateEnum
CREATE TYPE "DamageReportReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "DamageReport" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "damageCategories" "DamageCategory"[],
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "photoUrl" TEXT NOT NULL,
    "photoKey" TEXT NOT NULL,
    "confidenceScore" DOUBLE PRECISION NOT NULL,
    "confidenceThreshold" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "reporterId" TEXT NOT NULL,
    "reviewedById" TEXT,
    "reviewStatus" "DamageReportReviewStatus" NOT NULL DEFAULT 'PENDING',
    "reviewNote" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DamageReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DamageReport_reviewStatus_createdAt_idx" ON "DamageReport"("reviewStatus", "createdAt");

-- CreateIndex
CREATE INDEX "DamageReport_reporterId_createdAt_idx" ON "DamageReport"("reporterId", "createdAt");

-- AddForeignKey
ALTER TABLE "DamageReport" ADD CONSTRAINT "DamageReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DamageReport" ADD CONSTRAINT "DamageReport_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
