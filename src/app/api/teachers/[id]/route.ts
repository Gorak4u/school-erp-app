// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext, tenantWhere } from '@/lib/apiAuth';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const { id } = await params;
    const teacher = await (schoolPrisma as any).teacher.findFirst({ 
      where: { id, ...tenantWhere(ctx) },
      include: {
        user: true,
        classTeacherAssignments: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    if (!teacher) return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    return NextResponse.json({ teacher });
  } catch (error) {
    console.error('GET /api/teachers/[id]:', error);
    return NextResponse.json({ error: 'Failed to fetch teacher' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const { id } = await params;
    const existing = await (schoolPrisma as any).teacher.findFirst({ 
      where: { id, ...tenantWhere(ctx) },
      include: { user: true }
    });
    if (!existing) return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });

    const body = await request.json();
    const { action } = body;

    // Backward-compatible activation/deactivation flow
    if (action) {
      if (!['activate', 'deactivate'].includes(action)) {
        return NextResponse.json({ error: 'Invalid action. Must be "activate" or "deactivate"' }, { status: 400 });
      }

      const newStatus = action === 'activate' ? 'active' : 'inactive';
      const newIsActive = action === 'activate';

      await (schoolPrisma as any).$transaction(async (tx: any) => {
        await tx.teacher.update({
          where: { id },
          data: { status: newStatus }
        });

        if (existing.userId) {
          await tx.school_User.update({
            where: { id: existing.userId },
            data: { isActive: newIsActive }
          });
        }
      });

      return NextResponse.json({ 
        message: `Teacher ${action === 'activate' ? 'activated' : 'deactivated'} successfully`,
        status: newStatus
      }, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Clear-Site-Data': 'cache'
        }
      });
    }

    const allowedFields = [
      'name',
      'email',
      'phone',
      'gender',
      'dateOfBirth',
      'subject',
      'qualification',
      'experience',
      'status',
      'address',
      'photo',
      'joiningDate',
      'salary',
      'department',
      'designation',
      'bloodGroup',
      'aadharNumber',
      'bankName',
      'bankAccountNo',
      'bankIfsc',
      'emergencyName',
      'emergencyPhone',
      'remarks',
      'employeeId',
      'isClassTeacher',
      'role',
      'customRoleId',
      'firstName',
      'lastName',
    ];

    const updateData: any = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    const nextName = (body.name || `${body.firstName || ''} ${body.lastName || ''}`).trim() || existing.name;
    const nextEmail = body.email || existing.email;
    const nextEmployeeId = body.employeeId || existing.employeeId;

    if (!nextName) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    if (!nextEmail) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const duplicatedEmail = await (schoolPrisma as any).school_User.findFirst({
      where: {
        schoolId: ctx.schoolId,
        email: nextEmail,
        id: { not: existing.userId || undefined },
      },
      select: { id: true },
    });
    if (duplicatedEmail) {
      return NextResponse.json({ error: 'A user with this email already exists' }, { status: 409 });
    }

    const duplicatedEmployeeId = await (schoolPrisma as any).teacher.findFirst({
      where: {
        schoolId: ctx.schoolId,
        employeeId: nextEmployeeId,
        id: { not: id },
      },
      select: { id: true },
    });
    if (duplicatedEmployeeId) {
      return NextResponse.json({ error: 'This Employee ID already exists in your school' }, { status: 409 });
    }

    if (updateData.customRoleId) {
      const customRole = await (schoolPrisma as any).CustomRole.findFirst({
        where: { id: updateData.customRoleId, schoolId: ctx.schoolId },
        select: { id: true },
      });
      if (!customRole) {
        return NextResponse.json({ error: 'Invalid custom role' }, { status: 400 });
      }
    }

    const teacherOnlyData: any = {
      phone: updateData.phone,
      gender: updateData.gender,
      dateOfBirth: updateData.dateOfBirth,
      subject: updateData.subject,
      qualification: updateData.qualification,
      status: updateData.status,
      address: updateData.address,
      photo: updateData.photo,
      joiningDate: updateData.joiningDate,
      department: updateData.department,
      designation: updateData.designation,
      bloodGroup: updateData.bloodGroup,
      aadharNumber: updateData.aadharNumber,
      bankName: updateData.bankName,
      bankAccountNo: updateData.bankAccountNo,
      bankIfsc: updateData.bankIfsc,
      emergencyName: updateData.emergencyName,
      emergencyPhone: updateData.emergencyPhone,
      remarks: updateData.remarks,
      isClassTeacher: updateData.isClassTeacher,
    };

    const normalizedTeacherData: any = {
      ...teacherOnlyData,
      name: nextName,
      email: nextEmail,
      employeeId: nextEmployeeId,
      experience: body.experience !== undefined && body.experience !== null && body.experience !== ''
        ? Number(body.experience)
        : body.experience === ''
          ? null
          : undefined,
      salary: body.salary !== undefined && body.salary !== null && body.salary !== ''
        ? Number(body.salary)
        : body.salary === ''
          ? null
          : undefined,
    };

    Object.keys(normalizedTeacherData).forEach((key) => {
      if (normalizedTeacherData[key] === undefined) {
        delete normalizedTeacherData[key];
      }
    });

    const result = await (schoolPrisma as any).$transaction(async (tx: any) => {
      const teacher = await tx.teacher.update({
        where: { id },
        data: normalizedTeacherData,
        include: {
          classTeacherAssignments: {
            where: { isActive: true }
          }
        }
      });

      if (existing.userId) {
        const userUpdate: any = {
          email: nextEmail,
          employeeId: nextEmployeeId,
          firstName: (body.firstName || nextName.split(/\s+/)[0] || '').trim(),
          lastName: (body.lastName || nextName.split(/\s+/).slice(1).join(' ') || '').trim(),
          role: body.role || existing.user?.role || 'teacher',
          customRoleId: body.customRoleId !== undefined ? body.customRoleId : existing.user?.customRoleId ?? null,
          isActive: normalizedTeacherData.status ? normalizedTeacherData.status === 'active' : existing.user?.isActive ?? true,
          updatedAt: new Date(),
        };

        await tx.school_User.update({
          where: { id: existing.userId },
          data: userUpdate,
        });
      }

      return teacher;
    });

    return NextResponse.json({
      teacher: result,
      message: 'Teacher updated successfully'
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Clear-Site-Data': 'cache'
      }
    });
  } catch (error: any) {
    if (error.code === 'P2025') return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    if (error.code === 'P2002') return NextResponse.json({ error: 'Employee ID or email already exists' }, { status: 409 });
    console.error('PUT /api/teachers/[id]:', error);
    return NextResponse.json({ error: 'Failed to update teacher' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const { id } = await params;
    const existing = await (schoolPrisma as any).teacher.findFirst({ 
      where: { id, ...tenantWhere(ctx) },
      include: { user: true }
    });
    if (!existing) return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });

    // Delete teacher and associated user records in transaction
    await (schoolPrisma as any).$transaction(async (tx: any) => {
      // Delete the teacher record first so the user foreign key no longer blocks cleanup
      await tx.teacher.delete({
        where: { id }
      });

      // Delete associated NextAuth account if user exists
      if (existing.userId) {
        await tx.account.deleteMany({
          where: { userId: existing.userId }
        });
      }

      // Delete associated school_User record if user exists
      if (existing.userId) {
        await tx.school_User.delete({
          where: { id: existing.userId }
        });
      }
    });

    return NextResponse.json({ message: 'Teacher and associated user account permanently deleted' }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Clear-Site-Data': 'cache'
      }
    });
  } catch (error: any) {
    if (error.code === 'P2025') return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    console.error('DELETE /api/teachers/[id]:', error);
    return NextResponse.json({ error: 'Failed to delete teacher' }, { status: 500 });
  }
}
