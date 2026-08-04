'use client';

import { motion } from 'framer-motion';
import { Plus, Swords, FileText, Trash2, ArrowLeft } from 'lucide-react';
import { useTeamStore } from '@/stores/team-store';
import { PokemonSprite } from '@/components/shared/PokemonSprite';
import { TypeBadge } from '@/components/shared/TypeBadge';
import { useState, useMemo, useCallback } from 'react';
import { getAllSpecies, getSpecies } from '@/lib/pokemon/data-provider';
import type { PokemonType, TeamPokemon } from '@/types/pokemon';
import { createEmptyPokemon } from '@/types/pokemon';
import { PokemonEditorFull } from '@/components/team/PokemonEditorFull';
import { ShowdownPasteModal } from '@/components/team/ShowdownPasteModal';
import Fuse from 'fuse.js';

export default function TeamBuilderPage() {
  const {
    teams,
    activeTeamId,
    selectedSlot,
    createTeam,
    setActiveTeam,
    setSelectedSlot,
    addPokemon,
    removePokemon,
    updatePokemon,
    importTeam,
  } = useTeamStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showTeamShowdownModal, setShowTeamShowdownModal] = useState(false);

  const activeTeam = useMemo(
    () => teams.find((t) => t.id === activeTeamId) ?? null,
    [teams, activeTeamId]
  );

  // Initialize team if none exists
  const ensureTeam = useCallback(() => {
    if (!activeTeamId || !activeTeam) {
      const id = createTeam();
      setActiveTeam(id);
      return id;
    }
    return activeTeamId;
  }, [activeTeamId, activeTeam, createTeam, setActiveTeam]);

  // Pokémon species search
  const allSpecies = useMemo(() => getAllSpecies(9), []);
  const fuse = useMemo(
    () =>
      new Fuse(allSpecies, {
        keys: ['name', 'baseSpecies', 'types'],
        threshold: 0.3,
        distance: 100,
      }),
    [allSpecies]
  );

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return allSpecies.slice(0, 100);
    return fuse.search(searchQuery, { limit: 100 }).map((r) => r.item);
  }, [searchQuery, fuse, allSpecies]);

  const handleAddPokemon = useCallback(
    (speciesName: string) => {
      const teamId = ensureTeam();
      const team = useTeamStore.getState().teams.find((t) => t.id === teamId);
      if (!team || team.pokemon.length >= 6) return;

      const newPokemon = createEmptyPokemon();
      newPokemon.species = speciesName;
      addPokemon(teamId, newPokemon);
      setShowSearch(false);
      setSearchQuery('');
    },
    [ensureTeam, addPokemon]
  );

  const handleSlotClick = (index: number) => {
    if (activeTeam && index < activeTeam.pokemon.length) {
      setSelectedSlot(selectedSlot === index ? null : index);
    } else {
      setShowSearch(true);
    }
  };

  const selectedPokemon =
    activeTeam && selectedSlot !== null
      ? activeTeam.pokemon[selectedSlot]
      : null;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg">
            <Swords className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={activeTeam?.name || 'Untitled Team'}
                onChange={(e) => {
                  if (activeTeamId) {
                    useTeamStore.getState().renameTeam(activeTeamId, e.target.value);
                  }
                }}
                className="text-xl font-bold bg-transparent outline-none border-b border-transparent hover:border-slate-500 focus:border-indigo-500 transition-colors"
                style={{ color: 'var(--text-primary)' }}
              />
            </div>
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              Gen 9 • {activeTeam?.pokemon.length || 0}/6 Pokémon
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTeamShowdownModal(true)}
            className="inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-colors"
            style={{
              borderColor: 'var(--border-secondary)',
              color: 'var(--text-primary)',
            }}
          >
            <FileText className="h-4 w-4 text-indigo-500" />
            Import / Export Team Paste
          </button>
          <button
            onClick={() => setShowSearch(true)}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-600 shadow-md transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            Add Pokémon
          </button>
        </div>
      </motion.div>

      {/* 6 Pokémon Cards Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4"
      >
        {Array.from({ length: 6 }).map((_, index) => {
          const pokemon = activeTeam?.pokemon[index] ?? null;
          const isSelected = selectedSlot === index;
          const speciesData = pokemon?.species ? getSpecies(pokemon.species) : null;

          return (
            <motion.div
              key={index}
              onClick={() => handleSlotClick(index)}
              className="card card-interactive p-4 flex flex-col items-center justify-between min-h-[220px] relative text-center cursor-pointer"
              style={{
                borderColor: isSelected ? 'var(--border-focus)' : undefined,
                boxShadow: isSelected ? 'var(--shadow-glow)' : undefined,
              }}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              {pokemon?.species ? (
                <>
                  <div className="relative">
                    <PokemonSprite
                      name={pokemon.species}
                      dexNum={speciesData?.num || 0}
                      size={72}
                      shiny={pokemon.isShiny}
                      animated
                    />
                  </div>

                  <div className="space-y-1 w-full">
                    <span className="text-sm font-bold truncate block" style={{ color: 'var(--text-primary)' }}>
                      {pokemon.nickname || pokemon.species}
                    </span>

                    <div className="flex gap-1 justify-center flex-wrap">
                      {speciesData?.types.map((t) => (
                        <TypeBadge key={t} type={t as PokemonType} size="sm" />
                      ))}
                    </div>

                    <div className="text-[11px] font-mono" style={{ color: 'var(--text-tertiary)' }}>
                      {pokemon.item || 'No Item'}
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-400 font-mono mt-1">
                    Lv. {pokemon.level}
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (activeTeamId) removePokemon(activeTeamId, index);
                    }}
                    className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs transition-colors hover:bg-red-500 hover:text-white"
                    style={{
                      background: 'var(--bg-tertiary)',
                      color: 'var(--text-secondary)',
                    }}
                    aria-label="Remove Pokémon"
                  >
                    ×
                  </button>
                </>
              ) : (
                <div className="my-auto flex flex-col items-center gap-2">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center border-2 border-dashed"
                    style={{
                      borderColor: 'var(--border-secondary)',
                      color: 'var(--text-tertiary)',
                    }}
                  >
                    <Plus className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-semibold" style={{ color: 'var(--text-tertiary)' }}>
                    Slot {index + 1}
                  </span>
                </div>
              )}
            </motion.div>
          );
        })}
      </motion.div>

      {/* Pokémon Editor (Shown when slot selected) */}
      {selectedPokemon && activeTeamId && selectedSlot !== null && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <PokemonEditorFull
            pokemon={selectedPokemon}
            onUpdate={(updates) => updatePokemon(activeTeamId, selectedSlot, updates)}
            onDelete={() => removePokemon(activeTeamId, selectedSlot)}
          />
        </motion.div>
      )}

      {/* Add Pokémon Search Modal */}
      {showSearch && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] p-4"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => {
              setShowSearch(false);
              setSearchQuery('');
            }}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative z-10 w-full max-w-3xl rounded-2xl border overflow-hidden shadow-2xl flex flex-col max-h-[80vh]"
            style={{
              background: 'var(--bg-card)',
              borderColor: 'var(--border-primary)',
            }}
          >
            {/* Search Input */}
            <div className="flex items-center gap-3 border-b px-4 py-3" style={{ borderColor: 'var(--border-primary)' }}>
              <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Pokémon or form (e.g. Steelix, Steelix-Mega, Charizard-Gmax)..."
                className="flex-1 bg-transparent text-sm outline-none"
                style={{ color: 'var(--text-primary)' }}
              />
              <button
                onClick={() => {
                  setShowSearch(false);
                  setSearchQuery('');
                }}
                className="rounded-lg px-2.5 py-1 text-xs font-medium"
                style={{
                  background: 'var(--bg-tertiary)',
                  color: 'var(--text-secondary)',
                }}
              >
                ESC
              </button>
            </div>

            {/* Species & Forms Grid */}
            <div className="overflow-y-auto p-3 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {searchResults.map((species) => (
                  <button
                    key={species.name}
                    onClick={() => handleAddPokemon(species.name)}
                    className="flex items-center gap-3 rounded-xl p-3 text-left transition-all card card-interactive"
                  >
                    <PokemonSprite
                      name={species.name}
                      dexNum={species.num}
                      size={44}
                      animated={false}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                        {species.name}
                      </div>
                      <div className="flex gap-1 mt-1">
                        {species.types.map((t) => (
                          <TypeBadge key={t} type={t} size="sm" />
                        ))}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-1">
                        BST: {species.bst}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Team Showdown Import/Export Modal */}
      {showTeamShowdownModal && activeTeam && (
        <ShowdownPasteModal
          isOpen={showTeamShowdownModal}
          onClose={() => setShowTeamShowdownModal(false)}
          mode="team"
          currentTeam={activeTeam.pokemon}
          onImportTeam={(importedPokemonList) => {
            if (activeTeamId) {
              importedPokemonList.forEach((p, i) => {
                if (i < 6) {
                  useTeamStore.getState().setPokemonSpecies(activeTeamId, i, p.species);
                  useTeamStore.getState().updatePokemon(activeTeamId, i, p);
                }
              });
            }
          }}
        />
      )}
    </div>
  );
}
