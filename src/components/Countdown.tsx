'use client';

import { useEffect, useState } from 'react';

interface CountdownProps {
  targetDate: Date;
  label?: string;
  hideLabel?: boolean;
  variant?: 'text' | 'badge';
}

export default function Countdown({
  targetDate,
  label,
  hideLabel = false,
  variant = 'text',
}: CountdownProps) {
  const [difference, setDifference] = useState<number>(0);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const updateTime = () => {
      const lockTime = new Date(targetDate.getTime() - 60 * 60 * 1000);
      const diff = lockTime.getTime() - new Date().getTime();
      setDifference(diff);
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  if (!isClient) {
    return null; // Avoid hydration mismatch on server render
  }

  if (difference <= 0) {
    const closedText = 'STÄNGT';
    if (variant === 'badge') {
      return (
        <span className="inline-flex items-center text-[9px] font-black uppercase bg-red-500/10 text-red-500 border border-red-500/20 px-1.5 py-0.5 rounded tracking-tighter shrink-0">
          {closedText}
        </span>
      );
    }
    return (
      <span className="font-mono text-xs font-bold text-destructive">
        {closedText}
      </span>
    );
  }

  const hours = Math.floor(difference / (1000 * 60 * 60));
  const minutes = Math.floor((difference / 1000 / 60) % 60);

  let timeLeftStr = '';
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    timeLeftStr = `${days}d ${hours % 24}h kvar`;
  } else {
    timeLeftStr = `${hours}h ${minutes}m`;
  }

  const defaultLabel = 'Spelstopp om';
  const displayText = hideLabel
    ? timeLeftStr
    : `${label ? label : defaultLabel}: ${timeLeftStr}`;

  if (variant === 'badge') {
    let badgeClasses = '';
    if (difference <= 3 * 60 * 60 * 1000) {
      // Mindre än 3 timmar kvar (Kritiskt röd med puls)
      badgeClasses =
        'bg-red-500/15 text-red-400 border border-red-500/30 animate-pulse';
    } else if (difference <= 24 * 60 * 60 * 1000) {
      // Mindre än 24 timmar kvar (Varning gul)
      badgeClasses =
        'bg-amber-500/10 text-amber-500 border border-amber-500/20';
    } else {
      // Gott om tid (Info blå)
      badgeClasses = 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
    }

    return (
      <span
        className={`inline-flex items-center text-[9px] font-black px-1.5 py-0.5 rounded tracking-tighter shrink-0 ${badgeClasses}`}
      >
        {displayText}
      </span>
    );
  }

  // Text-variant (default)
  let textClasses = '';
  if (difference <= 3 * 60 * 60 * 1000) {
    textClasses = 'text-red-400 animate-pulse';
  } else if (difference <= 24 * 60 * 60 * 1000) {
    textClasses = 'text-amber-500';
  } else {
    textClasses = 'text-primary';
  }

  return (
    <span className={`font-mono text-xs font-bold ${textClasses}`}>
      {displayText}
    </span>
  );
}
