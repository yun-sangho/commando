"use client";
import { useState, useEffect, useMemo } from 'react';
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
  const [view, setView] = useState<'list'|'map'>('list');
  const [userPos, setUserPos] = useState<{lat:number; lng:number}|null>(null);
  const merchants = useMemo(()=> [
    { id: 'm1', name: '편의점', category: '편의점', lat: 37.5005, lng: 127.0002 },
    { id: 'm2', name: '장병 카페', category: '카페', lat: 37.5009, lng: 127.0008 },
    { id: 'm3', name: '불끈 헬스장', category: '스포츠', lat: 37.4997, lng: 126.9999 },
    { id: 'm4', name: '충성밥집', category: '식당', lat: 37.5011, lng: 127.0012 },
    { id: 'm5', name: '코인 세탁소', category: '서비스', lat: 37.5001, lng: 127.0015 }
  ],[]);
  // 요청 위치 (브라우저) / fallback
  useEffect(()=> {
    if (typeof window === 'undefined') return;
    if (!navigator.geolocation) { setUserPos({ lat: 37.5003, lng: 127.0005 }); return; }
    navigator.geolocation.getCurrentPosition(
      p => setUserPos({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => setUserPos({ lat: 37.5003, lng: 127.0005 }),
      { enableHighAccuracy: true, timeout: 4000 }
    );
  },[]);
  function distance(a:{lat:number;lng:number}, b:{lat:number;lng:number}){
    const R = 6371000; // m
    const dLat = (b.lat - a.lat) * Math.PI/180;
    const dLng = (b.lng - a.lng) * Math.PI/180;
    const la1 = a.lat * Math.PI/180;
    const la2 = b.lat * Math.PI/180;
    const h = Math.sin(dLat/2)**2 + Math.cos(la1)*Math.cos(la2)*Math.sin(dLng/2)**2;
    return 2*R*Math.asin(Math.sqrt(h));
  }
  const enriched = useMemo(()=> {
    if(!userPos) return merchants.map(m => ({ ...m, dist: null as number|null }));
    return merchants.map(m => ({ ...m, dist: distance(userPos, m) }));
  }, [merchants, userPos]);
  const sortedMerchants = useMemo(()=> enriched.slice().sort((a,b)=> (a.dist||0)-(b.dist||0)), [enriched]);
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
  <h1 className="text-xl font-semibold">결제</h1>
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
      <div className="space-y-3 pt-4 border-t">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium">근처 사용처</h2>
          <button onClick={()=> setView(v=> v==='list'?'map':'list')} className="text-xs h-8 px-3 rounded-md border bg-card">
            {view==='list' ? '지도 보기' : '목록 보기'}
          </button>
        </div>
        <NearbySection view={view} merchants={sortedMerchants} userPos={userPos} />
      </div>
    </div>
  );
}

interface NearbyProps {
  view: 'list'|'map';
  merchants: Array<{ id:string; name:string; category:string; lat:number; lng:number; dist: number|null }>;
  userPos: {lat:number; lng:number} | null;
}

function NearbySection({ view, merchants, userPos }: NearbyProps){
  return (
    <div className="space-y-3">
      {view==='list' && (
        <ul className="space-y-2 text-xs max-h-48 overflow-auto pr-1">
          {merchants.map(m => (
            <li key={m.id} className="p-3 rounded-md border bg-card flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{m.name}</p>
                <p className="text-[10px] text-muted-foreground">{m.category}</p>
              </div>
              <span className="text-[10px] text-muted-foreground whitespace-nowrap">{m.dist!=null? `${Math.round(m.dist)}m` : '...'}</span>
            </li>
          ))}
        </ul>
      )}
      {view==='map' && (
        <MiniMap merchants={merchants} userPos={userPos} />
      )}
    </div>
  );
}

function MiniMap({ merchants, userPos }: { merchants: NearbyProps['merchants']; userPos: NearbyProps['userPos'] }) {
  const box = { width: 320, height: 220 };
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const activeId = selectedId || hoverId;
  // Determine bounds
  const lats = merchants.map(m=>m.lat).concat(userPos? [userPos.lat]:[]);
  const lngs = merchants.map(m=>m.lng).concat(userPos? [userPos.lng]:[]);
  const minLat = Math.min(...lats); const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs); const maxLng = Math.max(...lngs);
  const spanLat = (maxLat-minLat)||0.0001; const spanLng = (maxLng-minLng)||0.0001;
  function proj(lat:number,lng:number){
    const x = (lng - minLng) / (spanLng) * (box.width - 16) + 8;
    const y = (1 - (lat - minLat) / (spanLat)) * (box.height - 16) + 8;
    return { x, y };
  }
  const activeMerchant = merchants.find(m=> m.id === activeId) || null;
  const activePoint = activeMerchant ? proj(activeMerchant.lat, activeMerchant.lng) : null;
  return (
    <div
      className="relative border rounded-md bg-muted/30 overflow-hidden touch-none"
      style={{ width: '100%', height: box.height }}
      onClick={(e)=> { if(e.target === e.currentTarget) { setSelectedId(null); } }}
    >
      {userPos && (()=> { const p = proj(userPos.lat, userPos.lng); return (
        <div key="me" className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center" style={{ left: p.x, top: p.y }}>
          <div className="h-4 w-4 rounded-full bg-blue-500 border-2 border-white shadow" title="현재 위치" />
        </div>
      )})()}
      {merchants.map(m => { const p = proj(m.lat, m.lng); const isActive = activeId === m.id; return (
        <button
          key={m.id}
          className={`absolute -translate-x-1/2 -translate-y-1/2 focus:outline-none ${isActive? 'scale-110': ''}`}
          style={{ left: p.x, top: p.y }}
          title={m.name}
          onMouseEnter={()=> setHoverId(m.id)}
          onMouseLeave={()=> setHoverId(null)}
          onClick={(e)=> { e.stopPropagation(); setSelectedId(prev=> prev===m.id? null : m.id); }}
          aria-label={m.name}
        >
          <div className={`h-3.5 w-3.5 rounded-full border shadow transition-colors ${isActive? 'bg-primary border-white ring-2 ring-primary/40' : 'bg-primary border-white'}`} />
        </button>
      ); })}
      {activeMerchant && activePoint && (
        <div
          className="absolute z-10 -translate-x-1/2 -translate-y-full pointer-events-none"
          style={{ left: activePoint.x, top: activePoint.y - 10 }}
        >
          <div className="rounded-md bg-background/90 backdrop-blur px-2 py-1 shadow border text-[10px] whitespace-nowrap">
            <div className="font-medium leading-tight">{activeMerchant.name}</div>
            <div className="text-muted-foreground leading-tight">{activeMerchant.category}{activeMerchant.dist!=null && ` · ${Math.round(activeMerchant.dist)}m`}</div>
          </div>
        </div>
      )}
      <div className="absolute bottom-1 right-2 text-[9px] text-muted-foreground bg-background/70 px-1 rounded">모킹 지도</div>
    </div>
  );
}
