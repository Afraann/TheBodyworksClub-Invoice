// app/sales/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Calendar } from 'lucide-react';
import Image from 'next/image';
import bgImg from '../bg.jpg';

export default function SalesHistoryPage() {
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('today');

  useEffect(() => {
    setLoading(true);
    fetch(`/api/sales/history?range=${range}`)
      .then(res => res.json())
      .then(data => {
        if(data.success) setSales(data.data);
        setLoading(false);
      });
  }, [range]);

  const totalRevenue = sales.reduce((acc, sale) => acc + Number(sale.totalAmount), 0);

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-900 p-4 md:p-8 relative">
       
       {/* Background */}
       <div className="fixed inset-0 z-0 pointer-events-none">
          <Image src={bgImg} alt="bg" fill className="object-cover" />
          <div className="absolute inset-0  bg-neutral-900/80 backdrop-blur-sm" />
       </div>

       <div className="relative z-10 max-w-5xl mx-auto space-y-8">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between bg-white/10 backdrop-blur-md gap-4 border border-white/10 p-6 rounded-2xl shadow-xl">
             <div>
                <Link href="/" className="inline-flex items-center gap-2 text-neutral-500 hover:text-red-600 mb-2 transition-colors font-medium text-sm">
                   <ArrowLeft className="h-4 w-4" /> Back to Dashboard
                </Link>
                <h1 className="text-3xl text-white font-bold uppercase tracking-tight text-neutral-900">
                   Sales Records
                </h1>
                <p className="text-neutral-400">Track your inventory sales and revenue.</p>
             </div>
             
             {/* Date Filter */}
             <div className="flex justify-center bg-white p-1 rounded-xl border border-neutral-200 shadow-sm">
                {['today', 'week', 'month'].map((r) => (
                   <button
                     key={r}
                     onClick={() => setRange(r)}
                     className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${range === r ? 'bg-neutral-900 text-white shadow' : 'text-neutral-500 hover:bg-neutral-50'}`}
                   >
                     {r}
                   </button>
                ))}
             </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
                <p className="text-neutral-400 text-xs font-bold uppercase tracking-wider mb-1">Total Revenue ({range})</p>
                <p className="text-4xl font-black text-red-600">₹{totalRevenue.toFixed(2)}</p>
             </div>
             <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-neutral-400 text-xs font-bold uppercase tracking-wider mb-1">Transactions</p>
                  <p className="text-2xl font-bold text-neutral-900">{sales.length}</p>
                </div>
                <div className="h-12 w-12 bg-neutral-100 rounded-full flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-neutral-400" />
                </div>
             </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-xl overflow-hidden">
             <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                   <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 uppercase text-[10px] tracking-wider font-bold">
                      <tr>
                         <th className="p-4">Time</th>
                         <th className="p-4">Products Sold</th>
                         <th className="p-4">Payment</th>
                         <th className="p-4 text-right">Amount</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-neutral-100">
                      {loading ? (
                         <tr><td colSpan={4} className="p-8 text-center text-neutral-500">Loading records...</td></tr>
                      ) : sales.length === 0 ? (
                         <tr><td colSpan={4} className="p-8 text-center text-neutral-400 py-12">No sales found for this period.</td></tr>
                      ) : (
                         sales.map((sale) => (
                           <tr key={sale.id} className="hover:bg-neutral-50 transition-colors group">
                              <td className="p-4 whitespace-nowrap">
                                 <span className="font-bold text-neutral-900">
                                    {new Date(sale.saleDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                 </span>
                                 <div className="text-[10px] text-neutral-400 font-medium">
                                   {new Date(sale.saleDate).toLocaleDateString('en-IN')}
                                 </div>
                              </td>
                              <td className="p-4">
                                 <div className="space-y-1">
                                    {sale.items.map((item: any) => (
                                       <div key={item.id} className="text-neutral-700 font-medium text-xs">
                                          {item.product?.name || 'Unknown'} <span className="text-neutral-400">x{item.quantity}</span>
                                       </div>
                                    ))}
                                 </div>
                              </td>
                              <td className="p-4">
                                 <span className={`inline-block px-2 py-1 rounded text-[10px] font-bold uppercase ${sale.paymentMode === 'SPLIT' ? 'bg-purple-100 text-purple-700' : 'bg-neutral-100 text-neutral-600'}`}>
                                    {sale.paymentMode}
                                 </span>
                                 {sale.paymentMode === 'SPLIT' && (
                                    <div className="text-[10px] text-neutral-500 mt-1 font-mono">
                                       Cash: {sale.cashAmount} / UPI: {sale.upiAmount}
                                    </div>
                                 )}
                              </td>
                              <td className="p-4 text-right">
                                 <span className="font-black text-neutral-900 text-lg">
                                    ₹{Number(sale.totalAmount).toFixed(2)}
                                 </span>
                              </td>
                           </tr>
                         ))
                      )}
                   </tbody>
                </table>
             </div>
          </div>

       </div>
    </main>
  );
}