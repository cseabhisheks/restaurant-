'use client';
import { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';

const Ctx = createContext(() => {});
export const useToast = () => useContext(Ctx);

export function ToastProvider({ children }) {
  const [list, setList] = useState([]);
  const push = useCallback((message, type = 'success') => {
    const id = Math.random();
    setList((l) => [...l, { id, message, type }]);
    setTimeout(() => setList((l) => l.filter((t) => t.id !== id)), 3800);
  }, []);
  return (
    <Ctx.Provider value={push}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {list.map((t) => (
          <div key={t.id} className={`toast ${t.type}`}>
            {t.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}<span>{t.message}</span>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
