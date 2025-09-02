'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, Users, DollarSign, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatsCardSkeleton } from '@/components/ui/skeleton';

const stats = [
  {
    title: 'Total Leads',
    value: '2,345',
    change: '+12.5%',
    trend: 'up',
    icon: Users,
    color: 'text-blue-600',
  },
  {
    title: 'Conversion Rate',
    value: '23.1%',
    change: '+2.3%',
    trend: 'up',
    icon: Target,
    color: 'text-green-600',
  },
  {
    title: 'Revenue',
    value: '$45,231',
    change: '+8.7%',
    trend: 'up',
    icon: DollarSign,
    color: 'text-yellow-600',
  },
  {
    title: 'Growth',
    value: '12.5%',
    change: '+1.2%',
    trend: 'up',
    icon: TrendingUp,
    color: 'text-purple-600',
  },
];

export function StatsCards() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatsCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">{stat.change}</span> from last month
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}