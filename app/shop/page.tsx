// app/shop/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingCart, Plus, Minus, Trash2, ArrowLeft, X, CheckCircle2, PackagePlus } from 'lucide-react';
import Image from 'next/image';
import bgImg from '../bg.jpg';

type Product = { id: string; name: string; price: number; stock: number; category?: string };
type CartItem = Product & { quantity: number };

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // UI States
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
  
  // Inventory Form State
  const [invFormData, setInvFormData] = useState({ name: '', price: '', stock: '', category: '' });
  const [invSubmitting, setInvSubmitting] = useState(false);

  // Checkout State
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'UPI' | 'SPLIT'>('CASH');
  const [splitCash, setSplitCash] = useState('');
  const [splitUpi, setSplitUpi] = useState('');

  // 1. Fetch Products
  const refreshProducts = () => {
    setLoading(true);
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        if(data.success) setProducts(data.data);
        setLoading(false);
      });
  };

  useEffect(() => {
    refreshProducts();
  }, []);

  // 2. Cart Logic
  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(p => p.id === product.id);
      const currentQty = existing ? existing.quantity : 0;
      
      // Stock Validation
      if (currentQty >= product.stock) return prev;

      if (existing) {
        return prev.map(p => p.id === product.id ? { ...p, quantity: p.quantity + 1 } : p);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(p => p.id !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(p => {
      if (p.id === productId) {
        const product = products.find(prod => prod.id === productId);
        if (!product) return p;

        const newQty = p.quantity + delta;
        if (newQty < 1) return p;
        if (newQty > product.stock) return p; // Cap at real stock

        return { ...p, quantity: newQty };
      }
      return p;
    }));
  };

  const cartTotal = cart.reduce((acc, item) => acc + (Number(item.price) * item.quantity), 0);

  // 3. Split Logic (Fixed Focus Issue)
  const handleSplitInput = (type: 'CASH' | 'UPI', value: string) => {
    // Allow clearing input
    if (value === '') {
        if (type === 'CASH') { setSplitCash(''); setSplitUpi(cartTotal.toFixed(2)); }
        else { setSplitUpi(''); setSplitCash(cartTotal.toFixed(2)); }
        return;
    }

    const numVal = parseFloat(value);
    if (isNaN(numVal)) return;

    if (type === 'CASH') {
        setSplitCash(value);
        const remaining = Math.max(0, cartTotal - numVal);
        setSplitUpi(remaining.toFixed(2));
    } else {
        setSplitUpi(value);
        const remaining = Math.max(0, cartTotal - numVal);
        setSplitCash(remaining.toFixed(2));
    }
  };

  // 4. Checkout
  const handleCheckout = async () => {
    let cash = 0, upi = 0;
    
    if (paymentMode === 'CASH') cash = cartTotal;
    else if (paymentMode === 'UPI') upi = cartTotal;
    else {
      cash = Number(splitCash);
      upi = Number(splitUpi);
      if (Math.abs((cash + upi) - cartTotal) > 0.5) { 
        alert(`Amounts (₹${(cash+upi).toFixed(2)}) do not match Total (₹${cartTotal})`);
        return;
      }
    }

    try {
      setIsCheckingOut(true);
      const res = await fetch('/api/sales', {
        method: 'POST',
        body: JSON.stringify({
          items: cart.map(i => ({ productId: i.id, quantity: i.quantity })),
          paymentMode,
          cashAmount: cash,
          upiAmount: upi
        })
      });

      const data = await res.json();
      if (data.success) {
        alert('Sale Successful!');
        setCart([]);
        setIsCheckingOut(false);
        setSplitCash('');
        setSplitUpi('');
        setPaymentMode('CASH');
        refreshProducts();
      } else {
        alert('Error: ' + data.error);
        setIsCheckingOut(false);
      }
    } catch (e) {
      alert('Transaction failed');
      setIsCheckingOut(false);
    }
  };

  // 5. Inventory Submit
  const handleInvSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInvSubmitting(true);
    await fetch('/api/products', { method: 'POST', body: JSON.stringify(invFormData) });
    setInvSubmitting(false);
    setIsInventoryModalOpen(false);
    setInvFormData({ name: '', price: '', stock: '', category: '' });
    refreshProducts();
  };

  // --- RENDER HELPERS (Fixed: No component definitions inside render) ---

  const renderInventoryModal = () => {
    if (!isInventoryModalOpen) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm" onClick={() => setIsInventoryModalOpen(false)} />
            <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-neutral-100 flex justify-between items-center bg-neutral-50">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        <PackagePlus className="h-5 w-5 text-red-600" /> Add New Product
                    </h3>
                    <button onClick={() => setIsInventoryModalOpen(false)}><X className="h-5 w-5 text-neutral-400 hover:text-red-500" /></button>
                </div>
                <form onSubmit={handleInvSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="text-xs font-bold uppercase text-neutral-500">Product Name</label>
                        <input className="w-full border border-neutral-300 rounded-lg p-2.5 mt-1 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none" 
                            required value={invFormData.name} onChange={e => setInvFormData({...invFormData, name: e.target.value})} placeholder="e.g. Whey Protein" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold uppercase text-neutral-500">Price (₹)</label>
                            <input type="number" className="w-full border border-neutral-300 rounded-lg p-2.5 mt-1 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none" 
                                required value={invFormData.price} onChange={e => setInvFormData({...invFormData, price: e.target.value})} />
                        </div>
                        <div>
                            <label className="text-xs font-bold uppercase text-neutral-500">Stock Qty</label>
                            <input type="number" className="w-full border border-neutral-300 rounded-lg p-2.5 mt-1 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none" 
                                required value={invFormData.stock} onChange={e => setInvFormData({...invFormData, stock: e.target.value})} />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold uppercase text-neutral-500">Category</label>
                        <input className="w-full border border-neutral-300 rounded-lg p-2.5 mt-1 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none" 
                            value={invFormData.category} onChange={e => setInvFormData({...invFormData, category: e.target.value})} placeholder="Optional" />
                    </div>
                    <button type="submit" disabled={invSubmitting} className="w-full bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-700 transition-colors">
                        {invSubmitting ? 'Adding...' : 'Add to Inventory'}
                    </button>
                </form>
            </div>
        </div>
    );
  };

  const renderCartContents = () => (
    <div className="flex flex-col h-full bg-white text-neutral-900 border-l border-neutral-200">
        <div className="p-6 border-b border-neutral-100 flex justify-between items-center bg-neutral-50">
          <h2 className="font-bold text-xl flex items-center gap-2 text-neutral-900">
            <ShoppingCart className="h-5 w-5 text-red-600" /> Current Order
          </h2>
          <button onClick={() => setIsMobileCartOpen(false)} className="md:hidden p-2 text-neutral-400 hover:text-red-500">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-neutral-400 space-y-4">
              <ShoppingCart className="h-16 w-16 opacity-10" />
              <p className="text-sm font-medium">Your cart is empty</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex justify-between items-center bg-neutral-50 p-3 rounded-xl border border-neutral-100">
                <div>
                  <p className="font-bold text-sm text-neutral-900">{item.name}</p>
                  <p className="text-xs text-neutral-500 mt-0.5">₹{item.price} x {item.quantity}</p>
                </div>
                <div className="flex items-center gap-3 bg-white border border-neutral-200 rounded-lg p-1">
                  <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:bg-neutral-100 rounded text-neutral-600"><Minus className="h-3 w-3" /></button>
                  <span className="text-sm font-bold w-4 text-center text-neutral-900">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:bg-neutral-100 rounded text-neutral-600"><Plus className="h-3 w-3" /></button>
                </div>
                <button onClick={() => removeFromCart(item.id)} className="text-red-500 hover:text-red-700 ml-2"><Trash2 className="h-4 w-4" /></button>
              </div>
            ))
          )}
        </div>

        <div className="p-6 bg-neutral-50 border-t border-neutral-200">
          <div className="flex justify-between items-center mb-6">
            <span className="text-neutral-500 font-medium text-sm uppercase">Total Payable</span>
            <span className="text-3xl font-black text-neutral-900">₹{cartTotal}</span>
          </div>
          
          {cart.length > 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2 p-1 bg-neutral-200/50 rounded-xl">
                 {['CASH', 'UPI', 'SPLIT'].map((mode) => (
                   <button 
                     key={mode}
                     onClick={() => setPaymentMode(mode as any)}
                     className={`text-[10px] font-bold py-2.5 rounded-lg transition-all ${paymentMode === mode ? 'bg-white text-red-600 shadow-md ring-1 ring-black/5' : 'text-neutral-500 hover:text-neutral-700'}`}
                   >
                     {mode}
                   </button>
                 ))}
              </div>

              {paymentMode === 'SPLIT' && (
                <div className="grid grid-cols-2 gap-3 animate-in slide-in-from-top-2">
                  <div className="relative">
                     <span className="absolute left-3 top-2.5 text-neutral-500 text-xs font-bold">₹</span>
                     <input type="number" 
                        value={splitCash} 
                        onChange={e => handleSplitInput('CASH', e.target.value)}
                        className="w-full bg-white border border-neutral-200 rounded-lg py-2 pl-6 pr-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:ring-2 focus:ring-red-600/20 focus:border-red-600 outline-none" placeholder="Cash" 
                     />
                  </div>
                  <div className="relative">
                     <span className="absolute left-3 top-2.5 text-neutral-500 text-xs font-bold">₹</span>
                     <input type="number" 
                        value={splitUpi} 
                        onChange={e => handleSplitInput('UPI', e.target.value)}
                        className="w-full bg-white border border-neutral-200 rounded-lg py-2 pl-6 pr-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:ring-2 focus:ring-red-600/20 focus:border-red-600 outline-none" placeholder="UPI" 
                     />
                  </div>
                </div>
              )}

              <button 
                onClick={handleCheckout}
                disabled={isCheckingOut}
                className="w-full bg-red-600 text-white font-bold py-4 rounded-xl hover:bg-red-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-900/20"
              >
                {isCheckingOut ? 'Processing...' : (
                    <>
                        <CheckCircle2 className="h-5 w-5" /> Confirm Sale
                    </>
                )}
              </button>
            </div>
          )}
        </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col md:flex-row h-screen overflow-hidden text-neutral-900 font-sans">
      
      {/* Modal */}
      {renderInventoryModal()}

      {/* Background Image */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <Image src={bgImg} alt="bg" fill className="object-cover" placeholder="blur" />
        <div className="absolute inset-0 bg-neutral-900/80 backdrop-blur-sm" />
      </div>

      {/* LEFT: Product Grid */}
      <div className="relative z-10 flex-1 flex flex-col overflow-hidden">
        <header className="p-6 flex items-center justify-between border-b border-neutral-200 bg-white/50 backdrop-blur-sm">
           <div className="flex items-center gap-4">
             <Link href="/" className="p-2 bg-white hover:bg-neutral-100 rounded-full transition-colors border border-neutral-200 shadow-sm">
                <ArrowLeft className="h-5 w-5 text-neutral-600" />
             </Link>
             <div>
                <h1 className="text-2xl font-black uppercase tracking-wide text-neutral-900 leading-none">Gym Shop</h1>
                <p className="text-xs text-neutral-800 font-bold uppercase tracking-wider mt-1">POS System</p>
             </div>
           </div>
           
           {/* Mobile Inventory Button */}
           <button onClick={() => setIsInventoryModalOpen(true)} className="md:hidden flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-100">
              <Plus className="h-3 w-3" /> Stock
           </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 md:pb-6">
            {loading ? <div className="text-center mt-20 text-neutral-500">Loading products...</div> : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                
                {/* 1. Add Stock Card (FIRST ITEM) */}
                <button onClick={() => setIsInventoryModalOpen(true)} className="hidden md:flex flex-col items-center justify-center h-40 bg-white p-4 rounded-2xl border-2 border-dashed border-neutral-300 hover:bg-white hover:border-red-400 text-neutral-400 hover:text-red-600 transition-all shadow-sm">
                    <div className="h-10 w-10 bg-neutral-100 rounded-full flex items-center justify-center mb-2">
                      <Plus className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wide">Add New Product</span>
                </button>

                {/* 2. Product Items */}
                {products.map(product => {
                    const inCart = cart.find(c => c.id === product.id)?.quantity || 0;
                    const availableStock = product.stock - inCart;
                    const isOutOfStock = availableStock <= 0;

                    return (
                        <div key={product.id} 
                            onClick={() => !isOutOfStock && addToCart(product)}
                            className={`group flex justify-between flex-col relative h-40 bg-white p-4 rounded-2xl border-2 transition-all cursor-pointer active:scale-95 shadow-sm hover:shadow-md
                                ${isOutOfStock
                                    ? 'border-neutral-100 opacity-60 grayscale cursor-not-allowed' 
                                    : 'border-white hover:border-red-600'
                                }
                            `}
                        >
                            <div className="space-y-1">
                                <h3 className="font-bold text-neutral-900 leading-tight truncate">{product.name}</h3>
                                <p className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider">{product.category || 'General'}</p>
                            </div>
                            <div className="flex justify-between items-end mt-4">
                                <span className="text-red-600 font-bold text-lg">₹{product.price}</span>
                                <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase transition-colors ${!isOutOfStock ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {isOutOfStock ? 'Sold Out' : `${availableStock} Left`}
                                </span>
                            </div>
                        </div>
                    );
                })}
              </div>
            )}
        </div>
      </div>

      {/* RIGHT: Sidebar Cart (Desktop) */}
      <div className="hidden md:block w-96 relative z-20 shadow-xl border-l border-neutral-200">
         {renderCartContents()}
      </div>

      {/* MOBILE: Bottom Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 p-4 bg-white border-t border-neutral-200 pb-8">
         <button 
           onClick={() => setIsMobileCartOpen(true)}
           className="w-full bg-neutral-900 text-white font-bold py-3 rounded-xl flex items-center justify-between px-6 shadow-xl active:scale-[0.98]"
         >
            <span className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-red-500" /> 
                <span>{cart.reduce((a,c) => a + c.quantity, 0)} Items</span>
            </span>
            <span className="text-xl">₹{cartTotal}</span>
         </button>
      </div>

      {/* MOBILE: Cart Overlay */}
      {isMobileCartOpen && (
          <div className="fixed inset-0 z-[60] md:hidden">
              <div className="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm" onClick={() => setIsMobileCartOpen(false)} />
              <div className="absolute inset-y-0 right-0 w-full max-w-sm bg-white shadow-2xl animate-in slide-in-from-right duration-200">
                  {renderCartContents()}
              </div>
          </div>
      )}

    </div>
  );
}