const router = require('express').Router();
const { z } = require('zod');
const { Order, MenuItem, Counter } = require('../models');
const { ApiError, asyncHandler } = require('../utils/errors');
const { validate, authenticate, authorize } = require('../middleware');
const { computeBill, canTransition } = require('../utils/billing');
const { getSettings } = require('./settings');

const STAFF_MAX_DISCOUNT_PCT = 20;
const oid = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');
const orderBody = z.object({
  type: z.enum(['Dine-in', 'Takeaway']),
  tableNumber: z.string().trim().max(10).optional(),
  customerName: z.string().trim().max(60).optional(),
  notes: z.string().trim().max(200).optional(),
  items: z.array(z.object({ menuItemId: oid, quantity: z.number().int().min(1).max(50) })).min(1, 'Add at least one item').max(60),
  discountType: z.enum(['none', 'percent', 'flat']).default('none'),
  discountValue: z.number().min(0).default(0),
}).superRefine((v, ctx) => {
  if (v.type === 'Dine-in' && !v.tableNumber) ctx.addIssue({ code: 'custom', path: ['tableNumber'], message: 'Table number is required for dine-in' });
  if (v.discountType === 'percent' && v.discountValue > 100) ctx.addIssue({ code: 'custom', path: ['discountValue'], message: 'Cannot exceed 100%' });
});

async function nextOrderNumber() {
  const d = new Date();
  const day = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const c = await Counter.findOneAndUpdate({ _id: `order-${day}` }, { $inc: { seq: 1 } }, { upsert: true, new: true });
  return `ORD-${day}-${String(c.seq).padStart(3, '0')}`;
}

async function priceOrder(input, user) {
  const qty = new Map();
  for (const i of input.items) qty.set(i.menuItemId, (qty.get(i.menuItemId) || 0) + i.quantity);
  const docs = await MenuItem.find({ _id: { $in: [...qty.keys()] } });
  if (docs.length !== qty.size) throw new ApiError(404, 'MENU_ITEM_NOT_FOUND', 'One or more menu items do not exist');
  const bad = docs.filter((d) => !d.active || !d.available);
  if (bad.length) throw new ApiError(409, 'ITEM_UNAVAILABLE', `Unavailable: ${bad.map((b) => b.name).join(', ')}`, bad.map((b) => b.id));
  const settings = await getSettings();
  const bill = computeBill({
    lines: docs.map((d) => ({ menuItem: d._id, name: d.name, price: d.price, quantity: qty.get(String(d._id)) })),
    taxRate: settings.taxRate, discountType: input.discountType, discountValue: input.discountValue,
  });
  const pct = bill.subtotal ? (bill.discountAmount / bill.subtotal) * 100 : 0;
  if (user.role !== 'Admin' && pct > STAFF_MAX_DISCOUNT_PCT)
    throw new ApiError(403, 'DISCOUNT_LIMIT', `Discounts above ${STAFF_MAX_DISCOUNT_PCT}% need an Admin`);
  return bill;
}
const meta = (i) => ({ type: i.type, tableNumber: i.type === 'Dine-in' ? i.tableNumber : undefined, customerName: i.customerName, notes: i.notes });

router.use(authenticate);

router.post('/', validate(orderBody), asyncHandler(async (req, res) => {
  const bill = await priceOrder(req.body, req.user);
  const order = await Order.create({
    ...meta(req.body), ...bill, orderNumber: await nextOrderNumber(),
    createdBy: req.user._id, statusHistory: [{ status: 'Pending', by: req.user._id }],
  });
  res.status(201).json({ success: true, data: order });
}));

router.get('/', asyncHandler(async (req, res) => {
  const { q, status, type, from, to } = req.query;
  const page = Math.max(1, +req.query.page || 1), limit = Math.min(100, Math.max(1, +req.query.limit || 20));
  const f = {};
  if (status) f.status = status;
  if (type) f.type = type;
  if (q) f.orderNumber = new RegExp(String(q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  if (from || to) f.createdAt = { ...(from && { $gte: new Date(from) }), ...(to && { $lte: new Date(to) }) };
  const [data, total] = await Promise.all([
    Order.find(f).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate('createdBy', 'name'),
    Order.countDocuments(f),
  ]);
  res.json({ success: true, data, meta: { page, limit, total, pages: Math.ceil(total / limit) } });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const o = await Order.findById(req.params.id).populate('createdBy', 'name').populate('payment.recordedBy', 'name');
  if (!o) throw new ApiError(404, 'NOT_FOUND', 'Order not found');
  res.json({ success: true, data: o });
}));

// Edit items/discount: only while Pending and unpaid
router.put('/:id', validate(orderBody), asyncHandler(async (req, res) => {
  const o = await Order.findById(req.params.id);
  if (!o) throw new ApiError(404, 'NOT_FOUND', 'Order not found');
  if (o.status !== 'Pending' || o.payment.status === 'Paid') throw new ApiError(409, 'ORDER_LOCKED', 'Only pending, unpaid orders can be edited');
  Object.assign(o, meta(req.body), await priceOrder(req.body, req.user));
  await o.save();
  res.json({ success: true, data: o });
}));

router.patch('/:id/status', validate(z.object({ status: z.enum(['Pending', 'Preparing', 'Ready', 'Completed', 'Cancelled']) })), asyncHandler(async (req, res) => {
  const o = await Order.findById(req.params.id);
  if (!o) throw new ApiError(404, 'NOT_FOUND', 'Order not found');
  const to = req.body.status;
  if (!canTransition(o.status, to)) throw new ApiError(409, 'INVALID_TRANSITION', `Cannot move order from ${o.status} to ${to}`);
  if (to === 'Completed' && o.payment.status !== 'Paid') throw new ApiError(409, 'PAYMENT_REQUIRED', 'Record payment before completing the order');
  if (to === 'Cancelled' && o.payment.status === 'Paid') throw new ApiError(409, 'ORDER_PAID', 'Paid orders cannot be cancelled');
  o.status = to; o.statusHistory.push({ status: to, by: req.user._id });
  await o.save();
  res.json({ success: true, data: o });
}));

router.post('/:id/payment', validate(z.object({
  method: z.enum(['Cash', 'UPI', 'Card']), reference: z.string().trim().max(40).optional(),
})), asyncHandler(async (req, res) => {
  const o = await Order.findById(req.params.id);
  if (!o) throw new ApiError(404, 'NOT_FOUND', 'Order not found');
  if (o.status === 'Cancelled') throw new ApiError(409, 'ORDER_CANCELLED', 'Cannot take payment on a cancelled order');
  if (o.payment.status === 'Paid') throw new ApiError(409, 'ALREADY_PAID', 'This order is already paid');
  o.payment = { status: 'Paid', method: req.body.method, reference: req.body.reference, amount: o.total, paidAt: new Date(), recordedBy: req.user._id };
  await o.save();
  res.json({ success: true, data: o });
}));

module.exports = router;
