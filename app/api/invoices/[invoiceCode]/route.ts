// app/api/invoices/[invoiceCode]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

type RouteContext = {
  params: Promise<{
    invoiceCode: string;
  }>;
};

export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    // ⬇️ unwrap the params Promise (Next 16 expects this)
    const { invoiceCode } = await context.params;

    if (!invoiceCode) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invoice code is required',
          },
        },
        { status: 400 },
      );
    }

    const invoice = await prisma.invoice.findUnique({
      where: { invoiceCode },
      include: {
        items: true,
        branch: true,
      },
    });

    if (!invoice) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVOICE_NOT_FOUND',
            message: 'Invoice not found',
          },
        },
        { status: 404 },
      );
    }

    const responseInvoice = {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      invoiceCode: invoice.invoiceCode,
      invoiceDate: invoice.invoiceDate,
      customerName: invoice.customerName,
      customerPhone: invoice.customerPhone,
      taxableSubtotal: Number(invoice.taxableSubtotal),
      cgstAmount: Number(invoice.cgstAmount),
      sgstAmount: Number(invoice.sgstAmount),
      totalGst: Number(invoice.totalGst),
      nontaxableSubtotal: Number(invoice.nontaxableSubtotal),
      grandTotal: Number(invoice.grandTotal),
      isVoid: invoice.isVoid,
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt,
      branch: invoice.branch
        ? {
            name: invoice.branch.name,
            address: invoice.branch.address,
            phone: invoice.branch.phone,
            gstin: invoice.branch.gstin,
            logoUrl: invoice.branch.logoUrl,
          }
        : null,
      items: invoice.items.map((i) => ({
        id: i.id,
        itemType: i.itemType,
        description: i.description,
        durationDays: i.durationDays,
        quantity: i.quantity,
        baseAmount: Number(i.baseAmount),
        lineTotalBeforeTax: Number(i.lineTotalBeforeTax),
        isTaxable: i.isTaxable,
        gstRate: Number(i.gstRate),
        planId: i.planId,
      })),
    };

    return NextResponse.json(
      {
        success: true,
        data: {
          invoice: responseInvoice,
        },
      },
      { status: 200 },
    );
  } catch (err: any) {
    console.error('GET /api/invoices/[invoiceCode] error', err);
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
