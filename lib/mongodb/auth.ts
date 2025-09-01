import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import { User, Workspace, WorkspaceMember, Role, type IUser } from './models';
import connectToMongoDB from './connection';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface SignUpData {
  email: string;
  password: string;
  fullName: string;
  workspaceName?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface AuthResult {
  user?: IUser;
  token?: string;
  workspace?: any;
  error?: string;
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

// Verify password
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}

// Generate JWT token
export function generateToken(userId: string): string {
  const secret = process.env.JWT_SECRET || 'fallback-secret-key';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign({ userId }, secret, { expiresIn } as jwt.SignOptions);
}

// Verify JWT token
export function verifyToken(token: string): { userId: string } | null {
  try {
    const secret = process.env.JWT_SECRET || 'fallback-secret-key';
    const decoded = jwt.verify(token, secret) as { userId: string };
    return decoded;
  } catch (error) {
    return null;
  }
}

// Sign up new user
export async function signUp({ email, password, fullName, workspaceName }: SignUpData): Promise<AuthResult> {
  try {
    await connectToMongoDB();

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return { error: 'User with this email already exists' };
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = new User({
      email,
      password: hashedPassword,
      fullName,
      emailConfirmed: true, // Auto-confirm for now
      emailConfirmedAt: new Date()
    });

    await user.save();

    // Create workspace if provided
    let workspace;
    if (workspaceName) {
      const slug = workspaceName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
      
      workspace = new Workspace({
        name: workspaceName,
        slug,
        planId: 'free'
      });
      await workspace.save();

      // Create owner role for the workspace
      const ownerRole = new Role({
        workspaceId: workspace._id,
        name: 'Owner',
        description: 'Full access to workspace',
        permissions: ['*:*'],
        isDefault: false
      });
      await ownerRole.save();

      // Add user as workspace member with owner role
      const member = new WorkspaceMember({
        workspaceId: workspace._id,
        userId: user._id,
        roleId: ownerRole._id,
        status: 'active',
        joinedAt: new Date()
      });
      await member.save();
    }

    // Generate token
    const token = generateToken(user._id);

    return { user, token, workspace };
  } catch (error) {
    console.error('Sign up error:', error);
    return { error: error instanceof Error ? error.message : 'Sign up failed' };
  }
}

// Sign in user
export async function signIn({ email, password }: SignInData): Promise<AuthResult> {
  try {
    await connectToMongoDB();

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return { error: 'Invalid email or password' };
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password);
    if (!isValidPassword) {
      return { error: 'Invalid email or password' };
    }

    // Update last sign in
    user.lastSignInAt = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    return { user, token };
  } catch (error) {
    console.error('Sign in error:', error);
    return { error: error instanceof Error ? error.message : 'Sign in failed' };
  }
}

// Verify token from request
export async function verifyAuthToken(request: NextRequest): Promise<{ user: IUser } | null> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (!decoded) {
      return null;
    }

    await connectToMongoDB();
    const user = await User.findById(decoded.userId);
    if (!user) {
      return null;
    }

    return { user };
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

// Sign out (client-side token removal)
export function signOut(): void {
  // In a real implementation, you might want to maintain a blacklist of tokens
  // For now, we rely on client-side token removal
  console.log('User signed out');
}
