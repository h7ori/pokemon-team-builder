'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X } from 'lucide-react';
import {
  getAllSpecies,
  getAllAbilities,
  getAllMoves,
  GENERATIONS,
  filterSpeciesByMoves,
  type FormattedSpecies,
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

// ── Gimmick & Category Definitions ──────────────────────────────────────────

type GimmickKey =
  | 'Mega' | 'G-Max' | 'Primal'
  | 'Alolan' | 'Galarian' | 'Hisuian' | 'Paldean';

type CategoryKey =
  | 'Restricted Legendary' | 'Sub-Legendary' | 'Mythical'
  | 'Ultra Beast' | 'Paradox' | 'Pseudo-Legendary';

interface FilterChipDef {
  label: string;
  color: string;      // CSS color for text/border
  bg: string;         // CSS bg color
}

const GIMMICK_DEFS: Record<GimmickKey, FilterChipDef> = {
  'Mega':     { label: 'Mega',    color: '#f472b6', bg: 'rgba(244,114,182,0.12)' },
  'G-Max':    { label: 'G-Max',   color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
  'Primal':   { label: 'Primal',  color: '#f97316', bg: 'rgba(249,115,22,0.12)'  },
  'Alolan':   { label: 'Alolan',  color: '#38bdf8', bg: 'rgba(56,189,248,0.12)'  },
  'Galarian': { label: 'Galarian',color: '#34d399', bg: 'rgba(52,211,153,0.12)'  },
  'Hisuian':  { label: 'Hisuian', color: '#fbbf24', bg: 'rgba(251,191,36,0.12)'  },
  'Paldean':  { label: 'Paldean', color: '#fb7185', bg: 'rgba(251,113,133,0.12)' },
};

const CATEGORY_DEFS: Record<CategoryKey, FilterChipDef> = {
  'Restricted Legendary': { label: 'Legendary',        color: '#facc15', bg: 'rgba(250,204,21,0.12)' },
  'Sub-Legendary':        { label: 'Sub-Legendary',    color: '#fb923c', bg: 'rgba(251,146,60,0.12)'  },
  'Mythical':             { label: 'Mythical',         color: '#e879f9', bg: 'rgba(232,121,249,0.12)' },
  'Ultra Beast':          { label: 'Ultra Beast',      color: '#818cf8', bg: 'rgba(129,140,248,0.12)' },
  'Paradox':              { label: 'Paradox',          color: '#2dd4bf', bg: 'rgba(45,212,191,0.12)'  },
  'Pseudo-Legendary':     { label: 'Pseudo-Legendary', color: '#a3e635', bg: 'rgba(163,230,53,0.12)'  },
};

function matchesGimmick(s: FormattedSpecies, g: GimmickKey): boolean {
  switch (g) {
    case 'Mega':     return s.isMega;
    case 'G-Max':    return s.isGmax;
    case 'Primal':   return s.isPrimal;
    case 'Alolan':   return s.isAlolan;
    case 'Galarian': return s.isGalarian;
    case 'Hisuian':  return s.isHisuian;
    case 'Paldean':  return s.isPaldean;
  }
}

function matchesCategory(s: FormattedSpecies, c: CategoryKey): boolean {
  if (c === 'Pseudo-Legendary') return s.isPseudoLegendary;
  return s.tags.includes(c);
}

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
  const [selectedGimmicks, setSelectedGimmicks] = useState<GimmickKey[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<CategoryKey[]>([]);
  const [sortKey, setSortKey] = useState<'num' | 'name' | 'hp' | 'atk' | 'def' | 'spa' | 'spd' | 'spe' | 'bst'>('num');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [columnPanel, setColumnPanel] = useState<'none' | 'types' | 'abilities' | 'stats' | 'gen' | 'gimmick' | 'category'>('none');
  const [statFilters, setStatFilters] = useState<Record<string, number>>({
    hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0, bst: 0,
  });

  const [filteredByMovesSpecies, setFilteredByMovesSpecies] = useState<FormattedSpecies[] | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const allSpecies = useMemo(() => getAllSpecies(9), []);
  const allAbilities = useMemo(() => getAllAbilities(9), []);
  const allMoves = useMemo(() => getAllMoves(9), []);

  const speciesFuse = useMemo(
    () => new Fuse(allSpecies, { keys: ['name', 'baseSpecies'], threshold: 0.3 }),
    [allSpecies]
  );
  const abilitiesFuse = useMemo(
    () => new Fuse(allAbilities, { keys: ['name', 'shortDesc'], threshold: 0.3 }),
    [allAbilities]
  );
  const movesFuse = useMemo(
    () => new Fuse(allMoves, { keys: ['name', 'type', 'shortDesc'], threshold: 0.3 }),
    [allMoves]
  );

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 50);
  }, [isOpen]);

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

  // ── Search Suggestions ──────────────────────────────────────────────────────
  const searchSuggestions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return { types: [], abilities: [], moves: [], gimmicks: [] as GimmickKey[], categories: [] as CategoryKey[], species: [] };

    const matchingTypes = POKEMON_TYPES.filter((t) => t.toLowerCase().includes(q) && !selectedTypes.includes(t));
    const matchingAbilities = abilitiesFuse.search(searchQuery, { limit: 8 }).map((r) => r.item).filter((a) => !selectedAbilities.includes(a.name));
    const matchingMoves = movesFuse.search(searchQuery, { limit: 8 }).map((r) => r.item).filter((m) => !selectedMoves.includes(m.name));
    const matchingGimmicks = (Object.keys(GIMMICK_DEFS) as GimmickKey[]).filter((g) =>
      g.toLowerCase().includes(q) && !selectedGimmicks.includes(g)
    );
    const matchingCategories = (Object.keys(CATEGORY_DEFS) as CategoryKey[]).filter((c) =>
      c.toLowerCase().includes(q) ||
      CATEGORY_DEFS[c].label.toLowerCase().includes(q) && !selectedCategories.includes(c)
    );
    const matchingSpecies = speciesFuse.search(searchQuery, { limit: 200 }).map((r) => r.item);

    return { types: matchingTypes, abilities: matchingAbilities, moves: matchingMoves, gimmicks: matchingGimmicks, categories: matchingCategories, species: matchingSpecies };
  }, [searchQuery, selectedTypes, selectedAbilities, selectedMoves, selectedGimmicks, selectedCategories, abilitiesFuse, movesFuse, speciesFuse]);

  // ── Filtered Species Table ──────────────────────────────────────────────────
  const finalSpeciesList = useMemo(() => {
    let result = filteredByMovesSpecies ?? [...allSpecies];

    if (searchQuery.trim()) {
      result = speciesFuse.search(searchQuery.trim(), { limit: 400 }).map((r) => r.item);
      if (filteredByMovesSpecies) {
        const allowedIds = new Set(filteredByMovesSpecies.map((s) => s.id));
        result = result.filter((s) => allowedIds.has(s.id));
      }
    }

    if (selectedTypes.length > 0) result = result.filter((s) => selectedTypes.every((t) => s.types.includes(t)));
    if (selectedGen !== 'All') result = result.filter((s) => s.generation === selectedGen);
    if (selectedAbilities.length > 0) result = result.filter((s) => selectedAbilities.every((selAb) => s.abilities.some((a) => a.toLowerCase() === selAb.toLowerCase()) || (s.hiddenAbility && s.hiddenAbility.toLowerCase() === selAb.toLowerCase())));
    if (selectedGimmicks.length > 0) result = result.filter((s) => selectedGimmicks.every((g) => matchesGimmick(s, g)));
    if (selectedCategories.length > 0) result = result.filter((s) => selectedCategories.every((c) => matchesCategory(s, c)));

    for (const [stat, minVal] of Object.entries(statFilters)) {
      if (minVal > 0) {
        if (stat === 'bst') result = result.filter((s) => s.bst >= minVal);
        else result = result.filter((s) => s.baseStats[stat as StatName] >= minVal);
      }
    }

    result.sort((a, b) => {
      if (sortKey === 'name') return sortDir === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
      const aVal = sortKey === 'bst' ? a.bst : sortKey === 'num' ? a.num : a.baseStats[sortKey as StatName];
      const bVal = sortKey === 'bst' ? b.bst : sortKey === 'num' ? b.num : b.baseStats[sortKey as StatName];
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    });

    return result.slice(0, 400);
  }, [allSpecies, filteredByMovesSpecies, searchQuery, speciesFuse, selectedTypes, selectedGen, selectedAbilities, selectedGimmicks, selectedCategories, statFilters, sortKey, sortDir]);

  // ── Filter Helpers ──────────────────────────────────────────────────────────
  const addTypeFilter = (type: PokemonType) => { if (!selectedTypes.includes(type)) setSelectedTypes((p) => [...p, type]); setSearchQuery(''); };
  const removeTypeFilter = (type: PokemonType) => setSelectedTypes((p) => p.filter((t) => t !== type));
  const addAbilityFilter = (name: string) => { if (!selectedAbilities.includes(name)) setSelectedAbilities((p) => [...p, name]); setSearchQuery(''); };
  const removeAbilityFilter = (name: string) => setSelectedAbilities((p) => p.filter((a) => a !== name));
  const addMoveFilter = (name: string) => { if (!selectedMoves.includes(name)) setSelectedMoves((p) => [...p, name]); setSearchQuery(''); };
  const removeMoveFilter = (name: string) => setSelectedMoves((p) => p.filter((m) => m !== name));
  const toggleGimmick = (g: GimmickKey) => { setSelectedGimmicks((p) => p.includes(g) ? p.filter((x) => x !== g) : [...p, g]); setSearchQuery(''); };
  const toggleCategory = (c: CategoryKey) => { setSelectedCategories((p) => p.includes(c) ? p.filter((x) => x !== c) : [...p, c]); setSearchQuery(''); };

  const deleteLastFilter = useCallback(() => {
    if (selectedMoves.length > 0) setSelectedMoves((p) => p.slice(0, -1));
    else if (selectedAbilities.length > 0) setSelectedAbilities((p) => p.slice(0, -1));
    else if (selectedCategories.length > 0) setSelectedCategories((p) => p.slice(0, -1));
    else if (selectedGimmicks.length > 0) setSelectedGimmicks((p) => p.slice(0, -1));
    else if (selectedTypes.length > 0) setSelectedTypes((p) => p.slice(0, -1));
    else if (selectedGen !== 'All') setSelectedGen('All');
  }, [selectedMoves, selectedAbilities, selectedCategories, selectedGimmicks, selectedTypes, selectedGen]);

  const clearAllFilters = () => {
    setSelectedTypes([]); setSelectedAbilities([]); setSelectedMoves([]);
    setSelectedGimmicks([]); setSelectedCategories([]);
    setSelectedGen('All'); setStatFilters({ hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0, bst: 0 }); setSearchQuery('');
  };

  const hasActiveFilters =
    selectedTypes.length > 0 || selectedAbilities.length > 0 || selectedMoves.length > 0 ||
    selectedGimmicks.length > 0 || selectedCategories.length > 0 ||
    selectedGen !== 'All' || Object.values(statFilters).some((v) => v > 0);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[130] bg-black/65 backdrop-blur-sm"
        onClick={() => { onClose(); setColumnPanel('none'); }}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: -16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: -16 }}
        transition={{ duration: 0.18 }}
        className="fixed left-1/2 top-[2%] z-[131] w-[98%] max-w-4xl -translate-x-1/2 rounded-2xl border flex flex-col overflow-hidden"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border-primary)', boxShadow: '0 25px 80px rgba(0,0,0,0.7)', maxHeight: '96vh' }}
      >
        {/* ── Search Bar ── */}
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
            placeholder="Search Pokémon, type, ability, move, or tag (e.g. Water, Swift Swim, Legendary)..."
            className="flex-1 bg-transparent text-sm outline-none text-white placeholder-slate-500"
          />
          <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>{finalSpeciesList.length} results</span>
          <button
            onClick={() => { onClose(); setColumnPanel('none'); }}
            className="text-xs px-2.5 py-1 rounded-lg ml-1 hover:bg-white/10 transition-colors"
            style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
          >ESC</button>
        </div>

        {/* ── Active Filter Tags ── */}
        {hasActiveFilters && (
          <div className="flex items-center gap-1.5 flex-wrap px-4 py-2 border-b flex-shrink-0" style={{ borderColor: 'var(--border-primary)' }}>
            <span className="text-[11px] font-semibold text-slate-400 mr-1">Filters:</span>
            {selectedTypes.map((type) => (
              <span key={type} onClick={() => removeTypeFilter(type)}
                className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md border cursor-pointer hover:opacity-80 transition-all"
                style={{ borderColor: TYPE_COLORS[type]?.bg || 'var(--border-primary)', color: TYPE_COLORS[type]?.text || '#fff', background: (TYPE_COLORS[type]?.bg || 'var(--bg-secondary)') + '33' }}>
                {type} <X className="h-2.5 w-2.5" />
              </span>
            ))}
            {selectedAbilities.map((ab) => (
              <span key={ab} onClick={() => removeAbilityFilter(ab)}
                className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md border cursor-pointer hover:opacity-80 transition-all border-sky-500/40 text-sky-300 bg-sky-500/10">
                {ab} <X className="h-2.5 w-2.5" />
              </span>
            ))}
            {selectedMoves.map((m) => (
              <span key={m} onClick={() => removeMoveFilter(m)}
                className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md border cursor-pointer hover:opacity-80 transition-all border-violet-500/40 text-violet-300 bg-violet-500/10">
                {m} <X className="h-2.5 w-2.5" />
              </span>
            ))}
            {selectedGimmicks.map((g) => {
              const d = GIMMICK_DEFS[g];
              return (
                <span key={g} onClick={() => toggleGimmick(g)}
                  className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md border cursor-pointer hover:opacity-80 transition-all"
                  style={{ borderColor: d.color + '60', color: d.color, background: d.bg }}>
                  {d.label} <X className="h-2.5 w-2.5" />
                </span>
              );
            })}
            {selectedCategories.map((c) => {
              const d = CATEGORY_DEFS[c];
              return (
                <span key={c} onClick={() => toggleCategory(c)}
                  className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md border cursor-pointer hover:opacity-80 transition-all"
                  style={{ borderColor: d.color + '60', color: d.color, background: d.bg }}>
                  {d.label} <X className="h-2.5 w-2.5" />
                </span>
              );
            })}
            {selectedGen !== 'All' && (
              <span onClick={() => setSelectedGen('All')}
                className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md border cursor-pointer hover:opacity-80 transition-all"
                style={{ borderColor: 'var(--border-secondary)', color: 'var(--text-primary)', background: 'var(--bg-secondary)' }}>
                {GENERATIONS.find((g) => g.num === selectedGen)?.name} <X className="h-2.5 w-2.5" />
              </span>
            )}
            {Object.entries(statFilters).filter(([, v]) => v > 0).map(([stat, val]) => (
              <span key={stat} onClick={() => setStatFilters((p) => ({ ...p, [stat]: 0 }))}
                className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md border cursor-pointer hover:opacity-80 transition-all"
                style={{ borderColor: 'var(--border-secondary)', color: STAT_COLORS[stat as StatName] || '#fff', background: 'var(--bg-secondary)' }}>
                {stat.toUpperCase()} ≥{val} <X className="h-2.5 w-2.5" />
              </span>
            ))}
            <span className="text-[10px] text-slate-600 italic ml-1">(backspace = delete filter)</span>
            <button onClick={clearAllFilters} className="text-[10px] px-2 py-0.5 rounded-md border border-rose-500/40 text-rose-400 hover:bg-rose-500/10 transition-colors ml-auto font-semibold">
              Clear All
            </button>
          </div>
        )}

        {/* ── Search Suggestion Popup ── */}
        {searchQuery.trim().length > 0 && (
          <div className="border-b p-3 space-y-3 max-h-[42vh] overflow-y-auto flex-shrink-0"
            style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>

            {/* Type matches */}
            {searchSuggestions.types.length > 0 && (
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 px-2">Type</div>
                <div className="space-y-1">
                  {searchSuggestions.types.map((type) => (
                    <div key={type} className="flex items-center justify-between px-3 py-1.5 rounded-xl hover:bg-white/5 border border-slate-800/60 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-white">{type}</span>
                        <TypeBadge type={type} size="sm" />
                      </div>
                      <button onClick={() => addTypeFilter(type)} className="px-3 py-1 rounded-lg text-[11px] font-bold border border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/20 transition-all italic">Filter</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Ability matches */}
            {searchSuggestions.abilities.length > 0 && (
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 px-2">Abilities</div>
                <div className="space-y-1">
                  {searchSuggestions.abilities.map((ab) => (
                    <div key={ab.id} className="flex items-center justify-between px-3 py-1.5 rounded-xl hover:bg-white/5 border border-slate-800/60 transition-colors">
                      <div className="min-w-0 pr-2">
                        <span className="text-sm font-bold text-white">{ab.name}</span>
                        {ab.shortDesc && <span className="block text-[10px] text-slate-400 truncate max-w-md">{ab.shortDesc}</span>}
                      </div>
                      <button onClick={() => addAbilityFilter(ab.name)} className="px-3 py-1 rounded-lg text-[11px] font-bold border border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/20 transition-all italic flex-shrink-0">Filter</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Move matches */}
            {searchSuggestions.moves.length > 0 && (
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 px-2">Moves</div>
                <div className="space-y-1">
                  {searchSuggestions.moves.map((m) => (
                    <div key={m.id} className="flex items-center justify-between px-3 py-1.5 rounded-xl hover:bg-white/5 border border-slate-800/60 transition-colors">
                      <div className="flex items-center gap-3 min-w-0 pr-2">
                        <span className="text-sm font-bold text-white truncate">{m.name}</span>
                        <TypeBadge type={m.type} size="sm" />
                        <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">{m.category} · BP {m.basePower || '-'}</span>
                      </div>
                      <button onClick={() => addMoveFilter(m.name)} className="px-3 py-1 rounded-lg text-[11px] font-bold border border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/20 transition-all italic flex-shrink-0">Filter</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Gimmick matches */}
            {searchSuggestions.gimmicks.length > 0 && (
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 px-2">Gimmick / Form</div>
                <div className="space-y-1">
                  {searchSuggestions.gimmicks.map((g) => {
                    const d = GIMMICK_DEFS[g];
                    return (
                      <div key={g} className="flex items-center justify-between px-3 py-1.5 rounded-xl hover:bg-white/5 border border-slate-800/60 transition-colors">
                        <span className="text-sm font-bold" style={{ color: d.color }}>{d.label}</span>
                        <button onClick={() => toggleGimmick(g)} className="px-3 py-1 rounded-lg text-[11px] font-bold border border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/20 transition-all italic">Filter</button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Category matches */}
            {searchSuggestions.categories.length > 0 && (
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 px-2">Category</div>
                <div className="space-y-1">
                  {searchSuggestions.categories.map((c) => {
                    const d = CATEGORY_DEFS[c];
                    return (
                      <div key={c} className="flex items-center justify-between px-3 py-1.5 rounded-xl hover:bg-white/5 border border-slate-800/60 transition-colors">
                        <span className="text-sm font-bold" style={{ color: d.color }}>{d.label}</span>
                        <button onClick={() => toggleCategory(c)} className="px-3 py-1 rounded-lg text-[11px] font-bold border border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/20 transition-all italic">Filter</button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Pokémon header divider */}
            {searchSuggestions.species.length > 0 && (
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 pt-1 border-t border-slate-800">Pokémon</div>
            )}
          </div>
        )}

        {/* ── Column Filter Panel ── */}
        <AnimatePresence>
          {columnPanel !== 'none' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="border-b overflow-hidden flex-shrink-0" style={{ borderColor: 'var(--border-primary)' }}
            >
              <div className="p-3" style={{ background: 'var(--bg-secondary)' }}>

                {columnPanel === 'types' && (
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="text-[10px] font-bold uppercase text-slate-500 mr-1">Filter by Type:</span>
                    <button onClick={() => { setSelectedTypes([]); setColumnPanel('none'); }}
                      className="px-2.5 py-1 rounded-lg font-medium text-[10px] border transition-colors"
                      style={{ background: selectedTypes.length === 0 ? 'var(--color-primary)' : 'var(--bg-card)', color: selectedTypes.length === 0 ? '#fff' : 'var(--text-secondary)', borderColor: 'var(--border-primary)' }}>All</button>
                    {POKEMON_TYPES.map((type) => {
                      const colors = TYPE_COLORS[type] ?? TYPE_COLORS['Normal'];
                      const isActive = selectedTypes.includes(type);
                      return (
                        <button key={type} onClick={() => { if (isActive) removeTypeFilter(type); else addTypeFilter(type); }}
                          className="px-2.5 py-1 rounded-lg transition-all font-semibold uppercase tracking-wide text-[10px] border"
                          style={{ background: isActive ? colors.bg : 'var(--bg-card)', color: isActive ? colors.text : 'var(--text-tertiary)', borderColor: isActive ? colors.bg : 'var(--border-primary)', opacity: isActive ? 1 : 0.75 }}>{type}</button>
                      );
                    })}
                  </div>
                )}

                {columnPanel === 'gen' && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-bold uppercase text-slate-500 mr-1">Filter by Gen:</span>
                    <button onClick={() => { setSelectedGen('All'); setColumnPanel('none'); }}
                      className="px-2.5 py-1 rounded-lg font-medium text-[10px] border transition-colors"
                      style={{ background: selectedGen === 'All' ? 'var(--color-primary)' : 'var(--bg-card)', color: selectedGen === 'All' ? '#fff' : 'var(--text-secondary)', borderColor: 'var(--border-primary)' }}>All</button>
                    {GENERATIONS.map((gen) => (
                      <button key={gen.num} onClick={() => { setSelectedGen(selectedGen === gen.num ? 'All' : gen.num); setColumnPanel('none'); }}
                        className="px-2.5 py-1 rounded-lg font-medium text-[10px] border transition-colors"
                        style={{ background: selectedGen === gen.num ? 'var(--color-primary)' : 'var(--bg-card)', color: selectedGen === gen.num ? '#fff' : 'var(--text-secondary)', borderColor: 'var(--border-primary)' }}>
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
                        <button key={ab.id} onClick={() => { if (selectedAbilities.includes(ab.name)) removeAbilityFilter(ab.name); else addAbilityFilter(ab.name); }}
                          className="text-left px-2.5 py-1.5 rounded-lg text-[10px] font-medium border transition-colors truncate"
                          style={{ background: selectedAbilities.includes(ab.name) ? 'var(--color-primary)' : 'var(--bg-card)', color: selectedAbilities.includes(ab.name) ? '#fff' : 'var(--text-secondary)', borderColor: 'var(--border-primary)' }}>
                          {ab.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {columnPanel === 'gimmick' && (
                  <div>
                    <div className="text-[10px] font-bold uppercase text-slate-500 mb-2">Gimmick / Form:</div>
                    <div className="flex flex-wrap gap-2">
                      {(Object.keys(GIMMICK_DEFS) as GimmickKey[]).map((g) => {
                        const d = GIMMICK_DEFS[g];
                        const isActive = selectedGimmicks.includes(g);
                        return (
                          <button key={g} onClick={() => toggleGimmick(g)}
                            className="px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all"
                            style={{ background: isActive ? d.bg : 'var(--bg-card)', color: isActive ? d.color : 'var(--text-secondary)', borderColor: isActive ? d.color + '60' : 'var(--border-primary)', boxShadow: isActive ? `0 0 8px ${d.color}40` : undefined }}>
                            {d.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {columnPanel === 'category' && (
                  <div>
                    <div className="text-[10px] font-bold uppercase text-slate-500 mb-2">Pokémon Category:</div>
                    <div className="flex flex-wrap gap-2">
                      {(Object.keys(CATEGORY_DEFS) as CategoryKey[]).map((c) => {
                        const d = CATEGORY_DEFS[c];
                        const isActive = selectedCategories.includes(c);
                        return (
                          <button key={c} onClick={() => toggleCategory(c)}
                            className="px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all"
                            style={{ background: isActive ? d.bg : 'var(--bg-card)', color: isActive ? d.color : 'var(--text-secondary)', borderColor: isActive ? d.color + '60' : 'var(--border-primary)', boxShadow: isActive ? `0 0 8px ${d.color}40` : undefined }}>
                            {d.label}
                          </button>
                        );
                      })}
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
                            <span className="text-[10px] font-bold uppercase" style={{ color: stat === 'bst' ? '#a78bfa' : STAT_COLORS[stat as StatName] || 'var(--text-secondary)' }}>{stat === 'bst' ? 'BST' : stat.toUpperCase()}</span>
                            <input type="number" min={0} max={stat === 'bst' ? 800 : 255} value={statFilters[stat] || ''}
                              onChange={(e) => setStatFilters((p) => ({ ...p, [stat]: parseInt(e.target.value) || 0 }))}
                              className="w-14 text-right text-[11px] font-mono font-bold rounded border px-1 py-0.5 outline-none"
                              style={{ background: 'var(--bg-card)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }} />
                          </div>
                          <input type="range" min={0} max={stat === 'bst' ? 800 : 255} value={statFilters[stat] || 0}
                            onChange={(e) => setStatFilters((p) => ({ ...p, [stat]: parseInt(e.target.value) }))}
                            className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                            style={{ accentColor: stat === 'bst' ? '#a78bfa' : STAT_COLORS[stat as StatName] || 'var(--color-primary)' }} />
                        </div>
                      ))}
                    </div>
                    <button onClick={() => setStatFilters({ hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0, bst: 0 })} className="mt-2 text-[10px] px-2 py-0.5 rounded border border-rose-500/40 text-rose-400 hover:bg-rose-500/10 transition-colors">Reset Stats</button>
                  </div>
                )}

              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Filter Quick-Access Button Row ── */}
        <div className="flex items-center gap-1.5 px-4 py-2 border-b flex-shrink-0 flex-wrap" style={{ borderColor: 'var(--border-primary)', background: 'var(--bg-secondary)' }}>
          {([
            { key: 'gen',      label: 'Generation',     active: selectedGen !== 'All',           color: '#6366f1' },
            { key: 'types',    label: 'Type',            active: selectedTypes.length > 0,        color: '#06b6d4' },
            { key: 'abilities',label: 'Ability',         active: selectedAbilities.length > 0,    color: '#38bdf8' },
            { key: 'gimmick',  label: 'Gimmick / Form',  active: selectedGimmicks.length > 0,     color: '#f472b6' },
            { key: 'category', label: 'Category',        active: selectedCategories.length > 0,   color: '#facc15' },
            { key: 'stats',    label: 'Stats',            active: Object.values(statFilters).some(v => v > 0), color: '#4ade80' },
          ] as const).map(({ key, label, active, color }) => (
            <button key={key}
              onClick={() => setColumnPanel(columnPanel === key ? 'none' : key as typeof columnPanel)}
              className="px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all"
              style={{
                borderColor: active || columnPanel === key ? color + '80' : 'var(--border-primary)',
                color: active || columnPanel === key ? color : 'var(--text-tertiary)',
                background: active || columnPanel === key ? color + '15' : 'transparent',
              }}>
              {label} {active ? '●' : ''}
            </button>
          ))}

          {/* Sort / Table Headers inline */}
          <div className="ml-auto flex items-center gap-1">
            {(['hp', 'atk', 'def', 'spa', 'spd', 'spe', 'bst'] as const).map((stat) => (
              <button key={stat}
                onClick={() => { const d = sortKey === stat ? (sortDir === 'asc' ? 'desc' : 'asc') : 'desc'; setSortKey(stat); setSortDir(d); setColumnPanel('none'); }}
                className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase transition-colors"
                style={{ color: sortKey === stat ? (stat === 'bst' ? '#a78bfa' : STAT_COLORS[stat as StatName]) : 'var(--text-muted)', background: sortKey === stat ? 'var(--bg-tertiary)' : 'transparent' }}>
                {stat === 'spa' ? 'SpA' : stat === 'spd' ? 'SpD' : stat === 'spe' ? 'Spe' : stat.toUpperCase()}
                {sortKey === stat ? (sortDir === 'asc' ? '↑' : '↓') : ''}
              </button>
            ))}
          </div>
        </div>

        {/* ── Table Column Headers ── */}
        <div
          className="grid items-center text-[10px] font-bold uppercase tracking-wider border-b px-4 py-2 flex-shrink-0"
          style={{
            gridTemplateColumns: '2.5rem 2.5rem 1fr 1fr 1fr 2.2rem 2.2rem 2.2rem 2.2rem 2.2rem 2.2rem 2.8rem',
            borderColor: 'var(--border-primary)',
            background: 'var(--bg-card)',
            color: 'var(--text-tertiary)',
          }}
        >
          <span />
          <button onClick={() => { const d = sortKey === 'num' ? (sortDir === 'asc' ? 'desc' : 'asc') : 'asc'; setSortKey('num'); setSortDir(d); setColumnPanel(columnPanel === 'gen' ? 'none' : 'gen'); }}
            className={`text-left hover:text-white transition-colors ${columnPanel === 'gen' || sortKey === 'num' ? 'text-white' : ''}`}>#</button>
          <button onClick={() => { const d = sortKey === 'name' ? (sortDir === 'asc' ? 'desc' : 'asc') : 'asc'; setSortKey('name'); setSortDir(d); setColumnPanel('none'); }}
            className={`text-left hover:text-white transition-colors ${sortKey === 'name' ? 'text-white' : ''}`}>
            Name {sortKey === 'name' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
          </button>
          <button onClick={() => setColumnPanel(columnPanel === 'types' ? 'none' : 'types')}
            className={`text-left hover:text-white transition-colors ${columnPanel === 'types' || selectedTypes.length > 0 ? 'text-indigo-400' : ''}`}>
            Types {selectedTypes.length > 0 ? `(${selectedTypes.length})` : ''}
          </button>
          <button onClick={() => setColumnPanel(columnPanel === 'abilities' ? 'none' : 'abilities')}
            className={`text-left hover:text-white transition-colors ${columnPanel === 'abilities' || selectedAbilities.length > 0 ? 'text-indigo-400' : ''}`}>
            Abilities {selectedAbilities.length > 0 ? `(${selectedAbilities.length})` : ''}
          </button>
          {(['hp', 'atk', 'def', 'spa', 'spd', 'spe'] as const).map((stat) => (
            <button key={stat}
              onClick={() => { const d = sortKey === stat ? (sortDir === 'asc' ? 'desc' : 'asc') : 'desc'; setSortKey(stat); setSortDir(d); setColumnPanel(columnPanel === 'stats' ? 'none' : 'stats'); }}
              className={`text-center hover:text-white transition-colors ${sortKey === stat ? 'text-white' : ''}`}
              style={{ color: statFilters[stat] > 0 ? STAT_COLORS[stat] : undefined }}>
              {stat === 'spa' ? 'SpA' : stat === 'spd' ? 'SpD' : stat === 'spe' ? 'Spe' : stat.toUpperCase()}
              {sortKey === stat ? (sortDir === 'asc' ? '↑' : '↓') : ''}
            </button>
          ))}
          <button onClick={() => { const d = sortKey === 'bst' ? (sortDir === 'asc' ? 'desc' : 'asc') : 'desc'; setSortKey('bst'); setSortDir(d); setColumnPanel(columnPanel === 'stats' ? 'none' : 'stats'); }}
            className={`text-center hover:text-white transition-colors ${sortKey === 'bst' ? 'text-violet-400' : ''}`}>
            BST {sortKey === 'bst' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
          </button>
        </div>

        {/* ── Scrollable Species Rows ── */}
        <div className="overflow-y-auto flex-1">
          {finalSpeciesList.length === 0 ? (
            <div className="text-center py-12 text-sm" style={{ color: 'var(--text-tertiary)' }}>No Pokémon match your filters.</div>
          ) : (
            finalSpeciesList.map((species) => {
              const isSelected = currentSpecies === species.name;
              return (
                <button
                  key={species.name}
                  onClick={() => { onSelectPokemon(species.name); onClose(); setColumnPanel('none'); }}
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
                  <span className="text-[10px] font-mono" style={{ color: 'var(--text-tertiary)' }}>#{String(species.num).padStart(3, '0')}</span>
                  <div className="min-w-0 pr-2">
                    <span className={`text-sm font-semibold truncate block ${isSelected ? 'text-indigo-300' : 'text-white'}`}>{species.name}</span>
                    {/* Gimmick/category mini-tags on the row */}
                    <div className="flex gap-1 mt-0.5 flex-wrap">
                      {species.isMega && <span className="text-[8px] font-bold px-1 rounded" style={{ background: GIMMICK_DEFS['Mega'].bg, color: GIMMICK_DEFS['Mega'].color }}>MEGA</span>}
                      {species.isGmax && <span className="text-[8px] font-bold px-1 rounded" style={{ background: GIMMICK_DEFS['G-Max'].bg, color: GIMMICK_DEFS['G-Max'].color }}>GMAX</span>}
                      {species.isPrimal && <span className="text-[8px] font-bold px-1 rounded" style={{ background: GIMMICK_DEFS['Primal'].bg, color: GIMMICK_DEFS['Primal'].color }}>PRIMAL</span>}
                      {species.isAlolan && <span className="text-[8px] font-bold px-1 rounded" style={{ background: GIMMICK_DEFS['Alolan'].bg, color: GIMMICK_DEFS['Alolan'].color }}>ALOLA</span>}
                      {species.isGalarian && <span className="text-[8px] font-bold px-1 rounded" style={{ background: GIMMICK_DEFS['Galarian'].bg, color: GIMMICK_DEFS['Galarian'].color }}>GALAR</span>}
                      {species.isHisuian && <span className="text-[8px] font-bold px-1 rounded" style={{ background: GIMMICK_DEFS['Hisuian'].bg, color: GIMMICK_DEFS['Hisuian'].color }}>HISUI</span>}
                      {species.isPaldean && <span className="text-[8px] font-bold px-1 rounded" style={{ background: GIMMICK_DEFS['Paldean'].bg, color: GIMMICK_DEFS['Paldean'].color }}>PALDEA</span>}
                      {species.tags.map((tag) => {
                        const d = CATEGORY_DEFS[tag as CategoryKey];
                        if (!d) return null;
                        const short = tag === 'Restricted Legendary' ? 'LEGEND' : tag === 'Sub-Legendary' ? 'SUB-LEG' : tag === 'Pseudo-Legendary' ? 'PSEUDO' : tag === 'Ultra Beast' ? 'UB' : tag.toUpperCase().slice(0, 7);
                        return <span key={tag} className="text-[8px] font-bold px-1 rounded" style={{ background: d.bg, color: d.color }}>{short}</span>;
                      })}
                      {species.isPseudoLegendary && <span className="text-[8px] font-bold px-1 rounded" style={{ background: CATEGORY_DEFS['Pseudo-Legendary'].bg, color: CATEGORY_DEFS['Pseudo-Legendary'].color }}>PSEUDO</span>}
                    </div>
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    {species.types.map((t) => (<TypeBadge key={t} type={t as PokemonType} size="sm" />))}
                  </div>
                  <div className="text-[10px] leading-tight pr-2" style={{ color: 'var(--text-secondary)' }}>
                    {species.abilities.slice(0, 2).join(' / ')}
                    {species.hiddenAbility && <span className="block opacity-60 italic">{species.hiddenAbility}</span>}
                  </div>
                  {(['hp', 'atk', 'def', 'spa', 'spd', 'spe'] as const).map((stat) => (
                    <span key={stat} className="text-center text-[11px] font-mono font-bold"
                      style={{ color: statFilters[stat] > 0 && species.baseStats[stat as StatName] >= statFilters[stat] ? STAT_COLORS[stat as StatName] : 'var(--text-secondary)' }}>
                      {species.baseStats[stat as StatName]}
                    </span>
                  ))}
                  <span className="text-center text-[11px] font-mono font-bold"
                    style={{ color: statFilters['bst'] > 0 && species.bst >= statFilters['bst'] ? '#a78bfa' : 'var(--text-tertiary)' }}>
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
