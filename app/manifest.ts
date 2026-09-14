import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'e-Mumtaz — Sistem Prestasi Murid',
    short_name: 'e-Mumtaz',
    description: 'Sistem pengurusan dan analisis prestasi murid sekolah agama.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#f4faf6',
    theme_color: '#0b6b3a',
    lang: 'ms',
    categories: ['education', 'productivity'],
    icons: [
      { src: '/icon', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
