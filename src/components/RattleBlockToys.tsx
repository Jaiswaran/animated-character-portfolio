/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  RotateCcw,
  Sparkles,
  Volume2,
  Trash2,
  Undo2,
  Wand2,
  Award,
  Layers,
  ChevronRight,
  Check,
} from 'lucide-react';
import { useSoundEffects } from '../hooks/useSoundEffects';

export type BlockShape =
  | 'cube'
  | 'arch'
  | 'triangle'
  | 'spire'
  | 'rattle'
  | 'dome'
  | 'cylinder'
  | 'beam';

export interface PlacedBlock {
  id: string;
  shape: BlockShape;
  color: string;
  symbol?: string;
  rotation?: number;
}

export interface ColumnStack {
  colIndex: number;
  blocks: PlacedBlock[];
}

export const SHAPES_CATALOG: {
  id: BlockShape;
  name: string;
  symbol: string;
  desc: string;
}[] = [
  { id: 'cube', name: 'Alphabet Cube', symbol: '✦', desc: 'Solid wooden block' },
  { id: 'arch', name: 'Roman Arch', symbol: '∩', desc: 'Bridges columns' },
  { id: 'triangle', name: 'Prism Steeple', symbol: '▲', desc: 'Classic roof cap' },
  { id: 'spire', name: 'Star Spire', symbol: '★', desc: 'Glowing starlight finial' },
  { id: 'rattle', name: 'Chime Rattle', symbol: '♫', desc: 'Shakes with gentle sound' },
  { id: 'dome', name: 'Moon Dome', symbol: '◠', desc: 'Curved lunar cap' },
  { id: 'cylinder', name: 'Pillar Column', symbol: '❙', desc: 'Slender support' },
  { id: 'beam', name: 'Lintel Plank', symbol: '▬', desc: 'Wide wooden base' },
];

export const TOY_COLORS = [
  { name: 'Star Gold', hex: '#f3cf75', text: '#5c4033' },
  { name: 'Rose Berry', hex: '#a34063', text: '#fff8f1' },
  { name: 'Dream Lavender', hex: '#d9c8ef', text: '#3e274f' },
  { name: 'Starlight Blue', hex: '#7aa2f7', text: '#1f172e' },
  { name: 'Petal Blush', hex: '#f1c9d6', text: '#a34063' },
  { name: 'Sage Mint', hex: '#a8d5ba', text: '#244030' },
  { name: 'Honey Birch', hex: '#e8c96d', text: '#5c4033' },
  { name: 'Midnight Plum', hex: '#3e274f', text: '#f3cf75' },
];

const BLUEPRINTS: {
  id: string;
  name: string;
  icon: string;
  description: string;
  layout: Record<number, { shape: BlockShape; colorIndex: number; symbol?: string }[]>;
}[] = [
  {
    id: 'starlight-spire',
    name: 'Starlight Spire',
    icon: '✦',
    description: 'A soaring celestial watchtower crowned with a shining golden star.',
    layout: {
      1: [
        { shape: 'cube', colorIndex: 1, symbol: 'P' },
        { shape: 'arch', colorIndex: 2 },
        { shape: 'triangle', colorIndex: 0 },
      ],
      2: [
        { shape: 'beam', colorIndex: 6 },
        { shape: 'cube', colorIndex: 0, symbol: '✦' },
        { shape: 'rattle', colorIndex: 4, symbol: '♫' },
        { shape: 'cube', colorIndex: 1, symbol: '★' },
        { shape: 'cylinder', colorIndex: 3 },
        { shape: 'dome', colorIndex: 2 },
        { shape: 'spire', colorIndex: 0, symbol: '★' },
      ],
      3: [
        { shape: 'cube', colorIndex: 3, symbol: 'P' },
        { shape: 'arch', colorIndex: 2 },
        { shape: 'triangle', colorIndex: 5 },
      ],
    },
  },
  {
    id: 'twin-castles',
    name: 'Observatory Castle',
    icon: '⌂',
    description: 'Twin fortified ramparts connected by a grand nursery archway.',
    layout: {
      0: [
        { shape: 'cube', colorIndex: 1, symbol: '1' },
        { shape: 'cube', colorIndex: 3, symbol: '2' },
        { shape: 'triangle', colorIndex: 0 },
      ],
      1: [
        { shape: 'cube', colorIndex: 6, symbol: 'P' },
        { shape: 'cylinder', colorIndex: 2 },
        { shape: 'dome', colorIndex: 4 },
      ],
      2: [
        { shape: 'arch', colorIndex: 0 },
        { shape: 'rattle', colorIndex: 1, symbol: '♫' },
        { shape: 'spire', colorIndex: 0, symbol: '★' },
      ],
      3: [
        { shape: 'cube', colorIndex: 6, symbol: 'I' },
        { shape: 'cylinder', colorIndex: 2 },
        { shape: 'dome', colorIndex: 4 },
      ],
      4: [
        { shape: 'cube', colorIndex: 1, symbol: '3' },
        { shape: 'cube', colorIndex: 3, symbol: '4' },
        { shape: 'triangle', colorIndex: 0 },
      ],
    },
  },
  {
    id: 'moon-rocket',
    name: 'Moon Rocket',
    icon: '▲',
    description: 'Stepped aerodynamic boosters ready to carry dreams to the stars.',
    layout: {
      1: [
        { shape: 'triangle', colorIndex: 1 },
      ],
      2: [
        { shape: 'beam', colorIndex: 7 },
        { shape: 'cube', colorIndex: 0, symbol: '✦' },
        { shape: 'cube', colorIndex: 2, symbol: '☾' },
        { shape: 'cylinder', colorIndex: 3 },
        { shape: 'rattle', colorIndex: 1, symbol: '♫' },
        { shape: 'spire', colorIndex: 0, symbol: '★' },
      ],
      3: [
        { shape: 'triangle', colorIndex: 1 },
      ],
    },
  },
];

const NUM_COLUMNS = 5;
const MAX_HEIGHT = 8;

interface RattleBlockToysProps {
  compact?: boolean;
  onHeightChange?: (height: number, total: number) => void;
}

export const RattleBlockToys: React.FC<RattleBlockToysProps> = ({
  compact = false,
  onHeightChange,
}) => {
  const { play } = useSoundEffects();

  // Selected block configuration
  const [selectedShape, setSelectedShape] = useState<BlockShape>('cube');
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);

  // Tower grid: array of 5 columns, each with an array of blocks stacked bottom to top
  const [columns, setColumns] = useState<PlacedBlock[][]>(() => {
    // Start with a cute 3-column beginner castle
    const initial: PlacedBlock[][] = Array.from({ length: NUM_COLUMNS }, () => []);
    initial[1] = [
      { id: 'init-1', shape: 'cube', color: TOY_COLORS[1].hex, symbol: 'P' },
      { id: 'init-2', shape: 'triangle', color: TOY_COLORS[0].hex },
    ];
    initial[2] = [
      { id: 'init-3', shape: 'beam', color: TOY_COLORS[6].hex },
      { id: 'init-4', shape: 'cube', color: TOY_COLORS[2].hex, symbol: '✦' },
      { id: 'init-5', shape: 'rattle', color: TOY_COLORS[4].hex, symbol: '♫' },
      { id: 'init-6', shape: 'spire', color: TOY_COLORS[0].hex, symbol: '★' },
    ];
    initial[3] = [
      { id: 'init-7', shape: 'cube', color: TOY_COLORS[3].hex, symbol: 'P' },
      { id: 'init-8', shape: 'triangle', color: TOY_COLORS[5].hex },
    ];
    return initial;
  });

  // Action history for undo
  const [history, setHistory] = useState<PlacedBlock[][][]>([]);

  // Animation states
  const [wobbling, setWobbling] = useState(false);
  const [rattleSparkle, setRattleSparkle] = useState<string | null>(null);
  const [celebrationMessage, setCelebrationMessage] = useState<string | null>(null);
  const actionLockRef = useRef(false);
  const timerRefs = useRef<ReturnType<typeof setTimeout>[]>([]);

  const scheduleTimer = (callback: () => void, delay: number) => {
    const timer = setTimeout(() => {
      timerRefs.current = timerRefs.current.filter((item) => item !== timer);
      callback();
    }, delay);
    timerRefs.current.push(timer);
    return timer;
  };

  useEffect(() => () => {
    timerRefs.current.forEach((timer) => clearTimeout(timer));
    timerRefs.current = [];
    actionLockRef.current = false;
  }, []);

  // Calculate metrics
  const totalBlocks = columns.reduce((acc, col) => acc + col.length, 0);
  const maxHeight = Math.max(0, ...columns.map((c) => c.length));

  const lastReported = useRef<{ height: number; total: number }>({ height: -1, total: -1 });
  const onHeightChangeRef = useRef(onHeightChange);
  useEffect(() => {
    onHeightChangeRef.current = onHeightChange;
  });

  useEffect(() => {
    if (
      lastReported.current.height !== maxHeight ||
      lastReported.current.total !== totalBlocks
    ) {
      lastReported.current = { height: maxHeight, total: totalBlocks };
      onHeightChangeRef.current?.(maxHeight, totalBlocks);
    }
  }, [maxHeight, totalBlocks]);

  // Drop block onto column
  const dropBlock = (colIndex: number) => {
    if (actionLockRef.current) return;
    if (columns[colIndex].length >= MAX_HEIGHT) {
      play('button-click');
      return;
    }

    // Save history
    setHistory((prev) => [...prev.slice(-15), columns.map((c) => [...c])]);

    const activeColor = TOY_COLORS[selectedColorIndex].hex;
    const shapeObj = SHAPES_CATALOG.find((s) => s.id === selectedShape);
    const newBlock: PlacedBlock = {
      id: 'blk-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      shape: selectedShape,
      color: activeColor,
      symbol: shapeObj?.symbol,
    };

    setColumns((prev) => {
      const next = prev.map((c) => [...c]);
      next[colIndex].push(newBlock);
      return next;
    });

    if (selectedShape === 'rattle') {
      play('toy-rattle');
      setRattleSparkle(newBlock.id);
      scheduleTimer(() => setRattleSparkle(null), 800);
    } else {
      play('block-place');
    }

    // If reached 6 or higher, celebrate!
    if (columns[colIndex].length + 1 >= 6) {
      play('tower-celebrate');
      setCelebrationMessage('Masterpiece in the stars! Pip approves!');
      scheduleTimer(() => setCelebrationMessage(null), 3000);
    }
  };

  // Remove individual block
  const removeBlock = (colIndex: number, blockIndex: number, event: React.MouseEvent) => {
    event.stopPropagation();
    if (actionLockRef.current) return;
    setHistory((prev) => [...prev.slice(-15), columns.map((c) => [...c])]);
    play('button-click');
    setColumns((prev) => {
      const next = prev.map((c) => [...c]);
      next[colIndex].splice(blockIndex, 1);
      return next;
    });
  };

  // Shake rattle directly
  const handleRattleClick = (blockId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    play('toy-rattle');
    setRattleSparkle(blockId);
    scheduleTimer(() => setRattleSparkle(null), 700);
  };

  // Undo last placement
  const undoLast = () => {
    if (!history.length || actionLockRef.current) return;
    play('button-click');
    const prev = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setColumns(prev);
  };

  // Clear / topple all blocks
  const toppleTower = () => {
    if (totalBlocks === 0 || actionLockRef.current) return;
    actionLockRef.current = true;
    setHistory((prev) => [...prev.slice(-15), columns.map((c) => [...c])]);
    play('tower-wobble');
    setWobbling(true);
    scheduleTimer(() => {
      setColumns(Array.from({ length: NUM_COLUMNS }, () => []));
      setWobbling(false);
      actionLockRef.current = false;
      play('button-click');
    }, 450);
  };

  // Test tower stability / balance wobble
  const testBalance = () => {
    if (totalBlocks === 0 || actionLockRef.current) return;
    actionLockRef.current = true;
    play('tower-wobble');
    setWobbling(true);
    scheduleTimer(() => {
      setWobbling(false);
      actionLockRef.current = false;
      play('tower-celebrate');
      setCelebrationMessage(
        maxHeight >= 5
          ? '✦ Tower stands 100% structurally magical!'
          : '✦ Perfectly balanced & cozy!'
      );
      scheduleTimer(() => setCelebrationMessage(null), 2800);
    }, 700);
  };

  // Load a blueprint
  const loadBlueprint = (bp: (typeof BLUEPRINTS)[0]) => {
    if (actionLockRef.current) return;
    setHistory((prev) => [...prev.slice(-15), columns.map((c) => [...c])]);
    play('tower-celebrate');

    const newCols: PlacedBlock[][] = Array.from({ length: NUM_COLUMNS }, () => []);
    Object.entries(bp.layout).forEach(([colStr, blocks]) => {
      const colIdx = parseInt(colStr, 10);
      if (colIdx >= 0 && colIdx < NUM_COLUMNS) {
        newCols[colIdx] = blocks.map((b, idx) => ({
          id: `bp-${bp.id}-${colIdx}-${idx}-${Date.now()}`,
          shape: b.shape,
          color: TOY_COLORS[b.colorIndex % TOY_COLORS.length].hex,
          symbol: b.symbol || SHAPES_CATALOG.find((s) => s.id === b.shape)?.symbol,
        }));
      }
    });

    setColumns(newCols);
    setCelebrationMessage(`Loaded "${bp.name}" blueprint!`);
    scheduleTimer(() => setCelebrationMessage(null), 2500);
  };

  // Render a single styled block
  const renderBlockElement = (block: PlacedBlock, colIndex: number, blockIndex: number) => {
    const isRattling = rattleSparkle === block.id;

    // Custom CSS shapes for our blocks
    let shapeClass = 'w-14 h-12 rounded-lg flex items-center justify-center font-bold text-sm shadow-md';
    let extraStyle: React.CSSProperties = {
      backgroundColor: block.color,
      color: '#fff8f1',
    };

    switch (block.shape) {
      case 'cube':
        shapeClass = 'w-14 h-12 rounded-xl border-2 border-white/20 shadow-md flex items-center justify-center font-bold text-base';
        break;
      case 'arch':
        shapeClass = 'w-16 h-12 rounded-t-3xl border-t-2 border-x-2 border-white/25 shadow-md flex items-center justify-center font-bold text-sm';
        break;
      case 'triangle':
        shapeClass = 'w-14 h-11 [clip-path:polygon(50%_0%,0%_100%,100%_100%)] flex items-end justify-center pb-1 text-xs font-bold';
        break;
      case 'spire':
        shapeClass = 'w-12 h-14 rounded-full border-2 border-amber-300/60 shadow-lg flex items-center justify-center text-xl font-bold animate-pulse';
        break;
      case 'rattle':
        shapeClass = `w-14 h-11 rounded-2xl border-2 border-dashed border-white/40 shadow-lg flex items-center justify-center text-sm font-bold ${
          isRattling ? 'animate-bounce scale-110' : ''
        }`;
        break;
      case 'dome':
        shapeClass = 'w-16 h-10 rounded-t-full border-t-2 border-white/30 shadow-md flex items-center justify-center text-xs font-bold';
        break;
      case 'cylinder':
        shapeClass = 'w-10 h-13 rounded-2xl border-2 border-white/20 shadow-md flex items-center justify-center text-xs font-bold';
        break;
      case 'beam':
        shapeClass = 'w-20 h-7 rounded-lg border border-white/30 shadow-md flex items-center justify-center text-xs font-bold';
        break;
    }

    return (
      <div
        key={block.id}
        className={`relative group transition-transform duration-200 select-none ${
          wobbling ? 'animate-tilt' : ''
        }`}
        style={{
          animationDelay: `${(colIndex * 40 + blockIndex * 25) % 200}ms`,
        }}
      >
        <button
          type="button"
          disabled={actionLockRef.current}
          onClick={(event) => {
            if (block.shape === 'rattle') {
              handleRattleClick(block.id, event);
            } else {
              removeBlock(colIndex, blockIndex, event);
            }
          }}
          title={`${block.shape} - click to ${block.shape === 'rattle' ? 'shake rattle' : 'remove block'}`}
          aria-label={`${block.shape === 'rattle' ? 'Shake' : 'Remove'} ${SHAPES_CATALOG.find((shape) => shape.id === block.shape)?.name || block.shape}`}
          className={`${shapeClass} cursor-pointer transition-transform duration-200 hover:scale-105 disabled:cursor-wait`}
          style={extraStyle}
        >
          {block.shape === 'rattle' ? (
            <span className="flex items-center gap-0.5">
              ♫ <span className="text-[10px] opacity-75">✦</span>
            </span>
          ) : block.shape === 'spire' ? (
            <span className="text-amber-200 drop-shadow-md">★</span>
          ) : (
            <span>{block.symbol || '✦'}</span>
          )}
        </button>

        {/* Hover delete affordance */}
        <button
          type="button"
          disabled={actionLockRef.current}
          onClick={(e) => removeBlock(colIndex, blockIndex, e)}
          className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-rich-berry text-white text-[10px] font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity shadow-md z-10 disabled:opacity-40"
          aria-label="Remove block"
        >
          ×
        </button>

        {/* Starlight rattle burst */}
        {isRattling && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <span className="absolute -top-3 text-amber-300 text-xs animate-ping">✧</span>
            <span className="absolute -bottom-3 text-rose-300 text-xs animate-ping">✦</span>
            <span className="absolute -left-3 text-lavender text-xs animate-ping">⭐</span>
          </div>
        )}
      </div>
    );
  };

  // Compact preview version for the invention card
  if (compact) {
    return (
      <div className="w-full flex flex-col items-center">
        <div className="w-full h-44 bg-cream/30 dark:bg-plum-dark/60 rounded-2xl border border-rich-berry/15 dark:border-star-gold/20 p-3 flex flex-col justify-end relative overflow-hidden">
          {/* Subtle wooden floor */}
          <div className="absolute bottom-0 inset-x-0 h-4 bg-amber-900/10 dark:bg-black/30 border-t border-rich-berry/10" />

          {/* Stacking Play Area */}
          <div className="relative z-10 flex items-end justify-center gap-2 mb-2">
            {columns.slice(1, 4).map((col, cIdx) => (
              <div key={cIdx} className="flex flex-col-reverse items-center gap-1">
                {col.slice(0, 4).map((b, bIdx) => renderBlockElement(b, cIdx + 1, bIdx))}
              </div>
            ))}
          </div>
        </div>

        {/* Quick Compact Controls */}
        <div className="w-full mt-3 flex items-center justify-between text-xs font-bubbly text-plum dark:text-cream/80">
          <span className="flex items-center gap-1.5 font-bold">
            <Layers className="w-3.5 h-3.5 text-rich-berry dark:text-star-gold" />
            {totalBlocks} Blocks · {maxHeight} Stories High
          </span>
          <button
            type="button"
            onClick={toppleTower}
            className="px-2.5 py-1 rounded-lg bg-soft-blush dark:bg-white/10 hover:bg-rich-berry/20 text-rich-berry dark:text-star-gold font-bold transition-colors"
          >
            Clear Playtable
          </button>
        </div>
      </div>
    );
  }

  // Full Interactive Workshop Experience
  return (
    <div className="w-full space-y-6">
      {/* Top Banner / Metrics & Blueprint Selector */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-soft-blush/60 dark:bg-plum/50 border border-rich-berry/15 dark:border-star-gold/20 p-4 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-rich-berry/10 dark:bg-star-gold/15 flex items-center justify-center text-2xl font-bold text-rich-berry dark:text-star-gold shadow-inner">
            🏰
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-rich-berry dark:text-star-gold font-bubbly">
                Tactile Tower Workshop
              </span>
              {celebrationMessage && (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold animate-pulse">
                  {celebrationMessage}
                </span>
              )}
            </div>
            <h3 className="font-serif-headline text-xl font-bold text-plum dark:text-cream">
              {maxHeight} Stories Tall · {totalBlocks} Blocks Arranged
            </h3>
          </div>
        </div>

        {/* Quick Blueprint Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bubbly font-bold text-warm-brown/70 dark:text-cream/60">
            Blueprints:
          </span>
          {BLUEPRINTS.map((bp) => (
            <button
              key={bp.id}
              type="button"
              onClick={() => loadBlueprint(bp)}
              className="px-3 py-1.5 rounded-xl border border-rich-berry/20 dark:border-white/15 bg-cream dark:bg-plum-dark hover:scale-105 active:scale-95 text-xs font-bubbly font-bold text-plum dark:text-cream flex items-center gap-1.5 transition-all shadow-sm"
              title={bp.description}
            >
              <span>{bp.icon}</span>
              <span>{bp.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Play Area & Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left / Center: Interactive Stacking Table Canvas (8 cols) */}
        <div className="lg:col-span-8 flex flex-col">
          <div className="relative w-full min-h-[380px] sm:min-h-[440px] bg-gradient-to-b from-cream/40 via-cream/80 to-soft-blush/80 dark:from-plum-dark dark:via-plum/80 dark:to-plum-dark/95 rounded-3xl border-2 border-rich-berry/20 dark:border-star-gold/25 p-4 sm:p-6 flex flex-col justify-end shadow-xl overflow-hidden">
            {/* Whimsical Wallpaper Grid Pattern */}
            <div
              className="absolute inset-0 opacity-15 pointer-events-none"
              style={{
                backgroundImage: 'radial-gradient(#a34063 1.5px, transparent 1.5px)',
                backgroundSize: '20px 20px',
              }}
              aria-hidden="true"
            />

            {/* Ceiling Constellations / Floating Star Twinkles */}
            <div className="absolute top-4 inset-x-6 flex justify-between items-center text-xs font-bubbly text-warm-brown/60 dark:text-cream/50 pointer-events-none">
              <span className="flex items-center gap-1.5">
                <span className="text-star-gold text-base">✦</span> Tap any column to stack the active block
              </span>
              <span className="font-bold">Max 8 Stories</span>
            </div>

            {/* The 5 Interactive Columns on Wooden Playtable */}
            <div className="relative z-10 grid grid-cols-5 gap-2 sm:gap-4 items-end mb-4">
              {columns.map((col, colIdx) => {
                const isFull = col.length >= MAX_HEIGHT;
                return (
                  <div
                    key={colIdx}
                    onClick={() => dropBlock(colIdx)}
                    role="group"
                    tabIndex={0}
                    aria-label={`Column ${colIdx + 1}. Press Enter or Space to stack the selected shape.`}
                    onKeyDown={(event) => {
                      if ((event.key === 'Enter' || event.key === ' ') && event.target === event.currentTarget) {
                        event.preventDefault();
                        dropBlock(colIdx);
                      }
                    }}
                    className={`group relative flex flex-col-reverse items-center gap-1.5 p-2 rounded-2xl min-h-[260px] sm:min-h-[320px] justify-start transition-all cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rich-berry ${
                      isFull
                        ? 'opacity-90'
                        : 'hover:bg-rich-berry/5 dark:hover:bg-star-gold/5 border border-dashed border-transparent hover:border-rich-berry/30 dark:hover:border-star-gold/30'
                    }`}
                  >
                    {/* Render blocks in column bottom-to-top */}
                    {col.map((block, blockIdx) =>
                      renderBlockElement(block, colIdx, blockIdx)
                    )}

                    {/* Column Drop Indicator on Hover */}
                    {!isFull && (
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center py-2 text-rich-berry dark:text-star-gold">
                        <span className="text-xs font-bold font-bubbly">Drop here</span>
                        <span className="text-lg animate-bounce">↓</span>
                      </div>
                    )}

                    {/* Column Floor Marker */}
                    <div className="w-full text-center mt-auto pt-2 border-t border-rich-berry/15 dark:border-white/10 text-[10px] font-bubbly font-bold text-warm-brown/60 dark:text-cream/40">
                      Col {colIdx + 1}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Solid Polished Nursery Wood Base */}
            <div className="w-full h-8 rounded-2xl bg-gradient-to-r from-amber-200 via-amber-100 to-amber-200 dark:from-amber-900/60 dark:via-amber-800/60 dark:to-amber-900/60 border-2 border-amber-300/40 dark:border-amber-600/30 flex items-center justify-between px-4 text-xs font-bubbly font-bold text-warm-brown dark:text-amber-200 shadow-md">
              <span>✦ Pip’s Stacking Table</span>
              <span className="text-[11px] opacity-80">Solid Beechwood Foundation</span>
            </div>
          </div>

          {/* Table Actions Bar: Undo, Wobble Test, Clear */}
          <div className="mt-3 flex items-center justify-between gap-3 flex-wrap font-bubbly text-xs">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={undoLast}
                disabled={!history.length}
                className="px-3.5 py-2 rounded-xl border border-rich-berry/20 bg-cream dark:bg-plum-dark text-plum dark:text-cream hover:bg-soft-blush dark:hover:bg-plum disabled:opacity-40 disabled:cursor-not-allowed font-bold flex items-center gap-1.5 transition-all shadow-sm"
              >
                <Undo2 className="w-3.5 h-3.5" /> Undo
              </button>
              <button
                type="button"
                onClick={testBalance}
                disabled={totalBlocks === 0}
                className="px-3.5 py-2 rounded-xl border border-amber-300/40 bg-amber-50 dark:bg-amber-950/40 text-warm-brown dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/50 disabled:opacity-40 font-bold flex items-center gap-1.5 transition-all shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Test Stability & Wobble
              </button>
            </div>

            <button
              type="button"
              onClick={toppleTower}
              disabled={totalBlocks === 0}
              className="px-3.5 py-2 rounded-xl border border-rose-300/40 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/50 disabled:opacity-40 font-bold flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Trash2 className="w-3.5 h-3.5" /> Topple & Rebuild
            </button>
          </div>
        </div>

        {/* Right: Shape & Color Picker Tray (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Active Block Inspector */}
          <div className="bg-cream/60 dark:bg-plum/60 border border-rich-berry/15 dark:border-white/10 rounded-2xl p-4 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-rich-berry dark:text-star-gold font-bubbly">
              Active Piece in Hand
            </span>
            <div className="mt-2 flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold shadow-md border-2 border-white/30"
                style={{
                  backgroundColor: TOY_COLORS[selectedColorIndex].hex,
                  color: TOY_COLORS[selectedColorIndex].text,
                }}
              >
                {SHAPES_CATALOG.find((s) => s.id === selectedShape)?.symbol}
              </div>
              <div>
                <h4 className="font-serif-headline text-lg font-bold text-plum dark:text-cream">
                  {SHAPES_CATALOG.find((s) => s.id === selectedShape)?.name}
                </h4>
                <p className="text-xs font-bubbly text-warm-brown/75 dark:text-cream/70">
                  {SHAPES_CATALOG.find((s) => s.id === selectedShape)?.desc}
                </p>
              </div>
            </div>
          </div>

          {/* Shape Selector Tray */}
          <div className="bg-cream/60 dark:bg-plum/60 border border-rich-berry/15 dark:border-white/10 rounded-2xl p-4 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-rich-berry dark:text-star-gold font-bubbly">
              1. Choose Shape
            </span>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {SHAPES_CATALOG.map((shape) => {
                const isSelected = selectedShape === shape.id;
                return (
                  <button
                    key={shape.id}
                    type="button"
                    onClick={() => {
                      play('button-click');
                      setSelectedShape(shape.id);
                    }}
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                      isSelected
                        ? 'border-rich-berry dark:border-star-gold bg-soft-blush dark:bg-plum shadow-sm scale-102 font-bold text-rich-berry dark:text-star-gold'
                        : 'border-rich-berry/10 dark:border-white/10 bg-cream/80 dark:bg-plum-dark/60 text-plum dark:text-cream/80 hover:bg-cream'
                    }`}
                  >
                    <span className="w-7 h-7 rounded-lg bg-rich-berry/10 dark:bg-white/10 flex items-center justify-center font-bold text-base">
                      {shape.symbol}
                    </span>
                    <span className="text-xs font-bubbly truncate">{shape.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color Palette Selector */}
          <div className="bg-cream/60 dark:bg-plum/60 border border-rich-berry/15 dark:border-white/10 rounded-2xl p-4 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-rich-berry dark:text-star-gold font-bubbly">
              2. Choose Paint Color
            </span>
            <div className="grid grid-cols-4 gap-2 mt-2">
              {TOY_COLORS.map((color, idx) => {
                const isSelected = selectedColorIndex === idx;
                return (
                  <button
                    key={color.name}
                    type="button"
                    onClick={() => {
                      play('button-click');
                      setSelectedColorIndex(idx);
                    }}
                    title={color.name}
                    aria-label={`Select ${color.name} color`}
                    className={`h-11 rounded-xl flex items-center justify-center transition-transform shadow-sm relative ${
                      isSelected ? 'ring-2 ring-rich-berry dark:ring-star-gold scale-105' : 'hover:scale-102'
                    }`}
                    style={{ backgroundColor: color.hex }}
                  >
                    {isSelected && (
                      <Check
                        className="w-4 h-4 stroke-[3]"
                        style={{ color: color.text }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
            <div className="mt-2 text-[11px] font-bubbly text-center text-warm-brown/70 dark:text-cream/60">
              Selected: <strong>{TOY_COLORS[selectedColorIndex].name}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
