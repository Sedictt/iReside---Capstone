'use client';

import { useState, useEffect } from 'react';
import { useTimeFormat } from '@/hooks/useTimeFormat';

interface ClientOnlyDateProps {
  date: string | Date;
  format?: Intl.DateTimeFormatOptions;
  locale?: string;
  children?: (formatted: string) => React.ReactNode;
}

export function ClientOnlyDate({ date, format, locale = 'en-US', children }: ClientOnlyDateProps) {
  const [formatted, setFormatted] = useState<string>('');

  useEffect(() => {
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      if (!dateObj || Number.isNaN(dateObj.getTime())) {
        setFormatted('');
        return;
      }
      // If time-related options are passed, use toLocaleString to prevent "TypeError: Invalid option : timeStyle"
      if (format && ('timeStyle' in format || 'hour' in format || 'minute' in format || 'second' in format)) {
        setFormatted(dateObj.toLocaleString(locale, format));
      } else {
        setFormatted(dateObj.toLocaleDateString(locale, format));
      }
    } catch {
      try {
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        setFormatted(dateObj.toLocaleString(locale));
      } catch {
        setFormatted('');
      }
    }
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
  const { is24Hour } = useTimeFormat();

  useEffect(() => {
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      if (!dateObj || Number.isNaN(dateObj.getTime())) {
        setFormatted('');
        return;
      }
      const timeOptions: Intl.DateTimeFormatOptions = {
        hour12: !is24Hour,
        ...format,
      };

      // If date-related options are passed, use toLocaleString to prevent "TypeError: Invalid option : dateStyle"
      if (format && ('dateStyle' in format || 'year' in format || 'month' in format || 'day' in format)) {
        setFormatted(dateObj.toLocaleString(locale, timeOptions));
      } else {
        setFormatted(dateObj.toLocaleTimeString(locale, timeOptions));
      }
    } catch {
      try {
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        setFormatted(dateObj.toLocaleTimeString(locale, { hour12: !is24Hour }));
      } catch {
        setFormatted('');
      }
    }
  }, [date, format, locale, is24Hour]);

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
