/*
  Warnings:

  - Added the required column `action` to the `WarningEventLog` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "WarningEventLog" ADD COLUMN     "action" TEXT NOT NULL;
