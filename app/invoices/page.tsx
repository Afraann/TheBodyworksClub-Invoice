// app/invoices/page.tsx
'use client';

import { useEffect, useState } from 'react';

type InvoiceListItem = {
  id: string;
  invoiceCode: string;
  invoiceNumber: number;
  invoiceDate: string; // ISO string from JSON
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
    // initial load with default range
    loadInvoices({ range: 'month' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
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

  return (
    <main className="min-h-screen bg-neutral-50 flex justify-center py-8 px-4 md:px-8">
      <div className="w-full max-w-6xl space-y-6">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900">
              Invoices
            </h1>
            <p className="text-sm text-neutral-500">
              View and export all generated invoices.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleExportCsv}
              className="px-4 py-2 rounded-lg border border-neutral-300 bg-white text-sm hover:bg-neutral-100"
            >
              Download CSV
            </button>
          </div>
        </header>

        {/* Filters */}
        <section className="bg-white rounded-xl border border-neutral-200 p-4 space-y-3">
          <form
            onSubmit={handleApplyFilters}
            className="flex flex-col md:flex-row md:items-end gap-3"
          >
            <div className="flex-1">
              <label className="block text-xs font-medium text-neutral-600 mb-1">
                Search
              </label>
              <input
                type="text"
                placeholder="Search by name, phone, or invoice code"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-1">
                Date Range
              </label>
              <select
                value={range}
                onChange={(e) => setRange(e.target.value)}
                className="border border-neutral-300 rounded-lg px-3 py-2 text-sm bg-white"
              >
                {RANGE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-neutral-900 text-white text-sm hover:bg-neutral-800"
              >
                Apply
              </button>
              <button
                type="button"
                onClick={handleClearFilters}
                className="px-3 py-2 rounded-lg border border-neutral-300 bg-white text-sm hover:bg-neutral-100"
              >
                Reset
              </button>
            </div>
          </form>
          {loadError && (
            <div className="text-xs text-red-600 mt-1">{loadError}</div>
          )}
        </section>

        {/* Table */}
        <section className="bg-white rounded-xl border border-neutral-200 p-4">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50">
                  <th className="text-left py-2 px-2">Date</th>
                  <th className="text-left py-2 px-2">Invoice</th>
                  <th className="text-left py-2 px-2">Customer</th>
                  <th className="text-left py-2 px-2">Phone</th>
                  <th className="text-left py-2 px-2">Plan</th>
                  <th className="text-right py-2 px-2">Total (₹)</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-6 text-center text-neutral-500"
                    >
                      Loading invoices…
                    </td>
                  </tr>
                )}
                {!loading && invoices.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-6 text-center text-neutral-500"
                    >
                      No invoices found for this filter.
                    </td>
                  </tr>
                )}
                {!loading &&
                  invoices.map((inv) => (
                    <tr
                      key={inv.id}
                      className="border-t border-neutral-100 hover:bg-neutral-50 cursor-pointer"
                      onClick={() =>
                        (window.location.href = `/invoices/${inv.invoiceCode}`)
                      }
                    >
                      <td className="py-2 px-2">
                        {formatDate(inv.invoiceDate)}
                      </td>
                      <td className="py-2 px-2 font-medium">
                        #{inv.invoiceCode}
                      </td>
                      <td className="py-2 px-2">{inv.customerName}</td>
                      <td className="py-2 px-2">{inv.customerPhone}</td>
                      <td className="py-2 px-2 text-neutral-600">
                        {inv.mainItemDescription}
                      </td>
                      <td className="py-2 px-2 text-right">
                        {inv.grandTotal.toFixed(2)}
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
