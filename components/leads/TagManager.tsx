'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Tag } from 'lucide-react';
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

interface LeadTag {
  id: string;
  name: string;
  color: string;
  description?: string;
}

export function TagManager() {
  const [tags, setTags] = useState<LeadTag[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<LeadTag | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [description, setDescription] = useState('');

  const { currentWorkspace } = useAppSelector((state) => state.workspace);
  const { token } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (currentWorkspace?.id && token) {
      fetchTags();
    }
  }, [currentWorkspace?.id, token]);

  const fetchTags = async () => {
    if (!currentWorkspace?.id || !token) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/tags?workspaceId=${currentWorkspace.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setTags(data.tags);
      } else {
        toast.error('Failed to fetch tags');
      }
    } catch (error) {
      console.error('Error fetching tags:', error);
      toast.error('Failed to fetch tags');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWorkspace?.id || !token) return;

    const isEditing = !!editingTag;
    const url = isEditing 
      ? `/api/tags/${editingTag.id}?workspaceId=${currentWorkspace.id}`
      : `/api/tags?workspaceId=${currentWorkspace.id}`;
    
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
        toast.success(`Tag ${isEditing ? 'updated' : 'created'} successfully`);
        resetForm();
        fetchTags();
      } else {
        toast.error(data.message || `Failed to ${isEditing ? 'update' : 'create'} tag`);
      }
    } catch (error) {
      console.error('Error saving tag:', error);
      toast.error(`Failed to ${isEditing ? 'update' : 'create'} tag`);
    }
  };

  const handleEdit = (tag: LeadTag) => {
    setEditingTag(tag);
    setName(tag.name);
    setColor(tag.color);
    setDescription(tag.description || '');
    setIsCreateOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!currentWorkspace?.id || !token) return;

    try {
      const response = await fetch(`/api/tags/${id}?workspaceId=${currentWorkspace.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast.success('Tag deleted successfully');
        fetchTags();
      } else {
        toast.error('Failed to delete tag');
      }
    } catch (error) {
      console.error('Error deleting tag:', error);
      toast.error('Failed to delete tag');
    }
  };

  const resetForm = () => {
    setName('');
    setColor('#3b82f6');
    setDescription('');
    setEditingTag(null);
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Lead Tags</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Organize and categorize your leads</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={(open) => {
          if (!open) resetForm();
          setIsCreateOpen(open);
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Tag
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingTag ? 'Edit' : 'Create'} Tag</DialogTitle>
              <DialogDescription>
                {editingTag ? 'Update the tag details.' : 'Create a new tag to organize your leads.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Tag Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Hot Lead"
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
                  placeholder="Describe when to use this tag..."
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingTag ? 'Update' : 'Create'} Tag
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tags.map((tag) => (
          <Card key={tag.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Tag className="h-4 w-4" style={{ color: tag.color }} />
                  <CardTitle className="text-lg">{tag.name}</CardTitle>
                </div>
                <div className="flex items-center space-x-1">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(tag)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleDelete(tag.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            {tag.description && (
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400">{tag.description}</p>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {tags.length === 0 && (
        <div className="text-center py-12">
          <Tag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No tags found</p>
          <p className="text-sm text-gray-400 dark:text-gray-500">Create your first tag to get started</p>
        </div>
      )}
    </div>
  );
}
