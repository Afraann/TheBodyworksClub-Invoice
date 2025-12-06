// app/api/plans/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const plans = await prisma.plan.findMany({
      where: { isActive: true },
      orderBy: {
        baseAmount: 'asc',
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        plans: plans.map((p) => ({
          id: p.id,
          code: p.code,
          name: p.name,
          durationDays: p.durationDays,
          baseAmount: Number(p.baseAmount),
          isTaxable: p.isTaxable,
          gstRate: Number(p.gstRate),
        })),
      },
    });
  } catch (err: any) {
    console.error('GET /api/plans error', err);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: err?.message || 'Something went wrong',
        },
      },
      { status: 500 },
    );
  }
}
