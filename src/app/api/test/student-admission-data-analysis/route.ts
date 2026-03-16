import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const analysis = {
      title: "Student Admission Form - Complete Data Analysis",
      description: "All data fields being inserted/updated and their sources",
      
      // API Endpoint Analysis
      apiEndpoint: {
        method: "POST",
        url: "/api/students",
        purpose: "Create new student record with auto-generated fee records"
      },

      // Data Structure Analysis
      dataFlow: {
        receivedFromFrontend: {
          // Direct form fields
          personalInfo: [
            "name", "email", "photo", "gender", "dateOfBirth", "phone",
            "address", "city", "state", "pinCode", "nationality", 
            "religion", "category", "motherTongue", "languageMedium",
            "bloodGroup", "aadharNumber", "stsId", "board"
          ],
          
          medicalInfo: [
            "medicalConditions", "allergies", "medications", 
            "doctorName", "doctorPhone"
          ],
          
          transportInfo: [
            "transport", "transportRoute", "hostel"
          ],
          
          familyInfo: [
            "sibling", "siblingName", "siblingClass", "parentName",
            "parentPhone", "parentEmail", "fatherName", "fatherOccupation",
            "fatherPhone", "fatherEmail", "motherName", "motherOccupation",
            "motherPhone", "motherEmail", "guardianName", "guardianRelation",
            "guardianPhone"
          ],
          
          academicInfo: [
            "class", "section", "rollNo", "mediumId", "classId", "sectionId",
            "previousSchool", "previousClass", "previousSchoolName",
            "previousSchoolAddress", "previousSchoolPhone", "previousSchoolEmail",
            "transferCertificateNo", "bankName", "bankAccountNumber", "bankIfsc"
          ],
          
          admissionInfo: [
            "admissionDate", "enrollmentDate", "remarks"
          ],
          
          // Special structured data
          structuredData: [
            "documents", // JSON string array
            "fees", // Fee payment records
            "attendance", // Attendance records  
            "academics", // Academic performance (gpa, rank)
            "behavior" // Behavior metrics (discipline, incidents, achievements)
          ],
          
          // System fields (removed before processing)
          systemFields: [
            "grade", "mediumId", "classId", "sectionId", "_ts", 
            "_mediumId", "_classId", "_sectionId", "timestamp", 
            "isAutoSave", "transferCertificateNumber"
          ]
        },

        generatedByBackend: [
          "admissionNo", // Auto-generated: YYYY#### format
          "schoolId", // From authentication context
          "academicYear", // From active academic year in DB
          "status", // Default: "active"
        ],

        calculatedOrProcessed: [
          "gpa", // From academics.gpa or default 0
          "rank", // From academics.rank or default 0  
          "disciplineScore", // From behavior.disciplineScore or default 100
          "incidents", // From behavior.incidents or default 0
          "achievements", // From behavior.achievements or default 0
          "rollNo", // Auto-generated if not provided
          "documents" // Converted to JSON string
        ]
      },

      // Data Sources Analysis
      dataSources: {
        frontendInputs: {
          admissionTab: {
            source: "StudentForm.tsx - Admission Tab",
            fields: [
              "admissionDate", "mediumId", "classId", "sectionId", 
              "board", "rollNo", "previousSchool", "previousClass"
            ],
            dropdownSources: {
              mediums: "SchoolConfigContext -> /api/school-config -> Medium table",
              classes: "SchoolConfigContext -> /api/school-config -> Class table (filtered by medium)",
              sections: "SchoolConfigContext -> /api/school-config -> Section table (filtered by class)",
              boards: "SchoolConfigContext -> /api/school-config -> Board table"
            }
          },
          
          personalTab: {
            source: "StudentForm.tsx - Personal Tab", 
            fields: [
              "name", "dateOfBirth", "gender", "photo", "bloodGroup",
              "nationality", "religion", "category", "motherTongue",
              "languageMedium", "aadharNumber", "stsId"
            ]
          },
          
          contactTab: {
            source: "StudentForm.tsx - Contact Tab",
            fields: [
              "email", "phone", "address", "city", "state", "pinCode",
              "emergencyContact", "emergencyRelation"
            ]
          },
          
          parentsTab: {
            source: "StudentForm.tsx - Parents Tab",
            fields: [
              "fatherName", "fatherOccupation", "fatherPhone", "fatherEmail",
              "motherName", "motherOccupation", "motherPhone", "motherEmail",
              "guardianName", "guardianRelation", "guardianPhone"
            ]
          },
          
          additionalTab: {
            source: "StudentForm.tsx - Additional Tab",
            fields: [
              "medicalConditions", "allergies", "medications", "doctorName",
              "doctorPhone", "transport", "transportRoute", "hostel", "sibling",
              "siblingName", "siblingClass", "previousSchoolName",
              "previousSchoolAddress", "previousSchoolPhone", "previousSchoolEmail",
              "transferCertificateNo", "bankName", "bankAccountNumber", "bankIfsc",
              "documents", "remarks"
            ]
          }
        },

        backendGenerated: {
          admissionNumber: {
            source: "POST /api/students - Auto-generation logic",
            logic: "Current year + sequential number (20260001, 20260002...)",
            validation: "Ensures uniqueness within the same year"
          },
          
          academicYear: {
            source: "POST /api/students - Active academic year lookup",
            query: "AcademicYear.findFirst({ where: { isActive: true } })",
            fallback: "Returns error if no active academic year found"
          },
          
          rollNumber: {
            source: "POST /api/students - Auto-generation if not provided",
            logic: "Count of students in same class/section + 1",
            condition: "Only generated if rollNo is empty in form"
          },
          
          feeRecords: {
            source: "POST /api/students - Auto-fee application",
            trigger: "After student creation success",
            logic: "Match student's class/category with active fee structures",
            academicYear: "Uses same active academic year as student"
          }
        }
      },

      // Database Schema Mapping
      databaseSchema: {
        studentTable: {
          table: "school.Student",
          totalFields: 68,
          fieldCategories: {
            identification: ["id", "admissionNo", "name", "email", "photo"],
            academic: ["class", "section", "rollNo", "board", "gpa", "rank"],
            personal: ["gender", "dateOfBirth", "bloodGroup", "nationality", "religion"],
            contact: ["phone", "address", "city", "state", "pinCode"],
            family: ["fatherName", "motherName", "parentName", "guardianName"],
            medical: ["medicalConditions", "allergies", "medications"],
            financial: ["bankName", "bankAccountNumber", "bankIfsc"],
            system: ["schoolId", "status", "createdAt", "updatedAt", "academicYear"],
            performance: ["disciplineScore", "incidents", "achievements"]
          }
        },
        
        relatedTables: {
          feeRecords: {
            table: "school.FeeRecord",
            createdAutomatically: true,
            trigger: "Student admission",
            fields: ["studentId", "feeStructureId", "amount", "discount", "pendingAmount", "academicYear"]
          },
          
          attendanceRecords: {
            table: "school.AttendanceRecord", 
            relation: "One-to-many from Student",
            createdManually: true
          },
          
          examResults: {
            table: "school.ExamResult",
            relation: "One-to-many from Student", 
            createdManually: true
          }
        }
      },

      // Validation Rules
      validation: {
        requiredFields: ["name", "dateOfBirth", "gender"],
        formatValidation: {
          email: "Regex: /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/",
          phone: "10 digits only",
          dateOfBirth: "Valid Date object"
        },
        enumValidation: {
          gender: ["Male", "Female", "Other"],
          status: ["active"] // default value
        },
        businessLogic: {
          academicYear: "Must have active academic year in system",
          admissionNo: "Must be unique within current year",
          rollNo: "Auto-generated if not provided"
        }
      },

      // Auto-save Feature
      autoSave: {
        mechanism: "localStorage",
        key: "studentFormAutoSave",
        trigger: "Form field changes",
        clearing: "Manual 'Clear' button or successful submission",
        behavior: "Preserves form data across page refreshes"
      }
    };

    return NextResponse.json(analysis);
    
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ 
      error: 'Failed to analyze student admission data',
      details: error.message 
    }, { status: 500 });
  }
}
