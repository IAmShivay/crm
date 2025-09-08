import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/mongodb/auth';
import { Lead, WorkspaceMember } from '@/lib/mongodb/client';
import { connectToMongoDB } from '@/lib/mongodb/connection';
import { withLogging, withSecurityLogging, logUserActivity, logBusinessEvent } from '@/lib/logging/middleware';
import { log } from '@/lib/logging/logger';

// DELETE /api/leads/[id] - Delete a lead
export const DELETE = withSecurityLogging(withLogging(async (request: NextRequest, { params }: { params: { id: string } }) => {
  const startTime = Date.now();

  try {
    await connectToMongoDB();

    const auth = await verifyAuthToken(request);
    if (!auth) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const workspaceId = url.searchParams.get('workspaceId');
    const leadId = params.id;

    if (!workspaceId || !leadId) {
      return NextResponse.json({ message: 'Workspace ID and Lead ID are required' }, { status: 400 });
    }

    // Verify user has access to this workspace
    const member = await WorkspaceMember.findOne({
      userId: auth.user.id,
      workspaceId,
      status: 'active'
    });

    if (!member) {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 });
    }

    // Check if lead exists
    const lead = await Lead.findOne({
      _id: leadId,
      workspaceId
    });

    if (!lead) {
      return NextResponse.json({ message: 'Lead not found' }, { status: 404 });
    }

    // Delete the lead
    await Lead.findByIdAndDelete(leadId);

    await logUserActivity(auth.user.id, 'lead.delete', {
      workspaceId,
      leadId,
      leadName: lead.name
    });

    await logBusinessEvent('lead_deleted', {
      workspaceId,
      leadId,
      leadName: lead.name,
      deletedBy: auth.user.id
    });

    return NextResponse.json({
      success: true,
      message: 'Lead deleted successfully'
    });

  } catch (error) {
    log.error('Delete lead error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}));
