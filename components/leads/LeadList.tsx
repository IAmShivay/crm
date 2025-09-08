'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Filter, MoreHorizontal, Trash2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { LeadForm } from './LeadForm';
import { LeadDetailsSheet } from './LeadDetailsSheet';
import { TableSkeleton, PageHeaderSkeleton } from '@/components/ui/skeleton';
import { useGetLeadsQuery, useDeleteLeadMutation } from '@/lib/api/mongoApi';

const statusColors = {
  new: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  contacted: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  qualified: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  proposal: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  negotiation: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  closed_won: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300',
  closed_lost: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
};

export function LeadList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const { currentWorkspace } = useAppSelector((state) => state.workspace);

  // RTK Query hooks
  const { data: leadsData, isLoading, error, refetch } = useGetLeadsQuery(
    {
      workspaceId: currentWorkspace?.id || '',
      search: searchTerm,
      status: statusFilter
    },
    { skip: !currentWorkspace?.id }
  );
  const [deleteLead] = useDeleteLeadMutation();

  const leads = leadsData?.leads || [];

  const handleDelete = async (id: string) => {
    if (!currentWorkspace?.id) return;

    try {
      await deleteLead({ id, workspaceId: currentWorkspace.id }).unwrap();
      toast.success('Lead deleted successfully');
    } catch (error) {
      console.error('Error deleting lead:', error);
      toast.error('Failed to delete lead');
    }
  };

  const handleViewDetails = (lead: any) => {
    setSelectedLead(lead);
    setIsDetailsOpen(true);
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (lead.email && lead.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (lead.company && lead.company.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = !statusFilter || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="w-full space-y-6">
        <PageHeaderSkeleton />
        <div className="flex items-center space-x-4 mb-6">
          <div className="flex-1">
            <div className="h-10 bg-muted animate-pulse rounded-md"></div>
          </div>
          <div className="h-10 w-32 bg-muted animate-pulse rounded-md"></div>
          <div className="h-10 w-32 bg-muted animate-pulse rounded-md"></div>
        </div>
        <TableSkeleton rows={8} columns={6} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 dark:text-red-400">Error loading leads. Please try again.</p>
        <Button onClick={() => refetch()} className="mt-4">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Leads</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your sales leads and prospects</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Lead
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Lead</DialogTitle>
              <DialogDescription>
                Add a new lead to your sales pipeline.
              </DialogDescription>
            </DialogHeader>
            <LeadForm onSuccess={() => setIsCreateOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <Card className="w-full">
        <CardHeader>
          <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle>All Leads ({filteredLeads.length})</CardTitle>
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search leads..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>
              <Button variant="outline" size="sm" className="w-full sm:w-auto">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredLeads.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No leads found. Create your first lead to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell className="font-medium">{lead.name}</TableCell>
                    <TableCell>{lead.email || '-'}</TableCell>
                    <TableCell>{lead.company || '-'}</TableCell>
                    <TableCell>
                      {lead.statusId && typeof lead.statusId === 'object' ? (
                        <Badge
                          variant="secondary"
                          style={{ backgroundColor: lead.statusId.color + '20', color: lead.statusId.color }}
                        >
                          {lead.statusId.name}
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          {lead.status || 'No Status'}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {lead.tagIds && Array.isArray(lead.tagIds) && lead.tagIds.length > 0 ? (
                          lead.tagIds.slice(0, 2).map((tag: any) => (
                            <Badge
                              key={tag.id || tag._id}
                              variant="outline"
                              className="text-xs"
                              style={{ borderColor: tag.color, color: tag.color }}
                            >
                              {tag.name}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                        {lead.tagIds && lead.tagIds.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{lead.tagIds.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {lead.assignedTo && typeof lead.assignedTo === 'object' ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                            {lead.assignedTo.fullName?.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm">{lead.assignedTo.fullName}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {lead.value ? `$${lead.value.toLocaleString()}` : '-'}
                    </TableCell>
                    <TableCell>
                      {new Date(lead.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewDetails(lead)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View & Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleDelete(lead.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Lead Creation Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Lead</DialogTitle>
            <DialogDescription>
              Add a new lead to your workspace
            </DialogDescription>
          </DialogHeader>
          <LeadForm onSuccess={() => setIsCreateOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Lead Details Sheet */}
      <LeadDetailsSheet
        lead={selectedLead}
        open={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedLead(null);
        }}
        onDelete={handleDelete}
      />
    </div>
  );
}