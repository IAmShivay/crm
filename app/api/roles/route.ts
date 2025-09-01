import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { mongoClient, WorkspaceMember } from '@/lib/mongodb/client';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    const url = new URL(request.url);
    const workspaceId = url.searchParams.get('workspaceId');

    if (!workspaceId) {
      return NextResponse.json({ message: 'Workspace ID is required' }, { status: 400 });
    }

    // Verify user has access to this workspace
    const member = await (WorkspaceMember as any).findOne({
      userId: auth.user.id,
      workspaceId,
      status: 'active'
    });

    if (!member) {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 });
    }

    const roles = await mongoClient.getRolesByWorkspace(workspaceId);
    const rolesData = roles.map(role => ({ ...role.toJSON(), id: role._id }));

    return NextResponse.json(rolesData);
  } catch (error) {
    console.error('Get roles error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    const roleData = await request.json();

    if (!roleData.workspaceId || !roleData.name) {
      return NextResponse.json({
        message: 'Workspace ID and role name are required'
      }, { status: 400 });
    }

    // Verify user has access to this workspace
    const member = await (WorkspaceMember as any).findOne({
      userId: auth.user.id,
      workspaceId: roleData.workspaceId,
      status: 'active'
    });

    if (!member) {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 });
    }

    const role = await mongoClient.createRole(roleData);
    const roleResponse = { ...role.toJSON(), id: role._id };

    return NextResponse.json(roleResponse, { status: 201 });
  } catch (error) {
    console.error('Create role error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}