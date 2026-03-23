'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useTheme } from '@/contexts/ThemeContext';
import AttendanceCalendar from './AttendanceCalendar';

interface StaffSelfCalendarProps {
  theme?: 'dark' | 'light';
}

export default function StaffSelfCalendar({ theme }: StaffSelfCalendarProps) {
  const { data: session } = useSession();
  const { theme: contextTheme } = useTheme();
  const isDark = (theme === 'dark') || (contextTheme === 'dark');
  
  const [staffInfo, setStaffInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Get staff information for the current user
  useEffect(() => {
    const fetchStaffInfo = async () => {
      if (!session?.user?.id) {
        setError('User not authenticated');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');
        
        console.log('Fetching staff info for user ID:', session.user.id);
        
        const response = await fetch(`/api/teachers/${session.user.id}`, {
          credentials: 'include',
        });
        
        const data = await response.json();
        
        console.log('Staff API response:', { status: response.status, data });
        
        if (!response.ok) {
          if (response.status === 404) {
            // Try to find teacher by searching all teachers and matching by email
            console.log('Teacher not found by ID, trying to find by email...');
            console.log('User email from session:', session?.user?.email);
            
            const listResponse = await fetch(`/api/teachers?pageSize=1000`, {
              credentials: 'include',
            });
            const listData = await listResponse.json();
            
            console.log('Teachers list response:', { status: listResponse.status, count: listData.teachers?.length });
            
            if (listResponse.ok && listData.teachers?.length > 0) {
              console.log('All teachers emails:', listData.teachers.map((t: any) => ({ id: t.id, email: t.email, name: t.name })));
              
              // Find the teacher that matches the current user's email
              const userEmail = session?.user?.email?.toLowerCase();
              const matchingTeacher = listData.teachers.find((teacher: any) => 
                teacher.email?.toLowerCase() === userEmail
              );
              
              if (matchingTeacher) {
                console.log('Found matching teacher by email:', matchingTeacher);
                setStaffInfo(matchingTeacher);
                return;
              } else {
                console.log('No teacher found matching email:', userEmail);
              }
            }
            
            throw new Error('Your staff profile could not be found. Please ensure you are properly registered as a staff member.');
          } else {
            throw new Error(data.error || 'Failed to fetch staff information');
          }
        }
        
        if (data.teacher) {
          setStaffInfo(data.teacher);
        } else {
          setError('Staff information not found in response');
        }
      } catch (e: any) {
        console.error('Staff calendar error:', e);
        setError(e.message || 'Failed to load staff information');
      } finally {
        setLoading(false);
      }
    };

    fetchStaffInfo();
  }, [session]);

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-300 rounded w-1/3"></div>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="h-12 bg-gray-300 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-8 text-center ${isDark ? 'text-red-400' : 'text-red-600'}`}>
        <div className="text-lg font-semibold mb-2">Error loading calendar</div>
        <div className="text-sm mb-4">{error}</div>
        <button 
          onClick={() => window.location.reload()}
          className={`px-4 py-2 rounded-lg ${isDark ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white`}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!staffInfo) {
    return (
      <div className={`p-8 text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
        <div className="text-lg font-semibold mb-2">Staff Information Not Found</div>
        <div className="text-sm">Unable to load your staff profile. Please contact administrator.</div>
      </div>
    );
  }

  return (
    <div>
      {/* Staff Info Header */}
      <div className={`mb-6 p-4 rounded-lg ${isDark ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-blue-50 border border-blue-200'}`}>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
            {staffInfo.name?.charAt(0)?.toUpperCase() || 'S'}
          </div>
          <div>
            <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              My Attendance Calendar
            </h3>
            <div className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              {staffInfo.name} • {staffInfo.employeeId || 'No employee ID'} • {staffInfo.designation || 'Staff'}
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Component */}
      <AttendanceCalendar 
        type="staff"
        personId={staffInfo.id}
        isDark={isDark}
      />
    </div>
  );
}
