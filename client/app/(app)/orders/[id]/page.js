'use client';
import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Printer, Pencil, Check, Banknote, Smartphone, CreditCard } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/components/Toast';
import { money, dateTime, STATUS_FLOW, NEXT_STATUS } from '@/lib/format';
import { Btn, StatusBadge, PayBadge, PageLoader } from '@/components/ui';

const METHODS = [['Cash', Banknote], ['UPI', Smartphone], ['Card', CreditCard]];

export default function OrderDetail() {
  const { id } = useParams(); const router = useRouter(); const toast = useToast();
  const [o, setO] = useState(null); const [s, setS] = useState(null);
  const [method, setMethod] = useState('Cash'); const [ref, setRef] = useState(''); const [busy, setBusy] = useState('');

  const load = useCallback(() => Promise.all([api(`/orders/${id}`), api('/settings')]).then(([a, b]) => { setO(a.data); setS(b.data); }).catch((e) => { toast(e.message, 'error'); router.push('/orders'); }), [id, router, toast]);
  useEffect(() => { load(); }, [load]);

  async function run(key, fn, msg) {
    setBusy(key);
    try { const r = await fn(); setO(r.data); toast(msg); } catch (e) { toast(e.message, 'error'); } finally { setBusy(''); }
  }
  if (!o) return <PageLoader />;
  const idx = STATUS_FLOW.indexOf(o.status); const cancelled = o.status === 'Cancelled';
  const next = NEXT_STATUS[o.status]; const paid = o.payment.status === 'Paid'; const editable = o.status === 'Pending' && !paid;

  return (
    <div className="fade">
      <div className="page-head no-print"><div><Link href="/orders" className="muted row" style={{ gap: 6, marginBottom: 8 }}><ArrowLeft size={15} />All orders</Link>
        <h1>{o.orderNumber}</h1><p>{o.type}{o.tableNumber ? ` · Table ${o.tableNumber}` : ''} · {dateTime(o.createdAt)} · by {o.createdBy?.name}</p></div>
        <div className="row"><StatusBadge status={o.status} /><PayBadge status={o.payment.status} />
          <button className="btn btn-ghost" onClick={() => window.print()}><Printer size={16} />Print bill</button>
          {editable && <Link href={`/pos?edit=${o._id}`} className="btn btn-ghost"><Pencil size={16} />Edit</Link>}</div></div>

      <div className="detail">
        <div className="stack">
          {!cancelled && <div className="card no-print"><div className="stepper">{STATUS_FLOW.map((st, i) => (
            <div key={st} className={`step ${i < idx || o.status === 'Completed' ? 'done' : i === idx ? 'now' : ''}`}><i>{i < idx || o.status === 'Completed' ? <Check size={15} /> : i + 1}</i>{st}</div>))}</div>
            <div className="row" style={{ marginTop: 18 }}>
              {next && <Btn loading={busy === 's'} onClick={() => run('s', () => api(`/orders/${o._id}/status`, { method: 'PATCH', body: { status: next } }), `Marked ${next}`)} disabled={next === 'Completed' && !paid}>Mark as {next}</Btn>}
              {next === 'Completed' && !paid && <span className="muted">Record payment to complete.</span>}
              {['Pending', 'Preparing'].includes(o.status) && !paid && <Btn variant="danger" loading={busy === 'c'} onClick={() => confirm('Cancel this order?') && run('c', () => api(`/orders/${o._id}/status`, { method: 'PATCH', body: { status: 'Cancelled' } }), 'Order cancelled')}>Cancel order</Btn>}
            </div></div>}

          <div className="card">
            <div className="bill-head"><h2>{s?.restaurantName}</h2><p>{s?.address}</p><p>{o.orderNumber} · {dateTime(o.createdAt)}</p><hr style={{ margin: '12px 0' }} /></div>
            <h3 className="no-print">Items</h3>
            <table className="table"><thead><tr><th>Item</th><th className="right">Qty</th><th className="right">Price</th><th className="right">Total</th></tr></thead>
              <tbody>{o.items.map((i) => <tr key={i.menuItem}><td><b>{i.name}</b></td><td className="right mono">{i.quantity}</td><td className="right mono">{money(i.price)}</td><td className="right mono">{money(i.lineTotal)}</td></tr>)}</tbody></table>
            <div className="sum mono" style={{ marginLeft: 'auto', maxWidth: 300, marginTop: 14 }}>
              <div><span className="muted">Subtotal</span><span>{money(o.subtotal)}</span></div>
              {o.discountAmount > 0 && <div><span className="muted">Discount{o.discountType === 'percent' ? ` (${o.discountValue}%)` : ''}</span><span>−{money(o.discountAmount)}</span></div>}
              <div><span className="muted">Tax ({o.taxRate}%)</span><span>{money(o.taxAmount)}</span></div>
              <div className="tot"><span>Total</span><span>{money(o.total)}</span></div></div>
            {paid && <p className="muted" style={{ marginTop: 14 }}>Paid via {o.payment.method}{o.payment.reference ? ` (${o.payment.reference})` : ''} on {dateTime(o.payment.paidAt)}. Thank you!</p>}
          </div>
        </div>

        <div className="stack no-print">
          <div className="card"><h3>Payment</h3>
            {paid ? <div className="stack"><PayBadge status="Paid" /><div className="sum mono"><div><span className="muted">Method</span><span>{o.payment.method}</span></div><div><span className="muted">Amount</span><span>{money(o.payment.amount)}</span></div>{o.payment.recordedBy && <div><span className="muted">Recorded by</span><span>{o.payment.recordedBy.name}</span></div>}</div></div>
              : cancelled ? <p className="muted">This order was cancelled.</p> : (
                <div className="stack"><div className="seg">{METHODS.map(([m, I]) => <button key={m} className={method === m ? 'on' : ''} onClick={() => setMethod(m)}><I size={14} style={{ verticalAlign: -2 }} /> {m}</button>)}</div>
                  {method !== 'Cash' && <input className="input" placeholder={method === 'UPI' ? 'UPI transaction ID (optional)' : 'Last 4 digits (optional)'} maxLength={40} value={ref} onChange={(e) => setRef(e.target.value)} />}
                  <Btn loading={busy === 'p'} onClick={() => run('p', () => api(`/orders/${o._id}/payment`, { method: 'POST', body: { method, reference: ref || undefined } }), 'Payment recorded')}>Record {money(o.total)}</Btn></div>)}
          </div>
          <div className="card"><h3>Timeline</h3>{o.statusHistory.map((h, i) => <div className="list-row" key={i}><StatusBadge status={h.status} /><span className="muted grow right">{dateTime(h.at)}</span></div>)}</div>
        </div>
      </div>
    </div>
  );
}
