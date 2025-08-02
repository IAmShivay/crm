import { NextRequest } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export async function verifySupabaseToken(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Get the session from Supabase
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error || !session) {
      return null;
    }

    return {
      user: session.user,
      session
    };
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

export async function requireAuth(request: NextRequest) {
  const auth = await verifySupabaseToken(request);

  if (!auth) {
    throw new Error('Authentication required');
  }

  return auth;
}

export function createAuthResponse(message: string, status: number = 401) {
  return new Response(
    JSON.stringify({ error: message }),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}

export function signToken(payload: any) {
  const secret = process.env.JWT_SECRET || 'your-secret-key';
  return jwt.sign(payload, secret, { expiresIn: '24h' });
}

export function verifyJwtToken(token: string) {
  try {
    const secret = process.env.JWT_SECRET || 'your-secret-key';
    return jwt.verify(token, secret);
  } catch (error) {
    return null;
  }
}

// Function for JWT token verification (used by API routes)
export function verifyToken(token: string) {
  return verifyJwtToken(token);
}
