'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Flame, ReceiptText, ChefHat, BarChart3 } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { Btn } from '@/components/ui';

export default function Login() {
  const { login, user, ready } = useAuth(); const router = useRouter();
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  useEffect(() => { if (ready && user) router.replace('/dashboard'); }, [ready, user, router]);

  async function submit(e) {
    e.preventDefault(); setError('');
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError('Enter a valid email address');
    if (!password) return setError('Password is required');
    setBusy(true);
    try { await login(email, password); router.replace('/dashboard'); } catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  return (
    <div className="login">
      <section className="hero">
        <div className="brand"><div className="brand-mark"><Flame size={20} /></div><div><b>Ember &amp; Oak</b><small>Point of Sale</small></div></div>
        <div><h1>Serve faster. Bill flawlessly.</h1><p>One calm screen for menu, orders, billing and the day&apos;s sales — built for busy kitchens and front-of-house.</p></div>
        <div className="pills"><span><ChefHat size={14} style={{verticalAlign:-2}} /> Live order flow</span><span><ReceiptText size={14} style={{verticalAlign:-2}} /> Server-verified bills</span><span><BarChart3 size={14} style={{verticalAlign:-2}} /> Daily sales</span></div>
      </section>
      <section className="login-form">
        <form className="box fade stack" onSubmit={submit} noValidate>
          <div><h2>Welcome back</h2><p className="muted" style={{marginTop:4}}>Sign in to open your shift.</p></div>
          {error && <div className="err" role="alert">{error}</div>}
          <div><label className="f" htmlFor="e">Email</label><input id="e" className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" /></div>
          <div><label className="f" htmlFor="p">Password</label><input id="p" className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" /></div>
          <Btn className="btn-block" loading={busy}>Sign in</Btn>
          <div className="demo">
            <button type="button" onClick={() => { setEmail('admin@urstech.demo'); setPassword('Admin@123'); }}><b>Admin</b><small>Full access</small></button>
            <button type="button" onClick={() => { setEmail('staff@urstech.demo'); setPassword('Staff@123'); }}><b>Staff</b><small>Orders &amp; billing</small></button>
          </div>
        </form>
      </section>
    </div>
  );
}
