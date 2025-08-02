'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppSelector } from '@/lib/hooks';
import { 
  Check, 
  X, 
  Crown, 
  Users, 
  Database, 
  Zap, 
  Shield,
  CreditCard,
  Calendar,
  TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    interval: 'month',
    description: 'Perfect for getting started',
    features: [
      { name: 'Up to 100 leads', included: true },
      { name: '2 team members', included: true },
      { name: 'Basic analytics', included: true },
      { name: 'Email support', included: true },
      { name: 'Advanced reporting', included: false },
      { name: 'API access', included: false },
      { name: 'Custom integrations', included: false },
      { name: 'Priority support', included: false },
    ],
    limits: {
      leads: 100,
      users: 2,
      storage: '1 GB',
      apiCalls: 1000,
    },
    popular: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 29,
    interval: 'month',
    description: 'Best for growing teams',
    features: [
      { name: 'Up to 1,000 leads', included: true },
      { name: '10 team members', included: true },
      { name: 'Advanced analytics', included: true },
      { name: 'Email & chat support', included: true },
      { name: 'Advanced reporting', included: true },
      { name: 'API access', included: true },
      { name: 'Custom integrations', included: false },
      { name: 'Priority support', included: false },
    ],
    limits: {
      leads: 1000,
      users: 10,
      storage: '10 GB',
      apiCalls: 10000,
    },
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 99,
    interval: 'month',
    description: 'For large organizations',
    features: [
      { name: 'Unlimited leads', included: true },
      { name: 'Unlimited team members', included: true },
      { name: 'Advanced analytics', included: true },
      { name: 'Priority support', included: true },
      { name: 'Advanced reporting', included: true },
      { name: 'API access', included: true },
      { name: 'Custom integrations', included: true },
      { name: 'Dedicated account manager', included: true },
    ],
    limits: {
      leads: 'Unlimited',
      users: 'Unlimited',
      storage: '100 GB',
      apiCalls: 100000,
    },
    popular: false,
  },
];

// Mock current usage data
const currentUsage = {
  leads: 45,
  users: 3,
  storage: 2.5, // GB
  apiCalls: 1250,
};

export default function PlansPage() {
  const { currentWorkspace } = useAppSelector((state) => state.workspace);
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month');
  const currentPlan = plans.find(plan => plan.id === (currentWorkspace?.plan || 'free'));

  const handleUpgrade = (planId: string) => {
    toast.success(`Upgrading to ${plans.find(p => p.id === planId)?.name} plan...`);
    // TODO: Implement actual upgrade logic
  };

  const getUsagePercentage = (current: number, limit: number | string) => {
    if (typeof limit === 'string') return 0;
    return Math.min((current / limit) * 100, 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Plans & Billing</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your subscription and view usage statistics
        </p>
      </div>

      <Tabs defaultValue="current" className="space-y-4">
        <TabsList>
          <TabsTrigger value="current">Current Plan</TabsTrigger>
          <TabsTrigger value="plans">Available Plans</TabsTrigger>
          <TabsTrigger value="usage">Usage & Limits</TabsTrigger>
          <TabsTrigger value="billing">Billing History</TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    {currentPlan?.id === 'enterprise' && <Crown className="h-5 w-5 text-yellow-500" />}
                    <span>Current Plan: {currentPlan?.name}</span>
                  </CardTitle>
                  <CardDescription>{currentPlan?.description}</CardDescription>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">
                    ${currentPlan?.price}
                    <span className="text-sm font-normal text-gray-500">/{currentPlan?.interval}</span>
                  </p>
                  {currentPlan?.popular && (
                    <Badge className="bg-blue-100 text-blue-800">Most Popular</Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">Team Members</span>
                  </div>
                  <p className="text-2xl font-bold">{currentUsage.users}</p>
                  <p className="text-xs text-gray-500">of {currentPlan?.limits.users} allowed</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Database className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">Leads</span>
                  </div>
                  <p className="text-2xl font-bold">{currentUsage.leads}</p>
                  <p className="text-xs text-gray-500">of {currentPlan?.limits.leads} allowed</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Shield className="h-4 w-4 text-purple-500" />
                    <span className="text-sm font-medium">Storage</span>
                  </div>
                  <p className="text-2xl font-bold">{currentUsage.storage} GB</p>
                  <p className="text-xs text-gray-500">of {currentPlan?.limits.storage} allowed</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Zap className="h-4 w-4 text-orange-500" />
                    <span className="text-sm font-medium">API Calls</span>
                  </div>
                  <p className="text-2xl font-bold">{currentUsage.apiCalls.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">of {currentPlan?.limits.apiCalls.toLocaleString()} allowed</p>
                </div>
              </div>

              {currentPlan?.id !== 'enterprise' && (
                <div className="mt-6">
                  <Button onClick={() => handleUpgrade('pro')}>
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Upgrade Plan
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plans" className="space-y-4">
          <div className="flex items-center justify-center space-x-4 mb-6">
            <span className={billingInterval === 'month' ? 'font-medium' : 'text-gray-500'}>Monthly</span>
            <button
              onClick={() => setBillingInterval(billingInterval === 'month' ? 'year' : 'month')}
              className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  billingInterval === 'year' ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={billingInterval === 'year' ? 'font-medium' : 'text-gray-500'}>
              Yearly <Badge variant="secondary" className="ml-1">Save 20%</Badge>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <Card key={plan.id} className={`relative ${plan.popular ? 'ring-2 ring-blue-500' : ''}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-blue-500 text-white">Most Popular</Badge>
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2">
                      {plan.id === 'enterprise' && <Crown className="h-5 w-5 text-yellow-500" />}
                      <span>{plan.name}</span>
                    </CardTitle>
                    {currentPlan?.id === plan.id && (
                      <Badge variant="secondary">Current</Badge>
                    )}
                  </div>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-3xl font-bold">
                      ${billingInterval === 'year' ? Math.round(plan.price * 12 * 0.8) : plan.price}
                    </span>
                    <span className="text-gray-500">/{billingInterval}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center space-x-2">
                        {feature.included ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <X className="h-4 w-4 text-gray-400" />
                        )}
                        <span className={feature.included ? '' : 'text-gray-400'}>
                          {feature.name}
                        </span>
                      </li>
                    ))}
                  </ul>
                  
                  {currentPlan?.id === plan.id ? (
                    <Button variant="outline" className="w-full" disabled>
                      Current Plan
                    </Button>
                  ) : (
                    <Button 
                      className="w-full" 
                      variant={plan.popular ? 'default' : 'outline'}
                      onClick={() => handleUpgrade(plan.id)}
                    >
                      {currentPlan && plans.findIndex(p => p.id === currentPlan.id) < plans.findIndex(p => p.id === plan.id)
                        ? 'Upgrade' 
                        : 'Downgrade'
                      }
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="usage" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Usage Overview</CardTitle>
                <CardDescription>Current usage across all plan limits</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Leads</span>
                    <span>{currentUsage.leads} / {currentPlan?.limits.leads}</span>
                  </div>
                  <Progress 
                    value={getUsagePercentage(currentUsage.leads, currentPlan?.limits.leads || 0)} 
                    className="h-2"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Team Members</span>
                    <span>{currentUsage.users} / {currentPlan?.limits.users}</span>
                  </div>
                  <Progress 
                    value={getUsagePercentage(currentUsage.users, currentPlan?.limits.users || 0)} 
                    className="h-2"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>API Calls</span>
                    <span>{currentUsage.apiCalls.toLocaleString()} / {currentPlan?.limits.apiCalls.toLocaleString()}</span>
                  </div>
                  <Progress 
                    value={getUsagePercentage(currentUsage.apiCalls, currentPlan?.limits.apiCalls || 0)} 
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Upgrade Recommendations</CardTitle>
                <CardDescription>Based on your current usage patterns</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {getUsagePercentage(currentUsage.leads, currentPlan?.limits.leads || 0) > 80 && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm font-medium text-yellow-800">Lead Limit Warning</p>
                      <p className="text-xs text-yellow-600">
                        You're approaching your lead limit. Consider upgrading to avoid interruptions.
                      </p>
                    </div>
                  )}
                  
                  {currentPlan?.id === 'free' && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm font-medium text-blue-800">Unlock More Features</p>
                      <p className="text-xs text-blue-600">
                        Upgrade to Pro for advanced analytics and API access.
                      </p>
                      <Button size="sm" className="mt-2" onClick={() => handleUpgrade('pro')}>
                        Upgrade to Pro
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="billing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CreditCard className="h-5 w-5" />
                <span>Billing History</span>
              </CardTitle>
              <CardDescription>View your past invoices and payments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Mock billing history */}
                {[
                  { date: '2024-03-01', amount: 29, status: 'paid', plan: 'Pro' },
                  { date: '2024-02-01', amount: 29, status: 'paid', plan: 'Pro' },
                  { date: '2024-01-01', amount: 0, status: 'paid', plan: 'Free' },
                ].map((invoice, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{invoice.plan} Plan</p>
                      <p className="text-sm text-gray-500">
                        {new Date(invoice.date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${invoice.amount}</p>
                      <Badge 
                        className={invoice.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                      >
                        {invoice.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
