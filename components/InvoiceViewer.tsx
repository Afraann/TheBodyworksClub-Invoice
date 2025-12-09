'use client';

import { useState, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Printer, FileText, ScrollText, Home, Plus } from 'lucide-react';
import Link from 'next/link';
import { WhatsAppButton } from './WhatsappButton';

type InvoiceViewerProps = {
  invoice: any;
};

export function InvoiceViewer({ invoice }: InvoiceViewerProps) {
  const [printMode, setPrintMode] = useState<'A4' | 'THERMAL'>('A4');
  const componentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: componentRef, 
    documentTitle: `Invoice_${invoice.invoiceCode}`,
    pageStyle: printMode === 'THERMAL' 
      ? `@page { size: 80mm auto; margin: 0; } body { margin: 5mm; }`
      : `@page { size: A4; margin: 20mm; }`
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const branch = invoice.branch;
  const items = invoice.items;

  // Ensure these numbers are safe
  const cgst = Number(invoice.cgstAmount) || 0;
  const sgst = Number(invoice.sgstAmount) || 0;
  const totalGst = Number(invoice.totalGst) || 0;

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col items-center py-10 px-4 gap-6">
      
      {/* CONTROL PANEL */}
      <div className="w-full max-w-4xl bg-neutral-900 text-white p-4 rounded-xl shadow-xl flex flex-wrap items-center justify-between gap-4 print:hidden">
        
        <div className="flex items-center gap-3">
            <Link href="/" className="p-2 hover:bg-white/10 rounded-lg transition-colors text-neutral-400 hover:text-white">
                <Home className="h-5 w-5" />
            </Link>
            <div className="h-6 w-px bg-white/20"></div>
            <div>
                <h1 className="font-bold text-lg leading-none">Invoice #{invoice.invoiceCode}</h1>
                <p className="text-xs text-neutral-400 mt-1">{invoice.customerName}</p>
            </div>
        </div>

        <div className="flex items-center gap-3">
             <div className="bg-black/50 p-1 rounded-lg flex items-center border border-white/10">
                <button 
                  onClick={() => setPrintMode('A4')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${printMode === 'A4' ? 'bg-white text-neutral-900 shadow' : 'text-neutral-400 hover:text-white'}`}
                >
                    <FileText className="h-4 w-4" /> A4 Standard
                </button>
                <button 
                  onClick={() => setPrintMode('THERMAL')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${printMode === 'THERMAL' ? 'bg-white text-neutral-900 shadow' : 'text-neutral-400 hover:text-white'}`}
                >
                    <ScrollText className="h-4 w-4" /> Thermal (POS)
                </button>
             </div>

             <WhatsAppButton 
                phone={invoice.customerPhone} 
                invoiceCode={invoice.invoiceCode} 
             />
             
             <button 
                onClick={() => handlePrint && handlePrint()}
                className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold uppercase tracking-wide shadow-lg shadow-red-900/20 transition-all"
             >
                <Printer className="h-4 w-4" /> Print
             </button>
        </div>
      </div>

      {/* PREVIEW AREA */}
      <div className="overflow-auto w-full flex justify-center pb-20">
          
          <div 
            ref={componentRef}
            id="invoice-preview"
            className={`bg-white text-neutral-900 shadow-2xl overflow-hidden print:shadow-none transition-all duration-300 origin-top
                ${printMode === 'THERMAL' 
                    ? 'w-[80mm] min-h-[100mm] text-[10px] font-mono' 
                    : 'w-[210mm] min-h-[297mm] p-10 font-sans'
                }
            `}
          >
            {printMode === 'A4' ? (
                // === A4 LAYOUT ===
                <div className="h-full flex flex-col justify-between">
                    <div>
                        {/* Header */}
                        <header className="flex justify-between items-start border-b-2 border-neutral-100 pb-8 mb-8">
                            <div>
                                <h1 className="text-4xl font-black text-red-600 uppercase tracking-tighter mb-2">{branch?.name}</h1>
                                <div className="text-sm text-neutral-500 space-y-1 font-medium">
                                    <p>{branch?.address}</p>
                                    <p>Phone: {branch?.phone}</p>
                                    <p>GSTIN: {branch?.gstin}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <h2 className="text-6xl font-black text-neutral-100 uppercase tracking-tighter">Invoice</h2>
                                <div className="mt-4 text-sm">
                                    <p className="font-bold text-neutral-900">#{invoice.invoiceCode}</p>
                                    <p className="text-neutral-500">{new Date(invoice.invoiceDate).toLocaleDateString('en-IN', { dateStyle: 'long' })}</p>
                                </div>
                            </div>
                        </header>

                        {/* Bill To */}
                        <section className="mb-10">
                            <h3 className="text-xs font-bold uppercase text-neutral-400 tracking-wider mb-2">Bill To</h3>
                            <p className="text-xl font-bold text-neutral-900">{invoice.customerName}</p>
                            <p className="text-neutral-500">{invoice.customerPhone}</p>
                        </section>

                        {/* Table */}
                        <table className="w-full mb-8">
                            <thead className="bg-neutral-50">
                                <tr>
                                    <th className="text-left py-3 px-4 text-xs font-bold uppercase text-neutral-500 tracking-wider rounded-l-lg">Description</th>
                                    <th className="text-center py-3 px-4 text-xs font-bold uppercase text-neutral-500 tracking-wider">Qty</th>
                                    <th className="text-right py-3 px-4 text-xs font-bold uppercase text-neutral-500 tracking-wider rounded-r-lg">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100">
                                {items.map((item: any) => (
                                    <tr key={item.id}>
                                        <td className="py-4 px-4 font-bold text-neutral-800">{item.description}</td>
                                        <td className="py-4 px-4 text-center text-neutral-500">{item.quantity}</td>
                                        <td className="py-4 px-4 text-right font-bold text-neutral-900">{formatCurrency(Number(item.lineTotalBeforeTax))}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer / Totals (A4) */}
                    <div>
                        <div className="flex justify-end">
                            <div className="w-64 space-y-2 text-sm">
                                <div className="flex justify-between text-neutral-500">
                                    <span>Taxable Value</span>
                                    <span>{formatCurrency(Number(invoice.taxableSubtotal))}</span>
                                </div>
                                {/* SPLIT GST HERE */}
                                <div className="flex justify-between text-neutral-500">
                                    <span>CGST (9%)</span>
                                    <span>{formatCurrency(cgst)}</span>
                                </div>
                                <div className="flex justify-between text-neutral-500 border-b border-neutral-100 pb-2">
                                    <span>SGST (9%)</span>
                                    <span>{formatCurrency(sgst)}</span>
                                </div>
                                <div className="flex justify-between text-xl font-black text-neutral-900 pt-2">
                                    <span>Total</span>
                                    <span>{formatCurrency(Number(invoice.grandTotal))}</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-12 pt-8 border-t border-neutral-100 text-center text-neutral-400 text-xs">
                            <p>Thank you for your business.</p>
                        </div>
                    </div>
                </div>
            ) : (
                // === THERMAL LAYOUT (80mm) ===
                <div className="p-2 pb-10">
                    <div className="text-center mb-4 pb-4 border-b-2 border-black/10 border-dashed">
                        <h2 className="text-xl font-black uppercase mb-1">{branch?.name}</h2>
                        <p className="text-[10px] text-neutral-500 leading-tight px-4">{branch?.address}</p>
                        <p className="text-[10px] mt-1 font-bold">Ph: {branch?.phone}</p>
                    </div>

                    <div className="flex justify-between mb-4 text-[10px]">
                         <div>
                            <p className="text-neutral-500">Inv No.</p>
                            <p className="font-bold">{invoice.invoiceCode}</p>
                         </div>
                         <div className="text-right">
                            <p className="text-neutral-500">Date</p>
                            <p className="font-bold">{new Date(invoice.invoiceDate).toLocaleDateString('en-IN')}</p>
                         </div>
                    </div>

                    <div className="mb-4 pb-4 border-b-2 border-black/10 border-dashed">
                        <p className="text-[9px] uppercase text-neutral-500 font-bold">Customer</p>
                        <p className="font-bold text-sm truncate">{invoice.customerName}</p>
                        <p className="text-[10px]">{invoice.customerPhone}</p>
                    </div>

                    <table className="w-full mb-4 text-[10px]">
                        <thead>
                            <tr className="border-b border-black">
                                <th className="text-left py-1">Item</th>
                                <th className="text-center py-1 w-6">Qty</th>
                                <th className="text-right py-1">Amt</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-black/10">
                            {items.map((item: any) => (
                                <tr key={item.id}>
                                    <td className="py-2 pr-1 font-bold">{item.description}</td>
                                    <td className="py-2 text-center">{item.quantity}</td>
                                    <td className="py-2 text-right">{Number(item.lineTotalBeforeTax).toFixed(0)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Footer / Totals (THERMAL) */}
                    <div className="space-y-1 text-[10px] border-t-2 border-black/10 border-dashed pt-2">
                        <div className="flex justify-between text-neutral-600">
                            <span>Taxable</span>
                            <span>{Number(invoice.taxableSubtotal).toFixed(2)}</span>
                        </div>
                        {/* SPLIT GST HERE */}
                        <div className="flex justify-between text-neutral-600">
                            <span>CGST (9%)</span>
                            <span>{cgst.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-neutral-600">
                            <span>SGST (9%)</span>
                            <span>{sgst.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-lg font-black mt-2 pt-2 border-t border-black">
                            <span>TOTAL</span>
                            <span>{Number(invoice.grandTotal).toFixed(0)}</span>
                        </div>
                    </div>

                    <div className="mt-6 text-center text-[9px] font-medium text-neutral-500">
                        <p>THANK YOU!</p>
                        <p>Keep Training, Keep Growing.</p>
                        <div className="mt-2 text-[8px] opacity-50">
                            {new Date().toLocaleString()}
                        </div>
                    </div>
                </div>
            )}
          </div>

      </div>
    </div>
  );
}