"use client";
import { useState, useMemo } from 'react';
import { useWalletStore, AnyTxn } from '@/state/wallet.store';

function label(tx: AnyTxn) {
  switch(tx.kind){
    case 'income': return '입금';
    case 'expense': return '지출';
    case 'conversion': return '전환';
    case 'qr': return tx.direction==='send'?'QR 결제':'QR 수신';
  }
}

export default function TransactionsPage() {
  const txns = useWalletStore(s => s.txns);
  const [filter, setFilter] = useState('all');
  const filtered = useMemo(()=> txns.filter(t => filter==='all'|| t.kind===filter), [txns, filter]);
  return (
  <div className="p-4 space-y-4">
      <h1 className="text-xl font-semibold">전체 내역</h1>
      <select value={filter} onChange={e=>setFilter(e.target.value)} className="w-full h-10 rounded-md bg-card border px-2 text-sm">
        <option value="all">전체</option>
        <option value="income">입금</option>
        <option value="expense">지출</option>
        <option value="conversion">환전</option>
        <option value="qr">QR</option>
      </select>
      <ul className="divide-y border rounded-md bg-card text-sm">
        {filtered.length===0 && <li className="p-4 text-muted-foreground">내역 없음</li>}
        {filtered.map(tx => (
          <li key={tx.id} className="p-3 flex justify-between items-center">
            <span className="truncate max-w-[55%]">
              {label(tx)} {tx.note && <span className="text-muted-foreground ml-1">· {tx.note}</span>}
            </span>
            <span className={tx.kind==='income' ? 'text-green-600' : (tx.kind==='expense'|| (tx.kind==='qr' && tx.direction==='send')) ? 'text-red-500' : 'text-primary'}>
              {tx.kind==='income' ? '+' : '-'}{'amountCMD' in tx ? tx.amountCMD.toLocaleString() : 0} CMD
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
