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
  externalError?: string;
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
  externalError,
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
      `w-full rounded-2xl border px-3 py-2.5 text-sm outline-none transition-colors focus:ring-2 focus:ring-blue-500/20 ${
        isDark
          ? "bg-gray-900/70 border-gray-700 text-white placeholder-gray-400"
          : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
      }`,
    [isDark]
  );
  const helperTextCls = `text-xs ${isDark ? "text-gray-500" : "text-gray-500"}`;
  const sectionCls = `rounded-[28px] border p-4 shadow-sm ${isDark ? "border-white/10 bg-white/[0.03]" : "border-gray-200 bg-white/90"}`;
  const sectionTitleCls = `text-sm font-semibold ${txt}`;
  const labelCls = `block text-[11px] font-semibold uppercase tracking-[0.14em] mb-1.5 ${sub}`;
  const pillCls = `${isDark ? "bg-white/5 text-gray-300" : "bg-gray-100 text-gray-600"} rounded-full px-2.5 py-1 text-[11px] font-medium`;
  const combinedError = error || externalError;
  const profileName = `${formData.firstName} ${formData.lastName}`.trim() || 'New Staff Member';
  const initials = `${formData.firstName?.[0] || ''}${formData.lastName?.[0] || ''}`.trim() || 'SM';
  const completionItems = [
    formData.firstName,
    formData.lastName,
    formData.email,
    formData.employeeId,
    formData.department,
    formData.designation,
    formData.phone,
    formData.joiningDate,
  ].filter((value) => !!value).length;

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
    if (!formData.email?.trim()) {
      setError('Email is required to create or maintain the linked staff user');
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
    <form onSubmit={handleSubmit} className="space-y-4">
      {combinedError && (
        <div className={`rounded-2xl border px-4 py-3 text-sm ${isDark ? "border-red-500/30 bg-red-500/10 text-red-200" : "border-red-200 bg-red-50 text-red-700"}`}>
          {combinedError}
        </div>
      )}

      <div className={`overflow-hidden rounded-[32px] border p-4 shadow-xl ${isDark ? "border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.12),_transparent_35%),linear-gradient(135deg,rgba(17,24,39,0.98),rgba(15,23,42,0.96))]" : "border-gray-200 bg-[radial-gradient(circle_at_top_left,_rgba(191,219,254,0.85),_transparent_35%),linear-gradient(135deg,rgba(255,255,255,0.98),rgba(248,250,252,0.96))]"}`}>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-3">
            {formData.photo ? (
              <img
                src={formData.photo}
                alt="Staff photo"
                className="h-16 w-16 rounded-2xl object-cover shadow-lg ring-4 ring-white/10"
              />
            ) : (
              <div className={`flex h-16 w-16 items-center justify-center rounded-2xl text-xl font-bold shadow-lg ${isDark ? "bg-white/10 text-white" : "bg-blue-100 text-blue-700"}`}>
                {initials}
              </div>
            )}
            <div>
              <div className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${isDark ? "bg-blue-500/10 text-blue-200" : "bg-blue-50 text-blue-700"}`}>
                {mode === "add" ? "New Staff Profile" : "Edit Staff Profile"}
              </div>
              <h3 className={`mt-2 text-xl font-bold ${txt}`}>{profileName}</h3>
              <p className={`mt-1 text-sm ${sub}`}>
                {formData.designation || "Add designation"} {formData.department ? `• ${formData.department}` : "• Assign department"}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <div className={`rounded-2xl border px-3 py-2.5 ${isDark ? "border-white/10 bg-white/[0.04]" : "border-gray-200 bg-white/80"}`}>
              <div className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${sub}`}>Profile</div>
              <div className={`mt-1 text-lg font-bold ${txt}`}>{completionItems}/8</div>
            </div>
            <div className={`rounded-2xl border px-3 py-2.5 ${isDark ? "border-white/10 bg-white/[0.04]" : "border-gray-200 bg-white/80"}`}>
              <div className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${sub}`}>Role</div>
              <div className={`mt-1 text-sm font-semibold ${txt}`}>{formData.role || "teacher"}</div>
            </div>
            <div className={`rounded-2xl border px-3 py-2.5 ${isDark ? "border-white/10 bg-white/[0.04]" : "border-gray-200 bg-white/80"}`}>
              <div className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${sub}`}>Employee ID</div>
              <div className={`mt-1 text-sm font-semibold ${txt}`}>{formData.employeeId || "Auto-generated"}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Basic Info */}
      <section className={sectionCls}>
        <div className="mb-4 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h4 className={sectionTitleCls}>Basic Information</h4>
            <p className={`mt-1 text-sm ${sub}`}>Capture identity, contact details, and staff profile image.</p>
          </div>
          <span className={pillCls}>{completionItems} profile fields completed</span>
        </div>
        <div className="grid gap-4 lg:grid-cols-[180px_minmax(0,1fr)]">
          <div className={`rounded-[24px] border p-3.5 ${isDark ? "border-white/10 bg-white/[0.03]" : "border-gray-200 bg-gray-50/80"}`}>
            <label className={labelCls}>Photo</label>
            <div className="flex flex-col items-center gap-3 text-center">
              {formData.photo ? (
                <img
                  src={formData.photo}
                  alt="Staff photo"
                  className="h-20 w-20 rounded-2xl object-cover shadow-lg"
                />
              ) : (
                <div className={`flex h-20 w-20 items-center justify-center rounded-2xl text-2xl font-bold ${isDark ? "bg-white/10 text-white" : "bg-blue-100 text-blue-700"}`}>
                  {initials}
                </div>
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
              {formData.photo && (
                <button
                  type="button"
                  onClick={() => handleChange("photo", "")}
                  className={`text-xs font-medium ${isDark ? "text-red-300 hover:text-red-200" : "text-red-600 hover:text-red-700"}`}
                >
                  Remove photo
                </button>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className={labelCls}>First Name *</label>
              <input
                type="text"
                className={inputCls}
                value={formData.firstName}
                onChange={(e) => handleChange("firstName", e.target.value)}
                placeholder="First name"
              />
            </div>
            <div>
              <label className={labelCls}>Last Name *</label>
              <input
                type="text"
                className={inputCls}
                value={formData.lastName}
                onChange={(e) => handleChange("lastName", e.target.value)}
                placeholder="Last name"
              />
            </div>
            <div>
              <label className={labelCls}>Email *</label>
              <input
                type="email"
                className={inputCls}
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="staff@school.com"
              />
              <p className={helperTextCls}>Used for the linked staff login and notifications.</p>
            </div>
            <div>
              <label className={labelCls}>Phone</label>
              <input
                type="tel"
                className={inputCls}
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="+91 98765 43210"
              />
            </div>
          </div>
        </div>
      </section>

      <section className={sectionCls}>
        <div className="mb-4 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h4 className={sectionTitleCls}>Access Role</h4>
            <p className={`mt-1 text-sm ${sub}`}>Configure the linked account role and permissions profile.</p>
          </div>
          <span className={pillCls}>{mode === "add" ? "Applies on account creation" : "Updates linked access"}</span>
        </div>
        {customRoles.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className={labelCls}>Role from Settings *</label>
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
              <p className={helperTextCls}>This role comes from Settings → Roles.</p>
            </div>
            <div>
              <label className={labelCls}>Fallback Base Role</label>
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
              <p className={helperTextCls}>Used for the linked login when the custom role is applied.</p>
            </div>
          </div>
        ) : (
          <div className={`rounded-2xl border p-4 ${isDark ? "border-gray-700 bg-gray-900/40" : "border-gray-200 bg-gray-50"}`}>
            <p className={`text-sm font-medium ${txt}`}>No roles are defined in Settings yet.</p>
            <p className={helperTextCls}>The linked user account will continue with the base role: <span className="font-semibold">Teacher</span>.</p>
          </div>
        )}
      </section>

      {/* Job Details */}
      <section className={sectionCls}>
        <div className="mb-4">
          <h4 className={sectionTitleCls}>Job Details</h4>
          <p className={`mt-1 text-sm ${sub}`}>Employment data used across staffing, payroll, and assignment workflows.</p>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <label className={labelCls}>Department</label>
            <input
              type="text"
              className={inputCls}
              value={formData.department}
              onChange={(e) => handleChange("department", e.target.value)}
              placeholder="e.g., Science Department"
            />
          </div>
          <div>
            <label className={labelCls}>Designation</label>
            <input
              type="text"
              className={inputCls}
              value={formData.designation}
              onChange={(e) => handleChange("designation", e.target.value)}
              placeholder="e.g., Mathematics Teacher"
            />
          </div>
          <div>
            <label className={labelCls}>Subject</label>
            <input
              type="text"
              className={inputCls}
              value={formData.subject}
              onChange={(e) => handleChange("subject", e.target.value)}
              placeholder="e.g., Mathematics"
            />
          </div>
          <div>
            <label className={labelCls}>Qualification</label>
            <input
              type="text"
              className={inputCls}
              value={formData.qualification}
              onChange={(e) => handleChange("qualification", e.target.value)}
              placeholder="e.g., M.Sc. Mathematics"
            />
          </div>
          <div>
            <label className={labelCls}>Experience (years)</label>
            <input
              type="number"
              className={inputCls}
              value={formData.experience}
              onChange={(e) => handleChange("experience", e.target.value)}
              placeholder="5"
            />
          </div>
          <div>
            <label className={labelCls}>Salary</label>
            <input
              type="number"
              className={inputCls}
              value={formData.salary}
              onChange={(e) => handleChange("salary", e.target.value)}
              placeholder="50000"
            />
          </div>
          <div>
            <label className={labelCls}>Joining Date</label>
            <input
              type="date"
              className={inputCls}
              value={formData.joiningDate}
              onChange={(e) => handleChange("joiningDate", e.target.value)}
            />
          </div>
          <div>
            <label className={labelCls}>Employee ID</label>
            <input
              type="text"
              className={inputCls}
              value={formData.employeeId}
              onChange={(e) => handleChange("employeeId", e.target.value)}
              placeholder="Auto-generated if empty"
            />
          </div>
          <div>
            <label className={labelCls}>Status</label>
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
      <section className={sectionCls}>
        <div className="mb-4">
          <h4 className={sectionTitleCls}>Personal & Compliance</h4>
          <p className={`mt-1 text-sm ${sub}`}>Store profile attributes, identity details, and address information.</p>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <label className={labelCls}>Gender</label>
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
            <label className={labelCls}>Date of Birth</label>
            <input
              type="date"
              className={inputCls}
              value={formData.dateOfBirth}
              onChange={(e) => handleChange("dateOfBirth", e.target.value)}
            />
          </div>
          <div>
            <label className={labelCls}>Blood Group</label>
            <input
              type="text"
              className={inputCls}
              value={formData.bloodGroup}
              onChange={(e) => handleChange("bloodGroup", e.target.value)}
              placeholder="e.g., O+"
            />
          </div>
          <div>
            <label className={labelCls}>Aadhar Number</label>
            <input
              type="text"
              className={inputCls}
              value={formData.aadharNumber}
              onChange={(e) => handleChange("aadharNumber", e.target.value)}
              placeholder="Identity number"
            />
          </div>
        </div>
        <div className="mt-3">
          <label className={labelCls}>Address</label>
          <textarea
            className={inputCls}
            rows={2}
            value={formData.address}
            onChange={(e) => handleChange("address", e.target.value)}
            placeholder="Enter full address"
          />
        </div>
      </section>

      {/* Bank & Emergency */}
      <section className={sectionCls}>
        <div className="mb-4">
          <h4 className={sectionTitleCls}>Bank, Emergency & Notes</h4>
          <p className={`mt-1 text-sm ${sub}`}>Keep payout, emergency contact, and operational notes together.</p>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <label className={labelCls}>Bank Name</label>
            <input
              type="text"
              className={inputCls}
              value={formData.bankName}
              onChange={(e) => handleChange("bankName", e.target.value)}
              placeholder="e.g., State Bank of India"
            />
          </div>
          <div>
            <label className={labelCls}>Bank Account No.</label>
            <input
              type="text"
              className={inputCls}
              value={formData.bankAccountNo}
              onChange={(e) => handleChange("bankAccountNo", e.target.value)}
              placeholder="Account number"
            />
          </div>
          <div>
            <label className={labelCls}>IFSC</label>
            <input
              type="text"
              className={inputCls}
              value={formData.bankIfsc}
              onChange={(e) => handleChange("bankIfsc", e.target.value)}
              placeholder="IFSC Code"
            />
          </div>
          <div>
            <label className={labelCls}>Emergency Contact Name</label>
            <input
              type="text"
              className={inputCls}
              value={formData.emergencyName}
              onChange={(e) => handleChange("emergencyName", e.target.value)}
              placeholder="Emergency contact name"
            />
          </div>
          <div>
            <label className={labelCls}>Emergency Contact Phone</label>
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
          <label className={labelCls}>Remarks</label>
          <textarea
            className={inputCls}
            rows={2}
            value={formData.remarks}
            onChange={(e) => handleChange("remarks", e.target.value)}
            placeholder="Any additional remarks"
          />
        </div>
      </section>

      {/* Class Teacher Assignments */}
      <section className={sectionCls}>
        <div className="mb-4 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h4 className={sectionTitleCls}>Class Teacher Assignments</h4>
            <p className={`mt-1 text-sm ${sub}`}>Enable this when the staff member is assigned to manage a class or section.</p>
          </div>
          <span className={pillCls}>{formData.isClassTeacher ? `${formData.classTeacherAssignments.length} assignment${formData.classTeacherAssignments.length === 1 ? '' : 's'}` : 'Not assigned'}</span>
        </div>
        <div className="grid gap-3 xl:grid-cols-[280px_minmax(0,1fr)]">
          <div className={`rounded-2xl border p-4 ${isDark ? "border-white/10 bg-white/[0.03]" : "border-gray-200 bg-gray-50/80"}`}>
            <div className="flex items-center gap-3">
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
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="isClassTeacher-toggle" className={`text-sm font-medium ${txt}`}>
                Class teacher role
              </label>
            </div>
            <p className={`mt-2 text-xs ${helperTextCls}`}>Turn this on when the staff member leads a class. Assignment controls appear beside this panel.</p>
          </div>

          <div className={`rounded-2xl border p-3.5 ${isDark ? "border-white/10 bg-white/[0.03]" : "border-gray-200 bg-gray-50/80"}`}>
            {formData.isClassTeacher ? (
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
            ) : (
              <div className={`flex min-h-[132px] items-center justify-center rounded-2xl border border-dashed ${isDark ? "border-white/10 text-gray-400" : "border-gray-300 text-gray-500"}`}>
                Assign class/section responsibilities when needed.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Actions */}
      <div className={`sticky bottom-0 z-10 flex flex-col gap-3 rounded-[28px] border px-4 py-3 shadow-lg backdrop-blur-xl sm:flex-row sm:items-center sm:justify-end ${isDark ? "border-white/10 bg-slate-900/90" : "border-gray-200 bg-white/90"}`}>
        <button
          type="button"
          onClick={onCancel}
          className={`px-5 py-2.5 rounded-2xl text-sm font-medium transition-colors ${
            isDark ? "text-gray-300 hover:bg-gray-800" : "text-gray-700 hover:bg-gray-100"
          }`}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!!loading}
          className={`px-6 py-2.5 rounded-2xl text-sm font-semibold text-white shadow-lg transition-all disabled:opacity-50 ${
            isDark ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500" : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500"
          }`}
        >
          {loading ? (mode === "add" ? "Adding..." : "Saving...") : mode === "add" ? "Add Staff" : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
