import React, { useState, useEffect } from 'react';
import { Droplets, Plus, Minus, BellRing } from 'lucide-react';

const TIMER_DURATION_SECONDS = 30 * 60; // 30 minutes in seconds

export const WaterTrackerCard: React.FC = () => {
  const [count, setCount] = useState<number>(0);
  const [secondsLeft, setSecondsLeft] = useState<number>(TIMER_DURATION_SECONDS);

  const fetchWaterCount = async () => {
    try {
      if (window.api?.water) {
        const val = await window.api.water.getTodayCount();
        setCount(val);
      }
    } catch (err) {
      console.error('Failed to load water count:', err);
    }
  };

  useEffect(() => {
    fetchWaterCount();

    // 1-second interval for real-time accurate countdown
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 0) return 0;
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const isAlarming = secondsLeft === 0;

  const handleIncrement = async () => {
    const next = count + 1;
    setCount(next);
    // Reset timer and stop alarm
    setSecondsLeft(TIMER_DURATION_SECONDS);

    try {
      if (window.api?.water) {
        await window.api.water.setTodayCount(next);
      }
    } catch (err) {
      console.error('Failed to update water count:', err);
    }
  };

  const handleDecrement = async () => {
    if (count <= 0) return;
    const next = count - 1;
    setCount(next);
    try {
      if (window.api?.water) {
        await window.api.water.setTodayCount(next);
      }
    } catch (err) {
      console.error('Failed to update water count:', err);
    }
  };

  // Format seconds into MM:SS display (e.g., "2:00", "1:59", ..., "0:00")
  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`p-2.5 rounded-xl border transition-all duration-300 ${
      isAlarming 
        ? 'bg-rose-50 border-rose-400 ring-2 ring-rose-300 ring-offset-1 animate-pulse shadow-md' 
        : 'bg-white border-slate-200 shadow-xs'
    }`}>
      {/* Header: Title, Countdown Timer & Alarm */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-sky-800">
          <Droplets className={`w-3.5 h-3.5 ${count > 0 ? 'text-sky-500 fill-sky-200' : 'text-slate-400'}`} />
          <span>Su Takibi</span>
        </div>

        {/* Real-time Countdown badge */}
        <div className="flex items-center gap-1">
          {isAlarming ? (
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-rose-600 text-white animate-bounce">
              <BellRing className="w-2.5 h-2.5" />
              <span>Su Vakti!</span>
            </span>
          ) : (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-sky-50 text-sky-700 border border-sky-100 font-mono">
              ⏱ {formatTime(secondsLeft)}
            </span>
          )}
        </div>
      </div>

      {/* Visual Glass / Water Drop Indicators (Compact) */}
      <div className="flex items-center gap-1 my-1.5 px-1 py-1 bg-sky-50/50 rounded-lg overflow-hidden border border-sky-100/60 min-h-[22px]">
        {count === 0 ? (
          <span className="text-[9px] text-slate-400 italic px-1">Bugün henüz su içilmedi</span>
        ) : count <= 8 ? (
          <div className="flex items-center gap-1 flex-wrap">
            {Array.from({ length: count }).map((_, i) => (
              <span key={i} title={`${i + 1}. bardak`} className="text-sky-500 animate-in fade-in zoom-in-50">
                💧
              </span>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-between w-full px-1">
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 7 }).map((_, i) => (
                <span key={i} className="text-sky-500 text-[11px]">💧</span>
              ))}
            </div>
            <span className="text-[10px] font-extrabold text-sky-800 bg-sky-100 px-1 rounded">
              +{count - 7}
            </span>
          </div>
        )}
      </div>

      {/* Counter Controls */}
      <div className="flex items-center justify-between bg-sky-50/80 border border-sky-100 rounded-lg px-2.5 py-1.5">
        <button
          onClick={handleDecrement}
          disabled={count <= 0}
          title="1 Bardak Azalt"
          className="w-6 h-6 rounded-md bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-xs active:scale-90"
        >
          <Minus className="w-3 h-3" />
        </button>

        <div className="flex items-baseline gap-1">
          <span className="text-base font-extrabold text-sky-950">{count}</span>
          <span className="text-[11px] font-medium text-sky-700">bardak</span>
        </div>

        <button
          onClick={handleIncrement}
          title="1 Bardak Ekle & Sayacı Sıfırla"
          className={`w-6 h-6 rounded-md border flex items-center justify-center text-white transition-all cursor-pointer shadow-xs active:scale-90 ${
            isAlarming 
              ? 'bg-rose-600 border-rose-700 hover:bg-rose-700 animate-pulse' 
              : 'bg-sky-600 border-sky-700 hover:bg-sky-700'
          }`}
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>

      {/* Target status note */}
      <div className="mt-1.5 flex items-center justify-between text-[9px] text-slate-400 font-medium">
        <span>Hedef: 8 bardak</span>
        {count >= 8 ? (
          <span className="text-emerald-600 font-bold">✓ Hedefe Ulaşıldı!</span>
        ) : (
          <span>Kalan: {8 - count}</span>
        )}
      </div>
    </div>
  );
};
