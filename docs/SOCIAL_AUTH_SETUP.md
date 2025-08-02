# Social Authentication Setup Guide

This guide explains how to configure Google, Facebook, and GitHub authentication for your CRM application using Supabase Auth.

## Prerequisites

1. Supabase project set up
2. Domain configured for your application
3. Social provider accounts (Google, Facebook, GitHub)

## Supabase Configuration

### 1. Enable Auth Providers in Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** > **Providers**
3. Enable the following providers:
   - Google
   - Facebook  
   - GitHub

### 2. Configure Redirect URLs

In your Supabase Auth settings, add these redirect URLs:

**For Development:**
```
http://localhost:3000/auth/callback
```

**For Production:**
```
https://yourdomain.com/auth/callback
```

## Provider Setup

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to **Credentials** > **Create Credentials** > **OAuth 2.0 Client ID**
5. Configure OAuth consent screen
6. Set application type to **Web application**
7. Add authorized redirect URIs:
   ```
   https://your-supabase-project.supabase.co/auth/v1/callback
   ```
8. Copy **Client ID** and **Client Secret**

**Supabase Configuration:**
- Client ID: `your-google-client-id`
- Client Secret: `your-google-client-secret`

### Facebook OAuth Setup

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app or select existing one
3. Add **Facebook Login** product
4. Go to **Facebook Login** > **Settings**
5. Add Valid OAuth Redirect URIs:
   ```
   https://your-supabase-project.supabase.co/auth/v1/callback
   ```
6. Copy **App ID** and **App Secret** from **Settings** > **Basic**

**Supabase Configuration:**
- Client ID: `your-facebook-app-id`
- Client Secret: `your-facebook-app-secret`

### GitHub OAuth Setup

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **New OAuth App**
3. Fill in application details:
   - Application name: `Your CRM App`
   - Homepage URL: `https://yourdomain.com`
   - Authorization callback URL: `https://your-supabase-project.supabase.co/auth/v1/callback`
4. Copy **Client ID** and **Client Secret**

**Supabase Configuration:**
- Client ID: `your-github-client-id`
- Client Secret: `your-github-client-secret`

## Environment Variables

Add these to your `.env.local` file:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Optional: Custom redirect URLs
NEXT_PUBLIC_AUTH_REDIRECT_URL=http://localhost:3000/auth/callback
```

## Testing Social Authentication

### 1. Test Login Flow

1. Start your development server: `npm run dev`
2. Navigate to `/login`
3. Click on any social provider button
4. Complete OAuth flow
5. Should redirect to `/auth/setup` for new users or `/dashboard` for existing users

### 2. Test Profile Setup

For new social auth users:
1. Complete social login
2. Should redirect to `/auth/setup`
3. Fill in profile information
4. Should redirect to `/dashboard`

### 3. Test Workspace Integration

1. Login with social auth
2. Create or join workspace
3. Verify user appears in workspace members
4. Test role-based permissions

## Troubleshooting

### Common Issues

**1. Redirect URI Mismatch**
- Ensure redirect URIs match exactly in provider settings
- Check for trailing slashes
- Verify HTTP vs HTTPS

**2. Invalid Client Configuration**
- Double-check Client ID and Secret in Supabase
- Ensure provider is enabled in Supabase Auth settings

**3. CORS Issues**
- Verify domain is added to Supabase allowed origins
- Check browser console for CORS errors

**4. Profile Setup Loop**
- Check if user_profiles trigger is working
- Verify workspace creation function exists

### Debug Steps

1. Check Supabase Auth logs in dashboard
2. Monitor browser network tab during auth flow
3. Check console for JavaScript errors
4. Verify database triggers are functioning

## Security Considerations

### 1. Provider Configuration

- Use HTTPS in production
- Restrict OAuth redirect URIs to your domains only
- Regularly rotate client secrets

### 2. User Data Handling

- Social auth provides limited user data
- Always validate and sanitize user inputs
- Implement proper error handling

### 3. Session Management

- Supabase handles session management automatically
- Sessions are stored securely in httpOnly cookies
- Implement proper logout functionality

## Advanced Configuration

### Custom Scopes

Request additional permissions from providers:

```typescript
// Request additional Google scopes
await signInWithSocial({
  provider: 'google',
  scopes: 'email profile https://www.googleapis.com/auth/calendar.readonly'
});
```

### Custom Redirect Handling

Handle different redirect scenarios:

```typescript
// Redirect to specific page after auth
await signInWithSocial({
  provider: 'google',
  redirectTo: `${window.location.origin}/dashboard/leads`
});
```

### Provider-Specific Metadata

Access provider-specific user data:

```typescript
// In your auth callback
const { data: { user } } = await supabase.auth.getUser();
const providerData = user?.user_metadata;
// Contains provider-specific information
```

## Production Deployment

### 1. Update Redirect URLs

Update all provider configurations with production URLs:
- Replace localhost with your production domain
- Ensure HTTPS is used
- Update Supabase redirect URL settings

### 2. Environment Variables

Set production environment variables:
- Use secure secret management
- Don't commit secrets to version control
- Use different credentials for staging/production

### 3. Monitoring

- Monitor auth success/failure rates
- Set up alerts for auth errors
- Track user registration sources
