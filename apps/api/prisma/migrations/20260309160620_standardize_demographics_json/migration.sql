/*
  Warnings:

  - You are about to drop the column `assistiveDevices` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `disabilities` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `language` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "assistiveDevices",
DROP COLUMN "disabilities",
DROP COLUMN "language",
ADD COLUMN     "personalInfo" JSONB,
ADD COLUMN     "vulnerabilities" JSONB;
