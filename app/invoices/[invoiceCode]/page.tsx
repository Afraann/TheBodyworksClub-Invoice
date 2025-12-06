// app/invoices/[invoiceCode]/page.tsx
import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Phone, FileText, Home, Plus, Printer, ArrowLeft } from 'lucide-react';
import { PrintButton } from '@/components/PrintButton';

// Import local background image
import bgImg from '../../bg.jpg';

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
    <main className="min-h-screen relative flex items-start justify-center py-10 px-4 print:p-0 print:bg-white">
      
      {/* Background Image & Overlay (Screen Only) */}
      <div className="fixed inset-0 z-0 print:hidden">
        <Image
          src={bgImg}
          alt="Gym Background"
          fill
          className="object-cover"
          placeholder="blur"
        />
        <div className="absolute inset-0 bg-neutral-900/80 backdrop-blur-sm" />
      </div>

      {/* INVOICE CONTAINER */}
      <div className="relative z-10 w-full max-w-[85mm] bg-white shadow-2xl rounded-xl overflow-hidden border border-neutral-200 print:shadow-none print:border-none print:rounded-none print:max-w-none print:w-full">
        
        {/* ACTION BAR (Screen Only) */}
        <div className="bg-neutral-900 p-4 space-y-4 print:hidden">
          
          {/* Navigation Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Link 
              href="/" 
              className="group flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white text-xs font-medium py-2.5 rounded-lg transition-all border border-white/5"
            >
              <Home className="h-3.5 w-3.5 text-neutral-400 group-hover:text-white transition-colors" />
              Dashboard
            </Link>
            <Link 
              href="/invoices/new" 
              className="group flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white text-xs font-medium py-2.5 rounded-lg transition-all shadow-lg shadow-red-900/20"
            >
              <Plus className="h-3.5 w-3.5" />
              New Invoice
            </Link>
          </div>

          {/* Title & Print */}
          <div className="flex justify-between items-center border-t border-white/10 pt-4">
             <div className="flex items-center gap-2 text-white/80">
                <FileText className="h-4 w-4 text-red-500" />
                <span className="text-xs font-medium tracking-wide uppercase">Invoice Preview</span>
             </div>
             {/* Styling the PrintButton wrapper to match theme */}
               <PrintButton /> 
             </div>
          </div>
        </div>

        {/* RECEIPT BODY */}
        <div className="p-6 print:p-0">
          
          {/* 1. HEADER */}
          <header className="text-center border-b-2 border-dashed border-neutral-200 pb-5 mb-5">
            {branch?.name && (
              <h1 className="text-xl font-black uppercase tracking-wider text-neutral-900">
                {branch.name}
              </h1>
            )}
            
            <div className="mt-2 space-y-1 text-[10px] uppercase font-medium text-neutral-500 tracking-wide">
               {branch?.address && <p>{branch.address}</p>}
               {branch?.phone && <p>Ph: {branch.phone}</p>}
               {branch?.gstin && <p>GSTIN: {branch.gstin}</p>}
            </div>
          </header>

          {/* 2. INVOICE META (Date & Time) */}
          <section className="flex justify-between items-end mb-6 text-xs">
            <div>
               <p className="text-neutral-400 text-[9px] uppercase tracking-wider font-bold mb-0.5">Invoice No</p>
               <p className="font-bold text-neutral-900 text-sm">#{invoice.invoiceCode}</p>
            </div>
            <div className="text-right">
               <p className="text-neutral-400 text-[9px] uppercase tracking-wider font-bold mb-0.5">Date & Time</p>
               <div className="text-neutral-900 leading-tight">
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
          <section className="bg-neutral-50 rounded-lg p-3 mb-6 border border-neutral-100 print:border-neutral-200 print:bg-transparent print:p-0 print:rounded-none">
             <p className="text-[9px] text-neutral-400 uppercase tracking-wider font-bold mb-1">Bill To</p>
             <p className="font-bold text-neutral-900 text-sm">{invoice.customerName}</p>
             <p className="text-xs text-neutral-600 font-mono mt-0.5">{invoice.customerPhone}</p>
          </section>

          {/* 4. LINE ITEMS TABLE */}
          <section className="mb-6">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-neutral-200 text-neutral-400 uppercase tracking-wide text-[9px]">
                  <th className="text-left font-bold py-2">Item</th>
                  <th className="text-center font-bold py-2 w-14">Dur.</th>
                  <th className="text-right font-bold py-2 w-20">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dashed divide-neutral-200">
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="py-3 pr-1 align-top">
                      <p className="font-semibold text-neutral-900 leading-tight">
                        {item.description}
                      </p>
                    </td>
                    <td className="py-3 px-1 align-top text-center text-neutral-500 font-medium">
                      {item.durationDays ? (
                        <span className="whitespace-nowrap">{item.durationDays} Days</span>
                      ) : (
                        <span className="text-neutral-300">-</span>
                      )}
                    </td>
                    <td className="py-3 text-right align-top font-bold text-neutral-900">
                      {formatCurrency(Number(item.lineTotalBeforeTax))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* 5. TOTALS CALCULATION */}
          <section className="space-y-1.5 text-xs border-t-2 border-dashed border-neutral-200 pt-4">
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
                <span className="font-bold text-sm text-neutral-900 uppercase tracking-wide">Total Paid</span>
                <span className="font-black text-xl text-neutral-900">
                   {formatCurrency(Number(invoice.grandTotal))}
                </span>
             </div>
          </section>

          {/* 6. FOOTER */}
          <footer className="mt-8 text-center">
             <p className="text-[10px] text-neutral-800 font-semibold uppercase tracking-wide">
                Thank you for training with us!
             </p>
             <p className="text-[9px] text-neutral-400 mt-1">
                Computer Generated Invoice • {invoiceCode}
             </p>
          </footer>

        </div>
      </div>
    </main>
  );
}