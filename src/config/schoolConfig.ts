// School Configuration - Define your school's structure here
// This file controls all mediums, classes, and sections in the system

export interface MediumConfig {
  id: string;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
}

export interface ClassConfig {
  id: string;
  name: string;
  code: string;
  mediumId: string;
  level: 'primary' | 'middle' | 'high' | 'higher_secondary' | 'kindergarten';
  sections: SectionConfig[];
  fees?: {
    tuition?: number;
    transport?: number;
    lab?: number;
    exam?: number;
  };
  subjects?: string[];
}

export interface SectionConfig {
  id: string;
  name: string;
  code: string;
  capacity: number;
  roomNumber?: string;
  teacherId?: string;
}

// ===========================================
// 🏫 DEFINE YOUR SCHOOL STRUCTURE HERE
// ===========================================

export const SCHOOL_MEDIUMS: MediumConfig[] = [
  {
    id: 'english',
    name: 'English Medium',
    code: 'EN',
    description: 'English medium instruction',
    isActive: true
  },
  {
    id: 'hindi',
    name: 'Hindi Medium', 
    code: 'HI',
    description: 'Hindi medium instruction',
    isActive: true
  },
  {
    id: 'kannada',
    name: 'Kannada Medium',
    code: 'KN',
    description: 'Kannada medium instruction',
    isActive: true
  },
  {
    id: 'urdu',
    name: 'Urdu Medium',
    code: 'UR',
    description: 'Urdu medium instruction',
    isActive: false // Set to true if you have Urdu medium
  },
  {
    id: 'sanskrit',
    name: 'Sanskrit Medium',
    code: 'SA',
    description: 'Sanskrit medium instruction',
    isActive: false // Set to true if you have Sanskrit medium
  }
];

export const SCHOOL_CLASSES: ClassConfig[] = [
  // === Kindergarten ===
  {
    id: 'nursery',
    name: 'Nursery',
    code: 'NUR',
    mediumId: 'english',
    level: 'kindergarten',
    sections: [
      { id: 'nursery-a', name: 'A', code: 'NUR-A', capacity: 30 },
      { id: 'nursery-b', name: 'B', code: 'NUR-B', capacity: 30 }
    ],
    fees: { tuition: 25000, transport: 8000 },
    subjects: ['English', 'Math', 'Environmental Science', 'Art & Craft']
  },
  {
    id: 'lkg',
    name: 'LKG',
    code: 'LKG',
    mediumId: 'english',
    level: 'kindergarten',
    sections: [
      { id: 'lkg-a', name: 'A', code: 'LKG-A', capacity: 30 },
      { id: 'lkg-b', name: 'B', code: 'LKG-B', capacity: 30 },
      { id: 'lkg-c', name: 'C', code: 'LKG-C', capacity: 30 }
    ],
    fees: { tuition: 30000, transport: 8000 },
    subjects: ['English', 'Math', 'Environmental Science', 'Art & Craft', 'Physical Education']
  },
  {
    id: 'ukg',
    name: 'UKG',
    code: 'UKG',
    mediumId: 'english',
    level: 'kindergarten',
    sections: [
      { id: 'ukg-a', name: 'A', code: 'UKG-A', capacity: 30 },
      { id: 'ukg-b', name: 'B', code: 'UKG-B', capacity: 30 },
      { id: 'ukg-c', name: 'C', code: 'UKG-C', capacity: 30 }
    ],
    fees: { tuition: 35000, transport: 8000 },
    subjects: ['English', 'Math', 'Environmental Science', 'Art & Craft', 'Physical Education', 'Computer Basics']
  },

  // === Primary Classes (1-5) - English Medium ===
  {
    id: '1-en',
    name: 'Class 1 - English',
    code: '1-EN',
    mediumId: 'english',
    level: 'primary',
    sections: [
      { id: '1-en-a', name: 'A', code: '1-EN-A', capacity: 35 },
      { id: '1-en-b', name: 'B', code: '1-EN-B', capacity: 35 },
      { id: '1-en-c', name: 'C', code: '1-EN-C', capacity: 35 },
      { id: '1-en-d', name: 'D', code: '1-EN-D', capacity: 35 }
    ],
    fees: { tuition: 40000, transport: 10000 },
    subjects: ['English', 'Math', 'Science', 'Social Studies', 'Computer', 'Art', 'Physical Education']
  },
  {
    id: '1-kn',
    name: 'Class 1 - Kannada',
    code: '1-KN',
    mediumId: 'kannada',
    level: 'primary',
    sections: [
      { id: '1-kn-a', name: 'A', code: '1-KN-A', capacity: 30 },
      { id: '1-kn-b', name: 'B', code: '1-KN-B', capacity: 30 }
    ],
    fees: { tuition: 35000, transport: 8000 },
    subjects: ['Kannada', 'English', 'Math', 'Science', 'Social Studies', 'Computer', 'Art', 'Physical Education']
  },
  {
    id: '2-en',
    name: 'Class 2 - English',
    code: '2-EN',
    mediumId: 'english',
    level: 'primary',
    sections: [
      { id: '2-en-a', name: 'A', code: '2-EN-A', capacity: 35 },
      { id: '2-en-b', name: 'B', code: '2-EN-B', capacity: 35 },
      { id: '2-en-c', name: 'C', code: '2-EN-C', capacity: 35 },
      { id: '2-en-d', name: 'D', code: '2-EN-D', capacity: 35 }
    ],
    fees: { tuition: 42000, transport: 10000 },
    subjects: ['English', 'Math', 'Science', 'Social Studies', 'Computer', 'Art', 'Physical Education']
  },
  {
    id: '2-kn',
    name: 'Class 2 - Kannada',
    code: '2-KN',
    mediumId: 'kannada',
    level: 'primary',
    sections: [
      { id: '2-kn-a', name: 'A', code: '2-KN-A', capacity: 30 },
      { id: '2-kn-b', name: 'B', code: '2-KN-B', capacity: 30 }
    ],
    fees: { tuition: 37000, transport: 8000 },
    subjects: ['Kannada', 'English', 'Math', 'Science', 'Social Studies', 'Computer', 'Art', 'Physical Education']
  },
  {
    id: '3-en',
    name: 'Class 3 - English',
    code: '3-EN',
    mediumId: 'english',
    level: 'primary',
    sections: [
      { id: '3-en-a', name: 'A', code: '3-EN-A', capacity: 35 },
      { id: '3-en-b', name: 'B', code: '3-EN-B', capacity: 35 },
      { id: '3-en-c', name: 'C', code: '3-EN-C', capacity: 35 }
    ],
    fees: { tuition: 45000, transport: 10000 },
    subjects: ['English', 'Math', 'Science', 'Social Studies', 'Computer', 'Art', 'Physical Education']
  },
  {
    id: '3-kn',
    name: 'Class 3 - Kannada',
    code: '3-KN',
    mediumId: 'kannada',
    level: 'primary',
    sections: [
      { id: '3-kn-a', name: 'A', code: '3-KN-A', capacity: 30 },
      { id: '3-kn-b', name: 'B', code: '3-KN-B', capacity: 30 }
    ],
    fees: { tuition: 40000, transport: 8000 },
    subjects: ['Kannada', 'English', 'Math', 'Science', 'Social Studies', 'Computer', 'Art', 'Physical Education']
  },
  {
    id: '4-en',
    name: 'Class 4 - English',
    code: '4-EN',
    mediumId: 'english',
    level: 'primary',
    sections: [
      { id: '4-en-a', name: 'A', code: '4-EN-A', capacity: 40 },
      { id: '4-en-b', name: 'B', code: '4-EN-B', capacity: 40 },
      { id: '4-en-c', name: 'C', code: '4-EN-C', capacity: 40 }
    ],
    fees: { tuition: 48000, transport: 12000, lab: 5000 },
    subjects: ['English', 'Math', 'Science', 'Social Studies', 'Computer', 'Art', 'Physical Education']
  },
  {
    id: '4-kn',
    name: 'Class 4 - Kannada',
    code: '4-KN',
    mediumId: 'kannada',
    level: 'primary',
    sections: [
      { id: '4-kn-a', name: 'A', code: '4-KN-A', capacity: 30 },
      { id: '4-kn-b', name: 'B', code: '4-KN-B', capacity: 30 }
    ],
    fees: { tuition: 42000, transport: 10000, lab: 4000 },
    subjects: ['Kannada', 'English', 'Math', 'Science', 'Social Studies', 'Computer', 'Art', 'Physical Education']
  },
  {
    id: '5-en',
    name: 'Class 5 - English',
    code: '5-EN',
    mediumId: 'english',
    level: 'primary',
    sections: [
      { id: '5-en-a', name: 'A', code: '5-EN-A', capacity: 40 },
      { id: '5-en-b', name: 'B', code: '5-EN-B', capacity: 40 },
      { id: '5-en-c', name: 'C', code: '5-EN-C', capacity: 40 }
    ],
    fees: { tuition: 50000, transport: 12000, lab: 5000 },
    subjects: ['English', 'Math', 'Science', 'Social Studies', 'Computer', 'Art', 'Physical Education']
  },
  {
    id: '5-kn',
    name: 'Class 5 - Kannada',
    code: '5-KN',
    mediumId: 'kannada',
    level: 'primary',
    sections: [
      { id: '5-kn-a', name: 'A', code: '5-KN-A', capacity: 30 },
      { id: '5-kn-b', name: 'B', code: '5-KN-B', capacity: 30 }
    ],
    fees: { tuition: 45000, transport: 10000, lab: 4000 },
    subjects: ['Kannada', 'English', 'Math', 'Science', 'Social Studies', 'Computer', 'Art', 'Physical Education']
  },

  // === Middle Classes (6-8) ===
  {
    id: '6',
    name: 'Class 6',
    code: '6',
    mediumId: 'english',
    level: 'middle',
    sections: [
      { id: '6-a', name: 'A', code: '6-A', capacity: 40 },
      { id: '6-b', name: 'B', code: '6-B', capacity: 40 }
    ],
    fees: { tuition: 55000, transport: 12000, lab: 8000 },
    subjects: ['English', 'Math', 'Physics', 'Chemistry', 'Biology', 'Social Studies', 'Computer', 'Physical Education']
  },
  {
    id: '7',
    name: 'Class 7',
    code: '7',
    mediumId: 'english',
    level: 'middle',
    sections: [
      { id: '7-a', name: 'A', code: '7-A', capacity: 40 },
      { id: '7-b', name: 'B', code: '7-B', capacity: 40 }
    ],
    fees: { tuition: 58000, transport: 12000, lab: 8000 },
    subjects: ['English', 'Math', 'Physics', 'Chemistry', 'Biology', 'Social Studies', 'Computer', 'Physical Education']
  },
  {
    id: '8',
    name: 'Class 8',
    code: '8',
    mediumId: 'english',
    level: 'middle',
    sections: [
      { id: '8-a', name: 'A', code: '8-A', capacity: 40 },
      { id: '8-b', name: 'B', code: '8-B', capacity: 40 }
    ],
    fees: { tuition: 60000, transport: 12000, lab: 10000 },
    subjects: ['English', 'Math', 'Physics', 'Chemistry', 'Biology', 'Social Studies', 'Computer', 'Physical Education']
  },

  // === High Classes (9-10) ===
  {
    id: '9',
    name: 'Class 9',
    code: '9',
    mediumId: 'english',
    level: 'high',
    sections: [
      { id: '9-a', name: 'A', code: '9-A', capacity: 45 },
      { id: '9-b', name: 'B', code: '9-B', capacity: 45 }
    ],
    fees: { tuition: 65000, transport: 15000, lab: 12000, exam: 5000 },
    subjects: ['English', 'Math', 'Physics', 'Chemistry', 'Biology', 'Social Studies', 'Computer', 'Physical Education']
  },
  {
    id: '10',
    name: 'Class 10',
    code: '10',
    mediumId: 'english',
    level: 'high',
    sections: [
      { id: '10-a', name: 'A', code: '10-A', capacity: 45 },
      { id: '10-b', name: 'B', code: '10-B', capacity: 45 }
    ],
    fees: { tuition: 70000, transport: 15000, lab: 15000, exam: 8000 },
    subjects: ['English', 'Math', 'Physics', 'Chemistry', 'Biology', 'Social Studies', 'Computer', 'Physical Education']
  },

  // === Higher Secondary (11-12) ===
  {
    id: '11',
    name: 'Class 11',
    code: '11',
    mediumId: 'english',
    level: 'higher_secondary',
    sections: [
      { id: '11-a', name: 'A', code: '11-A', capacity: 50 }, // Science Stream
      { id: '11-b', name: 'B', code: '11-B', capacity: 50 }, // Commerce Stream
      { id: '11-c', name: 'C', code: '11-C', capacity: 40 }  // Arts Stream
    ],
    fees: { tuition: 75000, transport: 15000, lab: 20000, exam: 10000 },
    subjects: ['English', 'Math', 'Physics', 'Chemistry', 'Biology', 'Accountancy', 'Economics', 'Computer Science']
  },
  {
    id: '12',
    name: 'Class 12',
    code: '12',
    mediumId: 'english',
    level: 'higher_secondary',
    sections: [
      { id: '12-a', name: 'A', code: '12-A', capacity: 50 }, // Science Stream
      { id: '12-b', name: 'B', code: '12-B', capacity: 50 }, // Commerce Stream
      { id: '12-c', name: 'C', code: '12-C', capacity: 40 }  // Arts Stream
    ],
    fees: { tuition: 80000, transport: 15000, lab: 25000, exam: 12000 },
    subjects: ['English', 'Math', 'Physics', 'Chemistry', 'Biology', 'Accountancy', 'Economics', 'Computer Science']
  }
];

// ===========================================
// HELPER FUNCTIONS
// ===========================================

export const getActiveMediums = (): MediumConfig[] => {
  return SCHOOL_MEDIUMS.filter(medium => medium.isActive);
};

export const getClassesByMedium = (mediumId: string): ClassConfig[] => {
  return SCHOOL_CLASSES.filter(cls => cls.mediumId === mediumId);
};

export const getClassById = (classId: string): ClassConfig | undefined => {
  return SCHOOL_CLASSES.find(cls => cls.id === classId);
};

export const getSectionsByClass = (classId: string): SectionConfig[] => {
  const classConfig = getClassById(classId);
  return classConfig ? classConfig.sections : [];
};

export const getMediumById = (mediumId: string): MediumConfig | undefined => {
  return SCHOOL_MEDIUMS.find(medium => medium.id === mediumId);
};

export const getAllClassOptions = (): { value: string; label: string; mediumId: string }[] => {
  return SCHOOL_CLASSES.map(cls => ({
    value: cls.id,
    label: `${cls.name} (${getMediumById(cls.mediumId)?.name})`,
    mediumId: cls.mediumId
  }));
};

export const getSectionOptions = (classId: string): { value: string; label: string }[] => {
  const sections = getSectionsByClass(classId);
  return sections.map(section => ({
    value: section.id,
    label: `Section ${section.name} (Capacity: ${section.capacity})`
  }));
};

// ===========================================
// MULTI-MEDIUM CLASS HELPERS
// ===========================================

export const getClassesByGradeLevel = (grade: string): ClassConfig[] => {
  return SCHOOL_CLASSES.filter(cls => cls.id.startsWith(`${grade}-`));
};

export const getClassesByGradeAndMedium = (grade: string, mediumId: string): ClassConfig | undefined => {
  return SCHOOL_CLASSES.find(cls => cls.id === `${grade}-${mediumId}`);
};

export const getAllGradeLevels = (): string[] => {
  const grades = new Set<string>();
  SCHOOL_CLASSES.forEach(cls => {
    const grade = cls.id.split('-')[0];
    if (!isNaN(parseInt(grade))) {
      grades.add(grade);
    }
  });
  return Array.from(grades).sort();
};

export const getMultiMediumClasses = (): { grade: string; classes: ClassConfig[] }[] => {
  const gradeLevels = getAllGradeLevels();
  return gradeLevels.map(grade => ({
    grade,
    classes: getClassesByGradeLevel(grade)
  }));
};

export const createMultiMediumClass = (
  grade: string, 
  mediums: string[], 
  baseConfig: Partial<ClassConfig>
): ClassConfig[] => {
  return mediums.map(mediumId => ({
    id: `${grade}-${mediumId}`,
    name: `Class ${grade} - ${getMediumById(mediumId)?.name || mediumId}`,
    code: `${grade}-${getMediumById(mediumId)?.code || mediumId.toUpperCase()}`,
    mediumId,
    level: baseConfig.level || 'primary',
    sections: baseConfig.sections || [],
    fees: baseConfig.fees || {},
    subjects: baseConfig.subjects || []
  }));
};

