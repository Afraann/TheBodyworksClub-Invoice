// app/api/invoices/export/route.ts
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { InvoiceItemType, Prisma } from '@prisma/client';

function toDateRange(range: string | null) {
  const now = new Date();
  if (!range) range = 'month';
  range = range.toLowerCase().trim();

  let from: Date | undefined;

  if (range === 'today') {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    from = start;
  } else if (range === 'week') {
    const start = new Date();
    start.setDate(start.getDate() - 7);
    start.setHours(0, 0, 0, 0);
    from = start;
  } else if (range === 'month') {
    const start = new Date();
    start.setDate(start.getDate() - 30);
    start.setHours(0, 0, 0, 0);
    from = start;
  } else if (range === 'all') {
    from = undefined;
  } else {
    const start = new Date();
    start.setDate(start.getDate() - 30);
    start.setHours(0, 0, 0, 0);
    from = start;
  }

  return { from, to: now };
}

function escapeCsv(value: any): string {
  const s = String(value ?? '');
  if (s.includes('"') || s.includes(',') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = (searchParams.get('search') ?? '').trim();
    const range = searchParams.get('range');

    const { from, to } = toDateRange(range);

    const where: Prisma.InvoiceWhereInput = {};

    if (from && to) {
      where.invoiceDate = {
        gte: from,
        lte: to,
      };
    }

    if (search) {
      where.OR = [
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerPhone: { contains: search, mode: 'insensitive' } },
        { invoiceCode: { contains: search, mode: 'insensitive' } },
      ];
    }

    const invoices = await prisma.invoice.findMany({
      where,
      orderBy: { invoiceDate: 'desc' },
      include: { items: true },
      take: 1000,
    });

    const header = [
      'Invoice Code',
      'Invoice Number',
      'Date',
      'Time',
      'Customer Name',
      'Customer Phone',
      'Main Item',
      'Taxable Subtotal',
      'Total GST',
      'Non-taxable Subtotal',
      'Grand Total',
    ];

    const rows: string[][] = [header];

    for (const inv of invoices) {
      const membershipItem = inv.items.find(
        (i) => i.itemType === InvoiceItemType.MEMBERSHIP,
      );
      const primaryItem = membershipItem ?? inv.items[0];

      // 1. Force Indian Timezone
      // 2. Prepend a space (' ') to Date so Excel treats it as Text, not a narrowed Date
      const dateStr = ' ' + inv.invoiceDate.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        timeZone: 'Asia/Kolkata',
      });
      
      const timeStr = inv.invoiceDate.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'Asia/Kolkata',
      });

      rows.push([
        inv.invoiceCode,
        String(inv.invoiceNumber),
        dateStr,
        timeStr,
        inv.customerName,
        inv.customerPhone,
        primaryItem?.description ?? '',
        Number(inv.taxableSubtotal).toFixed(2),
        Number(inv.totalGst).toFixed(2),
        Number(inv.nontaxableSubtotal).toFixed(2),
        Number(inv.grandTotal).toFixed(2),
      ]);
    }

    const csvContent = rows
      .map((cols) => cols.map((c) => escapeCsv(c)).join(','))
      .join('\r\n');

    // Add BOM for Excel UTF-8 compatibility
    return new Response('\uFEFF' + csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="invoices-export.csv"',
      },
    });
  } catch (err: any) {
    console.error('GET /api/invoices/export error', err);
    return new Response(
      'Error generating CSV. ' + (err?.message ?? ''),
      { status: 500 },
    );
  }
}