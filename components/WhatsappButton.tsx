'use client';

import { useState } from 'react';
import { MessageCircle } from 'lucide-react';

interface WhatsAppButtonProps {
  phone: string;
  invoiceCode: string;
  invoiceId: string;
}

export function WhatsAppButton({ phone, invoiceCode, invoiceId }: WhatsAppButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleShare = () => {
    setLoading(true);

    // 1. Check if we have a valid phone number
    let targetPhone = phone;
    
    // If phone is missing, empty, or a placeholder dash, ask the user
    if (!targetPhone || targetPhone === '-' || targetPhone.trim().length < 10) {
        const input = window.prompt("Enter Customer WhatsApp Number:");
        if (!input) {
            setLoading(false);
            return; // User cancelled
        }
        targetPhone = input;
    }

    // 2. Clean Phone Number (India Default)
    let cleanPhone = targetPhone.replace(/\D/g, ''); 
    if (cleanPhone.length === 10) cleanPhone = '91' + cleanPhone;

    // 3. Construct the secure public link
    const origin = window.location.origin;
    const link = `${origin}/share/${invoiceId}`;

    // 4. Format the message
    const message = `Hi, here is your invoice #${invoiceCode} from The Bodyworks Club: \n\n${link} \n\nThank you!`;

    // 5. Open WhatsApp
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    
    window.open(url, '_blank');
    setLoading(false);
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 bg-[#25D366] text-white rounded-lg text-xs font-bold uppercase tracking-wide hover:bg-[#128C7E] transition-colors shadow-md disabled:opacity-70"
    >
      <MessageCircle className="h-4 w-4" />
      Share
    </button>
  );
}