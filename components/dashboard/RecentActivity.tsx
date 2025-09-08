'use client';

import { Clock, User, FileText, UserPlus, Settings, DollarSign, Phone, Mail, Calendar, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useGetActivitiesQuery } from '@/lib/api/mongoApi';
import { useAppSelector } from '@/lib/hooks';

const activityIcons = {
  created: FileText,
  updated: Settings,
  joined_workspace: UserPlus,
  status_changed: Settings,
  role_changed: User,
  deal_closed: DollarSign,
  call_scheduled: Phone,
  email_sent: Mail,
  meeting_scheduled: Calendar,
  user_signed_in: User,
  user_signed_out: User,
  default: Clock,
};

const activityColors = {
  created: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  updated: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  joined_workspace: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  status_changed: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  role_changed: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  deal_closed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  call_scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  email_sent: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  meeting_scheduled: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
  user_signed_in: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  user_signed_out: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  default: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
};



export function RecentActivity() {
  const { currentWorkspace } = useAppSelector((state) => state.workspace);
  const { data: activitiesData, isLoading } = useGetActivitiesQuery(
    { workspaceId: currentWorkspace?.id || '', limit: 10 },
    { skip: !currentWorkspace?.id }
  );

  // Extract activities from the response
  const activities = activitiesData?.activities || [];

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
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
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
        <Button variant="outline" size="sm" className="text-xs">
          View All
          <ExternalLink className="h-3 w-3 ml-1" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.slice(0, 6).map((activity) => {
            const activityAction = (activity as any).action || (activity as any).activityType || 'default';
            const IconComponent = activityIcons[activityAction as keyof typeof activityIcons] || activityIcons.default;
            const colorClass = activityColors[activityAction as keyof typeof activityColors] || activityColors.default;

            return (
              <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                    <IconComponent className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {activity.description}
                  </p>
                  <div className="flex items-center space-x-2 mt-2">
                    <Badge variant="secondary" className={`text-xs ${colorClass}`}>
                      {(activity as any).entity_type || (activity as any).entityType || 'activity'}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {formatTimeAgo((activity as any).created_at || (activity as any).createdAt)}
                    </span>
                    {(activity as any).user_name && (
                      <>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500">
                          by {(activity as any).user_name}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {activities.length === 0 && !isLoading && (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-sm">No recent activity</p>
            <p className="text-gray-400 text-xs mt-1">Activity will appear here as your team works</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}