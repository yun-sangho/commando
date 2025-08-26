'use client'
import { useVoucherStore } from '@/state/voucher.store'

export default function VoucherCenter() {
  const vouchers = useVoucherStore(s => s.vouchers).slice(0,10)
  return (
  <div className="p-4 space-y-4">
      <h1 className="text-xl font-semibold">후급증</h1>
      <button className="w-full h-12 rounded-lg bg-primary text-primary-foreground text-sm font-medium" onClick={() => {
        const today = new Date();
        const depart = new Date(Date.now() + 3*24*60*60*1000).toISOString().slice(0,10)
        useVoucherStore.getState().request({
          transport: 'bus', roundTrip: true, origin: 'BASE', destination: 'HOME', departDate: depart,
          officerName: '담당관', officerContact: '010-0000-0000', hasSeal: true
        } as any)
      }}>샘플 신청</button>
      <ul className="space-y-2">
        {vouchers.map(v => (
          <li key={v.id} className="p-3 rounded-md border bg-card flex justify-between items-center text-sm">
            <span>{v.transport.toUpperCase()} · {v.departDate}</span>
            <span className="text-xs px-2 py-0.5 rounded bg-secondary text-secondary-foreground">{v.status}</span>
          </li>
        ))}
        {vouchers.length === 0 && <li className="text-muted-foreground text-sm">아직 신청 없음</li>}
      </ul>
    </div>
  )
}
