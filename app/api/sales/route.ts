import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { PaymentMode } from '@prisma/client';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { items, paymentMode, cashAmount, upiAmount } = body; 
    // items = [{ productId: "...", quantity: 1, unitPrice: 100 }]

    if (!items || items.length === 0) {
      return NextResponse.json({ success: false, error: 'No items in cart' }, { status: 400 });
    }

    // 1. Get Branch ID (Assuming single branch logic like your login)
    const branch = await prisma.branch.findFirst({ where: { isActive: true } });
    if (!branch) throw new Error('No active branch found');

    // 2. Start Transaction (All or Nothing)
    const sale = await prisma.$transaction(async (tx) => {
      
      let totalAmount = 0;
      const saleItemsData = [];

      // Loop through items to check stock and calculate total
      for (const item of items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        
        if (!product) throw new Error(`Product not found: ${item.productId}`);
        if (product.stock < item.quantity) {
          throw new Error(`Insufficient stock for ${product.name}. Available: ${product.stock}`);
        }

        // Deduct Stock
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

      // 3. Create Sale Record
      return await tx.sale.create({
        data: {
          branchId: branch.id,
          totalAmount,
          paymentMode: paymentMode as PaymentMode,
          cashAmount: Number(cashAmount || 0),
          upiAmount: Number(upiAmount || 0),
          items: {
            create: saleItemsData
          }
        }
      });
    });

    return NextResponse.json({ success: true, data: sale });

  } catch (err: any) {
    console.error('Sale error', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Transaction failed' }, 
      { status: 500 }
    );
  }
}