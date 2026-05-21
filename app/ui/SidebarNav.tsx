'use client';

import Link from 'next/link';
import { navItems } from '@/lib/access';
import { useAccessProfile } from './AuthGate';

export default function SidebarNav({ active }: { active: string }) {
  const profile = useAccessProfile();
  const items = profile ? navItems.filter((item) => item.roles.includes(profile.role)) : navItems;

  return (
    <nav className="nav">
      {items.map((item) => (
        <Link className={active === item.key ? 'active' : ''} href={item.href} key={item.key}>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
