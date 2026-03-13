-- CreateTable
CREATE TABLE "SchoolSetting" (
    "id" TEXT NOT NULL,
    "group" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchoolSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Board" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Board_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchoolTiming" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "dayOfWeek" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchoolTiming_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SchoolSetting_group_idx" ON "SchoolSetting"("group");

-- CreateIndex
CREATE UNIQUE INDEX "SchoolSetting_group_key_key" ON "SchoolSetting"("group", "key");

-- CreateIndex
CREATE UNIQUE INDEX "Board_code_key" ON "Board"("code");

-- CreateIndex
CREATE INDEX "Board_code_idx" ON "Board"("code");

-- CreateIndex
CREATE INDEX "Board_isActive_idx" ON "Board"("isActive");

-- CreateIndex
CREATE INDEX "SchoolTiming_type_idx" ON "SchoolTiming"("type");

-- CreateIndex
CREATE INDEX "SchoolTiming_dayOfWeek_idx" ON "SchoolTiming"("dayOfWeek");

-- CreateIndex
CREATE INDEX "SchoolTiming_sortOrder_idx" ON "SchoolTiming"("sortOrder");
