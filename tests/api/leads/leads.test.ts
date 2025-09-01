/**
 * Leads API Tests
 * 
 * Tests for /api/leads endpoint including:
 * - CRUD operations
 * - Authentication and authorization
 * - Data validation
 * - Pagination and filtering
 * - Error handling
 */

import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/leads/route';
import { User, Workspace, Lead, WorkspaceMember, Role } from '@/lib/mongodb/models';
import { generateToken } from '@/lib/mongodb/auth';
import mongoose from 'mongoose';

describe('/api/leads', () => {
  let testUser: any;
  let testWorkspace: any;
  let testRole: any;
  let authToken: string;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_TEST_URI!);
    }
  });

  beforeEach(async () => {
    // Clear test data
    await User.deleteMany({});
    await Workspace.deleteMany({});
    await Lead.deleteMany({});
    await WorkspaceMember.deleteMany({});
    await Role.deleteMany({});

    // Create test workspace
    testWorkspace = await Workspace.create({
      name: 'Test Workspace',
      slug: 'test-workspace',
      planId: 'free',
      subscriptionStatus: 'active',
    });

    // Create test role
    testRole = await Role.create({
      workspaceId: testWorkspace._id,
      name: 'Admin',
      description: 'Admin role',
      permissions: ['leads:*'],
      isDefault: false,
    });

    // Create test user
    testUser = await User.create({
      email: 'test@example.com',
      passwordHash: 'hashed-password',
      fullName: 'Test User',
      isEmailVerified: true,
    });

    // Create workspace membership
    await WorkspaceMember.create({
      workspaceId: testWorkspace._id,
      userId: testUser._id,
      roleId: testRole._id,
      status: 'active',
      joinedAt: new Date(),
    });

    // Generate auth token
    authToken = generateToken(testUser._id.toString(), testWorkspace._id.toString());
  });

  afterEach(async () => {
    await User.deleteMany({});
    await Workspace.deleteMany({});
    await Lead.deleteMany({});
    await WorkspaceMember.deleteMany({});
    await Role.deleteMany({});
  });

  describe('GET /api/leads', () => {
    beforeEach(async () => {
      // Create test leads
      const testLeads = [
        {
          workspaceId: testWorkspace._id,
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          phone: '+1234567890',
          company: 'Acme Corp',
          status: 'new',
          source: 'website',
          createdBy: testUser._id,
          tags: ['hot-lead'],
        },
        {
          workspaceId: testWorkspace._id,
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane.smith@example.com',
          phone: '+1987654321',
          company: 'Tech Inc',
          status: 'qualified',
          source: 'referral',
          createdBy: testUser._id,
          tags: ['enterprise'],
        },
      ];

      await Lead.insertMany(testLeads);
    });

    it('should return leads for authenticated user', async () => {
      const request = new NextRequest(
        `http://localhost:3000/api/leads?workspaceId=${testWorkspace._id}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${authToken}`,
          },
        }
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('leads');
      expect(data).toHaveProperty('pagination');
      expect(data.leads).toHaveLength(2);
      expect(data.leads[0]).toHaveProperty('firstName');
      expect(data.leads[0]).toHaveProperty('email');
    });

    it('should support pagination', async () => {
      const request = new NextRequest(
        `http://localhost:3000/api/leads?workspaceId=${testWorkspace._id}&page=1&limit=1`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${authToken}`,
          },
        }
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.leads).toHaveLength(1);
      expect(data.pagination).toEqual({
        page: 1,
        limit: 1,
        total: 2,
        pages: 2,
      });
    });

    it('should support filtering by status', async () => {
      const request = new NextRequest(
        `http://localhost:3000/api/leads?workspaceId=${testWorkspace._id}&status=qualified`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${authToken}`,
          },
        }
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.leads).toHaveLength(1);
      expect(data.leads[0].status).toBe('qualified');
    });

    it('should support search functionality', async () => {
      const request = new NextRequest(
        `http://localhost:3000/api/leads?workspaceId=${testWorkspace._id}&search=john`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${authToken}`,
          },
        }
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.leads).toHaveLength(1);
      expect(data.leads[0].firstName.toLowerCase()).toContain('john');
    });

    it('should require authentication', async () => {
      const request = new NextRequest(
        `http://localhost:3000/api/leads?workspaceId=${testWorkspace._id}`,
        {
          method: 'GET',
        }
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.message).toContain('Authentication required');
    });

    it('should require workspace access', async () => {
      // Create another workspace
      const otherWorkspace = await Workspace.create({
        name: 'Other Workspace',
        slug: 'other-workspace',
        planId: 'free',
        subscriptionStatus: 'active',
      });

      const request = new NextRequest(
        `http://localhost:3000/api/leads?workspaceId=${otherWorkspace._id}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${authToken}`,
          },
        }
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.message).toContain('access');
    });
  });

  describe('POST /api/leads', () => {
    it('should create a new lead with valid data', async () => {
      const leadData = {
        workspaceId: testWorkspace._id.toString(),
        firstName: 'New',
        lastName: 'Lead',
        email: 'new.lead@example.com',
        phone: '+1555123456',
        company: 'New Company',
        status: 'new',
        source: 'api',
        tags: ['test-lead'],
      };

      const request = new NextRequest('http://localhost:3000/api/leads', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(leadData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toHaveProperty('lead');
      expect(data.lead.firstName).toBe('New');
      expect(data.lead.email).toBe('new.lead@example.com');
      expect(data.lead.createdBy.toString()).toBe(testUser._id.toString());
    });

    it('should validate required fields', async () => {
      const leadData = {
        workspaceId: testWorkspace._id.toString(),
        // Missing required fields
        email: 'incomplete@example.com',
      };

      const request = new NextRequest('http://localhost:3000/api/leads', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(leadData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toContain('validation');
    });

    it('should prevent duplicate emails within workspace', async () => {
      // Create first lead
      await Lead.create({
        workspaceId: testWorkspace._id,
        firstName: 'Existing',
        lastName: 'Lead',
        email: 'duplicate@example.com',
        createdBy: testUser._id,
      });

      const leadData = {
        workspaceId: testWorkspace._id.toString(),
        firstName: 'Another',
        lastName: 'Lead',
        email: 'duplicate@example.com',
      };

      const request = new NextRequest('http://localhost:3000/api/leads', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(leadData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.message).toContain('already exists');
    });

    it('should sanitize input data', async () => {
      const leadData = {
        workspaceId: testWorkspace._id.toString(),
        firstName: '  John  ',
        lastName: '  Doe  ',
        email: '  JOHN.DOE@EXAMPLE.COM  ',
        phone: '  +1234567890  ',
        company: '  Acme Corp  ',
      };

      const request = new NextRequest('http://localhost:3000/api/leads', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(leadData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.lead.firstName).toBe('John');
      expect(data.lead.email).toBe('john.doe@example.com');
    });

    it('should require proper permissions', async () => {
      // Update role to remove lead creation permission
      await Role.findByIdAndUpdate(testRole._id, {
        permissions: ['leads:read'],
      });

      const leadData = {
        workspaceId: testWorkspace._id.toString(),
        firstName: 'Unauthorized',
        lastName: 'Lead',
        email: 'unauthorized@example.com',
      };

      const request = new NextRequest('http://localhost:3000/api/leads', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(leadData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.message).toContain('permission');
    });
  });

  describe('Rate Limiting', () => {
    it('should apply rate limiting to lead creation', async () => {
      const leadData = {
        workspaceId: testWorkspace._id.toString(),
        firstName: 'Rate',
        lastName: 'Limited',
        email: 'rate.limited@example.com',
      };

      // Make multiple rapid requests
      const requests = Array.from({ length: 25 }, (_, i) => 
        new NextRequest('http://localhost:3000/api/leads', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...leadData,
            email: `rate.limited.${i}@example.com`,
          }),
        })
      );

      const responses = await Promise.all(
        requests.map(request => POST(request))
      );

      // Some requests should be rate limited
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });
});
