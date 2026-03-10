-- CreateEnum
CREATE TYPE "PinReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- DropIndex
DROP INDEX "building_profiles_geom_idx";

-- AlterTable
ALTER TABLE "MapPinStatus" ADD COLUMN     "photoKey" TEXT,
ADD COLUMN     "photoUrl" TEXT,
ADD COLUMN     "reviewNote" TEXT,
ADD COLUMN     "reviewStatus" "PinReviewStatus",
ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "reviewedById" TEXT;

-- AddForeignKey
ALTER TABLE "MapPinStatus" ADD CONSTRAINT "MapPinStatus_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
