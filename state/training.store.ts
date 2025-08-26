"use client";
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';

export type TrainingLevel = '기초' | '심화' | '전문' | '특수';
export type TrainingStatus = 'completed' | 'revoked';

export interface TrainingNFTMeta {
  tokenId: string;
  contract: string;
  chainId: number;
  issuedAt: number;
  txHash: string;
  metadataCid: string;
  fingerprint: string;
}

export interface TrainingRecord {
  id: string;
  title: string;
  level: TrainingLevel;
  hours: number;
  institution?: string;
  instructor?: string;
  completedDate: string; // yyyy-mm-dd
  status: TrainingStatus;
  nft: TrainingNFTMeta;
}

interface TrainingState {
  records: TrainingRecord[];
  mintTraining: (data: Omit<TrainingRecord, 'id' | 'status' | 'nft'>) => void;
  revokeTraining: (id: string) => void;
}

function b64(str: string) {
  if (typeof window === 'undefined') return Buffer.from(str,'utf-8').toString('base64');
  return btoa(unescape(encodeURIComponent(str)));
}

export const useTrainingStore = create<TrainingState>()(persist((set) => ({
  records: [
    (() => {
      const base = { title: '기초 군사훈련', level: '기초' as TrainingLevel, hours: 120, institution: '훈련소', instructor: '교관A', completedDate: new Date(Date.now()-30*24*60*60*1000).toISOString().slice(0,10) };
      const tokenId = Math.floor(Math.random()*1e9).toString(16);
      const fingerprint = b64(`${base.title}|${base.level}|${base.completedDate}`);
      return { id: nanoid(), status: 'completed' as TrainingStatus, nft: { tokenId, contract: '0xTRAINING00000000000000000000000000000001', chainId: 7777, issuedAt: Date.now()-30*24*60*60*1000, txHash: '0x' + nanoid(32), metadataCid: 'bafy-' + nanoid(10), fingerprint }, ...base };
    })(),
    (() => {
      const base = { title: '야간 전술 향상', level: '심화' as TrainingLevel, hours: 40, institution: '교육대', instructor: '교관B', completedDate: new Date(Date.now()-10*24*60*60*1000).toISOString().slice(0,10) };
      const tokenId = Math.floor(Math.random()*1e9).toString(16);
      const fingerprint = b64(`${base.title}|${base.level}|${base.completedDate}`);
      return { id: nanoid(), status: 'completed' as TrainingStatus, nft: { tokenId, contract: '0xTRAINING00000000000000000000000000000001', chainId: 7777, issuedAt: Date.now()-10*24*60*60*1000, txHash: '0x' + nanoid(32), metadataCid: 'bafy-' + nanoid(10), fingerprint }, ...base };
    })(),
  ],
  mintTraining: (data) => {
    const tokenId = Math.floor(Math.random()*1e9).toString(16);
    const fingerprint = b64(`${data.title}|${data.level}|${data.completedDate}`);
    const record: TrainingRecord = {
      id: nanoid(),
      status: 'completed',
      nft: { tokenId, contract: '0xTRAINING00000000000000000000000000000001', chainId: 7777, issuedAt: Date.now(), txHash: '0x' + nanoid(32), metadataCid: 'bafy-' + nanoid(10), fingerprint },
      ...data,
    };
    set(s => ({ records: [record, ...s.records] }));
  },
  revokeTraining: (id) => set(s => ({ records: s.records.map(r => r.id === id ? { ...r, status: 'revoked' } : r) }))
}), { name: 'training-store' }));
