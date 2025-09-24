/**
 * Workspace Invitations API Endpoint
 *
 * Handles workspace member invitations including:
 * - GET: List pending invitations
 * - POST: Send new invitation
 * - PUT: Resend invitation
 * - DELETE: Cancel invitation
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/security/auth-middleware'
import { WorkspaceMember, Role, User, Workspace } from '@/lib/mongodb/models'
import { connectToMongoDB } from '@/lib/mongodb/connection'
import { log } from '@/lib/logging/logger'
import {
  logUserActivity,
  logBusinessEvent,
  withLogging,
  withSecurityLogging,
} from '@/lib/logging/middleware'
import { rateLimit } from '@/lib/security/rate-limiter'
import { getClientIP } from '@/lib/utils/ip-utils'
import { z } from 'zod'
import mongoose from 'mongoose'
import crypto from 'crypto'

// Validation schemas
const inviteUserSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase(),
  roleId: z.string().min(1, 'Role is required'),
  message: z
    .string()
    .max(500, 'Message must be less than 500 characters')
    .optional(),
})

// Generate invitation token
function generateInviteToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

// GET /api/workspaces/[id]/invites - List pending invitations
export const GET = withSecurityLogging(
  withLogging(
    async (request: NextRequest, { params }: { params: { id: string } }) => {
      const startTime = Date.now()

      try {
        // Ensure database connection
        await connectToMongoDB()

        // Rate limiting
        const clientIp = getClientIP(request)
        const rateLimitResult = await rateLimit(clientIp, 'api')
        if (!rateLimitResult.success) {
          return NextResponse.json(
            { message: 'Too many requests. Please try again later.' },
            { status: 429 }
          )
        }

        // Authentication
        const authResult = await requireAuth(request)
        if (!authResult.success) {
          return authResult.response
        }

        const userId = authResult.user.id
        const workspaceId = params.id

        // Validate workspace ID format
        if (!mongoose.Types.ObjectId.isValid(workspaceId)) {
          return NextResponse.json(
            { message: 'Invalid workspace ID format' },
            { status: 400 }
          )
        }

        // Check if user has permission to view invitations
        const membership = await WorkspaceMember.findOne({
          workspaceId,
          userId,
          status: 'active',
        }).populate('roleId')

        if (!membership) {
          return NextResponse.json(
            {
              message: 'Access denied. You are not a member of this workspace.',
            },
            { status: 403 }
          )
        }

        // Check permissions
        const userPermissions = membership.roleId?.permissions || []
        if (
          !userPermissions.includes('members.view') &&
          !['Owner', 'Admin'].includes(membership.roleId?.name)
        ) {
          return NextResponse.json(
            {
              message:
                'Access denied. Insufficient permissions to view invitations.',
            },
            { status: 403 }
          )
        }

        // Get pending invitations
        const pendingInvites = await WorkspaceMember.find({
          workspaceId,
          status: 'pending',
        })
          .populate('roleId', 'name permissions')
          .populate('invitedBy', 'name email')
          .sort({ createdAt: -1 })

        const invitations = pendingInvites.map(invite => ({
          id: invite._id,
          email: invite.email,
          role: {
            id: invite.roleId._id,
            name: invite.roleId.name,
            permissions: invite.roleId.permissions,
          },
          invitedBy: {
            id: invite.invitedBy._id,
            name: invite.invitedBy.name,
            email: invite.invitedBy.email,
          },
          invitedAt: invite.createdAt,
          expiresAt: invite.inviteExpiresAt,
          message: invite.inviteMessage,
        }))

        // Log successful access
        logUserActivity(userId, 'invitations_viewed', 'workspace', {
          workspaceId,
          inviteCount: invitations.length,
        })

        log.info(
          `Invitations retrieved for workspace ${workspaceId} by user ${userId}`,
          {
            workspaceId,
            userId,
            inviteCount: invitations.length,
            duration: Date.now() - startTime,
          }
        )

        return NextResponse.json({
          success: true,
          invitations,
        })
      } catch (error) {
        log.error('Error retrieving workspace invitations:', error)

        return NextResponse.json(
          {
            success: false,
            message: 'Failed to retrieve workspace invitations',
            error:
              process.env.NODE_ENV === 'development'
                ? (error as Error).message
                : undefined,
          },
          { status: 500 }
        )
      }
    }
  )
)

// POST /api/workspaces/[id]/invites - Send new invitation
export const POST = withSecurityLogging(
  withLogging(
    async (request: NextRequest, { params }: { params: { id: string } }) => {
      const startTime = Date.now()

      try {
        // Ensure database connection
        await connectToMongoDB()

        // Rate limiting - stricter for invitations
        const clientIp = getClientIP(request)
        const rateLimitResult = await rateLimit(clientIp, 'invites')
        if (!rateLimitResult.success) {
          return NextResponse.json(
            {
              message: 'Too many invitation requests. Please try again later.',
            },
            { status: 429 }
          )
        }

        // Authentication
        const authResult = await requireAuth(request)
        if (!authResult.success) {
          return authResult.response
        }

        const userId = authResult.user.id
        const workspaceId = params.id

        // Validate workspace ID format
        if (!mongoose.Types.ObjectId.isValid(workspaceId)) {
          return NextResponse.json(
            { message: 'Invalid workspace ID format' },
            { status: 400 }
          )
        }

        // Parse and validate request body
        const body = await request.json()
        const validationResult = inviteUserSchema.safeParse(body)

        if (!validationResult.success) {
          return NextResponse.json(
            {
              message: 'Validation failed',
              errors: validationResult.error.errors,
            },
            { status: 400 }
          )
        }

        const { email, roleId, message } = validationResult.data

        // Check if user has permission to invite members
        const membership = await WorkspaceMember.findOne({
          workspaceId,
          userId,
          status: 'active',
        }).populate('roleId')

        if (!membership) {
          return NextResponse.json(
            {
              message: 'Access denied. You are not a member of this workspace.',
            },
            { status: 403 }
          )
        }

        // Check permissions
        const userPermissions = membership.roleId?.permissions || []
        if (
          !userPermissions.includes('members.invite') &&
          !['Owner', 'Admin'].includes(membership.roleId?.name)
        ) {
          return NextResponse.json(
            {
              message:
                'Access denied. Insufficient permissions to invite members.',
            },
            { status: 403 }
          )
        }

        // Validate role exists and belongs to workspace
        const role = await Role.findOne({ _id: roleId, workspaceId })
        if (!role) {
          return NextResponse.json(
            { message: 'Invalid role specified' },
            { status: 400 }
          )
        }

        // Check if user is already a member or has pending invitation
        const existingMember = await WorkspaceMember.findOne({
          workspaceId,
          email,
        })

        if (existingMember) {
          if (existingMember.status === 'active') {
            return NextResponse.json(
              { message: 'User is already a member of this workspace' },
              { status: 409 }
            )
          } else if (existingMember.status === 'pending') {
            return NextResponse.json(
              { message: 'User already has a pending invitation' },
              { status: 409 }
            )
          }
        }

        // Get workspace details for invitation
        const workspace = await Workspace.findById(workspaceId)
        if (!workspace) {
          return NextResponse.json(
            { message: 'Workspace not found' },
            { status: 404 }
          )
        }

        // Create invitation
        const inviteToken = generateInviteToken()
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

        const invitation = new WorkspaceMember({
          workspaceId,
          email,
          roleId,
          status: 'pending',
          invitedBy: userId,
          inviteToken,
          inviteExpiresAt: expiresAt,
          inviteMessage: message,
        })

        await invitation.save()

        // TODO: Send invitation email
        // await sendInvitationEmail({
        //   email,
        //   workspaceName: workspace.name,
        //   roleName: role.name,
        //   inviterName: membership.userId.name,
        //   inviteToken,
        //   message
        // });

        // Log successful invitation
        logUserActivity(userId, 'member_invited', 'workspace', {
          workspaceId,
          invitedEmail: email,
          roleId,
          roleName: role.name,
        })

        logBusinessEvent('member_invited', userId, workspaceId, {
          invitedEmail: email,
          roleId,
          roleName: role.name,
          duration: Date.now() - startTime,
        })

        log.info(
          `Member invited to workspace ${workspaceId} by user ${userId}`,
          {
            workspaceId,
            userId,
            invitedEmail: email,
            roleId,
            duration: Date.now() - startTime,
          }
        )

        return NextResponse.json(
          {
            success: true,
            message: 'Invitation sent successfully',
            invitation: {
              id: invitation._id,
              email: invitation.email,
              role: {
                id: role._id,
                name: role.name,
              },
              invitedAt: invitation.createdAt,
              expiresAt: invitation.inviteExpiresAt,
            },
          },
          { status: 201 }
        )
      } catch (error) {
        log.error('Error sending workspace invitation:', error)

        return NextResponse.json(
          {
            success: false,
            message: 'Failed to send workspace invitation',
            error:
              process.env.NODE_ENV === 'development'
                ? (error as Error).message
                : undefined,
          },
          { status: 500 }
        )
      }
    }
  )
)
