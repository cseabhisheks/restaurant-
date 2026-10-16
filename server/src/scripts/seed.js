require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB } = require('../config/db');
const { User, MenuItem, Settings } = require('../models');

const menu = [
  ['Paneer Tikka', 'Starters', 260], ['Crispy Corn', 'Starters', 180], ['Chicken 65', 'Starters', 290], ['Veg Spring Rolls', 'Starters', 170],
  ['Butter Chicken', 'Mains', 390], ['Dal Makhani', 'Mains', 280], ['Paneer Butter Masala', 'Mains', 320], ['Veg Biryani', 'Mains', 260], ['Chicken Biryani', 'Mains', 340],
  ['Butter Naan', 'Breads', 55], ['Garlic Naan', 'Breads', 70], ['Tandoori Roti', 'Breads', 35],
  ['Margherita Pizza', 'Pizza & Pasta', 330], ['Penne Arrabbiata', 'Pizza & Pasta', 290],
  ['Masala Chai', 'Beverages', 60], ['Cold Coffee', 'Beverages', 140], ['Fresh Lime Soda', 'Beverages', 90], ['Mango Lassi', 'Beverages', 110],
  ['Gulab Jamun', 'Desserts', 100], ['Brownie with Ice Cream', 'Desserts', 190],
];

(async () => {
  await connectDB();
  await Promise.all([User.deleteMany({}), MenuItem.deleteMany({}), Settings.deleteMany({})]);
  await User.create([
    { name: 'Aarav Admin', email: 'admin@urstech.demo', password: 'Admin@123', role: 'Admin' },
    { name: 'Siya Staff', email: 'staff@urstech.demo', password: 'Staff@123', role: 'Staff' },
  ]);
  await MenuItem.insertMany(menu.map(([name, category, price], i) => ({ name, category, price, available: i !== 7 })));
  await Settings.create({ key: 'main' });
  console.log('Seeded: 2 users, %d menu items', menu.length);
  await mongoose.disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
