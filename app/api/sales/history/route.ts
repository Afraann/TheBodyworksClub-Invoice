// app/api/sales/history/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const range = searchParams.get('range') || 'today';

    const now = new Date();
    let from: Date | undefined;

    if (range === 'today') {
      from = new Date();
      from.setHours(0, 0, 0, 0);
    } else if (range === 'week') {
      from = new Date();
      from.setDate(from.getDate() - 7);
      from.setHours(0, 0, 0, 0);
    } else {
      // Month
      from = new Date();
      from.setDate(from.getDate() - 30);
      from.setHours(0, 0, 0, 0);
    }

    const sales = await prisma.sale.findMany({
      where: {
        saleDate: { gte: from }
      },
      include: {
        items: {
          include: { product: true } // Include product details for names
        }
      },
      orderBy: { saleDate: 'desc' }
    });

    return NextResponse.json({ success: true, data: sales });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch sales' }, { status: 500 });
  }
}