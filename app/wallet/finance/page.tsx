"use client";
import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import ConvertPage from '@/app/wallet/convert/page';
import QRPage from '@/app/wallet/qr/page';
import TransactionsPage from '@/app/wallet/tx/page';
import WalletDashboard from '@/app/wallet/wallet-dashboard';

const tabs = [
  { key: 'assets', label: '자산' },
  { key: 'convert', label: '환전' },
  { key: 'qr', label: '결제' },
  { key: 'tx', label: '내역' }
];

export default function FinanceHub(){
  const searchParams = useSearchParams();
  const router = useRouter();
  const initial = searchParams.get('tab');
  const [tab, setTab] = useState(tabs.some(t=>t.key===initial) ? initial! : 'assets');

  useEffect(()=> {
    const current = searchParams.get('tab');
    if(current !== tab) {
      const q = new URLSearchParams(Array.from(searchParams.entries()));
      q.set('tab', tab);
      router.replace(`/wallet/finance?${q.toString()}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[tab]);

  return (
    <div className="p-4 space-y-5">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold">금융</h1>
        <p className="text-xs text-muted-foreground">자산 / 환전 / 결제 / 내역</p>
      </header>
      <nav className="flex gap-2 text-xs" aria-label="Finance tabs">
        {tabs.map(t => {
          const active = t.key === tab;
          return (
            <button
              key={t.key}
              onClick={()=> setTab(t.key)}
              className={active ? 'flex-1 h-9 rounded-md bg-primary text-primary-foreground font-medium' : 'flex-1 h-9 rounded-md bg-secondary text-secondary-foreground'}
              aria-current={active ? 'page' : undefined}
            >{t.label}</button>
          );
        })}
      </nav>
      <section className="rounded-lg border bg-card">
        {tab==='assets' && <div className="animate-in fade-in"><WalletDashboard /></div>}
        {tab==='convert' && <div className="animate-in fade-in"><ConvertPage /></div>}
        {tab==='qr' && <div className="animate-in fade-in"><QRPage /></div>}
        {tab==='tx' && <div className="animate-in fade-in"><TransactionsPage /></div>}
      </section>
    </div>
  )
}
