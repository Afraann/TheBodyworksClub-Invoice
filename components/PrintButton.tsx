// components/PrintButton.tsx
'use client';

export function PrintButton() {
  function handlePrint() {
    window.print();
  }

  return (
    <button
      type="button"
      onClick={handlePrint}
      className="border px-3 py-1 rounded text-sm"
    >
      Print
    </button>
  );
}
