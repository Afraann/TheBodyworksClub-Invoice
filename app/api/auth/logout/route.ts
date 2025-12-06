// app/api/auth/logout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { deleteSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const sessionId = req.cookies.get('sessionId')?.value;

    if (sessionId) {
      await deleteSession(sessionId);
    }

    const res = NextResponse.json({
      success: true,
      data: {
        message: 'Logged out successfully',
      },
    });

    // Clear cookie
    res.cookies.set('sessionId', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: new Date(0),
      path: '/',
    });

    return res;
  } catch (err: any) {
    console.error('Logout error', err);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: err?.message || 'Something went wrong',
          details: String(err),
        },
      },
      { status: 500 },
    );
  }
}
