'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  X,
} from 'lucide-react';
import { useTeamStore } from '@/stores/team-store';
import { PokemonSprite } from '@/components/shared/PokemonSprite';
import { TypeBadge } from '@/components/shared/TypeBadge';
import { getAllSpecies, getAllAbilities, getSpecies, GENERATIONS } from '@/lib/pokemon/data-provider';
import type { PokemonType, StatName } from '@/types/pokemon';
import { createEmptyPokemon } from '@/types/pokemon';
import { PokemonEditorFull } from '@/components/team/PokemonEditorFull';
import { ShowdownPasteModal } from '@/components/team/ShowdownPasteModal';
import { TYPE_COLORS } from '@/lib/pokemon/sprites';
import { STAT_COLORS } from '@/types/pokemon';
import Fuse from 'fuse.js';

const POKEMON_TYPES: PokemonType[] = [
  'Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice',
  'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic', 'Bug',
  'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy',
];

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
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showTeamShowdownModal, setShowTeamShowdownModal] = useState(false);
  const [showImportModalInList, setShowImportModalInList] = useState(false);

  // Picker filter state
  const [pickerTypeFilter, setPickerTypeFilter] = useState<PokemonType | 'All'>('All');
  const [pickerGenFilter, setPickerGenFilter] = useState<number | 'All'>('All');
  const [pickerAbilityFilter, setPickerAbilityFilter] = useState('');
  const [pickerSortKey, setPickerSortKey] = useState<'num' | 'name' | 'hp' | 'atk' | 'def' | 'spa' | 'spd' | 'spe' | 'bst'>('num');
  const [pickerSortDir, setPickerSortDir] = useState<'asc' | 'desc'>('asc');
  const [pickerColumnPanel, setPickerColumnPanel] = useState<'none' | 'types' | 'abilities' | 'stats' | 'gen'>('none');
  const [pickerStatFilters, setPickerStatFilters] = useState<Record<string, number>>({
    hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0, bst: 0,
  });

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

  // Pokémon species search for adding slot
  const allSpecies = useMemo(() => getAllSpecies(9), []);
  const allAbilitiesList = useMemo(() => getAllAbilities(9), []);
  const speciesFuse = useMemo(
    () =>
      new Fuse(allSpecies, {
        keys: ['name', 'baseSpecies', 'types'],
        threshold: 0.3,
        distance: 100,
      }),
    [allSpecies]
  );

  const pickerResults = useMemo(() => {
    let result = searchQuery.trim()
      ? speciesFuse.search(searchQuery, { limit: 500 }).map((r) => r.item)
      : [...allSpecies];

    if (pickerTypeFilter !== 'All') {
      result = result.filter((s) => s.types.includes(pickerTypeFilter));
    }
    if (pickerGenFilter !== 'All') {
      result = result.filter((s) => s.generation === pickerGenFilter);
    }
    if (pickerAbilityFilter) {
      const ab = pickerAbilityFilter.toLowerCase();
      result = result.filter((s) =>
        s.abilities.some((a) => a.toLowerCase() === ab) ||
        (s.hiddenAbility && s.hiddenAbility.toLowerCase() === ab)
      );
    }
    for (const [stat, minVal] of Object.entries(pickerStatFilters)) {
      if (minVal > 0) {
        if (stat === 'bst') result = result.filter((s) => s.bst >= minVal);
        else result = result.filter((s) => s.baseStats[stat as StatName] >= minVal);
      }
    }
    result.sort((a, b) => {
      if (pickerSortKey === 'name') {
        return pickerSortDir === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
      }
      const aVal = pickerSortKey === 'bst' ? a.bst : pickerSortKey === 'num' ? a.num : a.baseStats[pickerSortKey as StatName];
      const bVal = pickerSortKey === 'bst' ? b.bst : pickerSortKey === 'num' ? b.num : b.baseStats[pickerSortKey as StatName];
      return pickerSortDir === 'asc' ? aVal - bVal : bVal - aVal;
    });
    return result.slice(0, 400);
  }, [allSpecies, speciesFuse, searchQuery, pickerTypeFilter, pickerGenFilter, pickerAbilityFilter, pickerStatFilters, pickerSortKey, pickerSortDir]);

  const hasPickerFilters = pickerTypeFilter !== 'All' || pickerGenFilter !== 'All' || !!pickerAbilityFilter || Object.values(pickerStatFilters).some(v => v > 0);

  const clearPickerFilters = () => {
    setPickerTypeFilter('All');
    setPickerGenFilter('All');
    setPickerAbilityFilter('');
    setPickerStatFilters({ hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0, bst: 0 });
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
      setSearchQuery('');
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
                          t.pokemon.map((p) => (
                            <div
                              key={p.id}
                              className="w-9 h-9 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center overflow-hidden"
                            >
                              {p.species && (
                                <PokemonSprite
                                  name={p.species}
                                  dexNum={0}
                                  size={34}
                                  animated={false}
                                />
                              )}
                            </div>
                          ))
                        ) : (
                          <span className="text-xs text-slate-500 italic">Empty team</span>
                        )}
                      </div>
                    </div>

                    {/* Quick Card Action Buttons */}
                    <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleOpenTeam(t.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold hover:bg-indigo-600 hover:text-white transition-colors"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        Edit
                      </button>
                      <button
                        onClick={() => duplicateTeam(t.id)}
                        title="Duplicate Team"
                        className="p-1.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => deleteTeam(t.id)}
                        title="Delete Team"
                        className="p-1.5 rounded-lg border border-red-500/20 bg-red-950/20 text-red-400 hover:bg-red-600 hover:text-white transition-colors"
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

      {/* VIEW 2: TEAM DETAIL & POKÉMON EDITOR VIEW */}
      {view === 'editor' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Top Navigation Bar with BACK BUTTON */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4 border-slate-800">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setView('list')}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs font-bold text-slate-200 hover:bg-indigo-600 hover:text-white transition-all shadow-md"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Teams
              </button>

              <div className="h-6 w-px bg-slate-800" />

              <div>
                <input
                  type="text"
                  value={activeTeam?.name || 'Untitled Team'}
                  onChange={(e) => {
                    if (activeTeamId) {
                      renameTeam(activeTeamId, e.target.value);
                    }
                  }}
                  className="text-xl font-bold bg-transparent outline-none border-b border-transparent hover:border-slate-500 focus:border-indigo-500 transition-colors text-white"
                />
                <p className="text-xs text-slate-400">
                  Gen {activeTeam?.generation || 9} • {activeTeam?.pokemon.length || 0}/6 Pokémon
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowTeamShowdownModal(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs font-bold text-slate-300 hover:bg-slate-800 transition-colors"
              >
                <FileText className="h-4 w-4 text-indigo-400" />
                Import / Export Team Paste
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

      {/* Add Pokémon Search Modal — Showdown Table Style */}
      <AnimatePresence>
        {showSearch && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
              onClick={() => { setShowSearch(false); setSearchQuery(''); setPickerColumnPanel('none'); }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: -16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: -16 }}
              transition={{ duration: 0.18 }}
              className="fixed left-1/2 top-[3%] z-[101] w-[98%] max-w-4xl -translate-x-1/2 rounded-2xl border flex flex-col"
              style={{
                background: 'var(--bg-card)',
                borderColor: 'var(--border-primary)',
                boxShadow: '0 25px 80px rgba(0,0,0,0.7)',
                maxHeight: '93vh',
              }}
            >
              {/* Search */}
              <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b" style={{ borderColor: 'var(--border-primary)' }}>
                <Search className="h-4 w-4 text-slate-400 flex-shrink-0" />
                <input
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setPickerColumnPanel('none'); }}
                  onKeyDown={(e) => { if (e.key === 'Escape') { setShowSearch(false); setSearchQuery(''); } }}
                  placeholder="Search Pokémon or form (e.g. Charizard, Steelix-Mega)..."
                  className="flex-1 bg-transparent text-sm outline-none"
                  style={{ color: 'var(--text-primary)' }}
                />
                <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>{pickerResults.length} results</span>
                <button
                  onClick={() => { setShowSearch(false); setSearchQuery(''); setPickerColumnPanel('none'); }}
                  className="text-xs px-2.5 py-1 rounded-lg ml-1"
                  style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
                >
                  ESC
                </button>
              </div>

              {/* Active Filter Tags */}
              {hasPickerFilters && (
                <div className="flex items-center gap-2 flex-wrap px-4 py-2 border-b" style={{ borderColor: 'var(--border-primary)' }}>
                  <span className="text-[11px] font-semibold" style={{ color: 'var(--text-tertiary)' }}>Filters:</span>
                  {pickerTypeFilter !== 'All' && (
                    <span
                      className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border cursor-pointer hover:opacity-80"
                      style={{ borderColor: TYPE_COLORS[pickerTypeFilter]?.bg || 'var(--border-primary)', color: TYPE_COLORS[pickerTypeFilter]?.text || '#fff', background: (TYPE_COLORS[pickerTypeFilter]?.bg || 'var(--bg-secondary)') + '33' }}
                      onClick={() => setPickerTypeFilter('All')}
                    >
                      {pickerTypeFilter} <X className="h-3 w-3" />
                    </span>
                  )}
                  {pickerGenFilter !== 'All' && (
                    <span
                      className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border cursor-pointer hover:opacity-80"
                      style={{ borderColor: 'var(--border-secondary)', color: 'var(--text-primary)', background: 'var(--bg-secondary)' }}
                      onClick={() => setPickerGenFilter('All')}
                    >
                      {GENERATIONS.find(g => g.num === pickerGenFilter)?.name} <X className="h-3 w-3" />
                    </span>
                  )}
                  {pickerAbilityFilter && (
                    <span
                      className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border cursor-pointer hover:opacity-80"
                      style={{ borderColor: 'var(--border-secondary)', color: 'var(--text-primary)', background: 'var(--bg-secondary)' }}
                      onClick={() => setPickerAbilityFilter('')}
                    >
                      {pickerAbilityFilter} <X className="h-3 w-3" />
                    </span>
                  )}
                  {Object.entries(pickerStatFilters).filter(([, v]) => v > 0).map(([stat, val]) => (
                    <span
                      key={stat}
                      className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border cursor-pointer hover:opacity-80"
                      style={{ borderColor: 'var(--border-secondary)', color: STAT_COLORS[stat as StatName] || '#fff', background: 'var(--bg-secondary)' }}
                      onClick={() => setPickerStatFilters(prev => ({ ...prev, [stat]: 0 }))}
                    >
                      {stat.toUpperCase()} ≥{val} <X className="h-3 w-3" />
                    </span>
                  ))}
                  <button onClick={clearPickerFilters} className="text-[10px] px-2 py-0.5 rounded-md border border-rose-500/40 text-rose-400 hover:bg-rose-500/10 transition-colors">
                    Clear All
                  </button>
                </div>
              )}

              {/* Column Filter Panels */}
              <AnimatePresence>
                {pickerColumnPanel !== 'none' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border-b overflow-hidden"
                    style={{ borderColor: 'var(--border-primary)' }}
                  >
                    <div className="p-3" style={{ background: 'var(--bg-secondary)' }}>
                      {pickerColumnPanel === 'types' && (
                        <div className="flex items-center gap-1 flex-wrap">
                          <span className="text-[10px] font-bold uppercase text-slate-500 mr-1">Filter by Type:</span>
                          <button onClick={() => { setPickerTypeFilter('All'); setPickerColumnPanel('none'); }} className="px-2.5 py-1 rounded-lg font-medium text-[10px] border transition-colors" style={{ background: pickerTypeFilter === 'All' ? 'var(--color-primary)' : 'var(--bg-card)', color: pickerTypeFilter === 'All' ? '#fff' : 'var(--text-secondary)', borderColor: 'var(--border-primary)' }}>All</button>
                          {POKEMON_TYPES.map((type) => {
                            const colors = TYPE_COLORS[type] ?? TYPE_COLORS['Normal'];
                            const isActive = pickerTypeFilter === type;
                            return (
                              <button key={type} onClick={() => { setPickerTypeFilter(isActive ? 'All' : type); setPickerColumnPanel('none'); }} className="px-2.5 py-1 rounded-lg transition-all font-semibold uppercase tracking-wide text-[10px] border" style={{ background: isActive ? colors.bg : 'var(--bg-card)', color: isActive ? colors.text : 'var(--text-tertiary)', borderColor: isActive ? colors.bg : 'var(--border-primary)', opacity: isActive ? 1 : 0.75 }}>{type}</button>
                            );
                          })}
                        </div>
                      )}
                      {pickerColumnPanel === 'gen' && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-bold uppercase text-slate-500 mr-1">Filter by Generation:</span>
                          <button onClick={() => { setPickerGenFilter('All'); setPickerColumnPanel('none'); }} className="px-2.5 py-1 rounded-lg font-medium text-[10px] border transition-colors" style={{ background: pickerGenFilter === 'All' ? 'var(--color-primary)' : 'var(--bg-card)', color: pickerGenFilter === 'All' ? '#fff' : 'var(--text-secondary)', borderColor: 'var(--border-primary)' }}>All</button>
                          {GENERATIONS.map((gen) => (
                            <button key={gen.num} onClick={() => { setPickerGenFilter(pickerGenFilter === gen.num ? 'All' : gen.num); setPickerColumnPanel('none'); }} className="px-2.5 py-1 rounded-lg font-medium text-[10px] border transition-colors" style={{ background: pickerGenFilter === gen.num ? 'var(--color-primary)' : 'var(--bg-card)', color: pickerGenFilter === gen.num ? '#fff' : 'var(--text-secondary)', borderColor: 'var(--border-primary)' }}>
                              {gen.name} <span className="opacity-60">({gen.region})</span>
                            </button>
                          ))}
                        </div>
                      )}
                      {pickerColumnPanel === 'abilities' && (
                        <div>
                          <div className="text-[10px] font-bold uppercase text-slate-500 mb-2">Filter by Ability:</div>
                          <div className="max-h-40 overflow-y-auto grid grid-cols-3 sm:grid-cols-4 gap-1">
                            {allAbilitiesList.map((ab) => (
                              <button key={ab.id} onClick={() => { setPickerAbilityFilter(pickerAbilityFilter === ab.name ? '' : ab.name); setPickerColumnPanel('none'); }} className="text-left px-2.5 py-1.5 rounded-lg text-[10px] font-medium border transition-colors truncate" style={{ background: pickerAbilityFilter === ab.name ? 'var(--color-primary)' : 'var(--bg-card)', color: pickerAbilityFilter === ab.name ? '#fff' : 'var(--text-secondary)', borderColor: 'var(--border-primary)' }}>
                                {ab.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      {pickerColumnPanel === 'stats' && (
                        <div>
                          <div className="text-[10px] font-bold uppercase text-slate-500 mb-2">Min Stat Filter:</div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {(['hp', 'atk', 'def', 'spa', 'spd', 'spe', 'bst'] as const).map((stat) => (
                              <div key={stat}>
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-[10px] font-bold uppercase" style={{ color: stat === 'bst' ? '#a78bfa' : STAT_COLORS[stat as StatName] || 'var(--text-secondary)' }}>{stat === 'bst' ? 'BST' : stat.toUpperCase()}</span>
                                  <input type="number" min={0} max={stat === 'bst' ? 800 : 255} value={pickerStatFilters[stat] || ''} onChange={(e) => setPickerStatFilters(prev => ({ ...prev, [stat]: parseInt(e.target.value) || 0 }))} className="w-14 text-right text-[11px] font-mono font-bold rounded border px-1 py-0.5 outline-none" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }} />
                                </div>
                                <input type="range" min={0} max={stat === 'bst' ? 800 : 255} value={pickerStatFilters[stat] || 0} onChange={(e) => setPickerStatFilters(prev => ({ ...prev, [stat]: parseInt(e.target.value) }))} className="w-full h-1.5 rounded-full appearance-none cursor-pointer" style={{ accentColor: stat === 'bst' ? '#a78bfa' : STAT_COLORS[stat as StatName] || 'var(--color-primary)' }} />
                              </div>
                            ))}
                          </div>
                          <button onClick={() => setPickerStatFilters({ hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0, bst: 0 })} className="mt-2 text-[10px] px-2 py-0.5 rounded border border-rose-500/40 text-rose-400 hover:bg-rose-500/10 transition-colors">Reset Stats</button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Column Headers */}
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
                <button onClick={() => { const d = pickerSortKey === 'num' ? (pickerSortDir === 'asc' ? 'desc' : 'asc') : 'asc'; setPickerSortKey('num'); setPickerSortDir(d); setPickerColumnPanel(pickerColumnPanel === 'gen' ? 'none' : 'gen'); }} className={`text-left hover:text-white transition-colors ${pickerColumnPanel === 'gen' || pickerSortKey === 'num' ? 'text-white' : ''}`}>#</button>
                <button onClick={() => { const d = pickerSortKey === 'name' ? (pickerSortDir === 'asc' ? 'desc' : 'asc') : 'asc'; setPickerSortKey('name'); setPickerSortDir(d); setPickerColumnPanel('none'); }} className={`text-left hover:text-white transition-colors ${pickerSortKey === 'name' ? 'text-white' : ''}`}>Name {pickerSortKey === 'name' ? (pickerSortDir === 'asc' ? '↑' : '↓') : ''}</button>
                <button onClick={() => setPickerColumnPanel(pickerColumnPanel === 'types' ? 'none' : 'types')} className={`text-left hover:text-white transition-colors ${pickerColumnPanel === 'types' || pickerTypeFilter !== 'All' ? 'text-indigo-400' : ''}`}>Types {pickerTypeFilter !== 'All' ? '●' : ''}</button>
                <button onClick={() => setPickerColumnPanel(pickerColumnPanel === 'abilities' ? 'none' : 'abilities')} className={`text-left hover:text-white transition-colors ${pickerColumnPanel === 'abilities' || pickerAbilityFilter ? 'text-indigo-400' : ''}`}>Abilities {pickerAbilityFilter ? '●' : ''}</button>
                {(['hp', 'atk', 'def', 'spa', 'spd', 'spe'] as const).map((stat) => (
                  <button key={stat} onClick={() => { const d = pickerSortKey === stat ? (pickerSortDir === 'asc' ? 'desc' : 'asc') : 'desc'; setPickerSortKey(stat); setPickerSortDir(d); setPickerColumnPanel(pickerColumnPanel === 'stats' ? 'none' : 'stats'); }} className={`text-center hover:text-white transition-colors ${pickerSortKey === stat ? 'text-white' : ''}`} style={{ color: pickerStatFilters[stat] > 0 ? STAT_COLORS[stat] : undefined }}>
                    {stat === 'spa' ? 'SpA' : stat === 'spd' ? 'SpD' : stat === 'spe' ? 'Spe' : stat.toUpperCase()}{pickerSortKey === stat ? (pickerSortDir === 'asc' ? '↑' : '↓') : ''}
                  </button>
                ))}
                <button onClick={() => { const d = pickerSortKey === 'bst' ? (pickerSortDir === 'asc' ? 'desc' : 'asc') : 'desc'; setPickerSortKey('bst'); setPickerSortDir(d); setPickerColumnPanel(pickerColumnPanel === 'stats' ? 'none' : 'stats'); }} className={`text-center hover:text-white transition-colors ${pickerSortKey === 'bst' ? 'text-violet-400' : ''}`}>
                  BST {pickerSortKey === 'bst' ? (pickerSortDir === 'asc' ? '↑' : '↓') : ''}
                </button>
              </div>

              {/* Pokémon Rows */}
              <div className="overflow-y-auto flex-1">
                {pickerResults.length === 0 ? (
                  <div className="text-center py-12 text-sm" style={{ color: 'var(--text-tertiary)' }}>No Pokémon match your filters.</div>
                ) : (
                  pickerResults.map((species) => (
                    <button
                      key={species.name}
                      onClick={() => handleAddPokemon(species.name)}
                      className="w-full grid items-center px-4 py-1.5 border-b transition-colors hover:bg-white/5 text-left"
                      style={{
                        gridTemplateColumns: '2.5rem 2.5rem 1fr 1fr 1fr 2.2rem 2.2rem 2.2rem 2.2rem 2.2rem 2.2rem 2.8rem',
                        borderColor: 'var(--border-primary)',
                      }}
                    >
                      <div className="flex items-center justify-center">
                        <PokemonSprite name={species.name} dexNum={species.num} size={32} animated={false} />
                      </div>
                      <span className="text-[10px] font-mono" style={{ color: 'var(--text-tertiary)' }}>#{String(species.num).padStart(3, '0')}</span>
                      <span className="text-sm font-semibold truncate pr-2 text-white">{species.name}</span>
                      <div className="flex gap-1 flex-wrap">
                        {species.types.map((t) => (<TypeBadge key={t} type={t as PokemonType} size="sm" />))}
                      </div>
                      <div className="text-[10px] leading-tight pr-2" style={{ color: 'var(--text-secondary)' }}>
                        {species.abilities.slice(0, 2).join(' / ')}
                        {species.hiddenAbility && <span className="block opacity-60 italic">{species.hiddenAbility}</span>}
                      </div>
                      {(['hp', 'atk', 'def', 'spa', 'spd', 'spe'] as const).map((stat) => (
                        <span key={stat} className="text-center text-[11px] font-mono font-bold" style={{ color: pickerStatFilters[stat] > 0 && species.baseStats[stat as StatName] >= pickerStatFilters[stat] ? STAT_COLORS[stat as StatName] : 'var(--text-secondary)' }}>
                          {species.baseStats[stat as StatName]}
                        </span>
                      ))}
                      <span className="text-center text-[11px] font-mono font-bold" style={{ color: pickerStatFilters['bst'] > 0 && species.bst >= pickerStatFilters['bst'] ? '#a78bfa' : 'var(--text-tertiary)' }}>{species.bst}</span>
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

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
