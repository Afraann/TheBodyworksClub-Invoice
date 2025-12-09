// components/WhatsAppButton.tsx
'use client';

import { useState } from 'react';
import { MessageCircle, Loader2 } from 'lucide-react';
import { toPng } from 'html-to-image'; // <--- NEW LIBRARY
import jsPDF from 'jspdf';

interface WhatsAppButtonProps {
  phone: string;
  invoiceCode: string;
}

export function WhatsAppButton({ phone, invoiceCode }: WhatsAppButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleShare = async () => {
    setLoading(true);

    try {
      // 1. Clean Phone Number
      let cleanPhone = phone.replace(/\D/g, ''); 
      if (cleanPhone.length === 10) cleanPhone = '91' + cleanPhone;

      // 2. Capture the Invoice Element
      const element = document.getElementById('invoice-preview');
      if (!element) {
        alert('Invoice preview not found!');
        setLoading(false);
        return;
      }

      // 3. Convert HTML to Image (PNG)
      // filter: (node) => ... allows us to ignore elements with specific classes/ids if needed
      const imgData = await toPng(element, {
        quality: 1.0,
        backgroundColor: '#ffffff', // Force white background
      });

      // 4. Create PDF
      // We load the image to get dimensions
      const img = new Image();
      img.src = imgData;
      
      await new Promise((resolve) => { img.onload = resolve; });

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [80, (img.height * 80) / img.width] // Dynamic height maintaining ratio
      });

      pdf.addImage(imgData, 'PNG', 0, 0, 80, (img.height * 80) / img.width);
      
      const fileName = `Invoice_${invoiceCode}.pdf`;

      // 5. Share Logic
      const pdfBlob = pdf.output('blob');
      const file = new File([pdfBlob], fileName, { type: 'application/pdf' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Invoice #${invoiceCode}`,
          text: `Here is your invoice #${invoiceCode} from The Bodyworks Club.`
        });
      } else {
        // Fallback for Desktop
        pdf.save(fileName);
        
        const message = `Hi, please find your invoice #${invoiceCode} attached below.`;
        const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
        
        window.open(url, '_blank');
        alert('Invoice downloaded! Drag and drop it into the WhatsApp chat.');
      }

    } catch (error) {
      console.error('Error generating invoice:', error);
      alert('Failed to generate invoice. Please try printing instead.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 bg-[#25D366] text-white rounded-lg text-xs font-bold uppercase tracking-wide hover:bg-[#128C7E] transition-colors shadow-md disabled:opacity-70 disabled:cursor-wait"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
      {loading ? 'Generating...' : 'WhatsApp'}
    </button>
  );
}