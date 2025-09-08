import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/mongodb/auth';
import { Lead, WorkspaceMember } from '@/lib/mongodb/client';
import { connectToMongoDB } from '@/lib/mongodb/connection';
import { withLogging, withSecurityLogging, logUserActivity, logBusinessEvent } from '@/lib/logging/middleware';
import { log } from '@/lib/logging/logger';
import { z } from 'zod';

// Validation schema for updating leads
const updateLeadSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long').optional(),
  email: z.string().email('Invalid email').max(255, 'Email too long').optional().or(z.literal('')),
  phone: z.string().max(20, 'Phone too long').optional().or(z.literal('')),
  company: z.string().max(100, 'Company name too long').optional().or(z.literal('')),
  value: z.number().min(0, 'Value must be positive').max(999999999, 'Value too large').optional(),
  source: z.enum(['manual', 'website', 'referral', 'social', 'social_media', 'email', 'phone', 'other']).optional(),
  notes: z.string().max(2000, 'Notes too long').optional().or(z.literal('')),
  statusId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid status ID format').optional().or(z.literal('')),
  tagIds: z.array(z.string().regex(/^[a-f\d]{24}$/i, 'Invalid tag ID format')).max(10, 'Too many tags').optional(),
  assignedTo: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid user ID format').optional().or(z.literal('')),
});

// PUT /api/leads/[id] - Update a lead
export const PUT = withSecurityLogging(withLogging(async (request: NextRequest, { params }: { params: { id: string } }) => {
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

    const leadId = params.id;
    const body = await request.json();

    // Get workspaceId from query params
    const url = new URL(request.url);
    const workspaceId = url.searchParams.get('workspaceId');

    if (!workspaceId) {
      return NextResponse.json({ message: 'Workspace ID is required' }, { status: 400 });
    }

    // Validate request body
    const validationResult = updateLeadSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          message: 'Validation failed',
          errors: validationResult.error.errors
        },
        { status: 400 }
      );
    }

    const updateData = validationResult.data;

    // Check if user has access to this workspace
    const userMembership = await WorkspaceMember.findOne({
      workspaceId,
      userId: auth.user.id,
      status: 'active'
    });

    if (!userMembership) {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 });
    }

    // Additional security: Validate that statusId and tagIds belong to the same workspace
    if (updateData.statusId && updateData.statusId !== '') {
      const { LeadStatus } = await import('@/lib/mongodb/client');
      const statusExists = await LeadStatus.findOne({
        _id: updateData.statusId,
        workspaceId
      });
      if (!statusExists) {
        return NextResponse.json({ message: 'Invalid status ID' }, { status: 400 });
      }
    }

    if (updateData.tagIds && updateData.tagIds.length > 0) {
      const { Tag } = await import('@/lib/mongodb/client');
      const validTags = await Tag.find({
        _id: { $in: updateData.tagIds },
        workspaceId
      });
      if (validTags.length !== updateData.tagIds.length) {
        return NextResponse.json({ message: 'One or more invalid tag IDs' }, { status: 400 });
      }
    }

    if (updateData.assignedTo && updateData.assignedTo !== '') {
      const assignedUserMembership = await WorkspaceMember.findOne({
        workspaceId,
        userId: updateData.assignedTo,
        status: 'active'
      });
      if (!assignedUserMembership) {
        return NextResponse.json({ message: 'Invalid assigned user ID' }, { status: 400 });
      }
    }

    // Find and update the lead
    const lead = await Lead.findOne({ _id: leadId, workspaceId });
    if (!lead) {
      return NextResponse.json({ message: 'Lead not found' }, { status: 404 });
    }

    // Update the lead with provided data
    Object.assign(lead, updateData);
    lead.updatedAt = new Date();
    await lead.save();

    // Populate the updated lead
    const populatedLead = await Lead.findById(leadId)
      .populate('statusId', 'name color')
      .populate('tagIds', 'name color')
      .populate('assignedTo', 'fullName email')
      .lean();

    // Log the activity
    logUserActivity(
      auth.user.id,
      'lead_updated',
      'lead',
      {
        leadId,
        leadName: lead.name,
        updatedFields: Object.keys(updateData),
        workspaceId
      }
    );

    logBusinessEvent(
      'lead_updated',
      auth.user.id,
      workspaceId,
      {
        leadId,
        leadName: lead.name,
        value: lead.value,
        updatedFields: Object.keys(updateData)
      }
    );

    log.info(`Lead updated successfully`, {
      leadId,
      workspaceId,
      updatedBy: auth.user.id,
      updatedFields: Object.keys(updateData),
      duration: Date.now() - startTime
    });

    return NextResponse.json({
      success: true,
      message: 'Lead updated successfully',
      lead: populatedLead
    });

  } catch (error) {
    log.error('Update lead error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}, {
  logBody: true,
  logHeaders: true
}));

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

    logUserActivity(auth.user.id, 'lead.delete', 'lead', {
      workspaceId,
      leadId,
      leadName: lead.name
    });

    logBusinessEvent('lead_deleted', auth.user.id, workspaceId, {
      leadId,
      leadName: lead.name
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
