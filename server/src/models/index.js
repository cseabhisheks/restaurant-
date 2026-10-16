const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { Schema } = mongoose;

const userSchema = new Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ['Admin', 'Staff'], default: 'Staff' },
  active: { type: Boolean, default: true },
}, { timestamps: true });
userSchema.pre('save', async function (next) {
  if (this.isModified('password')) this.password = await bcrypt.hash(this.password, 10);
  next();
});
userSchema.methods.comparePassword = function (pw) { return bcrypt.compare(pw, this.password); };

const menuItemSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  category: { type: String, required: true, trim: true, index: true },
  description: { type: String, trim: true, maxlength: 200, default: '' },
  price: { type: Number, required: true, min: 0 },
  available: { type: Boolean, default: true },   // temporarily out of stock
  active: { type: Boolean, default: true },      // deactivated (soft delete)
}, { timestamps: true });

const orderItemSchema = new Schema({
  menuItem: { type: Schema.Types.ObjectId, ref: 'MenuItem', required: true },
  name: String, price: Number, quantity: Number, lineTotal: Number,
}, { _id: false });

const orderSchema = new Schema({
  orderNumber: { type: String, unique: true, index: true },
  type: { type: String, enum: ['Dine-in', 'Takeaway'], required: true },
  tableNumber: { type: String, trim: true },
  customerName: { type: String, trim: true },
  notes: { type: String, trim: true },
  items: { type: [orderItemSchema], validate: (v) => v.length > 0 },
  subtotal: Number,
  discountType: { type: String, enum: ['none', 'percent', 'flat'], default: 'none' },
  discountValue: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  taxRate: Number, taxAmount: Number, total: Number,
  status: { type: String, enum: ['Pending', 'Preparing', 'Ready', 'Completed', 'Cancelled'], default: 'Pending', index: true },
  statusHistory: [{ status: String, at: { type: Date, default: Date.now }, by: { type: Schema.Types.ObjectId, ref: 'User' }, _id: false }],
  payment: {
    status: { type: String, enum: ['Unpaid', 'Paid'], default: 'Unpaid' },
    method: { type: String, enum: ['Cash', 'UPI', 'Card'] },
    reference: String, amount: Number, paidAt: Date,
    recordedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });
orderSchema.index({ createdAt: -1 });

const counterSchema = new Schema({ _id: String, seq: { type: Number, default: 0 } });
const settingsSchema = new Schema({
  key: { type: String, default: 'main', unique: true },
  restaurantName: { type: String, default: 'Ember & Oak' },
  address: { type: String, default: '12 MG Road, New Delhi' },
  taxRate: { type: Number, default: 5, min: 0, max: 40 },
});

const m = (n, s) => mongoose.models[n] || mongoose.model(n, s);
module.exports = {
  User: m('User', userSchema), MenuItem: m('MenuItem', menuItemSchema),
  Order: m('Order', orderSchema), Counter: m('Counter', counterSchema),
  Settings: m('Settings', settingsSchema),
};
