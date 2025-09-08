import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/mongodb/auth';
import { connectToMongoDB } from '@/lib/mongodb/connection';
import { WorkspaceMember, Activity } from '@/lib/mongodb/client';

export async function POST(request: NextRequest) {
  try {
    await connectToMongoDB();

    // Verify the user is authenticated
    const auth = await verifyAuthToken(request);
    if (!auth) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    // Log sign-out activity for all user's workspaces
    try {
      const userMemberships = await WorkspaceMember.find({
        userId: auth.user._id,
        status: 'active'
      });

      for (const membership of userMemberships) {
        await Activity.create({
          workspaceId: membership.workspaceId,
          userId: auth.user._id,
          action: 'user_signed_out',
          entityType: 'User',
          entityId: auth.user._id,
          description: `${auth.user.fullName} signed out`,
          metadata: {
            userEmail: auth.user.email,
            signOutTime: new Date().toISOString()
          }
        });
      }
    } catch (activityError) {
      console.error('Failed to log sign-out activity:', activityError);
      // Don't fail the sign-out if activity logging fails
    }

    return NextResponse.json({
      success: true,
      message: 'Signed out successfully'
    });

  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
