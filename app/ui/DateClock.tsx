'use client';

import { useEffect, useMemo, useState } from 'react';

function formatGregorian(date: Date) {
  return new Intl.DateTimeFormat('ms-MY', {
    weekday: 'long',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Kuala_Lumpur',
  }).format(date);
}

function formatHijri(date: Date) {
  const formatter = new Intl.DateTimeFormat('ms-MY-u-ca-islamic-civil', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Kuala_Lumpur',
  });
  const monthNames: Record<string, string> = {
    Muharam: 'Muharam',
    Muharram: 'Muharam',
    Zulhijah: 'Zulhijjah',
    Zulhijjah: 'Zulhijjah',
  };

  return formatter
    .formatToParts(date)
    .map((part) => (part.type === 'month' ? monthNames[part.value] ?? part.value : part.value))
    .join('');
}

function formatTime(date: Date) {
  return new Intl.DateTimeFormat('ms-MY', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Kuala_Lumpur',
  }).format(date);
}

export default function DateClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const display = useMemo(() => {
    if (!now) return null;
    return {
      date: formatGregorian(now),
      hijri: formatHijri(now),
      time: formatTime(now),
    };
  }, [now]);

  if (!display) return null;

  return (
    <div className="date-clock" aria-label="Tarikh dan masa">
      <strong>{display.time}</strong>
      <span>{display.date}</span>
      <small>{display.hijri}</small>
    </div>
  );
}
