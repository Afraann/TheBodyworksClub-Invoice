'use client';

import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface LogoutButtonProps {
  className?: string;
  minimal?: boolean; // If true, only shows icon on mobile
}

export function LogoutButton({ className = '', minimal = false }: LogoutButtonProps) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login'); // Redirect to login
      router.refresh();      // Clear any cached data
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  return (
    <button 
      onClick={handleLogout} 
      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all active:scale-95 ${className}`}
      title="Sign Out"
    >
      <LogOut className="h-4 w-4" />
      <span className={minimal ? 'hidden md:inline' : 'inline'}>Logout</span>
    </button>
  );
}