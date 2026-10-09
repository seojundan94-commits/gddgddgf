import React from 'react';
import { RotateCcw, Skull, Trophy, Clock, Disc3, ShieldCheck } from 'lucide-react';
import { PlayerStats } from '../game/types';

interface GameOverModalProps {
  isVictory: boolean;
  stats: PlayerStats;
  survivalTimeSec: number;
  onRestart: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isVictory,
  stats,
  survivalTimeSec,
  onRestart,
}) => {
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}분 ${secs}초`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg animate-fade-in font-sans select-none">
      <div
        className={`w-full max-w-lg border rounded-2xl p-6 sm:p-8 flex flex-col shadow-2xl relative overflow-hidden ${
          isVictory
            ? 'bg-zinc-950 border-emerald-500/40 text-zinc-100'
            : 'bg-zinc-950 border-red-900/60 text-zinc-100'
        }`}
      >
        {/* Glow ambient */}
        <div
          className={`absolute -top-24 -left-24 w-64 h-64 rounded-full blur-3xl pointer-events-none opacity-20 ${
            isVictory ? 'bg-emerald-500' : 'bg-red-600'
          }`}
        />

        {/* Header Icon */}
        <div className="flex flex-col items-center text-center mb-6">
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 border ${
              isVictory
                ? 'bg-emerald-950/60 border-emerald-500 text-emerald-400'
                : 'bg-red-950/60 border-red-600 text-red-500 animate-pulse'
            }`}
          >
            {isVictory ? <Trophy className="w-8 h-8" /> : <Skull className="w-8 h-8" />}
          </div>

          <h2
            className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${
              isVictory ? 'text-emerald-400' : 'text-red-500'
            }`}
          >
            {isVictory ? '탈출 성공: 레벨 0 통과' : '사망: 엔티티에게 포획됨'}
          </h2>

          <p className="text-xs sm:text-sm text-zinc-400 mt-2 font-mono">
            {isVictory
              ? '5개의 VHS 테이프를 회수하고 붉은 비상문을 통과하여 레벨 1(거주 구역)으로 이동했습니다!'
              : '어둠 속에서 검은 와이어 형체의 괴물과 마주쳤습니다. 아무도 당신의 비명을 듣지 못했습니다.'}
          </p>
        </div>

        {/* Stats Summary Table */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 mb-6 font-mono text-xs sm:text-sm space-y-3">
          <div className="flex items-center justify-between text-zinc-300">
            <span className="flex items-center gap-2 text-zinc-400">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>생존 시간</span>
            </span>
            <span className="font-bold text-amber-300">{formatTime(survivalTimeSec)}</span>
          </div>

          <div className="flex items-center justify-between text-zinc-300 border-t border-zinc-800/80 pt-2">
            <span className="flex items-center gap-2 text-zinc-400">
              <Disc3 className="w-4 h-4 text-cyan-400" />
              <span>회수한 VHS 테이프</span>
            </span>
            <span className="font-bold text-cyan-300">
              {stats.tapesCollected} / {stats.totalTapes}
            </span>
          </div>

          <div className="flex items-center justify-between text-zinc-300 border-t border-zinc-800/80 pt-2">
            <span className="flex items-center gap-2 text-zinc-400">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <span>최종 잔여 정신력</span>
            </span>
            <span className="font-bold text-indigo-300">
              {Math.max(0, Math.round(stats.sanity))}%
            </span>
          </div>
        </div>

        {/* Restart Action */}
        <button
          onClick={onRestart}
          className={`w-full py-3.5 rounded-xl font-mono font-bold text-sm transition cursor-pointer flex items-center justify-center gap-2 shadow-xl active:scale-[0.99] ${
            isVictory
              ? 'bg-emerald-500 hover:bg-emerald-400 text-black'
              : 'bg-red-600 hover:bg-red-500 text-white'
          }`}
        >
          <RotateCcw className="w-4 h-4" />
          <span>다시 도전하기</span>
        </button>
      </div>
    </div>
  );
};
