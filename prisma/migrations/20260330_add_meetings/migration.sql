-- CreateTable: Scheduled Meetings
CREATE TABLE IF NOT EXISTS "scheduled_meetings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "scheduled_at" TIMESTAMP NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 30,
    "meeting_type" TEXT NOT NULL DEFAULT 'video',
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "conversation_id" TEXT,
    "organizer_id" TEXT NOT NULL,
    "meeting_link" TEXT NOT NULL,
    "recurring_pattern" TEXT,
    "reminder_sent" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("organizer_id") REFERENCES "users"("id") ON DELETE CASCADE
);

-- CreateTable: Meeting Participants
CREATE TABLE IF NOT EXISTS "meeting_participants" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "meeting_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'participant',
    "response_status" TEXT NOT NULL DEFAULT 'pending',
    "joined_at" TIMESTAMP,
    "left_at" TIMESTAMP,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("meeting_id") REFERENCES "scheduled_meetings"("id") ON DELETE CASCADE,
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);

-- CreateTable: Meeting Reminders
CREATE TABLE IF NOT EXISTS "meeting_reminders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "meeting_id" TEXT NOT NULL,
    "reminder_type" TEXT NOT NULL,
    "reminder_time" TIMESTAMP NOT NULL,
    "sent" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("meeting_id") REFERENCES "scheduled_meetings"("id") ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS "idx_meetings_scheduled_at" ON "scheduled_meetings"("scheduled_at");
CREATE INDEX IF NOT EXISTS "idx_meetings_status" ON "scheduled_meetings"("status");
CREATE INDEX IF NOT EXISTS "idx_meetings_organizer" ON "scheduled_meetings"("organizer_id");
CREATE INDEX IF NOT EXISTS "idx_meeting_participants_user" ON "meeting_participants"("user_id");
CREATE INDEX IF NOT EXISTS "idx_meeting_participants_meeting" ON "meeting_participants"("meeting_id");
CREATE INDEX IF NOT EXISTS "idx_reminders_time_sent" ON "meeting_reminders"("reminder_time", "sent");
