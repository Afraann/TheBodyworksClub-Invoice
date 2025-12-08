// app/invoices/[invoiceCode]/page.tsx
import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import { InvoiceViewer } from '@/components/InvoiceViewer';

type PageProps = {
  params: Promise<{
    invoiceCode: string;
  }>;
};

export default async function InvoicePage({ params }: PageProps) {
  const { invoiceCode } = await params;

  const invoice = await prisma.invoice.findUnique({
    where: { invoiceCode },
    include: {
      items: true,
      branch: true,
    },
  });

  if (!invoice) {
    notFound();
  }

  // --- FIX: SERIALIZATION ---
  // Convert Prisma Decimal objects to regular numbers
  const serializedInvoice = {
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

  return <InvoiceViewer invoice={serializedInvoice} />;
}