/*
  Warnings:

  - You are about to drop the column `demographics` on the `User` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "HousingType" AS ENUM ('LONGHOUSE', 'DETACHED', 'SEMI_DETACHED', 'TERRACE', 'APARTMENT', 'OTHER');

-- AlterTable
ALTER TABLE "User" DROP COLUMN "demographics",
ADD COLUMN     "age" INTEGER,
ADD COLUMN     "assets" JSONB,
ADD COLUMN     "assistiveDevices" TEXT,
ADD COLUMN     "disabilities" TEXT,
ADD COLUMN     "emergencySkills" JSONB,
ADD COLUMN     "householdComposition" JSONB,
ADD COLUMN     "housingType" "HousingType",
ADD COLUMN     "language" TEXT;
