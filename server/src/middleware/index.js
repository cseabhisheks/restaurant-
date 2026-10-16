const jwt = require('jsonwebtoken');
const { ZodError } = require('zod');
const { ApiError } = require('../utils/errors');
const { User } = require('../models');

async function authenticate(req, res, next) {
  try {
    const h = req.headers.authorization || '';
    if (!h.startsWith('Bearer ')) throw new ApiError(401, 'UNAUTHENTICATED', 'Authentication required');
    const payload = jwt.verify(h.slice(7), process.env.JWT_SECRET);
    const user = await User.findById(payload.sub);
    if (!user || !user.active) throw new ApiError(401, 'UNAUTHENTICATED', 'Account not found or disabled');
    req.user = user;
    next();
  } catch (e) { next(e); }
}
const authorize = (...roles) => (req, res, next) =>
  roles.includes(req.user.role) ? next() : next(new ApiError(403, 'FORBIDDEN', `Requires role: ${roles.join(' or ')}`));

const validate = (schema, part = 'body') => (req, res, next) => {
  const r = schema.safeParse(req[part]);
  if (!r.success) return next(r.error);
  req[part] = r.data; next();
};

function notFound(req, res, next) { next(new ApiError(404, 'NOT_FOUND', `Route ${req.method} ${req.originalUrl} not found`)); }

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let status = err.status || 500, code = err.code || 'INTERNAL_ERROR', message = err.message, details = err.details;
  if (err instanceof ZodError) {
    status = 400; code = 'VALIDATION_ERROR'; message = 'Invalid request data';
    details = err.issues.map((i) => ({ field: i.path.join('.'), message: i.message }));
  } else if (err.name === 'CastError') { status = 400; code = 'INVALID_ID'; message = 'Invalid identifier'; }
  else if (err.code === 11000) { status = 409; code = 'DUPLICATE'; message = 'Duplicate value'; }
  else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') { status = 401; code = 'UNAUTHENTICATED'; message = 'Invalid or expired token'; }
  if (status >= 500) { console.error(err); message = 'Something went wrong'; }
  res.status(status).json({ success: false, error: { code, message, details } });
}
module.exports = { authenticate, authorize, validate, notFound, errorHandler };
