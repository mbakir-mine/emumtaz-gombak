'use client';

import { useEffect, useMemo, useState } from 'react';

function formatGregorian(date: Date) {
  return new Intl.DateTimeFormat('ms-MY', {
    weekday: 'long',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function formatHijri(date: Date) {
  return new Intl.DateTimeFormat('ms-MY-u-ca-islamic', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function formatTime(date: Date) {
  return new Intl.DateTimeFormat('ms-MY', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
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
