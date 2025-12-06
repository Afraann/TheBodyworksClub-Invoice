// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { createSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const pin = (body?.pin ?? '').toString().trim();

    if (!pin) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'PIN is required',
          },
        },
        { status: 400 },
      );
    }

    // Single setting row for now
    const setting = await prisma.setting.findFirst({
      include: {
        branch: true,
      },
    });

    if (!setting) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CONFIG_ERROR',
            message: 'System not configured. No settings found.',
          },
        },
        { status: 500 },
      );
    }

    const isValid = await bcrypt.compare(pin, setting.pinHash);

    if (!isValid) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_PIN',
            message: 'PIN is incorrect',
          },
        },
        { status: 401 },
      );
    }

    const forwardedFor = req.headers.get('x-forwarded-for');
    const ip = forwardedFor ? forwardedFor.split(',')[0]?.trim() : undefined;
    const ua = req.headers.get('user-agent') ?? undefined;

    // Create session in DB
    const { sessionId, expiresAt } = await createSession(setting.branchId, ip, ua);

    // Build response and set cookie on it
    const res = NextResponse.json(
      {
        success: true,
        data: {
          sessionId,
          expiresAt,
        },
      },
      { status: 200 },
    );

    res.cookies.set('sessionId', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: expiresAt,
      path: '/',
    });

    return res;
  } catch (err: any) {
    console.error('Login error', err);
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
