import { NextRequest, NextResponse } from 'next/server';

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Rate limiting configuration
const RATE_LIMITS = {
  '/api/auth/login': { requests: 5, windowMs: 15 * 60 * 1000 }, // 5 requests per 15 minutes
  '/api/auth/signup': { requests: 3, windowMs: 60 * 60 * 1000 }, // 3 requests per hour
  '/api/leads': { requests: 100, windowMs: 15 * 60 * 1000 }, // 100 requests per 15 minutes
  '/api/roles': { requests: 50, windowMs: 15 * 60 * 1000 }, // 50 requests per 15 minutes
  default: { requests: 200, windowMs: 15 * 60 * 1000 } // 200 requests per 15 minutes
};

function getRateLimit(pathname: string) {
  // Find the most specific rate limit
  for (const [path, limit] of Object.entries(RATE_LIMITS)) {
    if (path !== 'default' && pathname.startsWith(path)) {
      return limit;
    }
  }
  return RATE_LIMITS.default;
}

function checkRateLimit(key: string, limit: { requests: number; windowMs: number }): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetTime) {
    // First request or window expired
    rateLimitStore.set(key, { count: 1, resetTime: now + limit.windowMs });
    return true;
  }

  if (record.count >= limit.requests) {
    return false; // Rate limit exceeded
  }

  record.count++;
  return true;
}

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  return request.ip || 'unknown';
}

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const pathname = request.nextUrl.pathname;

  // Skip middleware for static files and internal Next.js routes
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/static/') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return response;
  }

  // Apply security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // Add HSTS header in production
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self'",
    "frame-ancestors 'none'",
  ].join('; ');
  
  response.headers.set('Content-Security-Policy', csp);

  // Apply rate limiting for API routes
  if (pathname.startsWith('/api/')) {
    const clientIP = getClientIP(request);
    const rateLimit = getRateLimit(pathname);
    const rateLimitKey = `${clientIP}:${pathname}`;

    if (!checkRateLimit(rateLimitKey, rateLimit)) {
      return new NextResponse(
        JSON.stringify({
          message: 'Too many requests. Please try again later.',
          retryAfter: Math.ceil(rateLimit.windowMs / 1000)
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': Math.ceil(rateLimit.windowMs / 1000).toString(),
            'X-RateLimit-Limit': rateLimit.requests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': Math.ceil((Date.now() + rateLimit.windowMs) / 1000).toString(),
          },
        }
      );
    }

    // Add rate limit headers to successful responses
    const record = rateLimitStore.get(rateLimitKey);
    if (record) {
      response.headers.set('X-RateLimit-Limit', rateLimit.requests.toString());
      response.headers.set('X-RateLimit-Remaining', (rateLimit.requests - record.count).toString());
      response.headers.set('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000).toString());
    }
  }

  // Log security-relevant requests
  if (pathname.startsWith('/api/auth/') || pathname.startsWith('/api/webhooks/')) {
    console.log(`[SECURITY] ${request.method} ${pathname} from ${getClientIP(request)}`);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
