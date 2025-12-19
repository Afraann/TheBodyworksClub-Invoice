'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Wallet, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import Image from 'next/image';
import bgImg from '../bg.jpg';

const BUSINESS_START_DATE = new Date('2023-01-01'); // Safe fallback

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // --- VIEW STATE ---
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('month'); // Default to month for expenses
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  // --- MODAL STATE ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ title: '', amount: '', category: 'Rent', date: new Date().toISOString().split('T')[0] });

  // --- DATE HELPERS (Reused from Sales Page) ---
  const getToday = () => {
    const d = new Date();
    d.setHours(0,0,0,0);
    return d;
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
    const newDate = new Date(currentDate);
    if (viewMode === 'day') newDate.setDate(newDate.getDate() - 1);
    if (viewMode === 'week') newDate.setDate(newDate.getDate() - 7);
    if (viewMode === 'month') newDate.setMonth(newDate.getMonth() - 1);
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'day') newDate.setDate(newDate.getDate() + 1);
    if (viewMode === 'week') newDate.setDate(newDate.getDate() + 7);
    if (viewMode === 'month') newDate.setMonth(newDate.getMonth() + 1);
    setCurrentDate(newDate);
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
    setCurrentDate(newDate);
  };

  // --- FETCH DATA ---
  const fetchExpenses = () => {
    setLoading(true);
    const isoDate = currentDate.toISOString();
    
    fetch(`/api/expenses?mode=${viewMode}&date=${isoDate}`)
      .then(res => res.json())
      .then(d => {
        setExpenses(d.data || []);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchExpenses();
  }, [viewMode, currentDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/expenses', {
      method: 'POST',
      body: JSON.stringify(form)
    });
    setIsModalOpen(false);
    setForm({ title: '', amount: '', category: 'Rent', date: new Date().toISOString().split('T')[0] });
    fetchExpenses();
  };

  const total = expenses.reduce((sum, item) => sum + Number(item.amount), 0);

  return (
    <main className="min-h-screen bg-neutral-50 p-4 md:p-8 relative">
       {/* Background */}
       <div className="fixed inset-0 z-0 pointer-events-none">
          <Image src={bgImg} alt="bg" fill className="object-cover" />
          <div className="absolute inset-0 bg-neutral-900/80 backdrop-blur-sm" />
       </div>
       
       <div className="relative z-10 max-w-5xl mx-auto space-y-6">
          
          {/* HEADER CONTROL PANEL */}
          <div className="flex flex-col md:flex-row md:items-end justify-between bg-white/10 backdrop-blur-md gap-6 border border-white/10 p-6 rounded-2xl shadow-xl">
             <div>
                <Link href="/" className="inline-flex items-center gap-2 text-neutral-400 hover:text-white mb-2 transition-colors font-medium text-xs uppercase tracking-wider">
                   <ArrowLeft className="h-3 w-3" /> Dashboard
                </Link>
                <h1 className="text-3xl text-white font-black uppercase tracking-tight">
                   Expenses Log
                </h1>
                <p className="text-neutral-400 text-sm">Track monthly and daily operational costs.</p>
             </div>
             
             <div className="flex flex-col gap-3 w-full md:w-auto">
                {/* View Toggles */}
                <div className="flex bg-black/40 p-1 rounded-lg border border-white/10">
                    {(['day', 'week', 'month'] as const).map((m) => (
                        <button
                            key={m}
                            onClick={() => { setViewMode(m); setCurrentDate(new Date()); }}
                            className={`flex-1 px-4 py-1.5 rounded-md text-xs font-bold uppercase transition-all ${viewMode === m ? 'bg-white text-black shadow' : 'text-neutral-400 hover:text-white'}`}
                        >
                            {m}
                        </button>
                    ))}
                </div>

                {/* Date Navigator */}
                <div className="flex items-center gap-2 bg-white rounded-lg p-1 shadow-lg">
                    <button onClick={handlePrev} className="p-2 hover:bg-neutral-100 rounded-md text-neutral-600">
                        <ChevronLeft className="h-4 w-4" />
                    </button>

                    <div className="relative flex-1 min-w-[200px] h-9 flex items-center justify-center">
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-sm font-bold text-neutral-900">
                            {viewMode === 'week' 
                                ? getWeekRangeString(currentDate)
                                : viewMode === 'month' 
                                    ? currentDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
                                    : currentDate.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
                            }
                        </div>
                        <input 
                            type={viewMode === 'day' ? 'date' : viewMode === 'week' ? 'week' : 'month'}
                            value={toInputString(currentDate, viewMode)}
                            onChange={(e) => handleDateChange(e.target.value)}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                    </div>

                    <button onClick={handleNext} className="p-2 hover:bg-neutral-100 rounded-md text-neutral-600">
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>
             </div>
          </div>

          {/* STATS & ADD BUTTON */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm flex flex-col justify-center">
                <p className="text-neutral-400 text-xs font-bold uppercase tracking-wider mb-1">
                    Total Expenses ({viewMode})
                </p>
                <p className="text-4xl font-black text-purple-600">₹{total.toFixed(2)}</p>
             </div>
             
             <button 
                onClick={() => setIsModalOpen(true)} 
                className="bg-purple-600 text-white p-6 rounded-2xl shadow-lg shadow-purple-900/20 hover:bg-purple-700 transition-all flex items-center justify-between group"
             >
                <div className="text-left">
                    <p className="font-bold text-lg">Add New Expense</p>
                    <p className="text-purple-200 text-sm">Log rent, bills, or salary</p>
                </div>
                <div className="h-12 w-12 bg-white/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Plus className="h-6 w-6" />
                </div>
             </button>
          </div>

          {/* TABLE */}
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-xl overflow-hidden">
             <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                   <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 uppercase text-[10px] tracking-wider font-bold">
                      <tr>
                         <th className="p-4">Date</th>
                         <th className="p-4">Title</th>
                         <th className="p-4">Category</th>
                         <th className="p-4 text-right">Amount</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-neutral-100">
                      {loading ? (
                         <tr><td colSpan={4} className="p-12 text-center text-neutral-500 italic">Loading expenses...</td></tr>
                      ) : expenses.length === 0 ? (
                         <tr><td colSpan={4} className="p-12 text-center text-neutral-400">No expenses recorded for this period.</td></tr>
                      ) : (
                         expenses.map(ex => (
                            <tr key={ex.id} className="hover:bg-neutral-50 transition-colors">
                               <td className="p-4 whitespace-nowrap">
                                  <span className="font-bold text-neutral-900 block">
                                     {new Date(ex.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                  </span>
                                  <span className="text-[10px] text-neutral-400 font-medium">
                                     {new Date(ex.date).getFullYear()}
                                  </span>
                               </td>
                               <td className="p-4 font-bold text-neutral-800">{ex.title}</td>
                               <td className="p-4">
                                  <span className="px-2 py-1 bg-neutral-100 border border-neutral-200 rounded text-[10px] font-bold uppercase text-neutral-600">
                                     {ex.category}
                                  </span>
                               </td>
                               <td className="p-4 text-right font-black text-neutral-900">₹{Number(ex.amount).toFixed(2)}</td>
                            </tr>
                         ))
                      )}
                   </tbody>
                </table>
             </div>
          </div>
       </div>

       {/* MODAL */}
       {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
             <div className="bg-white w-full text-neutral-800 max-w-md p-6 rounded-2xl shadow-2xl">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <div className="p-2 bg-purple-100 rounded-lg text-purple-600"><Wallet className="h-5 w-5" /></div>
                    Add Expense
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                   <div>
                      <label className="text-xs font-bold uppercase text-neutral-800 ml-1">Title</label>
                      <input className="w-full border p-3 rounded-lg mt-1 outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500" placeholder="e.g. Electricity Bill" value={form.title} onChange={e=>setForm({...form, title: e.target.value})} required />
                   </div>
                   
                   <div className="grid grid-cols-2 gap-4">
                       <div>
                          <label className="text-xs font-bold uppercase text-neutral-800 ml-1">Amount (₹)</label>
                          <input className="w-full border p-3 rounded-lg mt-1 outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-bold" type="number" placeholder="0.00" value={form.amount} onChange={e=>setForm({...form, amount: e.target.value})} required />
                       </div>
                       <div>
                          <label className="text-xs font-bold uppercase text-neutral-800 ml-1">Category</label>
                          <select className="w-full border p-3 rounded-lg mt-1 outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 bg-white" value={form.category} onChange={e=>setForm({...form, category: e.target.value})}>
                              <option>Rent</option><option>Salary</option><option>Bill</option><option>Maintenance</option><option>Stock Purchase</option><option>Other</option>
                          </select>
                       </div>
                   </div>

                   <div>
                      <label className="text-xs font-bold uppercase text-neutral-500 ml-1">Date</label>
                      <input className="w-full border p-3 rounded-lg mt-1 outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500" type="date" value={form.date} onChange={e=>setForm({...form, date: e.target.value})} required />
                   </div>

                   <div className="flex gap-3 pt-2">
                      <button type="button" onClick={()=>setIsModalOpen(false)} className="flex-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 p-3 rounded-xl font-bold transition-colors">Cancel</button>
                      <button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-xl font-bold transition-colors shadow-lg shadow-purple-600/20">Save Expense</button>
                   </div>
                </form>
             </div>
          </div>
       )}
    </main>
  );
}