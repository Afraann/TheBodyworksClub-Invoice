import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    
    const mode = searchParams.get('mode') || 'day';
    const dateParam = searchParams.get('date') || new Date().toISOString();
    const staffId = searchParams.get('staffId'); // <--- NEW PARAMETER

    const targetDate = new Date(dateParam);
    if (isNaN(targetDate.getTime())) {
       return NextResponse.json({ success: false, error: 'Invalid date' }, { status: 400 });
    }

    let start = new Date(targetDate);
    let end = new Date(targetDate);

    // --- DATE LOGIC ---
    if (mode === 'day') {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } 
    else if (mode === 'week') {
      const day = start.getDay(); 
      const diff = start.getDate() - day + (day === 0 ? -6 : 1);
      start.setDate(diff);
      start.setHours(0, 0, 0, 0);
      end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
    } 
    else if (mode === 'month') {
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end = new Date(start);
      end.setMonth(start.getMonth() + 1);
      end.setDate(0); 
      end.setHours(23, 59, 59, 999);
    }

    // --- QUERY ---
    const whereClause: any = {
      saleDate: {
        gte: start,
        lte: end,
      },
    };

    // Filter by Staff if provided
    if (staffId && staffId !== 'all') {
      whereClause.staffId = staffId;
    }

    const sales = await prisma.sale.findMany({
      where: whereClause,
      include: {
        items: { include: { product: true } },
        staff: true // Include staff details
      },
      orderBy: { saleDate: 'desc' }
    });

    return NextResponse.json({ success: true, data: sales });
  } catch (error) {
    console.error('Sales history error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch sales' }, { status: 500 });
  }
}