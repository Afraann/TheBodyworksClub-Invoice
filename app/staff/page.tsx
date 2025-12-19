'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2, User, KeyRound, Shield } from 'lucide-react';
import Image from 'next/image';
import bgImg from '../bg.jpg';

export default function StaffPage() {
  const [staffList, setStaffList] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ name: '', pin: '' });
  const [loading, setLoading] = useState(true);

  const fetchStaff = () => {
    setLoading(true);
    fetch('/api/staff')
      .then(res => res.json())
      .then(d => {
        setStaffList(d.data || []);
        setLoading(false);
      });
  };

  useEffect(() => fetchStaff(), []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.pin.length !== 4) {
        alert("PIN must be 4 digits");
        return;
    }
    await fetch('/api/staff', { method: 'POST', body: JSON.stringify(form) });
    setIsModalOpen(false);
    setForm({ name: '', pin: '' });
    fetchStaff();
  };

  const handleDelete = async (id: string) => {
    if(!confirm('Remove this staff member? They will no longer be able to log in.')) return;
    await fetch(`/api/staff/${id}`, { method: 'DELETE' });
    fetchStaff();
  };

  return (
    <main className="min-h-screen bg-neutral-50 p-4 md:p-8 relative font-sans text-neutral-900">
       {/* Background */}
       <div className="fixed inset-0 z-0 pointer-events-none">
          <Image src={bgImg} alt="bg" fill className="object-cover" />
          <div className="absolute inset-0 bg-neutral-900/80 backdrop-blur-sm" />
       </div>
       
       <div className="relative z-10 max-w-4xl mx-auto space-y-6">
          
          {/* HEADER */}
          <div className="flex flex-col md:flex-row md:items-end justify-between bg-white/10 backdrop-blur-md gap-6 border border-white/10 p-6 rounded-2xl shadow-xl">
             <div>
                <Link href="/" className="inline-flex items-center gap-2 text-neutral-400 hover:text-white mb-2 transition-colors font-medium text-xs uppercase tracking-wider">
                   <ArrowLeft className="h-3 w-3" /> Dashboard
                </Link>
                <h1 className="text-3xl text-white font-black uppercase tracking-tight">
                   Manage Staff
                </h1>
                <p className="text-neutral-400 text-sm">Control access and create individual logins.</p>
             </div>
             
             <button 
                onClick={() => setIsModalOpen(true)} 
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-orange-900/20 transition-all active:scale-95"
             >
                <Plus className="h-5 w-5" /> Add New Staff
             </button>
          </div>

          {/* STAFF GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {/* Admin Card (Static) */}
             <div className="bg-white p-6 rounded-2xl border-l-4 border-l-red-600 shadow-sm flex justify-between items-center opacity-70 grayscale-[0.5]">
                <div className="flex items-center gap-4">
                   <div className="h-12 w-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
                      <Shield className="h-6 w-6" />
                   </div>
                   <div>
                      <h3 className="font-bold text-lg text-neutral-900">Admin</h3>
                      <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Root Access</p>
                   </div>
                </div>
             </div>

             {/* Staff List */}
             {loading ? (
                 <div className="col-span-1 md:col-span-2 text-white/50 text-center py-8">Loading staff list...</div>
             ) : (
                 staffList.map(staff => (
                    <div key={staff.id} className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-md flex justify-between items-center group hover:border-orange-200 transition-colors">
                       <div className="flex items-center gap-4">
                          <div className="h-12 w-12 bg-neutral-100 text-neutral-500 group-hover:bg-orange-50 group-hover:text-orange-500 transition-colors rounded-full flex items-center justify-center">
                             <User className="h-6 w-6" />
                          </div>
                          <div>
                             <h3 className="font-bold text-lg text-neutral-900">{staff.name}</h3>
                             <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Staff Account</p>
                          </div>
                       </div>
                       
                       <button 
                          onClick={() => handleDelete(staff.id)} 
                          className="p-3 text-neutral-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                          title="Remove Staff"
                       >
                          <Trash2 className="h-5 w-5" />
                       </button>
                    </div>
                 ))
             )}
          </div>

       </div>

       {/* MODAL */}
       {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
             <div className="bg-white w-full max-w-sm p-8 rounded-3xl shadow-2xl">
                <div className="flex items-center gap-3 mb-6 text-orange-600">
                    <div className="p-3 bg-orange-50 rounded-xl"><User className="h-6 w-6" /></div>
                    <h2 className="text-xl font-black uppercase tracking-tight text-neutral-900">New Staff</h2>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-5">
                   <div>
                      <label className="text-xs font-bold uppercase text-neutral-400 ml-1">Full Name</label>
                      <input 
                        className="w-full border-2 border-neutral-100 p-4 rounded-xl mt-1 outline-none focus:border-orange-500 font-bold text-neutral-900 placeholder:text-neutral-300 transition-colors" 
                        placeholder="e.g. John Doe" 
                        value={form.name} 
                        onChange={e=>setForm({...form, name: e.target.value})} 
                        required 
                      />
                   </div>
                   <div>
                      <label className="text-xs font-bold uppercase text-neutral-400 ml-1">Access PIN (4 Digits)</label>
                      <div className="relative">
                        <KeyRound className="absolute left-4 top-4 h-5 w-5 text-neutral-300" />
                        <input 
                            className="w-full border-2 border-neutral-100 p-4 pl-12 rounded-xl mt-1 outline-none focus:border-orange-500 font-mono text-center text-xl tracking-[0.5em] font-bold text-neutral-900 placeholder:text-neutral-200 transition-colors" 
                            type="tel" 
                            maxLength={4} 
                            placeholder="0000" 
                            value={form.pin} 
                            onChange={e=>setForm({...form, pin: e.target.value.replace(/\D/g, '')})} 
                            required 
                        />
                      </div>
                   </div>
                   
                   <div className="flex gap-3 pt-4">
                      <button type="button" onClick={()=>setIsModalOpen(false)} className="flex-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 p-4 rounded-xl font-bold transition-colors">Cancel</button>
                      <button type="submit" className="flex-1 bg-orange-500 hover:bg-orange-600 text-white p-4 rounded-xl font-bold transition-colors shadow-lg shadow-orange-200">Create</button>
                   </div>
                </form>
             </div>
          </div>
       )}
    </main>
  );
}