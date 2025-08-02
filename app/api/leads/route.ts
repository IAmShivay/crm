import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

// Mock leads data
const mockLeads = [
  {
    id: '1',
    name: 'John Smith',
    email: 'john@example.com',
    phone: '+1-555-0123',
    company: 'Tech Corp',
    status: 'new' as const,
    source: 'Website',
    value: 5000,
    assignedTo: 'user-1',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    email: 'sarah@company.com',
    phone: '+1-555-0124',
    company: 'Innovation Ltd',
    status: 'contacted' as const,
    source: 'Referral',
    value: 12000,
    assignedTo: 'user-2',
    createdAt: '2024-01-14T14:30:00Z',
    updatedAt: '2024-01-16T09:15:00Z',
  },
  {
    id: '3',
    name: 'Mike Wilson',
    email: 'mike@startup.io',
    company: 'StartupXYZ',
    status: 'qualified' as const,
    source: 'LinkedIn',
    value: 8500,
    createdAt: '2024-01-13T16:45:00Z',
    updatedAt: '2024-01-17T11:20:00Z',
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

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const status = url.searchParams.get('status');

    let filteredLeads = mockLeads;
    if (status) {
      filteredLeads = mockLeads.filter(lead => lead.status === status);
    }

    return NextResponse.json(filteredLeads);
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

    const leadData = await request.json();
    const newLead = {
      id: Math.random().toString(36).substr(2, 9),
      ...leadData,
      status: leadData.status || 'new',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // In a real app, save to database
    mockLeads.push(newLead);

    return NextResponse.json(newLead, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}