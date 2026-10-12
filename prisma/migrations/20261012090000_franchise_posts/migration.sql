CREATE TABLE IF NOT EXISTS "FranchisePost" (
    "id" TEXT NOT NULL,
    "franchiseId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "imageUrl" TEXT,
    "caption" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FranchisePost_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "FranchisePost_franchiseId_fkey" FOREIGN KEY ("franchiseId") REFERENCES "Franchise"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "FranchisePost_franchiseId_url_key" ON "FranchisePost"("franchiseId", "url");
CREATE INDEX IF NOT EXISTS "FranchisePost_franchiseId_displayOrder_idx" ON "FranchisePost"("franchiseId", "displayOrder");
