"use client";
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import ConvertPage from '@/app/wallet/convert/page';
import QRPage from '@/app/wallet/qr/page';
import TransactionsPage from '@/app/wallet/tx/page';
import WalletDashboard from '@/app/wallet/wallet-dashboard';
import { useInvestStore } from '@/state/invest.store';
import { useWalletStore } from '@/state/wallet.store';

const tabs = [
  { key: 'assets', label: '자산' },
  { key: 'convert', label: '환전' },
  { key: 'tx', label: '내역' }
];

export default function FinanceHub(){
  return (
    <Suspense fallback={<FinanceSkeleton />}> 
      <FinanceInner />
    </Suspense>
  );
}

function FinanceInner(){
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
  },[tab, router, searchParams]);

  return (
    <div className="p-4 space-y-5 w-full">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold">금융</h1>
  <p className="text-xs text-muted-foreground">자산 / 환전 / 내역</p>
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
        {tab==='assets' && <div className="animate-in fade-in"><AssetsTab /></div>}
        {tab==='convert' && <div className="animate-in fade-in"><ConvertPage /></div>}
        {tab==='tx' && <div className="animate-in fade-in"><TransactionsPage /></div>}
      </section>
    </div>
  );
}

function FinanceSkeleton(){
  return (
    <div className="p-4 space-y-4 animate-pulse">
      <div className="h-6 w-32 bg-muted rounded" />
      <div className="h-4 w-48 bg-muted rounded" />
      <div className="flex gap-2">
        <div className="h-9 flex-1 bg-muted rounded" />
        <div className="h-9 flex-1 bg-muted rounded" />
        <div className="h-9 flex-1 bg-muted rounded" />
        <div className="h-9 flex-1 bg-muted rounded" />
      </div>
      <div className="h-40 rounded bg-muted" />
    </div>
  );
}

function AssetsTab(){
  const products = useInvestStore(s => s.products);
  const holdings = useInvestStore(s => s.holdings);
  const invest = useInvestStore(s => s.invest);
  const tick = useInvestStore(s => s.tick);
  const wallet = useWalletStore(s => s.wallet);
  const spend = useWalletStore(s => s.spend);
  const [productId, setProductId] = useState(products[0]?.id || '');
  const [amount, setAmount] = useState('');

  // recompute accrued returns on mount and every 10s (simple mock)
  useEffect(()=> { tick(); const id = setInterval(tick, 10000); return ()=> clearInterval(id); }, [tick]);

  const totalPrincipal = holdings.reduce((s,h)=> s + h.principal, 0);
  const totalReturn = holdings.reduce((s,h)=> s + h.accruedReturnCMD, 0);
  const roi = totalPrincipal > 0 ? (totalReturn / totalPrincipal) * 100 : 0;

  function submit(e: React.FormEvent){
    e.preventDefault();
    const parsed = Number(amount);
    if(!productId || !(parsed>0) || parsed > wallet.cmd) return;
    // Deduct from wallet via spend (category 'other') for simplicity then create holding
    spend('other', parsed, '투자');
    invest(productId, parsed);
    setAmount('');
  }

  return (
    <div className="p-4 space-y-6">
      <header className="space-y-1">
        <h2 className="text-base font-semibold">투자 자산 현황</h2>
      </header>
      <section className="grid grid-cols-3 gap-3 text-xs">
        <Metric label="총 원금" value={`${Math.round(totalPrincipal).toLocaleString()} CMD`} />
        <Metric label="평가 수익" value={`${Math.round(totalReturn).toLocaleString()} CMD`} />
        <Metric label="수익률" value={`${roi.toFixed(2)}%`} />
      </section>
      <section className="space-y-2">
        <h3 className="text-sm font-medium">보유 목록</h3>
        <ul className="space-y-2 text-xs">
          {holdings.map(h => (
            <li key={h.id} className="p-3 rounded-md border bg-background flex flex-col gap-1">
              <div className="flex justify-between">
                <span className="font-medium truncate mr-2">{h.productName}</span>
                <span className="text-[10px] text-muted-foreground">{new Date(h.investedAt).toISOString().slice(0,10)}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span>원금 {h.principal.toLocaleString()} CMD</span>
                <span className={h.accruedReturnCMD>=0? 'text-green-600' : 'text-red-600'}>
                  {h.accruedReturnCMD>=0? '+' : '-'}{Math.abs(h.accruedReturnCMD).toFixed(2)} CMD
                </span>
              </div>
              <div className="text-[10px] text-muted-foreground">누적수익률 {(h.accruedReturnCMD / h.principal * 100).toFixed(2)}%</div>
            </li>
          ))}
          {holdings.length===0 && <li className="text-xs text-muted-foreground">보유 없음</li>}
        </ul>
      </section>
      <section className="space-y-2">
        <h3 className="text-sm font-medium">투자 집행</h3>
        <form onSubmit={submit} className="space-y-3 text-xs p-3 border rounded-md bg-background">
          <div className="space-y-1">
            <label className="font-medium text-[11px]">상품</label>
            <select value={productId} onChange={e=>setProductId(e.target.value)} className="w-full h-9 rounded-md bg-card border px-2">
              {products.map(p => <option key={p.id} value={p.id}>{p.name} · {p.expectedAPR}%</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="font-medium text-[11px]">금액 (CMD)</label>
            <input value={amount} onChange={e=>setAmount(e.target.value.replace(/[^0-9.]/g,''))} inputMode="decimal" className="w-full h-9 rounded-md bg-card border px-2" />
            <div className="text-[10px] text-muted-foreground">보유 {wallet.cmd.toLocaleString()} CMD</div>
          </div>
          <button disabled={!productId || !Number(amount) || Number(amount) > wallet.cmd} className="w-full h-10 rounded-md bg-primary text-primary-foreground text-xs font-medium disabled:opacity-40">투자 실행</button>
        </form>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-3 flex flex-col justify-between min-h-[70px]">
      <span className="text-[10px] text-muted-foreground font-medium">{label}</span>
      <span className="text-sm font-semibold mt-1">{value}</span>
    </div>
  );
}
