'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Check } from 'lucide-react';
import {
  getAllSpecies,
  getAllAbilities,
  getAllMoves,
  GENERATIONS,
  filterSpeciesByMoves,
  type FormattedSpecies,
  type FormattedMove,
} from '@/lib/pokemon/data-provider';
import type { PokemonType, StatName } from '@/types/pokemon';
import { PokemonSprite } from '@/components/shared/PokemonSprite';
import { TypeBadge } from '@/components/shared/TypeBadge';
import { TYPE_COLORS } from '@/lib/pokemon/sprites';
import { STAT_COLORS } from '@/types/pokemon';
import Fuse from 'fuse.js';

const POKEMON_TYPES: PokemonType[] = [
  'Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice',
  'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic', 'Bug',
  'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy',
];

interface PokemonPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPokemon: (speciesName: string) => void;
  currentSpecies?: string;
}

export function PokemonPickerModal({
  isOpen,
  onClose,
  onSelectPokemon,
  currentSpecies,
}: PokemonPickerModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<PokemonType[]>([]);
  const [selectedAbilities, setSelectedAbilities] = useState<string[]>([]);
  const [selectedMoves, setSelectedMoves] = useState<string[]>([]);
  const [selectedGen, setSelectedGen] = useState<number | 'All'>('All');
  const [sortKey, setSortKey] = useState<'num' | 'name' | 'hp' | 'atk' | 'def' | 'spa' | 'spd' | 'spe' | 'bst'>('num');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [columnPanel, setColumnPanel] = useState<'none' | 'types' | 'abilities' | 'stats' | 'gen'>('none');
  const [statFilters, setStatFilters] = useState<Record<string, number>>({
    hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0, bst: 0,
  });

  const [filteredByMovesSpecies, setFilteredByMovesSpecies] = useState<FormattedSpecies[] | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // All data sources
  const allSpecies = useMemo(() => getAllSpecies(9), []);
  const allAbilities = useMemo(() => getAllAbilities(9), []);
  const allMoves = useMemo(() => getAllMoves(9), []);

  const speciesFuse = useMemo(
    () =>
      new Fuse(allSpecies, {
        keys: ['name', 'baseSpecies'],
        threshold: 0.3,
      }),
    [allSpecies]
  );

  const abilitiesFuse = useMemo(
    () =>
      new Fuse(allAbilities, {
        keys: ['name', 'shortDesc'],
        threshold: 0.3,
      }),
    [allAbilities]
  );

  const movesFuse = useMemo(
    () =>
      new Fuse(allMoves, {
        keys: ['name', 'type', 'shortDesc'],
        threshold: 0.3,
      }),
    [allMoves]
  );

  // Reset or focus on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Async move filter calculation
  useEffect(() => {
    let isCurrent = true;
    if (selectedMoves.length === 0) {
      setFilteredByMovesSpecies(null);
    } else {
      filterSpeciesByMoves(allSpecies, selectedMoves).then((res) => {
        if (isCurrent) setFilteredByMovesSpecies(res);
      });
    }
    return () => { isCurrent = false; };
  }, [allSpecies, selectedMoves]);

  // Search pop-up suggestion categories when typing in search input
  const searchSuggestions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return { types: [], abilities: [], moves: [], species: [] };

    // 1. Types
    const matchingTypes = POKEMON_TYPES.filter(
      (t) => t.toLowerCase().includes(q) && !selectedTypes.includes(t)
    );

    // 2. Abilities
    const matchingAbilities = abilitiesFuse
      .search(searchQuery, { limit: 8 })
      .map((r) => r.item)
      .filter((a) => !selectedAbilities.includes(a.name));

    // 3. Moves
    const matchingMoves = movesFuse
      .search(searchQuery, { limit: 8 })
      .map((r) => r.item)
      .filter((m) => !selectedMoves.includes(m.name));

    // 4. Species matches
    const matchingSpecies = speciesFuse
      .search(searchQuery, { limit: 200 })
      .map((r) => r.item);

    return {
      types: matchingTypes,
      abilities: matchingAbilities,
      moves: matchingMoves,
      species: matchingSpecies,
    };
  }, [searchQuery, selectedTypes, selectedAbilities, selectedMoves, abilitiesFuse, movesFuse, speciesFuse]);

  // Final species table dataset after applying ALL filters
  const finalSpeciesList = useMemo(() => {
    let result = filteredByMovesSpecies ?? [...allSpecies];

    // If query typed, search species
    if (searchQuery.trim()) {
      result = speciesFuse.search(searchQuery.trim(), { limit: 400 }).map((r) => r.item);
      if (filteredByMovesSpecies) {
        const allowedIds = new Set(filteredByMovesSpecies.map((s) => s.id));
        result = result.filter((s) => allowedIds.has(s.id));
      }
    }

    // Filter by ALL selected types
    if (selectedTypes.length > 0) {
      result = result.filter((s) => selectedTypes.every((t) => s.types.includes(t)));
    }

    // Filter by Gen
    if (selectedGen !== 'All') {
      result = result.filter((s) => s.generation === selectedGen);
    }

    // Filter by ALL selected abilities
    if (selectedAbilities.length > 0) {
      result = result.filter((s) =>
        selectedAbilities.every(
          (selAb) =>
            s.abilities.some((a) => a.toLowerCase() === selAb.toLowerCase()) ||
            (s.hiddenAbility && s.hiddenAbility.toLowerCase() === selAb.toLowerCase())
        )
      );
    }

    // Filter by Min stats
    for (const [stat, minVal] of Object.entries(statFilters)) {
      if (minVal > 0) {
        if (stat === 'bst') result = result.filter((s) => s.bst >= minVal);
        else result = result.filter((s) => s.baseStats[stat as StatName] >= minVal);
      }
    }

    // Sort
    result.sort((a, b) => {
      if (sortKey === 'name') {
        return sortDir === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
      }
      const aVal = sortKey === 'bst' ? a.bst : sortKey === 'num' ? a.num : a.baseStats[sortKey as StatName];
      const bVal = sortKey === 'bst' ? b.bst : sortKey === 'num' ? b.num : b.baseStats[sortKey as StatName];
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    });

    return result.slice(0, 400);
  }, [allSpecies, filteredByMovesSpecies, searchQuery, speciesFuse, selectedTypes, selectedGen, selectedAbilities, statFilters, sortKey, sortDir]);

  // Add / Remove Filter Helpers
  const addTypeFilter = (type: PokemonType) => {
    if (!selectedTypes.includes(type)) setSelectedTypes((prev) => [...prev, type]);
    setSearchQuery('');
  };

  const removeTypeFilter = (type: PokemonType) => {
    setSelectedTypes((prev) => prev.filter((t) => t !== type));
  };

  const addAbilityFilter = (abilityName: string) => {
    if (!selectedAbilities.includes(abilityName)) setSelectedAbilities((prev) => [...prev, abilityName]);
    setSearchQuery('');
  };

  const removeAbilityFilter = (abilityName: string) => {
    setSelectedAbilities((prev) => prev.filter((a) => a !== abilityName));
  };

  const addMoveFilter = (moveName: string) => {
    if (!selectedMoves.includes(moveName)) setSelectedMoves((prev) => [...prev, moveName]);
    setSearchQuery('');
  };

  const removeMoveFilter = (moveName: string) => {
    setSelectedMoves((prev) => prev.filter((m) => m !== moveName));
  };

  const deleteLastFilter = useCallback(() => {
    if (selectedMoves.length > 0) {
      setSelectedMoves((prev) => prev.slice(0, -1));
    } else if (selectedAbilities.length > 0) {
      setSelectedAbilities((prev) => prev.slice(0, -1));
    } else if (selectedTypes.length > 0) {
      setSelectedTypes((prev) => prev.slice(0, -1));
    } else if (selectedGen !== 'All') {
      setSelectedGen('All');
    }
  }, [selectedMoves, selectedAbilities, selectedTypes, selectedGen]);

  const clearAllFilters = () => {
    setSelectedTypes([]);
    setSelectedAbilities([]);
    setSelectedMoves([]);
    setSelectedGen('All');
    setStatFilters({ hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0, bst: 0 });
    setSearchQuery('');
  };

  const hasActiveFilters =
    selectedTypes.length > 0 ||
    selectedAbilities.length > 0 ||
    selectedMoves.length > 0 ||
    selectedGen !== 'All' ||
    Object.values(statFilters).some((v) => v > 0);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[130] bg-black/65 backdrop-blur-sm"
        onClick={() => { onClose(); setColumnPanel('none'); }}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: -16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: -16 }}
        transition={{ duration: 0.18 }}
        className="fixed left-1/2 top-[3%] z-[131] w-[98%] max-w-4xl -translate-x-1/2 rounded-2xl border flex flex-col overflow-hidden"
        style={{
          background: 'var(--bg-card)',
          borderColor: 'var(--border-primary)',
          boxShadow: '0 25px 80px rgba(0,0,0,0.7)',
          maxHeight: '93vh',
        }}
      >
        {/* Top Search Bar */}
        <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b flex-shrink-0" style={{ borderColor: 'var(--border-primary)' }}>
          <Search className="h-4 w-4 text-slate-400 flex-shrink-0" />
          <input
            ref={inputRef}
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setColumnPanel('none'); }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') onClose();
              else if (e.key === 'Backspace' && !searchQuery) deleteLastFilter();
            }}
            placeholder="Search Pokémon, type, ability, or move (e.g. Water, Swift Swim, Scald)..."
            className="flex-1 bg-transparent text-sm outline-none text-white placeholder-slate-500"
          />
          <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
            {finalSpeciesList.length} results
          </span>
          <button
            onClick={() => { onClose(); setColumnPanel('none'); }}
            className="text-xs px-2.5 py-1 rounded-lg ml-1 hover:bg-white/10 transition-colors"
            style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
          >
            ESC
          </button>
        </div>

        {/* Active Filter Tags Bar */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 flex-wrap px-4 py-2 border-b flex-shrink-0" style={{ borderColor: 'var(--border-primary)' }}>
            <span className="text-[11px] font-semibold text-slate-400">Filters:</span>

            {selectedTypes.map((type) => (
              <span
                key={type}
                className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-md border cursor-pointer hover:opacity-80 transition-all"
                style={{
                  borderColor: TYPE_COLORS[type]?.bg || 'var(--border-primary)',
                  color: TYPE_COLORS[type]?.text || '#fff',
                  background: (TYPE_COLORS[type]?.bg || 'var(--bg-secondary)') + '33',
                }}
                onClick={() => removeTypeFilter(type)}
              >
                {type} <X className="h-3 w-3 opacity-70 hover:opacity-100" />
              </span>
            ))}

            {selectedAbilities.map((ab) => (
              <span
                key={ab}
                className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-md border cursor-pointer hover:opacity-80 transition-all border-sky-500/40 text-sky-300 bg-sky-500/10"
                onClick={() => removeAbilityFilter(ab)}
              >
                {ab} <X className="h-3 w-3 opacity-70 hover:opacity-100" />
              </span>
            ))}

            {selectedMoves.map((m) => (
              <span
                key={m}
                className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-md border cursor-pointer hover:opacity-80 transition-all border-violet-500/40 text-violet-300 bg-violet-500/10"
                onClick={() => removeMoveFilter(m)}
              >
                {m} <X className="h-3 w-3 opacity-70 hover:opacity-100" />
              </span>
            ))}

            {selectedGen !== 'All' && (
              <span
                className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-md border cursor-pointer hover:opacity-80 transition-all"
                style={{ borderColor: 'var(--border-secondary)', color: 'var(--text-primary)', background: 'var(--bg-secondary)' }}
                onClick={() => setSelectedGen('All')}
              >
                {GENERATIONS.find((g) => g.num === selectedGen)?.name} <X className="h-3 w-3 opacity-70 hover:opacity-100" />
              </span>
            )}

            {Object.entries(statFilters)
              .filter(([, v]) => v > 0)
              .map(([stat, val]) => (
                <span
                  key={stat}
                  className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-md border cursor-pointer hover:opacity-80 transition-all"
                  style={{ borderColor: 'var(--border-secondary)', color: STAT_COLORS[stat as StatName] || '#fff', background: 'var(--bg-secondary)' }}
                  onClick={() => setStatFilters((prev) => ({ ...prev, [stat]: 0 }))}
                >
                  {stat.toUpperCase()} ≥{val} <X className="h-3 w-3 opacity-70 hover:opacity-100" />
                </span>
              ))}

            <span className="text-[10px] text-slate-500 italic ml-1">(backspace = delete filter)</span>

            <button
              onClick={clearAllFilters}
              className="text-[10px] px-2 py-0.5 rounded-md border border-rose-500/40 text-rose-400 hover:bg-rose-500/10 transition-colors ml-auto font-semibold"
            >
              Clear All
            </button>
          </div>
        )}

        {/* Search Suggestions Popup when user types text in search box */}
        {searchQuery.trim().length > 0 && (
          <div
            className="border-b p-3 space-y-3 max-h-[45vh] overflow-y-auto flex-shrink-0"
            style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}
          >
            {/* Type Suggestions */}
            {searchSuggestions.types.length > 0 && (
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 px-2">Type</div>
                <div className="space-y-1">
                  {searchSuggestions.types.map((type) => (
                    <div
                      key={type}
                      className="flex items-center justify-between px-3 py-1.5 rounded-xl hover:bg-white/5 border border-slate-800/60 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-white">{type}</span>
                        <TypeBadge type={type} size="sm" />
                      </div>
                      <button
                        onClick={() => addTypeFilter(type)}
                        className="px-3 py-1 rounded-lg text-[11px] font-bold border border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/20 transition-all italic"
                      >
                        Filter
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Ability Suggestions */}
            {searchSuggestions.abilities.length > 0 && (
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 px-2">Abilities</div>
                <div className="space-y-1">
                  {searchSuggestions.abilities.map((ab) => (
                    <div
                      key={ab.id}
                      className="flex items-center justify-between px-3 py-1.5 rounded-xl hover:bg-white/5 border border-slate-800/60 transition-colors"
                    >
                      <div className="min-w-0 pr-2">
                        <span className="text-sm font-bold text-white">{ab.name}</span>
                        {ab.shortDesc && <span className="block text-[10px] text-slate-400 truncate max-w-md">{ab.shortDesc}</span>}
                      </div>
                      <button
                        onClick={() => addAbilityFilter(ab.name)}
                        className="px-3 py-1 rounded-lg text-[11px] font-bold border border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/20 transition-all italic flex-shrink-0"
                      >
                        Filter
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Move Suggestions */}
            {searchSuggestions.moves.length > 0 && (
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 px-2">Moves</div>
                <div className="space-y-1">
                  {searchSuggestions.moves.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between px-3 py-1.5 rounded-xl hover:bg-white/5 border border-slate-800/60 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-2">
                        <span className="text-sm font-bold text-white truncate">{m.name}</span>
                        <TypeBadge type={m.type} size="sm" />
                        <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                          {m.category} · BP {m.basePower || '-'}
                        </span>
                      </div>
                      <button
                        onClick={() => addMoveFilter(m.name)}
                        className="px-3 py-1 rounded-lg text-[11px] font-bold border border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/20 transition-all italic flex-shrink-0"
                      >
                        Filter
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pokémon Section Divider Header */}
            {searchSuggestions.species.length > 0 && (
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 pt-1 border-t border-slate-800">
                Pokémon
              </div>
            )}
          </div>
        )}

        {/* Column Filter Panel (slides down when column header clicked) */}
        <AnimatePresence>
          {columnPanel !== 'none' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-b overflow-hidden flex-shrink-0"
              style={{ borderColor: 'var(--border-primary)' }}
            >
              <div className="p-3" style={{ background: 'var(--bg-secondary)' }}>
                {columnPanel === 'types' && (
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="text-[10px] font-bold uppercase text-slate-500 mr-1">Filter by Type:</span>
                    <button
                      onClick={() => { setSelectedTypes([]); setColumnPanel('none'); }}
                      className="px-2.5 py-1 rounded-lg font-medium text-[10px] border transition-colors"
                      style={{
                        background: selectedTypes.length === 0 ? 'var(--color-primary)' : 'var(--bg-card)',
                        color: selectedTypes.length === 0 ? '#fff' : 'var(--text-secondary)',
                        borderColor: 'var(--border-primary)',
                      }}
                    >
                      All
                    </button>
                    {POKEMON_TYPES.map((type) => {
                      const colors = TYPE_COLORS[type] ?? TYPE_COLORS['Normal'];
                      const isActive = selectedTypes.includes(type);
                      return (
                        <button
                          key={type}
                          onClick={() => {
                            if (isActive) removeTypeFilter(type);
                            else addTypeFilter(type);
                            setColumnPanel('none');
                          }}
                          className="px-2.5 py-1 rounded-lg transition-all font-semibold uppercase tracking-wide text-[10px] border"
                          style={{
                            background: isActive ? colors.bg : 'var(--bg-card)',
                            color: isActive ? colors.text : 'var(--text-tertiary)',
                            borderColor: isActive ? colors.bg : 'var(--border-primary)',
                            opacity: isActive ? 1 : 0.75,
                          }}
                        >
                          {type}
                        </button>
                      );
                    })}
                  </div>
                )}

                {columnPanel === 'gen' && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-bold uppercase text-slate-500 mr-1">Filter by Gen:</span>
                    <button
                      onClick={() => { setSelectedGen('All'); setColumnPanel('none'); }}
                      className="px-2.5 py-1 rounded-lg font-medium text-[10px] border transition-colors"
                      style={{
                        background: selectedGen === 'All' ? 'var(--color-primary)' : 'var(--bg-card)',
                        color: selectedGen === 'All' ? '#fff' : 'var(--text-secondary)',
                        borderColor: 'var(--border-primary)',
                      }}
                    >
                      All
                    </button>
                    {GENERATIONS.map((gen) => (
                      <button
                        key={gen.num}
                        onClick={() => {
                          setSelectedGen(selectedGen === gen.num ? 'All' : gen.num);
                          setColumnPanel('none');
                        }}
                        className="px-2.5 py-1 rounded-lg font-medium text-[10px] border transition-colors"
                        style={{
                          background: selectedGen === gen.num ? 'var(--color-primary)' : 'var(--bg-card)',
                          color: selectedGen === gen.num ? '#fff' : 'var(--text-secondary)',
                          borderColor: 'var(--border-primary)',
                        }}
                      >
                        {gen.name} <span className="opacity-60">({gen.region})</span>
                      </button>
                    ))}
                  </div>
                )}

                {columnPanel === 'abilities' && (
                  <div>
                    <div className="text-[10px] font-bold uppercase text-slate-500 mb-2">Filter by Ability:</div>
                    <div className="max-h-40 overflow-y-auto grid grid-cols-3 sm:grid-cols-4 gap-1">
                      {allAbilities.map((ab) => (
                        <button
                          key={ab.id}
                          onClick={() => {
                            if (selectedAbilities.includes(ab.name)) removeAbilityFilter(ab.name);
                            else addAbilityFilter(ab.name);
                            setColumnPanel('none');
                          }}
                          className="text-left px-2.5 py-1.5 rounded-lg text-[10px] font-medium border transition-colors truncate"
                          style={{
                            background: selectedAbilities.includes(ab.name) ? 'var(--color-primary)' : 'var(--bg-card)',
                            color: selectedAbilities.includes(ab.name) ? '#fff' : 'var(--text-secondary)',
                            borderColor: 'var(--border-primary)',
                          }}
                        >
                          {ab.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {columnPanel === 'stats' && (
                  <div>
                    <div className="text-[10px] font-bold uppercase text-slate-500 mb-2">Min Stat Filter:</div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {(['hp', 'atk', 'def', 'spa', 'spd', 'spe', 'bst'] as const).map((stat) => (
                        <div key={stat}>
                          <div className="flex items-center justify-between mb-1">
                            <span
                              className="text-[10px] font-bold uppercase"
                              style={{ color: stat === 'bst' ? '#a78bfa' : STAT_COLORS[stat as StatName] || 'var(--text-secondary)' }}
                            >
                              {stat === 'bst' ? 'BST' : stat.toUpperCase()}
                            </span>
                            <input
                              type="number"
                              min={0}
                              max={stat === 'bst' ? 800 : 255}
                              value={statFilters[stat] || ''}
                              onChange={(e) => setStatFilters((prev) => ({ ...prev, [stat]: parseInt(e.target.value) || 0 }))}
                              className="w-14 text-right text-[11px] font-mono font-bold rounded border px-1 py-0.5 outline-none"
                              style={{ background: 'var(--bg-card)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                            />
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={stat === 'bst' ? 800 : 255}
                            value={statFilters[stat] || 0}
                            onChange={(e) => setStatFilters((prev) => ({ ...prev, [stat]: parseInt(e.target.value) }))}
                            className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                            style={{ accentColor: stat === 'bst' ? '#a78bfa' : STAT_COLORS[stat as StatName] || 'var(--color-primary)' }}
                          />
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => setStatFilters({ hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0, bst: 0 })}
                      className="mt-2 text-[10px] px-2 py-0.5 rounded border border-rose-500/40 text-rose-400 hover:bg-rose-500/10 transition-colors"
                    >
                      Reset Stats
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Table Column Headers */}
        <div
          className="grid items-center text-[10px] font-bold uppercase tracking-wider border-b px-4 py-2 flex-shrink-0"
          style={{
            gridTemplateColumns: '2.5rem 2.5rem 1fr 1fr 1fr 2.2rem 2.2rem 2.2rem 2.2rem 2.2rem 2.2rem 2.8rem',
            borderColor: 'var(--border-primary)',
            background: 'var(--bg-secondary)',
            color: 'var(--text-tertiary)',
          }}
        >
          <span />
          <button
            onClick={() => {
              const d = sortKey === 'num' ? (sortDir === 'asc' ? 'desc' : 'asc') : 'asc';
              setSortKey('num');
              setSortDir(d);
              setColumnPanel(columnPanel === 'gen' ? 'none' : 'gen');
            }}
            className={`text-left hover:text-white transition-colors ${columnPanel === 'gen' || sortKey === 'num' ? 'text-white' : ''}`}
          >
            #
          </button>
          <button
            onClick={() => {
              const d = sortKey === 'name' ? (sortDir === 'asc' ? 'desc' : 'asc') : 'asc';
              setSortKey('name');
              setSortDir(d);
              setColumnPanel('none');
            }}
            className={`text-left hover:text-white transition-colors ${sortKey === 'name' ? 'text-white' : ''}`}
          >
            Name {sortKey === 'name' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
          </button>
          <button
            onClick={() => setColumnPanel(columnPanel === 'types' ? 'none' : 'types')}
            className={`text-left hover:text-white transition-colors ${columnPanel === 'types' || selectedTypes.length > 0 ? 'text-indigo-400' : ''}`}
          >
            Types {selectedTypes.length > 0 ? `(${selectedTypes.length})` : ''}
          </button>
          <button
            onClick={() => setColumnPanel(columnPanel === 'abilities' ? 'none' : 'abilities')}
            className={`text-left hover:text-white transition-colors ${columnPanel === 'abilities' || selectedAbilities.length > 0 ? 'text-indigo-400' : ''}`}
          >
            Abilities {selectedAbilities.length > 0 ? `(${selectedAbilities.length})` : ''}
          </button>
          {(['hp', 'atk', 'def', 'spa', 'spd', 'spe'] as const).map((stat) => (
            <button
              key={stat}
              onClick={() => {
                const d = sortKey === stat ? (sortDir === 'asc' ? 'desc' : 'asc') : 'desc';
                setSortKey(stat);
                setSortDir(d);
                setColumnPanel(columnPanel === 'stats' ? 'none' : 'stats');
              }}
              className={`text-center hover:text-white transition-colors ${sortKey === stat ? 'text-white' : ''}`}
              style={{ color: statFilters[stat] > 0 ? STAT_COLORS[stat] : undefined }}
            >
              {stat === 'spa' ? 'SpA' : stat === 'spd' ? 'SpD' : stat === 'spe' ? 'Spe' : stat.toUpperCase()}
              {sortKey === stat ? (sortDir === 'asc' ? '↑' : '↓') : ''}
            </button>
          ))}
          <button
            onClick={() => {
              const d = sortKey === 'bst' ? (sortDir === 'asc' ? 'desc' : 'asc') : 'desc';
              setSortKey('bst');
              setSortDir(d);
              setColumnPanel(columnPanel === 'stats' ? 'none' : 'stats');
            }}
            className={`text-center hover:text-white transition-colors ${sortKey === 'bst' ? 'text-violet-400' : ''}`}
          >
            BST {sortKey === 'bst' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
          </button>
        </div>

        {/* Scrollable Pokémon Table Rows */}
        <div className="overflow-y-auto flex-1">
          {finalSpeciesList.length === 0 ? (
            <div className="text-center py-12 text-sm" style={{ color: 'var(--text-tertiary)' }}>
              No Pokémon match your filters.
            </div>
          ) : (
            finalSpeciesList.map((species) => {
              const isSelected = currentSpecies === species.name;
              return (
                <button
                  key={species.name}
                  onClick={() => {
                    onSelectPokemon(species.name);
                    onClose();
                    setColumnPanel('none');
                  }}
                  className="w-full grid items-center px-4 py-1.5 border-b transition-colors hover:bg-white/5 text-left"
                  style={{
                    gridTemplateColumns: '2.5rem 2.5rem 1fr 1fr 1fr 2.2rem 2.2rem 2.2rem 2.2rem 2.2rem 2.2rem 2.8rem',
                    borderColor: 'var(--border-primary)',
                    background: isSelected ? 'rgba(99,102,241,0.15)' : undefined,
                  }}
                >
                  <div className="flex items-center justify-center">
                    <PokemonSprite name={species.name} dexNum={species.num} size={32} animated={false} />
                  </div>
                  <span className="text-[10px] font-mono" style={{ color: 'var(--text-tertiary)' }}>
                    #{String(species.num).padStart(3, '0')}
                  </span>
                  <span className={`text-sm font-semibold truncate pr-2 ${isSelected ? 'text-indigo-300' : 'text-white'}`}>
                    {species.name}
                  </span>
                  <div className="flex gap-1 flex-wrap">
                    {species.types.map((t) => (
                      <TypeBadge key={t} type={t as PokemonType} size="sm" />
                    ))}
                  </div>
                  <div className="text-[10px] leading-tight pr-2" style={{ color: 'var(--text-secondary)' }}>
                    {species.abilities.slice(0, 2).join(' / ')}
                    {species.hiddenAbility && <span className="block opacity-60 italic">{species.hiddenAbility}</span>}
                  </div>
                  {(['hp', 'atk', 'def', 'spa', 'spd', 'spe'] as const).map((stat) => (
                    <span
                      key={stat}
                      className="text-center text-[11px] font-mono font-bold"
                      style={{
                        color:
                          statFilters[stat] > 0 && species.baseStats[stat as StatName] >= statFilters[stat]
                            ? STAT_COLORS[stat as StatName]
                            : 'var(--text-secondary)',
                      }}
                    >
                      {species.baseStats[stat as StatName]}
                    </span>
                  ))}
                  <span
                    className="text-center text-[11px] font-mono font-bold"
                    style={{
                      color: statFilters['bst'] > 0 && species.bst >= statFilters['bst'] ? '#a78bfa' : 'var(--text-tertiary)',
                    }}
                  >
                    {species.bst}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
