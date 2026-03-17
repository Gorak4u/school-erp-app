-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "saas";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "school";

-- CreateTable
CREATE TABLE "saas"."School" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "domain" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "pinCode" TEXT,
    "logo" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "School_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saas"."Subscription" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "plan" TEXT NOT NULL DEFAULT 'trial',
    "status" TEXT NOT NULL DEFAULT 'trial',
    "trialEndsAt" TIMESTAMP(3),
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "maxStudents" INTEGER NOT NULL DEFAULT 50,
    "maxTeachers" INTEGER NOT NULL DEFAULT 5,
    "features" TEXT NOT NULL DEFAULT '[]',
    "billingCycle" TEXT NOT NULL DEFAULT 'monthly',
    "price" INTEGER NOT NULL DEFAULT 0,
    "billingEmail" TEXT,
    "paymentMethod" TEXT,
    "paymentId" TEXT,
    "autoRenew" BOOLEAN NOT NULL DEFAULT false,
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "razorpayOrderId" TEXT,
    "razorpayPaymentId" TEXT,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saas"."Invoice" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "description" TEXT,
    "paymentMethod" TEXT,
    "transactionId" TEXT,
    "paidAt" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saas"."Plan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "priceMonthly" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "priceYearly" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "maxStudents" INTEGER NOT NULL DEFAULT 50,
    "maxTeachers" INTEGER NOT NULL DEFAULT 5,
    "features" TEXT NOT NULL DEFAULT '[]',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "trialDays" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "school"."CustomRole" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "permissions" TEXT NOT NULL DEFAULT '[]',
    "schoolId" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saas"."User" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'super_admin',
    "isActive" BOOLEAN DEFAULT true,
    "isSuperAdmin" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saas"."VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(6) NOT NULL,
    "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "saas"."SaasSetting" (
    "id" TEXT NOT NULL,
    "group" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL DEFAULT '',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SaasSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saas"."AuditLog" (
    "id" TEXT NOT NULL,
    "actorEmail" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "target" TEXT,
    "targetName" TEXT,
    "details" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saas"."SaasAnnouncement" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'info',
    "targetPlans" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SaasAnnouncement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saas"."PasswordResetToken" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "school"."Student" (
    "id" TEXT NOT NULL,
    "admissionNo" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "photo" TEXT,
    "class" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "rollNo" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "dateOfBirth" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "phone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "pinCode" TEXT,
    "nationality" TEXT,
    "religion" TEXT,
    "category" TEXT,
    "motherTongue" TEXT,
    "languageMedium" TEXT,
    "bloodGroup" TEXT,
    "aadharNumber" TEXT,
    "stsId" TEXT,
    "board" TEXT,
    "emergencyContact" TEXT,
    "emergencyRelation" TEXT,
    "medicalConditions" TEXT,
    "allergies" TEXT,
    "medications" TEXT,
    "doctorName" TEXT,
    "doctorPhone" TEXT,
    "transport" TEXT,
    "transportRoute" TEXT,
    "hostel" TEXT,
    "sibling" TEXT,
    "siblingName" TEXT,
    "siblingClass" TEXT,
    "parentName" TEXT,
    "parentPhone" TEXT,
    "parentEmail" TEXT,
    "fatherName" TEXT,
    "fatherOccupation" TEXT,
    "fatherPhone" TEXT,
    "fatherEmail" TEXT,
    "motherName" TEXT,
    "motherOccupation" TEXT,
    "motherPhone" TEXT,
    "motherEmail" TEXT,
    "guardianName" TEXT,
    "guardianRelation" TEXT,
    "guardianPhone" TEXT,
    "previousSchool" TEXT,
    "previousClass" TEXT,
    "previousSchoolName" TEXT,
    "previousSchoolAddress" TEXT,
    "previousSchoolPhone" TEXT,
    "previousSchoolEmail" TEXT,
    "transferCertificate" TEXT,
    "transferCertificateNo" TEXT,
    "bankName" TEXT,
    "bankAccountNumber" TEXT,
    "bankIfsc" TEXT,
    "documents" TEXT,
    "gpa" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rank" INTEGER NOT NULL DEFAULT 0,
    "disciplineScore" INTEGER NOT NULL DEFAULT 100,
    "incidents" INTEGER NOT NULL DEFAULT 0,
    "achievements" INTEGER NOT NULL DEFAULT 0,
    "remarks" TEXT,
    "admissionDate" TEXT,
    "enrollmentDate" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "academicYear" TEXT NOT NULL DEFAULT '2024-25',
    "academicYearId" TEXT,
    "schoolId" TEXT,
    "contactPreference" TEXT,
    "employment" TEXT,
    "exitDate" TEXT,
    "exitReason" TEXT,
    "exitRemarks" TEXT,
    "higherEducation" TEXT,
    "mentorshipAreas" TEXT,
    "socialLinks" TEXT,
    "tcNumber" TEXT,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "school"."Teacher" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "gender" TEXT,
    "dateOfBirth" TEXT,
    "subject" TEXT,
    "qualification" TEXT,
    "experience" INTEGER DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "address" TEXT,
    "photo" TEXT,
    "joiningDate" TEXT,
    "salary" DOUBLE PRECISION,
    "department" TEXT,
    "designation" TEXT,
    "bloodGroup" TEXT,
    "aadharNumber" TEXT,
    "bankName" TEXT,
    "bankAccountNo" TEXT,
    "bankIfsc" TEXT,
    "emergencyName" TEXT,
    "emergencyPhone" TEXT,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT,
    "schoolId" TEXT,
    "classTeacherOf" TEXT,
    "isClassTeacher" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Teacher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "school"."ClassTeacherAssignment" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "sectionId" TEXT,
    "boardId" TEXT,
    "mediumId" TEXT,
    "academicYearId" TEXT NOT NULL,
    "assignedDate" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "schoolId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClassTeacherAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "school"."TeacherSchedule" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "sectionId" TEXT,
    "subject" TEXT NOT NULL,
    "dayOfWeek" TEXT NOT NULL,
    "periodNumber" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "roomNumber" TEXT,
    "academicYearId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "schoolId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeacherSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "school"."LessonPlan" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "sectionId" TEXT,
    "date" TEXT NOT NULL,
    "objectives" TEXT,
    "content" TEXT,
    "resources" TEXT,
    "activities" TEXT,
    "homework" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "academicYearId" TEXT,
    "schoolId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LessonPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "school"."Assignment" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "subject" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "sectionId" TEXT,
    "type" TEXT NOT NULL DEFAULT 'homework',
    "dueDate" TEXT NOT NULL,
    "totalMarks" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "instructions" TEXT,
    "attachments" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "academicYearId" TEXT,
    "schoolId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "school"."AssignmentSubmission" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "submittedAt" TEXT,
    "content" TEXT,
    "attachments" TEXT,
    "marks" DOUBLE PRECISION,
    "grade" TEXT,
    "feedback" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssignmentSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "school"."TeacherLeave" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "leaveType" TEXT NOT NULL,
    "fromDate" TEXT NOT NULL,
    "toDate" TEXT NOT NULL,
    "days" DOUBLE PRECISION NOT NULL,
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "remarks" TEXT,
    "schoolId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeacherLeave_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "school"."TeacherNote" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "studentId" TEXT,
    "classId" TEXT,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'general',
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "schoolId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeacherNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "school"."FeeStructure" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "frequency" TEXT NOT NULL,
    "dueDate" INTEGER NOT NULL DEFAULT 1,
    "lateFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "description" TEXT,
    "applicableCategories" TEXT NOT NULL DEFAULT 'all',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "academicYearId" TEXT,
    "boardId" TEXT,
    "classId" TEXT,
    "mediumId" TEXT,
    "schoolId" TEXT,

    CONSTRAINT "FeeStructure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "school"."FeeRecord" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "feeStructureId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "paidAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pendingAmount" DOUBLE PRECISION NOT NULL,
    "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "dueDate" TEXT NOT NULL,
    "paidDate" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "paymentMethod" TEXT,
    "transactionId" TEXT,
    "receiptNumber" TEXT,
    "collectedBy" TEXT,
    "academicYear" TEXT NOT NULL DEFAULT '2024-25',
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeeRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "school"."Payment" (
    "id" TEXT NOT NULL,
    "feeRecordId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "transactionId" TEXT,
    "receiptNumber" TEXT NOT NULL,
    "paymentDate" TEXT NOT NULL,
    "collectedBy" TEXT,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saas"."SubscriptionPayment" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "paymentId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "paymentMethod" TEXT NOT NULL DEFAULT 'razorpay',
    "receiptNumber" TEXT NOT NULL,
    "paymentDate" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "school"."Discount" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "applicableClasses" TEXT NOT NULL,
    "applicableCategories" TEXT NOT NULL,
    "maxDiscountAmount" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "validFrom" TEXT NOT NULL,
    "validTo" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "schoolId" TEXT,

    CONSTRAINT "Discount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "school"."AttendanceRecord" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "teacherId" TEXT,
    "date" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "subject" TEXT,
    "class" TEXT,
    "section" TEXT,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttendanceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "school"."Exam" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "class" TEXT NOT NULL,
    "section" TEXT,
    "subject" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "totalMarks" DOUBLE PRECISION NOT NULL,
    "passingMarks" DOUBLE PRECISION NOT NULL,
    "academicYear" TEXT NOT NULL DEFAULT '2024-25',
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "venue" TEXT,
    "instructions" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "schoolId" TEXT,

    CONSTRAINT "Exam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "school"."ExamResult" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "marksObtained" DOUBLE PRECISION NOT NULL,
    "grade" TEXT,
    "remarks" TEXT,
    "isAbsent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExamResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "school"."Announcement" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'general',
    "targetRoles" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "school"."AcademicYear" (
    "id" TEXT NOT NULL,
    "year" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TEXT NOT NULL,
    "endDate" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcademicYear_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "school"."Medium" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "academicYearId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Medium_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "school"."Class" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "mediumId" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Class_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "school"."Section" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "roomNumber" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "academicYearId" TEXT NOT NULL,

    CONSTRAINT "Section_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "school"."SchoolSetting" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL DEFAULT 'default',
    "group" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchoolSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "school"."Board" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Board_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "school"."SchoolTiming" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "dayOfWeek" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchoolTiming_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "school"."Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "school"."Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "school"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'admin',
    "avatar" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "customRoleId" TEXT,
    "schoolId" TEXT,
    "employeeId" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "school"."VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "school"."DiscountRequest" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "discountType" TEXT NOT NULL,
    "discountValue" DOUBLE PRECISION NOT NULL,
    "maxCapAmount" DOUBLE PRECISION,
    "scope" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "feeStructureIds" TEXT NOT NULL DEFAULT '[]',
    "studentIds" TEXT NOT NULL DEFAULT '[]',
    "classIds" TEXT NOT NULL DEFAULT '[]',
    "sectionIds" TEXT NOT NULL DEFAULT '[]',
    "academicYear" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "supportingDoc" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "requestedBy" TEXT NOT NULL,
    "requestedByEmail" TEXT NOT NULL,
    "requestedByName" TEXT NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedBy" TEXT,
    "approvedByEmail" TEXT,
    "approvedByName" TEXT,
    "approvedAt" TIMESTAMP(3),
    "approvalNote" TEXT,
    "rejectedBy" TEXT,
    "rejectedByEmail" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "appliedBy" TEXT,
    "appliedByEmail" TEXT,
    "appliedAt" TIMESTAMP(3),
    "appliedCount" INTEGER,
    "validFrom" TEXT NOT NULL,
    "validTo" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiscountRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "school"."DiscountApplication" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "discountRequestId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "feeRecordId" TEXT,
    "feeStructureId" TEXT,
    "discountAmount" DOUBLE PRECISION NOT NULL,
    "previousDiscount" DOUBLE PRECISION NOT NULL,
    "isReversed" BOOLEAN NOT NULL DEFAULT false,
    "reversedBy" TEXT,
    "reversedByEmail" TEXT,
    "reversedAt" TIMESTAMP(3),
    "reversalReason" TEXT,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "appliedBy" TEXT NOT NULL,
    "appliedByEmail" TEXT NOT NULL,
    "feeArrearsId" TEXT,

    CONSTRAINT "DiscountApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "school"."DiscountRequestAuditLog" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "discountRequestId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "actorEmail" TEXT NOT NULL,
    "actorName" TEXT NOT NULL,
    "actorRole" TEXT NOT NULL,
    "previousStatus" TEXT,
    "newStatus" TEXT,
    "details" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiscountRequestAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "school"."StudentPromotion" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "fromClass" TEXT NOT NULL,
    "toClass" TEXT NOT NULL,
    "fromSection" TEXT NOT NULL,
    "toSection" TEXT NOT NULL,
    "fromAcademicYear" TEXT NOT NULL,
    "toAcademicYear" TEXT NOT NULL,
    "promotedBy" TEXT NOT NULL,
    "promotedByEmail" TEXT NOT NULL,
    "promotedByName" TEXT NOT NULL,
    "promotionType" TEXT NOT NULL DEFAULT 'regular',
    "arrearsAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "remarks" TEXT,
    "promotionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentPromotion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "school"."FeeArrears" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "originalFeeRecordId" TEXT NOT NULL,
    "fromAcademicYear" TEXT NOT NULL,
    "toAcademicYear" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "paidAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pendingAmount" DOUBLE PRECISION NOT NULL,
    "dueDate" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeeArrears_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "school"."TokenBlacklist" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TokenBlacklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "school"."Vehicle" (
    "id" TEXT NOT NULL,
    "vehicleNumber" TEXT NOT NULL,
    "vehicleType" TEXT NOT NULL DEFAULT 'bus',
    "capacity" INTEGER NOT NULL DEFAULT 40,
    "driverName" TEXT NOT NULL,
    "driverPhone" TEXT NOT NULL,
    "registrationNo" TEXT,
    "insuranceExpiry" TEXT,
    "fitnessExpiry" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "schoolId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "school"."TransportRoute" (
    "id" TEXT NOT NULL,
    "routeNumber" TEXT NOT NULL,
    "routeName" TEXT NOT NULL,
    "description" TEXT,
    "stops" TEXT NOT NULL DEFAULT '[]',
    "vehicleId" TEXT,
    "driverName" TEXT,
    "driverPhone" TEXT,
    "capacity" INTEGER NOT NULL DEFAULT 40,
    "monthlyFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "schoolId" TEXT NOT NULL,
    "academicYearId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransportRoute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "school"."StudentTransport" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "pickupStop" TEXT NOT NULL,
    "dropStop" TEXT,
    "monthlyFee" DOUBLE PRECISION NOT NULL,
    "academicYearId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentTransport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "school"."ExpenseCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "icon" TEXT,
    "parentId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "schoolId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExpenseCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "school"."Expense" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "categoryId" TEXT NOT NULL,
    "dateIncurred" TEXT NOT NULL,
    "paymentMethod" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "receiptUrl" TEXT,
    "receiptNumber" TEXT,
    "vendorName" TEXT,
    "vendorDetails" TEXT,
    "tags" TEXT NOT NULL DEFAULT '[]',
    "requestedBy" TEXT NOT NULL,
    "requestedByName" TEXT,
    "requestedByEmail" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedBy" TEXT,
    "approvedByName" TEXT,
    "approvedAt" TIMESTAMP(3),
    "approvalNote" TEXT,
    "rejectedBy" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "paidBy" TEXT,
    "paidAt" TIMESTAMP(3),
    "remarks" TEXT,
    "academicYear" TEXT NOT NULL DEFAULT '2024-25',
    "academicYearId" TEXT,
    "schoolId" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "school"."Budget" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "spentAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "remainingAmount" DOUBLE PRECISION NOT NULL,
    "categoryId" TEXT,
    "academicYear" TEXT NOT NULL DEFAULT '2024-25',
    "academicYearId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "startDate" TEXT NOT NULL,
    "endDate" TEXT NOT NULL,
    "alertThreshold" DOUBLE PRECISION NOT NULL DEFAULT 80,
    "createdBy" TEXT NOT NULL,
    "createdByName" TEXT,
    "schoolId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Budget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "school"."BudgetItem" (
    "id" TEXT NOT NULL,
    "budgetId" TEXT NOT NULL,
    "expenseId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BudgetItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "school"."ExpenseAuditLog" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "expenseId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "actorEmail" TEXT NOT NULL,
    "actorName" TEXT,
    "actorRole" TEXT,
    "prevStatus" TEXT,
    "newStatus" TEXT,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExpenseAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "school"."Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "metadata" TEXT,
    "schoolId" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "School_slug_key" ON "saas"."School"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "School_domain_key" ON "saas"."School"("domain");

-- CreateIndex
CREATE INDEX "School_slug_idx" ON "saas"."School"("slug");

-- CreateIndex
CREATE INDEX "School_isActive_idx" ON "saas"."School"("isActive");

-- CreateIndex
CREATE INDEX "School_isDemo_idx" ON "saas"."School"("isDemo");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_schoolId_key" ON "saas"."Subscription"("schoolId");

-- CreateIndex
CREATE INDEX "Subscription_plan_idx" ON "saas"."Subscription"("plan");

-- CreateIndex
CREATE INDEX "Subscription_status_idx" ON "saas"."Subscription"("status");

-- CreateIndex
CREATE INDEX "Subscription_trialEndsAt_idx" ON "saas"."Subscription"("trialEndsAt");

-- CreateIndex
CREATE INDEX "Invoice_subscriptionId_idx" ON "saas"."Invoice"("subscriptionId");

-- CreateIndex
CREATE INDEX "Invoice_status_idx" ON "saas"."Invoice"("status");

-- CreateIndex
CREATE INDEX "Invoice_dueDate_idx" ON "saas"."Invoice"("dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "Plan_name_key" ON "saas"."Plan"("name");

-- CreateIndex
CREATE INDEX "Plan_name_idx" ON "saas"."Plan"("name");

-- CreateIndex
CREATE INDEX "Plan_isActive_idx" ON "saas"."Plan"("isActive");

-- CreateIndex
CREATE INDEX "CustomRole_schoolId_idx" ON "school"."CustomRole"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomRole_name_schoolId_key" ON "school"."CustomRole"("name", "schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "saas"."User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "saas"."User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "saas"."User"("role");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "saas"."VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "saas"."VerificationToken"("identifier", "token");

-- CreateIndex
CREATE INDEX "SaasSetting_group_idx" ON "saas"."SaasSetting"("group");

-- CreateIndex
CREATE UNIQUE INDEX "SaasSetting_group_key_key" ON "saas"."SaasSetting"("group", "key");

-- CreateIndex
CREATE INDEX "AuditLog_actorEmail_idx" ON "saas"."AuditLog"("actorEmail");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "saas"."AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "saas"."AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "SaasAnnouncement_isActive_idx" ON "saas"."SaasAnnouncement"("isActive");

-- CreateIndex
CREATE INDEX "SaasAnnouncement_createdAt_idx" ON "saas"."SaasAnnouncement"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "saas"."PasswordResetToken"("token");

-- CreateIndex
CREATE INDEX "PasswordResetToken_email_idx" ON "saas"."PasswordResetToken"("email");

-- CreateIndex
CREATE INDEX "PasswordResetToken_token_idx" ON "saas"."PasswordResetToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Student_admissionNo_key" ON "school"."Student"("admissionNo");

-- CreateIndex
CREATE INDEX "Student_schoolId_idx" ON "school"."Student"("schoolId");

-- CreateIndex
CREATE INDEX "Student_class_idx" ON "school"."Student"("class");

-- CreateIndex
CREATE INDEX "Student_status_idx" ON "school"."Student"("status");

-- CreateIndex
CREATE INDEX "Student_gender_idx" ON "school"."Student"("gender");

-- CreateIndex
CREATE INDEX "Student_class_status_idx" ON "school"."Student"("class", "status");

-- CreateIndex
CREATE INDEX "Student_name_idx" ON "school"."Student"("name");

-- CreateIndex
CREATE INDEX "Student_admissionNo_idx" ON "school"."Student"("admissionNo");

-- CreateIndex
CREATE INDEX "Student_createdAt_idx" ON "school"."Student"("createdAt");

-- CreateIndex
CREATE INDEX "Student_parentName_idx" ON "school"."Student"("parentName");

-- CreateIndex
CREATE INDEX "Student_academicYear_idx" ON "school"."Student"("academicYear");

-- CreateIndex
CREATE INDEX "Student_academicYearId_idx" ON "school"."Student"("academicYearId");

-- CreateIndex
CREATE INDEX "Student_class_academicYear_idx" ON "school"."Student"("class", "academicYear");

-- CreateIndex
CREATE INDEX "Student_status_academicYear_idx" ON "school"."Student"("status", "academicYear");

-- CreateIndex
CREATE INDEX "Student_name_class_idx" ON "school"."Student"("name", "class");

-- CreateIndex
CREATE INDEX "Student_rollNo_idx" ON "school"."Student"("rollNo");

-- CreateIndex
CREATE INDEX "Student_email_idx" ON "school"."Student"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Teacher_employeeId_key" ON "school"."Teacher"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "Teacher_email_key" ON "school"."Teacher"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Teacher_userId_key" ON "school"."Teacher"("userId");

-- CreateIndex
CREATE INDEX "Teacher_schoolId_idx" ON "school"."Teacher"("schoolId");

-- CreateIndex
CREATE INDEX "Teacher_status_idx" ON "school"."Teacher"("status");

-- CreateIndex
CREATE INDEX "Teacher_department_idx" ON "school"."Teacher"("department");

-- CreateIndex
CREATE INDEX "Teacher_name_idx" ON "school"."Teacher"("name");

-- CreateIndex
CREATE INDEX "Teacher_createdAt_idx" ON "school"."Teacher"("createdAt");

-- CreateIndex
CREATE INDEX "Teacher_isClassTeacher_idx" ON "school"."Teacher"("isClassTeacher");

-- CreateIndex
CREATE INDEX "ClassTeacherAssignment_teacherId_idx" ON "school"."ClassTeacherAssignment"("teacherId");

-- CreateIndex
CREATE INDEX "ClassTeacherAssignment_classId_idx" ON "school"."ClassTeacherAssignment"("classId");

-- CreateIndex
CREATE INDEX "ClassTeacherAssignment_academicYearId_idx" ON "school"."ClassTeacherAssignment"("academicYearId");

-- CreateIndex
CREATE INDEX "ClassTeacherAssignment_schoolId_idx" ON "school"."ClassTeacherAssignment"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "ClassTeacherAssignment_teacherId_classId_sectionId_academic_key" ON "school"."ClassTeacherAssignment"("teacherId", "classId", "sectionId", "academicYearId");

-- CreateIndex
CREATE INDEX "TeacherSchedule_teacherId_idx" ON "school"."TeacherSchedule"("teacherId");

-- CreateIndex
CREATE INDEX "TeacherSchedule_classId_idx" ON "school"."TeacherSchedule"("classId");

-- CreateIndex
CREATE INDEX "TeacherSchedule_dayOfWeek_idx" ON "school"."TeacherSchedule"("dayOfWeek");

-- CreateIndex
CREATE INDEX "TeacherSchedule_academicYearId_idx" ON "school"."TeacherSchedule"("academicYearId");

-- CreateIndex
CREATE INDEX "TeacherSchedule_schoolId_idx" ON "school"."TeacherSchedule"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "TeacherSchedule_teacherId_classId_dayOfWeek_periodNumber_ac_key" ON "school"."TeacherSchedule"("teacherId", "classId", "dayOfWeek", "periodNumber", "academicYearId");

-- CreateIndex
CREATE INDEX "LessonPlan_teacherId_idx" ON "school"."LessonPlan"("teacherId");

-- CreateIndex
CREATE INDEX "LessonPlan_classId_idx" ON "school"."LessonPlan"("classId");

-- CreateIndex
CREATE INDEX "LessonPlan_date_idx" ON "school"."LessonPlan"("date");

-- CreateIndex
CREATE INDEX "LessonPlan_status_idx" ON "school"."LessonPlan"("status");

-- CreateIndex
CREATE INDEX "LessonPlan_schoolId_idx" ON "school"."LessonPlan"("schoolId");

-- CreateIndex
CREATE INDEX "Assignment_teacherId_idx" ON "school"."Assignment"("teacherId");

-- CreateIndex
CREATE INDEX "Assignment_classId_idx" ON "school"."Assignment"("classId");

-- CreateIndex
CREATE INDEX "Assignment_dueDate_idx" ON "school"."Assignment"("dueDate");

-- CreateIndex
CREATE INDEX "Assignment_status_idx" ON "school"."Assignment"("status");

-- CreateIndex
CREATE INDEX "Assignment_schoolId_idx" ON "school"."Assignment"("schoolId");

-- CreateIndex
CREATE INDEX "AssignmentSubmission_assignmentId_idx" ON "school"."AssignmentSubmission"("assignmentId");

-- CreateIndex
CREATE INDEX "AssignmentSubmission_studentId_idx" ON "school"."AssignmentSubmission"("studentId");

-- CreateIndex
CREATE INDEX "AssignmentSubmission_status_idx" ON "school"."AssignmentSubmission"("status");

-- CreateIndex
CREATE UNIQUE INDEX "AssignmentSubmission_assignmentId_studentId_key" ON "school"."AssignmentSubmission"("assignmentId", "studentId");

-- CreateIndex
CREATE INDEX "TeacherLeave_teacherId_idx" ON "school"."TeacherLeave"("teacherId");

-- CreateIndex
CREATE INDEX "TeacherLeave_status_idx" ON "school"."TeacherLeave"("status");

-- CreateIndex
CREATE INDEX "TeacherLeave_fromDate_idx" ON "school"."TeacherLeave"("fromDate");

-- CreateIndex
CREATE INDEX "TeacherLeave_schoolId_idx" ON "school"."TeacherLeave"("schoolId");

-- CreateIndex
CREATE INDEX "TeacherNote_teacherId_idx" ON "school"."TeacherNote"("teacherId");

-- CreateIndex
CREATE INDEX "TeacherNote_studentId_idx" ON "school"."TeacherNote"("studentId");

-- CreateIndex
CREATE INDEX "TeacherNote_classId_idx" ON "school"."TeacherNote"("classId");

-- CreateIndex
CREATE INDEX "TeacherNote_schoolId_idx" ON "school"."TeacherNote"("schoolId");

-- CreateIndex
CREATE INDEX "FeeStructure_schoolId_idx" ON "school"."FeeStructure"("schoolId");

-- CreateIndex
CREATE INDEX "FeeStructure_academicYearId_idx" ON "school"."FeeStructure"("academicYearId");

-- CreateIndex
CREATE INDEX "FeeStructure_boardId_idx" ON "school"."FeeStructure"("boardId");

-- CreateIndex
CREATE INDEX "FeeStructure_mediumId_idx" ON "school"."FeeStructure"("mediumId");

-- CreateIndex
CREATE INDEX "FeeStructure_classId_idx" ON "school"."FeeStructure"("classId");

-- CreateIndex
CREATE INDEX "FeeStructure_isActive_idx" ON "school"."FeeStructure"("isActive");

-- CreateIndex
CREATE INDEX "FeeStructure_academicYearId_boardId_mediumId_classId_idx" ON "school"."FeeStructure"("academicYearId", "boardId", "mediumId", "classId");

-- CreateIndex
CREATE UNIQUE INDEX "FeeRecord_receiptNumber_key" ON "school"."FeeRecord"("receiptNumber");

-- CreateIndex
CREATE INDEX "FeeRecord_studentId_idx" ON "school"."FeeRecord"("studentId");

-- CreateIndex
CREATE INDEX "FeeRecord_status_idx" ON "school"."FeeRecord"("status");

-- CreateIndex
CREATE INDEX "FeeRecord_academicYear_idx" ON "school"."FeeRecord"("academicYear");

-- CreateIndex
CREATE INDEX "FeeRecord_dueDate_idx" ON "school"."FeeRecord"("dueDate");

-- CreateIndex
CREATE INDEX "FeeRecord_studentId_status_idx" ON "school"."FeeRecord"("studentId", "status");

-- CreateIndex
CREATE INDEX "FeeRecord_studentId_academicYear_idx" ON "school"."FeeRecord"("studentId", "academicYear");

-- CreateIndex
CREATE INDEX "FeeRecord_status_academicYear_idx" ON "school"."FeeRecord"("status", "academicYear");

-- CreateIndex
CREATE INDEX "FeeRecord_dueDate_status_idx" ON "school"."FeeRecord"("dueDate", "status");

-- CreateIndex
CREATE INDEX "FeeRecord_createdAt_idx" ON "school"."FeeRecord"("createdAt");

-- CreateIndex
CREATE INDEX "FeeRecord_paymentMethod_idx" ON "school"."FeeRecord"("paymentMethod");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_receiptNumber_key" ON "school"."Payment"("receiptNumber");

-- CreateIndex
CREATE INDEX "Payment_paymentDate_idx" ON "school"."Payment"("paymentDate");

-- CreateIndex
CREATE INDEX "Payment_collectedBy_idx" ON "school"."Payment"("collectedBy");

-- CreateIndex
CREATE INDEX "Payment_paymentMethod_idx" ON "school"."Payment"("paymentMethod");

-- CreateIndex
CREATE INDEX "Payment_collectedBy_paymentMethod_idx" ON "school"."Payment"("collectedBy", "paymentMethod");

-- CreateIndex
CREATE INDEX "Payment_paymentDate_amount_idx" ON "school"."Payment"("paymentDate", "amount");

-- CreateIndex
CREATE INDEX "Payment_feeRecordId_idx" ON "school"."Payment"("feeRecordId");

-- CreateIndex
CREATE INDEX "Payment_createdAt_idx" ON "school"."Payment"("createdAt");

-- CreateIndex
CREATE INDEX "SubscriptionPayment_subscriptionId_idx" ON "saas"."SubscriptionPayment"("subscriptionId");

-- CreateIndex
CREATE INDEX "SubscriptionPayment_orderId_idx" ON "saas"."SubscriptionPayment"("orderId");

-- CreateIndex
CREATE INDEX "SubscriptionPayment_paymentId_idx" ON "saas"."SubscriptionPayment"("paymentId");

-- CreateIndex
CREATE INDEX "Discount_schoolId_idx" ON "school"."Discount"("schoolId");

-- CreateIndex
CREATE INDEX "AttendanceRecord_date_idx" ON "school"."AttendanceRecord"("date");

-- CreateIndex
CREATE INDEX "AttendanceRecord_class_idx" ON "school"."AttendanceRecord"("class");

-- CreateIndex
CREATE INDEX "AttendanceRecord_studentId_idx" ON "school"."AttendanceRecord"("studentId");

-- CreateIndex
CREATE INDEX "AttendanceRecord_class_date_idx" ON "school"."AttendanceRecord"("class", "date");

-- CreateIndex
CREATE INDEX "AttendanceRecord_status_idx" ON "school"."AttendanceRecord"("status");

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceRecord_studentId_date_subject_key" ON "school"."AttendanceRecord"("studentId", "date", "subject");

-- CreateIndex
CREATE INDEX "Exam_schoolId_idx" ON "school"."Exam"("schoolId");

-- CreateIndex
CREATE INDEX "Exam_class_idx" ON "school"."Exam"("class");

-- CreateIndex
CREATE INDEX "Exam_status_idx" ON "school"."Exam"("status");

-- CreateIndex
CREATE INDEX "Exam_academicYear_idx" ON "school"."Exam"("academicYear");

-- CreateIndex
CREATE INDEX "Exam_date_idx" ON "school"."Exam"("date");

-- CreateIndex
CREATE INDEX "Exam_class_academicYear_idx" ON "school"."Exam"("class", "academicYear");

-- CreateIndex
CREATE UNIQUE INDEX "ExamResult_examId_studentId_key" ON "school"."ExamResult"("examId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "AcademicYear_year_key" ON "school"."AcademicYear"("year");

-- CreateIndex
CREATE INDEX "AcademicYear_year_idx" ON "school"."AcademicYear"("year");

-- CreateIndex
CREATE INDEX "AcademicYear_isActive_idx" ON "school"."AcademicYear"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Medium_code_key" ON "school"."Medium"("code");

-- CreateIndex
CREATE INDEX "Medium_code_idx" ON "school"."Medium"("code");

-- CreateIndex
CREATE INDEX "Medium_isActive_idx" ON "school"."Medium"("isActive");

-- CreateIndex
CREATE INDEX "Medium_academicYearId_idx" ON "school"."Medium"("academicYearId");

-- CreateIndex
CREATE UNIQUE INDEX "Class_code_key" ON "school"."Class"("code");

-- CreateIndex
CREATE INDEX "Class_code_idx" ON "school"."Class"("code");

-- CreateIndex
CREATE INDEX "Class_level_idx" ON "school"."Class"("level");

-- CreateIndex
CREATE INDEX "Class_isActive_idx" ON "school"."Class"("isActive");

-- CreateIndex
CREATE INDEX "Class_mediumId_idx" ON "school"."Class"("mediumId");

-- CreateIndex
CREATE INDEX "Class_academicYearId_idx" ON "school"."Class"("academicYearId");

-- CreateIndex
CREATE UNIQUE INDEX "Section_code_key" ON "school"."Section"("code");

-- CreateIndex
CREATE INDEX "Section_code_idx" ON "school"."Section"("code");

-- CreateIndex
CREATE INDEX "Section_isActive_idx" ON "school"."Section"("isActive");

-- CreateIndex
CREATE INDEX "Section_classId_idx" ON "school"."Section"("classId");

-- CreateIndex
CREATE INDEX "Section_academicYearId_idx" ON "school"."Section"("academicYearId");

-- CreateIndex
CREATE INDEX "SchoolSetting_schoolId_idx" ON "school"."SchoolSetting"("schoolId");

-- CreateIndex
CREATE INDEX "SchoolSetting_group_idx" ON "school"."SchoolSetting"("group");

-- CreateIndex
CREATE UNIQUE INDEX "SchoolSetting_schoolId_group_key_key" ON "school"."SchoolSetting"("schoolId", "group", "key");

-- CreateIndex
CREATE UNIQUE INDEX "Board_code_key" ON "school"."Board"("code");

-- CreateIndex
CREATE INDEX "Board_code_idx" ON "school"."Board"("code");

-- CreateIndex
CREATE INDEX "Board_isActive_idx" ON "school"."Board"("isActive");

-- CreateIndex
CREATE INDEX "SchoolTiming_type_idx" ON "school"."SchoolTiming"("type");

-- CreateIndex
CREATE INDEX "SchoolTiming_dayOfWeek_idx" ON "school"."SchoolTiming"("dayOfWeek");

-- CreateIndex
CREATE INDEX "SchoolTiming_sortOrder_idx" ON "school"."SchoolTiming"("sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "school"."Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "school"."Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "school"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_employeeId_key" ON "school"."User"("employeeId");

-- CreateIndex
CREATE INDEX "User_customRoleId_idx" ON "school"."User"("customRoleId");

-- CreateIndex
CREATE INDEX "User_schoolId_idx" ON "school"."User"("schoolId");

-- CreateIndex
CREATE INDEX "User_employeeId_idx" ON "school"."User"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "school"."VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "school"."VerificationToken"("identifier", "token");

-- CreateIndex
CREATE INDEX "DiscountRequest_schoolId_idx" ON "school"."DiscountRequest"("schoolId");

-- CreateIndex
CREATE INDEX "DiscountRequest_schoolId_status_idx" ON "school"."DiscountRequest"("schoolId", "status");

-- CreateIndex
CREATE INDEX "DiscountRequest_schoolId_academicYear_idx" ON "school"."DiscountRequest"("schoolId", "academicYear");

-- CreateIndex
CREATE INDEX "DiscountRequest_schoolId_status_academicYear_idx" ON "school"."DiscountRequest"("schoolId", "status", "academicYear");

-- CreateIndex
CREATE INDEX "DiscountRequest_requestedBy_idx" ON "school"."DiscountRequest"("requestedBy");

-- CreateIndex
CREATE INDEX "DiscountRequest_approvedBy_idx" ON "school"."DiscountRequest"("approvedBy");

-- CreateIndex
CREATE INDEX "DiscountRequest_status_idx" ON "school"."DiscountRequest"("status");

-- CreateIndex
CREATE INDEX "DiscountRequest_createdAt_idx" ON "school"."DiscountRequest"("createdAt");

-- CreateIndex
CREATE INDEX "DiscountApplication_schoolId_idx" ON "school"."DiscountApplication"("schoolId");

-- CreateIndex
CREATE INDEX "DiscountApplication_schoolId_studentId_idx" ON "school"."DiscountApplication"("schoolId", "studentId");

-- CreateIndex
CREATE INDEX "DiscountApplication_discountRequestId_idx" ON "school"."DiscountApplication"("discountRequestId");

-- CreateIndex
CREATE INDEX "DiscountApplication_studentId_idx" ON "school"."DiscountApplication"("studentId");

-- CreateIndex
CREATE INDEX "DiscountApplication_feeRecordId_idx" ON "school"."DiscountApplication"("feeRecordId");

-- CreateIndex
CREATE INDEX "DiscountApplication_feeArrearsId_idx" ON "school"."DiscountApplication"("feeArrearsId");

-- CreateIndex
CREATE INDEX "DiscountApplication_studentId_feeRecordId_idx" ON "school"."DiscountApplication"("studentId", "feeRecordId");

-- CreateIndex
CREATE INDEX "DiscountApplication_schoolId_isReversed_idx" ON "school"."DiscountApplication"("schoolId", "isReversed");

-- CreateIndex
CREATE INDEX "DiscountRequestAuditLog_schoolId_idx" ON "school"."DiscountRequestAuditLog"("schoolId");

-- CreateIndex
CREATE INDEX "DiscountRequestAuditLog_discountRequestId_idx" ON "school"."DiscountRequestAuditLog"("discountRequestId");

-- CreateIndex
CREATE INDEX "DiscountRequestAuditLog_schoolId_createdAt_idx" ON "school"."DiscountRequestAuditLog"("schoolId", "createdAt");

-- CreateIndex
CREATE INDEX "DiscountRequestAuditLog_actorEmail_idx" ON "school"."DiscountRequestAuditLog"("actorEmail");

-- CreateIndex
CREATE INDEX "DiscountRequestAuditLog_action_idx" ON "school"."DiscountRequestAuditLog"("action");

-- CreateIndex
CREATE INDEX "StudentPromotion_studentId_idx" ON "school"."StudentPromotion"("studentId");

-- CreateIndex
CREATE INDEX "StudentPromotion_schoolId_idx" ON "school"."StudentPromotion"("schoolId");

-- CreateIndex
CREATE INDEX "StudentPromotion_fromAcademicYear_idx" ON "school"."StudentPromotion"("fromAcademicYear");

-- CreateIndex
CREATE INDEX "StudentPromotion_toAcademicYear_idx" ON "school"."StudentPromotion"("toAcademicYear");

-- CreateIndex
CREATE INDEX "StudentPromotion_promotionDate_idx" ON "school"."StudentPromotion"("promotionDate");

-- CreateIndex
CREATE INDEX "FeeArrears_studentId_idx" ON "school"."FeeArrears"("studentId");

-- CreateIndex
CREATE INDEX "FeeArrears_schoolId_idx" ON "school"."FeeArrears"("schoolId");

-- CreateIndex
CREATE INDEX "FeeArrears_fromAcademicYear_idx" ON "school"."FeeArrears"("fromAcademicYear");

-- CreateIndex
CREATE INDEX "FeeArrears_toAcademicYear_idx" ON "school"."FeeArrears"("toAcademicYear");

-- CreateIndex
CREATE INDEX "FeeArrears_status_idx" ON "school"."FeeArrears"("status");

-- CreateIndex
CREATE UNIQUE INDEX "TokenBlacklist_token_key" ON "school"."TokenBlacklist"("token");

-- CreateIndex
CREATE INDEX "TokenBlacklist_expiresAt_idx" ON "school"."TokenBlacklist"("expiresAt");

-- CreateIndex
CREATE INDEX "Vehicle_schoolId_idx" ON "school"."Vehicle"("schoolId");

-- CreateIndex
CREATE INDEX "Vehicle_isActive_idx" ON "school"."Vehicle"("isActive");

-- CreateIndex
CREATE INDEX "TransportRoute_schoolId_idx" ON "school"."TransportRoute"("schoolId");

-- CreateIndex
CREATE INDEX "TransportRoute_isActive_idx" ON "school"."TransportRoute"("isActive");

-- CreateIndex
CREATE INDEX "TransportRoute_schoolId_academicYearId_idx" ON "school"."TransportRoute"("schoolId", "academicYearId");

-- CreateIndex
CREATE INDEX "TransportRoute_schoolId_academicYearId_isActive_idx" ON "school"."TransportRoute"("schoolId", "academicYearId", "isActive");

-- CreateIndex
CREATE INDEX "TransportRoute_routeNumber_academicYearId_idx" ON "school"."TransportRoute"("routeNumber", "academicYearId");

-- CreateIndex
CREATE INDEX "TransportRoute_vehicleId_idx" ON "school"."TransportRoute"("vehicleId");

-- CreateIndex
CREATE INDEX "StudentTransport_studentId_idx" ON "school"."StudentTransport"("studentId");

-- CreateIndex
CREATE INDEX "StudentTransport_routeId_idx" ON "school"."StudentTransport"("routeId");

-- CreateIndex
CREATE INDEX "StudentTransport_academicYearId_idx" ON "school"."StudentTransport"("academicYearId");

-- CreateIndex
CREATE INDEX "StudentTransport_studentId_isActive_idx" ON "school"."StudentTransport"("studentId", "isActive");

-- CreateIndex
CREATE INDEX "StudentTransport_routeId_isActive_idx" ON "school"."StudentTransport"("routeId", "isActive");

-- CreateIndex
CREATE INDEX "StudentTransport_academicYearId_isActive_idx" ON "school"."StudentTransport"("academicYearId", "isActive");

-- CreateIndex
CREATE INDEX "StudentTransport_studentId_routeId_academicYearId_idx" ON "school"."StudentTransport"("studentId", "routeId", "academicYearId");

-- CreateIndex
CREATE INDEX "StudentTransport_studentId_academicYearId_isActive_idx" ON "school"."StudentTransport"("studentId", "academicYearId", "isActive");

-- CreateIndex
CREATE INDEX "ExpenseCategory_schoolId_idx" ON "school"."ExpenseCategory"("schoolId");

-- CreateIndex
CREATE INDEX "ExpenseCategory_schoolId_isActive_idx" ON "school"."ExpenseCategory"("schoolId", "isActive");

-- CreateIndex
CREATE INDEX "ExpenseCategory_parentId_idx" ON "school"."ExpenseCategory"("parentId");

-- CreateIndex
CREATE INDEX "Expense_schoolId_idx" ON "school"."Expense"("schoolId");

-- CreateIndex
CREATE INDEX "Expense_schoolId_status_idx" ON "school"."Expense"("schoolId", "status");

-- CreateIndex
CREATE INDEX "Expense_schoolId_academicYear_idx" ON "school"."Expense"("schoolId", "academicYear");

-- CreateIndex
CREATE INDEX "Expense_schoolId_categoryId_idx" ON "school"."Expense"("schoolId", "categoryId");

-- CreateIndex
CREATE INDEX "Expense_schoolId_createdAt_idx" ON "school"."Expense"("schoolId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Expense_schoolId_dateIncurred_idx" ON "school"."Expense"("schoolId", "dateIncurred");

-- CreateIndex
CREATE INDEX "Expense_schoolId_status_academicYear_idx" ON "school"."Expense"("schoolId", "status", "academicYear");

-- CreateIndex
CREATE INDEX "Expense_schoolId_categoryId_dateIncurred_idx" ON "school"."Expense"("schoolId", "categoryId", "dateIncurred");

-- CreateIndex
CREATE INDEX "Expense_requestedBy_idx" ON "school"."Expense"("requestedBy");

-- CreateIndex
CREATE INDEX "Expense_deletedAt_idx" ON "school"."Expense"("deletedAt");

-- CreateIndex
CREATE INDEX "Expense_status_idx" ON "school"."Expense"("status");

-- CreateIndex
CREATE INDEX "Expense_dateIncurred_idx" ON "school"."Expense"("dateIncurred");

-- CreateIndex
CREATE INDEX "Budget_schoolId_idx" ON "school"."Budget"("schoolId");

-- CreateIndex
CREATE INDEX "Budget_schoolId_status_idx" ON "school"."Budget"("schoolId", "status");

-- CreateIndex
CREATE INDEX "Budget_schoolId_academicYear_idx" ON "school"."Budget"("schoolId", "academicYear");

-- CreateIndex
CREATE INDEX "Budget_schoolId_categoryId_idx" ON "school"."Budget"("schoolId", "categoryId");

-- CreateIndex
CREATE INDEX "Budget_status_idx" ON "school"."Budget"("status");

-- CreateIndex
CREATE INDEX "BudgetItem_budgetId_idx" ON "school"."BudgetItem"("budgetId");

-- CreateIndex
CREATE INDEX "BudgetItem_expenseId_idx" ON "school"."BudgetItem"("expenseId");

-- CreateIndex
CREATE UNIQUE INDEX "BudgetItem_budgetId_expenseId_key" ON "school"."BudgetItem"("budgetId", "expenseId");

-- CreateIndex
CREATE INDEX "ExpenseAuditLog_schoolId_idx" ON "school"."ExpenseAuditLog"("schoolId");

-- CreateIndex
CREATE INDEX "ExpenseAuditLog_expenseId_idx" ON "school"."ExpenseAuditLog"("expenseId");

-- CreateIndex
CREATE INDEX "ExpenseAuditLog_schoolId_createdAt_idx" ON "school"."ExpenseAuditLog"("schoolId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "ExpenseAuditLog_actorEmail_idx" ON "school"."ExpenseAuditLog"("actorEmail");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "school"."Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_idx" ON "school"."Notification"("userId", "isRead");

-- CreateIndex
CREATE INDEX "Notification_schoolId_idx" ON "school"."Notification"("schoolId");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "school"."Notification"("createdAt" DESC);

-- AddForeignKey
ALTER TABLE "saas"."Subscription" ADD CONSTRAINT "Subscription_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "saas"."School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saas"."Invoice" ADD CONSTRAINT "Invoice_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "saas"."Subscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school"."CustomRole" ADD CONSTRAINT "CustomRole_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "saas"."School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school"."Student" ADD CONSTRAINT "Student_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "school"."AcademicYear"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school"."Student" ADD CONSTRAINT "Student_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "saas"."School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school"."Teacher" ADD CONSTRAINT "Teacher_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "saas"."School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school"."Teacher" ADD CONSTRAINT "Teacher_userId_fkey" FOREIGN KEY ("userId") REFERENCES "school"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school"."ClassTeacherAssignment" ADD CONSTRAINT "ClassTeacherAssignment_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "school"."Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school"."TeacherSchedule" ADD CONSTRAINT "TeacherSchedule_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "school"."Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school"."LessonPlan" ADD CONSTRAINT "LessonPlan_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "school"."Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school"."Assignment" ADD CONSTRAINT "Assignment_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "school"."Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school"."AssignmentSubmission" ADD CONSTRAINT "AssignmentSubmission_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "school"."Assignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school"."AssignmentSubmission" ADD CONSTRAINT "AssignmentSubmission_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "school"."Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school"."TeacherLeave" ADD CONSTRAINT "TeacherLeave_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "school"."Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school"."TeacherNote" ADD CONSTRAINT "TeacherNote_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "school"."Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school"."FeeStructure" ADD CONSTRAINT "FeeStructure_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "school"."AcademicYear"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school"."FeeStructure" ADD CONSTRAINT "FeeStructure_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "school"."Board"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school"."FeeStructure" ADD CONSTRAINT "FeeStructure_classId_fkey" FOREIGN KEY ("classId") REFERENCES "school"."Class"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school"."FeeStructure" ADD CONSTRAINT "FeeStructure_mediumId_fkey" FOREIGN KEY ("mediumId") REFERENCES "school"."Medium"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school"."FeeRecord" ADD CONSTRAINT "FeeRecord_feeStructureId_fkey" FOREIGN KEY ("feeStructureId") REFERENCES "school"."FeeStructure"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school"."FeeRecord" ADD CONSTRAINT "FeeRecord_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "school"."Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school"."Payment" ADD CONSTRAINT "Payment_feeRecordId_fkey" FOREIGN KEY ("feeRecordId") REFERENCES "school"."FeeRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saas"."SubscriptionPayment" ADD CONSTRAINT "SubscriptionPayment_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "saas"."Subscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school"."AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "school"."Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school"."AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "school"."Teacher"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school"."ExamResult" ADD CONSTRAINT "ExamResult_examId_fkey" FOREIGN KEY ("examId") REFERENCES "school"."Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school"."ExamResult" ADD CONSTRAINT "ExamResult_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "school"."Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school"."Medium" ADD CONSTRAINT "Medium_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "school"."AcademicYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school"."Class" ADD CONSTRAINT "Class_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "school"."AcademicYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school"."Class" ADD CONSTRAINT "Class_mediumId_fkey" FOREIGN KEY ("mediumId") REFERENCES "school"."Medium"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school"."Section" ADD CONSTRAINT "Section_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "school"."AcademicYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school"."Section" ADD CONSTRAINT "Section_classId_fkey" FOREIGN KEY ("classId") REFERENCES "school"."Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school"."Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "school"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school"."Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "school"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school"."User" ADD CONSTRAINT "User_customRoleId_fkey" FOREIGN KEY ("customRoleId") REFERENCES "school"."CustomRole"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school"."User" ADD CONSTRAINT "User_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "saas"."School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school"."DiscountApplication" ADD CONSTRAINT "DiscountApplication_discountRequestId_fkey" FOREIGN KEY ("discountRequestId") REFERENCES "school"."DiscountRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school"."DiscountRequestAuditLog" ADD CONSTRAINT "DiscountRequestAuditLog_discountRequestId_fkey" FOREIGN KEY ("discountRequestId") REFERENCES "school"."DiscountRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school"."StudentPromotion" ADD CONSTRAINT "StudentPromotion_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "school"."Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school"."FeeArrears" ADD CONSTRAINT "FeeArrears_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "school"."Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school"."TransportRoute" ADD CONSTRAINT "TransportRoute_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "school"."Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school"."StudentTransport" ADD CONSTRAINT "StudentTransport_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "school"."TransportRoute"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school"."StudentTransport" ADD CONSTRAINT "StudentTransport_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "school"."Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school"."ExpenseCategory" ADD CONSTRAINT "ExpenseCategory_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "school"."ExpenseCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school"."Expense" ADD CONSTRAINT "Expense_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "school"."ExpenseCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school"."Budget" ADD CONSTRAINT "Budget_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "school"."ExpenseCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school"."BudgetItem" ADD CONSTRAINT "BudgetItem_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "school"."Budget"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school"."BudgetItem" ADD CONSTRAINT "BudgetItem_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "school"."Expense"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school"."ExpenseAuditLog" ADD CONSTRAINT "ExpenseAuditLog_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "school"."Expense"("id") ON DELETE CASCADE ON UPDATE CASCADE;

