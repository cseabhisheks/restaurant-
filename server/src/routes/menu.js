const router = require('express').Router();
const { z } = require('zod');
const { MenuItem } = require('../models');
const { ApiError, asyncHandler } = require('../utils/errors');
const { validate, authenticate, authorize } = require('../middleware');

const body = z.object({
  name: z.string().trim().min(2).max(80),
  category: z.string().trim().min(2).max(40),
  description: z.string().trim().max(200).optional(),
  price: z.number().min(0).max(100000),
  available: z.boolean().optional(),
  active: z.boolean().optional(),
});
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

router.use(authenticate);

router.get('/', asyncHandler(async (req, res) => {
  const { q, category, includeInactive } = req.query;
  const filter = {};
  if (!(includeInactive === 'true' && req.user.role === 'Admin')) filter.active = true;
  if (category) filter.category = category;
  if (q) filter.name = new RegExp(esc(String(q)), 'i');
  const items = await MenuItem.find(filter).sort({ category: 1, name: 1 });
  res.json({ success: true, data: items });
}));

router.get('/categories', asyncHandler(async (req, res) => {
  res.json({ success: true, data: (await MenuItem.distinct('category', { active: true })).sort() });
}));

router.post('/', authorize('Admin'), validate(body), asyncHandler(async (req, res) => {
  res.status(201).json({ success: true, data: await MenuItem.create(req.body) });
}));

router.put('/:id', authorize('Admin'), validate(body.partial()), asyncHandler(async (req, res) => {
  const item = await MenuItem.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!item) throw new ApiError(404, 'NOT_FOUND', 'Menu item not found');
  res.json({ success: true, data: item });
}));

// Soft delete: keeps historical orders intact
router.delete('/:id', authorize('Admin'), asyncHandler(async (req, res) => {
  const item = await MenuItem.findByIdAndUpdate(req.params.id, { active: false }, { new: true });
  if (!item) throw new ApiError(404, 'NOT_FOUND', 'Menu item not found');
  res.json({ success: true, data: item });
}));
module.exports = router;
