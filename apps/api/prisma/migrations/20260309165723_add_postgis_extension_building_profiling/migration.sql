CREATE EXTENSION IF NOT EXISTS postgis;

-- CreateTable
CREATE TABLE "building_profiles" (
    "id" TEXT NOT NULL,
    "iso3" TEXT NOT NULL,
    "geom" geometry(Geometry, 4326) NOT NULL,
    "properties" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "building_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "building_profiles_iso3_idx" ON "building_profiles"("iso3");

-- CreateIndex
CREATE INDEX "building_profiles_geom_idx" ON "building_profiles" USING GIST ("geom");
