'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { signIn } from '@/lib/supabase/auth';
import { SocialAuthButtons } from './SocialAuthButtons';
import { toast } from 'sonner';
import { Briefcase, Eye, EyeOff, ArrowRight, Shield } from 'lucide-react';
import Link from 'next/link';

interface LoginFormData {
  email: string;
  password: string;
}

export function LoginForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>();

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    try {
      const { error } = await signIn(data);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Login successful!');
        router.push('/dashboard');
      }
    } catch (error: any) {
      toast.error('Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                <Briefcase className="h-8 w-8" />
              </div>
              <span className="text-3xl font-bold">CRM Pro</span>
            </div>
            <h1 className="text-4xl font-bold mb-4 leading-tight">
              Manage your business relationships with ease
            </h1>
            <p className="text-xl text-blue-100 mb-8">
              Streamline your sales process, track leads, and grow your business with our powerful CRM platform.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="p-1 bg-white/20 rounded-full">
                <Shield className="h-4 w-4" />
              </div>
              <span className="text-blue-100">Enterprise-grade security</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="p-1 bg-white/20 rounded-full">
                <Briefcase className="h-4 w-4" />
              </div>
              <span className="text-blue-100">Complete lead management</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="p-1 bg-white/20 rounded-full">
                <ArrowRight className="h-4 w-4" />
              </div>
              <span className="text-blue-100">Real-time analytics</span>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Briefcase className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900 dark:text-white">CRM Pro</span>
            </div>
          </div>

          <Card className="shadow-xl border-0 bg-white dark:bg-gray-800">
            <CardHeader className="space-y-1 text-center pb-6">
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                Welcome back
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Sign in to your account to continue
              </CardDescription>
            </CardHeader>
        <CardContent>
          {/* Social Authentication Buttons */}
          <SocialAuthButtons mode="signin" className="mb-6" />

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                {...register('email', { 
                  required: 'Email is required',
                  pattern: {
                    value: /^\S+@\S+$/i,
                    message: 'Please enter a valid email'
                  }
                })}
              />
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  {...register('password', { 
                    required: 'Password is required',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters'
                    }
                  })}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <Link href="/auth/forgot-password">
                <Button variant="link" className="p-0 h-auto text-sm">
                  Forgot password?
                </Button>
              </Link>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Don't have an account?{' '}
              <Button variant="link" className="p-0 h-auto" onClick={() => router.push('/register')}>
                Sign up
              </Button>
            </p>
          </div>

          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              Demo credentials: admin@crmpro.com / password
            </p>
          </div>
        </CardContent>
      </Card>
        </div>
      </div>
    </div>
  );
}