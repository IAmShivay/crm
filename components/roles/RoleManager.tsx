'use client';

import { useState } from 'react';
import { Plus, Shield, Edit, Trash2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { useGetRolesQuery, useDeleteRoleMutation } from '@/lib/api/supabaseApi';
import { RoleForm } from './RoleForm';
import { toast } from 'sonner';

export function RoleManager() {
  const [selectedRole, setSelectedRole] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data: roles = [], isLoading } = useGetRolesQuery('default-workspace');
  const [deleteRole] = useDeleteRoleMutation();

  const handleDelete = async (id: string) => {
    try {
      await deleteRole(id).unwrap();
      toast.success('Role deleted successfully');
    } catch (error) {
      toast.error('Failed to delete role');
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading roles...</div>;
  }

  return (
    <div className="w-full space-y-6">
      <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Role Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Create and manage custom roles with granular permissions</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Role
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Role</DialogTitle>
              <DialogDescription>
                Define a new role with specific permissions for your workspace.
              </DialogDescription>
            </DialogHeader>
            <RoleForm onSuccess={() => setIsCreateOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {roles.map((role) => (
          <Card key={role.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-lg">{role.name}</CardTitle>
                </div>
                <div className="flex items-center space-x-1">
                  <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  {!role.is_system && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDelete(role.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{role.description}</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Type</span>
                  <Badge variant={!role.is_system ? 'default' : 'secondary'}>
                    {!role.is_system ? 'Custom' : 'System'}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Permissions</span>
                  <span className="text-sm text-gray-600">{role.permissions.length}</span>
                </div>

                <div className="pt-3 border-t">
                  <p className="text-xs text-gray-500 mb-2">Key Permissions:</p>
                  <div className="flex flex-wrap gap-1">
                    {role.permissions.slice(0, 3).map((permission, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {permission}
                      </Badge>
                    ))}
                    {role.permissions.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{role.permissions.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}