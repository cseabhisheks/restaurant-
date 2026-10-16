export const money = (n = 0) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n);
export const dateTime = (d) => new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
export const timeOnly = (d) => new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
export const STATUS_FLOW = ['Pending', 'Preparing', 'Ready', 'Completed'];
export const NEXT_STATUS = { Pending: 'Preparing', Preparing: 'Ready', Ready: 'Completed' };
const EMOJI = { starters: '🥟', mains: '🍛', breads: '🫓', pizza: '🍕', beverages: '🥤', desserts: '🍮', drinks: '🥤', salads: '🥗', burgers: '🍔' };
export const catEmoji = (c = '') => EMOJI[Object.keys(EMOJI).find((k) => c.toLowerCase().includes(k))] || '🍽️';
