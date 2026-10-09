import React, { useState } from 'react';
import { X, Disc3, FileText, CheckCircle2, Lock } from 'lucide-react';
import { ItemCollectible } from '../game/types';
import { LORE_LOGS } from '../game/mapData';

interface NotesModalProps {
  collectedItems: ItemCollectible[];
  selectedItem?: ItemCollectible | null;
  onClose: () => void;
}

export const NotesModal: React.FC<NotesModalProps> = ({
  collectedItems,
  selectedItem: initialSelectedItem,
  onClose,
}) => {
  const tapes = [
    { id: 'tape_1', title: 'VHS #1: 노클립의 순간' },
    { id: 'tape_2', title: 'VHS #2: 형광등 소음' },
    { id: 'tape_3', title: 'VHS #3: 정체불명의 존재' },
    { id: 'tape_4', title: 'VHS #4: 아몬드 워터의 효과' },
    { id: 'tape_5', title: 'VHS #5: 비상 탈출구의 단서' },
  ];

  const [activeTab, setActiveTab] = useState<'tapes' | 'lore'>('tapes');
  const [selectedId, setSelectedId] = useState<string>(
    initialSelectedItem?.id || 'tape_1'
  );

  const collectedTapesMap = new Map(
    collectedItems.filter((i) => i.type === 'tape').map((t) => [t.id, t])
  );

  const selectedTape = collectedTapesMap.get(selectedId);
  const selectedLore = LORE_LOGS.find((l) => l.id === selectedId) || LORE_LOGS[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in font-sans">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/60">
          <div className="flex items-center gap-2">
            <Disc3 className="w-5 h-5 text-amber-400" />
            <h2 className="text-base sm:text-lg font-bold text-zinc-100 tracking-wide font-mono">
              M.E.G. 아카이브 단말기 // LEVEL 0
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 px-6 pt-3 border-b border-zinc-800/80 bg-zinc-950">
          <button
            onClick={() => {
              setActiveTab('tapes');
              setSelectedId('tape_1');
            }}
            className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'tapes'
                ? 'bg-zinc-900 text-amber-300 border-t border-x border-zinc-700/80'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Disc3 className="w-4 h-4" />
            <span>VHS 음성 기록 ({collectedTapesMap.size}/5)</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('lore');
              setSelectedId('intro_doc');
            }}
            className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'lore'
                ? 'bg-zinc-900 text-amber-300 border-t border-x border-zinc-700/80'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>백룸 가이드 문서</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col md:flex-row gap-6">
          {/* List Sidebar */}
          <div className="w-full md:w-1/3 flex flex-col gap-2">
            {activeTab === 'tapes' ? (
              tapes.map((t) => {
                const isCollected = collectedTapesMap.has(t.id);
                const isSelected = selectedId === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelectedId(t.id)}
                    className={`flex items-center justify-between p-3 rounded-xl text-left text-xs font-mono transition cursor-pointer ${
                      isSelected
                        ? 'bg-amber-950/60 text-amber-200 border border-amber-600/50'
                        : 'bg-zinc-900/60 text-zinc-400 hover:bg-zinc-900 border border-zinc-800/80'
                    }`}
                  >
                    <span className="truncate">{t.title}</span>
                    {isCollected ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <Lock className="w-4 h-4 text-zinc-600 shrink-0" />
                    )}
                  </button>
                );
              })
            ) : (
              <button
                onClick={() => setSelectedId('intro_doc')}
                className={`p-3 rounded-xl text-left text-xs font-mono transition cursor-pointer ${
                  selectedId === 'intro_doc'
                    ? 'bg-amber-950/60 text-amber-200 border border-amber-600/50'
                    : 'bg-zinc-900/60 text-zinc-400 hover:bg-zinc-900 border border-zinc-800/80'
                }`}
              >
                레벨 0: 로비 안내서
              </button>
            )}
          </div>

          {/* Transcript / Reader Panel */}
          <div className="flex-1 bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 flex flex-col">
            {activeTab === 'tapes' ? (
              selectedTape ? (
                <div className="flex flex-col h-full font-mono">
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-4">
                    <span className="text-sm font-bold text-amber-300">
                      {selectedTape.title}
                    </span>
                    <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                      재생 가능 (DECODED)
                    </span>
                  </div>

                  <div className="flex-1 text-sm text-zinc-300 leading-relaxed whitespace-pre-line bg-black/40 p-4 rounded-lg border border-zinc-800/60">
                    "{selectedTape.content || '오디오 데이터 파손됨.'}"
                  </div>

                  <div className="mt-4 text-[11px] text-zinc-500 flex justify-between">
                    <span>주파수: 1998.42 kHz</span>
                    <span>상태: 보관됨</span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center text-zinc-500 py-12">
                  <Lock className="w-10 h-10 text-zinc-600 mb-3" />
                  <p className="text-sm font-mono font-semibold text-zinc-400">
                    테이프가 아직 회수되지 않았습니다
                  </p>
                  <p className="text-xs text-zinc-600 mt-1 max-w-xs">
                    백룸의 미로를 탐색하여 잃어버린 테이프를 찾아 회수하십시오.
                  </p>
                </div>
              )
            ) : (
              <div className="flex flex-col h-full font-mono">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-4">
                  <span className="text-sm font-bold text-amber-300">
                    {selectedLore.title}
                  </span>
                  <span className="text-[11px] text-zinc-400">
                    작성자: {selectedLore.author} ({selectedLore.date})
                  </span>
                </div>

                <div className="flex-1 text-sm text-zinc-300 leading-relaxed whitespace-pre-line bg-black/40 p-4 rounded-lg border border-zinc-800/60">
                  {selectedLore.text}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-zinc-800 bg-zinc-900/60 flex items-center justify-between text-xs text-zinc-400">
          <span>모든 5개의 테이프를 모으면 붉은 비상 탈출구가 열립니다.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg transition font-semibold cursor-pointer"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
