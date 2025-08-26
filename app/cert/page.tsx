"use client";
import Link from 'next/link';

export default function CertificatesHub(){
  return (
    <div className="p-4 space-y-6">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold">증명서</h1>
        <p className="text-xs text-muted-foreground">신분 및 교육 수료 관련 NFT 증명서 모음</p>
      </header>
      <section className="grid grid-cols-2 gap-3 text-xs">
        <Link href="/wallet/id" className="h-24 rounded-lg border bg-card flex flex-col items-center justify-center gap-1">
          <span className="font-medium">ID 카드</span>
          <span className="text-[10px] text-muted-foreground">Military ID</span>
        </Link>
        <Link href="/wallet/training" className="h-24 rounded-lg border bg-card flex flex-col items-center justify-center gap-1">
          <span className="font-medium">교육 수료</span>
          <span className="text-[10px] text-muted-foreground">Training</span>
        </Link>
      </section>
    </div>
  )
}
