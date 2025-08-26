"use client";
import { useState } from 'react';
import { useWalletStore } from '@/state/wallet.store';
import QRCode from 'qrcode';

export default function QRPage() {
  const wallet = useWalletStore(s => s.wallet);
  const qrSend = useWalletStore(s => s.qrSend);
  const qrReceive = useWalletStore(s => s.qrReceive);
  const [tab, setTab] = useState<'send'|'receive'>('send');
  const [amount, setAmount] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [payload, setPayload] = useState<any>(null);
  const parsed = Number(amount);

  async function generateQR(mode: 'send'|'receive') {
    if (!(parsed>0)) return;
    const basePayload = {
      t: mode === 'send' ? 'qr-payment' : 'qr-request',
      a: parsed,
      ts: Date.now(),
      nonce: Math.random().toString(36).slice(2),
    };
    const fullPayload = mode === 'send'
      ? { ...basePayload, merchantId: 'MCHT' }
      : { ...basePayload, walletId: wallet.id };
    setPayload(fullPayload);
    const text = JSON.stringify(fullPayload);
    const url = await QRCode.toDataURL(text, { margin: 1, scale: 6 });
    setQrDataUrl(url);
  }

  function resetFlow() {
    setQrDataUrl(null);
    setPayload(null);
    setAmount('');
  }

  return (
  <div className="p-4 space-y-6">
      <h1 className="text-xl font-semibold">QR 결제</h1>
      <div className="grid grid-cols-2 text-sm rounded-md overflow-hidden border">
        <button className={tab==='send'? 'h-10 bg-primary text-primary-foreground' : 'h-10 bg-secondary'} onClick={()=>setTab('send')}>결제(송신)</button>
        <button className={tab==='receive'? 'h-10 bg-primary text-primary-foreground' : 'h-10 bg-secondary'} onClick={()=>setTab('receive')}>수신</button>
      </div>
      {tab==='send' && !qrDataUrl && (
        <form onSubmit={e => { e.preventDefault(); generateQR('send'); }} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-medium">금액 (CMD)</label>
            <input value={amount} onChange={e=>{ setAmount(e.target.value.replace(/[^0-9.]/g,'')); setQrDataUrl(null); }} inputMode="decimal" className="w-full h-12 px-3 rounded-md bg-card border" />
          </div>
          <p className="text-xs text-muted-foreground">보유 {wallet.cmd.toLocaleString()} CMD</p>
          <button type="submit" disabled={!(parsed>0) || parsed>wallet.cmd} className="w-full h-12 rounded-lg bg-primary text-primary-foreground disabled:opacity-40 text-sm font-medium">QR 생성</button>
        </form>
      )}
      {tab==='send' && qrDataUrl && (
        <div className="space-y-4">
          <div className="flex flex-col items-center gap-3">
            <img src={qrDataUrl} alt="QR 코드" className="w-56 h-56 bg-white p-2 rounded-md" />
            <p className="text-xs text-muted-foreground">상대방이 스캔하면 결제 확정</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={()=>{ if(payload){ qrSend(payload.a,'MCHT'); resetFlow(); }}} className="h-12 rounded-md bg-primary text-primary-foreground text-sm font-medium">수동 확정</button>
            <button onClick={resetFlow} className="h-12 rounded-md bg-secondary text-secondary-foreground text-sm font-medium">취소</button>
          </div>
        </div>
      )}
      {tab==='receive' && !qrDataUrl && (
        <form onSubmit={e => { e.preventDefault(); generateQR('receive'); }} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-medium">수신 금액 (CMD)</label>
            <input value={amount} onChange={e=>{ setAmount(e.target.value.replace(/[^0-9.]/g,'')); setQrDataUrl(null); }} inputMode="decimal" className="w-full h-12 px-3 rounded-md bg-card border" />
          </div>
          <button type="submit" disabled={!(parsed>0)} className="w-full h-12 rounded-lg bg-primary text-primary-foreground disabled:opacity-40 text-sm font-medium">QR 생성</button>
          <div className="text-xs text-muted-foreground">생성된 QR을 상대가 스캔하면 수신 확정</div>
        </form>
      )}
      {tab==='receive' && qrDataUrl && (
        <div className="space-y-4">
          <div className="flex flex-col items-center gap-3">
            <img src={qrDataUrl} alt="QR 코드" className="w-56 h-56 bg-white p-2 rounded-md" />
            <p className="text-xs text-muted-foreground">상대 스캔 후 수신 완료 버튼</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={()=>{ if(payload){ qrReceive(payload.a,'PEER'); resetFlow(); }}} className="h-12 rounded-md bg-primary text-primary-foreground text-sm font-medium">수신 완료</button>
            <button onClick={resetFlow} className="h-12 rounded-md bg-secondary text-secondary-foreground text-sm font-medium">취소</button>
          </div>
        </div>
      )}
    </div>
  );
}
