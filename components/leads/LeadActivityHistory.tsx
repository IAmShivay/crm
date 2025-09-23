'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  History,
  User,
  Clock,
  Edit,
  UserCheck,
  ToggleLeft,
  FileText,
  ArrowRight,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAppSelector } from '@/lib/hooks';
import { useGetLeadActivitiesQuery, type LeadActivity } from '@/lib/api/mongoApi';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface LeadActivityHistoryProps {
  leadId: string;
  leadName: string;
}

const activityTypeIcons = {
  created: User,
  updated: Edit,
  status_changed: ToggleLeft,
  assigned: UserCheck,
  note_added: FileText,
  converted: ArrowRight,
  deleted: User
};

const activityTypeColors = {
  created: 'bg-green-100 text-green-800',
  updated: 'bg-blue-100 text-blue-800',
  status_changed: 'bg-purple-100 text-purple-800',
  assigned: 'bg-orange-100 text-orange-800',
  note_added: 'bg-gray-100 text-gray-800',
  converted: 'bg-emerald-100 text-emerald-800',
  deleted: 'bg-red-100 text-red-800'
};

function formatFieldName(field: string): string {
  const fieldMap: Record<string, string> = {
    'name': 'Name',
    'email': 'Email',
    'phone': 'Phone',
    'company': 'Company',
    'value': 'Value',
    'source': 'Source',
    'notes': 'Notes',
    'statusId': 'Status',
    'assignedTo': 'Assigned To',
    'tagIds': 'Tags'
  };

  if (field.startsWith('customFields.') || field.startsWith('customData.')) {
    const customField = field.split('.')[1];
    return `Custom: ${customField}`;
  }

  return fieldMap[field] || field;
}

function formatFieldValue(value: any): string {
  if (value === null || value === undefined) {
    return 'None';
  }
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(', ') : 'None';
  }
  return String(value);
}

function ActivityItem({ activity }: { activity: LeadActivity }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const Icon = activityTypeIcons[activity.activityType];
  const colorClass = activityTypeColors[activity.activityType];

  return (
    <div className="flex items-start space-x-3 p-4 border-b border-gray-100 last:border-b-0">
      <div className={`p-2 rounded-full ${colorClass}`}>
        <Icon className="h-4 w-4" />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium text-gray-900">
              {activity.description}
            </p>
            <Badge variant="outline" className="text-xs">
              {activity.activityType.replace('_', ' ')}
            </Badge>
          </div>
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <Clock className="h-3 w-3" />
            <span>{formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}</span>
          </div>
        </div>

        {/* User information */}
        <div className="flex items-center space-x-2 mt-1">
          <User className="h-3 w-3 text-gray-400" />
          <span className="text-xs text-gray-600">
            {typeof activity.performedBy === 'object'
              ? activity.performedBy.fullName
              : 'Unknown User'
            }
          </span>
        </div>

        {activity.changes && activity.changes.length > 0 && (
          <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="mt-2 p-0 h-auto text-xs text-gray-600 hover:text-gray-900">
                {isExpanded ? (
                  <ChevronDown className="h-3 w-3 mr-1" />
                ) : (
                  <ChevronRight className="h-3 w-3 mr-1" />
                )}
                {activity.changes.length} change{activity.changes.length !== 1 ? 's' : ''}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <div className="space-y-2 pl-4 border-l-2 border-gray-200">
                {activity.changes.map((change, index) => (
                  <div key={index} className="text-xs">
                    <div className="font-medium text-gray-700">
                      {formatFieldName(change.field)}
                    </div>
                    <div className="flex items-center space-x-2 text-gray-600">
                      <span className="bg-red-50 text-red-700 px-2 py-1 rounded">
                        {formatFieldValue(change.oldValue)}
                      </span>
                      <ArrowRight className="h-3 w-3" />
                      <span className="bg-green-50 text-green-700 px-2 py-1 rounded">
                        {formatFieldValue(change.newValue)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {activity.metadata && Object.keys(activity.metadata).length > 0 && (
          <div className="mt-2 text-xs text-gray-500">
            {activity.metadata.totalChanges && (
              <span>Total changes: {activity.metadata.totalChanges}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function LeadActivityHistory({ leadId, leadName }: LeadActivityHistoryProps) {
  const { currentWorkspace } = useAppSelector((state) => state.workspace);
  const [open, setOpen] = useState(false);

  const {
    data: activitiesData,
    isLoading,
    error,
    refetch
  } = useGetLeadActivitiesQuery(
    {
      leadId,
      workspaceId: currentWorkspace?.id || '',
      limit: 100
    },
    {
      skip: !currentWorkspace?.id || !open
    }
  );

  const activities = activitiesData?.activities || [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <History className="h-4 w-4 mr-2" />
          History
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <History className="h-5 w-5" />
            <span>Activity History</span>
          </DialogTitle>
          <DialogDescription>
            Complete history of changes made to &quot;{leadName}&quot;
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600 mb-4">Failed to load activity history</p>
              <Button onClick={() => refetch()} variant="outline" size="sm">
                Try Again
              </Button>
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No activity history found</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-0">
                {activities.map((activity) => (
                  <ActivityItem key={activity.id} activity={activity} />
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
