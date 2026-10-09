import React from 'react';
import { Play, RotateCcw, Volume2, Sliders, Home } from 'lucide-react';
import { soundManager } from '../audio/soundManager';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onQuitToMenu: () => void;
  mouseSensitivity: number;
  onSensitivityChange: (val: number) => void;
  isVHSEnabled: boolean;
  onToggleVHS: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onQuitToMenu,
  mouseSensitivity,
  onSensitivityChange,
  isVHSEnabled,
  onToggleVHS,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in font-sans select-none">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-2xl flex flex-col font-mono text-zinc-200">
        <h2 className="text-xl font-black text-amber-300 tracking-wider text-center mb-6 pb-3 border-b border-zinc-800">
          일시정지 (PAUSED)
        </h2>

        {/* Settings */}
        <div className="space-y-4 mb-6 text-xs text-zinc-300">
          {/* Sensitivity Slider */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="flex items-center gap-1.5 text-zinc-400">
                <Sliders className="w-3.5 h-3.5 text-amber-400" />
                <span>마우스 감도</span>
              </span>
              <span className="font-bold text-amber-300">{mouseSensitivity.toFixed(3)}</span>
            </div>
            <input
              type="range"
              min="0.001"
              max="0.005"
              step="0.0005"
              value={mouseSensitivity}
              onChange={(e) => onSensitivityChange(parseFloat(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          {/* Master Volume */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="flex items-center gap-1.5 text-zinc-400">
                <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                <span>마스터 볼륨</span>
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              defaultValue="0.8"
              onChange={(e) => soundManager.setVolume(parseFloat(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          {/* VHS Filter Toggle */}
          <div className="flex items-center justify-between pt-2 border-t border-zinc-850">
            <span className="text-zinc-400">캠코더 VHS 레트로 효과</span>
            <button
              onClick={onToggleVHS}
              className={`px-3 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer ${
                isVHSEnabled
                  ? 'bg-emerald-950 border border-emerald-500 text-emerald-300'
                  : 'bg-zinc-900 border border-zinc-700 text-zinc-500'
              }`}
            >
              {isVHSEnabled ? '활성화 (ON)' : '비활성화 (OFF)'}
            </button>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-2.5">
          <button
            onClick={onResume}
            className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-lg"
          >
            <Play className="w-4 h-4 fill-black" />
            <span>게임 재개</span>
          </button>

          <button
            onClick={onRestart}
            className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4 text-zinc-400" />
            <span>현재 레벨 재시작</span>
          </button>

          <button
            onClick={onQuitToMenu}
            className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            <span>메인 메뉴로 돌아가기</span>
          </button>
        </div>
      </div>
    </div>
  );
};
