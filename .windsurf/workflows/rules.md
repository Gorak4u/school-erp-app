# Project Rules for School ERP

> **⚠️ WORKSPACE-SPECIFIC RULES**: These 69 rules are custom-tailored for this specific School ERP SaaS project (`/Users/ggonda/CascadeProjects/windsurf-project-2/school-erp-app`). They reflect the patterns, architecture decisions, and requirements identified in this codebase. Do not apply these rules universally to other projects without adaptation.

## Code Quality & Patterns

### 1. Notifications: Always Use Toast, Never Alert
- **Rule**: Replace all `alert()` calls with `showToast()` from `@/lib/toastUtils`
- **Pattern**: `showToast('success'|'error'|'warning'|'info', 'Title', 'Message')`
- **Example**:
  ```typescript
  // ❌ Bad
  alert('Student saved successfully');
  
  // ✅ Good
  import { showToast } from '@/lib/toastUtils';
  showToast('success', 'Saved', 'Student saved successfully');
  ```

### 2. API Error Handling Pattern
- **Rule**: Always use `console.error()` + `showToast()` for API errors
- **Pattern**:
  ```typescript
  } catch (error) {
    console.error('Failed to save:', error);
    showToast('error', 'Save Failed', 'Failed to save student. Please try again.');
  }
  ```

### 3. Prisma Model Naming
- **Rule**: Use PascalCase for Prisma model references
- **Correct**: `FeeRecord`, `Student`, `Payment`, `AttendanceRecord`
- **Incorrect**: `feeRecord`, `student`, `payment`, `attendanceRecord`

### 4. Prisma JSON Query Syntax
- **Rule**: Use simple string operators for JSON fields
- **Correct**: `contains: 'manage_fees'`
- **Incorrect**: `path: [], string_contains: 'manage_fees'`

### 5. Composite Keys for Class/Medium Filtering
- **Rule**: Use pipe-separated composite keys when filtering by class AND medium
- **Pattern**: `className|mediumName` (e.g., "Class 1|English")
- **Code**:
  ```typescript
  const [className, mediumName] = selectedClass.split('|');
  ```

### 6. Import Placement
- **Rule**: Add new imports at the top of the file, grouped by:
  1. React/Next imports
  2. Third-party libraries (framer-motion, lucide-react)
  3. Absolute project imports (@/components, @/lib)
  4. Relative imports (./components)

### 7. Validation Error Messages
- **Rule**: Use descriptive titles and clear messages for validation errors
- **Pattern**: `showToast('warning', 'Validation Error', 'Specific field requirement')`

## Database & API

### 8. Field Name Consistency
- **Rule**: Use `languageMedium` field name (not `medium`) in Student model queries
- **Applies to**: `/api/fees/students/route.ts`, `useFeeState.ts`

### 9. Table References in Raw SQL
- **Rule**: Use correct table names from `@@map()` in schema
- **Example**: `"school"."User"` (not `"school"."school_User"`)

## UI/UX Patterns

### 10. Loading States
- **Rule**: Always set loading state before API calls, clear in finally block
- **Pattern**:
  ```typescript
  setIsLoading(true);
  try {
    await apiCall();
  } finally {
    setIsLoading(false);
  }
  ```

### 11. Theme Support
- **Rule**: Support both dark and light themes using `theme === 'dark'` checks
- **Pattern**: Use conditional classes with dark/light variants

## Testing & Verification

### 12. Build Verification
- **Rule**: Always run `npm run build` after significant changes
- **Fix**: Resolve all TypeScript errors before considering task complete

### 13. Grep Verification
- **Rule**: Use `grep -rn "pattern" src --include="*.tsx"` to verify changes across codebase

## Performance & Scale

### 14. Handle 10M+ Records with Pagination
- **Rule**: Every API and page must support pagination for large datasets
- **Pattern**: 
  - API: Use `skip`/`take` or `cursor` based pagination
  - UI: Implement infinite scroll or numbered pagination
  - Default page size: 20-50 records
- **Example**:
  ```typescript
  // API
  const { page = '1', limit = '20' } = req.query;
  const skip = (Number(page) - 1) * Number(limit);
  const records = await prisma.record.findMany({ skip, take: Number(limit) });
  
  // UI
  const [page, setPage] = useState(1);
  const pageSize = 20;
  ```

### 15. Cross Dependency Check
- **Rule**: Before modifying/creating any file, check for cross-dependencies
- **Checklist**:
  - Search for imports of the file being modified
  - Check shared types/interfaces usage
  - Verify API consumers
  - Run `grep -rn "filename" src` to find all references

## Code Quality

### 16. Console Cleanup
- **Rule**: Remove all debug `console.log()` before commits
- **Allowed**: `console.error()` for actual errors
- **Use grep**: `grep -rn "console.log" src --include="*.tsx"` to find strays

### 17. Production Grade Code Only
- **Rule**: Never use mock data or dummy data in production code
- **Requirements**:
  - All data must come from real APIs/database
  - Use loading states, not placeholder content
  - Implement proper error handling for empty states
- **❌ Bad**: `const data = [{ id: 1, name: 'Test' }]; // TODO: Replace with API`
- **✅ Good**: Fetch from API with loading/error states

## Security & Access Control

### 18. RBAC (Role-Based Access Control)
- **Rule**: Follow RBAC for all pages and API routes
- **Pattern**: Use `usePermissions()` hook and `withPermission` HOC
- **Example**:
  ```typescript
  const { can, loading } = usePermissions();
  if (!can('manage_students')) return <AccessDenied />;
  ```
- **API Routes**: Verify permissions before processing requests

### 19. Notifications Respect Settings
- **Rule**: Use Email/SMS/Notifications where required AND respect user settings
- **Pattern**:
  - Check notification preferences before sending
  - Queue notifications for bulk operations
  - Support opt-out for all channels
- **Code**:
  ```typescript
  if (userSettings.emailNotifications) {
    await emailQueue.add({ userId, template, data });
  }
  ```

## SaaS Architecture & Multi-Tenancy

### 20. Follow School Management SaaS Patterns
- **Rule**: Adhere to established SaaS architecture for school management domain
- **Key Components**:
  - **Multi-tenant data isolation** (schoolId-based)
  - **Subscription-based billing** (plans, limits, usage tracking)
  - **Role-based access** (admin, teacher, parent, student roles)
  - **Academic year cycles** (admissions, promotions, grading)
  - **Fee management** (tuition, transport, fines, discounts)
- **Design Patterns**:
  - Shared database with tenant isolation (schoolId)
  - Schema-per-school for sensitive data when needed
  - Centralized configuration per school

### 21. Always Use schoolId for Multi-Tenant Isolation
- **Rule**: EVERY query, API call, and feature MUST include schoolId filtering
- **Database Tables**: Add `schoolId` column to all school-specific tables
- **Prisma Queries**: Always include `where: { schoolId }`
- **API Routes**: Extract schoolId from session/token and filter all responses
- **Frontend**: Pass schoolId implicitly via context or headers
- **Example**:
  ```typescript
  // API Route
  const schoolId = req.headers['x-school-id'] || session.user.schoolId;
  const students = await prisma.student.findMany({
    where: { schoolId, status: 'active' }
  });
  
  // Component
  const { schoolId } = useSchoolContext();
  const { data } = useQuery(['students', schoolId], () => fetchStudents(schoolId));
  ```
- **Global Tables** (no schoolId): Users, Plans, Subscriptions, System Config
- **School Tables** (with schoolId): Students, Teachers, Classes, Fees, Attendance, Fines, etc.

## UI/UX Standards

### 22. Mobile-First Responsive Design
- **Rule**: Design for mobile first, test on 320px minimum width
- **Breakpoints**: 320px, 640px, 768px, 1024px, 1280px
- **Requirements**:
  - All tables must have horizontal scroll or card view on mobile
  - Forms must stack vertically on small screens
  - Navigation collapses to hamburger menu below 768px
  - Touch targets minimum 44x44px
- **Test**: Use Chrome DevTools device emulation at 320px width

## Data Operations

### 23. Search, Export, and Bulk Operations
- **Rule**: Every data listing page must support Search, Export, and Bulk operations
- **Search Requirements**:
  - Real-time search with debounce (300ms)
  - Search across multiple fields (name, ID, email)
  - Highlight matching text
- **Export Requirements**:
  - Support CSV, Excel, PDF formats
  - Export current filtered view or all records
  - Include headers and proper formatting
- **Bulk Operations**:
  - Checkbox selection with "Select All" option
  - Actions: Delete, Update Status, Send Notification, Assign
  - Confirmation modal before destructive actions
- **Example Pattern**:
  ```typescript
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const debouncedSearch = useDebounce(searchTerm, 300);
  ```

### 24. Soft Delete Only - Never Hard Delete
- **Rule**: All deletions must be soft deletes (update status to 'deleted'/'inactive')
- **Requirements**:
  - Add `status` or `deletedAt` field to all entities
  - Filter by `status !== 'deleted'` in all queries
  - Provide "Restore" functionality in UI
  - Hard delete only after 30-day retention or admin override
- **Database Pattern**:
  ```typescript
  // Delete (soft)
  await prisma.student.update({
    where: { id },
    data: { status: 'deleted', deletedAt: new Date() }
  });
  
  // Query (exclude deleted)
  await prisma.student.findMany({
    where: { status: { not: 'deleted' } }
  });
  ```

## Real-Time & Notifications

### 25. In-App Notifications for All Approvals
- **Rule**: Every approval workflow must generate in-app notifications
- **Approval Types**: Fee discounts, fine waivers, leave requests, admissions
- **Notification Structure**:
  ```typescript
  {
    userId: string;
    type: 'approval_request' | 'approval_status';
    title: string;
    message: string;
    data: { requestId, actionUrl };
    isRead: boolean;
    createdAt: Date;
  }
  ```
- **UI Pattern**: Bell icon with badge count, notification dropdown/panel
- **Mark as Read**: Click notification or explicit "Mark all read" button

### 26. Socket.IO for Real-Time Updates
- **Rule**: Use Socket.IO for real-time messages, approvals, and notifications
- **Use Cases**:
  - New approval request submitted
  - Approval status changed (approved/rejected)
  - Payment received
  - Attendance marked
  - Emergency broadcast
- **Implementation**:
  - Private rooms per user: `socket.join(userId)`
  - School-wide broadcasts: `io.to(schoolId).emit()`
  - Reconnect logic with missed message recovery
- **Frontend Pattern**:
  ```typescript
  useEffect(() => {
    socket.on('notification', (data) => {
      showToast(data.type, data.title, data.message);
      refreshNotifications();
    });
    return () => socket.off('notification');
  }, []);
  ```

### 27. Email for All Approval Requests
- **Rule**: Send email notification for every approval request
- **Requirements**:
  - Approver receives email with action buttons (Approve/Reject links)
  - Requester receives confirmation email
  - Escalation emails if not responded within 24 hours
  - Include direct deep links to approval page
- **Email Template Variables**:
  - Requester name, approver name
  - Request details (amount, reason, date)
  - School branding (logo, colors)
  - Action buttons with secure tokens

### 28. School-Branded Emails with School SMTP
- **Rule**: All emails must use school-specific branding and SMTP settings
- **Branding Requirements**:
  - School logo in email header
  - School colors in button styling
  - School name in email signature
  - Contact info from school settings
- **SMTP Configuration**:
  - Use school-configured SMTP (not system default)
  - Support: Gmail, Outlook, AWS SES, SendGrid
  - Settings stored per school: `smtpHost`, `smtpPort`, `smtpUser`, `smtpPass`
  - Fallback to system SMTP if school config fails
- **Email Sending Pattern**:
  ```typescript
  const schoolSettings = await getSchoolSettings(schoolId);
  const transporter = createTransport({
    host: schoolSettings.smtpHost,
    auth: { user: schoolSettings.smtpUser, pass: schoolSettings.smtpPass }
  });
  await transporter.sendMail({
    from: `"${schoolSettings.name}" <${schoolSettings.email}>`,
    to: user.email,
    subject: 'Action Required: Approval Request',
    html: renderTemplate('approval-request', { schoolSettings, data })
  });
  ```

## Communication & Verification

### 29. Never Assume or Hallucinate - Ask for Confirmation
- **Rule**: When uncertain about requirements, ALWAYS ask for clarification before proceeding
- **Never**: Make up parameters, invent file paths, assume library versions
- **Always**: Verify with user when:
  - Requirements are ambiguous
  - File paths are not confirmed
  - API signatures are unclear
  - Design specifications missing
  - Dependencies not specified
- **Example Response**:
  > "I see you want to add a new feature. Before I proceed, I need to confirm:
  > - Which page should this go on?
  > - Should this use the existing API or create new endpoint?
  > - Do you have specific design requirements?"

## Project Structure

### 30. All Pages Must Use App Layout
- **Rule**: Every page component must be wrapped with `<AppLayout>`
- **Pattern**:
  ```typescript
  import AppLayout from '@/components/AppLayout';
  
  export default function MyPage() {
    return (
      <AppLayout>
        {/* Page content */}
      </AppLayout>
    );
  }
  ```
- **Requirements**:
  - Use `AppLayout` for consistent navigation, sidebar, headers
  - Pass page title via props if supported: `<AppLayout title="Students">`
  - Never create standalone pages without layout wrapper

### 31. Follow Modal Component Structure
- **Rule**: All modals should follow `/components/modals/` structure or inline component pattern
- **Structure Options**:
  1. **Shared modals**: `/components/modals/StudentModal.tsx`, `/components/modals/FeeModal.tsx`
  2. **Page-specific**: Co-locate in page directory: `/students/components/StudentModal.tsx`
- **Modal Pattern**:
  ```typescript
  interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    data?: any;
    onSubmit?: (data: any) => void;
  }
  
  export function StudentModal({ isOpen, onClose, data, onSubmit }: ModalProps) {
    if (!isOpen) return null;
    return (
      <div className="modal-overlay">
        <div className="modal-content">...</div>
      </div>
    );
  }
  ```
- **Requirements**:
  - Accept `isOpen` and `onClose` props
  - Handle escape key and click-outside to close
  - Use portal for rendering outside DOM hierarchy
  - Include focus trap for accessibility

## Design System

### 32. Follow World-Class UI Template - Dark Mode Default
- **Rule**: All pages must follow the established world-class UI template with **dark mode as default**
- **Design Standards**:
  - **Theme**: Dark mode (`theme === 'dark'`) is the primary/default theme
  - **Light mode**: Supported but secondary
  - **Color palette**: Use CSS variables from design system
  - **Components**: Use shadcn/ui, Lucide icons, Framer Motion animations
  - **Typography**: Inter/Roboto font, consistent hierarchy
  - **Spacing**: 4px grid system, consistent padding/margins
- **Implementation**:
  ```typescript
  // Check theme context
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  // Apply conditional classes
  className={`
    ${isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}
    ${isDark ? 'border-gray-700' : 'border-gray-200'}
  `}
  ```
- **Requirements**:
  - Every component must support both dark and light
  - Test visual appearance in both themes
  - Use Tailwind dark variants: `dark:bg-gray-900 dark:text-white`
  - Never hardcode colors - use theme variables
- **Template Reference**: See `/app/students/page.tsx` for world-class implementation example
- **Checklist**:
  - [ ] Dark mode looks professional
  - [ ] Light mode consistent with dark styling
  - [ ] Animations smooth (Framer Motion)
  - [ ] Icons from Lucide
  - [ ] Responsive on mobile (320px)
  - [ ] Accessibility: focus states, ARIA labels

---

## Quick Reference: Rule Categories

| Category | Rules | Summary |
|----------|-------|---------|
| Code Quality | 1, 3-7, 16-17 | Toast, imports, console cleanup, production grade |
| Performance | 14 | Pagination for large datasets |
| Security | 18, 21 | RBAC, schoolId multi-tenancy |
| SaaS | 20-21 | School management patterns |
| UI/UX | 22, 32 | Mobile-first, world-class UI template |
| Data Ops | 23-24 | Search, export, bulk, soft delete |
| Real-Time | 25-28 | Notifications, Socket.IO, email |
| Verification | 29 | Ask before assuming |
| Structure | 30-31 | AppLayout, modal structure |
| **Safety** | **33-34** | **No destructive commands, todo tracking** |
| **Type Safety** | **35** | **No @ts-nocheck** |

**Total: 35 Rules**

---

## Safety & Process

### 33. Never Run Destructive Commands Without Confirmation
- **Rule**: NEVER execute `git restore`, `db --reset --force`, `rm -rf`, or any destructive command without explicit user confirmation
- **Forbidden Commands** (require user approval):
  - `git restore` (discards local changes)
  - `npx prisma db push --force` (resets database)
  - `npx prisma migrate reset` (drops all data)
  - `rm -rf` (deletes files recursively)
  - Any command with `--force`, `--yes`, `-y` flags
- **Required Action**: 
  - Stop and explain what the command will do
  - Show what data/files will be lost
  - Ask: "Do you want me to proceed? (yes/no)"
- **Example**:
  > "I need to reset the database to apply schema changes. This will DELETE all existing data. Do you want me to proceed? (yes/no)"

### 34. All Work Phases Tracked in Todo List
- **Rule**: Every phase of work must be tracked in a todo list until completion
- **Requirements**:
  - Create todo list at start of multi-step task
  - Mark items as `in_progress` when working on them
  - Mark items as `completed` when done
  - Update todo list after each significant step
  - Only close/delete todo list when all items complete
- **Pattern**:
  ```typescript
  // At start
  todo_list({ todos: [
    { id: '1', content: 'Fix alerts in FileA.tsx', status: 'in_progress', priority: 'high' },
    { id: '2', content: 'Fix alerts in FileB.tsx', status: 'pending', priority: 'high' },
    { id: '3', content: 'Build and verify', status: 'pending', priority: 'high' }
  ]})
  
  // After each step
  todo_list({ todos: [..., { id: '1', status: 'completed', ...} ]})
  ```
- **No shortcuts**: Never skip todo tracking for "quick" tasks

## Type Safety

### 35. Never Use @ts-nocheck or @ts-ignore
- **Rule**: NEVER use `// @ts-nocheck` at file top or `// @ts-ignore` to suppress errors
- **Why**: These hide real bugs and reduce type safety
- **Instead**: Fix the actual TypeScript errors
- **Common fixes**:
  - Add proper types to `any` variables
  - Define interfaces for props
  - Use type guards for optional chaining
  - Import missing types
- **Exception**: Rare cases with external library issues - but must document why
- **Enforcement**: CI/CD should fail builds with `@ts-nocheck` present
- **Example - Fix instead of suppress**:
  ```typescript
  // ❌ Bad
  // @ts-nocheck
  function process(data: any) { ... }
  
  // ✅ Good
  interface DataType {
    id: string;
    name: string;
  }
  function process(data: DataType) { ... }
  ```

## Production Cleanup

### 36. Always Clear Dummy/Test Code and Files
- **Rule**: Remove all dummy data, test code, and temporary files before committing to production
- **What to Remove**:
  - `// TODO` or `// FIXME` comments (unless tracked in issue tracker)
  - `console.log('DEBUG:', ...)` statements
  - Hardcoded test data: `const testData = [...]`
  - Unused imports and variables
  - Commented-out code blocks
  - Temporary files: `temp.tsx`, `test-*.ts`, `backup-*`
  - Mock API handlers (unless in dedicated mocks folder)
- **Pre-Commit Checklist**:
  ```bash
  # Search for common patterns
  grep -rn "TODO\|FIXME\|XXX\|HACK" src --include="*.tsx" --include="*.ts"
  grep -rn "testData\|dummyData\|mockData" src --include="*.tsx"
  grep -rn "console.log.*DEBUG\|console.log.*TEST" src --include="*.tsx"
  find src -name "temp*" -o -name "test-*" -o -name "backup-*"
  ```
- **Exception**: Test files in `__tests__/` or `*.test.tsx` are allowed
- **CI/CD**: Add pre-commit hook or GitHub Action to block commits with test code

### 37. Never Use Placeholders - Always Implement Real Logic
- **Rule**: Never leave placeholder code, comments, or stubs - always replace with fully functional implementation
- **Placeholders to Avoid**:
  - Code: `// TODO: Implement this`, `// FIXME: Add logic here`
  - Functions: `function process() { /* TODO */ return null; }`
  - Variables: `const API_URL = 'PLACEHOLDER_URL'`
  - Components: `<div>PLACEHOLDER: Component coming soon</div>`
  - Logic stubs: `if (condition) { // TODO: handle this case }`
- **Requirements**:
  - Every function must have complete implementation
  - Every condition must handle all branches
  - Every API call must use real endpoints (not `/api/placeholder`)
  - Every UI element must display real data (not "Coming soon", "TBD")
  - No empty `catch` blocks or `// TODO: error handling`
- **If Feature is Incomplete**:
  - Hide incomplete feature behind feature flag
  - Or don't include the file/code in commit at all
  - Never commit with placeholder logic
- **Example**:
  ```typescript
  // ❌ Bad - Placeholder
  function calculateFee(studentId: string) {
    // TODO: Implement fee calculation
    return 0;
  }
  
  // ✅ Good - Real implementation
  function calculateFee(studentId: string) {
    const student = await prisma.student.findUnique({ where: { id: studentId } });
    if (!student) throw new Error('Student not found');
    const baseFee = student.class.feeStructure.baseAmount;
    const discounts = await calculateDiscounts(studentId);
    return baseFee - discounts;
  }
  ```
- **Enforcement**: CI/CD should fail if grep finds `TODO.*implement\|PLACEHOLDER\|FIXME\|Coming soon`

---

## API & Backend Standards

### 38. API Rate Limiting on All Endpoints
- **Rule**: Protect every API endpoint from abuse with rate limiting
- **Requirements**:
  - Public endpoints: 100 requests/minute per IP
  - Authenticated endpoints: 1000 requests/minute per user
  - Sensitive endpoints (payments, bulk ops): 10 requests/minute
- **Implementation**:
  ```typescript
  import rateLimit from 'express-rate-limit';
  
  const limiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100,
    keyGenerator: (req) => req.user?.id || req.ip,
    handler: (req, res) => {
      res.status(429).json({ error: 'Too many requests, please try again later' });
    }
  });
  
  app.use('/api/', limiter);
  ```
- **Headers**: Return `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- **Storage**: Use Redis for distributed rate limiting (not in-memory)

### 39. Input Validation with Zod Schemas
- **Rule**: Validate ALL API inputs with Zod schemas - never trust client data
- **Requirements**:
  - Define schema for every API route
  - Validate at API boundary (first thing in route handler)
  - Return 400 with detailed validation errors
  - Sanitize inputs (strip HTML, trim strings)
- **Pattern**:
  ```typescript
  import { z } from 'zod';
  
  const CreateStudentSchema = z.object({
    name: z.string().min(1).max(100).trim(),
    email: z.string().email(),
    age: z.number().int().min(3).max(25),
    classId: z.string().uuid(),
  });
  
  export async function POST(req: Request) {
    const body = await req.json();
    const result = CreateStudentSchema.safeParse(body);
    
    if (!result.success) {
      return Response.json({ 
        error: 'Validation failed', 
        details: result.error.issues 
      }, { status: 400 });
    }
    
    // Use result.data (typed and validated)
    const student = await prisma.student.create({ data: result.data });
  }
  ```
- **Never**: Use `any` types, trust client data, skip validation

### 40. API Versioning for Backward Compatibility
- **Rule**: All API routes must be versioned: `/api/v1/...`, `/api/v2/...`
- **Structure**:
  ```
  /api/v1/students/route.ts
  /api/v1/students/[id]/route.ts
  /api/v2/students/route.ts (when breaking changes needed)
  ```
- **Version Increment Rules**:
  - **v1 → v2**: Breaking changes (removed fields, changed behavior)
  - **v1.1**: Additive changes (new fields, new endpoints)
- **Deprecation**: Support old versions for 6 months with deprecation warnings
- **Response Headers**: `API-Version: v1`, `Deprecation: true`, `Sunset: 2024-12-01`

### 41. Comprehensive Error Handling with Structured Responses
- **Rule**: All errors must return structured JSON with error codes
- **Error Response Structure**:
  ```typescript
  {
    error: {
      code: 'STUDENT_NOT_FOUND',     // Machine-readable code
      message: 'Student not found',   // Human-readable message
      details: { studentId: '123' }, // Context
      requestId: 'req_abc123',        // For tracking
      timestamp: '2024-01-15T10:30:00Z'
    }
  }
  ```
- **Error Categories**:
  - `400`: ValidationError, BadRequest
  - `401`: Unauthorized, TokenExpired
  - `403`: Forbidden, InsufficientPermissions
  - `404`: NotFound (Student, Class, etc.)
  - `409`: Conflict (Duplicate, AlreadyExists)
  - `429`: RateLimitExceeded
  - `500`: InternalError (don't expose details)
- **Never**: Return raw stack traces, database errors, or internal details to client
- **Logging**: Log full error details server-side with `requestId` for correlation

---

## Performance & Scalability

### 42. Database Indexing Strategy
- **Rule**: Add indexes on all query filters, sorts, and joins
- **Required Indexes**:
  - **Multi-tenancy**: `@@index([schoolId])` on all school tables
  - **Foreign keys**: `@@index([studentId])`, `@@index([classId])`
  - **Timestamps**: `@@index([createdAt])`, `@@index([updatedAt])`
  - **Status fields**: `@@index([status])`, `@@index([isActive])`
  - **Search fields**: `@@index([name])` (for text search)
  - **Composite**: `@@index([schoolId, status, createdAt])` for common queries
- **Prisma Schema**:
  ```prisma
  model Student {
    id        String   @id @default(uuid())
    schoolId  String
    name      String
    status    String
    createdAt DateTime @default(now())
    
    @@index([schoolId])
    @@index([schoolId, status])
    @@index([schoolId, status, createdAt])
    @@index([name])
  }
  ```
- **Monitoring**: Use `EXPLAIN ANALYZE` to verify index usage

### 43. Caching Strategy (Redis)
- **Rule**: Cache frequently accessed data to reduce database load
- **Cache Tiers**:
  - **Session data**: User sessions in Redis (TTL: 24 hours)
  - **API responses**: Cache GET responses (TTL: 5-15 minutes)
  - **Reference data**: Schools, classes, fee structures (TTL: 1 hour)
  - **Computed data**: Dashboard stats, reports (TTL: 15-30 minutes)
- **Cache Keys**:
  ```
  session:{userId}
  api:schools:{schoolId}:students:list:{page}:{filters}
  ref:schools:{schoolId}:config
  stats:schools:{schoolId}:dashboard
  ```
- **Invalidation**: Clear cache on data mutations
  ```typescript
  await redis.del(`api:schools:${schoolId}:students:*`);
  ```
- **Pattern**:
  ```typescript
  const cacheKey = `students:${schoolId}:${page}`;
  let data = await redis.get(cacheKey);
  
  if (!data) {
    data = await prisma.student.findMany({ where: { schoolId } });
    await redis.setex(cacheKey, 300, JSON.stringify(data)); // 5 min TTL
  }
  ```

### 44. Asset Optimization
- **Rule**: Optimize all images, fonts, and static assets
- **Requirements**:
  - **Images**: WebP format, lazy loading, responsive sizes
  - **Compression**: Enable gzip/brotli for API responses
  - **CDN**: Serve static assets from CDN (CloudFront, Cloudflare)
  - **Code splitting**: Lazy load heavy components
  - **Tree shaking**: Remove unused code from bundles
- **Next.js Config**:
  ```javascript
  module.exports = {
    images: {
      formats: ['image/webp', 'image/avif'],
      remotePatterns: [{ hostname: 'cdn.yourschool.com' }]
    },
    compress: true,
  };
  ```
- **Lazy Loading**:
  ```typescript
  const HeavyChart = dynamic(() => import('./HeavyChart'), { 
    loading: () => <Skeleton />
  });
  ```

---

## Security & Compliance

### 45. Security Headers on All Responses
- **Rule**: Set security headers on every HTTP response
- **Required Headers**:
  ```
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-eval'
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Strict-Transport-Security: max-age=31536000; includeSubDomains
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  ```
- **Next.js Middleware**:
  ```typescript
  export function middleware(req: NextRequest) {
    const res = NextResponse.next();
    res.headers.set('X-Frame-Options', 'DENY');
    res.headers.set('X-Content-Type-Options', 'nosniff');
    return res;
  }
  ```
- **CSP**: Strict policy blocking inline scripts unless hashed

### 46. Audit Logging for All Data Mutations
- **Rule**: Log every create, update, delete with before/after values
- **What to Log**:
  - Who (userId, userEmail)
  - When (timestamp)
  - What action (CREATE, UPDATE, DELETE)
  - Which entity (table, recordId)
  - Old values (for updates/deletes)
  - New values (for creates/updates)
  - IP address, user agent
- **Audit Log Schema**:
  ```prisma
  model AuditLog {
    id          String   @id @default(uuid())
    schoolId    String
    userId      String
    action      String   // CREATE, UPDATE, DELETE, LOGIN, etc.
    entity      String   // Student, Fee, Payment
    entityId    String
    oldValues   Json?    // { name: "Old", email: "old@example.com" }
    newValues   Json?    // { name: "New", email: "new@example.com" }
    ipAddress   String
    userAgent   String
    createdAt   DateTime @default(now())
    
    @@index([schoolId, createdAt])
    @@index([entity, entityId])
    @@index([userId])
  }
  ```
- **Critical for ERP**: Grade changes, fee modifications, attendance edits, user role changes
- **Retention**: Store for 7 years (compliance requirement)
- **Search**: Admin should be able to search/filter audit logs

### 47. Health Check Endpoint
- **Rule**: Provide `/api/health` endpoint for monitoring system status
- **Response Structure**:
  ```typescript
  {
    status: 'healthy' | 'degraded' | 'unhealthy',
    timestamp: '2024-01-15T10:30:00Z',
    version: '1.2.3',
    checks: {
      database: { status: 'healthy', responseTime: 12 },
      redis: { status: 'healthy', responseTime: 5 },
      smtp: { status: 'healthy' },
      storage: { status: 'healthy' }
    },
    uptime: 86400 // seconds
  }
  ```
- **Status Codes**:
  - `200`: All systems healthy
  - `503`: One or more systems unhealthy
- **Use Cases**: Load balancer health checks, monitoring alerts, deployment verification

---

## Documentation & Maintainability

### 48. JSDoc Comments for All Functions
- **Rule**: Document all exported functions, utilities, and API handlers
- **Required Documentation**:
  ```typescript
  /**
   * Calculate discounted fee amount for a student
   * @param studentId - The unique student identifier
   * @param baseAmount - Original fee amount before discounts
   * @returns Promise resolving to final amount after all applicable discounts
   * @throws Error if student not found or invalid discount configuration
   * @example
   * const amount = await calculateFee('stu_123', 5000);
   * // Returns: 4500 (with 10% sibling discount)
   */
  export async function calculateFee(
    studentId: string, 
    baseAmount: number
  ): Promise<number> {
    // implementation
  }
  ```
- **Required Tags**:
  - `@param` - All parameters with types
  - `@returns` - Return value description
  - `@throws` - Exceptions that can be thrown
  - `@example` - Usage example
- **Generate Docs**: Use TypeDoc to generate API documentation from JSDoc

### 49. API Documentation (OpenAPI/Swagger)
- **Rule**: Document all API endpoints with OpenAPI 3.0 spec
- **Documentation Requirements**:
  - Endpoint path and HTTP method
  - Request/response schemas with examples
  - Authentication requirements
  - Error response codes and examples
  - Rate limiting information
- **Implementation**: Use `next-swagger-doc` or manual YAML/JSON spec
- **Access**: Serve at `/api/docs` with Swagger UI
- **Keep Updated**: Regenerate docs when API changes

---

## Updated Rule Summary

| Category | Rules | Count |
|----------|-------|-------|
| Code Quality | 1, 3-7, 16-17, 29, 35, 37 | 11 |
| Performance | 14, 42-44 | 4 |
| Security | 18, 21, 38-39, 45-46 | 7 |
| SaaS | 20-21 | 2 |
| UI/UX | 22, 30-32 | 4 |
| Data Ops | 23-24 | 2 |
| Real-Time | 25-28 | 4 |
| Verification | 29 | 1 |
| Structure | 30-31 | 2 |
| Type Safety | 35 | 1 |
| Production Cleanup | 36-37 | 2 |
| **API & Backend** | **38-41** | **4** |
| **Performance** | **42-44** | **3** |
| **Security** | **45-47** | **3** |
| **Documentation** | **48-49** | **2** |

**Total: 49 Rules**

---

## Testing & Quality Assurance

### 50. Comprehensive Testing Requirements
- **Rule**: Every feature must have appropriate test coverage
- **Unit Tests**: Business logic, utilities, calculations (fee computation, grade calculations)
- **Integration Tests**: API endpoints, database queries
- **E2E Tests**: Critical user flows using Playwright
  - Student admission workflow
  - Fee payment and receipt generation
  - Attendance marking and reporting
  - Discount/waiver approval flow
- **Coverage Targets**:
  - Business logic: 80%+ coverage
  - API routes: 60%+ coverage
  - Critical paths: 100% coverage
- **Test Structure**:
  ```
  /src/__tests__/unit/
  /src/__tests__/integration/
  /src/__tests__/e2e/
  /src/app/api/fees/__tests__/route.test.ts (co-located)
  ```
- **CI/CD**: Tests must pass before merge

### 51. Code Review Checklist
- **Rule**: Every PR must follow the review checklist
- **Checklist Template**:
  ```markdown
  ## Code Review Checklist
  
  - [ ] Rule 1: No `alert()` - using `showToast()`
  - [ ] Rule 21: `schoolId` filtering applied
  - [ ] Rule 24: Soft delete implemented (not hard delete)
  - [ ] Rule 35: No `@ts-nocheck` or `@ts-ignore`
  - [ ] Rule 36: No dummy/test code left
  - [ ] Rule 37: No placeholders - real logic implemented
  - [ ] Rule 39: Input validation with Zod
  - [ ] Rule 42: Database indexes added if needed
  - [ ] Tests added/updated
  - [ ] Build passes (`npm run build`)
  - [ ] Mobile-responsive (Rule 22)
  - [ ] Dark mode support (Rule 32)
  ```
- **Required Approvers**: At least 1 senior developer for critical paths

---

## Compliance & Privacy

### 52. GDPR & Student Data Privacy Compliance
- **Rule**: All student data handling must comply with privacy regulations
- **Requirements**:
  - **Data Minimization**: Only collect necessary data
  - **Consent Tracking**: Record consent for data processing
  - **Right to Deletion**: Implement student data deletion (anonymize, don't hard delete)
  - **Data Export**: Allow parents/students to download their data
  - **Access Logs**: Track who accessed which student data (Rule 46 audit logging)
- **Sensitive Data Handling**:
  - Encrypt PII at rest (addresses, phone numbers, Aadhar)
  - Mask in logs: `phone: "+91******1234"`
  - Never log passwords, tokens, or payment details
- **Retention Policy**:
  - Active students: Retain indefinitely
  - Alumni: Archive after 5 years, delete after 7 years
  - Audit logs: Retain for 7 years
- **Privacy by Design**: Default to least permissive data access

---

## Operations & Monitoring

### 53. Feature Flags for Safe Rollouts
- **Rule**: Major features must be behind feature flags for gradual rollout
- **Implementation**:
  - Use LaunchDarkly, Unleash, or env-based flags
  - School-level granularity: enable for specific schools first
  - User-level: beta users, admin-only, gradual percentage rollout
- **Flag Structure**:
  ```typescript
  const features = {
    newAttendanceSystem: isEnabled('new-attendance', schoolId),
    bulkFeeAssignmentV2: isEnabled('bulk-fee-v2', schoolId),
    parentPortalBeta: isEnabled('parent-portal', userId),
  };
  ```
- **Cleanup**: Remove flag code after 100% rollout for 2 weeks

### 54. Structured Logging with Correlation IDs
- **Rule**: All logs must be structured JSON with request correlation
- **Format**:
  ```json
  {
    "timestamp": "2024-01-15T10:30:00Z",
    "level": "info|warn|error",
    "message": "Student fee calculated",
    "correlationId": "req_abc123",
    "userId": "user_xyz",
    "schoolId": "sch_789",
    "action": "fee_calculation",
    "entity": "Student",
    "entityId": "stu_456",
    "duration_ms": 45,
    "metadata": { "amount": 5000, "discount": 500 }
  }
  ```
- **Requirements**:
  - Include `correlationId` for tracing requests across services
  - Log all mutations with before/after values
  - Use appropriate log levels (error for 5xx, warn for 4xx, info for operations)
  - Never log passwords, tokens, PII
- **Tools**: Winston, Pino, or structured logging compatible with ELK/Loki

### 55. SLA Monitoring and Alerting
- **Rule**: Monitor API performance and uptime with automated alerts
- **SLA Targets**:
  - Uptime: 99.9% (max 43 min downtime/month)
  - API Response Time: P95 < 500ms, P99 < 1000ms
  - Database Query Time: P95 < 100ms
- **Monitoring**:
  - Dashboard: Grafana/Datadog showing response times, error rates
  - Alerts: PagerDuty/Opsgenie for 5xx errors > 1%, latency > 1s
  - Heartbeat: `/api/health` endpoint (Rule 47)
- **Incident Response**:
  - On-call rotation for production issues
  - Runbooks for common failures (DB down, Redis down)
  - Post-mortems for all incidents

---

## Database & Infrastructure

### 56. Safe Database Migrations
- **Rule**: Never drop columns or data in migrations - use additive-only approach
- **Safe Migration Pattern**:
  ```sql
  -- Step 1: Add new column (deploy)
  ALTER TABLE "Student" ADD COLUMN "new_field" VARCHAR(255);
  
  -- Step 2: Backfill data (deploy)
  UPDATE "Student" SET "new_field" = "old_field";
  
  -- Step 3: Update app to use new_field (deploy)
  -- Step 4: After 30 days, remove old_field (deploy)
  ```
- **Never Do**:
  - `DROP COLUMN` in single migration
  - `DELETE FROM` without WHERE clause
  - `ALTER TABLE` on large tables during peak hours
- **Best Practices**:
  - Run migrations during low-traffic windows
  - Test migrations on copy of production data
  - Keep migrations reversible (down script)
  - Use `prisma migrate` for schema, custom SQL for data migrations

### 57. Automated Data Backup Strategy
- **Rule**: Automated daily backups with 30-day retention minimum
- **Backup Requirements**:
  - **Database**: Daily full backup, hourly incremental (WAL for PostgreSQL)
  - **File Storage**: Daily backup of uploaded files (S3 versioning)
  - **Retention**: 30 days daily, 12 monthly, 7 yearly
  - **Encryption**: Backups encrypted at rest (AES-256)
  - **Off-site**: Replicate to different region/availability zone
- **Testing**:
  - Monthly restore test on isolated environment
  - Documented RTO (Recovery Time Objective): < 4 hours
  - Documented RPO (Recovery Point Objective): < 1 hour
- **Monitoring**: Alert if backup fails or is stale (> 25 hours old)

---

## Updated Rule Summary

| Category | Rules | Count |
|----------|-------|-------|
| Code Quality | 1, 3-7, 16-17, 29, 35, 37 | 11 |
| Performance | 14, 42-44 | 4 |
| Security | 18, 21, 38-39, 45-47 | 7 |
| SaaS | 20-21 | 2 |
| UI/UX | 22, 30-32 | 4 |
| Data Ops | 23-24 | 2 |
| Real-Time | 25-28 | 4 |
| Verification | 29 | 1 |
| Structure | 30-31 | 2 |
| Type Safety | 35 | 1 |
| Production Cleanup | 36-37 | 2 |
| API & Backend | 38-41 | 4 |
| Documentation | 48-49 | 2 |
| **Testing & QA** | **50-51** | **2** |
| **Compliance** | **52** | **1** |
| **Operations** | **53-55** | **3** |
| **Infrastructure** | **56-57** | **2** |

---

## API Patterns & Consistency

### 58. Service Layer Architecture
- **Rule**: Business logic must be in service files (`/lib/services/`), not directly in API routes
- **Pattern**: API routes handle HTTP layer (request/response), services handle business logic
- **Structure**:
  ```
  /lib/services/studentService.ts    # Business logic
  /lib/services/feeService.ts       # Fee calculations
  /lib/services/refundService.ts    # Refund operations
  ```
- **API Route Pattern**:
  ```typescript
  // ❌ Bad - Business logic in route
  export async function POST(req: Request) {
    const body = await req.json();
    const result = body.amount * 0.1; // Business logic here
    await prisma.record.create({ data: result });
  }
  
  // ✅ Good - Delegate to service
  export async function POST(req: Request) {
    const body = await req.json();
    const result = await studentService.createStudent(body); // Business logic in service
    return Response.json(result);
  }
  ```
- **Benefits**: Testable business logic, reusable services, cleaner API routes

### 59. Response Caching Strategy
- **Rule**: All GET endpoints must set appropriate Cache-Control headers
- **Cache Patterns**:
  ```typescript
  // Static data (rarely changes): 5 minutes
  response.headers.set('Cache-Control', 'public, max-age=300');
  
  // Dynamic data (changes occasionally): 60 seconds with stale-while-revalidate
  response.headers.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=120');
  response.headers.set('CDN-Cache-Control', 'max-age=300');
  
  // User-specific data (no CDN cache): private
  response.headers.set('Cache-Control', 'private, max-age=60');
  
  // Real-time data (no cache)
  response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  ```
- **CDN Support**: Add `CDN-Cache-Control` for edge caching
- **Invalidate**: Clear cache on mutations using cache keys

### 60. Consistent Error Response Format
- **Rule**: All API errors must use structured JSON with `error`, `message`, `code`, `details`
- **Required Format**:
  ```typescript
  {
    error: 'VALIDATION_FAILED',        // Machine-readable code
    message: 'Student ID is required', // Human-readable message
    code: 'E001',                       // Error code for reference
    details: {                          // Additional context
      field: 'studentId',
      provided: null,
      expected: 'string'
    },
    requestId: 'req_abc123',            // For tracking
    timestamp: '2024-01-15T10:30:00Z'
  }
  ```
- **Error Code Categories**:
  - `E1xx`: Validation errors
  - `E2xx`: Authentication errors
  - `E3xx`: Authorization errors
  - `E4xx`: Not found errors
  - `E5xx`: Business logic errors
  - `E9xx`: Internal server errors
- **Never**: Return plain strings or raw stack traces

---

## Code Quality Patterns

### 61. No `any` Type Casting for Prisma
- **Rule**: Stop using `(schoolPrisma as any).ModelName` - use proper typing
- **Current Issue**: Every API route uses `(schoolPrisma as any)` pattern
- **Solutions**:
  1. **Export typed client** from `/lib/prisma.ts`:
     ```typescript
     export const prisma = schoolPrisma as PrismaClient;
     ```
  2. **Use proper imports**:
     ```typescript
     import { prisma } from '@/lib/prisma';
     await prisma.student.findMany(); // No 'as any' needed
     ```
  3. **Type augmentation** if needed:
     ```typescript
     type ExtendedPrisma = PrismaClient & { 
       Fine: typeof schoolPrisma extends { Fine: infer T } ? T : never 
     };
     ```
- **Enforcement**: ESLint rule `@typescript-eslint/no-explicit-any` with exceptions documented

### 62. Unified Session Authentication
- **Rule**: All API routes must use `getSessionContext()` from `@/lib/apiAuth`
- **Current Inconsistency**: Some routes use `getServerSession(authOptions)` directly
- **Required Pattern**:
  ```typescript
  import { getSessionContext } from '@/lib/apiAuth';
  
  export async function GET(req: Request) {
    const { ctx, error } = await getSessionContext();
    if (error) return error; // Returns 401 if not authenticated
    
    // ctx.schoolId, ctx.userId, ctx.role, ctx.permissions available
    const data = await prisma.record.findMany({
      where: { schoolId: ctx.schoolId } // Tenant isolation
    });
  }
  ```
- **Benefits**: Consistent tenant context, permissions caching, single source of truth

### 63. Permission Check Middleware
- **Rule**: Add RBAC checks after authentication: `can('manage_students')` before operations
- **Current Gap**: Many routes authenticate but don't check specific permissions
- **Required Pattern**:
  ```typescript
  import { getSessionContext } from '@/lib/apiAuth';
  import { can } from '@/lib/permissions';
  
  export async function POST(req: Request) {
    const { ctx, error } = await getSessionContext();
    if (error) return error;
    
    // Check permission
    if (!can(ctx.permissions, 'manage_students')) {
      return Response.json(
        { error: 'FORBIDDEN', message: 'You do not have permission to manage students' },
        { status: 403 }
      );
    }
    
    // Proceed with operation
  }
  ```
- **Permission Granularity**: `view_students`, `manage_students`, `delete_students`, etc.

---

## Database & Data Patterns

### 64. Foreign Key Constraint Handling
- **Rule**: Always check for related records before DELETE operations
- **Pattern**:
  ```typescript
  // Check for related records before deletion
  const relatedCount = await prisma.feeRecord.count({
    where: { feeStructureId: id }
  });
  
  if (relatedCount > 0) {
    return Response.json({ 
      error: 'CONSTRAINT_VIOLATION',
      message: 'Cannot delete fee structure',
      details: `Used by ${relatedCount} fee record(s). Delete fee records first.`,
      code: 'E400'
    }, { status: 400 });
  }
  
  // Safe to delete
  await prisma.feeStructure.delete({ where: { id } });
  ```
- **Cascade Alternative**: Offer cascade delete option with explicit confirmation
- **Soft Delete Preference**: Use soft delete (Rule 24) instead of hard delete when possible

### 65. Upsert Pattern for Settings/Config
- **Rule**: Use `upsert` for school settings with composite unique keys
- **Pattern**:
  ```prisma
  // Schema with composite unique key
  model LeaveSettings {
    schoolId       String
    academicYearId String
    // ... other fields
    
    @@unique([schoolId, academicYearId])
  }
  ```
  ```typescript
  // Upsert pattern
  const settings = await prisma.leaveSettings.upsert({
    where: {
      schoolId_academicYearId: {
        schoolId: ctx.schoolId,
        academicYearId
      }
    },
    update: { /* fields to update */ },
    create: { /* default values for new record */ }
  });
  ```
- **Benefits**: Atomic create-or-update, handles race conditions

### 66. JSON Field Handling
- **Rule**: Always serialize/deserialize JSON fields explicitly with error handling
- **Pattern - Saving**:
  ```typescript
  const data = await prisma.settings.create({
    data: {
      workingDays: JSON.stringify([1, 2, 3, 4, 5]),
      halfDayRules: JSON.stringify({ enabled: true, countAsFullDay: false })
    }
  });
  ```
- **Pattern - Reading**:
  ```typescript
  const settings = await prisma.settings.findUnique({ where: { id } });
  
  // Safe parsing with defaults
  let workingDays: number[] = [1, 2, 3, 4, 5]; // default
  try {
    workingDays = JSON.parse(settings.workingDays);
  } catch {
    // Use default if parse fails
  }
  ```
- **Never**: Store raw objects without JSON.stringify, assume JSON fields are always valid

---

## Security & Validation

### 67. Input Sanitization
- **Rule**: All user inputs must be sanitized (XSS prevention)
- **Pattern**: Use `validateInput()` from `@/lib/apiSecurity` on all text inputs
  ```typescript
  import { validateInput, validateSearchQuery } from '@/lib/apiSecurity';
  
  // Sanitize search queries
  const search = validateSearchQuery(searchParams.get('search') || '');
  
  // Sanitize text inputs
  const reason = validateInput(body.reason, 500);
  const name = validateInput(body.name, 100);
  ```
- **What Gets Removed**:
  - HTML tags: `<script>`, `<iframe>`, etc.
  - JavaScript protocols: `javascript:`
  - Event handlers: `onerror=`, `onclick=`, etc.
- **Current Gap**: Many routes don't sanitize search queries or text fields

### 68. Date Range Validation
- **Rule**: All date range queries must be validated (max 1 year range)
- **Pattern**: Use `validateDateRange()` from `@/lib/apiSecurity`
  ```typescript
  import { validateDateRange } from '@/lib/apiSecurity';
  
  const dateValidation = validateDateRange(
    searchParams.get('dateFrom'),
    searchParams.get('dateTo')
  );
  
  if (dateValidation.error) {
    return Response.json(
      { error: 'INVALID_DATE_RANGE', message: dateValidation.error },
      { status: 400 }
    );
  }
  
  // Use validated dates
  const { dateFrom, dateTo } = dateValidation;
  ```
- **Limits**: Max 1 year range, validates date formats, prevents future dates
- **Prevents**: Performance issues from massive date ranges, invalid queries

### 69. Duplicate Check Pattern
- **Rule**: Check for duplicates before creating records with unique constraints
- **Pattern**:
  ```typescript
  // Check for existing record
  const existing = await prisma.refundRequest.findFirst({
    where: {
      schoolId: ctx.schoolId,
      studentId,
      sourceId,
      sourceType,
      status: { not: 'rejected' }
    }
  });
  
  if (existing) {
    return Response.json({ 
      error: 'DUPLICATE_REQUEST',
      message: 'Refund request already exists for this source',
      details: {
        existingId: existing.id,
        existingStatus: existing.status,
        createdAt: existing.createdAt
      },
      code: 'E409'
    }, { status: 409 });
  }
  
  // Safe to create
  const refund = await prisma.refundRequest.create({ data: { ... } });
  ```
- **HTTP Status**: Return `409 Conflict` for duplicates with existing record details

---

## Updated Rule Summary

| Category | Rules | Count |
|----------|-------|-------|
| Code Quality | 1, 3-7, 16-17, 29, 35, 37, 61 | 12 |
| Performance | 14, 42-44, 59 | 5 |
| Security | 18, 21, 38-39, 45-47, 63, 67 | 9 |
| SaaS | 20-21 | 2 |
| UI/UX | 22, 30-32 | 4 |
| Data Ops | 23-24 | 2 |
| Real-Time | 25-28 | 4 |
| Verification | 29 | 1 |
| Structure | 30-31 | 2 |
| Type Safety | 35, 61 | 2 |
| Production Cleanup | 36-37 | 2 |
| API & Backend | 38-41, 58-60, 62 | 9 |
| Documentation | 48-49 | 2 |
| Testing & QA | 50-51 | 2 |
| Compliance | 52 | 1 |
| Operations | 53-55 | 3 |
| Infrastructure | 56-57 | 2 |
| Database Patterns | 64-66, 68, 69 | 5 |

**Total: 69 Rules**
