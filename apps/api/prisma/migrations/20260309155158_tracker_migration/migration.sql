-- CreateEnum
CREATE TYPE "ShipmentStatus" AS ENUM ('DISPATCHED', 'IN_TRANSIT', 'DELIVERED');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('VERIFIED', 'PENDING', 'FAILED');

-- CreateEnum
CREATE TYPE "ZoneStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "ValidatorStatus" AS ENUM ('ONLINE', 'OFFLINE', 'DEGRADED');

-- CreateTable
CREATE TABLE "tracker_shipments" (
    "id" TEXT NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "origin" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "class" TEXT NOT NULL,
    "blockchainHash" TEXT,
    "status" "ShipmentStatus" NOT NULL DEFAULT 'DISPATCHED',
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tracker_shipments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tracker_stats" (
    "id" TEXT NOT NULL,
    "totalAidDisbursed" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "verifiedPayouts" INTEGER NOT NULL DEFAULT 0,
    "networkTrustIndex" DOUBLE PRECISION NOT NULL DEFAULT 99.98,
    "lastUpdated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tracker_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tracker_relief_zones" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "familyCount" INTEGER NOT NULL DEFAULT 0,
    "status" "ZoneStatus" NOT NULL DEFAULT 'ACTIVE',
    "zoneType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tracker_relief_zones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tracker_validators" (
    "id" TEXT NOT NULL,
    "nodeId" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "latencyMs" INTEGER NOT NULL DEFAULT 0,
    "uptimePercentage" DOUBLE PRECISION NOT NULL DEFAULT 99.0,
    "status" "ValidatorStatus" NOT NULL DEFAULT 'ONLINE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tracker_validators_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tracker_shipments_shipmentId_key" ON "tracker_shipments"("shipmentId");

-- CreateIndex
CREATE UNIQUE INDEX "tracker_validators_nodeId_key" ON "tracker_validators"("nodeId");
