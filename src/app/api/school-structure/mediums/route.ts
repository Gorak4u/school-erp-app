import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext, tenantWhere } from '@/lib/apiAuth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const academicYearId = searchParams.get('academicYearId');

    const where = academicYearId ? { academicYearId } : {};

    const mediums = await (schoolPrisma as any).medium.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        academicYear: true,
        classes: {
          include: {
            sections: true
          }
        }
      }
    });

    return NextResponse.json({ mediums });
  } catch (error: any) {
    console.error('Error fetching mediums:', error);
    return NextResponse.json(
      { error: 'Failed to fetch mediums', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, name, description, isActive, academicYearId } = body;

    const medium = await (schoolPrisma as any).medium.create({
      data: {
        code,
        name,
        description,
        isActive: isActive ?? true,
        academicYearId
      }
    });

    return NextResponse.json({ medium }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating medium:', error);
    return NextResponse.json(
      { error: 'Failed to create medium', details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, code, name, description, isActive } = body;

    const medium = await (schoolPrisma as any).medium.update({
      where: { id },
      data: {
        code,
        name,
        description,
        isActive
      }
    });

    return NextResponse.json({ medium });
  } catch (error: any) {
    console.error('Error updating medium:', error);
    return NextResponse.json(
      { error: 'Failed to update medium', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Medium ID is required' }, { status: 400 });
    }

    // Verify medium exists
    const existing = await (schoolPrisma as any).medium.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Medium not found' }, { status: 404 });

    // Check for foreign key relationships - classes using this medium
    const classCount = await (schoolPrisma as any).class.count({ where: { mediumId: id } });
    if (classCount > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete medium', 
        details: `This medium is being used by ${classCount} class(es). Please delete or reassign the classes first.`,
        code: 'FOREIGN_KEY_CONSTRAINT'
      }, { status: 400 });
    }

    // Check for fee structures using this medium
    const feeStructureCount = await (schoolPrisma as any).feeStructure.count({ where: { mediumId: id } });
    if (feeStructureCount > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete medium', 
        details: `This medium is being used by ${feeStructureCount} fee structure(s). Please delete the fee structures first.`,
        code: 'FOREIGN_KEY_CONSTRAINT'
      }, { status: 400 });
    }

    await (schoolPrisma as any).medium.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting medium:', error);
    if (error.code === 'P2025') return NextResponse.json({ error: 'Medium not found' }, { status: 404 });
    if (error.code === 'P2003') return NextResponse.json({ 
      error: 'Cannot delete medium', 
      details: 'This medium is referenced by other records. Please delete those records first.',
      code: 'FOREIGN_KEY_CONSTRAINT'
    }, { status: 400 });
    return NextResponse.json({ error: 'Failed to delete medium' }, { status: 500 });
  }
}
