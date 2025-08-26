"use client";
import Link from 'next/link';

export default function FinanceHub(){
  return (
    <div className="p-4 space-y-6">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold">금융</h1>
        <p className="text-xs text-muted-foreground">환전 / 결제 / 자산 현황</p>
      </header>
      <section className="grid grid-cols-3 gap-2 text-xs">
        <Link href="/wallet/convert" className="h-20 rounded-md bg-secondary text-secondary-foreground flex flex-col items-center justify-center gap-1">
          <span>환전</span>
        </Link>
        <Link href="/wallet/qr" className="h-20 rounded-md bg-secondary text-secondary-foreground flex flex-col items-center justify-center gap-1">
          <span>결제</span>
        </Link>
        <Link href="/wallet" className="h-20 rounded-md bg-secondary text-secondary-foreground flex flex-col items-center justify-center gap-1">
          <span>자산</span>
        </Link>
      </section>
    </div>
  )
}
