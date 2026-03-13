/*
  Warnings:

  - You are about to drop the column `academicYear` on the `FeeStructure` table. All the data in the column will be lost.
  - You are about to drop the column `applicableClasses` on the `FeeStructure` table. All the data in the column will be lost.
  - Added the required column `academicYearId` to the `FeeStructure` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "FeeStructure" DROP COLUMN "academicYear",
DROP COLUMN "applicableClasses",
ADD COLUMN     "academicYearId" TEXT NOT NULL,
ADD COLUMN     "boardId" TEXT,
ADD COLUMN     "classId" TEXT,
ADD COLUMN     "mediumId" TEXT,
ALTER COLUMN "applicableCategories" SET DEFAULT 'all';

-- CreateIndex
CREATE INDEX "FeeStructure_academicYearId_idx" ON "FeeStructure"("academicYearId");

-- CreateIndex
CREATE INDEX "FeeStructure_boardId_idx" ON "FeeStructure"("boardId");

-- CreateIndex
CREATE INDEX "FeeStructure_mediumId_idx" ON "FeeStructure"("mediumId");

-- CreateIndex
CREATE INDEX "FeeStructure_classId_idx" ON "FeeStructure"("classId");

-- CreateIndex
CREATE INDEX "FeeStructure_isActive_idx" ON "FeeStructure"("isActive");

-- CreateIndex
CREATE INDEX "FeeStructure_academicYearId_boardId_mediumId_classId_idx" ON "FeeStructure"("academicYearId", "boardId", "mediumId", "classId");

-- AddForeignKey
ALTER TABLE "FeeStructure" ADD CONSTRAINT "FeeStructure_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeStructure" ADD CONSTRAINT "FeeStructure_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeStructure" ADD CONSTRAINT "FeeStructure_mediumId_fkey" FOREIGN KEY ("mediumId") REFERENCES "Medium"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeStructure" ADD CONSTRAINT "FeeStructure_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE SET NULL ON UPDATE CASCADE;
