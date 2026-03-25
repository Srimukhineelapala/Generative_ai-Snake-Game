/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, Trophy, Gamepad2, Music } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---

interface Track {
  id: number;
  title: string;
  artist: string;
  url: string;
  cover: string;
}

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
interface Point {
  x: number;
  y: number;
}

// --- Constants ---

const GRID_SIZE = 20;
const INITIAL_SNAKE: Point[] = [{ x: 10, y: 10 }, { x: 10, y: 11 }, { x: 10, y: 12 }];
const INITIAL_DIRECTION: Direction = 'UP';
const GAME_SPEED = 150;

const TRACKS: Track[] = [
  {
    id: 1,
    title: "Neon Pulse",
    artist: "AI Synth",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    cover: "https://picsum.photos/seed/neon1/400/400"
  },
  {
    id: 2,
    title: "Cyber Drift",
    artist: "Digital Dreams",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    cover: "https://picsum.photos/seed/cyber/400/400"
  },
  {
    id: 3,
    title: "Synthwave Sunset",
    artist: "Retro Future",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    cover: "https://picsum.photos/seed/synth/400/400"
  }
];

// --- Components ---

const SnakeGame = () => {
  const [snake, setSnake] = useState<Point[]>(INITIAL_SNAKE);
  const [direction, setDirection] = useState<Direction>(INITIAL_DIRECTION);
  const [food, setFood] = useState<Point>({ x: 5, y: 5 });
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [isPaused, setIsPaused] = useState(true);
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);

  const generateFood = useCallback((currentSnake: Point[]) => {
    let newFood;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      const isOnSnake = currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y);
      if (!isOnSnake) break;
    }
    return newFood;
  }, []);

  const moveSnake = useCallback(() => {
    if (gameOver || isPaused) return;

    setSnake(prevSnake => {
      const head = prevSnake[0];
      const newHead = { ...head };

      switch (direction) {
        case 'UP': newHead.y -= 1; break;
        case 'DOWN': newHead.y += 1; break;
        case 'LEFT': newHead.x -= 1; break;
        case 'RIGHT': newHead.x += 1; break;
      }

      // Check wall collision
      if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
        setGameOver(true);
        return prevSnake;
      }

      // Check self collision
      if (prevSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
        setGameOver(true);
        return prevSnake;
      }

      const newSnake = [newHead, ...prevSnake];

      // Check food collision
      if (newHead.x === food.x && newHead.y === food.y) {
        setScore(s => s + 10);
        setFood(generateFood(newSnake));
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [direction, food, gameOver, isPaused, generateFood]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp': if (direction !== 'DOWN') setDirection('UP'); break;
        case 'ArrowDown': if (direction !== 'UP') setDirection('DOWN'); break;
        case 'ArrowLeft': if (direction !== 'RIGHT') setDirection('LEFT'); break;
        case 'ArrowRight': if (direction !== 'LEFT') setDirection('RIGHT'); break;
        case ' ': setIsPaused(p => !p); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [direction]);

  useEffect(() => {
    if (!gameOver && !isPaused) {
      gameLoopRef.current = setInterval(moveSnake, GAME_SPEED);
    } else {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    }
    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [moveSnake, gameOver, isPaused]);

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    setFood({ x: 5, y: 5 });
    setGameOver(false);
    setScore(0);
    setIsPaused(false);
  };

  return (
    <div className="flex flex-col items-center gap-6 p-8 bg-black/40 backdrop-blur-xl rounded-3xl border border-cyan-500/30 shadow-[0_0_50px_-12px_rgba(6,182,212,0.5)]">
      <div className="flex justify-between w-full items-center">
        <div className="flex items-center gap-2 text-cyan-400">
          <Gamepad2 size={24} />
          <span className="font-mono text-xl font-bold tracking-widest">SNAKE_OS</span>
        </div>
        <div className="flex items-center gap-2 text-fuchsia-400">
          <Trophy size={20} />
          <span className="font-mono text-2xl font-bold">{score.toString().padStart(4, '0')}</span>
        </div>
      </div>

      <div 
        className="relative bg-black/80 rounded-xl overflow-hidden border-2 border-cyan-500/20"
        style={{ width: GRID_SIZE * 15, height: GRID_SIZE * 15 }}
      >
        {/* Grid lines */}
        <div className="absolute inset-0 grid grid-cols-20 grid-rows-20 opacity-5">
           {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => (
             <div key={i} className="border-[0.5px] border-cyan-500" />
           ))}
        </div>

        {/* Snake */}
        {snake.map((segment, i) => (
          <motion.div
            key={`${segment.x}-${segment.y}-${i}`}
            className={`absolute rounded-sm ${i === 0 ? 'bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)] z-10' : 'bg-cyan-600/80'}`}
            style={{
              width: 15,
              height: 15,
              left: segment.x * 15,
              top: segment.y * 15,
            }}
            initial={false}
            animate={{ scale: 1 }}
          />
        ))}

        {/* Food */}
        <motion.div
          className="absolute bg-fuchsia-500 rounded-full shadow-[0_0_15px_rgba(217,70,239,0.8)]"
          style={{
            width: 12,
            height: 12,
            left: food.x * 15 + 1.5,
            top: food.y * 15 + 1.5,
          }}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 1 }}
        />

        <AnimatePresence>
          {(gameOver || isPaused) && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center"
            >
              {gameOver ? (
                <>
                  <h2 className="text-3xl font-black text-fuchsia-500 mb-2 tracking-tighter">SYSTEM FAILURE</h2>
                  <p className="text-cyan-400/70 font-mono mb-6">FINAL_SCORE: {score}</p>
                  <button 
                    onClick={resetGame}
                    className="px-8 py-3 bg-cyan-500 text-black font-bold rounded-full hover:bg-cyan-400 transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(6,182,212,0.4)]"
                  >
                    REBOOT
                  </button>
                </>
              ) : (
                <>
                  <h2 className="text-3xl font-black text-cyan-400 mb-6 tracking-tighter">PAUSED</h2>
                  <button 
                    onClick={() => setIsPaused(false)}
                    className="px-8 py-3 bg-fuchsia-500 text-white font-bold rounded-full hover:bg-fuchsia-400 transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(217,70,239,0.4)]"
                  >
                    RESUME
                  </button>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="text-cyan-400/40 text-xs font-mono uppercase tracking-widest">
        Use Arrows to Move • Space to Pause
      </div>
    </div>
  );
};

const MusicPlayer = () => {
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentTrack = TRACKS[currentTrackIndex];

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(() => setIsPlaying(false));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentTrackIndex]);

  const togglePlay = () => setIsPlaying(!isPlaying);
  
  const nextTrack = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % TRACKS.length);
  };

  const prevTrack = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + TRACKS.length) % TRACKS.length);
  };

  return (
    <div className="w-full max-w-md bg-black/40 backdrop-blur-xl rounded-3xl border border-fuchsia-500/30 p-6 shadow-[0_0_50px_-12px_rgba(217,70,239,0.5)]">
      <audio 
        ref={audioRef} 
        src={currentTrack.url} 
        onEnded={nextTrack}
        autoPlay={isPlaying}
      />
      
      <div className="flex items-center gap-6">
        <motion.div 
          key={currentTrack.id}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative w-24 h-24 flex-shrink-0"
        >
          <img 
            src={currentTrack.cover} 
            alt={currentTrack.title} 
            className={`w-full h-full object-cover rounded-2xl border-2 border-fuchsia-500/50 ${isPlaying ? 'animate-pulse' : ''}`}
            referrerPolicy="no-referrer"
          />
          <div className="absolute -bottom-2 -right-2 bg-fuchsia-500 p-1.5 rounded-lg shadow-lg">
            <Music size={14} className="text-white" />
          </div>
        </motion.div>

        <div className="flex-1 min-w-0">
          <h3 className="text-xl font-bold text-white truncate tracking-tight">{currentTrack.title}</h3>
          <p className="text-fuchsia-400 font-medium text-sm">{currentTrack.artist}</p>
          
          <div className="mt-4 flex items-center gap-4">
            <button onClick={prevTrack} className="text-white/60 hover:text-fuchsia-400 transition-colors">
              <SkipBack size={20} />
            </button>
            <button 
              onClick={togglePlay}
              className="w-10 h-10 flex items-center justify-center bg-white text-black rounded-full hover:scale-110 transition-transform shadow-[0_0_15px_rgba(255,255,255,0.3)]"
            >
              {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}
            </button>
            <button onClick={nextTrack} className="text-white/60 hover:text-fuchsia-400 transition-colors">
              <SkipForward size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <Volume2 size={16} className="text-fuchsia-400" />
        <input 
          type="range" 
          min="0" 
          max="1" 
          step="0.01" 
          value={volume}
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            setVolume(v);
            if (audioRef.current) audioRef.current.volume = v;
          }}
          className="flex-1 h-1 bg-fuchsia-900 rounded-lg appearance-none cursor-pointer accent-fuchsia-500"
        />
      </div>
    </div>
  );
};

export default function App() {
  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-4 overflow-hidden relative">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-fuchsia-500/10 blur-[120px] rounded-full" />
      
      {/* Grid Pattern Background */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="z-10 flex flex-col items-center gap-8 w-full max-w-4xl"
      >
        <header className="text-center">
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter italic bg-gradient-to-r from-cyan-400 via-white to-fuchsia-500 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(6,182,212,0.3)]">
            NEON_SNAKE
          </h1>
          <p className="text-cyan-400/60 font-mono text-sm tracking-[0.3em] uppercase mt-2">
            High Fidelity Retro Gaming
          </p>
        </header>

        <main className="flex flex-col lg:flex-row items-center justify-center gap-12 w-full">
          <div className="flex-shrink-0">
            <SnakeGame />
          </div>
          
          <div className="flex flex-col gap-6 w-full max-w-md">
            <div className="p-6 bg-white/5 backdrop-blur-md rounded-3xl border border-white/10">
              <h2 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4">Now Playing</h2>
              <MusicPlayer />
            </div>

            <div className="p-6 bg-white/5 backdrop-blur-md rounded-3xl border border-white/10">
              <h2 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3">System Status</h2>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-white/60">Audio Engine</span>
                  <span className="text-emerald-400 flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                    ONLINE
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-white/60">Neural Grid</span>
                  <span className="text-cyan-400">STABLE</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-white/60">Latency</span>
                  <span className="text-fuchsia-400 font-mono">1.2ms</span>
                </div>
              </div>
            </div>
          </div>
        </main>

        <footer className="mt-8 text-white/20 font-mono text-[10px] uppercase tracking-[0.5em]">
          &copy; 2026 NEON_SNAKE_OS v1.0.4
        </footer>
      </motion.div>
    </div>
  );
}
