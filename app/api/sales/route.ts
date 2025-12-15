import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { PaymentMode } from '@prisma/client';

export async function POST(req: NextRequest) {
  try {
    // 1. Get Session for Staff ID
    const sessionId = req.cookies.get('sessionId')?.value;
    const session = sessionId ? await prisma.session.findUnique({ where: { id: sessionId } }) : null;
    const staffId = session?.staffId || null; // <--- Extract Staff ID

    const body = await req.json();
    const { items, paymentMode, cashAmount, upiAmount } = body; 

    if (!items || items.length === 0) return NextResponse.json({ success: false, error: 'No items' }, { status: 400 });

    const branch = await prisma.branch.findFirst({ where: { isActive: true } });
    if (!branch) throw new Error('No active branch found');

    const sale = await prisma.$transaction(async (tx) => {
      let totalAmount = 0;
      const saleItemsData = [];

      for (const item of items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (!product) throw new Error(`Product not found`);
        
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: product.stock - item.quantity },
        });

        const lineTotal = Number(product.price) * item.quantity;
        totalAmount += lineTotal;

        saleItemsData.push({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: product.price,
          total: lineTotal,
        });
      }

      return await tx.sale.create({
        data: {
          branchId: branch.id,
          staffId, // <--- SAVE STAFF ID
          totalAmount,
          paymentMode: paymentMode as PaymentMode,
          cashAmount: Number(cashAmount || 0),
          upiAmount: Number(upiAmount || 0),
          items: { create: saleItemsData }
        }
      });
    });

    return NextResponse.json({ success: true, data: sale });

  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}