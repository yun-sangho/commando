'use client'
import { useWalletStore } from '@/state/wallet.store'
import { useLeaveStore } from '@/state/voucher.store'
import { useServiceStore } from '@/state/service.store'
import { useMemo } from 'react'

function format(num: number) { return new Intl.NumberFormat('ko-KR').format(Math.round(num)) }

export default function WalletDashboard() {
  // Use separate selectors to keep snapshots stable and avoid recreating an object each render
  const wallet = useWalletStore(s => s.wallet)
  const allTxns = useWalletStore(s => s.txns)
  const txns = allTxns.slice(0,5)
  const leaves = useLeaveStore(s => s.leaves)
  const dischargeDate = useServiceStore(s => s.dischargeDate)

  const { nextLeave, daysToNextLeave, daysToDischarge, monthlyExpense, todayMenu } = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0,10);
    const upcoming = leaves
      .filter(l => (l.status === 'approved') && l.startDate >= todayStr)
      .sort((a,b) => a.startDate.localeCompare(b.startDate))[0];
    const nextLeaveDate = upcoming ? new Date(upcoming.startDate) : null;
    const msPerDay = 24*60*60*1000;
    const daysToNextLeave = nextLeaveDate ? Math.max(0, Math.ceil((nextLeaveDate.getTime() - now.getTime())/msPerDay)) : null;
    const discharge = dischargeDate ? new Date(dischargeDate) : null;
    const daysToDischarge = discharge ? Math.max(0, Math.ceil((discharge.getTime() - now.getTime())/msPerDay)) : null;
    const monthKey = now.toISOString().slice(0,7); // yyyy-mm
    const monthlyExpense = allTxns
      .filter(t => (t.kind === 'expense' || (t.kind === 'qr' && t.direction === 'send')) && new Date(t.ts).toISOString().slice(0,7) === monthKey)
      .reduce((sum, t:any) => sum + (t.amountCMD||0), 0);
    // Mock mess menu (rotate by weekday)
    const menus = ['닭갈비','비빔밥','돈까스','제육볶음','카레라이스','볶음밥','라면/주먹밥'];
    const todayMenu = menus[now.getDay()];
    return { nextLeave: upcoming || null, daysToNextLeave, daysToDischarge, monthlyExpense, todayMenu };
  }, [leaves, dischargeDate, allTxns])
  return (
    <div className="p-4 space-y-6">
      <header className="space-y-2">
        <h1 className="text-xl font-semibold">지갑</h1>
      </header>
      <section className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-card p-4 shadow-sm border">
          <p className="text-xs text-muted-foreground mb-1">CMD 잔액</p>
          <p className="text-2xl font-bold tracking-tight">{format(wallet.cmd)}</p>
        </div>
        <div className="rounded-xl bg-card p-4 shadow-sm border">
          <p className="text-xs text-muted-foreground mb-1">KRW 잔액</p>
          <p className="text-2xl font-bold tracking-tight">{format(wallet.krw)}</p>
        </div>
      </section>
      <section className="grid grid-cols-2 gap-3 text-xs">
        <StatCard label="다음 휴가" value={nextLeave ? `${nextLeave.startDate} (${nextLeave.purpose||''})` : '예정 없음'} sub={daysToNextLeave!=null? `${daysToNextLeave}일 남음` : undefined} />
        <StatCard label="전역 D-DAY" value={daysToDischarge!=null? `D-${daysToDischarge}` : '미설정'} sub={dischargeDate} />
        <StatCard label="이번달 지출" value={`${monthlyExpense.toLocaleString()} CMD`} sub={monthlyExpense>0? '누적' : undefined} />
        <StatCard label="오늘 급식" value={todayMenu} sub="중식" />
      </section>
  <section className="hidden" />
      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-medium">최근 사용내역</h2>
        </div>
        <ul className="divide-y border rounded-lg bg-card">
          {txns.length === 0 && <li className="p-4 text-sm text-muted-foreground">내역 없음</li>}
          {txns.map(tx => (
            <li key={tx.id} className="p-3 flex items-center justify-between text-sm">
              <span className="truncate max-w-[55%]">
                {tx.kind === 'income' && '입금'}
                {tx.kind === 'expense' && '지출'}
                {tx.kind === 'conversion' && '전환'}
                {tx.kind === 'qr' && (tx.direction === 'send' ? 'QR 결제' : 'QR 수신')}
                {tx.note && <span className="text-muted-foreground ml-1">· {tx.note}</span>}
              </span>
              <span className={tx.kind === 'income' ? 'text-green-600' : tx.kind === 'expense' || tx.kind === 'qr' ? 'text-red-500' : 'text-primary'}>
                {tx.kind === 'income' && '+'}{tx.kind !== 'income' && '-'}{format('amountCMD' in tx ? tx.amountCMD : 0)} CMD
              </span>
            </li>
          ))}
        </ul>
      </section>
  </div>
  )
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl bg-card p-3 border flex flex-col justify-between min-h-[78px]">
      <div className="text-[10px] text-muted-foreground font-medium">{label}</div>
      <div className="text-sm font-semibold leading-tight break-words">{value}</div>
      {sub && <div className="text-[10px] text-muted-foreground mt-1">{sub}</div>}
    </div>
  );
}
