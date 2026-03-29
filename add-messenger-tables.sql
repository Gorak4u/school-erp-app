-- Add Messenger Tables to School ERP Database
-- Run this script directly in your Neon database console or via psql

-- Set schema
SET search_path TO school, saas, public;

-- MessengerConversation Table
CREATE TABLE IF NOT EXISTS school."MessengerConversation" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "conversationKey" VARCHAR(255),
    "conversationType" TEXT NOT NULL DEFAULT 'direct',
    "title" TEXT,
    "description" TEXT,
    "avatar" TEXT,
    "createdBy" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastMessagePreview" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MessengerConversation_pkey" PRIMARY KEY ("id")
);

-- MessengerConversationParticipant Table
CREATE TABLE IF NOT EXISTS school."MessengerConversationParticipant" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "participantRole" TEXT NOT NULL DEFAULT 'member',
    "status" TEXT NOT NULL DEFAULT 'active',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),
    "lastReadAt" TIMESTAMP(3),
    "lastReadMessageId" TEXT,
    "unreadCount" INTEGER NOT NULL DEFAULT 0,
    "isMuted" BOOLEAN NOT NULL DEFAULT false,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "MessengerConversationParticipant_pkey" PRIMARY KEY ("id")
);

-- MessengerMessage Table
CREATE TABLE IF NOT EXISTS school."MessengerMessage" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "messageType" TEXT NOT NULL DEFAULT 'text',
    "body" TEXT NOT NULL,
    "attachments" JSONB,
    "replyToId" TEXT,
    "editVersion" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "editedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MessengerMessage_pkey" PRIMARY KEY ("id")
);

-- MessengerMessageReadReceipt Table
CREATE TABLE IF NOT EXISTS school."MessengerMessageReadReceipt" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MessengerMessageReadReceipt_pkey" PRIMARY KEY ("id")
);

-- MessengerMessageReaction Table
CREATE TABLE IF NOT EXISTS school."MessengerMessageReaction" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reaction" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MessengerMessageReaction_pkey" PRIMARY KEY ("id")
);

-- Indexes for MessengerConversation
CREATE UNIQUE INDEX IF NOT EXISTS "MessengerConversation_schoolId_conversationKey_key" ON school."MessengerConversation"("schoolId", "conversationKey");
CREATE INDEX IF NOT EXISTS "MessengerConversation_schoolId_idx" ON school."MessengerConversation"("schoolId");
CREATE INDEX IF NOT EXISTS "MessengerConversation_schoolId_conversationType_idx" ON school."MessengerConversation"("schoolId", "conversationType");
CREATE INDEX IF NOT EXISTS "MessengerConversation_schoolId_status_idx" ON school."MessengerConversation"("schoolId", "status");
CREATE INDEX IF NOT EXISTS "MessengerConversation_schoolId_lastMessageAt_idx" ON school."MessengerConversation"("schoolId", "lastMessageAt" DESC);

-- Indexes for MessengerConversationParticipant
CREATE UNIQUE INDEX IF NOT EXISTS "MessengerConversationParticipant_conversationId_userId_key" ON school."MessengerConversationParticipant"("conversationId", "userId");
CREATE INDEX IF NOT EXISTS "MessengerConversationParticipant_schoolId_userId_idx" ON school."MessengerConversationParticipant"("schoolId", "userId");
CREATE INDEX IF NOT EXISTS "MessengerConversationParticipant_schoolId_conversationId_idx" ON school."MessengerConversationParticipant"("schoolId", "conversationId");
CREATE INDEX IF NOT EXISTS "MessengerConversationParticipant_schoolId_status_idx" ON school."MessengerConversationParticipant"("schoolId", "status");

-- Indexes for MessengerMessage
CREATE INDEX IF NOT EXISTS "MessengerMessage_schoolId_idx" ON school."MessengerMessage"("schoolId");
CREATE INDEX IF NOT EXISTS "MessengerMessage_schoolId_conversationId_createdAt_idx" ON school."MessengerMessage"("schoolId", "conversationId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "MessengerMessage_schoolId_senderId_idx" ON school."MessengerMessage"("schoolId", "senderId");
CREATE INDEX IF NOT EXISTS "MessengerMessage_schoolId_status_idx" ON school."MessengerMessage"("schoolId", "status");

-- Indexes for MessengerMessageReadReceipt
CREATE UNIQUE INDEX IF NOT EXISTS "MessengerMessageReadReceipt_messageId_userId_key" ON school."MessengerMessageReadReceipt"("messageId", "userId");
CREATE INDEX IF NOT EXISTS "MessengerMessageReadReceipt_schoolId_userId_idx" ON school."MessengerMessageReadReceipt"("schoolId", "userId");
CREATE INDEX IF NOT EXISTS "MessengerMessageReadReceipt_schoolId_messageId_idx" ON school."MessengerMessageReadReceipt"("schoolId", "messageId");

-- Indexes for MessengerMessageReaction
CREATE UNIQUE INDEX IF NOT EXISTS "MessengerMessageReaction_messageId_userId_reaction_key" ON school."MessengerMessageReaction"("messageId", "userId", "reaction");
CREATE INDEX IF NOT EXISTS "MessengerMessageReaction_schoolId_messageId_idx" ON school."MessengerMessageReaction"("schoolId", "messageId");
CREATE INDEX IF NOT EXISTS "MessengerMessageReaction_schoolId_userId_idx" ON school."MessengerMessageReaction"("schoolId", "userId");

-- Foreign Keys for MessengerConversation
DO $$ BEGIN
    ALTER TABLE school."MessengerConversation" ADD CONSTRAINT "MessengerConversation_schoolId_fkey" 
    FOREIGN KEY ("schoolId") REFERENCES saas."School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE school."MessengerConversation" ADD CONSTRAINT "MessengerConversation_createdBy_fkey" 
    FOREIGN KEY ("createdBy") REFERENCES school."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Foreign Keys for MessengerConversationParticipant
DO $$ BEGIN
    ALTER TABLE school."MessengerConversationParticipant" ADD CONSTRAINT "MessengerConversationParticipant_schoolId_fkey" 
    FOREIGN KEY ("schoolId") REFERENCES saas."School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE school."MessengerConversationParticipant" ADD CONSTRAINT "MessengerConversationParticipant_conversationId_fkey" 
    FOREIGN KEY ("conversationId") REFERENCES school."MessengerConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE school."MessengerConversationParticipant" ADD CONSTRAINT "MessengerConversationParticipant_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES school."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Foreign Keys for MessengerMessage
DO $$ BEGIN
    ALTER TABLE school."MessengerMessage" ADD CONSTRAINT "MessengerMessage_schoolId_fkey" 
    FOREIGN KEY ("schoolId") REFERENCES saas."School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE school."MessengerMessage" ADD CONSTRAINT "MessengerMessage_conversationId_fkey" 
    FOREIGN KEY ("conversationId") REFERENCES school."MessengerConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE school."MessengerMessage" ADD CONSTRAINT "MessengerMessage_senderId_fkey" 
    FOREIGN KEY ("senderId") REFERENCES school."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE school."MessengerMessage" ADD CONSTRAINT "MessengerMessage_replyToId_fkey" 
    FOREIGN KEY ("replyToId") REFERENCES school."MessengerMessage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Foreign Keys for MessengerMessageReadReceipt
DO $$ BEGIN
    ALTER TABLE school."MessengerMessageReadReceipt" ADD CONSTRAINT "MessengerMessageReadReceipt_schoolId_fkey" 
    FOREIGN KEY ("schoolId") REFERENCES saas."School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE school."MessengerMessageReadReceipt" ADD CONSTRAINT "MessengerMessageReadReceipt_messageId_fkey" 
    FOREIGN KEY ("messageId") REFERENCES school."MessengerMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE school."MessengerMessageReadReceipt" ADD CONSTRAINT "MessengerMessageReadReceipt_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES school."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Foreign Keys for MessengerMessageReaction
DO $$ BEGIN
    ALTER TABLE school."MessengerMessageReaction" ADD CONSTRAINT "MessengerMessageReaction_schoolId_fkey" 
    FOREIGN KEY ("schoolId") REFERENCES saas."School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE school."MessengerMessageReaction" ADD CONSTRAINT "MessengerMessageReaction_messageId_fkey" 
    FOREIGN KEY ("messageId") REFERENCES school."MessengerMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE school."MessengerMessageReaction" ADD CONSTRAINT "MessengerMessageReaction_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES school."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Success message
DO $$ BEGIN
    RAISE NOTICE 'Messenger tables created successfully!';
END $$;
