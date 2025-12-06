// app/login/page.tsx
'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Lock, ArrowRight } from 'lucide-react';

// 1. IMPORT THE IMAGES (Note the ../)
import bgImg from '../bg.jpg';
import logoImg from '../logo-round.jpg';

export default function LoginPage() {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/';

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!pin.trim()) {
      setError('PIN is required');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });

      const data = await res.json();

      if (!res.ok || !data?.success) {
        setError(data?.error?.message || 'Login failed');
        setLoading(false);
        return;
      }

      router.push(redirectTo);
    } catch (err) {
      console.error(err);
      setError('Something went wrong');
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
      
      {/* Background Image & Overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src={bgImg} // 2. USE IMPORTED VARIABLE
          alt="Gym Background"
          fill
          className="object-cover"
          priority
          placeholder="blur"
        />
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
      </div>

      <div className="relative z-10 w-full max-w-sm bg-white/95 backdrop-blur rounded-2xl shadow-2xl p-8 border border-white/20">
        
        {/* Logo Section */}
        <div className="flex flex-col items-center mb-6">
           <div className="h-20 w-20 relative rounded-full overflow-hidden border-4 border-white shadow-md mb-4">
             <Image 
               src={logoImg} // 2. USE IMPORTED VARIABLE
               alt="Gym Logo" 
               fill 
               className="object-cover" 
             />
           </div>
           <h1 className="text-xl font-bold text-neutral-900">Welcome Back</h1>
           <p className="text-xs text-neutral-500 mt-1">Enter your access PIN to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-4 w-4 text-neutral-400" />
              </div>
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:ring-2 focus:ring-red-600/20 focus:border-red-600 outline-none transition-all placeholder:text-neutral-400 text-center tracking-widest font-bold text-lg"
                placeholder="••••"
                autoComplete="off"
                maxLength={4}
              />
            </div>
          </div>

          {error && (
            <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 text-center font-medium">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-neutral-900 text-white py-3 text-sm font-semibold hover:bg-red-600 active:bg-red-700 transition-colors shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? 'Verifying...' : 'Access System'}
            {!loading && <ArrowRight className="h-4 w-4" />}
          </button>
        </form>
        
        <div className="mt-8 text-center">
           <p className="text-[10px] text-neutral-400 uppercase tracking-widest">The Bodyworks Club</p>
        </div>
      </div>
    </main>
  );
}