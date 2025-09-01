/**
 * Authentication API Tests - Login Endpoint
 * 
 * Tests for /api/auth/login endpoint including:
 * - Valid login attempts
 * - Invalid credentials
 * - Rate limiting
 * - Security validations
 * - Error handling
 */

import { NextRequest } from 'next/server';
import { POST } from '@/app/api/auth/login/route';
import { User, Workspace } from '@/lib/mongodb/models';
import { hashPassword } from '@/lib/mongodb/auth';
import mongoose from 'mongoose';

describe('/api/auth/login', () => {
  let testUser: any;
  let testWorkspace: any;

  beforeAll(async () => {
    // Ensure database connection
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_TEST_URI!);
    }
  });

  beforeEach(async () => {
    // Clear test data
    await User.deleteMany({});
    await Workspace.deleteMany({});

    // Create test workspace
    testWorkspace = await Workspace.create({
      name: 'Test Workspace',
      slug: 'test-workspace',
      planId: 'free',
      subscriptionStatus: 'active',
    });

    // Create test user
    const hashedPassword = await hashPassword('TestPassword123!');
    testUser = await User.create({
      email: 'test@example.com',
      passwordHash: hashedPassword,
      fullName: 'Test User',
      isEmailVerified: true,
    });
  });

  afterEach(async () => {
    // Clean up test data
    await User.deleteMany({});
    await Workspace.deleteMany({});
  });

  describe('Valid Login Attempts', () => {
    it('should login successfully with valid credentials', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'TestPassword123!',
          timestamp: Date.now(),
          clientInfo: {
            userAgent: 'Jest Test',
            timezone: 'UTC',
            language: 'en-US',
          },
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('token');
      expect(data).toHaveProperty('user');
      expect(data.user.email).toBe('test@example.com');
      expect(data.user.fullName).toBe('Test User');
      expect(data).not.toHaveProperty('password');
      expect(data).not.toHaveProperty('passwordHash');
    });

    it('should return user workspace information when available', async () => {
      // Create workspace membership
      const { WorkspaceMember } = require('@/lib/mongodb/models');
      await WorkspaceMember.create({
        workspaceId: testWorkspace._id,
        userId: testUser._id,
        roleId: new mongoose.Types.ObjectId(),
        status: 'active',
        joinedAt: new Date(),
      });

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'TestPassword123!',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('workspace');
      expect(data.workspace.name).toBe('Test Workspace');
    });

    it('should update user last sign in timestamp', async () => {
      const originalLastSignIn = testUser.lastSignInAt;

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'TestPassword123!',
        }),
      });

      await POST(request);

      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.lastSignInAt).not.toEqual(originalLastSignIn);
      expect(updatedUser.lastSignInAt).toBeInstanceOf(Date);
    });
  });

  describe('Invalid Login Attempts', () => {
    it('should reject login with invalid email', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'nonexistent@example.com',
          password: 'TestPassword123!',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.message).toContain('Invalid credentials');
      expect(data).not.toHaveProperty('token');
    });

    it('should reject login with invalid password', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'WrongPassword123!',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.message).toContain('Invalid credentials');
      expect(data).not.toHaveProperty('token');
    });

    it('should reject login with malformed email', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'invalid-email',
          password: 'TestPassword123!',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toContain('validation');
    });

    it('should reject login with missing fields', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          // Missing password
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toContain('required');
    });
  });

  describe('Security Validations', () => {
    it('should reject login for suspended users', async () => {
      await User.findByIdAndUpdate(testUser._id, { status: 'suspended' });

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'TestPassword123!',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.message).toContain('suspended');
    });

    it('should sanitize input data', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: '  TEST@EXAMPLE.COM  ',
          password: 'TestPassword123!',
        }),
      });

      const response = await POST(request);
      
      expect(response.status).toBe(200);
      // Email should be normalized to lowercase and trimmed
    });

    it('should validate request timestamp for replay attack prevention', async () => {
      const oldTimestamp = Date.now() - (10 * 60 * 1000); // 10 minutes ago

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'TestPassword123!',
          timestamp: oldTimestamp,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toContain('timestamp');
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      // Mock database error
      const originalFind = User.findOne;
      User.findOne = jest.fn().mockRejectedValue(new Error('Database connection failed'));

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'TestPassword123!',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.message).toContain('error');

      // Restore original method
      User.findOne = originalFind;
    });

    it('should handle malformed JSON gracefully', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: 'invalid json',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toContain('Invalid request');
    });
  });
});
