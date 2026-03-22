"use client";
import React, { useEffect, useMemo, useState } from "react";
import ClassTeacherFormAssignments from "./ClassTeacherFormAssignments";

export type StaffFormData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  customRoleId: string;
  department: string;
  subject: string;
  qualification: string;
  experience: string;
  employeeId: string;
  status: string;
  joiningDate: string;
  gender: string;
  dateOfBirth: string;
  address: string;
  designation: string;
  salary: string;
  bankName: string;
  bankAccountNo: string;
  bankIfsc: string;
  emergencyName: string;
  emergencyPhone: string;
  remarks: string;
  photo: string;
  aadharNumber: string;
  bloodGroup: string;
  isClassTeacher: boolean;
  classTeacherAssignments: any[];
};

const EMPTY_FORM: StaffFormData = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  role: "teacher",
  customRoleId: "",
  department: "",
  subject: "",
  qualification: "",
  experience: "",
  employeeId: "",
  status: "active",
  joiningDate: "",
  gender: "",
  dateOfBirth: "",
  address: "",
  designation: "",
  salary: "",
  bankName: "",
  bankAccountNo: "",
  bankIfsc: "",
  emergencyName: "",
  emergencyPhone: "",
  remarks: "",
  photo: "",
  aadharNumber: "",
  bloodGroup: "",
  isClassTeacher: false,
  classTeacherAssignments: [],
};

interface StaffFormProps {
  mode: "add" | "edit";
  theme: "dark" | "light";
  initialData?: Partial<StaffFormData>;
  boards: any[];
  mediums: any[];
  classes: any[];
  sections: any[];
  academicYears: any[];
  loading?: boolean;
  onSubmit: (data: StaffFormData) => Promise<void> | void;
  onCancel: () => void;
}

export default function StaffForm({
  mode,
  theme,
  initialData,
  boards,
  mediums,
  classes,
  sections,
  academicYears,
  loading,
  onSubmit,
  onCancel,
}: StaffFormProps) {
  const [formData, setFormData] = useState<StaffFormData>({ ...EMPTY_FORM, ...initialData });
  const [customRoles, setCustomRoles] = useState<any[]>([]);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    setFormData({ ...EMPTY_FORM, ...initialData });
  }, [JSON.stringify(initialData)]);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await fetch('/api/roles?cache=true');
        if (!response.ok) return;
        const data = await response.json();
        const roles = data.roles || [];
        setCustomRoles(roles);

        if (mode === 'add') {
          const defaultRole = roles.find((r: any) => r.isDefault);
          setFormData(prev => ({
            ...prev,
            customRoleId: prev.customRoleId || defaultRole?.id || roles[0]?.id || '',
            role: prev.role || 'teacher',
          }));
        }
      } catch (err) {
        console.error('Failed to load roles for staff form:', err);
      }
    };

    fetchRoles();
  }, [mode]);

  const isDark = theme === "dark";
  const txt = isDark ? "text-white" : "text-gray-900";
  const sub = isDark ? "text-gray-400" : "text-gray-600";
  const inputCls = useMemo(
    () =>
      `w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-blue-500 ${
        isDark
          ? "bg-gray-800 border-gray-600 text-white placeholder-gray-400"
          : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
      }`,
    [isDark]
  );
  const helperTextCls = `text-xs ${isDark ? "text-gray-500" : "text-gray-500"}`;

  const handleChange = (field: keyof StaffFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName?.trim()) {
      setError("First name is required");
      return;
    }
    if (!formData.lastName?.trim()) {
      setError("Last name is required");
      return;
    }
    if (mode === 'add' && !formData.email?.trim()) {
      setError('Email is required to create the linked staff user');
      return;
    }
    if (mode === 'add' && customRoles.length > 0 && !formData.customRoleId) {
      setError('Please select a role from settings');
      return;
    }
    setError("");
    await onSubmit({ ...formData, name: `${formData.firstName} ${formData.lastName}`.trim() } as any);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Basic Info */}
      <section className={`p-4 rounded-xl border ${isDark ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-200"}`}>
        <h4 className={`text-sm font-semibold mb-3 ${txt}`}>Basic Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="md:col-span-2">
            <label className={`block text-xs font-medium mb-1 ${sub}`}>Photo</label>
            <div className="flex items-center gap-4">
              {formData.photo && (
                <img
                  src={formData.photo}
                  alt="Staff photo"
                  className="w-16 h-16 rounded-full object-cover border-2 border-gray-300"
                />
              )}
              <input
                type="file"
                accept="image/*"
                className={inputCls}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      handleChange("photo", reader.result as string);
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
            </div>
          </div>
          <div>
            <label className={`block text-xs font-medium mb-1 ${sub}`}>First Name *</label>
            <input
              type="text"
              className={inputCls}
              value={formData.firstName}
              onChange={(e) => handleChange("firstName", e.target.value)}
              placeholder="First name"
            />
          </div>
          <div>
            <label className={`block text-xs font-medium mb-1 ${sub}`}>Last Name *</label>
            <input
              type="text"
              className={inputCls}
              value={formData.lastName}
              onChange={(e) => handleChange("lastName", e.target.value)}
              placeholder="Last name"
            />
          </div>
          <div>
            <label className={`block text-xs font-medium mb-1 ${sub}`}>Email *</label>
            <input
              type="email"
              className={inputCls}
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              placeholder="staff@school.com"
            />
          </div>
          <div>
            <label className={`block text-xs font-medium mb-1 ${sub}`}>Phone</label>
            <input
              type="tel"
              className={inputCls}
              value={formData.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              placeholder="+91 98765 43210"
            />
          </div>
        </div>
      </section>

      {mode === 'add' && (
        <section className={`p-4 rounded-xl border ${isDark ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-200"}`}>
          <h4 className={`text-sm font-semibold mb-3 ${txt}`}>Access Role</h4>
          {customRoles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className={`block text-xs font-medium mb-1 ${sub}`}>Role from Settings *</label>
                <select
                  className={inputCls}
                  value={formData.customRoleId}
                  onChange={(e) => handleChange("customRoleId", e.target.value)}
                >
                  <option value="">Select a role from settings</option>
                  {customRoles.map((role: any) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
                <p className={helperTextCls}>This role comes from Settings → Roles</p>
              </div>
              <div>
                <label className={`block text-xs font-medium mb-1 ${sub}`}>Fallback Base Role</label>
                <select
                  className={inputCls}
                  value={formData.role}
                  onChange={(e) => handleChange("role", e.target.value)}
                >
                  <option value="teacher">Teacher</option>
                  <option value="admin">Admin</option>
                  <option value="parent">Parent</option>
                  <option value="student">Student</option>
                </select>
                <p className={helperTextCls}>Used when the custom role is linked to the staff account</p>
              </div>
            </div>
          ) : (
            <div className={`rounded-xl border p-4 ${isDark ? "border-gray-700 bg-gray-900/40" : "border-gray-200 bg-white"}`}>
              <p className={`text-sm font-medium ${txt}`}>No roles are defined in Settings yet.</p>
              <p className={helperTextCls}>The linked user account will be created with the default base role: <span className="font-semibold">Teacher</span>.</p>
              <input type="hidden" value={formData.role} readOnly />
            </div>
          )}
        </section>
      )}

      {/* Job Details */}
      <section className={`p-4 rounded-xl border ${isDark ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-200"}`}>
        <h4 className={`text-sm font-semibold mb-3 ${txt}`}>Job Details</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className={`block text-xs font-medium mb-1 ${sub}`}>Department</label>
            <input
              type="text"
              className={inputCls}
              value={formData.department}
              onChange={(e) => handleChange("department", e.target.value)}
              placeholder="e.g., Science Department"
            />
          </div>
          <div>
            <label className={`block text-xs font-medium mb-1 ${sub}`}>Designation</label>
            <input
              type="text"
              className={inputCls}
              value={formData.designation}
              onChange={(e) => handleChange("designation", e.target.value)}
              placeholder="e.g., Mathematics Teacher"
            />
          </div>
          <div>
            <label className={`block text-xs font-medium mb-1 ${sub}`}>Subject</label>
            <input
              type="text"
              className={inputCls}
              value={formData.subject}
              onChange={(e) => handleChange("subject", e.target.value)}
              placeholder="e.g., Mathematics"
            />
          </div>
          <div>
            <label className={`block text-xs font-medium mb-1 ${sub}`}>Qualification</label>
            <input
              type="text"
              className={inputCls}
              value={formData.qualification}
              onChange={(e) => handleChange("qualification", e.target.value)}
              placeholder="e.g., M.Sc. Mathematics"
            />
          </div>
          <div>
            <label className={`block text-xs font-medium mb-1 ${sub}`}>Experience (years)</label>
            <input
              type="number"
              className={inputCls}
              value={formData.experience}
              onChange={(e) => handleChange("experience", e.target.value)}
              placeholder="5"
            />
          </div>
          <div>
            <label className={`block text-xs font-medium mb-1 ${sub}`}>Salary</label>
            <input
              type="number"
              className={inputCls}
              value={formData.salary}
              onChange={(e) => handleChange("salary", e.target.value)}
              placeholder="50000"
            />
          </div>
          <div>
            <label className={`block text-xs font-medium mb-1 ${sub}`}>Joining Date</label>
            <input
              type="date"
              className={inputCls}
              value={formData.joiningDate}
              onChange={(e) => handleChange("joiningDate", e.target.value)}
            />
          </div>
          <div>
            <label className={`block text-xs font-medium mb-1 ${sub}`}>Employee ID</label>
            <input
              type="text"
              className={inputCls}
              value={formData.employeeId}
              onChange={(e) => handleChange("employeeId", e.target.value)}
              placeholder="Auto-generated if empty"
            />
          </div>
          <div>
            <label className={`block text-xs font-medium mb-1 ${sub}`}>Status</label>
            <select
              className={inputCls}
              value={formData.status}
              onChange={(e) => handleChange("status", e.target.value)}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </section>

      {/* Personal Details */}
      <section className={`p-4 rounded-xl border ${isDark ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-200"}`}>
        <h4 className={`text-sm font-semibold mb-3 ${txt}`}>Personal Details</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className={`block text-xs font-medium mb-1 ${sub}`}>Gender</label>
            <select
              className={inputCls}
              value={formData.gender}
              onChange={(e) => handleChange("gender", e.target.value)}
            >
              <option value="">Select...</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className={`block text-xs font-medium mb-1 ${sub}`}>Date of Birth</label>
            <input
              type="date"
              className={inputCls}
              value={formData.dateOfBirth}
              onChange={(e) => handleChange("dateOfBirth", e.target.value)}
            />
          </div>
        </div>
        <div className="mt-3">
          <label className={`block text-xs font-medium mb-1 ${sub}`}>Address</label>
          <textarea
            className={inputCls}
            rows={3}
            value={formData.address}
            onChange={(e) => handleChange("address", e.target.value)}
            placeholder="Enter full address"
          />
        </div>
      </section>

      {/* Bank & Emergency */}
      <section className={`p-4 rounded-xl border ${isDark ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-200"}`}>
        <h4 className={`text-sm font-semibold mb-3 ${txt}`}>Bank & Emergency</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className={`block text-xs font-medium mb-1 ${sub}`}>Bank Name</label>
            <input
              type="text"
              className={inputCls}
              value={formData.bankName}
              onChange={(e) => handleChange("bankName", e.target.value)}
              placeholder="e.g., State Bank of India"
            />
          </div>
          <div>
            <label className={`block text-xs font-medium mb-1 ${sub}`}>Bank Account No.</label>
            <input
              type="text"
              className={inputCls}
              value={formData.bankAccountNo}
              onChange={(e) => handleChange("bankAccountNo", e.target.value)}
              placeholder="Account number"
            />
          </div>
          <div>
            <label className={`block text-xs font-medium mb-1 ${sub}`}>IFSC</label>
            <input
              type="text"
              className={inputCls}
              value={formData.bankIfsc}
              onChange={(e) => handleChange("bankIfsc", e.target.value)}
              placeholder="IFSC Code"
            />
          </div>
          <div>
            <label className={`block text-xs font-medium mb-1 ${sub}`}>Emergency Contact Name</label>
            <input
              type="text"
              className={inputCls}
              value={formData.emergencyName}
              onChange={(e) => handleChange("emergencyName", e.target.value)}
              placeholder="Emergency contact name"
            />
          </div>
          <div>
            <label className={`block text-xs font-medium mb-1 ${sub}`}>Emergency Contact Phone</label>
            <input
              type="tel"
              className={inputCls}
              value={formData.emergencyPhone}
              onChange={(e) => handleChange("emergencyPhone", e.target.value)}
              placeholder="Emergency phone"
            />
          </div>
        </div>
        <div className="mt-3">
          <label className={`block text-xs font-medium mb-1 ${sub}`}>Remarks</label>
          <textarea
            className={inputCls}
            rows={3}
            value={formData.remarks}
            onChange={(e) => handleChange("remarks", e.target.value)}
            placeholder="Any additional remarks"
          />
        </div>
      </section>

      {/* Class Teacher Assignments */}
      <section className={`p-4 rounded-xl border ${isDark ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-200"}`}>
        <div className="flex items-center gap-2 mb-3">
          <input
            id="isClassTeacher-toggle"
            type="checkbox"
            checked={formData.isClassTeacher}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                isClassTeacher: e.target.checked,
                classTeacherAssignments: e.target.checked ? prev.classTeacherAssignments : [],
              }))
            }
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="isClassTeacher-toggle" className={`text-sm font-medium ${txt}`}>
            Is this staff member a Class Teacher?
          </label>
        </div>

        {formData.isClassTeacher && (
          <ClassTeacherFormAssignments
            assignments={formData.classTeacherAssignments}
            boards={boards}
            mediums={mediums}
            classes={classes}
            sections={sections}
            academicYears={academicYears}
            theme={theme}
            onChange={(assignments) => setFormData((prev) => ({ ...prev, classTeacherAssignments: assignments }))}
          />
        )}
      </section>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className={`px-5 py-3 rounded-lg text-sm font-medium transition-colors ${
            isDark ? "text-gray-300 hover:bg-gray-700" : "text-gray-700 hover:bg-gray-100"
          }`}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!!loading}
          className={`px-6 py-3 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 ${
            isDark ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"
          }`}
        >
          {loading ? (mode === "add" ? "Adding..." : "Saving...") : mode === "add" ? "Add Staff" : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
