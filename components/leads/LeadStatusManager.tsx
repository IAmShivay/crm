'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useAppSelector } from '@/lib/hooks';
import { toast } from 'sonner';
import { CardSkeleton, PageHeaderSkeleton } from '@/components/ui/skeleton';
import { useGetLeadStatusesQuery, useCreateLeadStatusMutation, useDeleteLeadStatusMutation } from '@/lib/api/mongoApi';

interface LeadStatus {
  id: string;
  name: string;
  color: string;
  description?: string;
  order: number;
  isDefault: boolean;
  isActive: boolean;
}

export function LeadStatusManager() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState<LeadStatus | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [description, setDescription] = useState('');

  const { currentWorkspace } = useAppSelector((state) => state.workspace);

  // RTK Query hooks
  const { data: statusesData, isLoading, refetch } = useGetLeadStatusesQuery(currentWorkspace?.id || '', {
    skip: !currentWorkspace?.id
  });
  const [createLeadStatus] = useCreateLeadStatusMutation();
  const [deleteLeadStatus] = useDeleteLeadStatusMutation();

  const statuses = statusesData?.statuses || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWorkspace?.id || !token) return;

    const isEditing = !!editingStatus;
    const url = isEditing 
      ? `/api/lead-statuses/${editingStatus.id}?workspaceId=${currentWorkspace.id}`
      : `/api/lead-statuses?workspaceId=${currentWorkspace.id}`;
    
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          color,
          description,
          workspaceId: currentWorkspace.id,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success(`Lead status ${isEditing ? 'updated' : 'created'} successfully`);
        resetForm();
        fetchStatuses();
      } else {
        toast.error(data.message || `Failed to ${isEditing ? 'update' : 'create'} lead status`);
      }
    } catch (error) {
      console.error('Error saving lead status:', error);
      toast.error(`Failed to ${isEditing ? 'update' : 'create'} lead status`);
    }
  };

  const handleEdit = (status: LeadStatus) => {
    setEditingStatus(status);
    setName(status.name);
    setColor(status.color);
    setDescription(status.description || '');
    setIsCreateOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!currentWorkspace?.id || !token) return;

    try {
      const response = await fetch(`/api/lead-statuses/${id}?workspaceId=${currentWorkspace.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast.success('Lead status deleted successfully');
        fetchStatuses();
      } else {
        toast.error('Failed to delete lead status');
      }
    } catch (error) {
      console.error('Error deleting lead status:', error);
      toast.error('Failed to delete lead status');
    }
  };

  const resetForm = () => {
    setName('');
    setColor('#3b82f6');
    setDescription('');
    setEditingStatus(null);
    setIsCreateOpen(false);
  };

  if (isLoading) {
    return (
      <div className="w-full space-y-6">
        <PageHeaderSkeleton />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Lead Statuses</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your lead pipeline statuses</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={(open) => {
          if (!open) resetForm();
          setIsCreateOpen(open);
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Status
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingStatus ? 'Edit' : 'Create'} Lead Status</DialogTitle>
              <DialogDescription>
                {editingStatus ? 'Update the lead status details.' : 'Create a new status for your lead pipeline.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Status Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Qualified"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="color">Color</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="color"
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-16 h-10"
                  />
                  <Input
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    placeholder="#3b82f6"
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe when to use this status..."
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingStatus ? 'Update' : 'Create'} Status
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statuses.map((status) => (
          <Card key={status.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Circle className="h-4 w-4" style={{ color: status.color, fill: status.color }} />
                  <CardTitle className="text-lg">{status.name}</CardTitle>
                  {status.isDefault && (
                    <Badge variant="secondary" className="text-xs">Default</Badge>
                  )}
                </div>
                <div className="flex items-center space-x-1">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(status)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  {!status.isDefault && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDelete(status.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            {status.description && (
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400">{status.description}</p>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {statuses.length === 0 && (
        <div className="text-center py-12">
          <Circle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No lead statuses found</p>
          <p className="text-sm text-gray-400 dark:text-gray-500">Create your first status to get started</p>
        </div>
      )}
    </div>
  );
}
