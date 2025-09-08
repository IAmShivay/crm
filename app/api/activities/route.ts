import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/mongodb/auth';
import { WorkspaceMember } from '@/lib/mongodb/client';
import { connectToMongoDB } from '@/lib/mongodb/connection';
import { withLogging, withSecurityLogging } from '@/lib/logging/middleware';
import { log } from '@/lib/logging/logger';

// GET /api/activities - Get workspace activities
export const GET = withSecurityLogging(withLogging(async (request: NextRequest) => {
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
    const limit = parseInt(url.searchParams.get('limit') || '50');

    if (!workspaceId) {
      return NextResponse.json({ message: 'Workspace ID is required' }, { status: 400 });
    }

    // Check if user has access to this workspace
    const userMembership = await WorkspaceMember.findOne({
      workspaceId,
      userId: auth.user.id,
      status: 'active'
    });

    if (!userMembership) {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 });
    }

    // For now, return mock activities since we don't have an Activity model yet
    // In a real implementation, you would query the Activity collection
    const mockActivities = [
      {
        id: '1',
        type: 'lead_created',
        description: 'New lead "John Doe" was created',
        userId: auth.user.id,
        userName: auth.user.fullName || auth.user.email,
        workspaceId,
        createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
        metadata: {
          leadName: 'John Doe',
          leadId: 'lead123'
        }
      },
      {
        id: '2',
        type: 'lead_updated',
        description: 'Lead "Jane Smith" status changed to "Qualified"',
        userId: auth.user.id,
        userName: auth.user.fullName || auth.user.email,
        workspaceId,
        createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 hour ago
        metadata: {
          leadName: 'Jane Smith',
          leadId: 'lead456',
          oldStatus: 'New',
          newStatus: 'Qualified'
        }
      },
      {
        id: '3',
        type: 'lead_assigned',
        description: 'Lead "Bob Johnson" was assigned to you',
        userId: auth.user.id,
        userName: auth.user.fullName || auth.user.email,
        workspaceId,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
        metadata: {
          leadName: 'Bob Johnson',
          leadId: 'lead789',
          assignedTo: auth.user.fullName || auth.user.email
        }
      },
      {
        id: '4',
        type: 'tag_created',
        description: 'New tag "VIP Customer" was created',
        userId: auth.user.id,
        userName: auth.user.fullName || auth.user.email,
        workspaceId,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), // 3 hours ago
        metadata: {
          tagName: 'VIP Customer',
          tagId: 'tag123'
        }
      },
      {
        id: '5',
        type: 'status_created',
        description: 'New lead status "Hot Lead" was created',
        userId: auth.user.id,
        userName: auth.user.fullName || auth.user.email,
        workspaceId,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), // 4 hours ago
        metadata: {
          statusName: 'Hot Lead',
          statusId: 'status123'
        }
      }
    ];

    // Limit the results
    const activities = mockActivities.slice(0, limit);

    log.info(`Activities retrieved for workspace ${workspaceId}`, {
      workspaceId,
      activityCount: activities.length,
      limit,
      duration: Date.now() - startTime
    });

    return NextResponse.json({
      success: true,
      activities
    });

  } catch (error) {
    log.error('Get activities error:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Internal server error' 
      }, 
      { status: 500 }
    );
  }
}));
