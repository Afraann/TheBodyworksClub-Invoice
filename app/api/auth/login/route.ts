import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { createSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const pin = (body?.pin ?? '').toString().trim();

    if (!pin) return NextResponse.json({ success: false, error: { message: 'PIN is required' } }, { status: 400 });

    const setting = await prisma.setting.findFirst({ include: { branch: true } });
    if (!setting) return NextResponse.json({ success: false, error: { message: 'System not configured.' } }, { status: 500 });

    let role = null;
    let staffId = undefined;

    // 1. Check Admin PIN
    const isAdmin = await bcrypt.compare(pin, setting.pinHash);
    if (isAdmin) {
      role = 'ADMIN';
    } 
    else {
      // 2. Check ALL Active Staff PINs
      const staffMembers = await prisma.staff.findMany({ where: { isActive: true } });
      
      for (const staff of staffMembers) {
        const isMatch = await bcrypt.compare(pin, staff.pinHash);
        if (isMatch) {
          role = 'STAFF';
          staffId = staff.id;
          break; // Found the staff
        }
      }
    }

    if (!role) {
      return NextResponse.json({ success: false, error: { message: 'Invalid PIN' } }, { status: 401 });
    }

    // Create Session
    const forwardedFor = req.headers.get('x-forwarded-for');
    const ip = forwardedFor ? forwardedFor.split(',')[0]?.trim() : undefined;
    const ua = req.headers.get('user-agent') ?? undefined;

    const { sessionId, expiresAt } = await createSession(setting.branchId, role, staffId, ip, ua);

    const res = NextResponse.json({ success: true, data: { role } });
    
    res.cookies.set('sessionId', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: expiresAt,
      path: '/',
    });

    return res;
  } catch (err: any) {
    return NextResponse.json({ success: false, error: { message: err.message } }, { status: 500 });
  }
}