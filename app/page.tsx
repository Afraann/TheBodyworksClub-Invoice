// app/page.tsx
import Link from 'next/link';
import Image from 'next/image';
import { Plus, FolderOpen, ShoppingBag, BarChart3 } from 'lucide-react';
import bgImg from './bg.jpg';
import logoImg from './logo-round.jpg';

export default function HomePage() {
  return (
    <main className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
      
      {/* Background Image & Overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src={bgImg}
          alt="Gym Background"
          fill
          className="object-cover"
          placeholder="blur"
        />
        <div className="absolute inset-0 bg-neutral-900/10 backdrop-blur-[2px]" />
      </div>

      <div className="relative z-10 w-full max-w-xl bg-white/95 backdrop-blur-md shadow-2xl rounded-3xl border border-white/40 p-8">
        
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="mx-auto h-24 w-24 relative mb-4 rounded-full overflow-hidden border-4 border-white shadow-lg">
            <Image src={logoImg} alt="Logo" fill className="object-cover" />
          </div>
          <h1 className="text-2xl font-black text-neutral-900 tracking-tight uppercase">
            The Bodyworks Club
          </h1>
          <p className="text-xs font-bold text-neutral-400 mt-1 tracking-widest uppercase">
            Billing & POS System
          </p>
        </div>

        {/* Action Grid */}
        <div className="grid grid-cols-2 gap-4">
          
          {/* 1. New Invoice */}
          <Link href="/invoices/new" className="group flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-neutral-100 bg-white hover:border-red-600 hover:bg-red-50 transition-all duration-200 text-center cursor-pointer shadow-sm hover:shadow-xl">
            <div className="h-12 w-12 bg-neutral-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-red-600 transition-colors duration-200">
              <Plus className="h-6 w-6 text-neutral-500 group-hover:text-white" />
            </div>
            <span className="font-bold text-neutral-900 group-hover:text-red-700">New Invoice</span>
            <span className="text-[10px] uppercase font-bold text-neutral-400 mt-1 group-hover:text-red-600/70">Membership Bill</span>
          </Link>

          {/* 2. Gym Shop */}
          <Link href="/shop" className="group flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-neutral-100 bg-white hover:border-blue-600 hover:bg-blue-50 transition-all duration-200 text-center cursor-pointer shadow-sm hover:shadow-xl">
            <div className="h-12 w-12 bg-neutral-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-blue-600 transition-colors duration-200">
              <ShoppingBag className="h-6 w-6 text-neutral-500 group-hover:text-white" />
            </div>
            <span className="font-bold text-neutral-900 group-hover:text-blue-700">Gym Shop</span>
            <span className="text-[10px] uppercase font-bold text-neutral-400 mt-1 group-hover:text-blue-600/70">Store & Gear</span>
          </Link>

          {/* 3. Invoice History */}
          <Link href="/invoices" className="group flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-neutral-100 bg-white hover:border-neutral-400 hover:bg-neutral-50 transition-all duration-200 text-center cursor-pointer shadow-sm hover:shadow-xl">
             <div className="h-12 w-12 bg-neutral-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-neutral-800 transition-colors duration-200">
               <FolderOpen className="h-6 w-6 text-neutral-500 group-hover:text-white" />
             </div>
             <span className="font-bold text-neutral-900">Invoices</span>
             <span className="text-[10px] uppercase font-bold text-neutral-400 mt-1">View Records</span>
          </Link>

          {/* 4. Sales Records */}
          <Link href="/sales" className="group flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-neutral-100 bg-white hover:border-neutral-400 hover:bg-neutral-50 transition-all duration-200 text-center cursor-pointer shadow-sm hover:shadow-xl">
             <div className="h-12 w-12 bg-neutral-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-neutral-800 transition-colors duration-200">
               <BarChart3 className="h-6 w-6 text-neutral-500 group-hover:text-white" />
             </div>
             <span className="font-bold text-neutral-900">Sales</span>
             <span className="text-[10px] uppercase font-bold text-neutral-400 mt-1">Inventory Log</span>
          </Link>

        </div>
        
        <div className="mt-8 text-center border-t border-dashed border-neutral-200 pt-6">
            <p className="text-[10px] text-neutral-400 uppercase tracking-widest font-bold">
                Powered by BlankSpace Agency
            </p>
        </div>
      </div>
    </main>
  );
}