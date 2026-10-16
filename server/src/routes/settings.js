const router = require('express').Router();
const { z } = require('zod');
const { Settings } = require('../models');
const { asyncHandler } = require('../utils/errors');
const { validate, authenticate, authorize } = require('../middleware');

const getSettings = () => Settings.findOneAndUpdate({ key: 'main' }, { $setOnInsert: { key: 'main' } }, { upsert: true, new: true });
router.use(authenticate);
router.get('/', asyncHandler(async (req, res) => res.json({ success: true, data: await getSettings() })));
router.put('/', authorize('Admin'), validate(z.object({
  restaurantName: z.string().trim().min(2).max(60).optional(),
  address: z.string().trim().max(120).optional(),
  taxRate: z.number().min(0).max(40).optional(),
})), asyncHandler(async (req, res) => {
  const s = await Settings.findOneAndUpdate({ key: 'main' }, req.body, { upsert: true, new: true, runValidators: true });
  res.json({ success: true, data: s });
}));
module.exports = router; module.exports.getSettings = getSettings;
