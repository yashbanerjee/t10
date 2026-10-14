CREATE TABLE IF NOT EXISTS "Owner" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "headline" TEXT,
    "summary" TEXT,
    "bio" TEXT,
    "quote" TEXT,
    "image" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Owner_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Owner_slug_key" ON "Owner"("slug");
CREATE INDEX IF NOT EXISTS "Owner_isActive_displayOrder_idx" ON "Owner"("isActive", "displayOrder");

INSERT INTO "Owner" ("id", "name", "slug", "title", "displayOrder", "updatedAt") VALUES
    ('owner_zainab', 'Zainab Zehra Rizvi', 'zainab-zehra-rizvi', 'Co-owner', 1, CURRENT_TIMESTAMP),
    ('owner_zaffir', 'Zaffir Yasin Chowdhury', 'zaffir-yasin-chowdhury', 'Co-owner', 2, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
