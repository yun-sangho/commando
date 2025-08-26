"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const items = [
  { href: '/wallet', label: 'Wallet' },
  { href: '/wallet/convert', label: 'Convert' },
  { href: '/wallet/qr', label: 'QR' },
  { href: '/wallet/id', label: 'ID' },
  { href: '/wallet/voucher', label: 'Voucher' }
];

export function BottomBar() {
  const pathname = usePathname();
  return (
    <nav role="navigation" aria-label="Primary" className="h-16 bg-card border-t flex justify-around items-center text-xs z-40">
      {items.map(it => {
        const active = pathname === it.href;
        return (
          <Link key={it.href} href={it.href} className={active ? 'flex flex-col items-center text-primary font-medium' : 'flex flex-col items-center text-muted-foreground'}>
            <span>{it.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
