"use client";

import { useState, useEffect } from 'react';

export function DateTime() {
  const [date, setDate] = useState(new Date());

  useEffect(() => {
    const timerId = setInterval(() => setDate(new Date()), 1000);
    return () => clearInterval(timerId);
  }, []);

  const formatDate = (d: Date) => {
    const weekday = d.toLocaleDateString('es-ES', { weekday: 'long' });
    const day = d.getDate();
    const month = d.toLocaleDateString('es-ES', { month: 'long' });
    const year = d.getFullYear();

    const capitalizedWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);
    const capitalizedMonth = month.charAt(0).toUpperCase() + month.slice(1);

    return `${capitalizedWeekday}, ${day} de ${capitalizedMonth} de ${year}`;
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
      <p suppressHydrationWarning className="text-5xl md:text-7xl font-bold text-primary">{formatTime(date)}</p>
      <p suppressHydrationWarning className="text-lg md:text-2xl text-muted-foreground">{formatDate(date)}</p>
    </div>
  );
}
