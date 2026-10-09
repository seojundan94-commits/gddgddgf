import React from 'react';
import {
  Volume2,
  VolumeX,
  FileText,
  Compass,
  Disc3,
  Flame,
  HeartPulse,
} from 'lucide-react';
import { PlayerStats, EntityState } from '../game/types';

interface GameHUDProps {
  stats: PlayerStats;
  entityState: EntityState;
  interactPrompt: string | null;
  onOpenNotes: () => void;
  onToggleMute: () => void;
  isMuted: boolean;
  onPause: () => void;
  isPointerLocked: boolean;
  onRequestPointerLock: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  stats,
  entityState,
  interactPrompt,
  onOpenNotes,
  onToggleMute,
  isMuted,
  onPause,
  isPointerLocked,
  onRequestPointerLock,
}) => {
  const isNearEntity = entityState.distanceToPlayer < 18;

  return (
    <div className="absolute inset-0 z-30 pointer-events-none flex flex-col justify-between p-4 sm:p-6 select-none font-sans">
      {/* Top Bar Controls */}
      <div className="flex items-center justify-between pointer-events-auto">
        {/* Tapes Progress */}
        <div className="flex items-center gap-3 bg-black/70 backdrop-blur-md border border-amber-900/40 rounded-lg px-4 py-2 text-zinc-100 shadow-lg">
          <Disc3 className="w-5 h-5 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
          <div className="flex flex-col">
            <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-mono">탈출 테이프 아카이브</span>
            <div className="flex items-baseline gap-1 font-mono font-bold text-amber-300">
              <span className="text-lg">{stats.tapesCollected}</span>
              <span className="text-zinc-500 text-xs">/ {stats.totalTapes}</span>
              {stats.tapesCollected >= 5 && (
                <span className="ml-2 text-xs font-semibold text-emerald-400 animate-pulse">탈출구 개방됨!</span>
              )}
            </div>
          </div>
        </div>

        {/* Action Controls Top-Right */}
        <div className="flex items-center gap-2">
          {/* Notes Log */}
          <button
            onClick={onOpenNotes}
            title="문서 및 테이프 기록 확인"
            className="flex items-center gap-1.5 bg-black/70 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/60 rounded-lg px-3 py-2 text-xs font-medium transition cursor-pointer shadow-md"
          >
            <FileText className="w-4 h-4 text-amber-300" />
            <span className="hidden sm:inline">기록 보관함</span>
          </button>

          {/* Sound Mute Toggle */}
          <button
            onClick={onToggleMute}
            title={isMuted ? '음소거 해제' : '음소거'}
            className="p-2 bg-black/70 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/60 rounded-lg transition cursor-pointer shadow-md"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-zinc-300" />}
          </button>

          {/* Pause */}
          <button
            onClick={onPause}
            className="px-3 py-2 bg-black/70 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/60 rounded-lg text-xs font-mono transition cursor-pointer shadow-md"
          >
            ESC // 일시정지
          </button>
        </div>
      </div>

      {/* Center Crosshair & Interaction Prompt */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        {/* Reticle */}
        <div
          className={`w-2 h-2 rounded-full transition-all duration-200 ${
            interactPrompt
              ? 'bg-amber-400 ring-4 ring-amber-400/30 scale-150'
              : 'bg-white/50'
          }`}
        />

        {/* Interaction Banner */}
        {interactPrompt && (
          <div className="mt-8 bg-black/85 backdrop-blur-md border border-amber-500/50 text-amber-300 px-5 py-2 rounded-full text-xs sm:text-sm font-medium tracking-wide shadow-2xl animate-fade-in">
            {interactPrompt}
          </div>
        )}

        {/* Pointer Lock hint on desktop if not locked */}
        {!isPointerLocked && (
          <button
            onClick={onRequestPointerLock}
            className="pointer-events-auto mt-20 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-600 text-zinc-200 px-5 py-2.5 rounded-lg text-xs tracking-wider font-mono cursor-pointer shadow-2xl transition"
          >
            화면을 클릭하여 시점 조작 시작 (마우스 고정)
          </button>
        )}
      </div>

      {/* Bottom Status Gauges */}
      <div className="flex flex-col sm:flex-row items-end sm:items-end justify-between gap-4 pointer-events-auto">
        {/* Left: Player Stats (Stamina, Sanity) */}
        <div className="flex flex-col gap-2.5 bg-black/75 backdrop-blur-md border border-zinc-800/80 rounded-xl p-3 sm:p-4 min-w-[240px] sm:min-w-[280px] shadow-2xl">
          {/* Stamina */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-zinc-300 font-mono">
              <Flame className="w-4 h-4 text-orange-400" />
              <span>스태미나 [Shift]</span>
            </div>
            <span className="font-mono text-[11px] text-zinc-400 tabular-nums">
              {Math.round(stats.stamina)}%
            </span>
          </div>
          <div className="w-full bg-zinc-800/80 h-1.5 rounded-full overflow-hidden">
            <div
              className="h-full bg-orange-400 transition-all duration-150"
              style={{ width: `${stats.stamina}%` }}
            />
          </div>

          {/* Sanity */}
          <div className="flex items-center justify-between text-xs pt-1">
            <div className="flex items-center gap-2 text-zinc-300 font-mono">
              <HeartPulse className={`w-4 h-4 ${stats.sanity < 35 ? 'text-red-500 animate-bounce' : 'text-cyan-400'}`} />
              <span>정신력 (Sanity)</span>
            </div>
            <span className="font-mono text-[11px] text-zinc-400 tabular-nums">
              {Math.round(stats.sanity)}%
            </span>
          </div>
          <div className="w-full bg-zinc-800/80 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                stats.sanity > 50
                  ? 'bg-cyan-400'
                  : stats.sanity > 25
                  ? 'bg-amber-500'
                  : 'bg-red-600 animate-pulse'
              }`}
              style={{ width: `${stats.sanity}%` }}
            />
          </div>
        </div>

        {/* Right: Anomaly & Entity Warning */}
        {isNearEntity && (
          <div className="flex items-center gap-3 bg-red-950/80 border border-red-600/70 text-red-200 px-4 py-3 rounded-xl shadow-2xl animate-pulse">
            <Compass className="w-5 h-5 text-red-400 animate-spin" />
            <div className="flex flex-col">
              <span className="text-[11px] font-mono uppercase tracking-widest text-red-400 font-bold">
                생명체 접근 경고
              </span>
              <span className="text-xs text-red-200">
                주변에 미지의 존재가 배회하고 있습니다. 달리지 마십시오!
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
