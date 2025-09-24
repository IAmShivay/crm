'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Users,
  DollarSign,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  ExternalLink,
} from 'lucide-react'

// Mock analytics data
const analyticsData = {
  revenue: {
    current: 45280,
    previous: 38950,
    change: 16.3,
    trend: 'up',
  },
  leads: {
    current: 1247,
    previous: 1089,
    change: 14.5,
    trend: 'up',
  },
  conversion: {
    current: 23.8,
    previous: 21.2,
    change: 12.3,
    trend: 'up',
  },
  customers: {
    current: 892,
    previous: 945,
    change: -5.6,
    trend: 'down',
  },
}

const quickStats = [
  {
    label: 'Active Deals',
    value: '47',
    icon: Target,
    color: 'text-blue-600',
  },
  {
    label: 'This Month',
    value: '$12.4k',
    icon: DollarSign,
    color: 'text-green-600',
  },
  {
    label: 'New Leads',
    value: '156',
    icon: Users,
    color: 'text-purple-600',
  },
]

export function AnalyticsOverview() {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num)
  }

  const formatPercentage = (num: number) => {
    return `${num.toFixed(1)}%`
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold">
          Analytics Overview
        </CardTitle>
        <Button variant="outline" size="sm" className="text-xs">
          <BarChart3 className="mr-1 h-4 w-4" />
          View Details
          <ExternalLink className="ml-1 h-3 w-3" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Revenue */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Revenue
              </span>
              <div
                className={`flex items-center space-x-1 text-xs ${
                  analyticsData.revenue.trend === 'up'
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}
              >
                {analyticsData.revenue.trend === 'up' ? (
                  <ArrowUpRight className="h-3 w-3" />
                ) : (
                  <ArrowDownRight className="h-3 w-3" />
                )}
                <span>{formatPercentage(analyticsData.revenue.change)}</span>
              </div>
            </div>
            <div className="text-2xl font-bold">
              {formatCurrency(analyticsData.revenue.current)}
            </div>
            <div className="text-xs text-gray-500">
              vs {formatCurrency(analyticsData.revenue.previous)} last month
            </div>
          </div>

          {/* Leads */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Total Leads
              </span>
              <div
                className={`flex items-center space-x-1 text-xs ${
                  analyticsData.leads.trend === 'up'
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}
              >
                {analyticsData.leads.trend === 'up' ? (
                  <ArrowUpRight className="h-3 w-3" />
                ) : (
                  <ArrowDownRight className="h-3 w-3" />
                )}
                <span>{formatPercentage(analyticsData.leads.change)}</span>
              </div>
            </div>
            <div className="text-2xl font-bold">
              {formatNumber(analyticsData.leads.current)}
            </div>
            <div className="text-xs text-gray-500">
              vs {formatNumber(analyticsData.leads.previous)} last month
            </div>
          </div>

          {/* Conversion Rate */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Conversion
              </span>
              <div
                className={`flex items-center space-x-1 text-xs ${
                  analyticsData.conversion.trend === 'up'
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}
              >
                {analyticsData.conversion.trend === 'up' ? (
                  <ArrowUpRight className="h-3 w-3" />
                ) : (
                  <ArrowDownRight className="h-3 w-3" />
                )}
                <span>{formatPercentage(analyticsData.conversion.change)}</span>
              </div>
            </div>
            <div className="text-2xl font-bold">
              {formatPercentage(analyticsData.conversion.current)}
            </div>
            <div className="text-xs text-gray-500">
              vs {formatPercentage(analyticsData.conversion.previous)} last
              month
            </div>
          </div>

          {/* Customers */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Customers
              </span>
              <div
                className={`flex items-center space-x-1 text-xs ${
                  analyticsData.customers.trend === 'up'
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}
              >
                {analyticsData.customers.trend === 'up' ? (
                  <ArrowUpRight className="h-3 w-3" />
                ) : (
                  <ArrowDownRight className="h-3 w-3" />
                )}
                <span>
                  {formatPercentage(Math.abs(analyticsData.customers.change))}
                </span>
              </div>
            </div>
            <div className="text-2xl font-bold">
              {formatNumber(analyticsData.customers.current)}
            </div>
            <div className="text-xs text-gray-500">
              vs {formatNumber(analyticsData.customers.previous)} last month
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="border-t pt-4">
          <h4 className="mb-3 text-sm font-medium text-gray-900 dark:text-white">
            Quick Stats
          </h4>
          <div className="grid grid-cols-3 gap-4">
            {quickStats.map((stat, index) => (
              <div key={index} className="text-center">
                <div
                  className={`mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800`}
                >
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
                <div className="text-lg font-semibold">{stat.value}</div>
                <div className="text-xs text-gray-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Indicators */}
        <div className="border-t pt-4">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
              Performance
            </h4>
            <Badge variant="secondary" className="text-xs">
              This Month
            </Badge>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Sales Target
              </span>
              <div className="flex items-center space-x-2">
                <div className="h-2 w-20 rounded-full bg-gray-200">
                  <div
                    className="h-2 rounded-full bg-green-600"
                    style={{ width: '78%' }}
                  ></div>
                </div>
                <span className="text-sm font-medium">78%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Lead Quality
              </span>
              <div className="flex items-center space-x-2">
                <div className="h-2 w-20 rounded-full bg-gray-200">
                  <div
                    className="h-2 rounded-full bg-blue-600"
                    style={{ width: '85%' }}
                  ></div>
                </div>
                <span className="text-sm font-medium">85%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Customer Satisfaction
              </span>
              <div className="flex items-center space-x-2">
                <div className="h-2 w-20 rounded-full bg-gray-200">
                  <div
                    className="h-2 rounded-full bg-purple-600"
                    style={{ width: '92%' }}
                  ></div>
                </div>
                <span className="text-sm font-medium">92%</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
