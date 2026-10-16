const router = require('express').Router();
const { Order } = require('../models');
const { asyncHandler, ApiError } = require('../utils/errors');
const { authenticate } = require('../middleware');

router.use(authenticate);

router.get('/daily-sales', asyncHandler(async (req, res) => {
  const base = req.query.date ? new Date(`${req.query.date}T00:00:00`) : new Date();
  if (isNaN(base)) throw new ApiError(400, 'VALIDATION_ERROR', 'date must be YYYY-MM-DD');
  const start = new Date(base.getFullYear(), base.getMonth(), base.getDate());
  const end = new Date(start); end.setDate(end.getDate() + 1);
  const trendStart = new Date(start); trendStart.setDate(trendStart.getDate() - 6);
  const day = { createdAt: { $gte: start, $lt: end } };
  const paid = { 'payment.status': 'Paid' };

  const [counts, byMethod, topItems, trend] = await Promise.all([
    Order.aggregate([{ $match: day }, { $group: { _id: '$status', n: { $sum: 1 } } }]),
    Order.aggregate([{ $match: { ...day, ...paid } }, { $group: { _id: '$payment.method', total: { $sum: '$total' }, n: { $sum: 1 } } }]),
    Order.aggregate([{ $match: { ...day, status: { $ne: 'Cancelled' } } }, { $unwind: '$items' },
      { $group: { _id: '$items.name', qty: { $sum: '$items.quantity' }, revenue: { $sum: '$items.lineTotal' } } }, { $sort: { qty: -1 } }, { $limit: 5 }]),
    Order.aggregate([{ $match: { createdAt: { $gte: trendStart, $lt: end }, ...paid } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, total: { $sum: '$total' } } }]),
  ]);
  const c = Object.fromEntries(counts.map((x) => [x._id, x.n]));
  const totalOrders = counts.reduce((s, x) => s + x.n, 0) - (c.Cancelled || 0);
  const dailySales = Math.round(byMethod.reduce((s, x) => s + x.total, 0) * 100) / 100;
  const paidCount = byMethod.reduce((s, x) => s + x.n, 0);
  const tmap = Object.fromEntries(trend.map((t) => [t._id, t.total]));
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(trendStart); d.setDate(d.getDate() + i);
    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return { date: k, total: tmap[k] || 0 };
  });
  res.json({ success: true, data: {
    date: start.toISOString().slice(0, 10), totalOrders, completedOrders: c.Completed || 0,
    activeOrders: (c.Pending || 0) + (c.Preparing || 0) + (c.Ready || 0), cancelledOrders: c.Cancelled || 0,
    dailySales, averageOrderValue: paidCount ? Math.round((dailySales / paidCount) * 100) / 100 : 0,
    byPaymentMethod: byMethod.map((m) => ({ method: m._id, total: m.total, orders: m.n })),
    topItems: topItems.map((t) => ({ name: t._id, quantity: t.qty, revenue: t.revenue })), trend: days,
  } });
}));
module.exports = router;
