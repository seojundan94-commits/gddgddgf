import React, { useState } from 'react';
import { Play, Volume2, Shield, Eye, Flame, Compass } from 'lucide-react';
import { Difficulty } from '../game/types';

interface StartScreenProps {
  onStart: (difficulty: Difficulty) => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({ onStart }) => {
  const [difficulty, setDifficulty] = useState<Difficulty>('survivor');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#080705] text-zinc-100 overflow-y-auto font-sans select-none">
      {/* Background Ambience */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at center, #6b5c30 0%, #17150c 70%, #000 100%)',
        }}
      />
      <div
        className="absolute inset-0 opacity-30 pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, rgba(0,0,0,0.5) 0px, rgba(0,0,0,0.5) 1px, transparent 1px, transparent 3px)',
        }}
      />

      <div className="relative z-10 w-full max-w-2xl bg-zinc-950/90 border border-amber-900/40 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-md flex flex-col my-auto">
        {/* Title Lockup */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-950/50 border border-amber-600/30 text-amber-400 text-xs font-mono tracking-widest uppercase mb-3">
            <span>M.E.G. CLASSIFIED ARCHIVE // LEVEL 0</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-amber-100 tracking-tight font-mono drop-shadow-md">
            백룸: 레벨 0 탈출
          </h1>
          <p className="text-xs sm:text-sm text-amber-200/60 mt-1 font-mono tracking-wider">
            THE BACKROOMS : ESCAPE THE LOBBY
          </p>
        </div>

        {/* Premise Box */}
        <div className="bg-black/60 border border-zinc-800/80 rounded-xl p-4 sm:p-5 mb-6 text-xs sm:text-sm text-zinc-300 leading-relaxed font-mono space-y-3">
          <p className="text-amber-200/90 italic">
            "현실의 틈새에서 잘못 노클립(No-clip)되면 당신은 끝없는 노란 벽지와 젖은 카펫,
            형광등의 미친 듯한 웅웅거림이 지배하는 백룸에 갇히게 됩니다."
          </p>
          <div className="border-t border-zinc-850 pt-2 flex flex-col gap-1.5 text-zinc-400 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-amber-400 font-bold">● 탈출 목표:</span>
              <span>미로에 흩어진 5개의 VHS 기록 테이프를 모두 찾아 붉은 비상구(20, 20)로 탈출하십시오.</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-red-400 font-bold">● 생존 경고:</span>
              <span>주변에서 검은 와이어 형체의 괴물(Entity)이 배회합니다. 달리면 소리를 듣고 추격해옵니다.</span>
            </div>
          </div>
        </div>

        {/* Difficulty Selection */}
        <div className="mb-6">
          <label className="block text-xs font-mono font-semibold text-zinc-400 mb-2 uppercase tracking-wider">
            난이도 선택 (DIFFICULTY)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <button
              onClick={() => setDifficulty('explorer')}
              className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                difficulty === 'explorer'
                  ? 'bg-amber-950/40 border-amber-500 text-amber-200'
                  : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:bg-zinc-900'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-sm">탐험가</span>
                <Eye className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-[11px] text-zinc-400 leading-normal">
                괴물의 이동 속도가 느리며 비교적 안전한 탐험이 가능합니다.
              </p>
            </button>

            <button
              onClick={() => setDifficulty('survivor')}
              className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                difficulty === 'survivor'
                  ? 'bg-amber-950/40 border-amber-500 text-amber-200 ring-1 ring-amber-500/50'
                  : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:bg-zinc-900'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-sm">생존자 (권장)</span>
                <Shield className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-[11px] text-zinc-400 leading-normal">
                정통 백룸 공포. 소리에 반응하는 괴물과 긴장감.
              </p>
            </button>

            <button
              onClick={() => setDifficulty('nightmare')}
              className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                difficulty === 'nightmare'
                  ? 'bg-red-950/40 border-red-500 text-red-200 ring-1 ring-red-500/50'
                  : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:bg-zinc-900'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-sm">악몽</span>
                <Flame className="w-4 h-4 text-red-500" />
              </div>
              <p className="text-[11px] text-zinc-400 leading-normal">
                불안정한 형광등 조명, 빠르고 극도로 민감한 괴물.
              </p>
            </button>
          </div>
        </div>

        {/* Controls Cheatsheet */}
        <div className="bg-zinc-900/50 border border-zinc-850 rounded-xl p-3.5 mb-6 text-xs text-zinc-400 font-mono">
          <div className="font-bold text-zinc-300 mb-2 flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-amber-400" />
            <span>조작법 안내</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <div><span className="text-amber-400 font-bold">WASD</span> : 이동</div>
            <div><span className="text-amber-400 font-bold">마우스</span> : 시점 조절</div>
            <div><span className="text-amber-400 font-bold">Shift</span> : 달리기</div>
            <div><span className="text-amber-400 font-bold">C / Ctrl</span> : 웅크리기 (소음 감소)</div>
            <div><span className="text-amber-400 font-bold">E / 클릭</span> : 상호작용</div>
            <div className="text-zinc-500 text-[11px]">
              * 모바일 가상 조이스틱 지원
            </div>
          </div>
        </div>

        {/* Start Button */}
        <button
          onClick={() => onStart(difficulty)}
          className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-black font-mono font-bold text-base rounded-xl transition cursor-pointer flex items-center justify-center gap-3 shadow-xl hover:shadow-amber-500/20 active:scale-[0.99]"
        >
          <Play className="w-5 h-5 fill-black" />
          <span>백룸 진입하기 (오디오 활성화)</span>
        </button>

        <div className="flex items-center justify-center gap-1.5 text-zinc-500 text-xs mt-3">
          <Volume2 className="w-3.5 h-3.5" />
          <span>최상의 공포 경험을 위해 헤드폰이나 이어폰 착용을 강력 권장합니다.</span>
        </div>
      </div>
    </div>
  );
};
