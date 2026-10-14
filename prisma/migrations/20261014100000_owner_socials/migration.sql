ALTER TABLE "Owner" ADD COLUMN IF NOT EXISTS "facebook" TEXT;
ALTER TABLE "Owner" ADD COLUMN IF NOT EXISTS "instagram" TEXT;

UPDATE "Owner" SET "facebook" = 'https://www.facebook.com/ZaffirYasin', "instagram" = 'https://www.instagram.com/p/Dd9G0uyFJ3k/' WHERE "slug" = 'zaffir-yasin-chowdhury';
UPDATE "Owner" SET "instagram" = 'https://www.instagram.com/zainabzehrarizvi4/' WHERE "slug" = 'zainab-zehra-rizvi';
