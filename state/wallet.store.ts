"use client";
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import { useRateStore } from './rate.store';

export interface WalletSnapshot {
  id: string;
  cmd: number; // stable coin balance (CMD)
  krw: number; // converted holdings
  updatedAt: number;
}

export type IncomeKind = 'salary' | 'leaveAllowance' | 'remoteDuty' | 'islandDuty' | 'bonus' | 'other';
export type ExpenseKind = 'px' | 'transfer' | 'qr' | 'conversion' | 'purchase' | 'other';

interface BaseTxn { id: string; ts: number; note?: string }
export interface IncomeTxn extends BaseTxn { kind: 'income'; category: IncomeKind; amountCMD: number; amountKRW?: number }
export interface ExpenseTxn extends BaseTxn { kind: 'expense'; category: ExpenseKind; amountCMD: number; counterparty?: string }
export interface ConversionTxn extends BaseTxn { kind: 'conversion'; from: 'CMD'; to: 'KRW'; amountCMD: number; rate: number; feeCMD: number; receivedKRW: number }
export interface QRPayTxn extends BaseTxn { kind: 'qr'; direction: 'send' | 'receive'; amountCMD: number; merchantId?: string; peerWalletId?: string }
export type AnyTxn = IncomeTxn | ExpenseTxn | ConversionTxn | QRPayTxn;

interface WalletState {
  wallet: WalletSnapshot;
  txns: AnyTxn[]; // newest first
  seeded: boolean;
  ensureInit: () => void;
  addIncome: (category: IncomeKind, amountCMD: number, note?: string) => void;
  spend: (category: ExpenseKind, amountCMD: number, note?: string, counterparty?: string) => void;
  convertToKRW: (amountCMD: number) => void;
  qrSend: (amountCMD: number, merchantId?: string) => void;
  qrReceive: (amountCMD: number, peerWalletId?: string) => void;
}

// Demo seed incomes (older timestamps so future user actions appear above)
const now = Date.now();
const seedIncomes: IncomeTxn[] = [
  { id: nanoid(), kind: 'income', category: 'salary', amountCMD: 1200, ts: now - 4*24*60*60*1000, note: '기본급' },
  { id: nanoid(), kind: 'income', category: 'leaveAllowance', amountCMD: 150, ts: now - 3*24*60*60*1000, note: '휴가비' },
  { id: nanoid(), kind: 'income', category: 'remoteDuty', amountCMD: 200, ts: now - 2*24*60*60*1000, note: '격오지 근무 수당' },
  { id: nanoid(), kind: 'income', category: 'bonus', amountCMD: 100, ts: now - 1*24*60*60*1000, note: '포상금' }
];
// Sort descending by ts (newest first among seeds, still earlier than new user txns)
seedIncomes.sort((a,b)=> b.ts - a.ts);
const seedTotal = seedIncomes.reduce((sum, t) => sum + t.amountCMD, 0);
const INITIAL_BALANCE = seedTotal; // start CMD balance equals seeded incomes total
const INITIAL_KRW = 50000; // 초기 KRW 보유 (데모용)

export const useWalletStore = create<WalletState>()(persist((set, get) => ({
  wallet: { id: 'primary', cmd: INITIAL_BALANCE, krw: INITIAL_KRW, updatedAt: now },
  txns: seedIncomes, // seeded demo data
  seeded: true,
  ensureInit: () => {
    const s = get();
    if (!s.wallet) {
  set({ wallet: { id: 'primary', cmd: INITIAL_BALANCE, krw: INITIAL_KRW, updatedAt: Date.now() }, txns: seedIncomes, seeded: true });
    }
  },
  addIncome: (category, amountCMD, note) => {
    if (amountCMD <= 0) return;
    set(s => ({
      wallet: { ...s.wallet, cmd: s.wallet.cmd + amountCMD, updatedAt: Date.now() },
      txns: [{ id: nanoid(), ts: Date.now(), kind: 'income', category, amountCMD, note }, ...s.txns]
    }));
  },
  spend: (category, amountCMD, note, counterparty) => {
    if (amountCMD <= 0) return;
    const { wallet } = get();
    if (wallet.cmd < amountCMD) throw new Error('잔액 부족');
    set(s => ({
      wallet: { ...s.wallet, cmd: s.wallet.cmd - amountCMD, updatedAt: Date.now() },
      txns: [{ id: nanoid(), ts: Date.now(), kind: 'expense', category, amountCMD, note, counterparty }, ...s.txns]
    }));
  },
  convertToKRW: (amountCMD) => {
    if (amountCMD <= 0) return;
    const { wallet } = get();
    if (wallet.cmd < amountCMD) throw new Error('잔액 부족');
    const rate = useRateStore.getState().krwPerCMD;
    const feeCMD = Math.max(amountCMD * 0.01, 1);
    const net = amountCMD - feeCMD;
    const receivedKRW = net * rate;
    set(s => ({
      wallet: { ...s.wallet, cmd: s.wallet.cmd - amountCMD, krw: s.wallet.krw + receivedKRW, updatedAt: Date.now() },
      txns: [{ id: nanoid(), ts: Date.now(), kind: 'conversion', from: 'CMD', to: 'KRW', amountCMD, rate, feeCMD, receivedKRW }, ...s.txns]
    }));
  },
  qrSend: (amountCMD, merchantId) => {
    if (amountCMD <= 0) return;
    const { wallet } = get();
    if (wallet.cmd < amountCMD) throw new Error('잔액 부족');
    set(s => ({
      wallet: { ...s.wallet, cmd: s.wallet.cmd - amountCMD, updatedAt: Date.now() },
      txns: [{ id: nanoid(), ts: Date.now(), kind: 'qr', direction: 'send', amountCMD, merchantId }, ...s.txns]
    }));
  },
  qrReceive: (amountCMD, peerWalletId) => {
    if (amountCMD <= 0) return;
    set(s => ({
      wallet: { ...s.wallet, cmd: s.wallet.cmd + amountCMD, updatedAt: Date.now() },
      txns: [{ id: nanoid(), ts: Date.now(), kind: 'qr', direction: 'receive', amountCMD, peerWalletId }, ...s.txns]
    }));
  }
}), { name: 'wallet-store' }));
