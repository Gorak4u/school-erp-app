# Attendance Management & Assignments Management Redesign

## 1. Purpose

This document defines a production-ready redesign for **Attendance Management** and **Assignments Management** in the School ERP.

It is designed to:

- support **premium, world-class UX**
- handle **10M+ records** safely
- integrate **mail + in-app notifications + optional SMS/WhatsApp/push**
- separate **student attendance** and **staff attendance**
- make **staff attendance leave-aware** by integrating with Leave Hub
- provide a realistic migration path from the current codebase

This is an **end-to-end design document** covering:

- UI / UX
- middleware
- APIs
- database design
- notification and email architecture
- scale, reliability, auditability, and rollout

---

## 2. Current-State Findings From Existing Code

### 2.1 Attendance today

Current implementation exists in:

- `src/app/attendance/page.tsx`
- `src/app/api/attendance/route.ts`
- `src/app/api/teachers/[id]/attendance/route.ts`
- `src/app/teachers/components/tabs/TeacherAttendanceTab.tsx`
- `src/lib/apiClient.ts`
- `prisma/schema.prisma` → `AttendanceRecord`

### 2.2 Assignments today

Current implementation exists in:

- `src/app/assignments/page.tsx`
- `src/app/api/teachers/[id]/assignments/route.ts`
- `src/app/teachers/components/tabs/TeacherAssignmentsTab.tsx`
- `prisma/schema.prisma` → `Assignment`, `AssignmentSubmission`

### 2.3 Existing communication primitives

Relevant infrastructure already exists:

- `src/lib/email.ts`
- `src/lib/queues/emailQueue.ts`
- `prisma/schema.prisma` → `Notification`
- `src/lib/apiAuth.ts`

### 2.4 Key gaps in current design

#### Attendance gaps

- Student attendance and staff attendance are not separated into first-class domains.
- Current `AttendanceRecord` stores `date`, `class`, `section`, and `subject` as strings, which is weak for analytics and scale.
- Bulk save uses request-time upserts without idempotency, queueing, or conflict strategy.
- Offset pagination and wide list queries will degrade at high volumes.
- No canonical leave-aware attendance engine for staff.
- No anomaly detection, reconciliation, or approval workflow.

#### Assignment gaps

- Main assignments page is a placeholder with mock stats.
- Teacher-level CRUD exists, but there is no complete institution-wide assignment domain.
- No assignment audience model, no proper recipient resolution, and no durable notification orchestration.
- No dedicated parent/student experience.
- No scalable search, analytics, or asynchronous grading workflows.

#### Messaging gaps

- Email support exists but current queueing is in-process (`setImmediate`), which is not durable.
- Notification persistence exists, but delivery orchestration needs to be expanded.
- No formal outbox / retry / dead-letter design.

---

## 3. Design Goals

### 3.1 Product goals

- Build a **premium, intuitive school operating experience** similar to top modern SIS/LMS products.
- Make the UX fast even on low-end devices and large schools.
- Keep workflows role-specific: admin, principal, coordinator, teacher, student, parent, HR.

### 3.2 Technical goals

- Handle **10M+ attendance and assignment-related records**.
- Support multi-tenant isolation by `schoolId`.
- Preserve audit trails and operational integrity.
- Favor append-only event capture where necessary, and optimized read models for dashboards.
- Keep compatibility with the current Next.js + Prisma stack while allowing targeted raw-SQL migrations for partitioning and performance.

### 3.3 Non-goals for Phase 1

- Full AI grading auto-scoring for subjective answers.
- Real-time proctoring.
- Offline mobile sync with CRDT conflict resolution.

These can be later enhancements.

---

## 4. Product Vision

## 4.1 Attendance Management

Attendance becomes a **dual-domain system**:

- **Student Attendance Hub**
- **Staff Attendance Hub**

Each has its own workflows, analytics, roles, rules, and notifications.

### Student Attendance Hub

Used by:

- class teachers
- subject teachers
- coordinators
- principals
- parents

Core capabilities:

- daily class attendance
- period-wise subject attendance
- late / half-day / excused / medical / on-duty statuses
- attendance corrections with approval trail
- class heatmaps and chronic absentee alerts
- parent notifications for absences/late arrivals
- attendance trends and compliance reports

### Staff Attendance Hub

Used by:

- HR
n- school admin
- principal
- teachers/staff

Core capabilities:

- check-in / check-out / biometric/manual sync
- leave-aware status generation
- approved leave projection from Leave Hub
- half-day and late policies
- substitute coverage suggestions
- staff attendance regularization workflow
- payroll-friendly attendance summaries

## 4.2 Assignments Management

Assignments becomes a **full LMS-style module**:

- assignment authoring
- scheduling
- audience targeting
- attachment handling
- submission tracking
- grading and rubrics
- student and parent notifications
- analytics and intervention workflows

Users:

- teachers create and manage assignments
- students submit work
- parents see due/overdue/submitted state
- admins and coordinators monitor completion and quality

---

## 5. World-Class Feature Set

## 5.1 Attendance features

- separate student and staff attendance modules
- leave-aware staff attendance
- daily, period-wise, and event-wise attendance
- class-level bulk marking with keyboard shortcuts
- biometric integration adapter for staff
- geofenced optional mobile check-in for field staff
- correction request and approval workflow
- anomaly detection:
  - student absent after morning entry
  - repeated late arrivals
  - staff on approved leave but manually marked present
  - attendance not taken by cutoff time
- substitute planning when staff is on approved leave
- attendance scorecards and monthly summaries
- homeroom and section heatmaps
- notification rules by severity and role

## 5.2 Assignments features

- create assignment by class, section, group, house, or individual student
- assignment templates and reusable rubrics
- draft / scheduled / published / closed / graded lifecycle
- file attachments, links, and rich text instructions
- differentiated assignments by learning group
- submission window, grace period, late policy
- plagiarism-check integration placeholder
- rubric grading, inline feedback, re-open submission
- parent visibility toggle
- auto-reminders before due date and after missed deadline
- assignment analytics:
  - completion rate
  - grading turnaround time
  - average score by class/section
  - students at risk of non-submission
- calendar and dashboard integration

## 5.3 Communication features

- in-app notification center
- school SMTP-backed email
- optional SMS/WhatsApp adapter layer
- template library with tenant branding
- delivery logs and retry policy
- quiet hours and digest mode
- role-based escalation rules

---

## 6. Premium UX / UI Design

## 6.1 Design principles

- dashboard-first
- minimal clicks for repeated operations
- clear state hierarchy
- dense but calm information layout
- rich analytics without clutter
- mobile-friendly teacher workflows

## 6.2 Shared visual language

Use a premium design system with:

- glassmorphism only as accent, not as primary readability layer
- high-contrast data tables
- sticky filter bars
- keyboard-friendly bulk actions
- quick command/search palette
- skeleton loading and progressive hydration
- row-level smart actions
- saved views and pinned filters

## 6.3 Attendance IA

### Primary tabs

- `Overview`
- `Students`
- `Staff`
- `Take Attendance`
- `Exceptions`
- `Approvals`
- `Reports`
- `Settings`

### Student Attendance screens

- Overview dashboard
- Daily attendance board
- Period-wise attendance board
- Class/section register
- Student attendance profile timeline
- Absence interventions queue
- Parent communication queue

### Staff Attendance screens

- Staff dashboard
- Check-in/check-out monitor
- Leave overlap monitor
- Regularization requests
- Coverage/substitute planner
- Payroll export summary

## 6.4 Assignment IA

### Primary tabs

- `Overview`
- `Library`
- `Create`
- `Scheduled`
- `Published`
- `Submissions`
- `Grading`
- `Analytics`
- `Settings`

### Teacher experience

- Create assignment wizard
- Assignment board with list/calendar/kanban views
- Submission review workspace
- Rubric grading drawer
- Student progress panel

### Student experience

- Today / upcoming / overdue dashboard
- assignment detail page
- submit / re-submit / comment timeline
- feedback and grade center

### Parent experience

- ward assignments overview
- due soon / overdue alerts
- submission confirmation and grades digest

## 6.5 High-value UX patterns

### Attendance board

- roster left rail
- date and section sticky header
- hotkeys for `P`, `A`, `L`, `H`
- bulk fill and exception override
- auto-save with conflict banner

### Assignment board

- filters for class, subject, due date, teacher, status
- saved smart segments like:
  - due today
  - overdue unsubmitted
  - awaiting grading
  - low completion
- split-pane review with submission preview and grading form

---

## 7. Functional Workflows

## 7.1 Student attendance workflow

1. Teacher opens `Take Attendance`.
2. Selects class, section, date, period.
3. Roster loads from enrollment read model.
4. Default state can be prefilled from last known template or present-all.
5. Teacher marks exceptions.
6. Attendance saves via idempotent bulk command.
7. System publishes events:
   - attendance marked
   - absent notifications
   - daily summary refresh
8. Parent notifications are queued based on policy.
9. Coordinator sees pending anomalies if thresholds are hit.

## 7.2 Staff attendance + Leave Hub workflow

1. Staff leave is approved in Leave Hub.
2. Leave projection job writes attendance exceptions into a staff-attendance projection.
3. On attendance day:
   - approved leave shows as `on_leave`
   - half-day leave shows partial status
   - substitute suggestions appear for teaching staff
4. If staff is checked in despite approved leave, system flags conflict.
5. HR/admin can resolve via regularization.

## 7.3 Assignment creation workflow

1. Teacher opens `Create Assignment` wizard.
2. Chooses scope: class / section / group / student.
3. Adds title, content, rubric, attachments, due date, late policy.
4. Chooses publish timing and notification channels.
5. On publish:
   - recipients are materialized
   - notification outbox entries are created
   - dashboards are updated asynchronously

## 7.4 Submission and grading workflow

1. Student receives notification.
2. Student opens assignment and submits file/text/link.
3. Submission status becomes `submitted`.
4. Teacher sees queue by class and urgency.
5. Teacher grades with rubric and comments.
6. Student and parent receive grade notification based on preferences.

---

## 8. Proposed System Architecture

## 8.1 High-level architecture

```text
Next.js App Router UI
  -> BFF/API routes (auth, validation, orchestration)
    -> Domain services
      -> PostgreSQL (OLTP)
      -> Redis (cache, rate limit, queue metadata)
      -> Durable queue (BullMQ / SQS / RabbitMQ)
      -> Object storage (S3-compatible for attachments)
      -> Search/analytics read models
```

## 8.2 Recommended bounded contexts

### Attendance domain

- `attendance-command-service`
- `attendance-query-service`
- `attendance-policy-service`
- `attendance-anomaly-service`
- `leave-sync-service`
- `attendance-notification-service`

### Assignment domain

- `assignment-command-service`
- `assignment-query-service`
- `assignment-recipient-service`
- `submission-service`
- `grading-service`
- `assignment-notification-service`

### Shared platform services

- `authz-service`
- `template-service`
- `notification-orchestrator`
- `mail-service`
- `audit-service`
- `file-service`

For the current monolith, these can start as **server-side modules within Next.js** and later split physically only if needed.

---

## 9. Middleware Design

## 9.1 Mandatory middleware layers

Every command API should pass through:

- tenant resolution
- authentication
- authorization
- input validation
- idempotency guard
- audit logging
- rate limiting
- request correlation / tracing

## 9.2 Authentication and tenant isolation

Use existing `getSessionContext()` and `tenantWhere(ctx)` patterns as the baseline.

Enhancements:

- require `schoolId` for all attendance/assignment writes
- resolve effective role/permissions once per request
- support impersonation audit when admins act on behalf of teacher/coordinator

## 9.3 Authorization model

Add permissions such as:

- `view_student_attendance`
- `manage_student_attendance`
- `view_staff_attendance`
- `manage_staff_attendance`
- `approve_attendance_regularization`
- `view_assignment_analytics`
- `create_assignments`
- `edit_any_assignment`
- `grade_assignments`
- `view_child_assignments`
- `submit_assignments`

## 9.4 Validation middleware

Use schema validation for every payload.

Examples:

- class/section must belong to school
- due date cannot be before publish date
- attendance bulk payload cannot contain students from mixed schools
- staff attendance leave override requires elevated permission

## 9.5 Idempotency middleware

Required for:

- bulk attendance save
- assignment publish
- bulk reminder send
- grade publish

Implementation:

- client sends `Idempotency-Key`
- server stores keyed result in Redis / DB
- duplicate retries return prior success response

## 9.6 Rate limiting

Apply by:

- user
- school
- route category

Examples:

- attendance writes: medium burst, high sustained
- notification send: low burst, strict backpressure
- export/report endpoints: background job only above threshold

## 9.7 Audit middleware

Use current `AuditLog` direction but expand to school-domain audit records for:

- attendance marked/updated/deleted
- override done
- assignment published/unpublished
- grade changed
- notification resent manually

Audit entries should store:

- actor
- entity type and ID
- action
- before/after snapshot reference
- correlation ID
- timestamp

---

## 10. API Design

## 10.1 API style

Use versioned REST for operational endpoints:

- `/api/v1/attendance/...`
- `/api/v1/assignments/...`

GraphQL is optional later for analytics screens, but not required initially.

## 10.2 Student attendance APIs

### Commands

- `POST /api/v1/attendance/students/bulk-mark`
- `POST /api/v1/attendance/students/regularization-requests`
- `POST /api/v1/attendance/students/approve-regularization`
- `POST /api/v1/attendance/students/recalculate`

### Queries

- `GET /api/v1/attendance/students/roster`
- `GET /api/v1/attendance/students/daily-board`
- `GET /api/v1/attendance/students/student/:studentId/timeline`
- `GET /api/v1/attendance/students/class/:classId/summary`
- `GET /api/v1/attendance/students/anomalies`

## 10.3 Staff attendance APIs

### Commands

- `POST /api/v1/attendance/staff/check-in`
- `POST /api/v1/attendance/staff/check-out`
- `POST /api/v1/attendance/staff/bulk-override`
- `POST /api/v1/attendance/staff/regularization-requests`
- `POST /api/v1/attendance/staff/resolve-conflict`

### Queries

- `GET /api/v1/attendance/staff/daily-board`
- `GET /api/v1/attendance/staff/:staffId/timeline`
- `GET /api/v1/attendance/staff/conflicts`
- `GET /api/v1/attendance/staff/payroll-summary`
- `GET /api/v1/attendance/staff/coverage-recommendations`

## 10.4 Leave-aware attendance APIs

- `POST /api/v1/attendance/staff/leave-sync/run`
- `GET /api/v1/attendance/staff/leave-sync/status`
- `GET /api/v1/attendance/staff/leave-conflicts`

These should read approved leave from canonical Leave Hub tables (`LeaveApplication`, `LeaveBalance`) rather than legacy ad-hoc leave fields.

## 10.5 Assignments APIs

### Assignment commands

- `POST /api/v1/assignments`
- `PUT /api/v1/assignments/:assignmentId`
- `POST /api/v1/assignments/:assignmentId/publish`
- `POST /api/v1/assignments/:assignmentId/close`
- `POST /api/v1/assignments/:assignmentId/reopen`
- `DELETE /api/v1/assignments/:assignmentId`

### Assignment queries

- `GET /api/v1/assignments`
- `GET /api/v1/assignments/:assignmentId`
- `GET /api/v1/assignments/:assignmentId/recipients`
- `GET /api/v1/assignments/:assignmentId/analytics`
- `GET /api/v1/assignments/calendar`

### Submission APIs

- `POST /api/v1/assignments/:assignmentId/submissions`
- `PUT /api/v1/assignments/:assignmentId/submissions/:submissionId`
- `POST /api/v1/assignments/:assignmentId/submissions/:submissionId/grade`
- `POST /api/v1/assignments/:assignmentId/submissions/:submissionId/return`
- `GET /api/v1/assignments/:assignmentId/submissions`

### Reminder/notification APIs

- `POST /api/v1/assignments/:assignmentId/reminders/send`
- `POST /api/v1/assignments/bulk-reminders/send`
- `GET /api/v1/assignments/notification-history`

## 10.6 Query design for scale

Do not use offset pagination for deep large datasets.

Use:

- cursor pagination for timeline/list screens
- pre-aggregated summary endpoints for dashboards
- asynchronous exports for CSV/PDF

---

## 11. Database Design

## 11.1 Core principle

Keep PostgreSQL as the **system of record**, but redesign large-volume tables for:

- partitioning
- proper typed columns
- tenant-aware indexes
- append-heavy writes
- summary tables for read efficiency

## 11.2 Problems in current schema

### Current `AttendanceRecord`

Issues:

- string date instead of `Date` / `DateTime`
- class and section stored as plain strings
- mixed semantics for daily and subject attendance
- no staff attendance equivalent
- no event log or regularization model

### Current `Assignment` / `AssignmentSubmission`

Issues:

- no recipient materialization table
- no notification outbox or delivery tables
- no rubric/version model
- no scheduled publishing model
- no assignment activity timeline

## 11.3 Proposed attendance tables

### `student_attendance_session`

Represents one attendance-taking context.

Fields:

- `id`
- `school_id`
- `academic_year_id`
- `attendance_date`
- `class_id`
- `section_id`
- `period_id` nullable
- `session_type` (`daily`, `period`, `activity`)
- `taken_by_user_id`
- `status` (`draft`, `submitted`, `locked`, `reopened`)
- `source` (`manual`, `import`, `device`, `api`)
- `created_at`, `updated_at`

Indexes:

- `(school_id, attendance_date, class_id, section_id)`
- `(school_id, attendance_date, period_id)`

### `student_attendance_record`

Fields:

- `id`
- `school_id`
- `session_id`
- `student_id`
- `status` (`present`, `absent`, `late`, `half_day`, `excused`, `medical`, `on_duty`)
- `reason_code`
- `remarks`
- `marked_at`
- `marked_by_user_id`
- `version`

Indexes:

- unique `(session_id, student_id)`
- `(school_id, student_id, marked_at desc)`
- `(school_id, status, marked_at desc)`

### `staff_attendance_day`

Fields:

- `id`
- `school_id`
- `staff_id`
- `attendance_date`
- `status` (`present`, `absent`, `on_leave`, `half_day_leave`, `late`, `remote`, `holiday`, `weekoff`)
- `derived_from_leave` boolean
- `source` (`manual`, `device`, `leave_projection`, `regularization`)
- `first_in_at`
- `last_out_at`
- `work_minutes`
- `late_minutes`
- `remarks`
- `version`

Indexes:

- unique `(school_id, staff_id, attendance_date)`
- `(school_id, attendance_date, status)`
- `(school_id, staff_id, attendance_date desc)`

### `attendance_regularization_request`

Fields:

- `id`
- `school_id`
- `entity_type` (`student`, `staff`)
- `entity_id`
- `attendance_record_id`
- `requested_status`
- `requested_reason`
- `requested_by`
- `approved_by`
- `status`
- `created_at`, `resolved_at`

### `attendance_anomaly`

Fields:

- `id`
- `school_id`
- `entity_type`
- `entity_id`
- `anomaly_type`
- `severity`
- `metadata_json`
- `status`
- `detected_at`
- `resolved_at`

## 11.4 Proposed assignments tables

### `assignment`

Enhance current model with:

- typed `publish_at`
- typed `due_at`
- `close_at`
- `audience_type`
- `grading_mode`
- `late_policy`
- `visibility_scope`
- `published_by`
- `is_scheduled`
- `template_id` nullable

Indexes:

- `(school_id, status, due_at desc)`
- `(school_id, teacher_id, created_at desc)`
- `(school_id, class_id, section_id, due_at desc)`

### `assignment_recipient`

Materialized audience membership.

Fields:

- `id`
- `school_id`
- `assignment_id`
- `student_id`
- `recipient_status` (`assigned`, `viewed`, `submitted`, `graded`, `exempted`)
- `due_at`
- `published_at`
- `last_notified_at`

Indexes:

- unique `(assignment_id, student_id)`
- `(school_id, student_id, due_at desc)`
- `(school_id, recipient_status, due_at desc)`

### `assignment_submission`

Enhance current model with:

- typed `submitted_at`
- `attempt_no`
- `submission_type`
- `storage_path`
- `is_late`
- `plagiarism_score` nullable
- `graded_by`
- `graded_at`
- `score`
- `feedback_json`

Indexes:

- `(school_id, assignment_id, submitted_at desc)`
- `(school_id, student_id, submitted_at desc)`
- `(school_id, status, submitted_at desc)`

### `assignment_rubric`

- `id`
- `school_id`
- `assignment_id`
- `version`
- `rubric_json`
- `created_by`
- `created_at`

### `assignment_activity`

Append-only event timeline:

- created
- updated
- published
- reminded
- submitted
- graded
- reopened

## 11.5 Notification and communication tables

### Expand current `Notification`

Current table is useful, but should evolve with:

- `channel` (`in_app`, `email`, `sms`, `push`, `whatsapp`)
- `entity_type`
- `entity_id`
- `delivery_status`
- `template_key`
- `dedupe_key`
- `scheduled_at`
- `delivered_at`
- `failed_at`

### New `communication_outbox`

Durable queue source of truth.

Fields:

- `id`
- `school_id`
- `channel`
- `template_key`
- `recipient_user_id`
- `recipient_address`
- `payload_json`
- `dedupe_key`
- `status` (`pending`, `processing`, `sent`, `failed`, `dead_letter`)
- `attempt_count`
- `next_attempt_at`
- `created_at`

Indexes:

- `(status, next_attempt_at)`
- unique `(channel, dedupe_key)`

## 11.6 Partitioning strategy for 10M+ records

### Attendance tables

Partition by time because access patterns are heavily date-bounded.

Recommended:

- monthly range partitions on `attendance_date`
- include `school_id` in every secondary index

### Submission tables

Partition by `submitted_at` monthly or quarterly once volume grows.

### Analytics

Never compute large dashboard metrics directly from base tables on every request.

Use:

- daily summary tables
- materialized views
- async aggregation jobs

## 11.7 Summary/read models

Create read models such as:

- `student_attendance_daily_summary`
- `class_attendance_daily_summary`
- `staff_attendance_daily_summary`
- `assignment_class_summary`
- `assignment_student_summary`
- `teacher_grading_summary`

These should be updated asynchronously from events or command-side writes.

---

## 12. Scale Strategy For 10M+ Records

## 12.1 Performance rules

- avoid deep offset pagination
- use cursor pagination everywhere large datasets appear
- separate command and query concerns
- precompute dashboard counters
- never send mail synchronously in request path
- batch writes and aggregate reads

## 12.2 Expected scale shape

A realistic 10M-record scenario is reachable through:

- daily student attendance across many schools
- staff attendance history over years
- assignment submissions and activity logs
- notifications and reminder logs

## 12.3 Storage strategy

### Hot storage

- current term attendance
- active assignments
- recent submissions
- pending notifications

### Warm storage

- previous academic years
- completed assignments
- historical analytics

### Cold/archive storage

- raw exports
- old submission attachments
- old notification delivery logs

## 12.4 Query optimization

- use date-scoped queries by default
- require school + date range for operational lists
- use composite indexes aligned to real filters
- move expensive exports to async jobs with downloadable result links

## 12.5 Caching

Use Redis for:

- teacher/class roster snapshots
- assignment dashboard counters
- staff leave projection cache
- permission cache
- idempotency keys

## 12.6 Queueing

Replace current in-process email queue with durable queue infrastructure.

Recommended options:

- BullMQ with Redis for simpler monolith deployment
- SQS/RabbitMQ for more enterprise deployments

## 12.7 Read scaling

Use read replicas for analytics-heavy endpoints when volume increases.

---

## 13. Notification & Mail Architecture

## 13.1 Principles

- notifications are **policy-driven**, not hardcoded inside route handlers
- email is **asynchronous and durable**
- in-app notifications are persisted first
- mail/SMS/push are delivery channels attached to the same event

## 13.2 Events that trigger communication

### Attendance

- student marked absent
- student marked late
- attendance not taken before cutoff
- staff on approved leave today
- staff attendance conflict with leave
- regularization approved/rejected

### Assignments

- assignment published
- due soon reminder
- overdue reminder
- submission received
- graded feedback released
- grading pending escalation

## 13.3 Mail integration

Reuse current `sendSchoolEmail()` capability, but move it behind a durable outbox worker.

### Current state to preserve

- school-level SMTP settings from `SchoolSetting`
- enable/disable notification logic
- school branding in templates

### Required changes

- replace `setImmediate` queueing with durable job queue
- add retry with exponential backoff
- add provider response logging
- add DLQ for repeated failures
- add admin delivery dashboard

## 13.4 Notification preference center

Per user or guardian:

- in-app on/off
- email on/off
- SMS/WhatsApp on/off
- instant vs digest
- quiet hours
- assignment-specific preferences
- attendance-alert severity thresholds

## 13.5 Parent notification examples

- child absent today
- child late to school
- assignment due tomorrow
- assignment overdue
- submission graded

---

## 14. Integration With Leave Hub

## 14.1 Canonical source

Approved staff leave should come from Leave Hub canonical tables and workflows.

Use:

- `LeaveApplication`
- `LeaveBalance`
- leave approval state

Avoid building new leave truth in attendance.

## 14.2 Projection model

A `leave-sync-service` should project approved leave into staff attendance expected state.

Rules:

- full-day approved leave => `on_leave`
- half-day leave => `half_day_leave`
- rejected/cancelled leave => no projection
- overlapping manual attendance => conflict anomaly

## 14.3 Coverage planning

When teaching staff is on approved leave:

- identify affected classes/periods
- suggest substitute teachers
- notify coordinator/principal

---

## 15. Security, Compliance, and Governance

- strict tenant isolation by `schoolId`
- role and permission checks for every write
- audit trail on every override and grade change
- attachment malware scanning hook
- signed URL access for submission attachments
- PII minimization in logs
- configurable retention policies
- FERPA/GDPR-style deletion/export workflows where applicable

---

## 16. Observability & Operations

## 16.1 Metrics

Track:

- attendance write latency
- attendance save conflict rate
- assignment publish latency
- submission ingestion latency
- mail success/failure rate
- notification queue lag
- dashboard query p95/p99

## 16.2 Logs

Every request should carry:

- correlation ID
- school ID
- user ID
- route
- command name

## 16.3 Alerts

Alert on:

- queue backlog
- repeated mail failures
- partition growth anomalies
- high DB slow query count
- attendance sync failures with leave projections

---

## 17. Migration Plan From Current Codebase

## 17.1 Attendance migration

### Current files impacted

- `src/app/attendance/page.tsx`
- `src/app/api/attendance/route.ts`
- `src/app/api/teachers/[id]/attendance/route.ts`
- `src/app/teachers/components/tabs/TeacherAttendanceTab.tsx`
- `prisma/schema.prisma`

### Migration approach

#### Phase A

- keep current UI operational
- introduce new v1 domain endpoints alongside old endpoints
- add typed attendance date/time fields in new tables
- add read models for dashboards

#### Phase B

- route UI reads to new query endpoints
- route writes to new bulk command endpoint
- start leave-aware staff attendance projections

#### Phase C

- deprecate old `AttendanceRecord` write path
- keep legacy read adapter during transition

## 17.2 Assignments migration

### Current files impacted

- `src/app/assignments/page.tsx`
- `src/app/api/teachers/[id]/assignments/route.ts`
- teacher assignment tab routes/components
- `Assignment`, `AssignmentSubmission` schema models

### Migration approach

#### Phase A

- replace placeholder page with real overview shell
- add global assignments query endpoints
- create recipient materialization table

#### Phase B

- migrate publish flow to outbox-backed notifications
- add submission/grade analytics summaries

#### Phase C

- add parent/student portals and reminders

## 17.3 Messaging migration

- keep current `sendSchoolEmail()` implementation
- replace `emailQueue.ts` runtime behavior with durable queue worker
- add `communication_outbox`
- add delivery history UI

---

## 18. Recommended Delivery Phases

## Phase 1: Foundations

- permissions expansion
- v1 API namespace
- notification outbox
- durable email worker
- new attendance/assignment summary read models

## Phase 2: Attendance redesign

- premium attendance dashboards
- student attendance board
- staff attendance board
- leave-aware staff attendance
- regularization workflow

## Phase 3: Assignments redesign

- premium assignment dashboard
- create/publish workflow
- submission center
- grading workspace
- student/parent experience

## Phase 4: Scale hardening

- partitioned tables
- async exports
- queue observability
- read replicas
- archive strategy

---

## 19. Recommended UI Build Breakdown

## Attendance UI modules

- `AttendanceShell`
- `AttendanceOverview`
- `StudentAttendanceBoard`
- `StaffAttendanceBoard`
- `AttendanceExceptionsPanel`
- `AttendanceApprovalsPanel`
- `AttendanceReports`
- `AttendanceSettings`

## Assignments UI modules

- `AssignmentsShell`
- `AssignmentsOverview`
- `AssignmentComposer`
- `AssignmentLibrary`
- `AssignmentBoard`
- `SubmissionReviewWorkspace`
- `GradingDrawer`
- `AssignmentsAnalytics`

## Shared UI modules

- `NotificationCenter`
- `DeliveryStatusBadge`
- `AuditTimeline`
- `SavedViewBar`
- `AdvancedFilterSheet`
- `ExportJobCenter`

---

## 20. Final Recommendations

### Must-do architecture decisions

- separate student and staff attendance into first-class modules
- integrate staff attendance with Leave Hub through a projection service
- replace in-process email queueing with durable outbox + worker
- adopt cursor pagination and pre-aggregated summaries
- introduce new tables for recipient materialization and analytics-friendly attendance
- keep PostgreSQL as source of truth, but use partitioning and summary tables for scale

### Must-do product decisions

- design role-based dashboards instead of one generic page
- provide teacher-first fast marking flows
- provide parent-facing notification clarity
- make assignments lifecycle-driven, not just CRUD-driven

### Must-do operational decisions

- trace all writes
- audit every override/grade change
- make bulk operations idempotent
- move heavy notifications and exports off the request path

---

## 21. Suggested Next Implementation Sequence

1. redesign the **Attendance Management UI shell**
2. introduce **student vs staff attendance architecture in code**
3. add **leave-aware staff attendance projection**
4. replace **Assignments Management placeholder page** with the new premium shell
5. introduce **assignment recipient + notification outbox**
6. harden database and queue layers for 10M+ scale

---

## 22. Executive Summary

The current codebase has a usable starting point for attendance and partial teacher-level assignment flows, but it is not yet structured for premium enterprise school operations or 10M+ record scale.

The recommended redesign is:

- **Attendance** split into **student** and **staff** domains
- **Staff attendance** made **leave-aware** through Leave Hub integration
- **Assignments** upgraded from placeholder/teacher CRUD into a full lifecycle LMS workflow
- **Notifications and email** moved to a durable outbox-based system
- **Database** redesigned with typed fields, partitioning, recipient materialization, and summary read models
- **UI** upgraded to premium dashboards, fast boards, grading workspaces, and parent/student transparency

This design fits your current Next.js + Prisma architecture while creating a clear path to enterprise-grade scale and product quality.
