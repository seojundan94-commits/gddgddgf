import React, { useRef, useState, useEffect } from 'react';
import { Footprints, ShieldAlert, Hand } from 'lucide-react';

interface MobileControlsProps {
  onMoveChange: (move: { forward: boolean; backward: boolean; left: boolean; right: boolean }) => void;
  onLookDelta: (yaw: number, pitch: number) => void;
  onToggleSprint: (sprint: boolean) => void;
  onToggleCrouch: (crouch: boolean) => void;
  onInteract: () => void;
  isSprinting: boolean;
  isCrouching: boolean;
}

export const MobileControls: React.FC<MobileControlsProps> = ({
  onMoveChange,
  onLookDelta,
  onToggleSprint,
  onToggleCrouch,
  onInteract,
  isSprinting,
  isCrouching,
}) => {
  const joystickRef = useRef<HTMLDivElement>(null);
  const lookAreaRef = useRef<HTMLDivElement>(null);

  const [joystickActive, setJoystickActive] = useState(false);
  const [joystickOffset, setJoystickOffset] = useState({ x: 0, y: 0 });

  // Touch tracking for look area
  const lastTouchRef = useRef<{ id: number; x: number; y: number } | null>(null);

  // Joystick touch handlers
  const handleJoystickStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    const touch = e.targetTouches[0];
    if (!joystickRef.current) return;
    setJoystickActive(true);
    updateJoystick(touch.clientX, touch.clientY);
  };

  const handleJoystickMove = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (!joystickActive) return;
    const touch = e.targetTouches[0];
    updateJoystick(touch.clientX, touch.clientY);
  };

  const handleJoystickEnd = () => {
    setJoystickActive(false);
    setJoystickOffset({ x: 0, y: 0 });
    onMoveChange({ forward: false, backward: false, left: false, right: false });
  };

  const updateJoystick = (clientX: number, clientY: number) => {
    if (!joystickRef.current) return;
    const rect = joystickRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const maxRadius = rect.width / 2;
    const dist = Math.sqrt(dx * dx + dy * dy);

    const clampedDist = Math.min(dist, maxRadius);
    const angle = Math.atan2(dy, dx);
    const offsetX = Math.cos(angle) * clampedDist;
    const offsetY = Math.sin(angle) * clampedDist;

    setJoystickOffset({ x: offsetX, y: offsetY });

    // Direction mapping
    const threshold = 18;
    onMoveChange({
      forward: dy < -threshold,
      backward: dy > threshold,
      left: dx < -threshold,
      right: dx > threshold,
    });
  };

  // Look area touch handlers
  const handleLookStart = (e: React.TouchEvent) => {
    const touch = e.changedTouches[0];
    lastTouchRef.current = { id: touch.identifier, x: touch.clientX, y: touch.clientY };
  };

  const handleLookMove = (e: React.TouchEvent) => {
    if (!lastTouchRef.current) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === lastTouchRef.current.id) {
        const dx = touch.clientX - lastTouchRef.current.x;
        const dy = touch.clientY - lastTouchRef.current.y;
        lastTouchRef.current.x = touch.clientX;
        lastTouchRef.current.y = touch.clientY;

        const sensitivity = 0.005;
        onLookDelta(dx * sensitivity, dy * sensitivity);
        break;
      }
    }
  };

  const handleLookEnd = (e: React.TouchEvent) => {
    if (!lastTouchRef.current) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === lastTouchRef.current.id) {
        lastTouchRef.current = null;
        break;
      }
    }
  };

  return (
    <div className="absolute inset-0 z-20 pointer-events-none select-none touch-none">
      {/* Right Side: Free Look Touch Area */}
      <div
        ref={lookAreaRef}
        onTouchStart={handleLookStart}
        onTouchMove={handleLookMove}
        onTouchEnd={handleLookEnd}
        onTouchCancel={handleLookEnd}
        className="absolute top-0 right-0 w-1/2 h-full pointer-events-auto"
      />

      {/* Left Bottom: Virtual Joystick */}
      <div className="absolute bottom-6 left-6 pointer-events-auto">
        <div
          ref={joystickRef}
          onTouchStart={handleJoystickStart}
          onTouchMove={handleJoystickMove}
          onTouchEnd={handleJoystickEnd}
          onTouchCancel={handleJoystickEnd}
          className="w-28 h-28 rounded-full bg-black/40 border border-white/20 backdrop-blur-sm relative flex items-center justify-center shadow-lg"
        >
          <div
            className="w-12 h-12 rounded-full bg-amber-400/80 shadow-md transition-transform"
            style={{
              transform: `translate(${joystickOffset.x}px, ${joystickOffset.y}px)`,
            }}
          />
          <span className="absolute -top-6 text-[10px] font-mono text-zinc-400 tracking-wider">이동 (이동 패드)</span>
        </div>
      </div>

      {/* Right Bottom: Quick Action Buttons */}
      <div className="absolute bottom-6 right-6 flex flex-col items-end gap-3 pointer-events-auto">
        {/* Interact Button (Large) */}
        <button
          onClick={onInteract}
          className="w-16 h-16 rounded-full bg-amber-500/90 text-black flex flex-col items-center justify-center font-bold text-xs shadow-xl active:scale-95 transition"
        >
          <Hand className="w-5 h-5 mb-0.5" />
          <span>상호작용</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Sprint Button */}
          <button
            onClick={() => onToggleSprint(!isSprinting)}
            className={`w-12 h-12 rounded-full border flex items-center justify-center shadow-lg transition active:scale-95 ${
              isSprinting
                ? 'bg-orange-500/90 border-orange-400 text-white'
                : 'bg-black/60 border-zinc-600 text-zinc-300'
            }`}
          >
            <Footprints className="w-5 h-5" />
          </button>

          {/* Crouch Button */}
          <button
            onClick={() => onToggleCrouch(!isCrouching)}
            className={`w-12 h-12 rounded-full border flex items-center justify-center shadow-lg transition active:scale-95 ${
              isCrouching
                ? 'bg-indigo-600/90 border-indigo-400 text-white'
                : 'bg-black/60 border-zinc-600 text-zinc-300'
            }`}
          >
            <ShieldAlert className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
