'use client';

import { useState } from 'react';
import { Plus, Edit, Trash2, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useForm } from 'react-hook-form';
import {
  useGetLeadSourcesQuery,
  useCreateLeadSourceMutation,
  useUpdateLeadSourceMutation,
  useDeleteLeadSourceMutation
} from '@/lib/api/mongoApi';
import { useAppSelector } from '@/lib/hooks';
import { toast } from 'sonner';

interface LeadSourceFormData {
  name: string;
  description: string;
  color: string;
}

const colorOptions = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
  '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6b7280'
];

export function LeadSources() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<any>(null);
  const [selectedColor, setSelectedColor] = useState(colorOptions[0]);
  
  const { currentWorkspace } = useAppSelector((state) => state.workspace);
  const { data: leadSources = [], isLoading } = useGetLeadSourcesQuery(
    currentWorkspace?.id || '',
    { skip: !currentWorkspace?.id }
  );
  
  const [createLeadSource] = useCreateLeadSourceMutation();
  const [updateLeadSource] = useUpdateLeadSourceMutation();
  const [deleteLeadSource] = useDeleteLeadSourceMutation();
  
  const { register, handleSubmit, formState: { errors }, reset } = useForm<LeadSourceFormData>();

  const onSubmit = async (data: LeadSourceFormData) => {
    if (!currentWorkspace?.id) {
      toast.error('No workspace selected');
      return;
    }

    try {
      if (editingSource) {
        await updateLeadSource({
          id: editingSource.id,
          updates: {
            ...data,
            color: selectedColor,
          }
        });
        toast.success('Lead source updated successfully');
        setEditingSource(null);
      } else {
        await createLeadSource({
          ...data,
          workspace_id: currentWorkspace.id,
          color: selectedColor,
          is_active: true,
        });
        toast.success('Lead source created successfully');
        setIsCreateOpen(false);
      }
      reset();
      setSelectedColor(colorOptions[0]);
    } catch (error) {
      toast.error('Failed to save lead source');
    }
  };

  const handleEdit = (source: any) => {
    setEditingSource(source);
    setSelectedColor(source.color);
    reset({
      name: source.name,
      description: source.description || '',
      color: source.color,
    });
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteLeadSource(id);
      toast.success('Lead source deleted successfully');
    } catch (error) {
      toast.error('Failed to delete lead source');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Lead Sources</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage where your leads come from</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Source
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Lead Source</DialogTitle>
              <DialogDescription>
                Add a new source to track where your leads come from.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Website, Referral, LinkedIn"
                  {...register('name', { required: 'Name is required' })}
                />
                {errors.name && (
                  <p className="text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="Optional description"
                  {...register('description')}
                />
              </div>

              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex items-center space-x-2">
                  <Palette className="h-4 w-4 text-gray-500" />
                  <div className="flex space-x-2">
                    {colorOptions.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={`w-6 h-6 rounded-full border-2 ${
                          selectedColor === color ? 'border-gray-400' : 'border-gray-200'
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => setSelectedColor(color)}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Create Source
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Lead Sources ({leadSources.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {leadSources.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No lead sources found. Create your first source to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Color</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leadSources.map((source) => (
                  <TableRow key={source.id}>
                    <TableCell className="font-medium">{source.name}</TableCell>
                    <TableCell>{source.description || '-'}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: source.color }}
                        />
                        <span className="text-sm text-gray-500">{source.color}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={source.is_active ? 'default' : 'secondary'}>
                        {source.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(source.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(source)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(source.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingSource} onOpenChange={() => setEditingSource(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Lead Source</DialogTitle>
            <DialogDescription>
              Update the lead source information.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name *</Label>
              <Input
                id="edit-name"
                placeholder="e.g., Website, Referral, LinkedIn"
                {...register('name', { required: 'Name is required' })}
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Input
                id="edit-description"
                placeholder="Optional description"
                {...register('description')}
              />
            </div>

            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex items-center space-x-2">
                <Palette className="h-4 w-4 text-gray-500" />
                <div className="flex space-x-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`w-6 h-6 rounded-full border-2 ${
                        selectedColor === color ? 'border-gray-400' : 'border-gray-200'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setSelectedColor(color)}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setEditingSource(null)}>
                Cancel
              </Button>
              <Button type="submit">
                Update Source
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}