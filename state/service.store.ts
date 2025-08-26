"use client";
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ServiceState {
  dischargeDate: string; // yyyy-mm-dd
  setDischargeDate: (date: string) => void;
}

// Seed with a demo 전역일 about 180 days ahead if not set
export const useServiceStore = create<ServiceState>()(persist((set, get) => ({
  dischargeDate: (() => {
    const now = Date.now();
    const target = new Date(now + 180*24*60*60*1000); // ~6 months later
    return target.toISOString().slice(0,10);
  })(),
  setDischargeDate: (date) => set({ dischargeDate: date })
}), { name: 'service-store' }));
