// components/PrintButton.tsx
'use client';

import { Printer } from 'lucide-react';

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="flex items-center gap-2 px-4 py-2 bg-white text-neutral-900 rounded-lg text-xs font-bold uppercase tracking-wide hover:bg-neutral-200 transition-colors shadow-md"
    >
      <Printer className="h-4 w-4" />
      Print Invoice
    </button>
  );
}