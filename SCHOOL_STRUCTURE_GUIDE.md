# 🏫 School Structure Configuration Guide

This guide explains how to configure your school's mediums, classes, and sections in the ERP system.

## 📁 Where to Configure

### 1. **Main Configuration File**
```
src/config/schoolConfig.ts
```
This is the **main file** where you define your school's structure.

### 2. **Management Interface**
```
http://localhost:3000/settings/school-structure
```
Web interface to view and manage all school structure settings.

## 🔧 How to Configure

### **Step 1: Define Language Mediums**

Edit `src/config/schoolConfig.ts`:

```typescript
export const SCHOOL_MEDIUMS: MediumConfig[] = [
  {
    id: 'english',           // Unique identifier
    name: 'English Medium',  // Display name
    code: 'EN',             // Short code
    description: 'English medium instruction',
    isActive: true          // Set to false to disable
  },
  {
    id: 'hindi',
    name: 'Hindi Medium', 
    code: 'HI',
    description: 'Hindi medium instruction',
    isActive: true
  },
  // Add more mediums as needed
];
```

### **Step 2: Define Classes and Sections**

For each class, specify:
- Which medium it belongs to
- Available sections with capacity
- Fee structure
- Subjects offered

```typescript
{
  id: '1',                    // Class ID (used in database)
  name: 'Class 1',            // Display name
  code: '1',                  // Short code
  mediumId: 'english',        // Which medium this class belongs to
  level: 'primary',           // Education level
  sections: [                 // Available sections
    { id: '1-a', name: 'A', code: '1-A', capacity: 35 },
    { id: '1-b', name: 'B', code: '1-B', capacity: 35 },
    { id: '1-c', name: 'C', code: '1-C', capacity: 35 }
  ],
  fees: {                     // Fee structure for this class
    tuition: 40000,
    transport: 10000,
    lab: 5000
  },
  subjects: [                 // Subjects taught
    'English', 'Math', 'Science', 'Social Studies', 'Computer'
  ]
}
```

### **Step 3: Configure Fee Structure**

Each class can have different fees:

```typescript
fees: {
  tuition: 40000,      // Annual tuition fee
  transport: 10000,    // Transport fee (optional)
  lab: 5000,          // Lab fee (optional)
  exam: 2000          // Exam fee (optional)
}
```

## 📚 Education Levels

- **kindergarten**: Nursery, LKG, UKG
- **primary**: Classes 1-5
- **middle**: Classes 6-8
- **high**: Classes 9-10
- **higher_secondary**: Classes 11-12

## 🎯 How It Works

### **Automatic Fee Assignment**
When a new student is admitted:
1. System checks student's class and medium
2. Finds matching fee structures
3. Auto-creates fee records
4. Applies appropriate fees based on configuration

### **Dynamic Form Fields**
- Student admission form automatically shows:
  - Available mediums
  - Classes based on selected medium
  - Sections based on selected class

### **Fee Structure Management**
- Fee structures can be assigned to specific:
  - Classes (e.g., Lab fee only for Classes 9-12)
  - Categories (e.g., Special fees for SC/ST)
  - Mediums (e.g., Different fees for English vs Regional medium)

## 📝 Example Configurations

### **English Medium School**
```typescript
// All classes use English medium
{
  id: '1',
  name: 'Class 1',
  mediumId: 'english',
  sections: [
    { id: '1-a', name: 'A', capacity: 40 },
    { id: '1-b', name: 'B', capacity: 40 }
  ]
}
```

### **Multi-Medium School**
```typescript
// Same class available in multiple mediums
{
  id: '1', name: 'Class 1', mediumId: 'english', ... },
{ id: '1-hindi', name: 'Class 1', mediumId: 'hindi', ... }
```

### **Stream-Based Higher Secondary**
```typescript
{
  id: '11',
  name: 'Class 11',
  sections: [
    { id: '11-a', name: 'A', capacity: 50 }, // Science
    { id: '11-b', name: 'B', capacity: 50 }, // Commerce  
    { id: '11-c', name: 'C', capacity: 40 }  // Arts
  ]
}
```

## 🔄 Making Changes

### **Adding New Medium**
1. Add to `SCHOOL_MEDIUMS` array
2. Set `isActive: true`
3. Create classes with `mediumId` pointing to new medium

### **Adding New Class**
1. Add to `SCHOOL_CLASSES` array
2. Define sections and capacity
3. Set appropriate fees
4. Specify subjects

### **Updating Fees**
1. Edit `fees` object in class configuration
2. Changes apply to new admissions only
3. Existing students keep their current fee structure

### **Adding Sections**
1. Add to `sections` array in class configuration
2. Update capacity as needed
3. Assign room numbers if available

## 🚀 Advanced Features

### **Conditional Sections**
```typescript
// Different sections for different mediums
{
  id: '1-english',
  name: 'Class 1',
  mediumId: 'english',
  sections: [
    { id: '1-en-a', name: 'A', capacity: 35 },
    { id: '1-en-b', name: 'B', capacity: 35 }
  ]
},
{
  id: '1-hindi', 
  name: 'Class 1',
  mediumId: 'hindi',
  sections: [
    { id: '1-hi-a', name: 'A', capacity: 30 }
  ]
}
```

### **Variable Fees by Category**
Fee structures can be assigned based on:
- Student's class
- Student's category (General, OBC, SC, ST)
- Language medium
- Any combination of these

## 📊 Viewing Configuration

Visit `/settings/school-structure` to:
- View complete school structure
- See capacity and enrollment stats
- Manage fee structures
- Export configuration data

## ⚠️ Important Notes

1. **Database Compatibility**: Class IDs must match existing student records
2. **Fee Integration**: Fee structures integrate with automatic fee assignment
3. **Capacity Planning**: Section capacities affect enrollment limits
4. **Backup**: Always backup configuration before making changes

## 🆘 Troubleshooting

### **Classes Not Showing**
- Check if `isActive: true` is set
- Verify medium is active
- Ensure class ID format matches database

### **Fees Not Applying**
- Verify fee structure is marked as active
- Check class/category matching rules
- Review student's profile data

### **Section Issues**
- Ensure section IDs are unique
- Check capacity limits
- Verify room assignments

For support, check the console logs and verify the configuration syntax.
