"use client";
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';

export type VoucherTransport = 'bus' | 'air' | 'ship' | 'rail';
export type VoucherStatus = 'requested' | 'approved' | 'printed' | 'used' | 'cancelled' | 'expired' | 'destroyed';

export interface Voucher {
  id: string;
  transport: VoucherTransport;
  roundTrip: boolean;
  origin: string;
  destination: string;
  departDate: string; // yyyy-mm-dd
  returnDate?: string;
  status: VoucherStatus;
  createdAt: number;
  updatedAt: number;
  immutablePrintHash?: string;
  officerName?: string;
  officerContact?: string;
  hasSeal?: boolean;
}

interface VoucherState {
  vouchers: Voucher[]; // newest first
  request: (data: Omit<Voucher, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => void;
  approve: (id: string) => void;
  print: (id: string) => void;
  markUsed: (id: string) => void;
  cancel: (id: string) => void;
  expireSweep: () => void;
  destroy: (id: string) => void;
}

const allowedTransition: Record<VoucherStatus, VoucherStatus[]> = {
  requested: ['approved', 'cancelled'],
  approved: ['printed', 'cancelled'],
  printed: ['used', 'expired', 'destroyed'],
  used: [],
  cancelled: [],
  expired: ['destroyed'],
  destroyed: []
};

function can(status: VoucherStatus, next: VoucherStatus) {
  return allowedTransition[status].includes(next);
}

export const useVoucherStore = create<VoucherState>()(persist((set, get) => ({
  vouchers: [],
  request: (data) => {
    const now = Date.now();
    set(s => ({ vouchers: [{ ...data, id: nanoid(), status: 'requested', createdAt: now, updatedAt: now }, ...s.vouchers] }));
  },
  approve: (id) => set(s => ({ vouchers: s.vouchers.map(v => v.id === id && can(v.status, 'approved') ? { ...v, status: 'approved', updatedAt: Date.now() } : v) })),
  print: (id) => set(s => ({ vouchers: s.vouchers.map(v => {
    if (v.id === id && can(v.status, 'printed')) {
      const hash = btoa(`${v.id}|${v.departDate}|${v.origin}|${v.destination}|${v.officerName ?? ''}`);
      return { ...v, status: 'printed', immutablePrintHash: hash, updatedAt: Date.now() };
    }
    return v;
  }) })),
  markUsed: (id) => set(s => ({ vouchers: s.vouchers.map(v => v.id === id && can(v.status, 'used') ? { ...v, status: 'used', updatedAt: Date.now() } : v) })),
  cancel: (id) => set(s => ({ vouchers: s.vouchers.map(v => v.id === id && can(v.status, 'cancelled') ? { ...v, status: 'cancelled', updatedAt: Date.now() } : v) })),
  expireSweep: () => set(s => ({ vouchers: s.vouchers.map(v => {
    if (v.status === 'printed') {
      const dep = new Date(v.departDate).getTime();
      if (Date.now() > dep + 24*60*60*1000 && can(v.status, 'expired')) {
        return { ...v, status: 'expired', updatedAt: Date.now() };
      }
    }
    return v;
  }) })),
  destroy: (id) => set(s => ({ vouchers: s.vouchers.map(v => v.id === id && can(v.status, 'destroyed') ? { ...v, status: 'destroyed', updatedAt: Date.now() } : v) }))
}), { name: 'voucher-store' }));
