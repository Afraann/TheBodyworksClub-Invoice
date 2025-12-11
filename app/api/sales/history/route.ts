// app/api/sales/history/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    
    // mode: 'day' | 'week' | 'month'
    const mode = searchParams.get('mode') || 'day';
    
    // date: ISO string or YYYY-MM-DD representing the selected period
    const dateParam = searchParams.get('date') || new Date().toISOString();

    const targetDate = new Date(dateParam);
    
    // Validate date
    if (isNaN(targetDate.getTime())) {
       return NextResponse.json({ success: false, error: 'Invalid date' }, { status: 400 });
    }

    let start = new Date(targetDate);
    let end = new Date(targetDate);

    // --- CALCULATE DATE RANGES ---
    
    if (mode === 'day') {
      // Start of day (00:00:00) to End of day (23:59:59)
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } 
    else if (mode === 'week') {
      // Logic: Week starts on Monday
      const day = start.getDay(); // 0 (Sun) - 6 (Sat)
      
      // Calculate difference to get to previous Monday (if Sun(0), go back 6 days)
      const diff = start.getDate() - day + (day === 0 ? -6 : 1);
      
      start.setDate(diff);
      start.setHours(0, 0, 0, 0);

      // End of week (Sunday)
      end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
    } 
    else if (mode === 'month') {
      // Start of month (1st)
      start.setDate(1);
      start.setHours(0, 0, 0, 0);

      // End of month (Last day)
      end = new Date(start);
      end.setMonth(start.getMonth() + 1);
      end.setDate(0); 
      end.setHours(23, 59, 59, 999);
    }

    // --- FETCH DATA ---
    const sales = await prisma.sale.findMany({
      where: {
        saleDate: {
          gte: start,
          lte: end,
        },
      },
      include: {
        items: {
          include: { product: true } // Include product names
        }
      },
      orderBy: { saleDate: 'desc' }
    });

    return NextResponse.json({ success: true, data: sales });
  } catch (error) {
    console.error('Sales history error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch sales' }, { status: 500 });
  }
}