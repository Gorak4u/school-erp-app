const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');

require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function debugRoles() {
  try {
    // Get the first school ID
    const schools = await prisma.school.findMany({
      select: { id: true }
    });
    
    if (schools.length === 0) {
      console.log('No schools found');
      return;
    }
    
    const roles = await prisma.customRole.findMany({
      where: { schoolId: schools[0].id },
      orderBy: { createdAt: 'asc' },
    });

    console.log('=== ROLES DEBUG ===');
    roles.forEach(role => {
      console.log(`\nRole: ${role.name}`);
      console.log(`ID: ${role.id}`);
      console.log(`Permissions: ${role.permissions}`);
      console.log(`Is Default: ${role.isDefault}`);
      console.log(`Description: ${role.description}`);
      
      if (role.permissions) {
        try {
          const parsed = JSON.parse(role.permissions);
          console.log(`Parsed Permissions:`, parsed);
        } catch (e) {
          console.log(`Failed to parse permissions as JSON`);
          // Try parsing as comma-separated
          const commaSeparated = role.permissions.split(',').map(p => p.trim()).filter(Boolean);
          console.log(`Comma-separated parse:`, commaSeparated);
        }
      }
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

debugRoles();
