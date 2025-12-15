import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(req: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  await prisma.staff.update({ where: { id }, data: { isActive: false } });
  return NextResponse.json({ success: true });
}