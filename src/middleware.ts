import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Public paths that don't require authentication
const PUBLIC_PATHS = ['/login', '/api/auth'];

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Allow public paths
    if (PUBLIC_PATHS.some(path => pathname.startsWith(path))) {
        return NextResponse.next();
    }

    // Allow static files and Next.js internals
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/favicon') ||
        pathname.includes('.') // Static files
    ) {
        return NextResponse.next();
    }

    // Check for auth session cookie
    const session = request.cookies.get('mission-control-session');

    if (!session || !validateSession(session.value)) {
        // Redirect to login
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

/**
 * Validate the session token
 * In production, this should verify a JWT or check against a database
 */
function validateSession(token: string): boolean {
    try {
        // Decode the token (base64 encoded JSON)
        const decoded = Buffer.from(token, 'base64').toString('utf-8');
        const session = JSON.parse(decoded);

        // Check if session has required fields
        if (!session.authenticated || !session.expiresAt) {
            return false;
        }

        // Check if session is expired
        if (Date.now() > session.expiresAt) {
            return false;
        }

        return true;
    } catch {
        return false;
    }
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
