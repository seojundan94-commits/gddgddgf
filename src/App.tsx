/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { soundManager } from './audio/soundManager';
import { BackroomsScene } from './game/BackroomsScene';
import { Difficulty, EntityState, GameState, ItemCollectible, PlayerStats } from './game/types';
import { VHSOverlay } from './components/VHSOverlay';
import { GameHUD } from './components/GameHUD';
import { MobileControls } from './components/MobileControls';
import { NotesModal } from './components/NotesModal';
import { PauseModal } from './components/PauseModal';
import { StartScreen } from './components/StartScreen';
import { GameOverModal } from './components/GameOverModal';

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<BackroomsScene | null>(null);

  const [gameState, setGameState] = useState<GameState>('menu');
  const [difficulty, setDifficulty] = useState<Difficulty>('survivor');
  const [survivalTimeSec, setSurvivalTimeSec] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isPointerLocked, setIsPointerLocked] = useState(false);
  const [mouseSensitivity, setMouseSensitivity] = useState(0.0022);
  const [isVHSEnabled, setIsVHSEnabled] = useState(true);

  // Player & Game State
  const [stats, setStats] = useState<PlayerStats>({
    stamina: 100,
    maxStamina: 100,
    sanity: 100,
    tapesCollected: 0,
    totalTapes: 5,
    notesCollected: 0,
  });

  const [entityState, setEntityState] = useState<EntityState>({
    x: 0,
    z: 0,
    rotationY: 0,
    state: 'patrol',
    speed: 2.2,
    distanceToPlayer: 100,
    hasLineOfSight: false,
    alertLevel: 0,
  });

  const [interactPrompt, setInteractPrompt] = useState<string | null>(null);
  const [collectedItems, setCollectedItems] = useState<ItemCollectible[]>([]);
  const [selectedNoteItem, setSelectedNoteItem] = useState<ItemCollectible | null>(null);

  // Toast banner
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = window.setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  }, []);

  // Controls tracker
  const controlsRef = useRef({
    moveForward: false,
    moveBackward: false,
    moveLeft: false,
    moveRight: false,
    sprint: false,
    crouch: false,
    turnYaw: 0,
    turnPitch: 0,
  });

  const isMobile = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);

  // Game timer
  useEffect(() => {
    let timer: number;
    if (gameState === 'playing') {
      timer = window.setInterval(() => {
        setSurvivalTimeSec((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [gameState]);

  // Start Game handler
  const handleStartGame = useCallback((diff: Difficulty) => {
    soundManager.init();
    soundManager.resume();

    setDifficulty(diff);
    setSurvivalTimeSec(0);
    setCollectedItems([]);
    setGameState('playing');
  }, []);

  // Initialize or Rebuild 3D Scene
  useEffect(() => {
    if (gameState !== 'playing' && gameState !== 'paused' && gameState !== 'reading_note') {
      if (sceneRef.current) {
        sceneRef.current.dispose();
        sceneRef.current = null;
      }
      return;
    }

    if (!containerRef.current || sceneRef.current) return;

    const scene = new BackroomsScene(containerRef.current, difficulty, {
      onStatsUpdate: (s) => setStats(s),
      onEntityUpdate: (e) => setEntityState(e),
      onJumpscare: () => {
        setGameState('jumpscare');
        setTimeout(() => {
          setGameState('game_over');
        }, 1600);
      },
      onVictory: () => {
        setGameState('victory');
      },
      onInteractPrompt: (prompt) => setInteractPrompt(prompt),
    });

    sceneRef.current = scene;

    return () => {
      if (sceneRef.current) {
        sceneRef.current.dispose();
        sceneRef.current = null;
      }
    };
  }, [gameState, difficulty]);

  // Keyboard controls listener
  useEffect(() => {
    if (gameState !== 'playing') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyW' || e.code === 'ArrowUp') controlsRef.current.moveForward = true;
      if (e.code === 'KeyS' || e.code === 'ArrowDown') controlsRef.current.moveBackward = true;
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') controlsRef.current.moveLeft = true;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') controlsRef.current.moveRight = true;
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') controlsRef.current.sprint = true;
      if (e.code === 'KeyC' || e.code === 'ControlLeft') controlsRef.current.crouch = true;

      if (e.code === 'KeyE') {
        handleInteract();
      }

      if (e.code === 'Escape') {
        setGameState('paused');
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'KeyW' || e.code === 'ArrowUp') controlsRef.current.moveForward = false;
      if (e.code === 'KeyS' || e.code === 'ArrowDown') controlsRef.current.moveBackward = false;
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') controlsRef.current.moveLeft = false;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') controlsRef.current.moveRight = false;
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') controlsRef.current.sprint = false;
      if (e.code === 'KeyC' || e.code === 'ControlLeft') controlsRef.current.crouch = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState]);

  // Pointer Lock handling for Desktop
  useEffect(() => {
    const handlePointerLockChange = () => {
      const isLocked = document.pointerLockElement === containerRef.current;
      setIsPointerLocked(isLocked);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement === containerRef.current) {
        controlsRef.current.turnYaw = e.movementX * mouseSensitivity;
        controlsRef.current.turnPitch = e.movementY * mouseSensitivity;
      }
    };

    document.addEventListener('pointerlockchange', handlePointerLockChange);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [mouseSensitivity]);

  // Game loop input dispatch
  useEffect(() => {
    let animId: number;
    const loop = () => {
      if (sceneRef.current && gameState === 'playing') {
        sceneRef.current.updateInput({
          moveForward: controlsRef.current.moveForward,
          moveBackward: controlsRef.current.moveBackward,
          moveLeft: controlsRef.current.moveLeft,
          moveRight: controlsRef.current.moveRight,
          sprint: controlsRef.current.sprint,
          crouch: controlsRef.current.crouch,
          turnYaw: controlsRef.current.turnYaw,
          turnPitch: controlsRef.current.turnPitch,
        });

        // Reset per-frame mouse deltas
        controlsRef.current.turnYaw = 0;
        controlsRef.current.turnPitch = 0;
      }
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [gameState]);

  const requestPointerLock = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.requestPointerLock?.();
    }
  }, []);

  // Interaction trigger
  const handleInteract = useCallback(() => {
    if (!sceneRef.current) return;
    const res = sceneRef.current.interact();
    if (res.message) {
      showToast(res.message);
    }
    if (res.note) {
      setCollectedItems((prev) => [...prev, res.note!]);
      setSelectedNoteItem(res.note);
      setGameState('reading_note');
    }
  }, [showToast]);

  const handleRestart = useCallback(() => {
    if (sceneRef.current) {
      sceneRef.current.dispose();
      sceneRef.current = null;
    }
    setSurvivalTimeSec(0);
    setCollectedItems([]);
    setGameState('playing');
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black select-none">
      {/* 3D Canvas Viewport */}
      <div
        ref={containerRef}
        onClick={() => {
          if (gameState === 'playing' && !isPointerLocked && !isMobile) {
            requestPointerLock();
          } else if (gameState === 'playing' && isPointerLocked) {
            handleInteract();
          }
        }}
        className="w-full h-full cursor-crosshair"
      />

      {/* VHS Filter Overlay */}
      {isVHSEnabled && gameState !== 'menu' && (
        <VHSOverlay
          sanity={stats.sanity}
          entityDistance={entityState.distanceToPlayer}
          isJumpscare={gameState === 'jumpscare'}
        />
      )}

      {/* In-Game HUD */}
      {gameState === 'playing' && (
        <GameHUD
          stats={stats}
          entityState={entityState}
          interactPrompt={interactPrompt}
          onOpenNotes={() => setGameState('reading_note')}
          onToggleMute={() => setIsMuted(soundManager.toggleMute())}
          isMuted={isMuted}
          onPause={() => setGameState('paused')}
          isPointerLocked={isPointerLocked || isMobile}
          onRequestPointerLock={requestPointerLock}
        />
      )}

      {/* Toast Alert Banner */}
      {toastMessage && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40 bg-zinc-900/90 border border-amber-500/70 text-amber-200 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-mono shadow-2xl backdrop-blur-md animate-fade-in pointer-events-none">
          {toastMessage}
        </div>
      )}

      {/* Mobile Touch Joysticks */}
      {gameState === 'playing' && isMobile && (
        <MobileControls
          onMoveChange={(move) => {
            controlsRef.current.moveForward = move.forward;
            controlsRef.current.moveBackward = move.backward;
            controlsRef.current.moveLeft = move.left;
            controlsRef.current.moveRight = move.right;
          }}
          onLookDelta={(yaw, pitch) => {
            controlsRef.current.turnYaw = yaw;
            controlsRef.current.turnPitch = pitch;
          }}
          onToggleSprint={(sprint) => {
            controlsRef.current.sprint = sprint;
          }}
          onToggleCrouch={(crouch) => {
            controlsRef.current.crouch = crouch;
          }}
          onInteract={handleInteract}
          isSprinting={controlsRef.current.sprint}
          isCrouching={controlsRef.current.crouch}
        />
      )}

      {/* Start / Menu Screen */}
      {gameState === 'menu' && <StartScreen onStart={handleStartGame} />}

      {/* Pause Menu */}
      {gameState === 'paused' && (
        <PauseModal
          onResume={() => setGameState('playing')}
          onRestart={handleRestart}
          onQuitToMenu={() => {
            if (sceneRef.current) {
              sceneRef.current.dispose();
              sceneRef.current = null;
            }
            setGameState('menu');
          }}
          mouseSensitivity={mouseSensitivity}
          onSensitivityChange={(v) => setMouseSensitivity(v)}
          isVHSEnabled={isVHSEnabled}
          onToggleVHS={() => setIsVHSEnabled((prev) => !prev)}
        />
      )}

      {/* Notes / Tape transcripts modal */}
      {gameState === 'reading_note' && (
        <NotesModal
          collectedItems={collectedItems}
          selectedItem={selectedNoteItem}
          onClose={() => setGameState('playing')}
        />
      )}

      {/* Game Over or Victory */}
      {(gameState === 'game_over' || gameState === 'victory') && (
        <GameOverModal
          isVictory={gameState === 'victory'}
          stats={stats}
          survivalTimeSec={survivalTimeSec}
          onRestart={handleRestart}
        />
      )}
    </div>
  );
}
