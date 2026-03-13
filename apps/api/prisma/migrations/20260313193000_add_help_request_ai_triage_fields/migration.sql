ALTER TABLE "HelpRequest"
ADD COLUMN "predictedUrgency" "HelpUrgency",
ADD COLUMN "urgencyConfidence" DOUBLE PRECISION;
