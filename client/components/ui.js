'use client';
import { X, Loader2 } from 'lucide-react';
import { useEffect } from 'react';

export function Modal({ title, onClose, children, footer }) {
  useEffect(() => {
    const h = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);
  return (
    <div className="overlay" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="modal-head"><h3>{title}</h3><button className="icon-btn" onClick={onClose} aria-label="Close"><X size={18} /></button></div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

export const StatusBadge = ({ status }) => <span className={`badge s-${status}`}>{status}</span>;
export const PayBadge = ({ status }) => <span className={`badge p-${status}`}>{status}</span>;
export const Spinner = ({ size = 18 }) => <Loader2 size={size} className="spin" />;
export const PageLoader = () => <div className="page-loader"><Spinner size={28} /></div>;

export function Empty({ icon: Icon, title, text, action }) {
  return (
    <div className="empty">
      {Icon && <div className="empty-icon"><Icon size={26} /></div>}
      <h4>{title}</h4><p>{text}</p>{action}
    </div>
  );
}

export function Btn({ loading, children, variant = 'primary', ...p }) {
  return <button {...p} className={`btn btn-${variant} ${p.className || ''}`} disabled={p.disabled || loading}>{loading && <Spinner size={16} />}{children}</button>;
}
