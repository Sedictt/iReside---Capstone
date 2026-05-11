'use client';

import { useState, useEffect } from 'react';

interface ClientOnlyDateProps {
  date: string | Date;
  format?: Intl.DateTimeFormatOptions;
  locale?: string;
  children?: (formatted: string) => React.ReactNode;
}

export function ClientOnlyDate({ date, format, locale = 'en-US', children }: ClientOnlyDateProps) {
  const [formatted, setFormatted] = useState<string>('');

  useEffect(() => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    setFormatted(dateObj.toLocaleDateString(locale, format));
  }, [date, format, locale]);

  if (!formatted) {
    return null;
  }

  return <>{children ? children(formatted) : formatted}</>;
}

interface ClientOnlyTimeProps {
  date: string | Date;
  format?: Intl.DateTimeFormatOptions;
  locale?: string;
  children?: (formatted: string) => React.ReactNode;
}

export function ClientOnlyTime({ date, format, locale = 'en-US', children }: ClientOnlyTimeProps) {
  const [formatted, setFormatted] = useState<string>('');

  useEffect(() => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    setFormatted(dateObj.toLocaleTimeString(locale, format));
  }, [date, format, locale]);

  if (!formatted) {
    return null;
  }

  return <>{children ? children(formatted) : formatted}</>;
}

interface ClientOnlyYearProps {
  date: string | Date;
}

export function ClientOnlyYear({ date }: ClientOnlyYearProps) {
  const [year, setYear] = useState<string>('');

  useEffect(() => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    setYear(dateObj.getFullYear().toString());
  }, [date]);

  if (!year) {
    return null;
  }

  return <>{year}</>;
}
