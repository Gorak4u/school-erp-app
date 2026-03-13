// Dashboard Page - Next.js App Router
// Based on the School Management ERP UI Design Documents

'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useRoleAccess, usePermissions } from '@/lib/auth';
import { Button } from '@/lib/design-system';
import ClientOnly from '@/components/ClientOnly';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const { isAdmin, isTeacher, isStudent, isParent } = useRoleAccess();
  const {
    canManageUsers,
    canManageClasses,
    canManageGrades,
    canViewGrades,
    canManageSchedule,
    canViewSchedule,
    canManageAttendance,
    canViewAttendance,
  } = usePermissions();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <ClientOnly>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <h1 className="text-2xl font-bold text-blue-600">
                School ERP Dashboard
              </h1>
              <div className="flex items-center space-x-4">
                <span className="text-gray-600">
                  Welcome, {user?.firstName} {user?.lastName}
                </span>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                  {user?.role}
                </span>
                <Button variant="secondary" onClick={handleLogout}>
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* User Information */}
        <section className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">User Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-700 mb-2">Profile</h3>
              <div className="text-sm text-gray-600">
                <p><strong>ID:</strong> {user?.id}</p>
                <p><strong>Email:</strong> {user?.email}</p>
                <p><strong>Role:</strong> {user?.role}</p>
                <p><strong>School:</strong> {user?.schoolId}</p>
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-700 mb-2">Role Access</h3>
              <div className="space-y-2">
                <div className={`p-2 rounded text-sm ${isAdmin() ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {isAdmin() ? '✓' : '✗'} Admin
                </div>
                <div className={`p-2 rounded text-sm ${isTeacher() ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {isTeacher() ? '✓' : '✗'} Teacher
                </div>
                <div className={`p-2 rounded text-sm ${isStudent() ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {isStudent() ? '✓' : '✗'} Student
                </div>
                <div className={`p-2 rounded text-sm ${isParent() ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {isParent() ? '✓' : '✗'} Parent
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Permissions */}
        <section className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Permissions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
              <h3 className="font-medium text-gray-700 mb-2">User Management</h3>
              <p className="text-sm text-gray-600 mb-2">Manage user accounts and permissions</p>
              <div className={`p-2 rounded text-sm ${canManageUsers() ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {canManageUsers() ? '✓' : '✗'} Can manage users
              </div>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
              <h3 className="font-medium text-gray-700 mb-2">Class Management</h3>
              <p className="text-sm text-gray-600 mb-2">Manage classes and schedules</p>
              <div className={`p-2 rounded text-sm ${canManageClasses() ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {canManageClasses() ? '✓' : '✗'} Can manage classes
              </div>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
              <h3 className="font-medium text-gray-700 mb-2">Grade Management</h3>
              <p className="text-sm text-gray-600 mb-2">Manage student grades and assessments</p>
              <div className="space-y-1">
                <div className={`p-2 rounded text-sm ${canManageGrades() ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {canManageGrades() ? '✓' : '✗'} Can manage grades
                </div>
                <div className={`p-2 rounded text-sm ${canViewGrades() ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {canViewGrades() ? '✓' : '✗'} Can view grades
                </div>
              </div>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
              <h3 className="font-medium text-gray-700 mb-2">Schedule Management</h3>
              <p className="text-sm text-gray-600 mb-2">Manage class schedules and timetables</p>
              <div className="space-y-1">
                <div className={`p-2 rounded text-sm ${canManageSchedule() ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {canManageSchedule() ? '✓' : '✗'} Can manage schedule
                </div>
                <div className={`p-2 rounded text-sm ${canViewSchedule() ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {canViewSchedule() ? '✓' : '✗'} Can view schedule
                </div>
              </div>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
              <h3 className="font-medium text-gray-700 mb-2">Attendance Management</h3>
              <p className="text-sm text-gray-600 mb-2">Manage student attendance records</p>
              <div className="space-y-1">
                <div className={`p-2 rounded text-sm ${canManageAttendance() ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {canManageAttendance() ? '✓' : '✗'} Can manage attendance
                </div>
                <div className={`p-2 rounded text-sm ${canViewAttendance() ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {canViewAttendance() ? '✓' : '✗'} Can view attendance
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Role-Based Content */}
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Role-Based Content</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {isAdmin() && (
              <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                <h3 className="font-medium text-gray-700 mb-2">Admin Only</h3>
                <p className="text-sm text-gray-600 mb-3">This content is only visible to administrators</p>
                <Button variant="primary" size="sm">Admin Action</Button>
              </div>
            )}
            {isTeacher() && (
              <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                <h3 className="font-medium text-gray-700 mb-2">Teacher Only</h3>
                <p className="text-sm text-gray-600 mb-3">This content is only visible to teachers</p>
                <Button variant="success" size="sm">Teacher Action</Button>
              </div>
            )}
            {isStudent() && (
              <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                <h3 className="font-medium text-gray-700 mb-2">Student Only</h3>
                <p className="text-sm text-gray-600 mb-3">This content is only visible to students</p>
                <Button variant="secondary" size="sm">Student Action</Button>
              </div>
            )}
            {isParent() && (
              <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                <h3 className="font-medium text-gray-700 mb-2">Parent Only</h3>
                <p className="text-sm text-gray-600 mb-3">This content is only visible to parents</p>
                <Button variant="error" size="sm">Parent Action</Button>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
    </ClientOnly>
  );
}
