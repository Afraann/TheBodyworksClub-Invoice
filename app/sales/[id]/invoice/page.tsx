import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import { InvoiceViewer } from '@/components/InvoiceViewer';

export default async function SaleInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Fetch Sale with Items and Products
  const sale = await prisma.sale.findUnique({
    where: { id },
    include: {
      items: {
        include: { product: true }
      },
      branch: true
    }
  });

  if (!sale) notFound();

  // Convert Sale to Invoice format for Viewer
  const mappedInvoice = {
    id: sale.id, // <--- THIS WAS MISSING! Adding it fixes the "undefined" link.
    invoiceCode: 'SALE-' + sale.id.slice(0, 6).toUpperCase(),
    invoiceDate: sale.saleDate,
    customerName: 'Store Customer', 
    customerPhone: '-',
    taxableSubtotal: Number(sale.totalAmount), 
    cgstAmount: 0,
    sgstAmount: 0,
    totalGst: 0,
    grandTotal: Number(sale.totalAmount),
    branch: sale.branch,
    items: sale.items.map(item => ({
       id: item.id,
       description: item.product.name,
       quantity: item.quantity,
       lineTotalBeforeTax: Number(item.total),
       durationDays: null
    }))
  };

  return <InvoiceViewer invoice={mappedInvoice} />;
}