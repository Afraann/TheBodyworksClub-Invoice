// app/api/products/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params; // Next.js 16 params are promises
    const body = await req.json();
    const { price, stock, category, isActive } = body;

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        price: Number(price),
        stock: Number(stock),
        category,
        isActive // allow deactivating/soft deleting if needed later
      },
    });

    return NextResponse.json({ success: true, data: updatedProduct });
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update product' },
      { status: 500 }
    );
  }
}