import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  // Simple fetch all for now, ordered by date
  const expenses = await prisma.expense.findMany({
    orderBy: { date: 'desc' },
    take: 100
  });
  return NextResponse.json({ success: true, data: expenses });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const branch = await prisma.branch.findFirst({ where: { isActive: true } });
    
    const expense = await prisma.expense.create({
      data: {
        branchId: branch!.id,
        title: body.title,
        amount: Number(body.amount),
        category: body.category,
        date: new Date(body.date),
      }
    });
    return NextResponse.json({ success: true, data: expense });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
  }
}