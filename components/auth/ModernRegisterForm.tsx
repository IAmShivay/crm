'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useAppDispatch } from '@/lib/hooks';
import { loginSuccess } from '@/lib/slices/authSlice';
import { setCurrentWorkspace } from '@/lib/slices/workspaceSlice';
import { toast } from 'sonner';
import { 
  Briefcase, 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  User, 
  Building, 
  ArrowRight, 
  Shield, 
  CheckCircle,
  Zap,
  Globe
} from 'lucide-react';
import Link from 'next/link';

interface RegisterFormData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  workspaceName: string;
  agreeToTerms: boolean;
}

export function ModernRegisterForm() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterFormData>();

  const password = watch('password');

  const onSubmit = async (data: RegisterFormData) => {
    if (data.password !== data.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (!data.agreeToTerms) {
      toast.error('Please agree to the terms and conditions');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          fullName: data.fullName,
          workspaceName: data.workspaceName,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.message || 'Registration failed');
        return;
      }

      // Store auth data
      localStorage.setItem('auth_token', result.token);
      localStorage.setItem('user_data', JSON.stringify(result.user));
      if (result.workspace) {
        localStorage.setItem('current_workspace', JSON.stringify(result.workspace));
      }

      // Update Redux state
      dispatch(loginSuccess({
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.fullName || result.user.email,
          role: 'user',
          workspaceId: result.workspace?.id || '',
          permissions: [],
        },
        token: result.token,
      }));

      if (result.workspace) {
        dispatch(setCurrentWorkspace({
          id: result.workspace.id,
          name: result.workspace.name,
          plan: result.workspace.planId,
          memberCount: 1,
          createdAt: result.workspace.createdAt,
        }));
      }

      toast.success('Account created successfully!');
      router.push('/dashboard');
    } catch (error: any) {
      toast.error('Registration failed');
    } finally {
      setLoading(false);
    }
  };

  // Password strength indicator
  const getPasswordStrength = (password: string) => {
    if (!password) return { strength: 0, label: '', color: '' };
    
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
    const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'];
    
    return {
      strength,
      label: labels[strength - 1] || '',
      color: colors[strength - 1] || 'bg-gray-300'
    };
  };

  const passwordStrength = getPasswordStrength(password || '');

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-green-600 via-emerald-700 to-teal-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                <Briefcase className="h-8 w-8" />
              </div>
              <span className="text-3xl font-bold">CRM Pro</span>
            </div>
            <h1 className="text-4xl font-bold mb-4 leading-tight">
              Start your CRM journey today
            </h1>
            <p className="text-xl text-green-100 mb-8">
              Join thousands of businesses that trust CRM Pro to manage their customer relationships and drive growth.
            </p>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Zap className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold">Quick Setup</h3>
                <p className="text-green-100 text-sm">Get started in under 5 minutes</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold">Secure & Reliable</h3>
                <p className="text-green-100 text-sm">Your data is protected with enterprise security</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Globe className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold">Global Access</h3>
                <p className="text-green-100 text-sm">Access your CRM from anywhere</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>
      </div>

      {/* Right Side - Register Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900 py-12">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="p-2 bg-green-600 rounded-lg">
                <Briefcase className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">CRM Pro</span>
            </div>
          </div>

          <Card className="shadow-2xl border-0 bg-white dark:bg-gray-800">
            <CardHeader className="space-y-1 text-center pb-6">
              <CardTitle className="text-3xl font-bold text-gray-900 dark:text-white">
                Create your account
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Start managing your business relationships today
              </CardDescription>
            </CardHeader>
            
            <CardContent className="px-6 pb-6">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Name and Email Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Full Name
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                      <Input
                        id="fullName"
                        type="text"
                        placeholder="Enter your full name"
                        className="pl-11 h-12 border-gray-300 dark:border-gray-600 focus:border-green-500 focus:ring-green-500 rounded-lg"
                        {...register('fullName', {
                          required: 'Full name is required',
                          minLength: {
                            value: 2,
                            message: 'Name must be at least 2 characters'
                          }
                        })}
                      />
                    </div>
                    {errors.fullName && (
                      <p className="text-sm text-red-600">{errors.fullName.message}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Email Address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email address"
                        className="pl-11 h-12 border-gray-300 dark:border-gray-600 focus:border-green-500 focus:ring-green-500 rounded-lg"
                        {...register('email', {
                          required: 'Email is required',
                          pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: 'Invalid email address'
                          }
                        })}
                      />
                    </div>
                    {errors.email && (
                      <p className="text-sm text-red-600">{errors.email.message}</p>
                    )}
                  </div>
                </div>

                {/* Workspace Name */}
                <div className="space-y-2">
                  <Label htmlFor="workspaceName" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Workspace Name
                  </Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <Input
                      id="workspaceName"
                      type="text"
                      placeholder="Enter your company or workspace name"
                      className="pl-11 h-12 border-gray-300 dark:border-gray-600 focus:border-green-500 focus:ring-green-500 rounded-lg"
                      {...register('workspaceName', {
                        required: 'Workspace name is required',
                        minLength: {
                          value: 2,
                          message: 'Workspace name must be at least 2 characters'
                        }
                      })}
                    />
                  </div>
                  {errors.workspaceName && (
                    <p className="text-sm text-red-600">{errors.workspaceName.message}</p>
                  )}
                </div>

                {/* Password Fields Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Password */}
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Create a strong password"
                        className="pl-11 pr-12 h-12 border-gray-300 dark:border-gray-600 focus:border-green-500 focus:ring-green-500 rounded-lg"
                        {...register('password', {
                          required: 'Password is required',
                          minLength: {
                            value: 8,
                            message: 'Password must be at least 8 characters'
                          }
                        })}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5 text-gray-400" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400" />
                        )}
                      </Button>
                    </div>
                    {errors.password && (
                      <p className="text-sm text-red-600">{errors.password.message}</p>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Confirm Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Confirm your password"
                        className="pl-11 pr-12 h-12 border-gray-300 dark:border-gray-600 focus:border-green-500 focus:ring-green-500 rounded-lg"
                        {...register('confirmPassword', {
                          required: 'Please confirm your password',
                          validate: value => value === password || 'Passwords do not match'
                        })}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-5 w-5 text-gray-400" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400" />
                        )}
                      </Button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-sm text-red-600">{errors.confirmPassword.message}</p>
                    )}
                  </div>
                </div>

                {/* Password Strength Indicator */}
                {password && (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                          style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-600">{passwordStrength.label}</span>
                    </div>
                  </div>
                )}

                {/* Terms and Conditions */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="agreeToTerms"
                    {...register('agreeToTerms', { required: true })}
                  />
                  <Label htmlFor="agreeToTerms" className="text-sm text-gray-600 dark:text-gray-400">
                    I agree to the{' '}
                    <Link href="/terms" className="text-green-600 hover:text-green-700">
                      Terms of Service
                    </Link>
                    {' '}and{' '}
                    <Link href="/privacy" className="text-green-600 hover:text-green-700">
                      Privacy Policy
                    </Link>
                  </Label>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl" 
                  disabled={loading || passwordStrength.strength < 3}
                >
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Creating account...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <span>Create Account</span>
                      <ArrowRight className="h-5 w-5" />
                    </div>
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Already have an account?{' '}
                  <Link href="/login">
                    <Button variant="link" className="p-0 h-auto text-green-600 hover:text-green-700 font-medium">
                      Sign in
                    </Button>
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
