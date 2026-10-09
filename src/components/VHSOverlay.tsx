import React, { useEffect, useState } from 'react';

interface VHSOverlayProps {
  sanity: number;
  entityDistance: number;
  isJumpscare: boolean;
}

export const VHSOverlay: React.FC<VHSOverlayProps> = ({
  sanity,
  entityDistance,
  isJumpscare,
}) => {
  const [timeString, setTimeString] = useState('');
  const [recBlink, setRecBlink] = useState(true);

  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      const hrs = String(d.getHours()).padStart(2, '0');
      const mins = String(d.getMinutes()).padStart(2, '0');
      const secs = String(d.getSeconds()).padStart(2, '0');
      const ampm = d.getHours() >= 12 ? 'PM' : 'AM';
      setTimeString(`OCT 04 1998  ${hrs}:${mins}:${secs} ${ampm}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    const blinkInterval = setInterval(() => setRecBlink((prev) => !prev), 600);
    return () => {
      clearInterval(interval);
      clearInterval(blinkInterval);
    };
  }, []);

  // Intensity of static glitch based on entity distance
  const glitchIntensity = Math.max(0, 1 - entityDistance / 20);
  const lowSanity = sanity < 40;

  return (
    <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden select-none">
      {/* CRT Scanline Filter */}
      <div
        className="absolute inset-0 opacity-40 mix-blend-overlay"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, rgba(0,0,0,0.4) 0px, rgba(0,0,0,0.4) 1px, transparent 1px, transparent 3px)',
        }}
      />

      {/* Screen Vignette */}
      <div
        className="absolute inset-0 transition-opacity duration-300"
        style={{
          boxShadow: lowSanity
            ? 'inset 0 0 160px rgba(180, 0, 0, 0.65), inset 0 0 80px rgba(0,0,0,0.9)'
            : 'inset 0 0 100px rgba(0,0,0,0.75)',
        }}
      />

      {/* Static / Interference Bars when entity is nearby */}
      {glitchIntensity > 0.05 && (
        <div
          className="absolute inset-0 bg-white/10 mix-blend-difference animate-pulse pointer-events-none"
          style={{
            opacity: glitchIntensity * 0.7,
            filter: `contrast(${1 + glitchIntensity * 2})`,
          }}
        />
      )}

      {/* Jumpscare violent flash */}
      {isJumpscare && (
        <div className="absolute inset-0 bg-red-950/80 animate-ping z-50 flex items-center justify-center">
          <div className="text-red-500 font-mono text-4xl tracking-widest font-black animate-bounce">
            NO ESCAPE
          </div>
        </div>
      )}

      {/* Camcorder UI Header */}
      <div className="absolute top-4 left-6 right-6 flex items-center justify-between text-xs sm:text-sm font-mono text-emerald-400 tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
        <div className="flex items-center gap-3">
          <span
            className={`inline-block w-3 h-3 rounded-full bg-red-600 transition-opacity ${
              recBlink ? 'opacity-100' : 'opacity-20'
            }`}
          />
          <span className="font-bold text-white tracking-widest">REC</span>
          <span className="text-zinc-400 ml-2">SP 0:14:28</span>
        </div>

        <div className="flex items-center gap-4 text-zinc-300">
          <span className="hidden sm:inline-block">AUTO FOCUS</span>
          <div className="border border-zinc-400 px-2 py-0.5 rounded text-[11px] text-emerald-400">
            <span>CAM 01</span>
          </div>
        </div>
      </div>

      {/* Camcorder UI Bottom */}
      <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between text-xs sm:text-sm font-mono text-zinc-300 tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
        <div>
          <div className="text-amber-300/90 font-semibold">{timeString}</div>
          <div className="text-zinc-400 text-[11px] mt-0.5">LEVEL 0 // SECTOR 7-B</div>
        </div>

        <div className="text-right">
          <div className="text-[11px] text-zinc-400">TAPE CASSETTE</div>
          <div className="text-emerald-400 font-bold">ANOMALY DETECTOR ACTIVE</div>
        </div>
      </div>
    </div>
  );
};
