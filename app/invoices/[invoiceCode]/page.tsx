// app/invoices/[invoiceCode]/page.tsx
import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import Link from 'next/link'; // Added for navigation
import { MapPin, Phone, FileText, Home, Plus } from 'lucide-react'; // Added icons
import { PrintButton } from '@/components/PrintButton';

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

  const branch = invoice.branch;
  const items = invoice.items;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <main className="min-h-screen bg-neutral-100 flex items-start justify-center py-10 px-4 print:p-0 print:bg-white">
      
      {/* INVOICE CONTAINER */}
      <div className="w-full max-w-[85mm] bg-white shadow-lg rounded-xl overflow-hidden border border-neutral-200 print:shadow-none print:border-none print:rounded-none print:max-w-none print:w-full">
        
        {/* ACTION BAR (Screen Only) */}
        <div className="bg-neutral-900 p-4 space-y-4 print:hidden">
          
          {/* Navigation Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Link 
              href="/" 
              className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white text-xs font-medium py-2 rounded-lg transition-colors"
            >
              <Home className="h-3.5 w-3.5" />
              Dashboard
            </Link>
            <Link 
              href="/invoices/new" 
              className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white text-xs font-medium py-2 rounded-lg transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              New Invoice
            </Link>
          </div>

          {/* Title & Print */}
          <div className="flex justify-between items-center border-t border-white/10 pt-4">
             <div className="flex items-center gap-2 text-white/80">
                <FileText className="h-4 w-4" />
                <span className="text-xs font-medium">Invoice Preview</span>
             </div>
             <PrintButton /> 
          </div>
        </div>

        {/* RECEIPT BODY */}
        <div className="p-6 print:p-0">
          
          {/* 1. HEADER */}
          <header className="text-center border-b-2 border-dashed border-neutral-300 pb-5 mb-5">
            {branch?.name && (
              <h1 className="text-xl font-bold uppercase tracking-wider text-neutral-900">
                {branch.name}
              </h1>
            )}
            
            <div className="mt-2 space-y-1 text-[11px] text-neutral-600 font-medium">
               {branch?.address && <p>{branch.address}</p>}
               {branch?.phone && <p>Ph: {branch.phone}</p>}
               {branch?.gstin && <p className="mt-1 text-neutral-400">GSTIN: {branch.gstin}</p>}
            </div>
          </header>

          {/* 2. INVOICE META (Date & Time) */}
          <section className="flex justify-between items-end mb-5 text-xs">
            <div>
               <p className="text-neutral-400 text-[10px] uppercase tracking-wider">Invoice No</p>
               <p className="font-bold text-neutral-900 text-sm">#{invoice.invoiceCode}</p>
            </div>
            <div className="text-right">
               <p className="text-neutral-400 text-[10px] uppercase tracking-wider">Date & Time</p>
               <div className="text-neutral-900">
                 <p className="font-bold">
                   {invoice.invoiceDate.toLocaleDateString('en-IN', {
                      day: '2-digit', month: 'short', year: 'numeric'
                   })}
                 </p>
                 <p className="text-[10px] text-neutral-500 font-medium">
                   {invoice.invoiceDate.toLocaleTimeString('en-IN', {
                      hour: '2-digit', minute: '2-digit', hour12: true
                   })}
                 </p>
               </div>
            </div>
          </section>

          {/* 3. CUSTOMER DETAILS */}
          <section className="bg-white rounded-lg p-3 mb-5 border border-neutral-300 print:border-neutral-300 print:rounded-none">
             <p className="text-[10px] text-neutral-400 uppercase tracking-wider mb-1">Bill To</p>
             <p className="font-bold text-neutral-900 text-sm">{invoice.customerName}</p>
             <p className="text-xs text-neutral-600">{invoice.customerPhone}</p>
          </section>

          {/* 4. LINE ITEMS TABLE */}
          <section className="mb-5">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-neutral-300 text-neutral-500">
                  <th className="text-left font-semibold py-2">Item</th>
                  <th className="text-center font-semibold py-2 w-16">Duration</th>
                  <th className="text-right font-semibold py-2 w-20">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dashed divide-neutral-200">
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="py-2.5 pr-1 align-top">
                      <p className="font-medium text-neutral-900 leading-tight">
                        {item.description}
                      </p>
                    </td>
                    <td className="py-2.5 px-1 align-top text-center text-neutral-600 font-medium">
                      {item.durationDays ? (
                        <span className="whitespace-nowrap">{item.durationDays} Days</span>
                      ) : (
                        <span className="text-neutral-300">-</span>
                      )}
                    </td>
                    <td className="py-2.5 text-right align-top font-bold text-neutral-900">
                      {formatCurrency(Number(item.lineTotalBeforeTax))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* 5. TOTALS CALCULATION */}
          <section className="space-y-1.5 text-xs border-t-2 border-dashed border-neutral-300 pt-3">
             <div className="flex justify-between text-neutral-500">
                <span>Taxable Amount</span>
                <span>{formatCurrency(Number(invoice.taxableSubtotal))}</span>
             </div>
             <div className="flex justify-between text-neutral-500">
                <span>CGST (9%)</span>
                <span>{formatCurrency(Number(invoice.cgstAmount))}</span>
             </div>
             <div className="flex justify-between text-neutral-500">
                <span>SGST (9%)</span>
                <span>{formatCurrency(Number(invoice.sgstAmount))}</span>
             </div>
             <div className="flex justify-between text-neutral-500">
                <span>Non-Taxable Amount</span>
                <span>{formatCurrency(Number(invoice.nontaxableSubtotal))}</span>
             </div>

             {/* GRAND TOTAL */}
             <div className="flex justify-between items-center pt-3 mt-2 border-t border-neutral-200">
                <span className="font-bold text-sm text-neutral-900">Total Paid</span>
                <span className="font-bold text-lg text-neutral-900">
                   {formatCurrency(Number(invoice.grandTotal))}
                </span>
             </div>
          </section>

          {/* 6. FOOTER */}
          <footer className="mt-8 text-center">
             <p className="text-[10px] text-neutral-500 font-medium">
                Thank you for training with us!
             </p>
             <p className="text-[9px] text-neutral-400 mt-1">
                Computer Generated Invoice
             </p>
          </footer>

        </div>
      </div>
    </main>
  );
}