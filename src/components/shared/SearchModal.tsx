'use client';

import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Swords, Calculator, FolderOpen } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useUIStore } from '@/stores/ui-store';
import { getAllSpecies, GENERATIONS } from '@/lib/pokemon/data-provider';
import { createFuzzySearch, type SearchableItem } from '@/lib/search/fuzzy-search';
import { PokemonSprite } from './PokemonSprite';
import { TypeBadge } from './TypeBadge';
import { TYPE_COLORS } from '@/lib/pokemon/sprites';
import type { PokemonType } from '@/types/pokemon';
import Fuse from 'fuse.js';

interface SearchResult extends SearchableItem {
  name: string;
  num: number;
  types: PokemonType[];
  category: 'pokemon' | 'page';
  href?: string;
  generation?: number;
}

const PAGES: SearchResult[] = [
  { id: 'team-builder', name: 'Team Builder', num: 0, types: [], category: 'page', href: '/team-builder' },
  { id: 'calculator', name: 'Damage Calculator', num: 0, types: [], category: 'page', href: '/calculator' },
  { id: 'teams', name: 'My Teams', num: 0, types: [], category: 'page', href: '/teams' },
];

const POKEMON_TYPES: PokemonType[] = [
  'Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice',
  'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic', 'Bug',
  'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy',
];

export function SearchModal() {
  const { searchOpen, setSearchOpen } = useUIStore();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [typeFilter, setTypeFilter] = useState<PokemonType | 'All'>('All');
  const [genFilter, setGenFilter] = useState<number | 'All'>('All');
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const allPokemonData = useMemo(() => {
    const species = getAllSpecies(9);
    return species.map((s) => ({
      id: s.id,
      name: s.name,
      num: s.num,
      types: s.types,
      category: 'pokemon' as const,
      generation: s.generation,
    }));
  }, []);

  const fuse = useMemo(
    () =>
      new Fuse(allPokemonData, {
        keys: ['name'],
        threshold: 0.3,
        distance: 100,
        includeScore: true,
      }),
    [allPokemonData]
  );

  const results = useMemo(() => {
    // If no query and no filters, show pages only
    if (!query.trim() && typeFilter === 'All' && genFilter === 'All') {
      return PAGES;
    }

    let pokemonResults: SearchResult[];

    if (query.trim()) {
      pokemonResults = fuse.search(query, { limit: 100 }).map((r) => r.item);
    } else {
      pokemonResults = allPokemonData;
    }

    // Apply type filter
    if (typeFilter !== 'All') {
      pokemonResults = pokemonResults.filter((p) => p.types.includes(typeFilter));
    }

    // Apply generation filter
    if (genFilter !== 'All') {
      pokemonResults = pokemonResults.filter((p) => p.generation === genFilter);
    }

    const combined: SearchResult[] = [];

    // Only show pages when searching with a query (not purely filtering)
    if (query.trim()) {
      const pageMatches = PAGES.filter((p) =>
        p.name.toLowerCase().includes(query.toLowerCase())
      );
      combined.push(...pageMatches);
    }

    combined.push(...pokemonResults.slice(0, 60));
    return combined;
  }, [query, fuse, allPokemonData, typeFilter, genFilter]);

  useEffect(() => {
    if (searchOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTypeFilter('All');
      setGenFilter('All');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [searchOpen]);

  const handleSelect = useCallback(
    (item: SearchResult) => {
      setSearchOpen(false);
      if (item.href) {
        router.push(item.href);
      } else if (item.category === 'pokemon') {
        router.push(`/team-builder?pokemon=${item.name}`);
      }
    },
    [router, setSearchOpen]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((i) => Math.max(i - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (results[selectedIndex]) handleSelect(results[selectedIndex]);
          break;
        case 'Escape':
          setSearchOpen(false);
          break;
      }
    },
    [results, selectedIndex, handleSelect, setSearchOpen]
  );

  const hasActiveFilters = typeFilter !== 'All' || genFilter !== 'All';

  return (
    <AnimatePresence>
      {searchOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
            onClick={() => setSearchOpen(false)}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed left-1/2 top-[8%] z-[101] w-[95%] max-w-2xl -translate-x-1/2 overflow-hidden rounded-2xl border flex flex-col"
            style={{
              background: 'var(--bg-card)',
              borderColor: 'var(--border-primary)',
              boxShadow: 'var(--shadow-xl)',
              maxHeight: '82vh',
            }}
          >
            {/* Search input */}
            <div
              className="flex items-center gap-3 border-b px-4 py-3"
              style={{ borderColor: 'var(--border-primary)' }}
            >
              <Search
                className="h-5 w-5 flex-shrink-0"
                style={{ color: 'var(--text-tertiary)' }}
              />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Search Pokémon or form (e.g. Steelix, Steelix-Mega, Charizard-Gmax)..."
                className="flex-1 bg-transparent text-sm outline-none"
                style={{ color: 'var(--text-primary)' }}
                aria-label="Search"
              />
              <button
                onClick={() => setSearchOpen(false)}
                className="rounded-lg p-1 transition-colors hover:opacity-70"
                aria-label="Close search"
              >
                <kbd
                  className="rounded border px-1.5 py-0.5 text-xs"
                  style={{
                    borderColor: 'var(--border-secondary)',
                    color: 'var(--text-tertiary)',
                  }}
                >
                  ESC
                </kbd>
              </button>
            </div>

            {/* Filters */}
            <div className="px-4 py-3 space-y-2 border-b" style={{ borderColor: 'var(--border-primary)' }}>
              {/* Generation filter */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-bold uppercase text-slate-500">Gen:</span>
                <button
                  onClick={() => setGenFilter('All')}
                  className="px-2 py-0.5 rounded-md text-[10px] font-medium transition-colors border"
                  style={{
                    background: genFilter === 'All' ? 'var(--color-primary)' : 'var(--bg-secondary)',
                    color: genFilter === 'All' ? '#fff' : 'var(--text-secondary)',
                    borderColor: genFilter === 'All' ? 'transparent' : 'var(--border-primary)',
                  }}
                >
                  All
                </button>
                {GENERATIONS.map((gen) => (
                  <button
                    key={gen.num}
                    onClick={() => {
                      setGenFilter(genFilter === gen.num ? 'All' : gen.num);
                      setSelectedIndex(0);
                    }}
                    className="px-2 py-0.5 rounded-md text-[10px] font-medium transition-all border"
                    style={{
                      background: genFilter === gen.num ? 'var(--color-primary)' : 'var(--bg-secondary)',
                      color: genFilter === gen.num ? '#fff' : 'var(--text-secondary)',
                      borderColor: genFilter === gen.num ? 'transparent' : 'var(--border-primary)',
                    }}
                  >
                    {gen.name}
                    <span className="ml-1 opacity-60 hidden sm:inline">({gen.region})</span>
                  </button>
                ))}
                {hasActiveFilters && (
                  <button
                    onClick={() => { setTypeFilter('All'); setGenFilter('All'); }}
                    className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md border border-rose-500/40 text-rose-400 hover:bg-rose-500/10 transition-colors ml-1"
                  >
                    <X className="h-2.5 w-2.5" />
                    Clear
                  </button>
                )}
              </div>

              {/* Type filter */}
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-[10px] font-bold uppercase text-slate-500">Type:</span>
                <button
                  onClick={() => setTypeFilter('All')}
                  className="px-2 py-0.5 rounded-md text-[10px] font-medium transition-colors border"
                  style={{
                    background: typeFilter === 'All' ? 'var(--color-primary)' : 'var(--bg-secondary)',
                    color: typeFilter === 'All' ? '#fff' : 'var(--text-secondary)',
                    borderColor: typeFilter === 'All' ? 'transparent' : 'var(--border-primary)',
                  }}
                >
                  All
                </button>
                {POKEMON_TYPES.map((type) => {
                  const colors = TYPE_COLORS[type] ?? TYPE_COLORS['Normal'];
                  const isActive = typeFilter === type;
                  return (
                    <button
                      key={type}
                      onClick={() => {
                        setTypeFilter(typeFilter === type ? 'All' : type);
                        setSelectedIndex(0);
                      }}
                      className="px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide transition-all border"
                      style={{
                        background: isActive ? colors.bg : 'var(--bg-secondary)',
                        color: isActive ? colors.text : 'var(--text-tertiary)',
                        borderColor: isActive ? colors.bg : 'var(--border-primary)',
                        opacity: isActive ? 1 : 0.65,
                      }}
                    >
                      {type}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Results */}
            <div className="overflow-y-auto p-2">
              {results.length === 0 ? (
                <div
                  className="px-4 py-8 text-center text-sm"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  No results found
                </div>
              ) : (
                results.map((item, index) => (
                  <button
                    key={item.id}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors"
                    style={{
                      background:
                        index === selectedIndex
                          ? 'var(--bg-secondary)'
                          : 'transparent',
                      color: 'var(--text-primary)',
                    }}
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    {item.category === 'pokemon' ? (
                      <>
                        <PokemonSprite
                          name={item.name}
                          dexNum={item.num}
                          size={36}
                          animated={false}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">
                            {item.name}
                          </div>
                          <div className="flex gap-1 mt-0.5">
                            {item.types.map((t) => (
                              <TypeBadge key={t} type={t} size="sm" />
                            ))}
                          </div>
                        </div>
                        <span
                          className="text-xs font-mono"
                          style={{ color: 'var(--text-tertiary)' }}
                        >
                          #{String(item.num).padStart(4, '0')}
                        </span>
                      </>
                    ) : (
                      <>
                        <div
                          className="flex h-9 w-9 items-center justify-center rounded-lg"
                          style={{ background: 'var(--bg-tertiary)' }}
                        >
                          {item.href === '/team-builder' && (
                            <Swords className="h-4 w-4" style={{ color: 'var(--text-secondary)' }} />
                          )}
                          {item.href === '/calculator' && (
                            <Calculator className="h-4 w-4" style={{ color: 'var(--text-secondary)' }} />
                          )}
                          {item.href === '/teams' && (
                            <FolderOpen className="h-4 w-4" style={{ color: 'var(--text-secondary)' }} />
                          )}
                        </div>
                        <span className="text-sm font-medium">{item.name}</span>
                        <span
                          className="ml-auto text-xs"
                          style={{ color: 'var(--text-tertiary)' }}
                        >
                          Page
                        </span>
                      </>
                    )}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
