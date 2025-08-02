import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

// Mock roles data
const mockRoles = [
  {
    id: '1',
    name: 'Administrator',
    description: 'Full system access with all permissions',
    permissions: [
      { id: '1', name: 'All Access', resource: 'all', action: 'create' as const },
      { id: '2', name: 'All Access', resource: 'all', action: 'read' as const },
      { id: '3', name: 'All Access', resource: 'all', action: 'update' as const },
      { id: '4', name: 'All Access', resource: 'all', action: 'delete' as const },
    ],
    isCustom: false,
    workspaceId: 'workspace-1',
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    name: 'Sales Manager',
    description: 'Manage leads and sales team',
    permissions: [
      { id: '5', name: 'Create Lead', resource: 'leads', action: 'create' as const },
      { id: '6', name: 'Read Lead', resource: 'leads', action: 'read' as const },
      { id: '7', name: 'Update Lead', resource: 'leads', action: 'update' as const },
      { id: '8', name: 'Read User', resource: 'users', action: 'read' as const },
    ],
    isCustom: true,
    workspaceId: 'workspace-1',
    createdAt: '2024-01-02T00:00:00Z',
  },
];

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    return NextResponse.json(mockRoles);
  } catch (error) {
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    const roleData = await request.json();
    const newRole = {
      id: Math.random().toString(36).substring(2, 11),
      ...roleData,
      workspaceId: (payload as any).workspaceId || 'default',
      createdAt: new Date().toISOString(),
    };

    mockRoles.push(newRole);

    return NextResponse.json(newRole, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}