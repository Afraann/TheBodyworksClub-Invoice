import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    
    // Default to 'month' if not specified
    const mode = searchParams.get('mode') || 'month'; 
    const dateParam = searchParams.get('date') || new Date().toISOString();
    const targetDate = new Date(dateParam);

    let start = new Date(targetDate);
    let end = new Date(targetDate);

    // --- DATE LOGIC (Same as Sales) ---
    if (mode === 'day') {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } 
    else if (mode === 'week') {
      // Calculate Monday of the week
      const day = start.getDay(); // 0 (Sun) - 6 (Sat)
      const diff = start.getDate() - day + (day === 0 ? -6 : 1);
      
      start.setDate(diff);
      start.setHours(0, 0, 0, 0);

      // End of week (Sunday)
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

    const expenses = await prisma.expense.findMany({
      where: {
        date: {
          gte: start,
          lte: end,
        }
      },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json({ success: true, data: expenses });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, error: 'Failed to fetch expenses' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const branch = await prisma.branch.findFirst({ where: { isActive: true } });
    
    if (!branch) throw new Error('No active branch found');

    const expense = await prisma.expense.create({
      data: {
        branchId: branch.id,
        title: body.title,
        amount: Number(body.amount),
        category: body.category,
        date: new Date(body.date),
      }
    });
    return NextResponse.json({ success: true, data: expense });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Failed to create expense' }, { status: 500 });
  }
}