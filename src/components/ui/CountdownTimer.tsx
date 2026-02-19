'use client';

import { useEffect, useState } from 'react';

interface CountdownTimerProps {
  deadline: string; // ISO date string
  className?: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calcTimeLeft(deadline: string): TimeLeft | null {
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff <= 0) return null;
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

export default function CountdownTimer({ deadline, className = '' }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setTimeLeft(calcTimeLeft(deadline));
    const timer = setInterval(() => {
      setTimeLeft(calcTimeLeft(deadline));
    }, 1000);
    return () => clearInterval(timer);
  }, [deadline]);

  if (!mounted) {
    return (
      <div className={`flex items-center justify-center gap-3 sm:gap-5 ${className}`}>
        {['Days', 'Hours', 'Minutes', 'Seconds'].map((label, i) => (
          <div key={label} className="flex items-center gap-3 sm:gap-5">
            <div className="flex flex-col items-center">
              <span className="text-accent font-display text-3xl sm:text-5xl font-bold tabular-nums leading-none">
                --
              </span>
              <span className="text-dim text-xs sm:text-sm uppercase tracking-widest mt-1">
                {label}
              </span>
            </div>
            {i < 3 && (
              <span className="text-accent/40 text-2xl sm:text-4xl font-light -mt-4">:</span>
            )}
          </div>
        ))}
      </div>
    );
  }

  if (!timeLeft) {
    return (
      <div className={`text-center ${className}`}>
        <p className="text-accent font-display text-lg italic">
          Submissions Closed
        </p>
      </div>
    );
  }

  const units: { label: string; value: number }[] = [
    { label: 'Days', value: timeLeft.days },
    { label: 'Hours', value: timeLeft.hours },
    { label: 'Minutes', value: timeLeft.minutes },
    { label: 'Seconds', value: timeLeft.seconds },
  ];

  return (
    <div className={`flex items-center justify-center gap-3 sm:gap-5 ${className}`}>
      {units.map((unit, i) => (
        <div key={unit.label} className="flex items-center gap-3 sm:gap-5">
          <div className="flex flex-col items-center">
            <span className="text-accent font-display text-3xl sm:text-5xl font-bold tabular-nums leading-none">
              {String(unit.value).padStart(2, '0')}
            </span>
            <span className="text-dim text-xs sm:text-sm uppercase tracking-widest mt-1">
              {unit.label}
            </span>
          </div>
          {i < units.length - 1 && (
            <span className="text-accent/40 text-2xl sm:text-4xl font-light -mt-4">:</span>
          )}
        </div>
      ))}
    </div>
  );
}
