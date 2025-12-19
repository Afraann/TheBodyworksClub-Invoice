import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  const sessionId = req.cookies.get('sessionId')?.value;
  if (!sessionId) return NextResponse.json({ role: null }, { status: 401 });

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    select: { role: true }
  });

  return NextResponse.json({ role: session?.role || null });
}