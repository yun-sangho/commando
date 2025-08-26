"use client";
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';

export interface InvestmentProduct {
  id: string;
  name: string;
  category: string; // e.g., fund, bond, savings
  expectedAPR: number; // %
  risk: 'low'|'mid'|'high';
}

export interface Holding {
  id: string; // holding id
  productId: string;
  productName: string;
  principal: number; // invested principal CMD
  investedAt: number;
  // simple mark to market using expectedAPR pro‑rata by days
  accruedReturnCMD: number;
}

interface InvestState {
  products: InvestmentProduct[];
  holdings: Holding[];
  invest: (productId: string, amountCMD: number) => void;
  redeem: (holdingId: string) => void;
  tick: () => void; // recompute accrued returns
}

const day = 24*60*60*1000;

export const useInvestStore = create<InvestState>()(persist((set, get) => ({
  products: [
    { id: 'prod_savings', name: '단기 적금', category: 'savings', expectedAPR: 4.0, risk: 'low' },
    { id: 'prod_fund1', name: '국방 인프라 펀드', category: 'fund', expectedAPR: 7.5, risk: 'mid' },
    { id: 'prod_green', name: '친환경 에너지 채권', category: 'bond', expectedAPR: 5.2, risk: 'low' },
    { id: 'prod_ai', name: 'AI 전략 펀드', category: 'fund', expectedAPR: 12.0, risk: 'high' }
  ],
  holdings: (() => {
    const now = Date.now();
    // Seed three demo holdings, invested at different past days
    const seeds: Array<{productId: string; principal: number; daysAgo: number}> = [
      { productId: 'prod_savings', principal: 800, daysAgo: 30 },
      { productId: 'prod_fund1', principal: 600, daysAgo: 15 },
      { productId: 'prod_ai', principal: 400, daysAgo: 7 }
    ];
    return seeds.map(s => {
      const p = ['prod_savings','prod_fund1','prod_green','prod_ai'].includes(s.productId) ? s.productId : 'prod_savings';
      const products = [
        { id: 'prod_savings', name: '단기 적금', expectedAPR: 4.0 },
        { id: 'prod_fund1', name: '국방 인프라 펀드', expectedAPR: 7.5 },
        { id: 'prod_green', name: '친환경 에너지 채권', expectedAPR: 5.2 },
        { id: 'prod_ai', name: 'AI 전략 펀드', expectedAPR: 12.0 }
      ];
      const meta = products.find(pr => pr.id === p)!;
      const investedAt = now - s.daysAgo * day;
      const annual = meta.expectedAPR / 100;
      const accrued = s.principal * annual * (s.daysAgo/365);
      return { id: nanoid(), productId: p, productName: meta.name, principal: s.principal, investedAt, accruedReturnCMD: accrued } as Holding;
    });
  })(),
  invest: (productId, amountCMD) => {
    if (amountCMD <= 0) return;
    const { products, holdings } = get();
    const product = products.find(p => p.id === productId);
    if(!product) return;
    const now = Date.now();
    const newHolding: Holding = {
      id: nanoid(),
      productId,
      productName: product.name,
      principal: amountCMD,
      investedAt: now,
      accruedReturnCMD: 0,
    };
    set({ holdings: [newHolding, ...holdings] });
  },
  redeem: (holdingId) => set(s => ({ holdings: s.holdings.filter(h => h.id !== holdingId) })),
  tick: () => {
    const { holdings, products } = get();
    const now = Date.now();
    const updated = holdings.map(h => {
      const p = products.find(p => p.id === h.productId);
      if(!p) return h;
      const days = (now - h.investedAt)/day;
      const annual = p.expectedAPR / 100;
      const accrued = h.principal * annual * (days/365);
      return { ...h, accruedReturnCMD: accrued };
    });
    set({ holdings: updated });
  }
}), { name: 'invest-store' }));
