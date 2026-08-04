'use client';

import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Swords, Calculator, FolderOpen } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useUIStore } from '@/stores/ui-store';
import { getAllSpecies } from '@/lib/pokemon/data-provider';
import { createFuzzySearch, type SearchableItem } from '@/lib/search/fuzzy-search';
import { PokemonSprite } from './PokemonSprite';
import { TypeBadge } from './TypeBadge';
import type { PokemonType } from '@/types/pokemon';
import Fuse from 'fuse.js';

interface SearchResult extends SearchableItem {
  name: string;
  num: number;
  types: PokemonType[];
  category: 'pokemon' | 'page';
  href?: string;
}

const PAGES: SearchResult[] = [
  { id: 'team-builder', name: 'Team Builder', num: 0, types: [], category: 'page', href: '/team-builder' },
  { id: 'calculator', name: 'Damage Calculator', num: 0, types: [], category: 'page', href: '/calculator' },
  { id: 'teams', name: 'My Teams', num: 0, types: [], category: 'page', href: '/teams' },
];

export function SearchModal() {
  const { searchOpen, setSearchOpen } = useUIStore();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const searchData = useMemo(() => {
    const species = getAllSpecies(9);
    const pokemonItems: SearchResult[] = species.slice(0, 500).map((s) => ({
      id: s.id,
      name: s.name,
      num: s.num,
      types: s.types,
      category: 'pokemon' as const,
    }));
    return [...PAGES, ...pokemonItems];
  }, []);

  const fuse = useMemo(
    () =>
      new Fuse(searchData, {
        keys: ['name'],
        threshold: 0.3,
        distance: 100,
        includeScore: true,
      }),
    [searchData]
  );

  const results = useMemo(() => {
    if (!query.trim()) return PAGES;
    return fuse.search(query, { limit: 20 }).map((r) => r.item);
  }, [query, fuse]);

  useEffect(() => {
    if (searchOpen) {
      setQuery('');
      setSelectedIndex(0);
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
            className="fixed left-1/2 top-[15%] z-[101] w-[95%] max-w-xl -translate-x-1/2 overflow-hidden rounded-2xl border"
            style={{
              background: 'var(--bg-card)',
              borderColor: 'var(--border-primary)',
              boxShadow: 'var(--shadow-xl)',
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
                placeholder="Search Pokémon, moves, pages..."
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

            {/* Results */}
            <div className="max-h-[400px] overflow-y-auto p-2">
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
