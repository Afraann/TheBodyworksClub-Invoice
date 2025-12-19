'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, ChevronLeft, ChevronRight, User } from 'lucide-react';
import Image from 'next/image';
import bgImg from '../bg.jpg';

const BUSINESS_START_DATE = new Date('2025-11-28T00:00:00');

export default function SalesHistoryPage() {
  const router = useRouter();
  const [sales, setSales] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]); // <--- New State
  const [selectedStaff, setSelectedStaff] = useState<string>('all'); // <--- New State
  const [loading, setLoading] = useState(true);
  
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('day');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  // --- HELPERS ---
  const getToday = () => {
    const d = new Date();
    d.setHours(0,0,0,0);
    return d;
  };

  const canGoBack = () => currentDate > BUSINESS_START_DATE;
  const canGoForward = () => {
    const today = getToday();
    if (viewMode === 'day') return currentDate < today;
    if (viewMode === 'month') return currentDate.getMonth() < today.getMonth() || currentDate.getFullYear() < today.getFullYear();
    return currentDate < today;
  };

  const getWeekRangeString = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay(); 
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); 
    const start = new Date(d);
    start.setDate(diff);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    return `${start.toLocaleDateString('en-IN', opts)} - ${end.toLocaleDateString('en-IN', opts)}, ${end.getFullYear()}`;
  };

  const handlePrev = () => {
    if (!canGoBack()) return;
    const newDate = new Date(currentDate);
    if (viewMode === 'day') newDate.setDate(newDate.getDate() - 1);
    if (viewMode === 'week') newDate.setDate(newDate.getDate() - 7);
    if (viewMode === 'month') newDate.setMonth(newDate.getMonth() - 1);
    setCurrentDate(newDate < BUSINESS_START_DATE ? BUSINESS_START_DATE : newDate);
  };

  const handleNext = () => {
    if (!canGoForward()) return;
    const newDate = new Date(currentDate);
    if (viewMode === 'day') newDate.setDate(newDate.getDate() + 1);
    if (viewMode === 'week') newDate.setDate(newDate.getDate() + 7);
    if (viewMode === 'month') newDate.setMonth(newDate.getMonth() + 1);
    const today = new Date();
    setCurrentDate(newDate > today ? today : newDate);
  };

  const toInputString = (date: Date, type: 'day' | 'week' | 'month') => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    if (type === 'day') return `${year}-${month}-${day}`;
    if (type === 'month') return `${year}-${month}`;
    if (type === 'week') {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
        const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1)/7);
        return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
    }
    return '';
  };

  const handleDateChange = (val: string) => {
    if(!val) return;
    let newDate;
    if (viewMode === 'week') {
        const [y, w] = val.split('-W');
        newDate = new Date(parseInt(y), 0, (parseInt(w) * 7) - 6);
    } else {
        newDate = new Date(val);
    }
    if (newDate < BUSINESS_START_DATE) setCurrentDate(BUSINESS_START_DATE);
    else if (newDate > new Date()) setCurrentDate(new Date());
    else setCurrentDate(newDate);
  };

  // --- 1. FETCH STAFF LIST ---
  useEffect(() => {
    fetch('/api/staff')
      .then(res => res.json())
      .then(data => { if(data.success) setStaffList(data.data) });
  }, []);

  // --- 2. FETCH SALES DATA ---
  useEffect(() => {
    setLoading(true);
    const isoDate = currentDate.toISOString();
    // Added staffId to query
    fetch(`/api/sales/history?mode=${viewMode}&date=${isoDate}&staffId=${selectedStaff}`)
      .then(res => res.json())
      .then(data => {
        if(data.success) setSales(data.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [viewMode, currentDate, selectedStaff]);

  const totalRevenue = sales.reduce((acc, sale) => acc + Number(sale.totalAmount), 0);

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-900 p-4 md:p-8 relative font-sans">
       <div className="fixed inset-0 z-0 pointer-events-none">
          <Image src={bgImg} alt="bg" fill className="object-cover" />
          <div className="absolute inset-0 bg-neutral-900/80 backdrop-blur-sm" />
       </div>

       <div className="relative z-10 max-w-5xl mx-auto space-y-6">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between bg-white/10 backdrop-blur-md gap-6 border border-white/10 p-6 rounded-2xl shadow-xl">
             <div>
                <Link href="/" className="inline-flex items-center gap-2 text-neutral-400 hover:text-white mb-2 transition-colors font-medium text-xs uppercase tracking-wider">
                   <ArrowLeft className="h-3 w-3" /> Dashboard
                </Link>
                <h1 className="text-3xl text-white font-black uppercase tracking-tight">Sales Records</h1>
             </div>
             
             <div className="flex flex-col gap-3 w-full md:w-auto">
                {/* --- NEW: STAFF FILTER --- */}
                <div className="relative">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-neutral-500" />
                    <select 
                        value={selectedStaff}
                        onChange={(e) => setSelectedStaff(e.target.value)}
                        className="w-full bg-white text-neutral-900 text-sm font-bold py-2 pl-9 pr-4 rounded-lg shadow-lg border-r-[16px] border-transparent outline-none cursor-pointer hover:bg-neutral-50"
                    >
                        <option value="all">All Staff</option>
                        {staffList.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>
                </div>

                <div className="flex bg-black/40 p-1 rounded-lg border border-white/10">
                    {(['day', 'week', 'month'] as const).map((m) => (
                        <button key={m} onClick={() => { setViewMode(m); setCurrentDate(new Date()); }} className={`flex-1 px-4 py-1.5 rounded-md text-xs font-bold uppercase transition-all ${viewMode === m ? 'bg-white text-black shadow' : 'text-neutral-400 hover:text-white'}`}>
                            {m}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-2 bg-white rounded-lg p-1 shadow-lg">
                    <button onClick={handlePrev} disabled={!canGoBack()} className="p-2 hover:bg-neutral-100 rounded-md text-neutral-600 disabled:opacity-30 disabled:cursor-not-allowed"><ChevronLeft className="h-4 w-4" /></button>
                    <div className="relative flex-1 min-w-[200px] h-9 flex items-center justify-center">
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-sm font-bold text-neutral-900 bg-white">
                            {viewMode === 'week' ? getWeekRangeString(currentDate) : viewMode === 'month' ? currentDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : currentDate.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                        <input type={viewMode === 'day' ? 'date' : viewMode === 'week' ? 'week' : 'month'} value={toInputString(currentDate, viewMode)} onChange={(e) => handleDateChange(e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                    </div>
                    <button onClick={handleNext} disabled={!canGoForward()} className="p-2 hover:bg-neutral-100 rounded-md text-neutral-600 disabled:opacity-30 disabled:cursor-not-allowed"><ChevronRight className="h-4 w-4" /></button>
                </div>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
                <p className="text-neutral-400 text-xs font-bold uppercase tracking-wider mb-1">Revenue ({viewMode})</p>
                <p className="text-4xl font-black text-red-600">₹{totalRevenue.toFixed(2)}</p>
             </div>
             <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm flex items-center justify-between">
                <div><p className="text-neutral-400 text-xs font-bold uppercase tracking-wider mb-1">Transactions</p><p className="text-2xl font-bold text-neutral-900">{sales.length}</p></div>
                <div className="h-12 w-12 bg-neutral-100 rounded-full flex items-center justify-center"><Calendar className="h-6 w-6 text-neutral-400" /></div>
             </div>
          </div>

          <div className="bg-white rounded-2xl border border-neutral-200 shadow-xl overflow-hidden">
             <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                   <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 uppercase text-[10px] tracking-wider font-bold">
                      <tr><th className="p-4">Time</th><th className="p-4">Products</th><th className="p-4">Payment</th><th className="p-4">Sold By</th><th className="p-4 text-right">Amount</th></tr>
                   </thead>
                   <tbody className="divide-y divide-neutral-100">
                      {loading ? <tr><td colSpan={5} className="p-12 text-center text-neutral-500 italic">Fetching records...</td></tr> : sales.length === 0 ? <tr><td colSpan={5} className="p-12 text-center text-neutral-400">No sales found.</td></tr> : sales.map((sale) => (
                           <tr onClick={() => router.push(`/sales/${sale.id}/invoice`)} key={sale.id} className="hover:bg-neutral-50 transition-colors group cursor-pointer">
                              <td className="p-4 whitespace-nowrap"><span className="font-bold text-neutral-900 block">{new Date(sale.saleDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span><span className="text-[10px] text-neutral-400 font-medium">{new Date(sale.saleDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span></td>
                              
                              {/* STAFF COLUMN */}

                              <td className="p-4"><div className="space-y-1">{sale.items.map((item: any) => (<div key={item.id} className="text-neutral-700 font-medium text-xs">{item.product?.name || 'Unknown'} <span className="text-neutral-400">x{item.quantity}</span></div>))}</div></td>
                              <td className="p-4"><span className={`inline-block px-2 py-1 rounded text-[10px] font-bold uppercase ${sale.paymentMode === 'SPLIT' ? 'bg-purple-100 text-purple-700' : 'bg-neutral-100 text-neutral-600'}`}>{sale.paymentMode}</span></td>
                              <td className="p-4">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${sale.staff ? 'bg-blue-50 text-blue-700' : 'bg-orange-50 text-orange-700'}`}>
                                    {sale.staff ? sale.staff.name : 'Admin'}
                                </span>
                              </td>
                              <td className="p-4 text-right"><span className="font-black text-neutral-900 text-lg">₹{Number(sale.totalAmount).toFixed(2)}</span></td>
                           </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>
       </div>
    </main>
  );
}