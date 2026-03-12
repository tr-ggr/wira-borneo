-- CreateEnum
CREATE TYPE "AssetStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "Asset" ADD COLUMN     "description" TEXT,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "photoUrl" TEXT,
ADD COLUMN     "status" "AssetStatus" NOT NULL DEFAULT 'PENDING';

-- CreateIndex
CREATE INDEX "Asset_status_idx" ON "Asset"("status");
