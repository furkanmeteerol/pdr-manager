import React, { useState, Suspense, lazy } from 'react';
import {
  Gamepad2,
  Sparkles,
  RefreshCw,
  Keyboard,
  Mouse,
  Smartphone
} from 'lucide-react';

// Lazy load all 12 GameKit UI games for optimal memory usage and bundle chunking
const LazyMinesweeper = lazy(() => import('./gamekit/minesweeper'));
const Lazy2048 = lazy(() => import('./gamekit/2048'));
const LazyMemoryMatch = lazy(() => import('./gamekit/memory-match'));
const LazySnake = lazy(() => import('./gamekit/snake'));
const LazyTicTacToe = lazy(() => import('./gamekit/tic-tac-toe'));
const LazyWhackAMole = lazy(() => import('./gamekit/whack-a-mole'));
const LazyPong = lazy(() => import('./gamekit/pong'));
const LazyBreakout = lazy(() => import('./gamekit/breakout'));
const LazyDinoRunner = lazy(() => import('./gamekit/dino-runner'));
const LazyFlappy = lazy(() => import('./gamekit/flappy'));
const LazyFruitNinja = lazy(() => import('./gamekit/fruit-ninja'));
const LazyStack = lazy(() => import('./gamekit/stack'));

export type GameKey =
  | 'minesweeper'
  | '2048'
  | 'memory-match'
  | 'snake'
  | 'tic-tac-toe'
  | 'whack-a-mole'
  | 'pong'
  | 'breakout'
  | 'dino-runner'
  | 'flappy'
  | 'fruit-ninja'
  | 'stack';

interface GameMetadata {
  key: GameKey;
  name: string;
  badge: string;
  category: 'Zeka & Strateji' | 'Klasik Arcade' | 'Refleks & Beceri';
  icon: string;
  description: string;
  controls: ('keyboard' | 'mouse' | 'touch')[];
}

const GAMES_LIST: GameMetadata[] = [
  {
    key: 'minesweeper',
    name: 'Mayın Tarlası',
    badge: 'Minesweeper',
    category: 'Zeka & Strateji',
    icon: '💣',
    description: 'Rakam ipuçlarını kullanarak tüm mayınları güvenle işaretleyin.',
    controls: ['mouse', 'touch']
  },
  {
    key: '2048',
    name: '2048',
    badge: '2048',
    category: 'Zeka & Strateji',
    icon: '🔢',
    description: 'Aynı sayıdaki kutucukları birleştirerek 2048 taşına ulaşın.',
    controls: ['keyboard', 'touch']
  },
  {
    key: 'memory-match',
    name: 'Hafıza Kartları',
    badge: 'Memory Match',
    category: 'Zeka & Strateji',
    icon: '🧠',
    description: 'Tüm kart çiftlerini en az hamlede bularak eşleştirin.',
    controls: ['mouse', 'touch']
  },
  {
    key: 'snake',
    name: 'Yılan Oyunu',
    badge: 'Snake',
    category: 'Klasik Arcade',
    icon: '🐍',
    description: 'Yemleri toplayarak büyüyün, duvarlara ve kendinize çarpmayın.',
    controls: ['keyboard', 'touch']
  },
  {
    key: 'tic-tac-toe',
    name: 'X-O-X',
    badge: 'Tic-Tac-Toe',
    category: 'Zeka & Strateji',
    icon: '❌⭕',
    description: '3 taşı yan yana, alt alta veya çapraz hizalayarak kazanın.',
    controls: ['mouse', 'touch']
  },
  {
    key: 'whack-a-mole',
    name: 'Köstebek Vurma',
    badge: 'Whack-a-Mole',
    category: 'Refleks & Beceri',
    icon: '🖱️',
    description: 'Deliklerden çıkan köstebeklere süre dolmadan hızlıca tıklayın.',
    controls: ['mouse', 'touch']
  },
  {
    key: 'pong',
    name: 'Pong Masası',
    badge: 'Pong',
    category: 'Klasik Arcade',
    icon: '🏓',
    description: 'Rakete çarpan topu kaçırmadan rakibe karşı puan kazanın.',
    controls: ['keyboard', 'mouse', 'touch']
  },
  {
    key: 'breakout',
    name: 'Tuğla Kırma',
    badge: 'Breakout',
    category: 'Klasik Arcade',
    icon: '🧱',
    description: 'Topu raketle sektirerek ekrandaki tüm tuğlaları kırın.',
    controls: ['keyboard', 'mouse', 'touch']
  },
  {
    key: 'dino-runner',
    name: 'Dinozor Koşusu',
    badge: 'Dino Runner',
    category: 'Refleks & Beceri',
    icon: '🦖',
    description: 'Engellerin ve kaktüslerin üzerinden zıplayarak ilerleyin.',
    controls: ['keyboard', 'touch']
  },
  {
    key: 'flappy',
    name: 'Uçan Kuş',
    badge: 'Flappy',
    category: 'Refleks & Beceri',
    icon: '🐦',
    description: 'Borulara çarpmadan boşluklardan uçarak yüksek skor yapın.',
    controls: ['keyboard', 'mouse', 'touch']
  },
  {
    key: 'fruit-ninja',
    name: 'Meyve Kesme',
    badge: 'Fruit Ninja',
    category: 'Refleks & Beceri',
    icon: '🍉',
    description: 'Havaya fırlatılan meyveleri dilimleyin, bombalardan kaçının.',
    controls: ['mouse', 'touch']
  },
  {
    key: 'stack',
    name: 'Blok Kule',
    badge: 'Stack',
    category: 'Refleks & Beceri',
    icon: '🏗️',
    description: 'Hareketli blokları tam üst üste hizalayarak gökdelen inşa edin.',
    controls: ['keyboard', 'mouse', 'touch']
  }
];

export const OtherView: React.FC = () => {
  const [selectedGame, setSelectedGame] = useState<GameKey>('minesweeper');
  const [gameSessionKey, setGameSessionKey] = useState<number>(0);

  const activeGameMeta = GAMES_LIST.find((g) => g.key === selectedGame) || GAMES_LIST[0];

  const handleResetGame = () => {
    setGameSessionKey((prev) => prev + 1);
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 shadow-xs">
            <Gamepad2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
              <span>Diğer / Mini Oyunlar</span>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[11px] font-bold border border-blue-200">
                12 Oyunluk Mola Alanı
              </span>
            </h1>
            <p className="text-xs text-slate-500">
              PDR danışmanlığı aralarında zihninizi dinlendirebileceğiniz hafif, yerel mini oyunlar
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-600 shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span className="font-semibold text-slate-700">Çevrimdışı ve Yerel</span>
          <span className="text-slate-300">•</span>
          <span>GameKit UI Motoru</span>
        </div>
      </div>

      {/* 12 Game Selector Responsive Grid / Tabs */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
          Oyun Seçimi ({GAMES_LIST.length} Oyun)
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {GAMES_LIST.map((game) => {
            const isSelected = selectedGame === game.key;
            return (
              <button
                key={game.key}
                type="button"
                onClick={() => {
                  if (selectedGame !== game.key) {
                    setSelectedGame(game.key);
                    setGameSessionKey((prev) => prev + 1);
                  }
                }}
                className={`p-2.5 rounded-xl text-left transition-all flex flex-col gap-1 cursor-pointer border ${
                  isSelected
                    ? 'bg-blue-50 text-blue-900 border-blue-400 shadow-xs ring-2 ring-blue-500/20'
                    : 'bg-white text-slate-600 border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-lg">{game.icon}</span>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                  )}
                </div>
                <div className="text-xs font-bold text-slate-800 truncate">{game.name}</div>
                <div className="text-[10px] text-slate-400 truncate">{game.badge}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Game Info & Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white px-5 py-3.5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{activeGameMeta.icon}</span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-800">{activeGameMeta.name}</h2>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                {activeGameMeta.category}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{activeGameMeta.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Controls badge */}
          <div className="flex items-center gap-2 text-slate-500 text-xs bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200/80">
            <span className="text-[11px] font-medium text-slate-400">Kontroller:</span>
            {activeGameMeta.controls.includes('keyboard') && (
              <span className="flex items-center gap-1 font-semibold text-slate-700" title="Klavye ile oynanabilir (Ok tuşları / WASD / Space)">
                <Keyboard className="w-3.5 h-3.5 text-blue-600" />
                <span>Klavye</span>
              </span>
            )}
            {activeGameMeta.controls.includes('mouse') && (
              <span className="flex items-center gap-1 font-semibold text-slate-700" title="Fare ile tıklayarak veya sürükleyerek oynanabilir">
                <Mouse className="w-3.5 h-3.5 text-indigo-600" />
                <span>Fare</span>
              </span>
            )}
            {activeGameMeta.controls.includes('touch') && (
              <span className="flex items-center gap-1 font-semibold text-slate-700" title="Dokunmatik ekran / kaydırma desteklenir">
                <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                <span>Dokunma</span>
              </span>
            )}
          </div>

          {/* Reset button */}
          <button
            type="button"
            onClick={handleResetGame}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer shadow-2xs"
            title="Oyunu Sıfırla"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span>Yeniden Başlat</span>
          </button>
        </div>
      </div>

      {/* Active Game Stage Container */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col items-center justify-center min-h-[460px]">
        <Suspense
          fallback={
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
              <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-medium">Oyun yükleniyor...</span>
            </div>
          }
        >
          <div key={`${selectedGame}-${gameSessionKey}`} className="w-full flex justify-center">
            {selectedGame === 'minesweeper' && <LazyMinesweeper width={460} />}
            {selectedGame === '2048' && <Lazy2048 width="420px" />}
            {selectedGame === 'memory-match' && <LazyMemoryMatch />}
            {selectedGame === 'snake' && <LazySnake width={460} />}
            {selectedGame === 'tic-tac-toe' && <LazyTicTacToe width={460} />}
            {selectedGame === 'whack-a-mole' && <LazyWhackAMole width={460} />}
            {selectedGame === 'pong' && <LazyPong width={460} />}
            {selectedGame === 'breakout' && <LazyBreakout width={460} />}
            {selectedGame === 'dino-runner' && <LazyDinoRunner width={460} />}
            {selectedGame === 'flappy' && <LazyFlappy width={460} />}
            {selectedGame === 'fruit-ninja' && <LazyFruitNinja width={460} />}
            {selectedGame === 'stack' && <LazyStack width={460} />}
          </div>
        </Suspense>
      </div>
    </div>
  );
};

export default OtherView;
