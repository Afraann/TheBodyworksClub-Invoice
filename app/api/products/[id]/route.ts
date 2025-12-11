// app/api/products/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

// PATCH: Update existing product (Restock / Edit)
export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const { price, stock, category, isActive } = body;

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        price: Number(price),
        stock: Number(stock),
        category,
        isActive 
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

// DELETE: Soft delete product (Mark as inactive)
export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    // Soft delete: Just mark as inactive so it hides from the shop but keeps history
    await prisma.product.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}