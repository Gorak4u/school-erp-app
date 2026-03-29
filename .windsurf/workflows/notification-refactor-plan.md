# Notification System Refactor - Implementation Plan

## Overview
Consolidate all notification functionality into `queueCommunicationOutbox()` with unified flow:
- All channels (in-app, email, SMS) go through CommunicationOutbox
- In-App Worker delivers immediately with Socket.IO
- Cron Job delivers email/SMS asynchronously
- Settings checked at queue time and delivery time

## Architecture

```
API Route
    ↓
queueCommunicationOutbox() → Checks settings → Creates pending entries
    ↓
├─► In-App Worker (immediate): Notification table + Socket.IO
│
└─► Cron Job (async): Email/SMS delivery
```

## Implementation Steps

### Step 1: Update queueCommunicationOutbox()
**File:** `src/lib/communicationOutbox.ts`

**Changes:**
1. Add settings check at function start:
   - Query `enable_notifications` setting
   - If 'false', return early (create nothing)

2. For notification param:
   - If `enable_notifications='true'`, create outbox entry with `channel='in_app', status='pending'`
   - Remove immediate `Notification.create()` call

3. For email:
   - If `email` param provided → create entry (forced)
   - Else if `email_notifications='true'` AND user has email → create entry (auto)

4. For SMS:
   - If `sms` param provided → create entry (forced)
   - Else if `sms_notifications='true'` AND user has phone → create entry (auto)

5. Remove duplicate `Notification.create()` - only create CommunicationOutbox entries

### Step 2: Create In-App Worker
**File:** `src/lib/communicationOutboxProcessor.ts` (new file)

**Function:** `processInAppNotifications(schoolId: string)`

**Logic:**
1. Query CommunicationOutbox:
   ```sql
   WHERE channel='in_app' 
   AND status='pending' 
   AND schoolId=:schoolId
   ```

2. Check setting: `enable_notifications`
   - If 'false', skip all entries

3. For each entry:
   - Create Notification table entry
   - Emit Socket.IO: `emitToUser(userId, 'notification', data)`
   - Update CommunicationOutbox: `status='sent', deliveredAt=NOW()`

### Step 3: Update Cron Job
**File:** `src/lib/cron/jobs/process-communication-outbox-job.ts`

**Changes:**
1. Add filter: `WHERE channel IN ('email', 'sms')` (skip in_app)
2. For each entry, check school settings before processing
3. Keep retry logic (max 3 attempts)
4. Update status to 'sent' or 'failed'

### Step 4: Remove notificationService.ts Functions
**File:** `src/lib/notificationService.ts`

**Changes:**
1. Remove `sendNotification()` function
2. Remove `sendNotificationToApprovers()` function
3. Keep only helper functions if used elsewhere
4. Remove Socket.IO emit from this file (moved to In-App Worker)

### Step 5: Update API Routes
**Files:**
- `src/app/api/fines/waiver-requests/route.ts`
- `src/app/api/transport/approvals/[id]/complete/route.ts`
- `src/app/api/transport/students/[id]/route.ts`

**Changes:**
Replace `sendNotification()` or `sendNotificationToApprovers()` with:
```typescript
await queueCommunicationOutbox({
  notification: { userId, schoolId, type, title, message, priority, metadata }
});
await processInAppNotifications(schoolId); // Immediate delivery
```

## Data Flow Examples

### Example 1: Settings enabled
```
enable_notifications='true'
email_notifications='true'

queueCommunicationOutbox({notification}) creates:
- CommunicationOutbox: channel='in_app', status='pending'
- CommunicationOutbox: channel='email', status='pending'

In-App Worker (immediate):
- Creates Notification table entry
- Emits Socket.IO
- Marks in_app as 'sent'

Cron Job (async):
- Sends email
- Marks email as 'sent'
```

### Example 2: Settings disabled
```
enable_notifications='false'

queueCommunicationOutbox({notification}) creates:
- NOTHING (returns early)

No entries processed.
```

## Testing Checklist

- [ ] In-app notification appears immediately when settings enabled
- [ ] No entries created when `enable_notifications='false'`
- [ ] Email sent via cron when `email_notifications='true'`
- [ ] Socket.IO real-time updates working
- [ ] Notification bell shows unread count
- [ ] Mark as read functionality works
- [ ] No duplicate notifications
- [ ] Build passes without errors

## Rollback Plan

If issues occur:
1. Keep `sendNotification()` as backup (don't delete yet)
2. Feature flag to switch between old/new implementation
3. Monitor logs for errors

## Files Modified

1. `src/lib/communicationOutbox.ts` - Updated
2. `src/lib/communicationOutboxProcessor.ts` - NEW
3. `src/lib/notificationService.ts` - Reduced
4. `src/lib/cron/jobs/process-communication-outbox-job.ts` - Updated
5. `src/app/api/fines/waiver-requests/route.ts` - Updated
6. `src/app/api/transport/approvals/[id]/complete/route.ts` - Updated
7. `src/app/api/transport/students/[id]/route.ts` - Updated
