import Link from 'next/link';
import Image from 'next/image';
import { headers, cookies } from 'next/headers'; // Import cookies
import { redirect } from 'next/navigation'; // Import redirect
import { prisma } from '@/lib/db'; // Import DB to check session
import { Plus, FolderOpen, ShoppingBag, BarChart3, Wallet } from 'lucide-react';
import bgImg from './bg.jpg';
import logoImg from './logo-round.jpg';
import {LogoutButton} from '@/components/LogoutButton';

export default async function HomePage() {
  // 1. Verify Session & Role
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('sessionId')?.value;

  if (!sessionId) redirect('/login');

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    select: { role: true }
  });

  // 2. Redirect Staff to Shop immediately
  if (session?.role === 'STAFF') {
    redirect('/shop');
  }

  // --- ADMIN VIEW (Rest of the component remains the same) ---
  return (
    <main className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
      {/* ... Background Image code ... */}
      <div className="absolute inset-0 z-0">
        <Image src={bgImg} alt="bg" fill className="object-cover" placeholder="blur" />
        <div className="absolute inset-0 bg-neutral-900/10 backdrop-blur-[2px]" />
      </div>

      <div className="relative z-10 w-full max-w-xl bg-white/95 backdrop-blur-md shadow-2xl rounded-3xl border border-white/40 p-8">
         {/* ... Header Code ... */}
         <div className="absolute top-4 left-4">
            <LogoutButton className="text-neutral-400 hover:text-red-600 hover:bg-red-50" minimal />
         </div>
         <div className="text-center mb-8">
            {/* Logo Code */}
            <h1 className="text-2xl font-black text-neutral-900 uppercase">The Bodyworks Club</h1>
            <p className="text-xs font-bold text-neutral-400 mt-1 uppercase">Admin Dashboard</p>
         </div>

         <div className="grid grid-cols-2 gap-4">
            {/* Invoice Link */}
            <Link href="/invoices/new" className="group flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-neutral-100 bg-white hover:border-red-600 transition-all shadow-sm">
               <Plus className="h-8 w-8 text-neutral-400 group-hover:text-red-600 mb-2" />
               <span className="font-bold text-neutral-900">New Invoice</span>
            </Link>

            {/* Shop Link */}
            <Link href="/shop" className="group flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-neutral-100 bg-white hover:border-blue-600 transition-all shadow-sm">
               <ShoppingBag className="h-8 w-8 text-neutral-400 group-hover:text-blue-600 mb-2" />
               <span className="font-bold text-neutral-900">Gym Shop</span>
            </Link>

            {/* Records Link */}
            <Link href="/invoices" className="group flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-neutral-100 bg-white hover:border-neutral-800 transition-all shadow-sm">
               <FolderOpen className="h-8 w-8 text-neutral-400 group-hover:text-neutral-800 mb-2" />
               <span className="font-bold text-neutral-900">Invoices</span>
            </Link>

            <Link href="/sales" className="group flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-neutral-100 bg-white hover:border-yellow-400 transition-all shadow-sm">
               <Wallet className="h-8 w-8 text-neutral-400 group-hover:text-yellow-400 mb-2" />
               <span className="font-bold text-neutral-900">Sales</span>
            </Link>
             {/* NEW Expenses Link */}
            <Link href="/expenses" className="group flex flex-col items-center justify-center col-span-2 p-6 rounded-2xl border-2 border-neutral-100 bg-white hover:border-purple-600 transition-all shadow-sm">
               <Wallet className="h-8 w-8 text-neutral-400 group-hover:text-purple-600 mb-2" />
               <span className="font-bold text-neutral-900">Expenses</span>
            </Link>

         </div>
      </div>
    </main>
  );
}