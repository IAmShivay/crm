'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCreateRoleMutation, useGetPermissionsQuery } from '@/lib/api/supabaseApi';
import { toast } from 'sonner';

interface RoleFormProps {
  onSuccess?: () => void;
}

interface RoleFormData {
  name: string;
  description: string;
  permissions: string[];
}

export function RoleForm({ onSuccess }: RoleFormProps) {
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const { register, handleSubmit, formState: { errors } } = useForm<RoleFormData>();
  
  const { data: permissions = [] } = useGetPermissionsQuery();
  const [createRole, { isLoading }] = useCreateRoleMutation();

  const onSubmit = async (data: RoleFormData) => {
    try {
      await createRole({
        ...data,
        permissions: selectedPermissions,
        workspace_id: 'default',
        is_system: false,
      }).unwrap();
      toast.success('Role created successfully');
      onSuccess?.();
    } catch (error) {
      toast.error('Failed to create role');
    }
  };

  const handlePermissionToggle = (permissionId: string) => {
    setSelectedPermissions(prev => 
      prev.includes(permissionId)
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const resources = Array.from(new Set(permissions.map(p => p.resource)));

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Role Name</Label>
          <Input
            id="name"
            placeholder="e.g. Sales Manager"
            {...register('name', { required: 'Role name is required' })}
          />
          {errors.name && (
            <p className="text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>
        
        <div className="space-y-2 col-span-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="Describe what this role can do..."
            {...register('description', { required: 'Description is required' })}
          />
          {errors.description && (
            <p className="text-sm text-red-600">{errors.description.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <Label>Permissions</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {resources.map(resource => (
            <Card key={resource}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base capitalize">{resource}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {permissions
                  .filter(p => p.resource === resource)
                  .map(permission => (
                    <div key={permission.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={permission.id}
                        checked={selectedPermissions.includes(permission.id)}
                        onCheckedChange={() => handlePermissionToggle(permission.id)}
                      />
                      <Label 
                        htmlFor={permission.id}
                        className="text-sm capitalize cursor-pointer"
                      >
                        {permission.action}
                      </Label>
                    </div>
                  ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onSuccess}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Creating...' : 'Create Role'}
        </Button>
      </div>
    </form>
  );
}