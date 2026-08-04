'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, AlertTriangle } from 'lucide-react';
import { getAllMoves, getMove, type FormattedMove } from '@/lib/pokemon/data-provider';
import { TypeBadge } from '@/components/shared/TypeBadge';
import Fuse from 'fuse.js';

interface MoveSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMove: (moveName: string) => void;
  currentMoveSlot?: number;
}

export function MoveSelectorModal({
  isOpen,
  onClose,
  onSelectMove,
  currentMoveSlot = 0,
}: MoveSelectorModalProps) {
  const [query, setQuery] = useState('');
  const [showIllegalMoves, setShowIllegalMoves] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<'All' | 'Physical' | 'Special' | 'Status' | 'GMax' | 'ZMove' | 'Shadow'>('All');

  const movesList = useMemo(() => getAllMoves(9), []);

  const fuse = useMemo(
    () =>
      new Fuse(movesList, {
        keys: ['name', 'type', 'shortDesc'],
        threshold: 0.3,
      }),
    [movesList]
  );

  const filteredMoves = useMemo(() => {
    let result = query.trim() ? fuse.search(query, { limit: 120 }).map((r) => r.item) : movesList;

    if (!showIllegalMoves && !query.trim()) {
      result = result.filter((m) => !m.isIllegal);
    }

    if (categoryFilter === 'Physical') {
      result = result.filter((m) => m.category === 'Physical');
    } else if (categoryFilter === 'Special') {
      result = result.filter((m) => m.category === 'Special');
    } else if (categoryFilter === 'Status') {
      result = result.filter((m) => m.category === 'Status');
    } else if (categoryFilter === 'GMax') {
      result = result.filter((m) => m.isGmax || m.isMax);
    } else if (categoryFilter === 'ZMove') {
      result = result.filter((m) => m.isZ);
    } else if (categoryFilter === 'Shadow') {
      result = result.filter((m) => m.isShadow);
    }

    return result.slice(0, 150);
  }, [query, fuse, movesList, categoryFilter, showIllegalMoves]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          className="relative z-10 w-full max-w-2xl rounded-2xl border p-5 shadow-2xl space-y-4 max-h-[85vh] flex flex-col"
          style={{
            background: 'var(--bg-card)',
            borderColor: 'var(--border-primary)',
          }}
        >
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg text-white">
              Select Move (Slot {currentMoveSlot + 1})
            </h3>
            <button
              onClick={onClose}
              className="text-xs px-2.5 py-1 rounded-lg"
              style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
            >
              ESC
            </button>
          </div>

          {/* Search Bar & Illegal Toggle */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-3 border rounded-xl px-3 py-2 flex-1 min-w-[240px]" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
              <Search className="h-4 w-4 text-slate-400" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search moves..."
                className="flex-1 bg-transparent text-sm outline-none text-white"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-300 bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl">
              <input
                type="checkbox"
                checked={showIllegalMoves}
                onChange={(e) => setShowIllegalMoves(e.target.checked)}
                className="accent-indigo-500"
              />
              Show Illegal Moves
            </label>
          </div>

          {/* Category & Special Moves Filters */}
          <div className="flex items-center gap-1.5 text-xs flex-wrap">
            <span style={{ color: 'var(--text-tertiary)' }}>Filter:</span>
            {(
              [
                { id: 'All', label: 'All' },
                { id: 'Physical', label: 'Physical' },
                { id: 'Special', label: 'Special' },
                { id: 'Status', label: 'Status' },
                { id: 'GMax', label: 'G-Max / Max' },
                { id: 'ZMove', label: 'Z-Moves' },
                { id: 'Shadow', label: 'Shadow Moves' },
              ] as const
            ).map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                className="px-2.5 py-1 rounded-lg transition-colors font-medium text-xs"
                style={{
                  background: categoryFilter === cat.id ? 'var(--color-primary)' : 'var(--bg-secondary)',
                  color: categoryFilter === cat.id ? '#fff' : 'var(--text-secondary)',
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Move List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {filteredMoves.length === 0 ? (
              <div className="text-center py-10 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                No moves found.
              </div>
            ) : (
              filteredMoves.map((move) => (
                <button
                  key={move.id}
                  onClick={() => {
                    onSelectMove(move.name);
                    onClose();
                  }}
                  className={`w-full card card-interactive p-3 flex items-center justify-between text-left transition-all hover:border-indigo-500 ${
                    move.isIllegal ? 'border-amber-500/40 bg-amber-950/10' : ''
                  }`}
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-white">
                        {move.name}
                      </span>
                      <TypeBadge type={move.type} size="sm" />
                      <span
                        className="text-[10px] px-2 py-0.5 rounded font-mono font-bold"
                        style={{
                          background: 'var(--bg-tertiary)',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        {move.category}
                      </span>
                      {move.isGmax && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-purple-900/60 text-purple-300 font-bold border border-purple-500/30">
                          G-Max
                        </span>
                      )}
                      {move.isZ && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-amber-900/60 text-amber-300 font-bold border border-amber-500/30">
                          Z-Move
                        </span>
                      )}
                      {move.isIllegal && (
                        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded font-mono bg-rose-950 text-rose-400 font-bold border border-rose-500/40">
                          <AlertTriangle className="h-3 w-3 text-rose-400" />
                          ILLEGAL
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">
                      {move.shortDesc || move.desc || 'No description available.'}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-mono flex-shrink-0 ml-4">
                    <div className="text-right">
                      <div className="text-slate-400 text-[10px]">BP</div>
                      <div className="font-bold">{move.basePower || '—'}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-slate-400 text-[10px]">ACC</div>
                      <div className="font-bold">{move.accuracy === true ? '100%' : `${move.accuracy}%`}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-slate-400 text-[10px]">PP</div>
                      <div className="font-bold">{move.pp}</div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
