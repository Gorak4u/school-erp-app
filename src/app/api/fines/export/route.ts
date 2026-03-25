import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext } from '@/lib/apiAuth';

// GET /api/fines/export - Export fines in various formats
export async function GET(request: NextRequest) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'excel';
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const fineIds = searchParams.get('fineIds');

    // Validate format
    if (!['excel', 'csv', 'pdf'].includes(format)) {
      return NextResponse.json(
        { success: false, error: 'Invalid format. Supported formats: excel, csv, pdf' },
        { status: 400 }
      );
    }

    // Build where clause
    const where: any = {};
    
    // School filtering
    if (!ctx.isSuperAdmin || ctx.schoolId) {
      where.schoolId = ctx.schoolId;
    }
    
    if (status && status !== 'all') {
      where.status = status;
    }
    
    if (type && type !== 'all') {
      where.type = type;
    }
    
    if (search) {
      where.OR = [
        { fineNumber: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { student: { name: { contains: search, mode: 'insensitive' } } }
      ];
    }

    // Filter by specific fine IDs if provided
    if (fineIds) {
      const ids = fineIds.split(',').filter(id => id.trim());
      if (ids.length > 0) {
        where.id = { in: ids };
      }
    }

    // Get fines data
    const fines = await (schoolPrisma as any).Fine.findMany({
      where,
      include: {
        student: {
          select: {
            name: true,
            admissionNo: true,
            class: true,
            section: true,
            phone: true,
            email: true
          }
        },
        rule: {
          select: {
            name: true,
            code: true,
            type: true,
            baseAmount: true,
            dailyRate: true,
            maxAmount: true
          }
        },
        payments: {
          select: {
            amount: true,
            paymentMethod: true,
            receiptNumber: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' }
        },
        waiverRequests: {
          select: {
            status: true,
            waiveAmount: true,
            reason: true,
            remarks: true,
            createdAt: true,
            reviewedBy: true,
            reviewedAt: true
          },
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: [
        { status: 'asc' },
        { dueDate: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    // Transform data for export
    const exportData = fines.map((fine: any) => ({
      'Fine Number': fine.fineNumber,
      'Student Name': fine.student?.name || 'N/A',
      'Admission Number': fine.student?.admissionNo || 'N/A',
      'Class': `${fine.student?.class || 'N/A'} - ${fine.student?.section || 'N/A'}`,
      'Phone': fine.student?.phone || 'N/A',
      'Email': fine.student?.email || 'N/A',
      'Fine Type': fine.type,
      'Category': fine.category,
      'Description': fine.description,
      'Rule': fine.rule?.name || 'Manual',
      'Amount': fine.amount,
      'Paid Amount': fine.paidAmount,
      'Waived Amount': fine.waivedAmount,
      'Pending Amount': fine.pendingAmount,
      'Status': fine.status,
      'Issued Date': new Date(fine.issuedAt).toLocaleDateString(),
      'Due Date': new Date(fine.dueDate).toLocaleDateString(),
      'Payment Method': fine.payments.length > 0 ? fine.payments[0].paymentMethod : 'N/A',
      'Receipt Number': fine.payments.length > 0 ? fine.payments[0].receiptNumber : 'N/A',
      'Last Payment Date': fine.payments.length > 0 ? new Date(fine.payments[0].createdAt).toLocaleDateString() : 'N/A',
      'Waiver Status': fine.waiverRequests.length > 0 ? fine.waiverRequests[0].status : 'N/A',
      'Waiver Amount': fine.waiverRequests.length > 0 ? fine.waiverRequests[0].waiveAmount : 0,
      'Waiver Reason': fine.waiverRequests.length > 0 ? fine.waiverRequests[0].reason : 'N/A',
      'Created At': new Date(fine.createdAt).toLocaleDateString(),
      'Updated At': new Date(fine.updatedAt).toLocaleDateString()
    }));

    // Generate export based on format
    let buffer: ArrayBuffer;
    let contentType: string;
    let filename: string;

    switch (format) {
      case 'csv':
        buffer = await generateCSV(exportData);
        contentType = 'text/csv';
        filename = `fines-export-${new Date().toISOString().split('T')[0]}.csv`;
        break;
      
      case 'excel':
        buffer = await generateExcel(exportData);
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        filename = `fines-export-${new Date().toISOString().split('T')[0]}.xlsx`;
        break;
      
      case 'pdf':
        buffer = await generatePDF(exportData);
        contentType = 'application/pdf';
        filename = `fines-export-${new Date().toISOString().split('T')[0]}.pdf`;
        break;
      
      default:
        throw new Error('Unsupported format');
    }

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.byteLength.toString()
      }
    });

  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to export fines',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Helper function to generate CSV
async function generateCSV(data: any[]): Promise<ArrayBuffer> {
  if (data.length === 0) {
    return new ArrayBuffer(0);
  }

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Handle values that contain commas or quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    )
  ].join('\n');

  return new TextEncoder().encode(csvContent).buffer;
}

// Helper function to generate Excel (simplified version)
async function generateExcel(data: any[]): Promise<ArrayBuffer> {
  // For now, return CSV format for Excel as well
  // In a real implementation, you would use a library like xlsx
  return generateCSV(data);
}

// Helper function to generate PDF (simplified version)
async function generatePDF(data: any[]): Promise<ArrayBuffer> {
  // For now, return CSV format for PDF as well
  // In a real implementation, you would use a library like jsPDF or puppeteer
  return generateCSV(data);
}
