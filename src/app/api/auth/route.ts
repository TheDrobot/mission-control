import { NextRequest, NextResponse } from 'next/server';

// Session duration: 24 hours
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000;

/**
 * Timing-safe string comparison to prevent timing attacks
 */
function timingSafeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) {
        return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
        result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0;
}

/**
 * Generate a secure session token
 */
function generateSessionToken(): string {
    const session = {
        authenticated: true,
        expiresAt: Date.now() + SESSION_DURATION_MS,
        createdAt: Date.now(),
    };

    return Buffer.from(JSON.stringify(session)).toString('base64');
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { passcode } = body;

        // Get the expected passcode from environment variable
        const expectedPasscode = process.env.ACCESS_PASSCODE;

        if (!expectedPasscode) {
            console.error('[Auth] ACCESS_PASSCODE not configured in environment');
            return NextResponse.json(
                { success: false, error: 'Server configuration error' },
                { status: 500 }
            );
        }

        // Validate passcode exists
        if (!passcode || typeof passcode !== 'string') {
            return NextResponse.json(
                { success: false, error: 'Passcode required' },
                { status: 400 }
            );
        }

        // Timing-safe comparison to prevent timing attacks
        const isValid = timingSafeEqual(passcode, expectedPasscode);

        if (!isValid) {
            // Add small delay to prevent brute force
            await new Promise(resolve => setTimeout(resolve, 500));
            return NextResponse.json(
                { success: false, error: 'Invalid passcode' },
                { status: 401 }
            );
        }

        // Generate session token
        const sessionToken = generateSessionToken();

        // Create response with session cookie
        const response = NextResponse.json({ success: true });

        // Set HttpOnly cookie (secure, not accessible via JavaScript)
        response.cookies.set('mission-control-session', sessionToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: SESSION_DURATION_MS / 1000, // 24 hours in seconds
            path: '/',
        });

        return response;

    } catch (error) {
        console.error('[Auth] Error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * Logout endpoint - clear the session cookie
 */
export async function DELETE() {
    const response = NextResponse.json({ success: true });
    response.cookies.delete('mission-control-session');
    return response;
}
