const mongoose = require('mongoose');
const cached = global.__mongoose || (global.__mongoose = { conn: null, promise: null });

async function connectDB() {
  if (cached.conn) return cached.conn;
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not set');
  cached.promise = cached.promise || mongoose.connect(process.env.MONGODB_URI);
  cached.conn = await cached.promise;
  return cached.conn;
}
module.exports = { connectDB };
