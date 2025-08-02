'use client';

import { Clock, User, FileText, UserPlus, Settings } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useGetActivitiesQuery } from '@/lib/api/supabaseApi';
import { useAppSelector } from '@/lib/hooks';

const activityIcons = {
  created: FileText,
  updated: Settings,
  joined_workspace: UserPlus,
  status_changed: Settings,
  role_changed: User,
  default: Clock,
};

const activityColors = {
  created: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  updated: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  joined_workspace: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  status_changed: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  role_changed: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  default: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
};

export function RecentActivity() {
  const { currentWorkspace } = useAppSelector((state) => state.workspace);
  const { data: activities = [], isLoading } = useGetActivitiesQuery(
    { workspaceId: currentWorkspace?.id || '', limit: 10 },
    { skip: !currentWorkspace?.id }
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No recent activity</p>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => {
              const IconComponent = activityIcons[activity.action as keyof typeof activityIcons] || activityIcons.default;
              const colorClass = activityColors[activity.action as keyof typeof activityColors] || activityColors.default;
              
              return (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                      <IconComponent className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-gray-100">
                      {activity.description}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge className={colorClass}>
                        {activity.entity_type}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {new Date(activity.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}