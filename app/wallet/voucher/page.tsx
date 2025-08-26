'use client'
import { useLeaveStore } from '@/state/voucher.store'
import { useState, useEffect, useCallback } from 'react'

export default function LeaveCenter() {
  const leaves = useLeaveStore(s => s.leaves);
  const requestLeave = useLeaveStore(s => s.requestLeave);
  const approveLeave = useLeaveStore(s => s.approveLeave);
  const attachTransport = useLeaveStore(s => s.attachTransport);
  const printTransport = useLeaveStore(s => s.printTransport);
  const [form, setForm] = useState({ origin: 'BASE', destination: '', startDate: '', endDate: '', purpose: '', transportMode: 'bus' });
  const [modal, setModal] = useState<{ id: string; kind: 'leave' | 'transport' } | null>(null);

  const openModal = (id: string, kind: 'leave' | 'transport') => setModal({ id, kind });
  const closeModal = () => setModal(null);

  // Close on ESC
  useEffect(() => {
    function onKey(e: KeyboardEvent){ if(e.key==='Escape') closeModal(); }
    window.addEventListener('keydown', onKey);
    return ()=> window.removeEventListener('keydown', onKey);
  },[]);

  const leaveById = useCallback((id: string) => leaves.find(l=>l.id===id), [leaves]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.destination || !form.startDate || !form.endDate) return;
    requestLeave(form as any);
    setForm(f => ({ ...f, destination: '', startDate: '', endDate: '', purpose: '' }));
  }

  const approved = leaves.filter(l => l.status === 'approved' || l.status === 'completed');

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-xl font-semibold">휴가 관리</h1>
      <section className="space-y-3">
        <h2 className="text-sm font-medium">휴가 신청</h2>
        <form onSubmit={submit} className="space-y-3 text-xs bg-card border rounded-lg p-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="font-medium">출발지</label>
              <input value={form.origin} onChange={e=>setForm(f=>({...f, origin: e.target.value}))} className="w-full h-9 rounded-md bg-background border px-2" />
            </div>
            <div className="space-y-1">
              <label className="font-medium">목적지*</label>
              <input value={form.destination} onChange={e=>setForm(f=>({...f, destination: e.target.value}))} className="w-full h-9 rounded-md bg-background border px-2" />
            </div>
            <div className="space-y-1">
              <label className="font-medium">시작일*</label>
              <input type="date" value={form.startDate} onChange={e=>setForm(f=>({...f, startDate: e.target.value}))} className="w-full h-9 rounded-md bg-background border px-2" />
            </div>
            <div className="space-y-1">
              <label className="font-medium">종료일*</label>
              <input type="date" value={form.endDate} onChange={e=>setForm(f=>({...f, endDate: e.target.value}))} className="w-full h-9 rounded-md bg-background border px-2" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="font-medium">사유</label>
            <input value={form.purpose} onChange={e=>setForm(f=>({...f, purpose: e.target.value}))} className="w-full h-9 rounded-md bg-background border px-2" placeholder="예) 정기휴가" />
          </div>
          <div className="space-y-1">
            <label className="font-medium">교통 수단</label>
            <select value={form.transportMode} onChange={e=>setForm(f=>({...f, transportMode: e.target.value}))} className="w-full h-9 rounded-md bg-background border px-2">
              <option value="bus">버스</option>
              <option value="rail">기차</option>
              <option value="air">항공</option>
              <option value="ship">선박</option>
            </select>
          </div>
          <button disabled={!form.destination || !form.startDate || !form.endDate} className="w-full h-10 rounded-md bg-primary text-primary-foreground font-medium disabled:opacity-40">신청</button>
        </form>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium">승인된 / 진행중 휴가</h2>
        <ul className="space-y-2">
          {approved.map(l => (
            <li key={l.id} className="p-3 border rounded-md bg-card text-xs space-y-2 relative">
              <div className="flex items-center justify-between">
                <div className="font-medium">{l.startDate} ~ {l.endDate} · {l.destination}</div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-secondary text-secondary-foreground">{l.status}</span>
              </div>
              <div className="flex gap-2 text-[10px]">
                <button onClick={()=>openModal(l.id,'leave')} className="px-2 h-7 rounded bg-background border cursor-pointer">휴가증</button>
                {l.transport && l.transport.ticketHash && (
                  <button onClick={()=>openModal(l.id,'transport')} className="px-2 h-7 rounded bg-background border cursor-pointer">후급증</button>
                )}
              </div>
              {l.transport && (
                <div className="text-[10px] flex items-center justify-between">
                  <span>교통: {l.transport.mode}{l.transport.ticketHash && ' (발급됨)'}</span>
                  {!l.transport.ticketHash && <button onClick={()=>printTransport(l.id)} className="h-7 px-2 rounded bg-primary text-primary-foreground text-[10px]">후급증 발급</button>}
                </div>
              )}
              {!l.transport && l.status==='approved' && (
                <div className="flex gap-2 text-[10px]">
                  {['bus','rail','air','ship'].map(m => <button key={m} onClick={()=>attachTransport(l.id, m as any)} className="px-2 h-7 rounded bg-background border">{m}</button>)}
                </div>
              )}
            </li>
          ))}
          {approved.length===0 && <li className="text-xs text-muted-foreground">아직 승인된 휴가 없음</li>}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium">전체 신청</h2>
        <ul className="space-y-2 text-xs">
          {leaves.map(l => (
            <li key={l.id} className="p-2 border rounded bg-card flex items-center justify-between">
              <span className="truncate">{l.startDate}~{l.endDate} {l.destination}</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-secondary text-secondary-foreground">{l.status}</span>
            </li>
          ))}
          {leaves.length===0 && <li className="text-xs text-muted-foreground">신청 없음</li>}
        </ul>
      </section>
      {modal && <CertificateModal modal={modal} onClose={closeModal} getLeave={leaveById} />}
    </div>
  );
}

interface CertificateModalProps {
  modal: { id: string; kind: 'leave' | 'transport' };
  onClose: () => void;
  getLeave: (id: string) => ReturnType<typeof useLeaveStore.getState>['leaves'][number] | undefined;
}

function CertificateModal({ modal, onClose, getLeave }: CertificateModalProps) {
  const leave = getLeave(modal.id);
  if (!leave) return null;
  const showTransport = modal.kind === 'transport' && leave.transport && leave.transport.ticketHash;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-[92%] max-w-sm bg-background border shadow-2xl rounded-xl p-5 animate-in fade-in zoom-in text-xs">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-sm font-semibold">{showTransport ? '교통 후급증' : '휴가증명서'}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-[11px]">닫기</button>
        </div>
        <div className="space-y-2">
          {!showTransport && (
            <>
              <Row label="구분" value={leave.purpose || '일반휴가'} />
              <Row label="기간" value={`${leave.startDate} ~ ${leave.endDate}`} />
              <Row label="행선지" value={`${leave.origin} → ${leave.destination}`} />
              <Row label="상태" value={leave.status} />
              {leave.officerName && <Row label="승인관" value={`${leave.officerName} (${leave.officerContact||''})`} />}
            </>
          )}
          {showTransport && leave.transport && (
            <>
              <Row label="교통수단" value={leave.transport.mode} />
              <Row label="여행" value={`${leave.origin} → ${leave.destination}`} />
              <Row label="휴가기간" value={`${leave.startDate} ~ ${leave.endDate}`} />
              <div className="pt-1">
                <div className="text-[10px] font-medium mb-1">HASH</div>
                <div className="font-mono break-all text-[10px] p-2 rounded bg-muted/40 border">{leave.transport.ticketHash}</div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex text-[11px]">
      <div className="w-16 text-muted-foreground shrink-0">{label}</div>
      <div className="flex-1 font-medium break-words">{value}</div>
    </div>
  );
}
