CREATE TABLE IF NOT EXISTS "AppErrorLog" (
    "id" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "appVersion" TEXT,
    "screen" TEXT,
    "method" TEXT,
    "endpoint" TEXT,
    "statusCode" INTEGER,
    "message" TEXT NOT NULL,
    "details" TEXT,
    "device" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AppErrorLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "AppErrorLog_createdAt_idx" ON "AppErrorLog"("createdAt");
