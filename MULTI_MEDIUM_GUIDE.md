# 🏫 Multi-Medium Classes Configuration Guide

This guide explains how to configure the same class (like Class 1) in multiple languages (English, Kannada, Hindi, etc.).

## 🎯 **What You Want to Achieve**

You want to have:
- **Class 1 - English Medium** (Sections A, B, C, D)
- **Class 1 - Kannada Medium** (Sections A, B)
- **Class 2 - English Medium** (Sections A, B, C, D)
- **Class 2 - Kannada Medium** (Sections A, B)
- And so on...

## ✅ **Current Configuration (Already Done!)**

I've already configured Classes 1-5 in both English and Kannada mediums:

### **Primary Classes (1-5) - Both Mediums**

| Grade | English Medium | Kannada Medium |
|-------|----------------|----------------|
| **Class 1** | `1-en` - 4 sections (35 capacity) | `1-kn` - 2 sections (30 capacity) |
| **Class 2** | `2-en` - 4 sections (35 capacity) | `2-kn` - 2 sections (30 capacity) |
| **Class 3** | `3-en` - 3 sections (35 capacity) | `3-kn` - 2 sections (30 capacity) |
| **Class 4** | `4-en` - 3 sections (40 capacity) | `4-kn` - 2 sections (30 capacity) |
| **Class 5** | `5-en` - 3 sections (40 capacity) | `5-kn` - 2 sections (30 capacity) |

### **Key Differences**
- **Different Fees**: Kannada medium has lower fees (₹35,000 vs ₹40,000 for Class 1)
- **Different Subjects**: Kannada medium includes Kannada language + English
- **Different Capacity**: Smaller sections for Kannada medium
- **Different Codes**: `1-EN` vs `1-KN`

## 🔧 **How It Works**

### **1. Unique IDs for Each Medium**
```typescript
// English Medium
{
  id: '1-en',           // Unique ID
  name: 'Class 1 - English',
  code: '1-EN',
  mediumId: 'english',  // Links to English medium
}

// Kannada Medium  
{
  id: '1-kn',           // Unique ID
  name: 'Class 1 - Kannada',
  code: '1-KN', 
  mediumId: 'kannada',  // Links to Kannada medium
}
```

### **2. Medium-Specific Configuration**
```typescript
// English Medium - Higher fees
fees: { tuition: 40000, transport: 10000 }
subjects: ['English', 'Math', 'Science', 'Social Studies', ...]

// Kannada Medium - Lower fees
fees: { tuition: 35000, transport: 8000 }
subjects: ['Kannada', 'English', 'Math', 'Science', ...]
```

### **3. Separate Sections**
```typescript
// English Medium - More sections
sections: [
  { id: '1-en-a', name: 'A', capacity: 35 },
  { id: '1-en-b', name: 'B', capacity: 35 },
  { id: '1-en-c', name: 'C', capacity: 35 },
  { id: '1-en-d', name: 'D', capacity: 35 }
]

// Kannada Medium - Fewer sections
sections: [
  { id: '1-kn-a', name: 'A', capacity: 30 },
  { id: '1-kn-b', name: 'B', capacity: 30 }
]
```

## 📝 **How to Add More Classes in Multiple Mediums**

### **Method 1: Manual Configuration**

For Class 6 in both mediums:

```typescript
// Add to SCHOOL_CLASSES array in src/config/schoolConfig.ts

{
  id: '6-en',
  name: 'Class 6 - English',
  code: '6-EN',
  mediumId: 'english',
  level: 'middle',
  sections: [
    { id: '6-en-a', name: 'A', code: '6-EN-A', capacity: 40 },
    { id: '6-en-b', name: 'B', code: '6-EN-B', capacity: 40 }
  ],
  fees: { tuition: 55000, transport: 12000, lab: 8000 },
  subjects: ['English', 'Math', 'Physics', 'Chemistry', 'Biology', ...]
},
{
  id: '6-kn',
  name: 'Class 6 - Kannada',
  code: '6-KN',
  mediumId: 'kannada',
  level: 'middle',
  sections: [
    { id: '6-kn-a', name: 'A', code: '6-KN-A', capacity: 35 },
    { id: '6-kn-b', name: 'B', code: '6-KN-B', capacity: 35 }
  ],
  fees: { tuition: 50000, transport: 10000, lab: 7000 },
  subjects: ['Kannada', 'English', 'Math', 'Physics', 'Chemistry', ...]
}
```

### **Method 2: Using Helper Functions**

```typescript
import { createMultiMediumClass } from '@/config/schoolConfig';

// Create Class 7 for both English and Kannada
const class7MultiMedium = createMultiMediumClass('7', ['english', 'kannada'], {
  level: 'middle',
  sections: [
    { id: '7-en-a', name: 'A', capacity: 40 },
    { id: '7-en-b', name: 'B', capacity: 40 }
  ],
  fees: { tuition: 58000, transport: 12000, lab: 8000 },
  subjects: ['English', 'Math', 'Physics', 'Chemistry', 'Biology', 'Social Studies']
});

// Add to SCHOOL_CLASSES array
SCHOOL_CLASSES.push(...class7MultiMedium);
```

## 🎨 **How It Appears in the UI**

### **Student Admission Form**
1. **Select Medium**: English or Kannada
2. **Select Class**: Shows only classes for that medium
   - If English selected: Shows "Class 1 - English", "Class 2 - English", etc.
   - If Kannada selected: Shows "Class 1 - Kannada", "Class 2 - Kannada", etc.
3. **Select Section**: Shows sections for that specific class-medium combination

### **Settings Page**
- **Mediums Tab**: Shows both English and Kannada as active
- **Classes Tab**: Shows all classes with medium indicators
- **Sections Tab**: Shows all sections with their class and medium

### **Fee Structure**
- Different fee structures automatically apply based on:
  - Student's class
  - Student's medium
  - Student's category

## 📊 **Benefits of This Approach**

### **1. Complete Flexibility**
- Different fees for different mediums
- Different subjects for different mediums
- Different capacity for different mediums
- Different sections for different mediums

### **2. Clear Organization**
- Unique IDs prevent confusion
- Clear naming convention (`Class 1 - English`)
- Proper medium linking

### **3. Scalable**
- Easy to add new mediums (Hindi, Urdu, etc.)
- Easy to add new classes
- Helper functions for bulk operations

### **4. Database Friendly**
- Unique class IDs for database storage
- Proper relationships
- Easy reporting and analytics

## 🔍 **How to View Current Configuration**

### **1. Check the Configuration File**
```bash
# Open the configuration
src/config/schoolConfig.ts
```

### **2. Use the Settings UI**
1. Go to `/settings/school-structure`
2. Click on **Classes** tab
3. You'll see:
   - "Class 1 - English" (English Medium)
   - "Class 1 - Kannada" (Kannada Medium)
   - "Class 2 - English" (English Medium)
   - "Class 2 - Kannada" (Kannada Medium)
   - etc.

### **3. Use Helper Functions**
```typescript
import { getMultiMediumClasses } from '@/config/schoolConfig';

// Get all classes organized by grade
const multiMediumClasses = getMultiMediumClasses();
console.log(multiMediumClasses);
// Output: [
//   { grade: '1', classes: [Class1-English, Class1-Kannada] },
//   { grade: '2', classes: [Class2-English, Class2-Kannada] },
//   ...
// ]
```

## 🚀 **Advanced Configuration Examples**

### **Example 1: Three Mediums**
```typescript
// Add Hindi medium for Classes 1-3
['1-hi', '2-hi', '3-hi'].forEach((id, index) => {
  const grade = (index + 1).toString();
  SCHOOL_CLASSES.push({
    id: `${grade}-hi`,
    name: `Class ${grade} - Hindi`,
    code: `${grade}-HI`,
    mediumId: 'hindi',
    level: 'primary',
    sections: [
      { id: `${grade}-hi-a`, name: 'A', capacity: 30 }
    ],
    fees: { tuition: 32000, transport: 8000 },
    subjects: ['Hindi', 'English', 'Math', 'Science', ...]
  });
});
```

### **Example 2: Different Fee Structures**
```typescript
// Government subsidized Kannada medium
{
  id: '1-kn',
  name: 'Class 1 - Kannada',
  fees: { 
    tuition: 25000,    // Lower tuition
    transport: 6000,   // Lower transport
    government: true   // Special flag
  }
}

// Private English medium
{
  id: '1-en', 
  name: 'Class 1 - English',
  fees: {
    tuition: 40000,    // Higher tuition
    transport: 10000,  // Higher transport
    lab: 5000         // Additional lab fees
  }
}
```

### **Example 3: Stream-Based Higher Classes**
```typescript
// Class 11 with streams and mediums
{
  id: '11-en-science',
  name: 'Class 11 - English - Science',
  code: '11-EN-SCI',
  mediumId: 'english',
  level: 'higher_secondary',
  sections: [
    { id: '11-en-sci-a', name: 'A', capacity: 50 }
  ],
  subjects: ['English', 'Math', 'Physics', 'Chemistry', 'Biology']
},
{
  id: '11-kn-commerce',
  name: 'Class 11 - Kannada - Commerce', 
  code: '11-KN-COM',
  mediumId: 'kannada',
  level: 'higher_secondary',
  sections: [
    { id: '11-kn-com-a', name: 'A', capacity: 40 }
  ],
  subjects: ['Kannada', 'English', 'Accountancy', 'Economics', 'Business Studies']
}
```

## 📋 **Naming Conventions**

### **Class IDs**
- Format: `{grade}-{medium-code}`
- Examples: `1-en`, `1-kn`, `2-en`, `2-kn`
- Avoid: `class1-english`, `class1-kannada` (too long)

### **Class Names**
- Format: `Class {grade} - {Medium Name}`
- Examples: `Class 1 - English`, `Class 1 - Kannada`
- Avoid: `English Class 1`, `Kannada Class 1`

### **Section IDs**
- Format: `{class-id}-{section-name}`
- Examples: `1-en-a`, `1-kn-a`, `2-en-b`
- Avoid: `section-a-english`, `section-a-kannada`

### **Codes**
- Format: `{grade}-{MEDIUM-CODE}`
- Examples: `1-EN`, `1-KN`, `2-EN`, `2-KN`
- Avoid: `CLASS1ENGLISH`, `CLASS1KANNADA`

## ⚠️ **Important Notes**

### **1. Database Impact**
- Changing class IDs affects student records
- Always backup before making changes
- Test with sample data first

### **2. Fee Structure**
- Different mediums can have different fees
- Fee auto-assignment works correctly
- Consider government subsidies for regional languages

### **3. Subject Configuration**
- Regional medium classes include regional language
- English as second language in regional mediums
- Adjust based on board requirements

### **4. Capacity Planning**
- Regional mediums may have lower demand
- Adjust section capacities accordingly
- Consider future growth

## 🎯 **Summary**

Your multi-medium class configuration is **already set up** for Classes 1-5 in both English and Kannada mediums! 

**Key Features:**
- ✅ Same grade, different mediums
- ✅ Different fees per medium
- ✅ Different subjects per medium  
- ✅ Different sections per medium
- ✅ Unique IDs for database integrity
- ✅ Professional UI display

**To add more classes:**
1. Use the manual method for one-off additions
2. Use helper functions for bulk additions
3. Follow the naming conventions
4. Test in the UI before deploying

**Your school now supports proper multi-medium education!** 🎓✨
