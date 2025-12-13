'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Wallet } from 'lucide-react';
import Image from 'next/image';
import bgImg from '../bg.jpg';

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ title: '', amount: '', category: 'Rent', date: new Date().toISOString().split('T')[0] });

  const fetchExpenses = () => {
    fetch('/api/expenses').then(res => res.json()).then(d => setExpenses(d.data || []));
  };

  useEffect(() => fetchExpenses(), []);

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
    <main className="min-h-screen bg-neutral-50 p-6 relative">
       {/* Background */}
       <div className="fixed inset-0 z-0 pointer-events-none"><Image src={bgImg} alt="bg" fill className="object-cover opacity-10" /></div>
       
       <div className="relative z-10 max-w-4xl mx-auto">
          <header className="flex justify-between items-center mb-8">
             <div>
                <Link href="/" className="text-neutral-500 hover:text-black flex items-center gap-2 mb-2"><ArrowLeft className="h-4 w-4"/> Back</Link>
                <h1 className="text-3xl font-black text-neutral-900">Expenses Log</h1>
             </div>
             <button onClick={() => setIsModalOpen(true)} className="bg-purple-600 text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-purple-700">
                <Plus className="h-5 w-5" /> Add Expense
             </button>
          </header>

          <div className="bg-white p-6 rounded-2xl shadow-lg border border-neutral-200 mb-6">
             <p className="text-neutral-500 font-bold uppercase text-xs">Total Expenses</p>
             <p className="text-4xl font-black text-purple-600">₹{total.toFixed(2)}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-neutral-200 overflow-hidden">
             <table className="w-full text-left">
                <thead className="bg-neutral-50 border-b border-neutral-200 text-xs font-bold text-neutral-500 uppercase">
                   <tr><th className="p-4">Date</th><th className="p-4">Title</th><th className="p-4">Category</th><th className="p-4 text-right">Amount</th></tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-neutral-800 text-sm">
                   {expenses.map(ex => (
                      <tr key={ex.id}>
                         <td className="p-4">{new Date(ex.date).toLocaleDateString()}</td>
                         <td className="p-4 font-bold text-neutral-800">{ex.title}</td>
                         <td className="p-4"><span className="px-2 py-1 bg-neutral-100 rounded text-xs font-bold">{ex.category}</span></td>
                         <td className="p-4 text-right font-bold">₹{Number(ex.amount).toFixed(2)}</td>
                      </tr>
                   ))}
                </tbody>
             </table>
          </div>
       </div>

       {/* MODAL */}
       {isModalOpen && (
          <div className="fixed inset-0 text-black z-50 flex items-center justify-center bg-black/50 p-4">
             <div className="bg-white w-full max-w-md p-6 rounded-2xl shadow-2xl">
                <h2 className="text-xl font-bold mb-4">Add Expense</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                   <input className="w-full border p-3 rounded-lg" placeholder="Expense Title (e.g. EB Bill)" value={form.title} onChange={e=>setForm({...form, title: e.target.value})} required />
                   <input className="w-full border p-3 rounded-lg" type="number" placeholder="Amount" value={form.amount} onChange={e=>setForm({...form, amount: e.target.value})} required />
                   <select className="w-full border p-3 rounded-lg" value={form.category} onChange={e=>setForm({...form, category: e.target.value})}>
                      <option>Rent</option><option>Salary</option><option>Bill</option><option>Maintenance</option><option>Other</option>
                   </select>
                   <input className="w-full border p-3 rounded-lg" type="date" value={form.date} onChange={e=>setForm({...form, date: e.target.value})} required />
                   <div className="flex gap-2">
                      <button type="button" onClick={()=>setIsModalOpen(false)} className="flex-1 bg-neutral-100 p-3 rounded-lg font-bold">Cancel</button>
                      <button type="submit" className="flex-1 bg-purple-600 text-white p-3 rounded-lg font-bold">Save</button>
                   </div>
                </form>
             </div>
          </div>
       )}
    </main>
  );
}