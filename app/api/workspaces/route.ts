/**
 * Workspaces API Endpoint
 * 
 * Handles workspace CRUD operations with comprehensive security,
 * logging, and validation.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/security/auth-middleware';
import { Workspace, WorkspaceMember, Role, User } from '@/lib/mongodb/models';
import { connectToMongoDB } from '@/lib/mongodb/connection';
import { log } from '@/lib/logging/logger';
import { logUserActivity, logBusinessEvent, withLogging, withSecurityLogging } from '@/lib/logging/middleware';
import { rateLimit } from '@/lib/security/rate-limiter';
import { z } from 'zod';
import mongoose from 'mongoose';

// Validation schemas
const createWorkspaceSchema = z.object({
  name: z
    .string()
    .min(1, 'Workspace name is required')
    .min(2, 'Workspace name must be at least 2 characters')
    .max(50, 'Workspace name is too long')
    .regex(/^[a-zA-Z0-9\s-_]+$/, 'Workspace name can only contain letters, numbers, spaces, hyphens, and underscores')
    .trim(),
  description: z
    .string()
    .max(200, 'Description is too long')
    .optional()
    .transform(val => val?.trim() || '')
});

/**
 * GET /api/workspaces
 * Get user's workspaces
 */
export const GET = withSecurityLogging(withLogging(async (request: NextRequest) => {
  const startTime = Date.now();

  try {
    // Ensure database connection
    await connectToMongoDB();
    // Rate limiting
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitResult = await rateLimit(clientIP, 'api');
    
    if (!rateLimitResult.success) {
      log.security('Rate limit exceeded for workspaces GET', {
        ip: clientIP,
        endpoint: '/api/workspaces'
      }, 'medium');
      
      return NextResponse.json(
        { message: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    // Authentication
    const authResult = await requireAuth(request);
    if (!authResult.success) {
      return authResult.response;
    }

    const userId = authResult.user.id;

    // Get user's workspace memberships
    const memberships = await WorkspaceMember.find({
      userId,
      status: 'active'
    }).populate('workspaceId');

    const workspaces = memberships.map(membership => ({
      id: membership.workspaceId._id,
      name: membership.workspaceId.name,
      slug: membership.workspaceId.slug,
      planId: membership.workspaceId.planId,
      subscriptionStatus: membership.workspaceId.subscriptionStatus,
      createdAt: membership.workspaceId.createdAt,
      role: membership.roleId
    }));

    const duration = Date.now() - startTime;
    log.performance('Get workspaces', duration, {
      userId,
      workspaceCount: workspaces.length
    });

    logUserActivity(userId, 'list_workspaces', 'workspaces', {
      count: workspaces.length
    });

    return NextResponse.json({
      workspaces,
      total: workspaces.length
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    log.error(`Get workspaces failed after ${duration}ms`, {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}));

/**
 * POST /api/workspaces
 * Create new workspace
 */
export const POST = withSecurityLogging(withLogging(async (request: NextRequest) => {
  const startTime = Date.now();

  try {
    // Ensure database connection
    await connectToMongoDB();
    // Rate limiting - stricter for workspace creation
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitResult = await rateLimit(clientIP, 'api', {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 5 // 5 workspace creations per minute
    });
    
    if (!rateLimitResult.success) {
      log.security('Rate limit exceeded for workspace creation', {
        ip: clientIP,
        endpoint: '/api/workspaces'
      }, 'high');
      
      return NextResponse.json(
        { message: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    // Authentication
    const authResult = await requireAuth(request);
    if (!authResult.success) {
      return authResult.response;
    }

    const userId = authResult.user.id;

    // Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { message: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const validation = createWorkspaceSchema.safeParse(body);
    if (!validation.success) {
      log.warn('Workspace creation validation failed', {
        userId,
        errors: validation.error.errors
      });
      
      return NextResponse.json(
        { 
          message: 'Validation failed',
          errors: validation.error.errors
        },
        { status: 400 }
      );
    }

    const { name, description } = validation.data;

    // Check if user already has a workspace with this name
    const existingMemberships = await WorkspaceMember.find({
      userId,
      status: 'active'
    }).populate('workspaceId');

    const hasWorkspaceWithName = existingMemberships.some(
      membership => membership.workspaceId.name.toLowerCase() === name.toLowerCase()
    );

    if (hasWorkspaceWithName) {
      return NextResponse.json(
        { message: 'You already have a workspace with this name' },
        { status: 409 }
      );
    }

    // Generate unique slug
    const baseSlug = name.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, ''); // Remove leading and trailing dashes
    
    let slug = baseSlug;
    let counter = 1;
    
    while (await Workspace.findOne({ slug })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Start transaction for workspace creation
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Create workspace
      const workspace = new Workspace({
        name,
        slug,
        description,
        planId: 'free', // Default to free plan
        subscriptionStatus: 'active',
        settings: {
          allowInvitations: true,
          requireEmailVerification: true,
          maxUsers: 5, // Free plan limit
          enableAuditLog: true,
          enableTwoFactor: false,
          sessionTimeout: 480 // 8 hours
        }
      });

      await workspace.save({ session });

      // Create owner role for the workspace
      const ownerRole = new Role({
        workspaceId: workspace._id,
        name: 'Owner',
        description: 'Full access to workspace',
        permissions: ['*:*'], // All permissions
        isDefault: true,
        isSystemRole: true
      });

      await ownerRole.save({ session });

      // Add user as workspace owner
      const membership = new WorkspaceMember({
        workspaceId: workspace._id,
        userId,
        roleId: ownerRole._id,
        status: 'active',
        joinedAt: new Date()
      });

      await membership.save({ session });

      // Commit transaction
      await session.commitTransaction();

      const duration = Date.now() - startTime;
      log.performance('Create workspace', duration, {
        userId,
        workspaceId: workspace._id.toString(),
        workspaceName: name
      });

      // Log business event
      logBusinessEvent('workspace_created', userId, workspace._id.toString(), {
        workspaceName: name,
        planId: 'free'
      });

      // Log user activity
      logUserActivity(userId, 'create_workspace', 'workspace', {
        workspaceId: workspace._id.toString(),
        workspaceName: name
      });

      log.info('Workspace created successfully', {
        userId,
        workspaceId: workspace._id.toString(),
        workspaceName: name,
        slug
      });

      return NextResponse.json({
        workspace: {
          id: workspace._id,
          name: workspace.name,
          slug: workspace.slug,
          description: workspace.description,
          planId: workspace.planId,
          subscriptionStatus: workspace.subscriptionStatus,
          createdAt: workspace.createdAt
        },
        role: {
          id: ownerRole._id,
          name: ownerRole.name,
          permissions: ownerRole.permissions
        }
      }, { status: 201 });

    } catch (error) {
      // Rollback transaction
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }

  } catch (error) {
    const duration = Date.now() - startTime;
    log.error(`Create workspace failed after ${duration}ms`, {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json(
      { message: 'Failed to create workspace' },
      { status: 500 }
    );
  }
}));
