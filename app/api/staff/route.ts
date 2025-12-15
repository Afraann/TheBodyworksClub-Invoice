import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function GET() {
  const staff = await prisma.staff.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } });
  return NextResponse.json({ success: true, data: staff });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const branch = await prisma.branch.findFirst({ where: { isActive: true } });
    
    const pinHash = await bcrypt.hash(body.pin, 10);

    const staff = await prisma.staff.create({
      data: {
        branchId: branch!.id,
        name: body.name,
        pinHash,
      }
    });
    return NextResponse.json({ success: true, data: staff });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
  }
}