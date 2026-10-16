'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/components/Toast';
import { Btn, PageLoader } from '@/components/ui';

export default function SettingsPage() {
  const { isAdmin } = useAuth(); const router = useRouter(); const toast = useToast();
  const [f, setF] = useState(null); const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  useEffect(() => { if (!isAdmin) router.replace('/dashboard'); else api('/settings').then((r) => setF(r.data)); }, [isAdmin, router]);
  async function save() {
    setErr(''); const tax = Number(f.taxRate);
    if (isNaN(tax) || tax < 0 || tax > 40) return setErr('Tax rate must be between 0 and 40');
    setBusy(true);
    try { await api('/settings', { method: 'PUT', body: { restaurantName: f.restaurantName, address: f.address, taxRate: tax } }); toast('Settings saved'); } catch (e) { setErr(e.message); } finally { setBusy(false); }
  }
  if (!f) return <PageLoader />;
  return (
    <div className="fade"><div className="page-head"><div><h1>Settings</h1><p>Applied to every new order and printed bill.</p></div></div>
      <div className="card stack" style={{ maxWidth: 520 }}>{err && <div className="err">{err}</div>}
        <div><label className="f">Restaurant name</label><input className="input" value={f.restaurantName} onChange={(e) => setF({ ...f, restaurantName: e.target.value })} /></div>
        <div><label className="f">Address</label><input className="input" value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} /></div>
        <div><label className="f">Tax rate (%)</label><input className="input" type="number" min="0" max="40" step="0.1" value={f.taxRate} onChange={(e) => setF({ ...f, taxRate: e.target.value })} /></div>
        <Btn loading={busy} onClick={save}>Save settings</Btn></div></div>
  );
}
