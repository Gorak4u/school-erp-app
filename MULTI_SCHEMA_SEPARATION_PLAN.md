# Multi-Schema Database Separation Plan

## 🎯 **Objective**

Separate the database into two distinct schemas:
- **`saas` schema** - SaaS platform admin tables
- **`school` schema** - School-specific operational tables

This provides better data isolation, security, and scalability for the multi-tenant School ERP system.

---

## 📊 **Current Schema Analysis**

### **🏢 SaaS Admin Tables (to move to `saas` schema)**
These tables manage the SaaS platform itself and are shared across all schools:

1. **Plan** - Subscription plans (basic, professional, enterprise)
2. **SaasSetting** - Platform-wide settings (Razorpay config, etc.)
3. **AuditLog** - Platform audit trail
4. **SaasAnnouncement** - Platform-wide announcements
5. **School** - School registration and management
6. **Subscription** - School subscriptions
7. **Invoice** - Subscription invoices
8. **SubscriptionPayment** - Subscription payment records
9. **PasswordResetToken** - Platform password resets

### **🏫 School-Specific Tables (to move to `school` schema)**
These tables contain school-specific data and should be isolated per school:

1. **User** - School users (admin, teachers, staff)
2. **CustomRole** - School-specific custom roles
3. **Account** - User accounts (OAuth, etc.)
4. **Session** - User sessions
5. **VerificationToken** - Email verification tokens
6. **Student** - Student records
7. **Teacher** - Teacher records
8. **FeeStructure** - School fee structures
9. **FeeRecord** - Student fee records
10. **Payment** - Fee payments
11. **Discount** - School-specific discounts
12. **AttendanceRecord** - Attendance data
13. **Exam** - School exams
14. **ExamResult** - Exam results
15. **Announcement** - School announcements
16. **AcademicYear** - School academic years
17. **Medium** - Language mediums
18. **Class** - School classes
19. **Section** - Class sections
20. **SchoolSetting** - School-specific settings
21. **Board** - Education boards
22. **SchoolTiming** - School timings

---

## 🔧 **Implementation Strategy**

### **1. 📋 Database Schema Separation**

#### **SaaS Schema (`saas`)**
```sql
-- Create saas schema
CREATE SCHEMA IF NOT EXISTS saas;

-- Move SaaS tables to saas schema
ALTER TABLE plans SET SCHEMA saas;
ALTER TABLE saas_settings SET SCHEMA saas;
ALTER TABLE audit_logs SET SCHEMA saas;
ALTER TABLE saas_announcements SET SCHEMA saas;
ALTER TABLE schools SET SCHEMA saas;
ALTER TABLE subscriptions SET SCHEMA saas;
ALTER TABLE invoices SET SCHEMA saas;
ALTER TABLE subscription_payments SET SCHEMA saas;
ALTER TABLE password_reset_tokens SET SCHEMA saas;
```

#### **School Schema (`school`)**
```sql
-- Create school schema
CREATE SCHEMA IF NOT EXISTS school;

-- Move school tables to school schema
ALTER TABLE users SET SCHEMA school;
ALTER TABLE custom_roles SET SCHEMA school;
ALTER TABLE accounts SET SCHEMA school;
ALTER TABLE sessions SET SCHEMA school;
ALTER TABLE verification_tokens SET SCHEMA school;
ALTER TABLE students SET SCHEMA school;
ALTER TABLE teachers SET SCHEMA school;
ALTER TABLE fee_structures SET SCHEMA school;
ALTER TABLE fee_records SET SCHEMA school;
ALTER TABLE payments SET SCHEMA school;
ALTER TABLE discounts SET SCHEMA school;
ALTER TABLE attendance_records SET SCHEMA school;
ALTER TABLE exams SET SCHEMA school;
ALTER TABLE exam_results SET SCHEMA school;
ALTER TABLE announcements SET SCHEMA school;
ALTER TABLE academic_years SET SCHEMA school;
ALTER TABLE mediums SET SCHEMA school;
ALTER TABLE classes SET SCHEMA school;
ALTER TABLE sections SET SCHEMA school;
ALTER TABLE school_settings SET SCHEMA school;
ALTER TABLE boards SET SCHEMA school;
ALTER TABLE school_timings SET SCHEMA school;
```

### **2. 🎯 Prisma Schema Updates**

#### **Multi-Database Configuration**
```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

// SaaS Database
datasource saas {
  provider = "postgresql"
  url      = env("SAAS_DATABASE_URL")
}

// School Database
datasource school {
  provider = "postgresql"
  url      = env("SCHOOL_DATABASE_URL")
}
```

#### **Schema-Specific Models**
```prisma
// SaaS Schema Models
model Plan {
  @@schema("saas")
  // ... existing fields
}

model School {
  @@schema("saas")
  // ... existing fields
}

model Subscription {
  @@schema("saas")
  // ... existing fields
}

// School Schema Models
model User {
  @@schema("school")
  // ... existing fields
}

model Student {
  @@schema("school")
  // ... existing fields
}

model Teacher {
  @@schema("school")
  // ... existing fields
}
```

### **3. 🔗 Cross-Schema Relationships**

#### **School Foreign Key to SaaS**
```prisma
model School {
  @@schema("saas")
  id        String   @id @default(cuid())
  // ... other fields
  planId    String?  // Reference to saas.plans
  plan      Plan?    @relation("SchoolPlan", fields: [planId], references: [id])
}

model Plan {
  @@schema("saas")
  id        String   @id @default(cuid())
  // ... other fields
  schools   School[] @relation("SchoolPlan")
}
```

#### **Subscription Cross-Reference**
```prisma
model Subscription {
  @@schema("saas")
  id        String   @id @default(cuid())
  schoolId  String   // Reference to saas.schools
  planName  String   // Store plan name for reference
  // ... other fields
  school    School   @relation(fields: [schoolId], references: [id], onDelete: Cascade)
}
```

---

## 🏗️ **Implementation Steps**

### **Phase 1: Database Setup**
1. **Create new schemas**
   ```sql
   CREATE SCHEMA saas;
   CREATE SCHEMA school;
   ```

2. **Backup current database**
   ```bash
   pg_dump windsurf > backup_before_migration.sql
   ```

3. **Move tables to appropriate schemas**
   ```sql
   -- Move SaaS tables
   ALTER TABLE plans SET SCHEMA saas;
   ALTER TABLE saas_settings SET SCHEMA saas;
   -- ... continue for all SaaS tables
   
   -- Move School tables
   ALTER TABLE users SET SCHEMA school;
   ALTER TABLE students SET SCHEMA school;
   -- ... continue for all school tables
   ```

### **Phase 2: Prisma Configuration**
1. **Update Prisma schema**
   - Add `@@schema` annotations to all models
   - Configure multiple datasources
   - Update relationships for cross-schema references

2. **Regenerate Prisma client**
   ```bash
   npx prisma generate
   ```

3. **Update environment variables**
   ```env
   # SaaS Database
   SAAS_DATABASE_URL="postgresql://user:pass@host:5432/dbname?schema=saas"
   
   # School Database
   SCHOOL_DATABASE_URL="postgresql://user:pass@host:5432/dbname?schema=school"
   ```

### **Phase 3: Application Code Updates**

#### **Multiple Prisma Clients**
```typescript
// src/lib/prisma.ts
import { PrismaClient as SaasPrismaClient } from '@prisma/client';
import { PrismaClient as SchoolPrismaClient } from '@prisma/client';

export const saasPrisma = new SaasPrismaClient({
  datasources: {
    saas: {
      url: process.env.SAAS_DATABASE_URL,
    },
  },
});

export const schoolPrisma = new SchoolPrismaClient({
  datasources: {
    school: {
      url: process.env.SCHOOL_DATABASE_URL,
    },
  },
});
```

#### **Context-Based Database Selection**
```typescript
// src/contexts/DatabaseContext.tsx
import React, { createContext, useContext } from 'react';
import { saasPrisma, schoolPrisma } from '@/lib/prisma';

interface DatabaseContextType {
  saasDb: typeof saasPrisma;
  schoolDb: typeof schoolPrisma;
  schoolId?: string;
}

const DatabaseContext = createContext<DatabaseContextType>({
  saasDb: saasPrisma,
  schoolDb: schoolPrisma,
});

export const DatabaseProvider: React.FC<{
  children: React.ReactNode;
  schoolId?: string;
}> = ({ children, schoolId }) => {
  return (
    <DatabaseContext.Provider value={{ 
      saasDb: saasPrisma, 
      schoolDb: schoolPrisma,
      schoolId 
    }}>
      {children}
    </DatabaseContext.Provider>
  );
};

export const useDatabase = () => useContext(DatabaseContext);
```

#### **API Route Updates**
```typescript
// src/app/api/schools/route.ts
import { saasPrisma } from '@/lib/prisma';

export async function GET() {
  const schools = await saasPrisma.school.findMany();
  return NextResponse.json({ schools });
}

// src/app/api/students/route.ts
import { schoolPrisma } from '@/lib/prisma';

export async function GET() {
  const students = await schoolPrisma.student.findMany();
  return NextResponse.json({ students });
}
```

### **Phase 4: Multi-Tenant School Isolation**

#### **Per-Schema School Data**
```typescript
// Advanced: Separate schema per school
// src/lib/multi-tenant-prisma.ts
export class MultiTenantPrisma {
  private static instances = new Map<string, any>();
  
  static getPrismaForSchool(schoolId: string) {
    if (!this.instances.has(schoolId)) {
      const prisma = new PrismaClient({
        datasources: {
          school: {
            url: `${process.env.SCHOOL_DATABASE_URL}&search_path=school_${schoolId}`,
          },
        },
      });
      this.instances.set(schoolId, prisma);
    }
    return this.instances.get(schoolId);
  }
}
```

#### **Dynamic Schema Creation**
```typescript
// src/lib/school-schema-manager.ts
export class SchoolSchemaManager {
  static async createSchoolSchema(schoolId: string) {
    const schemaName = `school_${schoolId}`;
    
    // Create schema
    await saasPrisma.$executeRaw`CREATE SCHEMA IF NOT EXISTS ${schemaName}`;
    
    // Create tables in new schema
    await this.createSchoolTables(schemaName);
    
    // Grant permissions
    await this.grantPermissions(schemaName);
  }
  
  private static async createSchoolTables(schemaName: string) {
    // Create all school-specific tables in the new schema
    // This can be done by running migrations with schema parameter
  }
}
```

---

## 🔒 **Security Benefits**

### **1. 🛡️ Data Isolation**
- **SaaS data** isolated from school data
- **School data** isolated from other schools
- **Cross-contamination** prevented at database level

### **2. 🔐 Access Control**
- **Different database users** for different schemas
- **Schema-level permissions** for fine-grained access
- **Row-level security** for additional protection

### **3. 📊 Compliance**
- **GDPR compliance** easier with data isolation
- **Data residency** requirements met
- **Audit trails** separated by schema

---

## 📈 **Performance Benefits**

### **1. ⚡ Query Optimization**
- **Smaller datasets** per schema = faster queries
- **Index optimization** per schema
- **Connection pooling** per schema

### **2. 🔄 Backup Strategy**
- **Selective backups** per schema
- **Faster backups** with smaller datasets
- **Point-in-time recovery** per schema

### **3. 📊 Scaling**
- **Horizontal scaling** per schema
- **Load balancing** across schemas
- **Resource allocation** per tenant

---

## 🚀 **Migration Strategy**

### **Option 1: Single Database, Multiple Schemas**
```env
# One database, multiple schemas
SAAS_DATABASE_URL="postgresql://user:pass@host:5432/windsurf?schema=saas"
SCHOOL_DATABASE_URL="postgresql://user:pass@host:5432/windsurf?schema=school"
```

**Pros:**
- ✅ Simpler setup
- ✅ Single database connection
- ✅ Cross-schema queries possible

**Cons:**
- ❌ Still shared resources
- ❌ Limited isolation

### **Option 2: Multiple Databases**
```env
# Separate databases
SAAS_DATABASE_URL="postgresql://user:pass@host:5432/windsurf_saas"
SCHOOL_DATABASE_URL="postgresql://user:pass@host:5432/windsurf_school"
```

**Pros:**
- ✅ Complete isolation
- ✅ Independent scaling
- ✅ Better security

**Cons:**
- ❌ More complex setup
- ❌ Cross-database queries limited

### **Option 3: Per-School Databases (Advanced)**
```typescript
// Dynamic database per school
const schoolDbUrl = `postgresql://user:pass@host:5432/school_${schoolId}`;
```

**Pros:**
- ✅ Maximum isolation
- ✅ Independent backups
- ✅ Best performance per school

**Cons:**
- ❌ Complex management
- ❌ Higher cost
- ❌ Cross-school reporting difficult

---

## 🎯 **Recommended Implementation**

### **Phase 1: Start with Option 1**
- **Single database, multiple schemas**
- **Easiest migration path**
- **Immediate benefits**

### **Phase 2: Evolve to Option 2**
- **Separate databases for SaaS and schools**
- **Better isolation and performance**
- **More complex but manageable**

### **Phase 3: Consider Option 3 for Large Scale**
- **Per-school databases for enterprise customers**
- **Maximum isolation and performance**
- **Requires advanced management**

---

## 📋 **Implementation Checklist**

### **Database Changes:**
- [ ] Create saas and school schemas
- [ ] Move tables to appropriate schemas
- [ ] Update foreign key constraints
- [ ] Create indexes in new schemas
- [ ] Set proper permissions

### **Prisma Changes:**
- [ ] Add @@schema annotations to all models
- [ ] Configure multiple datasources
- [ ] Update cross-schema relationships
- [ ] Regenerate Prisma client
- [ ] Update environment variables

### **Application Changes:**
- [ ] Create multi-client Prisma setup
- [ ] Update API routes to use correct client
- [ ] Create database context provider
- [ ] Update all database queries
- [ ] Add error handling for schema issues

### **Testing:**
- [ ] Unit tests for schema separation
- [ ] Integration tests for cross-schema queries
- [ ] Performance tests for query optimization
- [ ] Security tests for access control
- [ ] Migration tests for data integrity

---

## 🎉 **Expected Benefits**

### **Security:**
- ✅ **Data isolation** between SaaS and school data
- ✅ **Access control** at schema level
- ✅ **Compliance** with data protection regulations

### **Performance:**
- ✅ **Faster queries** with smaller datasets
- ✅ **Better indexing** per schema
- ✅ **Optimized backups** per schema

### **Scalability:**
- ✅ **Independent scaling** of schemas
- ✅ **Resource allocation** per tenant
- ✅ **Load balancing** opportunities

### **Maintenance:**
- ✅ **Selective maintenance** per schema
- ✅ **Independent migrations** per schema
- ✅ **Easier debugging** with isolated data

---

## 🔄 **Next Steps**

1. **Assess current database size** and complexity
2. **Choose migration strategy** (Option 1, 2, or 3)
3. **Plan migration timeline** with minimal downtime
4. **Create migration scripts** for automated deployment
5. **Test thoroughly** in staging environment
6. **Execute migration** with proper rollback plan
7. **Monitor performance** post-migration
8. **Optimize queries** for new schema structure

**This separation will provide better security, performance, and scalability for the multi-tenant School ERP system!** 🚀
