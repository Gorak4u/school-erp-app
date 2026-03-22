const DEFAULT_TC_PREFIX = 'TC';

const sanitizeSegment = (value: string | undefined | null, fallback = '0000'): string => {
  const cleaned = (value || '')
    .toString()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '')
    .trim();

  if (!cleaned) {
    return fallback;
  }

  return cleaned.slice(0, 12);
};

const buildSchoolCode = (schoolName?: string): string => {
  const words = (schoolName || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) {
    return 'SCH';
  }

  const initials = words
    .slice(0, 4)
    .map(word => word[0]?.toUpperCase() || '')
    .join('')
    .replace(/[^A-Z0-9]/g, '');

  return sanitizeSegment(initials || schoolName, 'SCH') || 'SCH';
};

const buildDateSegment = (dateInput?: string): string => {
  const sourceDate = dateInput ? new Date(dateInput) : new Date();
  if (Number.isNaN(sourceDate.getTime())) {
    return new Date().toISOString().slice(0, 10).replace(/-/g, '');
  }

  return sourceDate.toISOString().slice(0, 10).replace(/-/g, '');
};

export interface TcNumberSource {
  schoolName?: string;
  admissionNo?: string;
  studentName?: string;
  studentId?: string;
  exitDate?: string;
}

export function generateTcNumber(source: TcNumberSource): string {
  const schoolCode = buildSchoolCode(source.schoolName);
  const dateSegment = buildDateSegment(source.exitDate);
  const identitySegment = sanitizeSegment(
    source.admissionNo || source.studentId || source.studentName || '',
    '0000'
  );

  return `${DEFAULT_TC_PREFIX}-${schoolCode}-${dateSegment}-${identitySegment}`;
}

export function getTcSchoolCode(schoolName?: string): string {
  return buildSchoolCode(schoolName);
}
