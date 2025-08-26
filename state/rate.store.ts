"use client";
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface RateState {
  base: 'CMD';
  krwPerCMD: number; // 1 CMD => KRW
  lastUpdated: number;
  setRate: (krwPerCMD: number) => void;
}

export const useRateStore = create<RateState>()(persist((set) => ({
  base: 'CMD',
  krwPerCMD: 1000,
  lastUpdated: Date.now(),
  setRate: (krwPerCMD) => set({ krwPerCMD, lastUpdated: Date.now() })
}), { name: 'rate-store' }));
