/*
  Warnings:

  - You are about to drop the column `householdDemographics` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `medicalNeeds` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `mobilityStatus` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "householdDemographics",
DROP COLUMN "medicalNeeds",
DROP COLUMN "mobilityStatus",
ADD COLUMN     "demographics" JSONB;
