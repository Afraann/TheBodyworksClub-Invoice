// app/shop/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingCart, Plus, Minus, Trash2, ArrowLeft, X, CheckCircle2, PackagePlus, Pencil, Save, RotateCcw } from 'lucide-react';
import Image from 'next/image';
import bgImg from '../bg.jpg';
import { LogoutButton } from '@/components/LogoutButton';

type Product = { id: string; name: string; price: number; stock: number; category?: string };
type CartItem = Product & { quantity: number };

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // --- UI STATES ---
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // --- NEW STATE: DELETE MODE ---
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  
  // --- FORM STATES ---
  const [addFormData, setAddFormData] = useState({ name: '', price: '', stock: '', category: '' });
  const [editFormData, setEditFormData] = useState<Product | null>(null);
  
  const [submitting, setSubmitting] = useState(false);

  // --- CHECKOUT STATES ---
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'UPI' | 'SPLIT'>('CASH');
  const [splitCash, setSplitCash] = useState('');
  const [splitUpi, setSplitUpi] = useState('');

  const [role, setRole] = useState<'ADMIN' | 'STAFF' | null>(null);

  // 1. FETCH DATA
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
    // Fetch Role
    fetch('/api/auth/me').then(res => res.json()).then(data => setRole(data.role));
  }, []);

  // 2. CART LOGIC
  const addToCart = (product: Product) => {
    if (isDeleteMode) return;

    setCart(prev => {
      const existing = prev.find(p => p.id === product.id);
      const currentQty = existing ? existing.quantity : 0;
      
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
        if (newQty > product.stock) return p; 

        return { ...p, quantity: newQty };
      }
      return p;
    }));
  };

  const cartTotal = cart.reduce((acc, item) => acc + (Number(item.price) * item.quantity), 0);

  // 3. CHECKOUT LOGIC
  const handleSplitInput = (type: 'CASH' | 'UPI', value: string) => {
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

  // 4. ADD NEW PRODUCT LOGIC
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await fetch('/api/products', { method: 'POST', body: JSON.stringify(addFormData) });
    setSubmitting(false);
    setIsAddModalOpen(false);
    setAddFormData({ name: '', price: '', stock: '', category: '' });
    refreshProducts();
  };

  // 5. EDIT LOGIC
  const openEditModal = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditFormData(product);
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFormData) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/products/${editFormData.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            price: editFormData.price,
            stock: editFormData.stock,
            category: editFormData.category
        })
      });
      
      if(res.ok) {
          setIsEditModalOpen(false);
          refreshProducts();
      } else {
          alert('Failed to update product');
      }
    } catch (err) {
        alert('Error updating product');
    } finally {
        setSubmitting(false);
    }
  };

  // 6. DELETE LOGIC
  const handleDeleteProduct = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this product?')) return;

    setProducts(prev => prev.filter(p => p.id !== id)); // Optimistic

    try {
      await fetch(`/api/products/${id}`, { method: 'DELETE' });
      refreshProducts();
    } catch (err) {
      alert('Failed to delete');
      refreshProducts();
    }
  };

  // --- RENDERERS ---

  const renderAddModal = () => {
    if (!isAddModalOpen) return null;
    return (
        <div className="fixed inset-0 z-[100] text-neutral-900 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)} />
            <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-neutral-100 flex justify-between items-center bg-neutral-50">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        <PackagePlus className="h-5 w-5 text-red-600" /> Add New Product
                    </h3>
                    <button onClick={() => setIsAddModalOpen(false)}><X className="h-5 w-5 text-neutral-400 hover:text-red-500" /></button>
                </div>
                <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="text-xs font-bold uppercase text-neutral-500">Product Name</label>
                        <input className="w-full border border-neutral-300 rounded-lg p-2.5 mt-1 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none" 
                            required value={addFormData.name} onChange={e => setAddFormData({...addFormData, name: e.target.value})} placeholder="e.g. Whey Protein" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold uppercase text-neutral-500">Price (₹)</label>
                            <input type="number" className="w-full border border-neutral-300 rounded-lg p-2.5 mt-1 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none" 
                                required value={addFormData.price} onChange={e => setAddFormData({...addFormData, price: e.target.value})} />
                        </div>
                        <div>
                            <label className="text-xs font-bold uppercase text-neutral-500">Stock Qty</label>
                            <input type="number" className="w-full border border-neutral-300 rounded-lg p-2.5 mt-1 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none" 
                                required value={addFormData.stock} onChange={e => setAddFormData({...addFormData, stock: e.target.value})} />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold uppercase text-neutral-500">Category</label>
                        <input className="w-full border border-neutral-300 rounded-lg p-2.5 mt-1 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none" 
                            value={addFormData.category} onChange={e => setAddFormData({...addFormData, category: e.target.value})} placeholder="Optional" />
                    </div>
                    <button type="submit" disabled={submitting} className="w-full bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-700 transition-colors">
                        {submitting ? 'Adding...' : 'Add to Inventory'}
                    </button>
                </form>
            </div>
        </div>
    );
  };

  const renderEditModal = () => {
    if (!isEditModalOpen || !editFormData) return null;
    return (
        <div className="fixed inset-0 text-neutral-900 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm" onClick={() => setIsEditModalOpen(false)} />
            <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-neutral-100 flex justify-between items-center bg-neutral-50">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        <RotateCcw className="h-5 w-5 text-blue-600" /> Restock / Edit
                    </h3>
                    <button onClick={() => setIsEditModalOpen(false)}><X className="h-5 w-5 text-neutral-400 hover:text-red-500" /></button>
                </div>
                <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
                    <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-200">
                        <label className="text-[10px] font-bold uppercase text-neutral-400">Product Name</label>
                        <p className="font-bold text-neutral-900 text-lg">{editFormData.name}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold uppercase text-neutral-500">Price (₹)</label>
                            <input 
                                type="number" 
                                className="w-full border border-neutral-300 rounded-lg p-2.5 mt-1 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-bold text-neutral-900" 
                                required 
                                value={editFormData.price} 
                                onFocus={(e) => e.target.select()}
                                onChange={e => setEditFormData({...editFormData, price: Number(e.target.value)})} 
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold uppercase text-neutral-500 text-blue-600">Total Stock</label>
                            <input 
                                type="number" 
                                className="w-full border-2 border-blue-100 rounded-lg p-2.5 mt-1 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-bold text-neutral-900 bg-blue-50/50" 
                                required 
                                value={editFormData.stock} 
                                onFocus={(e) => e.target.select()}
                                onChange={e => setEditFormData({...editFormData, stock: Number(e.target.value)})} 
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold uppercase text-neutral-500">Category</label>
                        <input className="w-full border border-neutral-300 rounded-lg p-2.5 mt-1 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" 
                            value={editFormData.category || ''} 
                            onChange={e => setEditFormData({...editFormData, category: e.target.value})} />
                    </div>
                    <button type="submit" disabled={submitting} className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                        {submitting ? 'Saving...' : <><Save className="h-4 w-4"/> Update Details</>}
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
    // Changed: Removed 'bg-neutral-50', added 'relative' to allow background image to show
    <div className="min-h-screen relative flex flex-col md:flex-row h-screen overflow-hidden font-sans">
      
      {/* Modals */}
      {renderAddModal()}
      {renderEditModal()}

      {/* Background Image (Shared style) */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <Image src={bgImg} alt="bg" fill className="object-cover" placeholder="blur" />
        {/* Slightly darker overlay for product readability */}
        <div className="absolute inset-0 bg-neutral-900/80 backdrop-blur-sm" />
      </div>

      {/* LEFT: Product Grid */}
      <div className="relative z-10 flex-1 flex flex-col overflow-hidden">
        
        {/* HEADER: Updated to Glassmorphism Style */}
        <header className="p-6 flex items-center justify-between border-b border-white/10 bg-white/10 backdrop-blur-md">
           <div className="flex items-center gap-4">
             {role === 'ADMIN' ? (
                 <Link href="/" className="inline-flex items-center gap-2 text-neutral-400 hover:text-white transition-colors font-medium text-xs uppercase tracking-wider">
                    <ArrowLeft className="h-4 w-4" /> Dashboard
                 </Link>
             ) : (
                 <LogoutButton className="bg-white/10 text-neutral-300 hover:text-red-400 hover:bg-white/20 border border-white/10" minimal />
             )}
             
             <div>
                <h1 className="text-2xl font-black uppercase tracking-wide text-white leading-none">Gym Shop</h1>
                <p className="text-xs text-neutral-400 font-bold uppercase tracking-wider mt-1">
                    {isDeleteMode ? 'Delete Mode' : 'POS System'}
                </p>
             </div>
           </div>
           
           <div className="flex items-center gap-2">
               {/* Mobile Inventory Button */}
               {role === 'ADMIN' && (
                   <button onClick={() => setIsAddModalOpen(true)} className="md:hidden flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-100">
                      <Plus className="h-3 w-3" /> Stock
                   </button>
               )}
               
           </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 md:pb-6">
            {loading ? <div className="text-center mt-20 text-neutral-400">Loading products...</div> : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                
                {/* 1. Add Stock Card */}
                {role === 'ADMIN' && (
                    <button onClick={() => setIsAddModalOpen(true)} className="hidden md:flex flex-col items-center justify-center h-40 bg-white/10 p-4 rounded-2xl border-2 border-dashed border-white/20 hover:bg-white/20 hover:border-red-400 text-neutral-400 hover:text-white transition-all shadow-sm">
                        <div className="h-10 w-10 bg-white/10 rounded-full flex items-center justify-center mb-2">
                          <Plus className="h-5 w-5" />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wide">Add New Product</span>
                    </button>
                )}

                {/* 2. Product Items */}
                {products.map(product => {
                    const inCart = cart.find(c => c.id === product.id)?.quantity || 0;
                    const availableStock = product.stock - inCart;
                    const isOutOfStock = availableStock <= 0;

                    return (
                        <div key={product.id} 
                            onClick={(e) => isDeleteMode ? handleDeleteProduct(product.id, e) : (!isOutOfStock && addToCart(product))}
                            className={`group flex justify-between flex-col relative h-40 bg-white p-4 rounded-2xl border-2 transition-all cursor-pointer active:scale-95 shadow-lg hover:shadow-xl
                                ${isDeleteMode 
                                    ? 'border-red-500 bg-red-50 animate-pulse' 
                                    : isOutOfStock
                                        ? 'border-neutral-800 opacity-60 grayscale cursor-not-allowed bg-neutral-200' 
                                        : 'border-transparent hover:border-red-600'
                                }
                            `}
                        >
                            {isDeleteMode && role === 'ADMIN' && (
                                <div className="absolute inset-0 z-10 flex items-center justify-center bg-red-500/10 backdrop-blur-[1px] rounded-2xl">
                                    <Trash2 className="h-8 w-8 text-red-600" />
                                </div>
                            )}

                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-bold text-neutral-900 leading-tight truncate pr-2 max-w-[120px]">{product.name}</h3>
                                    <p className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider">{product.category || 'General'}</p>
                                </div>
                                
                                {!isDeleteMode && role === 'ADMIN' && (
                                    <button 
                                        onClick={(e) => openEditModal(product, e)}
                                        className="p-1.5 -mt-1 -mr-1 rounded-lg text-neutral-300 hover:bg-neutral-100 hover:text-blue-600 transition-colors"
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </button>
                                )}
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
      <div className="hidden md:block w-96 relative z-20 shadow-2xl border-l border-neutral-200">
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

      {/* FLOATING DELETE TOGGLE (ADMIN ONLY) */}
      {role === 'ADMIN' && (
        <div className="fixed bottom-26 right-4 md:bottom-8 md:right-[25rem] z-40">
           <button 
              onClick={() => setIsDeleteMode(!isDeleteMode)}
              className={`h-14 w-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 transform hover:scale-110 active:scale-95 ${isDeleteMode ? 'bg-red-600 text-white rotate-180' : 'bg-white text-neutral-400 hover:text-red-600'}`}
           >
              {isDeleteMode ? <X className="h-6 w-6" /> : <Trash2 className="h-6 w-6" />}
           </button>
        </div>
      )}

    </div>
  );
}