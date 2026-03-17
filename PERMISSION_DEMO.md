# Page-Specific Permission Control Demo

## 🎯 **Problem Solved**
Teachers can now **view** the Fees page but **cannot manage** fees without proper permissions.

## 🔧 **Implementation Overview**

### **1. Permission Hook** (`src/hooks/usePermissions.ts`)
```typescript
const { hasPermission, isAdmin, isTeacher } = usePermissions();
```

### **2. Permission Guard Component** (`src/components/PermissionGuard.tsx`)
```typescript
<RequirePermission permission="manage_fees">
  <button>Create Fee Structure</button>
</RequirePermission>
```

### **3. Fees Page Updates** (`src/app/fees/page.tsx`)

#### **Tab Filtering**
Teachers see these tabs:
- ✅ Dashboard (no permission required)
- ❌ Structures (requires `manage_fees`)
- ❌ Collections (requires `manage_fees`) 
- ❌ Discounts (requires `manage_fees`)
- ✅ Reports (no permission required)
- ✅ Invoices (requires `view_fees`)
- ✅ Analytics (no permission required)
- ✅ Notifications (no permission required)

#### **Action Buttons**
```typescript
<RequirePermission permission="manage_fees">
  <button>💰 Create Fee Structure</button>
</RequirePermission>

{/* Fallback for users without permission */}
{!hasPermission('manage_fees') && (
  <div>🔒 Fee management requires additional permissions</div>
)}
```

## 📊 **Teacher vs Admin Experience**

### **Teacher (Default Permissions)**
| Feature | Status | Reason |
|---------|--------|---------|
| **View Fees** | ✅ Allowed | `view_fees` permission |
| **View Reports** | ✅ Allowed | No permission required |
| **View Analytics** | ✅ Allowed | No permission required |
| **Create Fee Structure** | ❌ Blocked | Missing `manage_fees` |
| **Receive Payments** | ❌ Blocked | Missing `manage_fees` |
| **Manage Discounts** | ❌ Blocked | Missing `manage_fees` |

### **Admin (Full Access)**
| Feature | Status | Reason |
|---------|--------|---------|
| **All Features** | ✅ Allowed | Admin gets all permissions |

## 🎛️ **How to Grant Teachers Fee Management**

### **Option 1: Custom Role**
1. Go to **Settings → Access Rights**
2. Create custom role "Fee Manager"
3. Add permissions: `view_fees`, `manage_fees`
4. Assign to teacher

### **Option 2: Individual Permissions**
1. Go to **Settings → Access Rights**
2. Edit teacher's custom role
3. Add `manage_fees` permission

## 🔄 **Applying to Other Pages**

### **Students Page Example**
```typescript
// Hide "Add Student" from teachers
<RequirePermission permission="create_students">
  <button>Add Student</button>
</RequirePermission>

// Show "Delete" only to admins
<AdminOnly>
  <button>Delete Student</button>
</AdminOnly>
```

### **Teachers Page Example**
```typescript
// Teachers can view other teachers but not manage them
<RequirePermission permission="manage_teachers">
  <button>Edit Teacher</button>
</RequirePermission>
```

## 🎯 **Benefits**

1. **Granular Control**: Each action can be individually permitted
2. **Role-Based**: Teachers, students, parents have different defaults
3. **Customizable**: Override defaults with custom roles
4. **User-Friendly**: Clear messages when access is denied
5. **Secure**: Backend API also enforces permissions

## 🚀 **Next Steps**

1. Apply same pattern to other pages (Students, Teachers, etc.)
2. Add more granular permissions as needed
3. Create permission templates for common role combinations
4. Add permission audit logging

## 📝 **Available Permissions**

From `src/lib/permissions.ts`:
- `view_students`, `create_students`, `edit_students`, `delete_students`
- `view_teachers`, `create_teachers`, `edit_teachers`, `delete_teachers`
- `view_attendance`, `manage_attendance`
- `view_fees`, `manage_fees`
- `view_exams`, `manage_exams`
- `view_reports`
- `view_settings`, `manage_settings`
- `view_users`, `manage_users`
- `view_announcements`

**Ready for production!** 🎓✨
