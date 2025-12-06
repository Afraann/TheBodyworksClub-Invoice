// app/page.tsx

import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-semibold text-slate-800 mb-2 text-center">
          Gym Billing System
        </h1>
        <p className="text-sm text-slate-500 mb-6 text-center">
          Generate invoices and keep track of payments for your gym.
        </p>

        <div className="space-y-3">
          <Link
            href="/invoices/new"
            className="block w-full text-center rounded-md bg-slate-900 text-white py-2 text-sm font-medium hover:bg-slate-800"
          >
            New Invoice
          </Link>

          <Link
            href="/invoices"
            className="block w-full text-center rounded-md border border-slate-300 text-slate-700 py-2 text-sm font-medium hover:bg-slate-50"
          >
            View Records (coming soon)
          </Link>
        </div>
      </div>
    </main>
  );
}
