'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Swords,
  FileText,
  Trash2,
  ArrowLeft,
  Search,
  Copy,
  Edit3,
  Star,
  FolderOpen,
} from 'lucide-react';
import { useTeamStore } from '@/stores/team-store';
import { PokemonSprite } from '@/components/shared/PokemonSprite';
import { TypeBadge } from '@/components/shared/TypeBadge';
import { getSpecies } from '@/lib/pokemon/data-provider';
import type { PokemonType } from '@/types/pokemon';
import { createEmptyPokemon } from '@/types/pokemon';
import { PokemonEditorFull } from '@/components/team/PokemonEditorFull';
import { PokemonPickerModal } from '@/components/team/PokemonPickerModal';
import { ShowdownPasteModal } from '@/components/team/ShowdownPasteModal';

export default function TeamBuilderPage() {
  const {
    teams,
    activeTeamId,
    selectedSlot,
    createTeam,
    setActiveTeam,
    setSelectedSlot,
    deleteTeam,
    duplicateTeam,
    renameTeam,
    toggleFavorite,
    addPokemon,
    removePokemon,
    updatePokemon,
  } = useTeamStore();

  // View state: 'list' (all teams list like Showdown) vs 'editor' (single team detail/editor)
  const [view, setView] = useState<'list' | 'editor'>('list');

  // Filter state for teams list
  const [folderFilter, setFolderFilter] = useState<'all' | 'gen9' | 'favorites'>('all');
  const [teamSearchQuery, setTeamSearchQuery] = useState('');

  // Pokémon species search modal state inside editor
  const [showSearch, setShowSearch] = useState(false);
  const [showTeamShowdownModal, setShowTeamShowdownModal] = useState(false);
  const [showImportModalInList, setShowImportModalInList] = useState(false);

  const activeTeam = useMemo(
    () => teams.find((t) => t.id === activeTeamId) ?? null,
    [teams, activeTeamId]
  );

  // Filtered Teams List for Showdown-style list view
  const filteredTeams = useMemo(() => {
    let list = teams.filter((t) => !t.isArchived);

    if (folderFilter === 'favorites') {
      list = list.filter((t) => t.isFavorite);
    } else if (folderFilter === 'gen9') {
      list = list.filter((t) => t.generation === 9);
    }

    if (teamSearchQuery.trim()) {
      const q = teamSearchQuery.toLowerCase();
      list = list.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.pokemon.some((p) => p.species && p.species.toLowerCase().includes(q))
      );
    }

    return list.sort((a, b) => b.updatedAt - a.updatedAt);
  }, [teams, folderFilter, teamSearchQuery]);

  // Handle New Team creation
  const handleNewTeam = () => {
    const id = createTeam();
    setActiveTeam(id);
    setSelectedSlot(null);
    setView('editor');
  };

  // Open existing team for editing
  const handleOpenTeam = (id: string) => {
    setActiveTeam(id);
    setSelectedSlot(null);
    setView('editor');
  };

  const handleAddPokemon = useCallback(
    (speciesName: string) => {
      if (!activeTeamId) return;
      const team = useTeamStore.getState().teams.find((t) => t.id === activeTeamId);
      if (!team || team.pokemon.length >= 6) return;

      const newPokemon = createEmptyPokemon();
      newPokemon.species = speciesName;
      addPokemon(activeTeamId, newPokemon);
      setShowSearch(false);
    },
    [activeTeamId, addPokemon]
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
    <div className="max-w-7xl mx-auto space-y-6 select-none">
      {/* VIEW 1: SHOWDOWN-STYLE TEAMS LIST VIEW */}
      {view === 'list' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-6"
        >
          {/* Left Folder Sidebar */}
          <div className="lg:col-span-3 card p-4 space-y-4 bg-slate-900 border-slate-800">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b pb-2 border-slate-800">
              Folders & Formats
            </div>

            <div className="space-y-1 text-xs">
              <button
                onClick={() => setFolderFilter('all')}
                className={`w-full text-left px-3 py-2 rounded-xl font-semibold flex items-center justify-between transition-colors ${
                  folderFilter === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span>(all teams)</span>
                <span className="font-mono text-[11px] opacity-80">{teams.length}</span>
              </button>

              <button
                onClick={() => setFolderFilter('gen9')}
                className={`w-full text-left px-3 py-2 rounded-xl font-semibold flex items-center justify-between transition-colors ${
                  folderFilter === 'gen9' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span>Gen 9</span>
                <span className="font-mono text-[11px] opacity-80">
                  {teams.filter((t) => t.generation === 9).length}
                </span>
              </button>

              <button
                onClick={() => setFolderFilter('favorites')}
                className={`w-full text-left px-3 py-2 rounded-xl font-semibold flex items-center justify-between transition-colors ${
                  folderFilter === 'favorites' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                  Favorites
                </span>
                <span className="font-mono text-[11px] opacity-80">
                  {teams.filter((t) => t.isFavorite).length}
                </span>
              </button>
            </div>
          </div>

          {/* Main Teams List Area */}
          <div className="lg:col-span-9 space-y-5">
            {/* Header Greeting Banner */}
            <div className="card p-5 bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border-slate-800 space-y-2">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Swords className="h-5 w-5 text-indigo-400" />
                Teams Library ({filteredTeams.length})
              </h2>
              <p className="text-xs text-slate-400">
                Create, organize, and manage your competitive Pokémon teams. All teams are automatically saved locally on your device!
              </p>
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleNewTeam}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-indigo-500 transition-all"
                >
                  <Plus className="h-4 w-4" />
                  New Team
                </button>
                <button
                  onClick={() => setShowImportModalInList(true)}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-800 transition-all"
                >
                  <FileText className="h-4 w-4 text-indigo-400" />
                  Import from Text
                </button>
              </div>

              {/* Team Search Box */}
              <div className="flex items-center gap-2 border border-slate-800 bg-slate-950 px-3 py-1.5 rounded-xl w-full sm:w-64">
                <Search className="h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  value={teamSearchQuery}
                  onChange={(e) => setTeamSearchQuery(e.target.value)}
                  placeholder="search teams..."
                  className="w-full bg-transparent text-xs text-white outline-none"
                />
              </div>
            </div>

            {/* Teams List Cards */}
            {filteredTeams.length === 0 ? (
              <div className="card p-10 text-center space-y-3 bg-slate-900/60 border-slate-800">
                <FolderOpen className="h-10 w-10 text-slate-500 mx-auto" />
                <p className="text-sm font-bold text-white">No teams found</p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Click 'New Team' above to start building your first competitive team!
                </p>
                <button
                  onClick={handleNewTeam}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-indigo-500 transition-all"
                >
                  <Plus className="h-4 w-4" />
                  New Team
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTeams.map((t) => (
                  <motion.div
                    key={t.id}
                    onClick={() => handleOpenTeam(t.id)}
                    className="card card-interactive p-4 bg-slate-900 border-slate-800 hover:border-indigo-500/60 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer"
                  >
                    <div className="space-y-2 flex-1 min-w-0">
                      {/* Inline Renaming Input */}
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-indigo-950 text-indigo-300 border border-indigo-500/30 flex-shrink-0">
                          [gen{t.generation}]
                        </span>

                        <div className="relative flex-1 min-w-[150px] max-w-[280px]">
                          <input
                            type="text"
                            value={t.name}
                            onChange={(e) => renameTeam(t.id, e.target.value)}
                            placeholder="Team Name..."
                            className="w-full bg-slate-950/90 border border-slate-800 hover:border-indigo-500/60 focus:border-indigo-500 focus:bg-slate-950 text-xs font-bold text-white rounded-lg px-2.5 py-1 outline-none transition-all"
                          />
                        </div>

                        <button
                          onClick={() => toggleFavorite(t.id)}
                          title={t.isFavorite ? 'Unfavorite' : 'Favorite'}
                          className="p-1 rounded hover:bg-slate-800 transition-colors"
                        >
                          <Star
                            className={`h-4 w-4 ${
                              t.isFavorite ? 'text-amber-400 fill-amber-400' : 'text-slate-500 hover:text-amber-400'
                            }`}
                          />
                        </button>
                      </div>

                      {/* 6 Pokémon Sprites Row */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {t.pokemon.length > 0 ? (
                          t.pokemon.map((p, pIdx) => (
                            <div key={pIdx} className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1">
                              <PokemonSprite name={p.species} dexNum={getSpecies(p.species)?.num || 0} size={28} animated={false} />
                              <span className="text-[11px] font-medium text-slate-300 max-w-[80px] truncate">
                                {p.nickname || p.species || 'Empty'}
                              </span>
                            </div>
                          ))
                        ) : (
                          <span className="text-xs text-slate-500 italic">No Pokémon in team</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          duplicateTeam(t.id);
                        }}
                        title="Duplicate Team"
                        className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors text-xs flex items-center gap-1 font-semibold"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteTeam(t.id);
                        }}
                        title="Delete Team"
                        className="p-2 rounded-lg bg-slate-800 hover:bg-rose-950 hover:text-rose-400 text-slate-400 transition-colors text-xs"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* VIEW 2: TEAM EDITOR VIEW */}
      {view === 'editor' && activeTeam && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Top Back Navigation Bar */}
          <div className="flex items-center justify-between card p-4 bg-slate-900 border-slate-800">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setView('list')}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-200 hover:bg-slate-700 transition-all"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Teams
              </button>

              <div className="h-4 w-px bg-slate-800" />

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={activeTeam.name}
                  onChange={(e) => renameTeam(activeTeam.id, e.target.value)}
                  placeholder="Team Name..."
                  className="bg-slate-950 border border-slate-800 focus:border-indigo-500 text-sm font-bold text-white rounded-xl px-3 py-1.5 outline-none transition-all w-64"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowTeamShowdownModal(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-1.5 text-xs font-bold text-slate-200 hover:bg-slate-700 transition-all"
              >
                <FileText className="h-4 w-4 text-indigo-400" />
                Import/Export Team
              </button>

              <button
                onClick={() => setShowSearch(true)}
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md transition-all"
              >
                <Plus className="h-4 w-4" />
                Add Pokémon
              </button>
            </div>
          </div>

          {/* 6 Pokémon Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, index) => {
              const pokemon = activeTeam?.pokemon[index] ?? null;
              const isSelected = selectedSlot === index;
              const speciesData = pokemon?.species ? getSpecies(pokemon.species) : null;

              return (
                <motion.div
                  key={index}
                  onClick={() => handleSlotClick(index)}
                  className={`card card-interactive p-4 flex flex-col items-center justify-between min-h-[220px] relative text-center cursor-pointer transition-all ${
                    isSelected ? 'border-indigo-500 ring-2 ring-indigo-500/40 bg-indigo-950/20' : 'bg-slate-900 border-slate-800'
                  }`}
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
                        <span className="text-xs font-bold truncate block text-white">
                          {pokemon.nickname || pokemon.species}
                        </span>

                        <div className="flex gap-1 justify-center flex-wrap">
                          {speciesData?.types.map((t) => (
                            <TypeBadge key={t} type={t as PokemonType} size="sm" />
                          ))}
                        </div>

                        <div className="text-[10px] font-mono text-slate-400 truncate">
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
                        className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs transition-colors bg-slate-800 text-slate-400 hover:bg-rose-600 hover:text-white"
                        aria-label="Remove Pokémon"
                      >
                        ×
                      </button>
                    </>
                  ) : (
                    <div className="my-auto flex flex-col items-center gap-2">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center border-2 border-dashed border-slate-700 text-slate-500">
                        <Plus className="h-5 w-5" />
                      </div>
                      <span className="text-xs font-semibold text-slate-500">
                        Slot {index + 1}
                      </span>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Detailed Pokémon Editor Panel */}
          {selectedPokemon && activeTeamId && selectedSlot !== null && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <PokemonEditorFull
                pokemon={selectedPokemon}
                onUpdate={(updates) => updatePokemon(activeTeamId, selectedSlot, updates)}
                onDelete={() => removePokemon(activeTeamId, selectedSlot)}
              />
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Add Pokémon Search Modal */}
      <PokemonPickerModal
        isOpen={showSearch}
        onClose={() => setShowSearch(false)}
        onSelectPokemon={(speciesName) => handleAddPokemon(speciesName)}
      />

      {/* Team Showdown Import/Export Modal */}
      {(showTeamShowdownModal || showImportModalInList) && (
        <ShowdownPasteModal
          isOpen={showTeamShowdownModal || showImportModalInList}
          onClose={() => {
            setShowTeamShowdownModal(false);
            setShowImportModalInList(false);
          }}
          mode="team"
          currentTeam={activeTeam?.pokemon || []}
          onImportTeam={(importedPokemonList) => {
            const targetId = activeTeamId || createTeam();
            setActiveTeam(targetId);
            importedPokemonList.forEach((p, i) => {
              if (i < 6) {
                useTeamStore.getState().setPokemonSpecies(targetId, i, p.species);
                useTeamStore.getState().updatePokemon(targetId, i, p);
              }
            });
            setShowTeamShowdownModal(false);
            setShowImportModalInList(false);
            setView('editor');
          }}
        />
      )}
    </div>
  );
}
