import { NextRequest, NextResponse } from 'next/server';
import { signIn } from '@/lib/mongodb/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password are required' }, { status: 400 });
    }

    // Sign in user using MongoDB
    const result = await signIn({ email, password });

    if (result.error) {
      return NextResponse.json({ message: result.error }, { status: 401 });
    }

    // Return user data and token
    return NextResponse.json({
      user: result.user,
      token: result.token,
      workspace: result.workspace
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}