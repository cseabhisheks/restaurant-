const round = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

/**
 * Single source of truth for bill maths. Server-side only; client totals are never trusted.
 * Order: subtotal -> discount -> tax on discounted amount -> total.
 */
function computeBill({ lines, taxRate = 0, discountType = 'none', discountValue = 0 }) {
  const items = lines.map((l) => ({ ...l, lineTotal: round(l.price * l.quantity) }));
  const subtotal = round(items.reduce((s, l) => s + l.lineTotal, 0));
  let discountAmount = 0;
  if (discountType === 'percent') discountAmount = round((subtotal * discountValue) / 100);
  else if (discountType === 'flat') discountAmount = round(discountValue);
  discountAmount = Math.min(discountAmount, subtotal);
  const taxable = round(subtotal - discountAmount);
  const taxAmount = round((taxable * taxRate) / 100);
  return {
    items, subtotal, discountType, discountValue, discountAmount,
    taxRate, taxAmount, total: round(taxable + taxAmount),
  };
}

const STATUS_FLOW = {
  Pending: ['Preparing', 'Cancelled'],
  Preparing: ['Ready', 'Cancelled'],
  Ready: ['Completed'],
  Completed: [],
  Cancelled: [],
};
const canTransition = (from, to) => (STATUS_FLOW[from] || []).includes(to);

module.exports = { computeBill, canTransition, STATUS_FLOW, round };
