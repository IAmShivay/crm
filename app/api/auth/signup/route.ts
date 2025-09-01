import { NextRequest, NextResponse } from 'next/server';
import { signUp } from '@/lib/mongodb/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password, fullName, workspaceName } = await request.json();

    if (!email || !password || !fullName) {
      return NextResponse.json({ 
        message: 'Email, password, and full name are required' 
      }, { status: 400 });
    }

    // Sign up user using MongoDB
    const result = await signUp({ email, password, fullName, workspaceName });

    if (result.error) {
      return NextResponse.json({ message: result.error }, { status: 400 });
    }

    // Return user data and token
    return NextResponse.json({
      user: result.user,
      token: result.token,
      workspace: result.workspace
    });

  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
