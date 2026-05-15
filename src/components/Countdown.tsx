"use client";

import { useEffect, useState } from "react";

interface CountdownProps {
  targetDate: Date;
  label?: string;
}

export default function Countdown({ targetDate, label }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState<string>("");

  useEffect(() => {
    const calculateTimeLeft = () => {
      const lockTime = new Date(targetDate.getTime() - 60 * 60 * 1000);
      const difference = lockTime.getTime() - new Date().getTime();

      if (difference <= 0) {
        return "LÅST";
      }

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      if (hours > 24) {
        const days = Math.floor(hours / 24);
        return `${days}d ${hours % 24}h kvar`;
      }

      return `${hours}h ${minutes}m ${seconds}s kvar`;
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <span className={`font-mono text-xs font-bold ${timeLeft === "LÅST" ? "text-destructive" : "text-primary"}`}>
      {timeLeft === "LÅST" ? "STÄNGT" : `${label ? label.toUpperCase() : "SPELSTOPP"}: ${timeLeft}`}
    </span>
  );
}
