"use client";
import { useState } from 'react';
import { useWalletStore } from '@/state/wallet.store';
import { useRateStore } from '@/state/rate.store';

export default function ConvertPage() {
  const wallet = useWalletStore(s => s.wallet);
  const convertToKRW = useWalletStore(s => s.convertToKRW);
  const rate = useRateStore(s => s.krwPerCMD);
  const [amount, setAmount] = useState('');
  const parsed = Number(amount);
  const fee = parsed > 0 ? Math.max(parsed * 0.01, 1) : 0;
  const net = parsed - fee;
  const krw = net * rate;
  return (
  <div className="p-4 space-y-6">
  <h1 className="text-xl font-semibold">전환 (CMD → KRW)</h1>
      <form onSubmit={e => { e.preventDefault(); if (parsed > 0) { convertToKRW(parsed); setAmount(''); } }} className="space-y-4">
        <div className="space-y-1">
          <label className="text-xs font-medium">금액 (CMD)</label>
          <input value={amount} onChange={e => setAmount(e.target.value.replace(/[^0-9.]/g,''))} inputMode="decimal" placeholder="0" className="w-full h-12 px-3 rounded-md bg-card border" />
        </div>
        <div className="text-xs space-y-1 bg-card border p-3 rounded-md">
          <p>보유: {wallet.cmd.toLocaleString()} CMD</p>
          <p>수수료: {fee.toLocaleString(undefined,{maximumFractionDigits:2})} CMD</p>
          <p>실수령 (KRW): {krw>0? krw.toLocaleString(undefined,{maximumFractionDigits:0}) : 0} ₩ (rate {rate})</p>
        </div>
  <button disabled={!(parsed>0) || parsed> wallet.cmd} className="w-full h-12 rounded-lg bg-primary text-primary-foreground disabled:opacity-40 text-sm font-medium">전환</button>
      </form>
    </div>
  );
}
