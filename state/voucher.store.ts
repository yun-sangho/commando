"use client";
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';

// Leave Management (휴가 + 교통 후급증 연동)
export type TransportMode = 'bus' | 'air' | 'ship' | 'rail';
export type LeaveStatus = 'requested' | 'approved' | 'rejected' | 'cancelled' | 'completed';

export interface TransportVoucher {
  id: string;
  mode: TransportMode;
  ticketHash?: string; // printed hash (mock)
  printedAt?: number;
}

export interface LeaveRequest {
  id: string;
  purpose?: string;
  origin: string;
  destination: string;
  startDate: string; // yyyy-mm-dd
  endDate: string;   // yyyy-mm-dd
  status: LeaveStatus;
  createdAt: number;
  updatedAt: number;
  transport?: TransportVoucher; // optional until chosen
  officerName?: string;
  officerContact?: string;
}

interface LeaveState {
  leaves: LeaveRequest[]; // newest first
  requestLeave: (data: Omit<LeaveRequest, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'transport'> & { transportMode?: TransportMode }) => void;
  approveLeave: (id: string, officer?: { name?: string; contact?: string }) => void;
  rejectLeave: (id: string) => void;
  cancelLeave: (id: string) => void;
  completeLeave: (id: string) => void;
  attachTransport: (id: string, mode: TransportMode) => void;
  printTransport: (id: string) => void; // generates ticket hash
}

function base64Utf8(str: string){
  if (typeof window === 'undefined') return Buffer.from(str,'utf-8').toString('base64');
  return btoa(unescape(encodeURIComponent(str)));
}

export const useLeaveStore = create<LeaveState>()(persist((set, get) => ({
  leaves: (() => {
    const now = Date.now();
    const day = 24*60*60*1000;
    // Pre-approved demo leaves
    return [
      {
        id: nanoid(),
        purpose: '정기휴가',
        origin: 'BASE',
        destination: 'HOME',
        startDate: new Date(now + 3*day).toISOString().slice(0,10),
        endDate: new Date(now + 7*day).toISOString().slice(0,10),
        status: 'approved' as LeaveStatus,
        createdAt: now - 2*day,
        updatedAt: now - 2*day,
        officerName: '중대장',
        officerContact: '010-1111-2222',
        transport: { id: nanoid(), mode: 'bus' }
      },
      {
        id: nanoid(),
        purpose: '특별위로휴가',
        origin: 'BASE',
        destination: 'JEJU',
        startDate: new Date(now + 10*day).toISOString().slice(0,10),
        endDate: new Date(now + 14*day).toISOString().slice(0,10),
        status: 'approved' as LeaveStatus,
        createdAt: now - 1*day,
        updatedAt: now - 1*day,
        officerName: '중대장',
        officerContact: '010-1111-2222',
        transport: { id: nanoid(), mode: 'air' }
      },
      {
        id: nanoid(),
        purpose: '청원휴가',
        origin: 'BASE',
        destination: 'BUSAN',
        startDate: new Date(now - 8*day).toISOString().slice(0,10),
        endDate: new Date(now - 4*day).toISOString().slice(0,10),
        status: 'completed' as LeaveStatus,
        createdAt: now - 15*day,
        updatedAt: now - 4*day,
        officerName: '중대장',
        officerContact: '010-1111-2222',
        transport: { id: nanoid(), mode: 'rail', ticketHash: 'DEMOHASH123', printedAt: now - 16*day }
      }
    ];
  })(),
  requestLeave: (data) => {
    const now = Date.now();
    const { transportMode, ...rest } = data as any;
    const leave: LeaveRequest = {
      id: nanoid(),
      status: 'requested',
      createdAt: now,
      updatedAt: now,
      ...rest,
    };
    if (transportMode) {
      leave.transport = { id: nanoid(), mode: transportMode };
    }
    set(s => ({ leaves: [leave, ...s.leaves] }));
  },
  approveLeave: (id, officer) => set(s => ({ leaves: s.leaves.map(l => l.id === id && l.status === 'requested' ? { ...l, status: 'approved', officerName: officer?.name ?? l.officerName, officerContact: officer?.contact ?? l.officerContact, updatedAt: Date.now() } : l) })),
  rejectLeave: (id) => set(s => ({ leaves: s.leaves.map(l => l.id === id && l.status === 'requested' ? { ...l, status: 'rejected', updatedAt: Date.now() } : l) })),
  cancelLeave: (id) => set(s => ({ leaves: s.leaves.map(l => ['requested','approved'].includes(l.status) && l.id === id ? { ...l, status: 'cancelled', updatedAt: Date.now() } : l) })),
  completeLeave: (id) => set(s => ({ leaves: s.leaves.map(l => l.id === id && l.status === 'approved' ? { ...l, status: 'completed', updatedAt: Date.now() } : l) })),
  attachTransport: (id, mode) => set(s => ({ leaves: s.leaves.map(l => l.id === id ? { ...l, transport: { id: l.transport?.id ?? nanoid(), mode, ticketHash: l.transport?.ticketHash, printedAt: l.transport?.printedAt }, updatedAt: Date.now() } : l) })),
  printTransport: (id) => set(s => ({ leaves: s.leaves.map(l => {
    if (l.id === id && l.transport) {
      const raw = `${l.id}|${l.startDate}|${l.endDate}|${l.origin}|${l.destination}|${l.transport.mode}`;
      const ticketHash = base64Utf8(raw).replace(/=+$/,'');
      return { ...l, transport: { ...l.transport, ticketHash, printedAt: Date.now() }, updatedAt: Date.now() };
    }
    return l;
  }) }))
}), { name: 'leave-store' }));
