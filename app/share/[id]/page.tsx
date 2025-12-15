import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import { InvoiceViewer } from '@/components/InvoiceViewer';

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function PublicInvoicePage({ params }: PageProps) {
  const { id } = await params;

  let invoiceData = null;

  // 1. Try finding it in INVOICES (Memberships)
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { items: true, branch: true },
  });

  if (invoice) {
    invoiceData = {
      ...invoice,
      taxableSubtotal: invoice.taxableSubtotal.toNumber(),
      cgstAmount: invoice.cgstAmount.toNumber(),
      sgstAmount: invoice.sgstAmount.toNumber(),
      totalGst: invoice.totalGst.toNumber(),
      nontaxableSubtotal: invoice.nontaxableSubtotal.toNumber(),
      grandTotal: invoice.grandTotal.toNumber(),
      items: invoice.items.map((item) => ({
        ...item,
        baseAmount: item.baseAmount.toNumber(),
        lineTotalBeforeTax: item.lineTotalBeforeTax.toNumber(),
        gstRate: item.gstRate.toNumber(),
      })),
    };
  } 
  else {
    // 2. If not found, try finding it in SALES (Shop)
    const sale = await prisma.sale.findUnique({
        where: { id },
        include: { 
            items: { include: { product: true } }, 
            branch: true 
        },
    });

    if (sale) {
        // Map Sale data to Invoice structure so the Viewer can read it
        invoiceData = {
            id: sale.id,
            invoiceCode: 'SALE-' + sale.id.slice(0, 6).toUpperCase(),
            invoiceDate: sale.saleDate,
            customerName: 'Store Customer',
            customerPhone: '-', // WhatsApp button will prompt for this
            branch: sale.branch,
            
            // Sales usually include tax in price, so we set breakdowns to 0 for simplicity
            // or you can implement back-calculation if needed.
            taxableSubtotal: sale.totalAmount.toNumber(),
            cgstAmount: 0,
            sgstAmount: 0,
            totalGst: 0,
            nontaxableSubtotal: 0,
            grandTotal: sale.totalAmount.toNumber(),
            
            items: sale.items.map((item) => ({
                id: item.id,
                description: item.product.name,
                quantity: item.quantity,
                lineTotalBeforeTax: item.total.toNumber(),
                durationDays: null
            }))
        };
    }
  }

  if (!invoiceData) {
    notFound();
  }

  return <InvoiceViewer invoice={invoiceData} isPublic={true} />;
}