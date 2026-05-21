'use client';

import Link from 'next/link';
import { visibleNavItems } from '@/lib/access';
import { useAccessProfile } from './AuthGate';

export default function SidebarNav({ active }: { active: string }) {
  const profile = useAccessProfile();
  const items = profile ? visibleNavItems(profile.role, profile.allowed_nav) : [];

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
