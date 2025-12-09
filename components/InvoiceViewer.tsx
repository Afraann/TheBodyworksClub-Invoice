'use client';

import { useState, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Printer, FileText, ScrollText, Home } from 'lucide-react';
import Link from 'next/link';
// Removed 'next/image' because standard <img> tag often works better for print scaling
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
      : `@page { size: A4; margin: 0; } body { margin: 0; }` 
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

  // Calculations
  const cgst = Number(invoice.cgstAmount) || 0;
  const sgst = Number(invoice.sgstAmount) || 0;
  // If you need tax breakdown per item, you might need extra logic, 
  // but usually for gym invoices, we just show the totals.

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
                    <FileText className="h-4 w-4" /> Template View
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
                    ? 'w-[80mm] min-h-[100mm] text-[10px] font-mono p-2 pb-10' 
                    : 'w-[210mm] h-[297mm] relative' 
                }
            `}
          >
            {printMode === 'A4' ? (
                // === A4 TEMPLATE LAYOUT ===
                <>
                    {/* 1. BACKGROUND IMAGE */}
                    <div className="absolute inset-0 z-0">
                        {/* Ensure 'Template.jpg' is strictly named exactly as in /public folder */}
                        <img 
                            src="/Template.jpg" 
                            alt="Invoice Template" 
                            className="w-full h-full object-cover"
                        />
                    </div>

                    {/* 2. OVERLAY DATA (Adjusted Coordinates) */}
                    
                    {/* LEFT COLUMN: Customer Info */}
                    {/* 'BILLED TO:' is roughly top: 24.5%, left: 5% */}
                    <div className="absolute z-10 top-[24%] left-[22%] font-bold text-neutral-800 uppercase tracking-wide">
                        {invoice.customerName}
                    </div>

                    {/* 'CONTACT NO:' is roughly top: 27%, left: 5% */}
                    <div className="absolute z-10 top-[26.5%] left-[25%] font-bold text-neutral-800 font-mono">
                        {invoice.customerPhone}
                    </div>


                    {/* RIGHT COLUMN: Invoice Details */}
                    {/* 'INVOICE NO:' is roughly top: 24.5%, left: 55% */}
                    <div className="absolute z-10 top-[24%] left-[75%] font-bold text-neutral-800">
                        {invoice.invoiceCode}
                    </div>

                    {/* 'DATE:' is roughly top: 27%, left: 55% */}
                    <div className="absolute z-10 top-[26.2%] left-[75%] font-bold text-neutral-800">
                        {new Date(invoice.invoiceDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>

                    {/* 'GSTIN:' is roughly top: 29.5%, left: 55% */}
                    <div className="absolute z-10 top-[28.74%] left-[75%] font-bold text-neutral-800">
                        {branch?.gstin || 'N/A'}
                    </div>


                    {/* 3. TABLE AREA */}
                    {/* Header line is ~42%, first data row starts ~46% */}
                    <div className="absolute z-10 top-[48%] left-[11%] right-[7%]">
                        <table className="w-full text-sm border-collapse">
                            <tbody>
                                {items.map((item: any, idx: number) => (
                                    <tr key={item.id} className="h-8 align-top">
                                        {/* Description matches 'DESCRIPTION' column */}
                                        <td className="w-[45%] pl-2 font-bold text-neutral-800 uppercase">
                                            {item.description}
                                        </td>
                                        
                                        {/* Duration matches 'DURATION' column (Centered) */}
                                        <td className="w-[30%] pl-8 font-bold text-neutral-600">
                                            {item.durationDays ? `${item.durationDays} Days` : '-'}
                                        </td>
                                        
                                        {/* Amount matches 'AMOUNT' column (Right aligned) */}
                                        <td className="w-[25%] text-right pr-4 font-bold text-neutral-900">
                                            {formatCurrency(Number(item.lineTotalBeforeTax))}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>


                    {/* 4. TOTALS AREA */}
                    {/* Labels are pre-printed. We just need to place values to the right of them. 
                        Sub-Total label ~56.5% top
                        CGST label ~59% top
                        SGST label ~61.5% top
                        TOTAL label ~66% top
                        Column is roughly at left: 75% or aligned right at 8% margin
                    */}
                    
                    <div className="absolute z-10 top-[55.6%] right-[9%] w-32 text-right text-sm font-bold text-neutral-700">
                        {formatCurrency(Number(invoice.taxableSubtotal))}
                    </div>

                    <div className="absolute z-10 top-[58%] right-[9%] w-32 text-right text-sm font-bold text-neutral-700">
                        {formatCurrency(cgst)}
                    </div>

                    <div className="absolute z-10 top-[60%] right-[9%] w-32 text-right text-sm font-bold text-neutral-700">
                        {formatCurrency(sgst)}
                    </div>

                    {/* Grand Total - slightly larger */}
                    <div className="absolute z-10 top-[64.7%] right-[8%] w-40 text-right text-xl font-black text-neutral-900">
                        {formatCurrency(Number(invoice.grandTotal))}
                    </div>

                </>
            ) : (
                // === THERMAL LAYOUT (Unchanged) ===
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

                    <div className="space-y-1 text-[10px] border-t-2 border-black/10 border-dashed pt-2">
                        <div className="flex justify-between text-neutral-600">
                            <span>Taxable</span>
                            <span>{Number(invoice.taxableSubtotal).toFixed(2)}</span>
                        </div>
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