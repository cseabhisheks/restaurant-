import './globals.css';
import { Plus_Jakarta_Sans, Fraunces } from 'next/font/google';
import { AuthProvider } from '@/lib/auth';
import { ToastProvider } from '@/components/Toast';

const sans = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-sans' });
const serif = Fraunces({ subsets: ['latin'], variable: '--font-serif' });

export const metadata = { title: 'Ember & Oak POS', description: 'Restaurant POS & order management' };
export const viewport = { width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable}`}>
      <body><AuthProvider><ToastProvider>{children}</ToastProvider></AuthProvider></body>
    </html>
  );
}
