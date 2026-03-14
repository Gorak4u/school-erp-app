import { NextRequest, NextResponse } from 'next/server';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { prisma } from '@/lib/prisma';

// GET /api/fees/collections/summary - Optimized collections data with database aggregation
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Get all payments with related data
    const payments = await prisma.payment.findMany({
      include: {
        feeRecord: {
          include: {
            student: {
              select: { class: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit * 10 // Get more data for processing
    });

    // Group payments by collector and payment method
    const groupedCollections = payments.reduce((acc: any, payment) => {
      const key = `${payment.collectedBy || 'Unknown'}|${payment.paymentMethod || 'Unknown'}`;
      if (!acc[key]) {
        acc[key] = {
          collector: payment.collectedBy || 'Unknown',
          paymentMethod: payment.paymentMethod || 'Unknown',
          collections: 0,
          totalCollected: 0,
          latestCollectionDate: payment.paymentDate,
          uniqueStudents: new Set(),
          classesServed: new Set()
        };
      }
      
      acc[key].collections += 1;
      acc[key].totalCollected += payment.amount || 0;
      
      if (payment.feeRecord?.student) {
        acc[key].uniqueStudents.add(payment.feeRecord.studentId);
        acc[key].classesServed.add(payment.feeRecord.student.class);
      }
      
      return acc;
    }, {});

    // Convert to array and sort
    const formattedCollections = Object.values(groupedCollections)
      .map((group: any) => ({
        ...group,
        uniqueStudents: group.uniqueStudents.size,
        classesServed: Array.from(group.classesServed)
      }))
      .sort((a, b) => b.totalCollected - a.totalCollected)
      .slice((page - 1) * limit, page * limit);

    // Calculate summary statistics
    const summary = {
      totalCollectors: new Set(payments.map(p => p.collectedBy)).size,
      totalAmount: payments.reduce((sum, p) => sum + (p.amount || 0), 0),
      totalTransactions: payments.length,
      totalStudents: new Set(payments.map(p => p.feeRecordId)).size,
      avgTransactionAmount: payments.length > 0 ? payments.reduce((sum, p) => sum + (p.amount || 0), 0) / payments.length : 0,
      paymentMethodsCount: new Set(payments.map(p => p.paymentMethod)).size
    };

    return NextResponse.json({
      success: true,
      data: {
        groupedCollections: formattedCollections,
        statistics: summary,
        summary,
        pagination: {
          page,
          limit,
          total: formattedCollections.length,
          totalPages: Math.ceil(formattedCollections.length / limit),
          hasNext: page * limit < formattedCollections.length,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Error fetching collections summary:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch collections summary',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
