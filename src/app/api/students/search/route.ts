import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// AI Query Patterns for natural language parsing
const AI_QUERY_PATTERNS = [
  {
    pattern: /\bclass\s*(\d+)|\bclass(\d+)|(\d+)(?:th|rd|nd)\s*class\b/i,
    type: 'class',
    extract: (match: RegExpMatchArray) => match[1] || match[2] || match[3]
  },
  {
    pattern: /\b(?:active|inactive|graduated|transferred|suspended)\b/i,
    type: 'status',
    extract: (match: RegExpMatchArray) => match[0].toLowerCase()
  },
  {
    pattern: /\b(?:fee|payment)\s*(?:pending|due|overdue|paid|unpaid)|(?:pending|due|overdue|paid|unpaid)\s*(?:fee|fees|payment)\b/i,
    type: 'feeStatus',
    extract: (match: RegExpMatchArray) => {
      const status = match[0].toLowerCase();
      if (status.includes('pending') || status.includes('due') || status.includes('overdue') || status.includes('unpaid')) return 'pending';
      if (status.includes('paid')) return 'paid';
      return 'pending';
    }
  },
  {
    pattern: /\battendance\s*(?:above|over|more\s*than)?\s*(\d+)%?\b/i,
    type: 'attendanceMin',
    extract: (match: RegExpMatchArray) => parseInt(match[1])
  },
  {
    pattern: /\battendance\s*(?:below|under|less\s*than)?\s*(\d+)%?\b/i,
    type: 'attendanceMax',
    extract: (match: RegExpMatchArray) => parseInt(match[1])
  },
  {
    pattern: /\b(?:sc|st|obc|general|ews)\b/i,
    type: 'category',
    extract: (match: RegExpMatchArray) => match[0].toUpperCase()
  },
  {
    pattern: /\b(?:male|boy)\b/i,
    type: 'gender',
    extract: () => 'Male'
  },
  {
    pattern: /\b(?:female|girl)\b/i,
    type: 'gender',
    extract: () => 'Female'
  }
];

// Parse natural language query
function parseQuery(query: string) {
  const lowerQuery = query.toLowerCase();
  const filters: any = {};
  let searchTerms = query;

  AI_QUERY_PATTERNS.forEach(({ pattern, type, extract }) => {
    const match = lowerQuery.match(pattern);
    if (match) {
      filters[type] = extract(match);
      // Remove matched part from search terms
      searchTerms = searchTerms.replace(match[0], '').trim();
    }
  });

  // Remove generic words that don't help with search
  const genericWords = /\b(student|students|pupil|pupils|learner|learners|kid|kids|child|children)\b/gi;
  searchTerms = searchTerms.replace(genericWords, '').trim();

  return { filters, searchTerms: searchTerms.replace(/\s+/g, ' ').trim() };
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.schoolId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';
    const schoolId = session.user.schoolId as string;

    // Parse AI query
    const { filters, searchTerms } = parseQuery(query);

    // Build Prisma where clause
    const where: any = {
      schoolId,
    };

    // Apply AI-parsed filters
    if (filters.class) {
      where.class = { contains: filters.class, mode: 'insensitive' };
    }

    if (filters.status) {
      where.status = { equals: filters.status, mode: 'insensitive' };
    }

    if (filters.category) {
      where.category = { equals: filters.category, mode: 'insensitive' };
    }

    if (filters.gender) {
      where.gender = filters.gender;
    }

    // Search terms (name, email, phone, admissionNo) - only if meaningful
    if (searchTerms && searchTerms.length >= 2) {
      where.OR = [
        { name: { contains: searchTerms, mode: 'insensitive' } },
        { email: { contains: searchTerms, mode: 'insensitive' } },
        { phone: { contains: searchTerms, mode: 'insensitive' } },
        { admissionNo: { contains: searchTerms, mode: 'insensitive' } },
        { fatherName: { contains: searchTerms, mode: 'insensitive' } },
        { motherName: { contains: searchTerms, mode: 'insensitive' } },
      ];
    }

    // Execute search
    const students = await prisma.student.findMany({
      where,
      take: 50, // Limit results
      orderBy: { name: 'asc' },
    });

    // Transform Prisma data to match expected Student interface format
    const formattedStudents = students.map((student: any) => ({
      id: student.id, // Keep original ID (UUID or number)
      name: student.name || '',
      email: student.email || '',
      photo: student.photo || '',
      class: student.class || '',
      rollNo: student.rollNo || '',
      phone: student.phone || '',
      gpa: student.gpa || 0,
      status: student.status || 'active',
      admissionNo: student.admissionNo || '',
      dateOfBirth: student.dateOfBirth || '',
      gender: student.gender || 'Other',
      address: student.address || '',
      parentName: student.parentName || student.fatherName || student.motherName || '',
      parentPhone: student.parentPhone || student.fatherPhone || student.motherPhone || '',
      parentEmail: student.parentEmail || student.fatherEmail || student.motherEmail || '',
      enrollmentDate: student.enrollmentDate || student.admissionDate || '',
      board: student.board || '',
      section: student.section || '',
      bloodGroup: student.bloodGroup || '',
      emergencyContact: student.emergencyContact || '',
      medicalConditions: student.medicalConditions || '',
      // Default structures expected by table
      fees: {
        total: 0,
        paid: 0,
        pending: 0,
        lastPaymentDate: ''
      },
      academics: {
        gpa: student.gpa || 0,
        rank: student.rank || 0,
        totalSubjects: 0,
        passedSubjects: 0,
        failedSubjects: 0
      },
      behavior: {
        disciplineScore: student.disciplineScore || 0,
        incidents: student.incidents || 0,
        achievements: student.achievements || 0
      },
      attendance: {
        present: 0,
        absent: 0,
        late: 0,
        percentage: 100
      },
      documents: {
        birthCertificate: false,
        transferCertificate: false
      }
    }));

    return NextResponse.json({
      success: true,
      data: formattedStudents,
      meta: {
        total: formattedStudents.length,
        query,
        filters,
        searchTerms,
      }
    });

  } catch (error) {
    console.error('AI Search Error:', error);
    return NextResponse.json(
      { error: 'Search failed', message: (error as Error).message },
      { status: 500 }
    );
  }
}
