const router = require('express').Router();
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const { User } = require('../models');
const { ApiError, asyncHandler } = require('../utils/errors');
const { validate, authenticate } = require('../middleware');

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });
const pub = (u) => ({ id: u.id, name: u.name, email: u.email, role: u.role });

router.post('/login', validate(loginSchema), asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email }).select('+password');
  if (!user || !user.active || !(await user.comparePassword(req.body.password)))
    throw new ApiError(401, 'INVALID_CREDENTIALS', 'Incorrect email or password');
  const token = jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '8h' });
  res.json({ success: true, data: { token, user: pub(user) } });
}));

router.get('/me', authenticate, (req, res) => res.json({ success: true, data: { user: pub(req.user) } }));
module.exports = router;
