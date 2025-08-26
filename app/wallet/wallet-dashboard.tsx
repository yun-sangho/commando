'use client'
import { useWalletStore } from '@/state/wallet.store'
import { BottomBar } from '@/app/_components/bottom-bar'
import Link from 'next/link'

function format(num: number) { return new Intl.NumberFormat('ko-KR').format(Math.round(num)) }

export default function WalletDashboard() {
  // Use separate selectors to keep snapshots stable and avoid recreating an object each render
  const wallet = useWalletStore(s => s.wallet)
  const txns = useWalletStore(s => s.txns).slice(0,5)
  return (
    <div className="p-4 space-y-6">
      <header className="space-y-2">
        <h1 className="text-xl font-semibold">지갑</h1>
        <p className="text-sm text-muted-foreground">Commando Coin & KRW 요약</p>
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
      <section className="grid grid-cols-4 gap-2 text-xs">
        <Link href="/wallet/convert" className="h-16 rounded-md bg-secondary text-secondary-foreground flex flex-col items-center justify-center gap-1">
          <span>전환</span>
        </Link>
        <Link href="/wallet/qr" className="h-16 rounded-md bg-secondary text-secondary-foreground flex flex-col items-center justify-center gap-1">
          <span>QR</span>
        </Link>
        <Link href="/wallet/tx" className="h-16 rounded-md bg-secondary text-secondary-foreground flex flex-col items-center justify-center gap-1">
          <span>내역</span>
        </Link>
        <Link href="/wallet/voucher" className="h-16 rounded-md bg-secondary text-secondary-foreground flex flex-col items-center justify-center gap-1">
          <span>후급증</span>
        </Link>
      </section>
      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-medium">최근 트랜잭션</h2>
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
