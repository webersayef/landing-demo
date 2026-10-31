'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/admin', label: '📊 ড্যাশবোর্ড', exact: true },
  { href: '/admin/orders', label: '🧾 অর্ডারসমূহ' },
  { href: '/admin/products', label: '📦 প্রোডাক্ট' },
  { href: '/admin/products/new', label: '➕ Add New Product', sub: true },
  { href: '/admin/pages', label: '📄 ল্যান্ডিং পেজসমূহ' },
  { href: '/admin/settings', label: '⚙️ সেটিংস' },
];

export default function SidebarNav() {
  const pathname = usePathname() || '';
  return (
    <nav className="sidebar-nav">
      {LINKS.map((l) => {
        const active = l.exact
          ? pathname === l.href
          : pathname === l.href || pathname.startsWith(l.href + '/');
        return (
          <Link
            key={l.href}
            href={l.href}
            className={
              'sidebar-link' + (l.sub ? ' sub' : '') + (active ? ' active' : '')
            }
          >
            {l.label}
          </Link>
        );
      })}
      <a href="/" className="sidebar-link">
        🌐 সাইট দেখুন
      </a>
    </nav>
  );
}
