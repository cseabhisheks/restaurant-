'use client';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { Search, Plus, Pencil, EyeOff, Eye, UtensilsCrossed } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/components/Toast';
import { money, catEmoji } from '@/lib/format';
import { Modal, Btn, PageLoader, Empty } from '@/components/ui';

const blank = { name: '', category: '', price: '', description: '', available: true };

export default function Menu() {
  const { isAdmin } = useAuth(); const toast = useToast();
  const [items, setItems] = useState(null); const [q, setQ] = useState(''); const [cat, setCat] = useState('All');
  const [inactive, setInactive] = useState(false); const [form, setForm] = useState(null); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);

  const load = useCallback(() => api(`/menu${inactive && isAdmin ? '?includeInactive=true' : ''}`).then((r) => setItems(r.data)).catch((e) => toast(e.message, 'error')), [inactive, isAdmin, toast]);
  useEffect(() => { load(); }, [load]);

  const cats = useMemo(() => ['All', ...new Set((items || []).map((i) => i.category))], [items]);
  const shown = (items || []).filter((i) => (cat === 'All' || i.category === cat) && i.name.toLowerCase().includes(q.toLowerCase()));

  async function save() {
    setErr('');
    const price = Number(form.price);
    if (form.name.trim().length < 2) return setErr('Name must be at least 2 characters');
    if (form.category.trim().length < 2) return setErr('Category is required');
    if (form.price === '' || isNaN(price) || price < 0) return setErr('Enter a valid price');
    setBusy(true);
    try {
      const body = { name: form.name, category: form.category, description: form.description, price, available: form.available };
      await api(form._id ? `/menu/${form._id}` : '/menu', { method: form._id ? 'PUT' : 'POST', body });
      toast(form._id ? 'Item updated' : 'Item added'); setForm(null); load();
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  }
  const patch = (i, body, msg) => api(`/menu/${i._id}`, { method: 'PUT', body }).then(() => { toast(msg); load(); }).catch((e) => toast(e.message, 'error'));

  if (!items) return <PageLoader />;
  return (
    <div className="fade">
      <div className="page-head"><div><h1>Menu</h1><p>{items.length} dishes across {cats.length - 1} categories</p></div>
        {isAdmin && <Btn onClick={() => { setErr(''); setForm({ ...blank }); }}><Plus size={17} />Add item</Btn>}</div>
      <div className="row" style={{ marginBottom: 14 }}>
        <div className="search"><Search size={17} /><input className="input" placeholder="Search dishes…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        {isAdmin && <label className="row muted" style={{ gap: 8 }}><input type="checkbox" checked={inactive} onChange={(e) => setInactive(e.target.checked)} />Show deactivated</label>}
      </div>
      <div className="chips" style={{ marginBottom: 18 }}>{cats.map((c) => <button key={c} className={`chip ${cat === c ? 'on' : ''}`} onClick={() => setCat(c)}>{c}</button>)}</div>
      {shown.length === 0 ? <div className="card"><Empty icon={UtensilsCrossed} title="Nothing found" text="Try a different search or category." /></div> : (
        <div className="menu-grid">{shown.map((i) => (
          <div key={i._id} className={`card mi ${!i.active || !i.available ? 'off' : ''}`}>
            {!i.active ? <span className="badge s-Cancelled tag">Deactivated</span> : !i.available && <span className="badge s-Pending tag">Unavailable</span>}
            <div className="art">{catEmoji(i.category)}</div>
            <div className="body"><div className="row" style={{ justifyContent: 'space-between' }}><h4>{i.name}</h4><span className="price mono">{money(i.price)}</span></div>
              <div className="cat">{i.category}</div>
              {isAdmin && <div className="row" style={{ marginTop: 12, gap: 6 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => { setErr(''); setForm({ ...i }); }}><Pencil size={14} />Edit</button>
                {i.active && <button className="btn btn-ghost btn-sm" onClick={() => patch(i, { available: !i.available }, i.available ? 'Marked unavailable' : 'Marked available')}>{i.available ? 'Sold out' : 'Restock'}</button>}
                <button className="icon-btn" title={i.active ? 'Deactivate' : 'Activate'} onClick={() => patch(i, { active: !i.active }, i.active ? 'Item deactivated' : 'Item activated')}>{i.active ? <EyeOff size={17} /> : <Eye size={17} />}</button>
              </div>}</div>
          </div>))}</div>)}
      {form && <Modal title={form._id ? 'Edit item' : 'New menu item'} onClose={() => setForm(null)} footer={<><Btn variant="ghost" onClick={() => setForm(null)}>Cancel</Btn><Btn loading={busy} onClick={save}>Save</Btn></>}>
        <div className="stack">{err && <div className="err">{err}</div>}
          <div><label className="f">Name</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div className="col2"><div><label className="f">Category</label><input className="input" list="cats" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /><datalist id="cats">{cats.slice(1).map((c) => <option key={c} value={c} />)}</datalist></div>
            <div><label className="f">Price (₹)</label><input className="input" type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div></div>
          <div><label className="f">Description</label><input className="input" value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <label className="row" style={{ gap: 8 }}><input type="checkbox" checked={form.available} onChange={(e) => setForm({ ...form, available: e.target.checked })} />Available for ordering</label>
        </div></Modal>}
    </div>
  );
}
