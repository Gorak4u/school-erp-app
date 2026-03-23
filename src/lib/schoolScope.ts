import { schoolPrisma } from '@/lib/prisma';
import type { SessionContext } from '@/lib/apiAuth';

type PrismaLike = typeof schoolPrisma;

type ScopedRefKey = 'academicYearId' | 'boardId' | 'mediumId' | 'classId' | 'sectionId';
type ScopedModelKey = 'academicYear' | 'board' | 'medium' | 'class' | 'section';

type ScopedRefs = Partial<Record<ScopedRefKey, string | null | undefined>>;

// Base interfaces for scoped records
interface BaseRecord {
  id: string;
  name: string;
  schoolId: string | null;
  isActive?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface AcademicYear extends BaseRecord {
  startDate: Date;
  endDate: Date;
  isCurrent?: boolean;
}

interface Board extends BaseRecord {}
interface Medium extends BaseRecord {
  academicYearId?: string;
}
interface Class extends BaseRecord {
  boardId?: string;
  mediumId?: string;
  academicYearId?: string;
}
interface Section extends BaseRecord {
  classId?: string;
  academicYearId?: string;
}

type ScopedRecords = {
  academicYear?: AcademicYear | null;
  board?: Board | null;
  medium?: Medium | null;
  class?: Class | null;
  section?: Section | null;
};

const MODEL_BY_REF: Record<ScopedRefKey, ScopedModelKey> = {
  academicYearId: 'academicYear',
  boardId: 'board',
  mediumId: 'medium',
  classId: 'class',
  sectionId: 'section',
};

const LABEL_BY_REF: Record<ScopedRefKey, string> = {
  academicYearId: 'Academic year',
  boardId: 'Board',
  mediumId: 'Medium',
  classId: 'Class',
  sectionId: 'Section',
};

export function schoolWhere(schoolId?: string | null) {
  return schoolId ? { schoolId } : {};
}

export function ctxSchoolWhere(ctx?: Pick<SessionContext, 'schoolId'> | null) {
  return schoolWhere(ctx?.schoolId);
}

export async function getActiveAcademicYearForSchool(
  schoolId?: string | null,
  prisma: PrismaLike = schoolPrisma,
) {
  return prisma.academicYear.findFirst({
    where: {
      ...schoolWhere(schoolId),
      isActive: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function findAcademicYearByYear(
  year: string,
  schoolId?: string | null,
  prisma: PrismaLike = schoolPrisma,
) {
  return prisma.academicYear.findFirst({
    where: {
      year,
      ...schoolWhere(schoolId),
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function findOwnedRecord(
  model: ScopedModelKey,
  id: string,
  schoolId?: string | null,
  prisma: PrismaLike = schoolPrisma,
) {
  // Use proper typed access instead of dynamic property access
  switch (model) {
    case 'academicYear':
      return prisma.academicYear.findFirst({
        where: { id, ...schoolWhere(schoolId) },
      });
    case 'board':
      return prisma.board.findFirst({
        where: { id, ...schoolWhere(schoolId) },
      });
    case 'medium':
      return prisma.medium.findFirst({
        where: { id, ...schoolWhere(schoolId) },
      });
    case 'class':
      return prisma.class.findFirst({
        where: { id, ...schoolWhere(schoolId) },
      });
    case 'section':
      return prisma.section.findFirst({
        where: { id, ...schoolWhere(schoolId) },
      });
    default:
      throw new Error(`Unknown model: ${model}`);
  }
}

export async function validateSchoolScopedRefs(
  refs: ScopedRefs,
  schoolId?: string | null,
  prisma: PrismaLike = schoolPrisma,
): Promise<{ records: ScopedRecords; error: string | null }> {
  const records: ScopedRecords = {};

  for (const [refKey, id] of Object.entries(refs) as Array<[ScopedRefKey, string | null | undefined]>) {
    if (!id) continue;
    const model = MODEL_BY_REF[refKey];
    const record = await findOwnedRecord(model, id, schoolId, prisma);
    if (!record) {
      return { records, error: `${LABEL_BY_REF[refKey]} not found for this school` };
    }
    records[model] = record as any;
  }

  if (records.medium && records.academicYear && records.medium.academicYearId !== records.academicYear.id) {
    return { records, error: 'Medium does not belong to the selected academic year' };
  }

  if (records.class) {
    if (records.medium && records.class.mediumId !== records.medium.id) {
      return { records, error: 'Class does not belong to the selected medium' };
    }
    if (records.academicYear && records.class.academicYearId !== records.academicYear.id) {
      return { records, error: 'Class does not belong to the selected academic year' };
    }
  }

  if (records.section) {
    if (records.class && records.section.classId !== records.class.id) {
      return { records, error: 'Section does not belong to the selected class' };
    }
    if (records.academicYear && records.section.academicYearId !== records.academicYear.id) {
      return { records, error: 'Section does not belong to the selected academic year' };
    }
  }

  return { records, error: null };
}
