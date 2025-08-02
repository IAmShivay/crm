'use client';

import { useState } from 'react';
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
import { useCreateLeadMutation, useGetLeadSourcesQuery } from '@/lib/api/supabaseApi';
import { useAppSelector } from '@/lib/hooks';
import { toast } from 'sonner';

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

const leadStatuses = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'proposal', label: 'Proposal' },
  { value: 'negotiation', label: 'Negotiation' },
  { value: 'closed_won', label: 'Closed Won' },
  { value: 'closed_lost', label: 'Closed Lost' },
];

export function LeadForm({ onSuccess }: LeadFormProps) {
  const [selectedStatus, setSelectedStatus] = useState('new');
  const [selectedSource, setSelectedSource] = useState('');
  
  const { currentWorkspace } = useAppSelector((state) => state.workspace);
  const { register, handleSubmit, formState: { errors }, setValue } = useForm<LeadFormData>();
  
  const { data: leadSources = [] } = useGetLeadSourcesQuery(
    currentWorkspace?.id || '',
    { skip: !currentWorkspace?.id }
  );
  const [createLead, { isLoading }] = useCreateLeadMutation();

  const onSubmit = async (data: LeadFormData) => {
    if (!currentWorkspace?.id) {
      toast.error('No workspace selected');
      return;
    }

    try {
      await createLead({
        ...data,
        workspace_id: currentWorkspace.id,
        status: selectedStatus,
        source: selectedSource || 'manual',
        value: Number(data.value) || 0,
        tags: [],
        custom_fields: {},
      }).unwrap();
      
      toast.success('Lead created successfully');
      onSuccess?.();
    } catch (error) {
      toast.error('Failed to create lead');
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
              {leadStatuses.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
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
              <SelectItem value="manual">Manual Entry</SelectItem>
              <SelectItem value="website">Website</SelectItem>
              <SelectItem value="referral">Referral</SelectItem>
              <SelectItem value="social">Social Media</SelectItem>
              <SelectItem value="email">Email Campaign</SelectItem>
              <SelectItem value="phone">Phone Call</SelectItem>
              {leadSources.map((source) => (
                <SelectItem key={source.id} value={source.name}>
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
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Creating...' : 'Create Lead'}
        </Button>
      </div>
    </form>
  );
}