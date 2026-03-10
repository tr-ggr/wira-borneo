-- CreateEnum
CREATE TYPE "AgeGroup" AS ENUM ('UNDER_12', 'AGE_12_17', 'AGE_18_59', 'AGE_60_PLUS');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "ageGroup" "AgeGroup",
ADD COLUMN     "isPWD" BOOLEAN,
ADD COLUMN     "pregnantStatus" BOOLEAN;
