import { StatsCards } from '@/components/dashboard/StatsCards';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { AnalyticsOverview } from '@/components/dashboard/AnalyticsOverview';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DashboardPage() {
  return (
    <div className="w-full space-y-6">
      <div className="w-full">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back! Here's what's happening with your sales.</p>
      </div>
      
      <StatsCards />

      <div className="w-full grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
        {/* Recent Activity - Takes 2 columns on xl screens */}
        <div className="xl:col-span-2 w-full">
          <RecentActivity />
        </div>

        {/* Analytics Overview - Takes 1 column on xl screens */}
        <div className="xl:col-span-1 w-full">
          <AnalyticsOverview />
        </div>
      </div>

      {/* Additional row for more cards */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Sales Pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Prospecting</span>
                <span className="text-sm text-muted-foreground">12 leads</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: '25%' }}></div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Qualified</span>
                <span className="text-sm text-muted-foreground">8 leads</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '45%' }}></div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Proposal</span>
                <span className="text-sm text-muted-foreground">5 leads</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-orange-500 h-2 rounded-full" style={{ width: '65%' }}></div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Negotiation</span>
                <span className="text-sm text-muted-foreground">3 leads</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '85%' }}></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <button className="p-4 text-left border rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors">
                <div className="text-sm font-medium">Add Lead</div>
                <div className="text-xs text-muted-foreground">Create new lead</div>
              </button>
              <button className="p-4 text-left border rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors">
                <div className="text-sm font-medium">Schedule Call</div>
                <div className="text-xs text-muted-foreground">Book meeting</div>
              </button>
              <button className="p-4 text-left border rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors">
                <div className="text-sm font-medium">Send Email</div>
                <div className="text-xs text-muted-foreground">Email campaign</div>
              </button>
              <button className="p-4 text-left border rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors">
                <div className="text-sm font-medium">View Reports</div>
                <div className="text-xs text-muted-foreground">Analytics</div>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}