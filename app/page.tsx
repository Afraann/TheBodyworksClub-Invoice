// app/page.tsx
import Link from 'next/link';
import Image from 'next/image';
import { Plus, FolderOpen } from 'lucide-react';

// 1. IMPORT THE IMAGES
import bgImg from './bg.jpg';
import logoImg from './logo-round.jpg';

export default function HomePage() {
  return (
    <main className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
      
      {/* Background Image & Overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src={bgImg} // 2. USE THE IMPORTED VARIABLE
          alt="Gym Background"
          fill
          className="object-cover"
          priority
          placeholder="blur" // Optional: adds a blur effect while loading
        />
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      </div>

      {/* Content Card */}
      <div className="relative z-10 w-full max-w-lg bg-white/95 backdrop-blur shadow-2xl rounded-2xl border border-white/20 p-8">
        
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="mx-auto h-24 w-24 relative mb-4 rounded-full overflow-hidden border-4 border-white shadow-lg">
            <Image
              src={logoImg} // 2. USE THE IMPORTED VARIABLE
              alt="Shop Logo"
              fill
              className="object-cover"
            />
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">
            The Bodyworks Club Billing System
          </h1>
          <p className="text-sm text-neutral-500 mt-2">
            Manage your gym's invoices and records efficiently.
          </p>
        </div>

        {/* Action Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* Card 1: New Invoice */}
          <Link
            href="/invoices/new"
            className="group flex flex-col items-center justify-center p-6 rounded-xl border-2 border-neutral-100 bg-white hover:border-red-600 hover:bg-red-50/30 transition-all duration-200 text-center cursor-pointer shadow-sm hover:shadow-md"
          >
            <div className="h-12 w-12 bg-neutral-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-red-600 transition-colors duration-200">
              <Plus className="h-6 w-6 text-neutral-500 group-hover:text-white" />
            </div>
            <span className="font-bold text-neutral-900 group-hover:text-red-700">New Invoice</span>
            <span className="text-xs text-neutral-400 mt-1 group-hover:text-red-600/70">Generate a Bill</span>
          </Link>

          {/* Card 2: View Records */}
          <Link
            href="/invoices"
            className="group flex flex-col items-center justify-center p-6 rounded-xl border-2 border-neutral-100 bg-white hover:border-neutral-800 hover:bg-neutral-50 transition-all duration-200 text-center cursor-pointer shadow-sm hover:shadow-md"
          >
            <div className="h-12 w-12 bg-neutral-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-neutral-800 transition-colors duration-200">
              <FolderOpen className="h-6 w-6 text-neutral-500 group-hover:text-white" />
            </div>
            <span className="font-bold text-neutral-900">View Records</span>
            <span className="text-xs text-neutral-400 mt-1">Check past transactions</span>
          </Link>

        </div>
        
        {/* Footer Branding */}
        <div className="mt-10 text-center border-t border-dashed border-neutral-200 pt-6">
            <p className="text-[10px] text-neutral-400 uppercase tracking-widest font-semibold">
                BlankSpace Agency
            </p>
        </div>
      </div>
    </main>
  );
}