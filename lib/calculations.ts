// lib/calculations.ts

export interface LineItemInput {
  /**
   * Amount for this item (already multiplied by quantity, e.g., 1 * 1499)
   */
  amount: number;
  /**
   * Whether GST is applied to this item
   */
  isTaxable: boolean;
  /**
   * GST rate as percentage (18 = 18%, 0 = no GST)
   */
  gstRate: number;
}

export interface InvoiceTotals {
  taxableSubtotal: number;
  cgstAmount: number;
  sgstAmount: number;
  totalGst: number;
  nontaxableSubtotal: number;
  grandTotal: number;
}

/**
 * Round to 2 decimal places in a money-safe way.
 */
function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Calculate invoice totals based on line items and their taxability.
 *
 * Assumptions for now:
 * - GST rate in item.gstRate is the full GST (CGST + SGST).
 * - We split total GST 50/50 into CGST and SGST.
 */
export function calculateInvoiceTotals(items: LineItemInput[]): InvoiceTotals {
  let taxableSubtotal = 0;
  let nontaxableSubtotal = 0;
  let totalGst = 0;

  for (const item of items) {
    const amt = item.amount || 0;

    if (item.isTaxable && item.gstRate > 0) {
      taxableSubtotal += amt;
      const gstForItem = (amt * item.gstRate) / 100;
      totalGst += gstForItem;
    } else {
      nontaxableSubtotal += amt;
    }
  }

  taxableSubtotal = round2(taxableSubtotal);
  nontaxableSubtotal = round2(nontaxableSubtotal);
  totalGst = round2(totalGst);

  // Split equally between CGST and SGST (e.g., 9% + 9%)
  const cgstAmount = round2(totalGst / 2);
  const sgstAmount = round2(totalGst / 2);

  const grandTotal = round2(taxableSubtotal + totalGst + nontaxableSubtotal);

  return {
    taxableSubtotal,
    cgstAmount,
    sgstAmount,
    totalGst,
    nontaxableSubtotal,
    grandTotal,
  };
}
