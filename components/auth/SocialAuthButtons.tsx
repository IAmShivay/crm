'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { signInWithSocial } from '@/lib/supabase/auth';
import { toast } from 'sonner';
import { Github, Mail } from 'lucide-react';

interface SocialAuthButtonsProps {
  mode?: 'signin' | 'signup';
  className?: string;
}

// Custom Google Icon Component
const GoogleIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24">
    <path
      fill="currentColor"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="currentColor"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="currentColor"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="currentColor"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

// Custom Facebook Icon Component
const FacebookIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24">
    <path
      fill="currentColor"
      d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
    />
  </svg>
);

export function SocialAuthButtons({ mode = 'signin', className = '' }: SocialAuthButtonsProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleSocialAuth = async (provider: 'google' | 'facebook' | 'github') => {
    setLoading(provider);
    try {
      const { error } = await signInWithSocial({
        provider,
        redirectTo: `${window.location.origin}/auth/callback`,
      });

      if (error) {
        toast.error(error.message);
      }
      // Note: User will be redirected, so no success message needed here
    } catch (error: any) {
      toast.error(`${provider} authentication failed`);
    } finally {
      setLoading(null);
    }
  };

  const buttonText = mode === 'signup' ? 'Sign up with' : 'Continue with';

  return (
    <div className={`${className}`}>
      {/* Social Icons Row */}
      <div className="flex justify-center space-x-3 mb-6">
        {/* Google */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-12 h-12 p-0 rounded-full"
          onClick={() => handleSocialAuth('google')}
          disabled={loading !== null}
          title="Continue with Google"
        >
          {loading === 'google' ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600" />
          ) : (
            <GoogleIcon className="h-5 w-5" />
          )}
        </Button>

        {/* Facebook */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-12 h-12 p-0 rounded-full"
          onClick={() => handleSocialAuth('facebook')}
          disabled={loading !== null}
          title="Continue with Facebook"
        >
          {loading === 'facebook' ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600" />
          ) : (
            <FacebookIcon className="h-5 w-5 text-blue-600" />
          )}
        </Button>

        {/* GitHub */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-12 h-12 p-0 rounded-full"
          onClick={() => handleSocialAuth('github')}
          disabled={loading !== null}
          title="Continue with GitHub"
        >
          {loading === 'github' ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600" />
          ) : (
            <Github className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-gray-300 dark:border-gray-600" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white dark:bg-gray-800 px-3 text-gray-500 dark:text-gray-400">
            Or continue with email
          </span>
        </div>
      </div>
    </div>
  );
}

// Simplified version for smaller spaces
export function SocialAuthButtonsCompact({ mode = 'signin', className = '' }: SocialAuthButtonsProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleSocialAuth = async (provider: 'google' | 'facebook' | 'github') => {
    setLoading(provider);
    try {
      const { error } = await signInWithSocial({
        provider,
        redirectTo: `${window.location.origin}/auth/callback`,
      });

      if (error) {
        toast.error(error.message);
      }
    } catch (error: any) {
      toast.error(`${provider} authentication failed`);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className={`flex space-x-2 ${className}`}>
      {/* Google */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="flex-1"
        onClick={() => handleSocialAuth('google')}
        disabled={loading !== null}
      >
        {loading === 'google' ? (
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600" />
        ) : (
          <GoogleIcon className="h-3 w-3" />
        )}
      </Button>

      {/* Facebook */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="flex-1"
        onClick={() => handleSocialAuth('facebook')}
        disabled={loading !== null}
      >
        {loading === 'facebook' ? (
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600" />
        ) : (
          <FacebookIcon className="h-3 w-3 text-blue-600" />
        )}
      </Button>

      {/* GitHub */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="flex-1"
        onClick={() => handleSocialAuth('github')}
        disabled={loading !== null}
      >
        {loading === 'github' ? (
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600" />
        ) : (
          <Github className="h-3 w-3" />
        )}
      </Button>
    </div>
  );
}
