'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { IndianRupee, ClipboardList, CheckCircle2, Timer, Trophy, ReceiptText } from 'lucide-react';
import { api } from '@/lib/api';
import { money, timeOnly } from '@/lib/format';
import { PageLoader, StatusBadge, Empty } from '@/components/ui';

export default function Dashboard() {
  const [d, setD] = useState(null); const [recent, setRecent] = useState([]); const [err, setErr] = useState('');
  useEffect(() => {
    Promise.all([api('/reports/daily-sales'), api('/orders?limit=6')])
      .then(([r, o]) => { setD(r.data); setRecent(o.data); }).catch((e) => setErr(e.message));
  }, []);
  if (err) return <div className="err">{err}</div>;
  if (!d) return <PageLoader />;
  const max = Math.max(...d.trend.map((t) => t.total), 1);
  const stats = [
    { l: "Today's sales", v: money(d.dailySales), i: IndianRupee },
    { l: 'Total orders', v: d.totalOrders, i: ClipboardList },
    { l: 'Completed', v: d.completedOrders, i: CheckCircle2 },
    { l: 'In progress', v: d.activeOrders, i: Timer },
  ];
  return (
    <div className="fade">
      <div className="page-head"><div><h1>Good service starts here</h1><p>{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })} · avg. bill {money(d.averageOrderValue)}</p></div>
        <Link href="/pos" className="btn btn-primary">+ New order</Link></div>
      <div className="stats">{stats.map(({ l, v, i: I }) => <div key={l} className="card stat"><div className="ic"><I size={20} /></div><small>{l}</small><b className="mono">{v}</b></div>)}</div>
      <div className="grid2">
        <div className="card"><h3>Sales — last 7 days</h3>
          <div className="bars">{d.trend.map((t, i) => (
            <div key={t.date} className={`bar ${i < 6 ? 'dim' : ''}`} title={money(t.total)}><i style={{ height: `${Math.max((t.total / max) * 100, 3)}%` }} /><span>{new Date(t.date).toLocaleDateString('en-IN', { weekday: 'short' })}</span></div>))}</div></div>
        <div className="card"><h3><Trophy size={16} style={{ verticalAlign: -2, color: 'var(--accent)' }} /> Top sellers today</h3>
          {d.topItems.length ? d.topItems.map((t, i) => (
            <div className="list-row" key={t.name}><span className="rank">{i + 1}</span><div className="grow"><b>{t.name}</b><div className="muted">{t.quantity} sold</div></div><b className="mono">{money(t.revenue)}</b></div>))
            : <p className="muted">No sales yet today.</p>}</div>
      </div>
      <div className="card tbl-wrap" style={{ marginTop: 18 }}>
        <h3 style={{ padding: '20px 20px 0' }}>Recent orders</h3>
        {recent.length ? (
          <table className="table"><tbody>{recent.map((o) => (
            <tr key={o._id} className="click" onClick={() => (window.location.href = `/orders/${o._id}`)}>
              <td><b>{o.orderNumber}</b><div className="muted">{o.type}{o.tableNumber ? ` · Table ${o.tableNumber}` : ''}</div></td>
              <td className="muted">{timeOnly(o.createdAt)}</td><td><StatusBadge status={o.status} /></td><td className="right mono"><b>{money(o.total)}</b></td></tr>))}</tbody></table>
        ) : <Empty icon={ReceiptText} title="No orders yet" text="Create your first order to see it here." />}
      </div>
    </div>
  );
}
