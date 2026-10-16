'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ClipboardList } from 'lucide-react';
import { api } from '@/lib/api';
import { money, dateTime } from '@/lib/format';
import { StatusBadge, PayBadge, PageLoader, Empty } from '@/components/ui';

const TABS = ['All', 'Pending', 'Preparing', 'Ready', 'Completed', 'Cancelled'];

export default function Orders() {
  const router = useRouter();
  const [q, setQ] = useState(''); const [status, setStatus] = useState('All'); const [page, setPage] = useState(1);
  const [res, setRes] = useState(null); const [err, setErr] = useState('');

  useEffect(() => {
    const t = setTimeout(() => {
      const p = new URLSearchParams({ page, limit: 15 });
      if (q) p.set('q', q); if (status !== 'All') p.set('status', status);
      api(`/orders?${p}`).then(setRes).catch((e) => setErr(e.message));
    }, 250);
    return () => clearTimeout(t);
  }, [q, status, page]);

  return (
    <div className="fade">
      <div className="page-head"><div><h1>Orders</h1><p>Search by order number or filter by status.</p></div></div>
      <div className="row" style={{ marginBottom: 14 }}>
        <div className="search"><Search size={17} /><input className="input" placeholder="Order number e.g. ORD-261016-004" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} /></div></div>
      <div className="chips" style={{ marginBottom: 16 }}>{TABS.map((t) => <button key={t} className={`chip ${status === t ? 'on' : ''}`} onClick={() => { setStatus(t); setPage(1); }}>{t}</button>)}</div>
      {err && <div className="err">{err}</div>}
      {!res ? <PageLoader /> : (
        <div className="card tbl-wrap">
          {res.data.length === 0 ? <Empty icon={ClipboardList} title="No orders found" text="Adjust the search or status filter." /> : (
            <table className="table"><thead><tr><th>Order</th><th>Type</th><th>Placed</th><th>Status</th><th>Payment</th><th className="right">Total</th></tr></thead>
              <tbody>{res.data.map((o) => (
                <tr key={o._id} className="click" onClick={() => router.push(`/orders/${o._id}`)}>
                  <td><b>{o.orderNumber}</b><div className="muted">{o.items.length} item{o.items.length > 1 ? 's' : ''}</div></td>
                  <td>{o.type}{o.tableNumber ? ` · T${o.tableNumber}` : ''}</td><td className="muted">{dateTime(o.createdAt)}</td>
                  <td><StatusBadge status={o.status} /></td><td><PayBadge status={o.payment.status} /></td><td className="right mono"><b>{money(o.total)}</b></td></tr>))}</tbody></table>)}
          {res.meta.pages > 1 && <div className="row" style={{ justifyContent: 'space-between', padding: 16 }}>
            <span className="muted">Page {res.meta.page} of {res.meta.pages} · {res.meta.total} orders</span>
            <div className="row"><button className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button><button className="btn btn-ghost btn-sm" disabled={page >= res.meta.pages} onClick={() => setPage(page + 1)}>Next</button></div></div>}
        </div>)}
    </div>
  );
}
