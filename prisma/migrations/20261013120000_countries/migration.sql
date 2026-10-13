CREATE TABLE IF NOT EXISTS "Country" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isoCode" TEXT,
    "dialCode" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Country_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Country_name_key" ON "Country"("name");
CREATE INDEX IF NOT EXISTS "Country_isActive_displayOrder_idx" ON "Country"("isActive", "displayOrder");

INSERT INTO "Country" ("id", "name", "isoCode", "dialCode", "displayOrder", "updatedAt") VALUES
    ('country_ae', 'United Arab Emirates', 'AE', '+971', 1, CURRENT_TIMESTAMP),
    ('country_sa', 'Saudi Arabia', 'SA', '+966', 2, CURRENT_TIMESTAMP),
    ('country_qa', 'Qatar', 'QA', '+974', 3, CURRENT_TIMESTAMP),
    ('country_om', 'Oman', 'OM', '+968', 4, CURRENT_TIMESTAMP),
    ('country_kw', 'Kuwait', 'KW', '+965', 5, CURRENT_TIMESTAMP),
    ('country_bh', 'Bahrain', 'BH', '+973', 6, CURRENT_TIMESTAMP),
    ('country_bd', 'Bangladesh', 'BD', '+880', 7, CURRENT_TIMESTAMP),
    ('country_in', 'India', 'IN', '+91', 8, CURRENT_TIMESTAMP),
    ('country_af', 'Afghanistan', 'AF', '+93', 9, CURRENT_TIMESTAMP),
    ('country_np', 'Nepal', 'NP', '+977', 10, CURRENT_TIMESTAMP),
    ('country_pk', 'Pakistan', 'PK', '+92', 11, CURRENT_TIMESTAMP),
    ('country_lk', 'Sri Lanka', 'LK', '+94', 12, CURRENT_TIMESTAMP),
    ('country_gb_eng', 'England', 'GB', '+44', 13, CURRENT_TIMESTAMP),
    ('country_za', 'South Africa', 'ZA', '+27', 14, CURRENT_TIMESTAMP),
    ('country_au', 'Australia', 'AU', '+61', 15, CURRENT_TIMESTAMP),
    ('country_nz', 'New Zealand', 'NZ', '+64', 16, CURRENT_TIMESTAMP),
    ('country_gb_sct', 'Scotland', 'GB', '+44', 17, CURRENT_TIMESTAMP),
    ('country_ie', 'Ireland', 'IE', '+353', 18, CURRENT_TIMESTAMP),
    ('country_us', 'United States', 'US', '+1', 19, CURRENT_TIMESTAMP),
    ('country_ca', 'Canada', 'CA', '+1', 20, CURRENT_TIMESTAMP),
    ('country_zw', 'Zimbabwe', 'ZW', '+263', 21, CURRENT_TIMESTAMP)
ON CONFLICT ("name") DO NOTHING;
