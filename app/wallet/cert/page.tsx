"use client";
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import SoldierIDPage from '@/app/wallet/id/page';
import TrainingPage from '@/app/wallet/training/page';

const tabs = [
  { key: 'id', label: 'ID 카드' },
  { key: 'training', label: '교육 수료' }
];

export default function CertificatesHub(){
  return (
    <Suspense fallback={<CertSkeleton />}> 
      <CertificatesInner />
    </Suspense>
  );
}

function CertificatesInner(){
  const searchParams = useSearchParams();
  const router = useRouter();
  const initial = searchParams.get('tab');
  const [tab, setTab] = useState(initial === 'training' ? 'training' : 'id');

  useEffect(()=> {
    const current = searchParams.get('tab');
    if(current !== tab) {
      const q = new URLSearchParams(Array.from(searchParams.entries()));
      q.set('tab', tab);
      router.replace(`/wallet/cert?${q.toString()}`);
    }
  }, [tab, router, searchParams]);

  return (
    <div className="p-4 space-y-5">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold">증명서</h1>
        <p className="text-xs text-muted-foreground">신분 및 교육 수료 NFT 증명서</p>
      </header>
      <nav className="flex gap-2 text-xs" aria-label="Certificate tabs">
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
        {tab === 'id' && <div className="animate-in fade-in"><SoldierIDPage /></div>}
        {tab === 'training' && <div className="animate-in fade-in"><TrainingPage /></div>}
      </section>
    </div>
  );
}

function CertSkeleton(){
  return (
    <div className="p-4 space-y-4 animate-pulse">
      <div className="h-6 w-32 bg-muted rounded" />
      <div className="h-4 w-48 bg-muted rounded" />
      <div className="flex gap-2">
        <div className="h-9 flex-1 bg-muted rounded" />
        <div className="h-9 flex-1 bg-muted rounded" />
      </div>
      <div className="h-40 rounded bg-muted" />
    </div>
  );
}
