// app/invoices/new/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { calculateInvoiceTotals, type LineItemInput } from '@/lib/calculations';
import { 
  User, 
  Phone, 
  Dumbbell, 
  Calendar, 
  CreditCard, 
  Check, 
  Plus, 
  Sparkles,
  Timer,
  ChevronLeft
} from 'lucide-react';

// Import local background image (adjust path if needed)
import bgImg from '../../bg.jpg';

const CUSTOM_PLAN_CODE = 'CUSTOM';
const PT_PLAN_CODE = 'PT_20_SESSIONS';

type Plan = {
  id: string;
  code: string;
  name: string;
  durationDays: number | null;
  baseAmount: number;
  isTaxable: boolean;
  gstRate: number;
};

// --- Helper Component ---
const InputField = ({ 
  icon: Icon, 
  label, 
  ...props 
}: any) => (
  <div className="space-y-1.5">
    <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500 ml-1">
      {label}
    </label>
    <div className="relative group">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Icon className="h-4 w-4 text-neutral-400 group-focus-within:text-red-600 transition-colors" />
      </div>
      <input
        {...props}
        className="block w-full pl-10 pr-3 py-2.5 bg-white border border-neutral-200 rounded-lg text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600 transition-all"
      />
    </div>
  </div>
);

export default function NewInvoicePage() {
  const router = useRouter();

  const [plans, setPlans] = useState<Plan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [plansError, setPlansError] = useState<string | null>(null);

  // Form State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedPlanCode, setSelectedPlanCode] = useState('');
  const [hasRegistrationFee, setHasRegistrationFee] = useState(false);
  const [includePT, setIncludePT] = useState(false);

  // Custom Plan State
  const [customLabel, setCustomLabel] = useState('');
  const [customAmount, setCustomAmount] = useState<string>('');
  const [customDurationDays, setCustomDurationDays] = useState<string>('');

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // 1. Fetch Plans
  useEffect(() => {
    async function fetchPlans() {
      try {
        setLoadingPlans(true);
        setPlansError(null);
        const res = await fetch('/api/plans');
        const data = await res.json();

        if (!res.ok || !data?.success) {
          throw new Error(data?.error?.message || 'Failed to load plans');
        }

        setPlans(data.data.plans);
      } catch (err: any) {
        console.error(err);
        setPlansError(err?.message || 'Failed to load plans');
      } finally {
        setLoadingPlans(false);
      }
    }

    fetchPlans();
  }, []);

  // 2. Filter Plans
  const membershipPlans = useMemo(
    () => plans.filter((p) => p.code !== PT_PLAN_CODE),
    [plans],
  );

  const ptPlan = useMemo(
    () => plans.find((p) => p.code === PT_PLAN_CODE) || null,
    [plans],
  );

  // 3. Calculate Totals
  const totals = useMemo(() => {
    const items: LineItemInput[] = [];

    // Add Membership
    if (selectedPlanCode) {
      if (selectedPlanCode === CUSTOM_PLAN_CODE) {
        const amt = Number(customAmount || 0);
        if (amt > 0) {
          items.push({
            amount: amt,
            isTaxable: true,
            gstRate: 18,
          });
        }
      } else {
        const plan = membershipPlans.find((p) => p.code === selectedPlanCode);
        if (plan) {
          items.push({
            amount: plan.baseAmount,
            isTaxable: plan.isTaxable,
            gstRate: plan.gstRate,
          });
        }
      }
    }

    // Add Reg Fee
    const regFeeNum = hasRegistrationFee ? 499 : 0;
    if (regFeeNum > 0) {
      items.push({
        amount: regFeeNum,
        isTaxable: false,
        gstRate: 0,
      });
    }

    // Add PT
    if (includePT && ptPlan) {
      items.push({
        amount: ptPlan.baseAmount,
        isTaxable: false,
        gstRate: 0,
      });
    }

    if (items.length === 0) return null;

    return calculateInvoiceTotals(items);
  }, [
    selectedPlanCode,
    customAmount,
    hasRegistrationFee,
    includePT,
    membershipPlans,
    ptPlan,
  ]);

  // 4. Handle Submit
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitError(null);

    if (!customerName.trim()) {
      setSubmitError('Customer name is required');
      return;
    }
    if (!customerPhone.trim()) {
      setSubmitError('Customer phone is required');
      return;
    }
    if (!selectedPlanCode) {
      setSubmitError('Please select a membership plan');
      return;
    }

    const regFeeNum = hasRegistrationFee ? 499 : 0;
    const payload: any = {
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      membership: {
        planCode: selectedPlanCode,
      },
      registrationFee: regFeeNum,
      includePersonalTrainer: includePT,
    };

    if (selectedPlanCode === CUSTOM_PLAN_CODE) {
      const amt = Number(customAmount || 0);
      const duration = customDurationDays ? Number(customDurationDays) : null;

      if (!customLabel.trim()) {
        setSubmitError('Custom plan label is required');
        return;
      }
      if (!amt || !Number.isFinite(amt) || amt <= 0) {
        setSubmitError('Custom amount must be greater than 0');
        return;
      }

      payload.customMembership = {
        label: customLabel.trim(),
        amount: amt,
        durationDays: duration,
      };
    }

    try {
      setSubmitting(true);
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data?.success) {
        setSubmitError(
          data?.error?.message || 'Failed to create invoice. Please try again.',
        );
        setSubmitting(false);
        return;
      }

      const invoice = data.data.invoice;
      router.push(`/invoices/${invoice.invoiceCode}`);
    } catch (err: any) {
      console.error(err);
      setSubmitError(err?.message || 'Something went wrong');
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen relative flex justify-center py-10 px-4 md:px-8 font-sans text-neutral-900">
      
      {/* Background Image & Overlay */}
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

      <div className="relative z-10 w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT (FORM) - Spans 8 cols */}
        <section className="lg:col-span-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                  <div className="h-8 w-1 bg-red-600 rounded-full" />
                  New Invoice
                </h1>
                <p className="text-neutral-400 mt-1 ml-3 text-sm">
                  Create an invoice for gym access.
                </p>
              </div>
              <Link 
                href="/"
                className="flex items-center gap-2 text-white/70 hover:text-white text-sm bg-white/5 hover:bg-white/10 px-3 py-2 rounded-lg transition-colors border border-white/10"
              >
                <ChevronLeft className="h-4 w-4" />
                Back to Dashboard
              </Link>
            </header>

            {/* CUSTOMER DETAILS */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
              <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                <User className="h-5 w-5 text-red-600" />
                Customer Details
              </h2>
              
              <div className="grid gap-6 md:grid-cols-2">
                <InputField
                  icon={User}
                  type="text"
                  value={customerName}
                  onChange={(e: any) => setCustomerName(e.target.value)}
                  placeholder="Full Name"
                />
                <InputField
                  icon={Phone}
                  type="tel"
                  value={customerPhone}
                  onChange={(e: any) => setCustomerPhone(e.target.value)}
                  placeholder="Phone Number"
                />
              </div>
            </div>

            {/* MEMBERSHIP PLANS */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2 ml-1">
                <Dumbbell className="h-5 w-5 text-red-500" />
                Select Membership
              </h2>

              {loadingPlans ? (
                <div className="p-8 text-center text-neutral-400 bg-white/5 rounded-xl border border-dashed border-neutral-700">
                  Loading plans...
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {membershipPlans.map((plan) => {
                    const isSelected = selectedPlanCode === plan.code;
                    return (
                      <div
                        key={plan.id}
                        onClick={() => setSelectedPlanCode(plan.code)}
                        className={`
                          relative cursor-pointer rounded-xl p-5 border-2 transition-all duration-200
                          flex flex-col justify-between min-h-[140px] group shadow-sm
                          ${isSelected 
                            ? 'border-red-600 bg-red-50 shadow-md ring-1 ring-red-600' 
                            : 'border-transparent bg-white/95 hover:border-red-600/50 hover:bg-white'
                          }
                        `}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className={`p-2 rounded-lg ${isSelected ? 'bg-red-100 text-red-700' : 'bg-neutral-100 text-neutral-500 group-hover:bg-red-50 group-hover:text-red-600'}`}>
                            <Calendar className="h-5 w-5" />
                          </div>
                          {isSelected && (
                            <div className="bg-red-600 text-white p-1 rounded-full">
                              <Check className="h-3 w-3" />
                            </div>
                          )}
                        </div>
                        
                        <div>
                          <p className={`font-bold text-lg leading-tight ${isSelected ? 'text-red-900' : 'text-neutral-900'}`}>
                            {plan.name}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xl font-bold text-neutral-900">₹{plan.baseAmount}</span>
                            <span className="text-xs text-neutral-500 font-medium px-2 py-0.5 bg-neutral-100 rounded-full">
                              {plan.durationDays} Days
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Custom Plan Card */}
                  <div
                    onClick={() => setSelectedPlanCode(CUSTOM_PLAN_CODE)}
                    className={`
                      relative cursor-pointer rounded-xl p-5 border-2 border-dashed transition-all duration-200
                      flex flex-col justify-center items-center min-h-[140px] gap-3
                      ${selectedPlanCode === CUSTOM_PLAN_CODE 
                        ? 'border-red-600 bg-red-50 ring-1 ring-red-600' 
                        : 'border-neutral-600 bg-white/10 hover:bg-white/20 hover:border-red-400'
                      }
                    `}
                  >
                     <div className={`p-2 rounded-full ${selectedPlanCode === CUSTOM_PLAN_CODE ? 'bg-red-100 text-red-600' : 'bg-neutral-800 text-neutral-400'}`}>
                        <Plus className="h-6 w-6" />
                     </div>
                     <p className={`font-semibold text-sm ${selectedPlanCode === CUSTOM_PLAN_CODE ? 'text-neutral-900' : 'text-neutral-400'}`}>Custom Plan</p>
                  </div>
                </div>
              )}
            </div>

            {/* Custom Plan Fields (Conditionally Rendered) */}
            {selectedPlanCode === CUSTOM_PLAN_CODE && (
              <div className="bg-white/95 backdrop-blur rounded-xl p-6 border-l-4 border-red-600 shadow-lg animate-in fade-in slide-in-from-top-4 duration-300">
                <h3 className="text-sm font-bold text-red-700 uppercase tracking-wide mb-4 flex items-center gap-2">
                  <Plus className="h-4 w-4" /> Configure Custom Plan
                </h3>
                <div className="grid gap-4 md:grid-cols-3">
                  <input
                    placeholder="Plan Label (e.g. 15 Days Special)"
                    value={customLabel}
                    onChange={(e) => setCustomLabel(e.target.value)}
                    className="md:col-span-3 border border-neutral-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-red-600/20 focus:border-red-600 outline-none"
                  />
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-neutral-500 text-sm">₹</span>
                    <input
                      placeholder="Amount"
                      type="number"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      className="w-full border border-neutral-200 rounded-lg pl-7 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-red-600/20 focus:border-red-600 outline-none"
                    />
                  </div>
                  <div className="relative">
                    <input
                      placeholder="Duration"
                      type="number"
                      value={customDurationDays}
                      onChange={(e) => setCustomDurationDays(e.target.value)}
                      className="w-full border border-neutral-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-red-600/20 focus:border-red-600 outline-none"
                    />
                    <span className="absolute right-3 top-2.5 text-neutral-500 text-xs font-medium">Days</span>
                  </div>
                </div>
              </div>
            )}


            {/* ADDONS */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2 ml-1">
                <Sparkles className="h-5 w-5 text-red-500" />
                Extras
              </h2>

              <div className="grid md:grid-cols-2 gap-4">
                
                {/* Registration Fee Card */}
                <div 
                  onClick={() => setHasRegistrationFee(!hasRegistrationFee)}
                  className={`
                    cursor-pointer rounded-xl p-4 border-2 transition-all flex items-center gap-4
                    ${hasRegistrationFee 
                      ? 'border-red-600 bg-red-50 shadow-md' 
                      : 'border-transparent bg-white/95 hover:border-red-600/30'
                    }
                  `}
                >
                  <div className={`
                    h-10 w-10 rounded-full flex items-center justify-center shrink-0 transition-colors
                    ${hasRegistrationFee ? 'bg-red-600 text-white' : 'bg-neutral-100 text-neutral-400'}
                  `}>
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className={`font-semibold ${hasRegistrationFee ? 'text-red-900' : 'text-neutral-700'}`}>Registration Fee</p>
                    <p className="text-xs text-neutral-500">One-time fee • ₹499</p>
                  </div>
                  {hasRegistrationFee && <Check className="h-5 w-5 text-red-600" />}
                </div>

                {/* PT Card */}
                <div 
                  onClick={() => setIncludePT(!includePT)}
                  className={`
                    cursor-pointer rounded-xl p-4 border-2 transition-all flex items-center gap-4
                    ${includePT 
                      ? 'border-red-600 bg-red-50 shadow-md' 
                      : 'border-transparent bg-white/95 hover:border-red-600/30'
                    }
                  `}
                >
                  <div className={`
                    h-10 w-10 rounded-full flex items-center justify-center shrink-0 transition-colors
                    ${includePT ? 'bg-red-600 text-white' : 'bg-neutral-100 text-neutral-400'}
                  `}>
                    <Timer className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className={`font-semibold ${includePT ? 'text-red-900' : 'text-neutral-700'}`}>Personal Trainer</p>
                    <p className="text-xs text-neutral-500">20 Sessions • ₹{ptPlan?.baseAmount || '---'}</p>
                  </div>
                  {includePT && <Check className="h-5 w-5 text-red-600" />}
                </div>

              </div>
            </div>

            {/* ERROR MESSAGE */}
            {submitError && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-200 p-4 rounded-lg text-sm flex items-center gap-2 backdrop-blur-sm">
                <span className="font-bold text-red-400">Error:</span> {submitError}
              </div>
            )}

            {/* ACTION BUTTON */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full md:w-auto px-8 py-3.5 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 active:bg-red-800 transition-all shadow-lg shadow-red-900/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? 'Creating Invoice...' : 'Generate Invoice'}
            </button>

          </form>
        </section>

        {/* RIGHT (SUMMARY) - Spans 4 cols */}
        <aside className="lg:col-span-4 space-y-6">
          <div className="sticky top-8">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
              <div className="bg-neutral-900 p-4 text-white border-b border-neutral-800">
                <h2 className="font-bold flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-red-500" />
                  Order Summary
                </h2>
              </div>
              
              <div className="p-6">
                {!totals ? (
                   <div className="text-center py-8 text-neutral-400 text-sm flex flex-col items-center gap-2">
                      <div className="h-10 w-10 rounded-full bg-neutral-100 flex items-center justify-center">
                        <Plus className="h-5 w-5 text-neutral-300" />
                      </div>
                      Select a plan to view cost
                   </div>
                ) : (
                  <div className="space-y-4">
                    {/* Line Items */}
                    <div className="space-y-2 text-sm text-neutral-600 pb-4 border-b border-dashed border-neutral-200">
                      {selectedPlanCode !== CUSTOM_PLAN_CODE && (
                         <div className="flex justify-between">
                            <span>Membership</span>
                            <span>₹{membershipPlans.find(p=>p.code === selectedPlanCode)?.baseAmount}</span>
                         </div>
                      )}
                      {selectedPlanCode === CUSTOM_PLAN_CODE && (
                         <div className="flex justify-between">
                            <span>{customLabel || 'Custom Plan'}</span>
                            <span>₹{Number(customAmount) || 0}</span>
                         </div>
                      )}
                      {hasRegistrationFee && (
                        <div className="flex justify-between text-xs">
                          <span>Reg. Fee</span>
                          <span>₹499</span>
                        </div>
                      )}
                      {includePT && (
                        <div className="flex justify-between text-xs">
                          <span>PT (20 Sessions)</span>
                          <span>₹{ptPlan?.baseAmount}</span>
                        </div>
                      )}
                    </div>

                    {/* Calculations */}
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between text-neutral-500">
                        <span>Subtotal (Taxable)</span>
                        <span>₹{totals.taxableSubtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-neutral-500">
                        <span>Non-taxable</span>
                        <span>₹{totals.nontaxableSubtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-neutral-500">
                        <span>GST (18%)</span>
                        <span>₹{totals.totalGst.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Total */}
                    <div className="pt-4 border-t border-neutral-200">
                      <div className="flex justify-between items-end">
                        <span className="text-sm font-semibold text-neutral-600">Total Amount</span>
                        <span className="text-3xl font-bold text-red-600">
                          ₹{totals.grandTotal.toFixed(0)}
                          <span className="text-lg text-neutral-400 font-medium">
                             .{totals.grandTotal.toFixed(2).split('.')[1]}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </aside>

      </div>
    </main>
  );
}