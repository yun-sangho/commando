"use client";
import { useIdentityStore } from '@/state/identity.store';
import { useEffect, useState } from 'react';

export default function SoldierIDPage() {
  const identity = useIdentityStore(s => s.identity);
  const signatures = useIdentityStore(s => s.signatures);
  const mint = useIdentityStore(s => s.mint);
  const verify = useIdentityStore(s => s.verify);
  const revoke = useIdentityStore(s => s.revoke);
  const signProof = useIdentityStore(s => s.signProof);
  const verifySignature = useIdentityStore(s => s.verifySignature);
  const deleteSignature = useIdentityStore(s => s.deleteSignature);
  const [form, setForm] = useState({ serviceNumber: '', name: '', rank: '이병' as any, unit: '' });

  useEffect(()=> {
    // Auto create a demo Lieutenant (소위) card if none exists
    if (!identity) {
      mint({ serviceNumber: '25-00000001', name: '홍길동', rank: '소위', unit: '연구중대' } as any);
    }
  },[identity, mint]);

  if (!identity) {
    return (
      <div className="p-4 space-y-6">
        <h1 className="text-xl font-semibold">군인 신분증 (NFT)</h1>
        <p className="text-xs text-muted-foreground leading-relaxed">아직 발행되지 않았습니다. 아래 정보를 입력 후 발행(Mint) 하세요. 발행은 로컬 모킹이며 NFT 메타데이터(토큰ID, 트랜잭션 해시, 계약 주소 등)가 생성됩니다.</p>
        <form onSubmit={e=>{ e.preventDefault(); if(form.serviceNumber && form.name){ mint(form); } }} className="space-y-4 text-sm">
          <div className="space-y-1">
            <label className="text-xs font-medium">군번</label>
            <input value={form.serviceNumber} onChange={e=>setForm(f=>({...f, serviceNumber: e.target.value.toUpperCase()}))} className="w-full h-10 rounded-md bg-card border px-3" placeholder="예) 22-12345678" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">이름</label>
            <input value={form.name} onChange={e=>setForm(f=>({...f, name: e.target.value}))} className="w-full h-10 rounded-md bg-card border px-3" />
          </div>
            <div className="space-y-1">
            <label className="text-xs font-medium">계급</label>
            <select value={form.rank} onChange={e=>setForm(f=>({...f, rank: e.target.value}))} className="w-full h-10 rounded-md bg-card border px-2">
              {['이병','일병','상병','병장','하사','중사','상사','원사','소위','중위','대위','소령','중령','대령'].map(r=> <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">부대(선택)</label>
            <input value={form.unit} onChange={e=>setForm(f=>({...f, unit: e.target.value}))} className="w-full h-10 rounded-md bg-card border px-3" placeholder="00사단" />
          </div>
          <button className="w-full h-12 rounded-lg bg-primary text-primary-foreground font-medium disabled:opacity-40" disabled={!form.serviceNumber || !form.name}>NFT 발행(Mint)</button>
        </form>
      </div>
    );
  }

  const { serviceNumber, name, rank, unit, nft, verified, lastVerifiedAt } = identity;
  return (
    <div className="p-4 space-y-6">
      <h1 className="text-xl font-semibold">군인 신분증</h1>
      <div className="relative mx-auto w-full aspect-[16/10] max-w-sm">
        <div className="absolute inset-0 rounded-xl border bg-gradient-to-br from-primary/15 via-background to-primary/5 p-4 flex flex-col">
          <div className="flex justify-between items-start text-[10px] uppercase tracking-wide font-medium">
            <span>Republic of Korea Armed Forces</span>
            <span className="text-primary">NFT ID</span>
          </div>
          <div className="mt-3 space-y-1 text-sm">
            <div className="font-semibold text-base">{name} <span className="text-xs text-muted-foreground">{rank}</span></div>
            <div className="text-xs">군번: <span className="font-medium">{serviceNumber}</span></div>
            {unit && <div className="text-xs">부대: {unit}</div>}
          </div>
          <div className="mt-auto pt-2 grid grid-cols-2 gap-2 text-[10px] leading-tight">
            <div className="bg-background/60 rounded-md p-2 border">
              <div className="text-[9px] text-muted-foreground">Token ID</div>
              <div className="font-mono truncate text-[11px]">{nft.tokenId}</div>
            </div>
            <div className="bg-background/60 rounded-md p-2 border">
              <div className="text-[9px] text-muted-foreground">Tx Hash</div>
              <div className="font-mono truncate text-[11px]">{nft.txHash.slice(0,18)}…</div>
            </div>
            <div className="bg-background/60 rounded-md p-2 border col-span-2">
              <div className="text-[9px] text-muted-foreground">Fingerprint</div>
              <div className="font-mono text-[10px] break-all">{nft.fingerprint}</div>
            </div>
          </div>
          <div className="absolute -bottom-2 -right-2 h-12 w-12 rounded-full bg-primary/20 backdrop-blur flex items-center justify-center border border-primary/40 text-[10px] font-bold rotate-12">{'VERIFIED' }</div>
        </div>
      </div>
    </div>
  );
}

interface SigProps {
  signatures: ReturnType<typeof useIdentityStore.getState>['signatures'];
  onSign: (msg: string) => void;
  onVerify: (id: string) => void;
  onDelete: (id: string) => void;
}

function SignatureSection({ signatures, onSign, onVerify, onDelete }: SigProps) {
  const [message, setMessage] = useState('출입증 확인');
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-medium">서명 / 검증</h2>
      <form onSubmit={e=>{ e.preventDefault(); if(message.trim()) { onSign(message.trim()); } }} className="space-y-2">
        <div className="flex gap-2">
          <input value={message} onChange={e=>setMessage(e.target.value)} className="flex-1 h-10 rounded-md bg-card border px-3 text-sm" placeholder="메시지" />
          <button className="h-10 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium">서명</button>
        </div>
      </form>
      <ul className="space-y-2">
        {signatures.map(sig => (
          <li key={sig.id} className="p-3 border rounded-md bg-card text-[11px] space-y-1">
            <div className="flex justify-between items-center">
              <span className={sig.valid ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>{sig.valid ? 'VALID' : 'INVALID'}</span>
              <div className="flex gap-2">
                <button onClick={()=>onVerify(sig.id)} className="text-xs px-2 h-7 rounded bg-secondary text-secondary-foreground">검증</button>
                <button onClick={()=>onDelete(sig.id)} className="text-xs px-2 h-7 rounded bg-destructive/90 text-white">삭제</button>
              </div>
            </div>
            <div className="font-mono break-all text-[10px]">{sig.signature.slice(0,80)}{sig.signature.length>80 && '…'}</div>
            <div className="text-[10px] text-muted-foreground">{new Date(sig.createdAt).toLocaleTimeString()} · payload hash: {(() => {
              try {
                return (typeof window === 'undefined'
                  ? Buffer.from(sig.payload,'utf-8').toString('base64')
                  : btoa(unescape(encodeURIComponent(sig.payload)))).slice(0,12);
              } catch { return 'ERR'; }
            })()}…</div>
          </li>
        ))}
        {signatures.length===0 && <li className="text-[11px] text-muted-foreground">아직 서명 없음</li>}
      </ul>
    </div>
  );
}
