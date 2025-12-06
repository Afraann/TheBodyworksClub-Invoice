// app/invoices/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Search, 
  Calendar, 
  Download, 
  Filter, 
  FileText, 
  Plus, 
  Home, 
  Loader2, 
  ArrowRight, 
  AlertCircle 
} from 'lucide-react';

// Import local assets
import bgImg from '../bg.jpg';

type InvoiceListItem = {
  id: string;
  invoiceCode: string;
  invoiceNumber: number;
  invoiceDate: string;
  customerName: string;
  customerPhone: string;
  grandTotal: number;
  mainItemDescription: string;
};

type ApiResponse = {
  success: boolean;
  data?: {
    invoices: InvoiceListItem[];
  };
  error?: {
    message: string;
  };
};

const RANGE_OPTIONS = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'Last 7 days' },
  { value: 'month', label: 'Last 30 days' },
  { value: 'all', label: 'All time' },
];

export default function InvoicesPage() {
  const router = useRouter();
  
  const [invoices, setInvoices] = useState<InvoiceListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [searchText, setSearchText] = useState('');
  const [range, setRange] = useState('month');

  async function loadInvoices(params?: { search?: string; range?: string }) {
    try {
      setLoading(true);
      setLoadError(null);

      const search = params?.search ?? searchText;
      const r = params?.range ?? range;

      const url = new URL(window.location.origin + '/api/invoices');
      if (search.trim()) {
        url.searchParams.set('search', search.trim());
      }
      if (r) {
        url.searchParams.set('range', r);
      }

      const res = await fetch(url.toString(), { cache: 'no-store' });
      const data: ApiResponse = await res.json();

      if (!res.ok || !data.success || !data.data) {
        throw new Error(data.error?.message || 'Failed to load invoices');
      }

      setInvoices(data.data.invoices);
    } catch (err: any) {
      console.error(err);
      setLoadError(err?.message || 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInvoices({ range: 'month' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  function handleApplyFilters(e: React.FormEvent) {
    e.preventDefault();
    loadInvoices({ search: searchText, range });
  }

  function handleClearFilters() {
    setSearchText('');
    setRange('month');
    loadInvoices({ search: '', range: 'month' });
  }

  function handleExportCsv() {
    const url = new URL(window.location.origin + '/api/invoices/export');
    if (searchText.trim()) {
      url.searchParams.set('search', searchText.trim());
    }
    if (range) {
      url.searchParams.set('range', range);
    }
    window.open(url.toString(), '_blank');
  }

  // --- Helper for Currency ---
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <main className="min-h-screen relative flex flex-col items-center p-4 md:p-8">
      
      {/* 1. Background Image & Overlay */}
      <div className="fixed inset-0 z-0">
        <Image
          src={bgImg}
          alt="Gym Background"
          fill
          className="object-cover"
          placeholder="blur"
        />
        <div className="absolute inset-0 bg-neutral-900/80 backdrop-blur-sm" />
      </div>

      <div className="relative z-10 w-full max-w-6xl space-y-6">
        
        {/* 2. Header Section */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/10 backdrop-blur-md border border-white/10 p-6 rounded-2xl shadow-xl">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <FileText className="h-6 w-6 text-red-500" />
              Invoice Records
            </h1>
            <p className="text-neutral-400 text-sm mt-1">
              View and export all generated invoices.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/"
              className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-sm font-medium transition-colors border border-white/10"
            >
              <Home className="h-4 w-4" />
              Dashboard
            </Link>
            <Link
              href="/invoices/new"
              className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-sm font-medium transition-colors border border-white/10"
            >
              <Plus className="h-4 w-4" />
              New Invoice
            </Link>
            <button
              type="button"
              onClick={handleExportCsv}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-red-900/20"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
          </div>
        </header>

        {/* 3. Filters Section */}
        <section className="bg-white rounded-xl border border-neutral-200 p-5 shadow-sm">
          <form
            onSubmit={handleApplyFilters}
            className="flex flex-col md:flex-row md:items-end gap-4"
          >
            {/* Search Input */}
            <div className="flex-1 space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500 ml-1">
                Search
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-neutral-400" />
                </div>
                <input
                  type="text"
                  placeholder="Name, Phone, or ID..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600 transition-all"
                />
              </div>
            </div>

            {/* Date Range Select */}
            <div className="space-y-1.5 w-full md:w-48">
              <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500 ml-1">
                Range
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-4 w-4 text-neutral-400" />
                </div>
                <select
                  value={range}
                  onChange={(e) => setRange(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600 transition-all appearance-none cursor-pointer"
                >
                  {RANGE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2.5 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors shadow-md"
              >
                <Filter className="h-4 w-4" />
                Apply
              </button>
              <button
                type="button"
                onClick={handleClearFilters}
                className="px-5 py-2.5 bg-white border border-neutral-200 text-neutral-600 rounded-lg text-sm font-medium hover:bg-neutral-50 transition-colors"
              >
                Reset
              </button>
            </div>
          </form>

          {loadError && (
            <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {loadError}
            </div>
          )}
        </section>

        {/* 4. Data Table */}
        <section className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-500">
                  <th className="text-left py-3 px-4 font-semibold">Date</th>
                  <th className="text-left py-3 px-4 font-semibold">Invoice #</th>
                  <th className="text-left py-3 px-4 font-semibold">Customer</th>
                  <th className="text-left py-3 px-4 font-semibold">Phone</th>
                  <th className="text-left py-3 px-4 font-semibold">Plan</th>
                  <th className="text-right py-3 px-4 font-semibold">Total</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {loading && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-neutral-500">
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-6 w-6 animate-spin text-red-600" />
                        <span className="text-xs font-medium">Loading invoices...</span>
                      </div>
                    </td>
                  </tr>
                )}

                {!loading && invoices.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-neutral-500">
                      <div className="flex flex-col items-center gap-2">
                        <div className="h-10 w-10 bg-neutral-100 rounded-full flex items-center justify-center">
                          <Search className="h-5 w-5 text-neutral-400" />
                        </div>
                        <p>No invoices found matching your criteria.</p>
                      </div>
                    </td>
                  </tr>
                )}

                {!loading && invoices.map((inv) => (
                  <tr
                    key={inv.id}
                    onClick={() => router.push(`/invoices/${inv.invoiceCode}`)}
                    className="group hover:bg-red-50/30 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-4 text-neutral-600 whitespace-nowrap">
                      {formatDate(inv.invoiceDate)}
                    </td>
                    <td className="py-3 px-4 font-medium text-neutral-900">
                      #{inv.invoiceCode}
                    </td>
                    <td className="py-3 px-4 text-neutral-900 font-medium">
                      {inv.customerName}
                    </td>
                    <td className="py-3 px-4 text-neutral-600 font-mono text-xs">
                      {inv.customerPhone}
                    </td>
                    <td className="py-3 px-4 text-neutral-600 max-w-[200px] truncate">
                      {inv.mainItemDescription}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-neutral-900">
                      {formatCurrency(inv.grandTotal)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <ArrowRight className="h-4 w-4 text-neutral-300 group-hover:text-red-600 transition-colors" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </main>
  );
}