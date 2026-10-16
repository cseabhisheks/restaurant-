'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Flame, LayoutDashboard, ShoppingBag, ClipboardList, UtensilsCrossed, Settings, LogOut } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { PageLoader } from '@/components/ui';

const links = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/pos', label: 'New Order', icon: ShoppingBag },
  { href: '/orders', label: 'Orders', icon: ClipboardList },
  { href: '/menu', label: 'Menu', icon: UtensilsCrossed },
  { href: '/settings', label: 'Settings', icon: Settings, admin: true },
];

export default function AppLayout({ children }) {
  const { user, ready, logout, isAdmin } = useAuth(); const router = useRouter(); const path = usePathname();
  useEffect(() => { if (ready && !user) router.replace('/login'); }, [ready, user, router]);
  if (!ready || !user) return <PageLoader />;
  return (
    <div className="shell">
      <aside className="side">
        <div className="brand"><div className="brand-mark"><Flame size={20} /></div><div><b>Ember &amp; Oak</b><small>Point of Sale</small></div></div>
        <nav className="nav">
          {links.filter((l) => !l.admin || isAdmin).map(({ href, label, icon: I }) => (
            <Link key={href} href={href} className={path.startsWith(href) ? 'on' : ''}><I size={19} />{label}</Link>
          ))}
        </nav>
        <div className="me">
          <div className="avatar">{user.name[0]}</div>
          <div><b>{user.name}</b><small>{user.role}</small></div>
          <button onClick={() => { logout(); router.replace('/login'); }} aria-label="Sign out"><LogOut size={18} /></button>
        </div>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
