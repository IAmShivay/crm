'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, Users, DollarSign, Target } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatsCardSkeleton } from '@/components/ui/skeleton'
import { useAppSelector } from '@/lib/hooks'

interface StatData {
  title: string
  value: string
  change: string
  trend: 'up' | 'down'
  icon: any
  color: string
}

const defaultStats: StatData[] = [
  {
    title: 'Total Leads',
    value: '0',
    change: '+0%',
    trend: 'up',
    icon: Users,
    color: 'text-blue-600',
  },
  {
    title: 'Conversion Rate',
    value: '0%',
    change: '+0%',
    trend: 'up',
    icon: Target,
    color: 'text-green-600',
  },
  {
    title: 'Revenue',
    value: '$0',
    change: '+0%',
    trend: 'up',
    icon: DollarSign,
    color: 'text-yellow-600',
  },
  {
    title: 'Growth',
    value: '0%',
    change: '+0%',
    trend: 'up',
    icon: TrendingUp,
    color: 'text-purple-600',
  },
]

export function StatsCards() {
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<StatData[]>(defaultStats)
  const { currentWorkspace } = useAppSelector(state => state.workspace)

  useEffect(() => {
    const fetchStats = async () => {
      if (!currentWorkspace?.id) {
        setIsLoading(false)
        return
      }

      try {
        // TODO: Replace with actual API calls when endpoints are ready
        // For now, show default values to avoid static data
        setStats(defaultStats)
      } catch (error) {
        console.error('Error fetching stats:', error)
        setStats(defaultStats)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [currentWorkspace?.id])

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatsCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
      {stats.map(stat => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">{stat.change}</span> from last
              month
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
