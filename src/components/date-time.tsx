"use client";

import { useState, useEffect } from 'react';

export function DateTime() {
  const [date, setDate] = useState(new Date());

  useEffect(() => {
    const timerId = setInterval(() => setDate(new Date()), 1000);
    return () => clearInterval(timerId);
  }, []);

  const formatDate = (d: Date) => {
    return d.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (d: Date) => {
    return d.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="text-center">
      <p className="text-5xl md:text-7xl font-bold text-primary">{formatTime(date)}</p>
      <p className="text-lg md:text-2xl text-muted-foreground capitalize">{formatDate(date)}</p>
    </div>
  );
}
