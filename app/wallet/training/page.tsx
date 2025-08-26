"use client";
import { useTrainingStore } from '@/state/training.store';
import { useState } from 'react';

export default function TrainingPage() {
  const records = useTrainingStore(s => s.records);
  const mintTraining = useTrainingStore(s => s.mintTraining);
  const revokeTraining = useTrainingStore(s => s.revokeTraining);
  const [form, setForm] = useState({ title: '', level: '기초', hours: 0, institution: '', instructor: '', completedDate: '' });
  const [expanded, setExpanded] = useState<string | null>(null);

  function submit(e: React.FormEvent){
    e.preventDefault();
    if(!form.title || !form.completedDate) return;
    mintTraining(form as any);
    setForm({ title: '', level: '기초', hours: 0, institution: '', instructor: '', completedDate: '' });
  }

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-xl font-semibold">교육 수료증 (NFT)</h1>
      <section className="space-y-3">
        <h2 className="text-sm font-medium">수료 목록</h2>
        <ul className="space-y-2 text-xs">
          {records.map(r => (
            <li key={r.id} className="border rounded-md bg-card p-3 space-y-2">
              <div className="flex items-center justify-between">
                <button onClick={()=> setExpanded(e=> e===r.id ? null : r.id)} className="text-left flex-1 font-medium truncate pr-2">{r.title}</button>
                <span className="text-[10px] px-2 py-0.5 rounded bg-secondary text-secondary-foreground">{r.status}</span>
              </div>
              {expanded===r.id && (
                <div className="space-y-2 animate-in fade-in">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    <Field label="레벨" value={r.level} />
                    <Field label="수료일" value={r.completedDate} />
                    <Field label="시간" value={`${r.hours}h`} />
                    {r.institution && <Field label="기관" value={r.institution} />}
                    {r.instructor && <Field label="교관" value={r.instructor} />}
                    <Field label="토큰" value={r.nft.tokenId} />
                  </div>
                  <div className="space-y-1">
                    <div className="text-[10px] font-medium">Fingerprint</div>
                    <div className="font-mono text-[10px] break-all p-2 rounded bg-background border">{r.nft.fingerprint}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-[10px] font-medium">Tx Hash</div>
                    <div className="font-mono text-[10px] break-all p-2 rounded bg-background border">{r.nft.txHash}</div>
                  </div>
                </div>
              )}
            </li>
          ))}
          {records.length===0 && <li className="text-xs text-muted-foreground">수료 데이터 없음</li>}
        </ul>
      </section>
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex text-[11px]">
      <div className="w-14 text-muted-foreground shrink-0">{label}</div>
      <div className="flex-1 break-words font-medium">{value}</div>
    </div>
  );
}
