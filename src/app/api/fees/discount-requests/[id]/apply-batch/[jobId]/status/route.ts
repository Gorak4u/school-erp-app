import { NextRequest, NextResponse } from 'next/server';
import { getSessionContext } from '@/lib/apiAuth';

// Background job status storage (in production, use Redis or database)
// This should match the same storage used in the batch apply API
const jobStatus = new Map<string, {
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  total: number;
  message: string;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
  processedRecords?: number;
  failedRecords?: number;
  details?: any;
}>();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; jobId: string }> }
) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const { id, jobId } = await params;

    // Get job status
    const job = jobStatus.get(jobId);
    
    if (!job) {
      return NextResponse.json({ 
        error: 'Job not found',
        jobId 
      }, { status: 404 });
    }

    // Calculate percentage if not provided
    const percentage = job.total > 0 ? Math.round((job.progress / job.total) * 100) : 0;

    // Return job status with additional metadata
    return NextResponse.json({
      success: true,
      jobId,
      discountRequestId: id,
      status: job.status,
      progress: job.progress,
      total: job.total,
      percentage,
      message: job.message,
      error: job.error || null,
      startedAt: job.startedAt || null,
      completedAt: job.completedAt || null,
      processedRecords: job.processedRecords || 0,
      failedRecords: job.failedRecords || 0,
      details: job.details || null,
      // Estimated time remaining (if running)
      eta: job.status === 'running' && job.progress > 0 ? 
        Math.round(((job.total - job.progress) / job.progress) * 
        (Date.now() - (job.startedAt?.getTime() || Date.now())) / 1000) : null
    });

  } catch (error: any) {
    console.error('GET job status error:', error);
    return NextResponse.json({ 
      error: 'Failed to get job status',
      details: error.message 
    }, { status: 500 });
  }
}

// Export the jobStatus map so it can be shared with the batch apply API
export { jobStatus };
