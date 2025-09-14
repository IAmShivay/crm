'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAppSelector } from '@/lib/hooks';
import { toast } from 'sonner';
import { useCreateLeadMutation, useGetLeadStatusesQuery, useGetTagsQuery } from '@/lib/api/mongoApi';

interface LeadFormProps {
  onSuccess?: () => void;
}

interface LeadFormData {
  name: string;
  email: string;
  phone: string;
  company: string;
  status: string;
  source: string;
  value: number;
  notes: string;
}



export function LeadForm({ onSuccess }: LeadFormProps) {
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedSource, setSelectedSource] = useState('manual');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const { currentWorkspace } = useAppSelector((state) => state.workspace);
  const { user } = useAppSelector((state) => state.auth);
  const { register, handleSubmit, formState: { errors } } = useForm<LeadFormData>();

  // RTK Query hooks
  const [createLead, { isLoading: isCreating }] = useCreateLeadMutation();
  const { data: statusesData,isLoading:loadingStatuses } = useGetLeadStatusesQuery(currentWorkspace?.id || '', {
    skip: !currentWorkspace?.id
  });
  const { data: tagsData } = useGetTagsQuery(currentWorkspace?.id || '', {
    skip: !currentWorkspace?.id
  });
  
  // Default lead sources
  const leadSources = [
    { id: 'website', name: 'Website' },
    { id: 'referral', name: 'Referral' },
    { id: 'social_media', name: 'Social Media' },
    { id: 'cold_outreach', name: 'Cold Outreach' },
    { id: 'event', name: 'Event' },
    { id: 'linkedin', name: 'LinkedIn' },
    { id: 'google_ads', name: 'Google Ads' },
    { id: 'facebook_ads', name: 'Facebook Ads' },
    { id: 'email_campaign', name: 'Email Campaign' },
    { id: 'phone_call', name: 'Phone Call' },
    { id: 'walk_in', name: 'Walk-in' },
    { id: 'other', name: 'Other' }
  ];

  // Fetch lead statuses
  // Get data from RTK Query
  const leadStatuses = statusesData?.statuses || [];
  const tags = tagsData?.tags || [];

  // Set default status when statuses are loaded
  useEffect(() => {
    if (statusesData?.statuses && statusesData.statuses.length > 0 && !selectedStatus) {
      // Find default status or use first status
      const defaultStatus = statusesData.statuses.find(status => status.isDefault) || statusesData.statuses[0];
      if (defaultStatus) {
        setSelectedStatus(defaultStatus.id);
      }
    }
  }, [statusesData, selectedStatus]);
  const onSubmit = async (data: LeadFormData) => {
    if (!currentWorkspace?.id) {
      toast.error('No workspace selected');
      return;
    }

    if (!user) {
      toast.error('User not authenticated');
      return;
    }

    try {
      await createLead({
        ...data,
        workspaceId: currentWorkspace.id,
        statusId: selectedStatus, // Will be set by useEffect or fallback to API default
        source: selectedSource || 'manual',
        value: Number(data.value) || 0,
        tagIds: selectedTags,
        customFields: {},
        notes: data.notes || '',
      }).unwrap();

      toast.success('Lead created successfully');
      onSuccess?.();
    } catch (error: any) {
      console.error('Error creating lead:', error);
      // Check if it's a validation error or server error
      const errorMessage = error?.data?.message || error?.message || 'Failed to create lead';
      toast.error(errorMessage);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            placeholder="Lead's full name"
            {...register('name', { required: 'Name is required' })}
          />
          {errors.name && (
            <p className="text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="lead@example.com"
            {...register('email', {
              pattern: {
                value: /^\S+@\S+$/i,
                message: 'Please enter a valid email'
              }
            })}
          />
          {errors.email && (
            <p className="text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            placeholder="+1 (555) 123-4567"
            {...register('phone')}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="company">Company</Label>
          <Input
            id="company"
            placeholder="Company name"
            {...register('company')}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {loadingStatuses ? (
                <SelectItem value="loading" disabled>Loading statuses...</SelectItem>
              ) : leadStatuses.length > 0 ? (
                leadStatuses.map((status) => (
                  <SelectItem key={status.id} value={status.id}>
                    {status.name}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="" disabled>No statuses available</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label>Source</Label>
          <Select value={selectedSource} onValueChange={setSelectedSource}>
            <SelectTrigger>
              <SelectValue placeholder="Select source" />
            </SelectTrigger>
            <SelectContent>
              {leadSources.map((source) => (
                <SelectItem key={source.id} value={source.id}>
                  {source.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="value">Potential Value ($)</Label>
        <Input
          id="value"
          type="number"
          placeholder="0"
          min="0"
          step="0.01"
          {...register('value')}
        />
      </div>

      <div className="space-y-2">
        <Label>Tags</Label>
        <Select value={selectedTags.join(',')} onValueChange={(value) => setSelectedTags(value ? value.split(',') : [])}>
          <SelectTrigger>
            <SelectValue placeholder="Select tags (optional)" />
          </SelectTrigger>
          <SelectContent>
            {tags.map((tag) => (
              <SelectItem key={tag.id} value={tag.id}>
                <div className="flex items-center space-x-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: tag.color }}
                  />
                  <span>{tag.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          placeholder="Additional notes about this lead..."
          rows={3}
          {...register('notes')}
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onSuccess}>
          Cancel
        </Button>
        <Button type="submit" disabled={isCreating}>
          {isCreating ? 'Creating...' : 'Create Lead'}
        </Button>
      </div>
    </form>
  );
}