'use client';
import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function InventoryPage() {
  const [formData, setFormData] = useState({ name: '', price: '', stock: '', category: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/products', {
      method: 'POST',
      body: JSON.stringify(formData)
    });
    alert('Product Added');
    setFormData({ name: '', price: '', stock: '', category: '' });
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full p-8 rounded-2xl shadow-xl">
        <div className="flex items-center gap-4 mb-6">
           <Link href="/shop" className="p-2 hover:bg-neutral-100 rounded-full"><ArrowLeft className="h-5 w-5"/></Link>
           <h1 className="text-xl font-bold">Add New Product</h1>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-neutral-500 mb-1">Product Name</label>
            <input 
              className="w-full border p-2 rounded-lg" 
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              required 
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-neutral-500 mb-1">Price</label>
              <input type="number" className="w-full border p-2 rounded-lg" 
                value={formData.price}
                onChange={e => setFormData({...formData, price: e.target.value})}
                required 
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-neutral-500 mb-1">Stock Qty</label>
              <input type="number" className="w-full border p-2 rounded-lg" 
                value={formData.stock}
                onChange={e => setFormData({...formData, stock: e.target.value})}
                required 
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-neutral-500 mb-1">Category</label>
            <input className="w-full border p-2 rounded-lg" placeholder="e.g. Supplements" 
              value={formData.category}
              onChange={e => setFormData({...formData, category: e.target.value})}
            />
          </div>
          <button type="submit" className="w-full bg-neutral-900 text-white font-bold py-3 rounded-xl mt-4">
            Add to Inventory
          </button>
        </form>
      </div>
    </div>
  );
}