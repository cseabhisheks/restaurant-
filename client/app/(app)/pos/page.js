'use client';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Plus, Minus, Trash2, ShoppingBag } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/components/Toast';
import { money, catEmoji } from '@/lib/format';
import { Btn, PageLoader, Empty } from '@/components/ui';

const r2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

function POS() {
  const router = useRouter(); const editId = useSearchParams().get('edit'); const toast = useToast(); const { isAdmin } = useAuth();
  const [menu, setMenu] = useState(null); const [tax, setTax] = useState(5);
  const [cat, setCat] = useState('All'); const [q, setQ] = useState('');
  const [cart, setCart] = useState({}); // id -> {id,name,price,qty}
  const [type, setType] = useState('Dine-in'); const [table, setTable] = useState(''); const [customer, setCustomer] = useState('');
  const [dType, setDType] = useState('none'); const [dVal, setDVal] = useState(''); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const [m, s] = await Promise.all([api('/menu'), api('/settings')]);
      setMenu(m.data); setTax(s.data.taxRate);
      if (editId) {
        const o = (await api(`/orders/${editId}`)).data;
        setCart(Object.fromEntries(o.items.map((i) => [i.menuItem, { id: i.menuItem, name: i.name, price: i.price, qty: i.quantity }])));
        setType(o.type); setTable(o.tableNumber || ''); setCustomer(o.customerName || ''); setDType(o.discountType); setDVal(o.discountValue || '');
      }
    })().catch((e) => toast(e.message, 'error'));
  }, [editId, toast]);

  const cats = useMemo(() => ['All', ...new Set((menu || []).map((i) => i.category))], [menu]);
  const shown = (menu || []).filter((i) => (cat === 'All' || i.category === cat) && i.name.toLowerCase().includes(q.toLowerCase()));
  const lines = Object.values(cart);
  const add = (i, d = 1) => setCart((c) => {
    const cur = c[i._id || i.id]; const qty = (cur?.qty || 0) + d; const n = { ...c };
    if (qty <= 0) delete n[i._id || i.id]; else n[i._id || i.id] = { id: i._id || i.id, name: i.name, price: i.price, qty: Math.min(qty, 50) };
    return n;
  });

  // preview only — the server recomputes and is authoritative
  const subtotal = r2(lines.reduce((s, l) => s + l.price * l.qty, 0));
  const dv = Number(dVal) || 0;
  const discount = Math.min(dType === 'percent' ? r2(subtotal * dv / 100) : dType === 'flat' ? dv : 0, subtotal);
  const taxAmt = r2((subtotal - discount) * tax / 100); const total = r2(subtotal - discount + taxAmt);

  async function submit() {
    setErr('');
    if (!lines.length) return setErr('Add at least one item');
    if (type === 'Dine-in' && !table.trim()) return setErr('Enter a table number');
    if (dType === 'percent' && dv > 100) return setErr('Discount cannot exceed 100%');
    setBusy(true);
    const body = { type, tableNumber: type === 'Dine-in' ? table : undefined, customerName: customer || undefined,
      items: lines.map((l) => ({ menuItemId: l.id, quantity: l.qty })), discountType: dType, discountValue: dType === 'none' ? 0 : dv };
    try {
      const r = await api(editId ? `/orders/${editId}` : '/orders', { method: editId ? 'PUT' : 'POST', body });
      toast(editId ? 'Order updated' : `Order ${r.data.orderNumber} created`); router.push(`/orders/${r.data._id}`);
    } catch (e) { setErr(e.message); setBusy(false); }
  }

  if (!menu) return <PageLoader />;
  return (
    <div className="fade">
      <div className="page-head"><div><h1>{editId ? 'Edit order' : 'New order'}</h1><p>Tap a dish to add it to the ticket.</p></div></div>
      <div className="pos">
        <div>
          <div className="search"><Search size={17} /><input className="input" placeholder="Search dishes…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
          <div className="chips" style={{ marginTop: 12 }}>{cats.map((c) => <button key={c} className={`chip ${cat === c ? 'on' : ''}`} onClick={() => setCat(c)}>{c}</button>)}</div>
          <div className="pos-items">{shown.map((i) => (
            <button key={i._id} className="pi" disabled={!i.available} onClick={() => add(i)}>
              {cart[i._id] && <span className="q">{cart[i._id].qty}</span>}
              <div className="art">{catEmoji(i.category)}</div>
              <div className="b"><b>{i.name}</b>{i.available ? <span className="mono">{money(i.price)}</span> : <span className="muted">Unavailable</span>}</div>
            </button>))}</div>
        </div>
        <aside className="card cart">
          <h3 style={{ margin: 0 }}>Ticket</h3>
          <div className="seg">{['Dine-in', 'Takeaway'].map((t) => <button key={t} className={type === t ? 'on' : ''} onClick={() => setType(t)}>{t}</button>)}</div>
          <div className="col2">{type === 'Dine-in' && <input className="input" placeholder="Table no." value={table} maxLength={10} onChange={(e) => setTable(e.target.value)} />}
            <input className="input" placeholder="Customer (optional)" value={customer} maxLength={60} onChange={(e) => setCustomer(e.target.value)} style={type === 'Takeaway' ? { gridColumn: '1/-1' } : {}} /></div>
          {lines.length === 0 ? <Empty icon={ShoppingBag} title="Ticket is empty" text="Pick items from the menu." /> : (
            <div className="cart-lines">{lines.map((l) => (
              <div className="cl" key={l.id}><div className="n"><b>{l.name}</b><small className="mono">{money(l.price)}</small></div>
                <div className="qty"><button onClick={() => add(l, -1)} aria-label="Decrease"><Minus size={14} /></button><span>{l.qty}</span><button onClick={() => add(l, 1)} aria-label="Increase"><Plus size={14} /></button></div>
                <b className="mono" style={{ minWidth: 70, textAlign: 'right' }}>{money(l.price * l.qty)}</b>
                <button className="icon-btn" onClick={() => add(l, -l.qty)} aria-label="Remove"><Trash2 size={16} /></button></div>))}</div>)}
          <div className="col2"><select className="input" value={dType} onChange={(e) => setDType(e.target.value)}><option value="none">No discount</option><option value="percent">Discount %</option><option value="flat">Discount ₹</option></select>
            <input className="input" type="number" min="0" placeholder={isAdmin ? 'Value' : 'Max 20%'} disabled={dType === 'none'} value={dVal} onChange={(e) => setDVal(e.target.value)} /></div>
          <div className="sum mono"><div><span className="muted">Subtotal</span><span>{money(subtotal)}</span></div>
            {discount > 0 && <div><span className="muted">Discount</span><span>−{money(discount)}</span></div>}
            <div><span className="muted">Tax ({tax}%)</span><span>{money(taxAmt)}</span></div><div className="tot"><span>Total</span><span>{money(total)}</span></div></div>
          {err && <div className="err" role="alert">{err}</div>}
          <Btn className="btn-block" loading={busy} onClick={submit}>{editId ? 'Save changes' : 'Place order'}</Btn>
        </aside>
      </div>
    </div>
  );
}
export default function Page() { return <Suspense fallback={<PageLoader />}><POS /></Suspense>; }
