import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const globalForPrisma = globalThis as unknown as {
  saasPrisma: PrismaClient | undefined;
  schoolPrisma: PrismaClient | undefined;
  prismaSchemaVersion: string | undefined;
};

// Bump this whenever the schema changes to force a fresh client in dev
const SCHEMA_VERSION = '17'; // Bumped for CommunicationTemplate model - Force regeneration v2

function createSaasPrisma() {
  // Add search_path to connection string
  const saasUrl = process.env.SAAS_DATABASE_URL || process.env.DATABASE_URL || '';
  const urlWithSchema = saasUrl.includes('?') 
    ? `${saasUrl}&search_path=saas`
    : `${saasUrl}?search_path=saas`;
    
  const pool = new Pool({
    connectionString: urlWithSchema,
    ssl: { rejectUnauthorized: false },
  });
  const adapter = new PrismaPg(pool as any);
  return new PrismaClient({ adapter } as any);
}

function createSchoolPrisma() {
  // Add search_path to connection string
  const schoolUrl = process.env.SCHOOL_DATABASE_URL || process.env.DATABASE_URL || '';
  const urlWithSchema = schoolUrl.includes('?') 
    ? `${schoolUrl}&search_path=school`
    : `${schoolUrl}?search_path=school`;
    
  const pool = new Pool({
    connectionString: urlWithSchema,
    ssl: { rejectUnauthorized: false },
  });
  const adapter = new PrismaPg(pool as any);
  return new PrismaClient({ adapter } as any);
}

// Invalidate cached clients if schema version changed
if (globalForPrisma.prismaSchemaVersion !== SCHEMA_VERSION) {
  globalForPrisma.saasPrisma = undefined;
  globalForPrisma.schoolPrisma = undefined;
  globalForPrisma.prismaSchemaVersion = SCHEMA_VERSION;
}

export const saasPrisma = globalForPrisma.saasPrisma ?? createSaasPrisma();
export const schoolPrisma = globalForPrisma.schoolPrisma ?? createSchoolPrisma();

// Backward compatibility - default to schoolPrisma for existing code
export const prisma = schoolPrisma;

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.saasPrisma = saasPrisma;
  globalForPrisma.schoolPrisma = schoolPrisma;
}
