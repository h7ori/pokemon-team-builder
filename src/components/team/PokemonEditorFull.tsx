'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Trash2,
  ChevronDown,
  Copy,
  Check,
  Search,
  Zap,
  Shield,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import type { TeamPokemon, StatName, PokemonType, Gender, BaseStats } from '@/types/pokemon';
import {
  getAllItems,
  getAllAbilities,
  getAllNatures,
  getAllTypes,
  calculateStat,
  getSpecies,
  getSpeciesForms,
  getAllSpecies,
  getLearnableMoves,
  getMove,
  GENERATIONS,
  type FormattedMove,
} from '@/lib/pokemon/data-provider';
import { PokemonSprite } from '@/components/shared/PokemonSprite';
import { TypeBadge } from '@/components/shared/TypeBadge';
import { ShowdownPasteModal } from './ShowdownPasteModal';
import { exportShowdownSet } from '@/lib/pokemon/showdown-parser';
import { STAT_NAMES, STAT_COLORS } from '@/types/pokemon';
import { TYPE_COLORS } from '@/lib/pokemon/sprites';
import { Dex } from '@pkmn/dex';
import Fuse from 'fuse.js';

const POKEMON_TYPES: PokemonType[] = [
  'Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice',
  'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic', 'Bug',
  'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy',
];

const POPULAR_ITEM_NAMES = [
  'Air Balloon',
  'Assault Vest',
  'Choice Band',
  'Choice Scarf',
  'Choice Specs',
  'Expert Belt',
  'Focus Sash',
  'Heavy-Duty Boots',
  'Leftovers',
  'Life Orb',
  'Loaded Dice',
  'Rocky Helmet',
  'Sitrus Berry',
  'Weakness Policy',
  'Eject Pack',
  'Eject Button',
  'Covert Cloak',
  'Light Clay',
  'Black Sludge',
  'Eviolite',
  'Booster Energy',
  'Clear Amulet',
  'Flame Orb',
  'Toxic Orb',
];

interface PokemonEditorFullProps {
  pokemon: TeamPokemon;
  onUpdate: (updates: Partial<TeamPokemon>) => void;
  onDelete: () => void;
}

export function PokemonEditorFull({
  pokemon,
  onUpdate,
  onDelete,
}: PokemonEditorFullProps) {
  // Active panel section: 'moves' | 'stats' | 'items' | 'abilities'
  const [activeSection, setActiveSection] = useState<'moves' | 'stats' | 'items' | 'abilities'>('moves');
  const [activeMoveSlot, setActiveMoveSlot] = useState<number>(0);
  const [moveSearchQuery, setMoveSearchQuery] = useState('');
  const [moveCategoryFilter, setMoveCategoryFilter] = useState<'All' | 'Physical' | 'Special' | 'Status'>('All');
  const [moveTypeFilter, setMoveTypeFilter] = useState<PokemonType | 'All'>('All');
  const [showIllegalMoves, setShowIllegalMoves] = useState(false);
  const [itemSearchQuery, setItemSearchQuery] = useState('');
  const [abilitySearchQuery, setAbilitySearchQuery] = useState('');
  const [showShowdownModal, setShowShowdownModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [learnableMoves, setLearnableMoves] = useState<FormattedMove[]>([]);

  // Pokemon picker filter state
  const [pokemonPickerOpen, setPokemonPickerOpen] = useState(false);
  const [pokemonSearchQuery, setPokemonSearchQuery] = useState('');
  const [pokemonTypeFilter, setPokemonTypeFilter] = useState<PokemonType | 'All'>('All');
  const [pokemonGenFilter, setPokemonGenFilter] = useState<number | 'All'>('All');

  // EV Mode: 'standard' (510 EVs, max 252) vs 'champions' (66 EV Points, max 32)
  const [evMode, setEvMode] = useState<'standard' | 'champions'>('standard');
  const [editingEvStat, setEditingEvStat] = useState<StatName | null>(null);

  // Species data lookup
  const currentSpeciesData = useMemo(
    () => getSpecies(pokemon.species),
    [pokemon.species]
  );

  const availableForms = useMemo(() => {
    if (!currentSpeciesData) return [];
    return getSpeciesForms(currentSpeciesData.baseSpecies || pokemon.species);
  }, [currentSpeciesData, pokemon.species]);

  // Load learnable moves for species with legality tagging
  useEffect(() => {
    let isMounted = true;
    if (pokemon.species) {
      getLearnableMoves(pokemon.species).then((moves) => {
        if (isMounted) setLearnableMoves(moves);
      });
    }
    return () => {
      isMounted = false;
    };
  }, [pokemon.species]);

  const itemsList = useMemo(() => getAllItems(9), []);
  const abilitiesList = useMemo(() => getAllAbilities(9), []);
  const naturesList = useMemo(() => getAllNatures(), []);
  const typesList = useMemo(() => getAllTypes(), []);

  const currentNature = useMemo(
    () => naturesList.find((n) => n.name === pokemon.nature) || naturesList[0],
    [naturesList, pokemon.nature]
  );

  // Mega Stones subset
  const megaStonesList = useMemo(
    () => itemsList.filter((i) => i.isMegaStone),
    [itemsList]
  );

  // Active Move Detail for top banner in Moves panel
  const activeMoveName = pokemon.moves[activeMoveSlot] || '';
  const activeMoveDetail = useMemo(() => {
    if (!activeMoveName) return null;
    return getMove(activeMoveName);
  }, [activeMoveName]);

  // Active Item Detail
  const activeItemDetail = useMemo(() => {
    if (!pokemon.item) return null;
    const it = Dex.items.get(pokemon.item);
    if (!it || !it.exists) return null;
    return {
      name: it.name,
      desc: it.desc || it.shortDesc || '',
    };
  }, [pokemon.item]);

  // Active Ability Detail
  const activeAbilityDetail = useMemo(() => {
    if (!pokemon.ability) return null;
    const ab = Dex.abilities.get(pokemon.ability);
    if (!ab || !ab.exists) return null;
    return {
      name: ab.name,
      desc: ab.desc || ab.shortDesc || '',
    };
  }, [pokemon.ability]);

  // Species Abilities
  const speciesAbilities = useMemo(() => {
    if (!currentSpeciesData || !currentSpeciesData.abilities) {
      return { primary: [], hidden: [] };
    }

    const primaryNames: string[] = [];
    if (currentSpeciesData.abilities['0']) primaryNames.push(currentSpeciesData.abilities['0']);
    if (currentSpeciesData.abilities['1']) primaryNames.push(currentSpeciesData.abilities['1']);

    const hiddenName = currentSpeciesData.abilities['H'] || null;

    const primary = primaryNames.map((name) => {
      const ab = Dex.abilities.get(name);
      return {
        name,
        desc: ab?.desc || ab?.shortDesc || '',
      };
    });

    const hidden = hiddenName
      ? [
          {
            name: hiddenName,
            desc: Dex.abilities.get(hiddenName)?.desc || Dex.abilities.get(hiddenName)?.shortDesc || '',
          },
        ]
      : [];

    return { primary, hidden };
  }, [currentSpeciesData]);

  // Base Stats
  const baseStats: BaseStats = useMemo(() => {
    if (currentSpeciesData?.baseStats) {
      return {
        hp: currentSpeciesData.baseStats.hp,
        atk: currentSpeciesData.baseStats.atk,
        def: currentSpeciesData.baseStats.def,
        spa: currentSpeciesData.baseStats.spa,
        spd: currentSpeciesData.baseStats.spd,
        spe: currentSpeciesData.baseStats.spe,
      };
    }
    return { hp: 80, atk: 80, def: 80, spa: 80, spd: 80, spe: 80 };
  }, [currentSpeciesData]);

  // Live Stats Calculation
  const calculatedStats = useMemo(() => {
    const stats: BaseStats = { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
    const statKeys: StatName[] = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'];

    for (const key of statKeys) {
      const evVal = evMode === 'champions' ? pokemon.evs[key] * 4 : pokemon.evs[key];
      stats[key] = calculateStat(
        key,
        baseStats[key],
        pokemon.ivs[key],
        evVal,
        pokemon.level,
        currentNature
      );
    }
    return stats;
  }, [baseStats, pokemon.ivs, pokemon.evs, pokemon.level, currentNature, evMode]);

  const maxTotalEVs = evMode === 'champions' ? 66 : 510;
  const maxPerStatEV = evMode === 'champions' ? 32 : 252;
  const evStep = evMode === 'champions' ? 1 : 4;

  const totalEVs = useMemo(
    () =>
      pokemon.evs.hp +
      pokemon.evs.atk +
      pokemon.evs.def +
      pokemon.evs.spa +
      pokemon.evs.spd +
      pokemon.evs.spe,
    [pokemon.evs]
  );

  const remainingEVs = maxTotalEVs - totalEVs;

  const handleSpeciesChange = (newSpeciesName: string) => {
    const spec = Dex.species.get(newSpeciesName);
    if (!spec.exists) return;

    const requiredItem = (spec as any).requiredItem || (spec as any).requiredItems?.[0];
    const defaultAbility = spec.abilities ? Object.values(spec.abilities)[0] : '';

    const updates: Partial<TeamPokemon> = {
      species: newSpeciesName,
    };

    if (requiredItem) {
      updates.item = requiredItem;
    }
    if (defaultAbility && (!pokemon.ability || spec.isMega || spec.forme)) {
      updates.ability = defaultAbility;
    }

    onUpdate(updates);
  };

  const handleEVChange = (stat: StatName, val: number) => {
    const clamped = Math.max(0, Math.min(maxPerStatEV, val));
    onUpdate({
      evs: { ...pokemon.evs, [stat]: clamped },
    });
  };

  const handleIVChange = (stat: StatName, val: number) => {
    const clamped = Math.max(0, Math.min(31, val));
    onUpdate({
      ivs: { ...pokemon.ivs, [stat]: clamped },
    });
  };

  const handleCopySet = () => {
    const text = exportShowdownSet(pokemon);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSelectMove = (moveName: string) => {
    const newMoves = [...pokemon.moves] as [string, string, string, string];
    newMoves[activeMoveSlot] = moveName;
    onUpdate({ moves: newMoves });
    if (activeMoveSlot < 3) {
      setActiveMoveSlot(activeMoveSlot + 1);
    }
  };

  const handleSelectItem = (itemName: string) => {
    const itemData = Dex.items.get(itemName);
    const updates: Partial<TeamPokemon> = { item: itemName };

    if (itemData && itemData.megaStone) {
      const targetMegaForm = Object.values(itemData.megaStone)[0] as string;
      if (targetMegaForm) {
        const megaSpec = Dex.species.get(targetMegaForm);
        if (megaSpec && megaSpec.exists) {
          updates.species = targetMegaForm;
          if (megaSpec.abilities && megaSpec.abilities['0']) {
            updates.ability = megaSpec.abilities['0'];
          }
        }
      }
    }

    onUpdate(updates);
  };

  const handleSelectAbility = (abilityName: string) => {
    onUpdate({ ability: abilityName });
  };

  const applyIVPreset = (preset: string) => {
    switch (preset) {
      case '31-all':
        onUpdate({ ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 } });
        break;
      case '0-atk':
        onUpdate({ ivs: { hp: 31, atk: 0, def: 31, spa: 31, spd: 31, spe: 31 } });
        break;
      case '0-spe':
        onUpdate({ ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 0 } });
        break;
      case '0-atk-0-spe':
        onUpdate({ ivs: { hp: 31, atk: 0, def: 31, spa: 31, spd: 31, spe: 0 } });
        break;
    }
  };

  // Filtered Move List (Default shows ONLY legal moves that species can learn; displays ILLEGAL badge if illegal)
  const filteredMoves = useMemo(() => {
    let source = learnableMoves;

    // Filter illegal moves unless user turns on showIllegalMoves or typed a specific search query
    if (!showIllegalMoves && !moveSearchQuery.trim()) {
      source = source.filter((m) => !m.isIllegal);
    }

    if (moveSearchQuery.trim()) {
      const fuse = new Fuse(source, {
        keys: ['name', 'type', 'shortDesc'],
        threshold: 0.3,
      });
      source = fuse.search(moveSearchQuery, { limit: 120 }).map((r) => r.item);
    }

    if (moveCategoryFilter !== 'All') {
      source = source.filter((m) => m.category === moveCategoryFilter);
    }

    if (moveTypeFilter !== 'All') {
      source = source.filter((m) => m.type === moveTypeFilter);
    }

    return source;
  }, [learnableMoves, moveSearchQuery, showIllegalMoves, moveCategoryFilter, moveTypeFilter]);

  // All species list + fuse for pokemon picker
  const allSpeciesList = useMemo(() => getAllSpecies(9), []);
  const pokemonFuse = useMemo(
    () => new Fuse(allSpeciesList, { keys: ['name'], threshold: 0.3 }),
    [allSpeciesList]
  );

  const filteredPokemon = useMemo(() => {
    let result = pokemonSearchQuery.trim()
      ? pokemonFuse.search(pokemonSearchQuery, { limit: 200 }).map((r) => r.item)
      : allSpeciesList;

    if (pokemonTypeFilter !== 'All') {
      result = result.filter((s) => s.types.includes(pokemonTypeFilter));
    }

    if (pokemonGenFilter !== 'All') {
      result = result.filter((s) => s.generation === pokemonGenFilter);
    }

    return result.slice(0, 200);
  }, [allSpeciesList, pokemonFuse, pokemonSearchQuery, pokemonTypeFilter, pokemonGenFilter]);

  // Filtered Items
  const popularItemsData = useMemo(() => {
    return POPULAR_ITEM_NAMES.map((name) => {
      const it = Dex.items.get(name);
      return {
        name,
        desc: it?.desc || it?.shortDesc || '',
        isMegaStone: false,
      };
    });
  }, []);

  const filteredItems = useMemo(() => {
    if (!itemSearchQuery.trim()) return popularItemsData;
    const fuse = new Fuse(itemsList, {
      keys: ['name', 'shortDesc'],
      threshold: 0.3,
    });
    return fuse.search(itemSearchQuery, { limit: 150 }).map((r) => ({
      name: r.item.name,
      desc: r.item.shortDesc || r.item.desc,
      isMegaStone: r.item.isMegaStone,
    }));
  }, [itemsList, itemSearchQuery, popularItemsData]);

  // Filtered Abilities
  const filteredAbilities = useMemo(() => {
    if (!abilitySearchQuery.trim()) return [];
    const fuse = new Fuse(abilitiesList, {
      keys: ['name', 'shortDesc'],
      threshold: 0.3,
    });
    return fuse.search(abilitySearchQuery, { limit: 50 }).map((r) => ({
      name: r.item.name,
      desc: r.item.shortDesc || r.item.desc,
    }));
  }, [abilitiesList, abilitySearchQuery]);

  const STAT_LABELS: Record<StatName, string> = {
    hp: 'HP',
    atk: 'Attack',
    def: 'Defense',
    spa: 'Sp. Atk.',
    spd: 'Sp. Def.',
    spe: 'Speed',
  };

  return (
    <div className="card p-6 space-y-6 select-none" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
      {/* Top Action Bar */}
      <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: 'var(--border-primary)' }}>
        <div className="flex items-center gap-3">
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400">
              Nickname
            </label>
            <input
              type="text"
              value={pokemon.nickname}
              onChange={(e) => onUpdate({ nickname: e.target.value })}
              placeholder={pokemon.species}
              className="rounded-lg border px-3 py-1.5 text-sm font-bold outline-none focus:border-indigo-500"
              style={{
                background: 'var(--bg-secondary)',
                borderColor: 'var(--border-primary)',
                color: 'var(--text-primary)',
              }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopySet}
            className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors"
            style={{ borderColor: 'var(--border-secondary)', color: 'var(--text-primary)' }}
          >
            {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
          <button
            onClick={() => setShowShowdownModal(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors"
            style={{ borderColor: 'var(--border-secondary)', color: 'var(--text-primary)' }}
          >
            <FileText className="h-3.5 w-3.5 text-indigo-400" />
            Import/Export
          </button>
          <button
            onClick={onDelete}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/20 px-3 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </button>
        </div>
      </div>

      {/* Top Card */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
        {/* Sprite Box */}
        <div className="md:col-span-3 card p-4 flex flex-col items-center gap-2 text-center" style={{ background: 'var(--bg-secondary)' }}>
          <PokemonSprite
            name={pokemon.species}
            dexNum={currentSpeciesData?.num || 0}
            size={110}
            shiny={pokemon.isShiny}
            animated
          />
          <div className="w-full space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Pokémon / Form</span>
            {/* Form selector if a species is already chosen */}
            {availableForms.length > 1 && (
              <select
                value={pokemon.species}
                onChange={(e) => handleSpeciesChange(e.target.value)}
                className="w-full rounded-lg border px-2 py-1.5 text-xs font-bold outline-none cursor-pointer mb-1"
                style={{
                  background: 'var(--bg-card)',
                  borderColor: 'var(--border-primary)',
                  color: 'var(--text-primary)',
                }}
              >
                {availableForms.map((f) => (
                  <option key={f.name} value={f.name}>
                    {f.name} (BST: {f.bst})
                  </option>
                ))}
              </select>
            )}
            <button
              onClick={() => {
                setPokemonPickerOpen(true);
                setPokemonSearchQuery('');
                setPokemonTypeFilter('All');
                setPokemonGenFilter('All');
              }}
              className="w-full rounded-lg border px-2 py-1.5 text-xs font-bold outline-none cursor-pointer text-left truncate transition-colors hover:border-indigo-500"
              style={{
                background: 'var(--bg-card)',
                borderColor: 'var(--border-primary)',
                color: pokemon.species ? 'var(--text-primary)' : 'var(--text-tertiary)',
              }}
            >
              {pokemon.species || 'Choose Pokémon...'}
            </button>
          </div>
        </div>

        {/* Details, Item, Ability */}
        <div className="md:col-span-4 space-y-3">
          <div className="card p-3 space-y-3" style={{ background: 'var(--bg-secondary)' }}>
            <span className="text-[10px] uppercase font-bold text-slate-400">Details</span>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div>
                <span className="text-[10px] text-slate-400 block">Level</span>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={pokemon.level}
                  onChange={(e) =>
                    onUpdate({ level: Math.min(100, Math.max(1, parseInt(e.target.value) || 1)) })
                  }
                  className="w-full text-center rounded border py-1 text-xs font-bold outline-none"
                  style={{ background: 'var(--bg-card)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                />
              </div>

              <div>
                <span className="text-[10px] text-slate-400 block">Gender</span>
                <select
                  value={pokemon.gender || ''}
                  onChange={(e) => onUpdate({ gender: (e.target.value as Gender) || null })}
                  className="w-full text-center rounded border py-1 text-xs font-bold outline-none"
                  style={{ background: 'var(--bg-card)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                >
                  <option value="">—</option>
                  <option value="M">M</option>
                  <option value="F">F</option>
                  <option value="N">N</option>
                </select>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 block">Shiny</span>
                <button
                  onClick={() => onUpdate({ isShiny: !pokemon.isShiny })}
                  className="w-full rounded border py-1 text-xs font-bold transition-colors"
                  style={{
                    background: pokemon.isShiny ? 'var(--color-primary)' : 'var(--bg-card)',
                    color: pokemon.isShiny ? '#fff' : 'var(--text-primary)',
                    borderColor: 'var(--border-primary)',
                  }}
                >
                  {pokemon.isShiny ? 'Yes' : 'No'}
                </button>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 block">Tera Type</span>
                <select
                  value={pokemon.teraType || ''}
                  onChange={(e) => onUpdate({ teraType: (e.target.value as PokemonType) || '' })}
                  className="w-full text-center rounded border py-1 text-xs font-bold outline-none"
                  style={{ background: 'var(--bg-card)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                >
                  <option value="">(None)</option>
                  {typesList.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Item & Ability Inputs */}
            <div className="space-y-2 pt-1 border-t" style={{ borderColor: 'var(--border-primary)' }}>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Item</span>
                  {currentSpeciesData?.types && (
                    <div className="flex gap-1">
                      {currentSpeciesData.types.map((t) => (
                        <TypeBadge key={t} type={t as PokemonType} size="sm" />
                      ))}
                    </div>
                  )}
                </div>
                <input
                  type="text"
                  value={pokemon.item}
                  onClick={() => setActiveSection('items')}
                  onFocus={() => setActiveSection('items')}
                  onChange={(e) => onUpdate({ item: e.target.value })}
                  placeholder="Select item..."
                  className={`w-full rounded border px-2.5 py-1.5 text-xs font-semibold outline-none transition-all cursor-pointer ${
                    activeSection === 'items' ? 'border-blue-500 ring-2 ring-blue-500/40 bg-blue-950/20' : ''
                  }`}
                  style={{
                    background: activeSection === 'items' ? undefined : 'var(--bg-card)',
                    borderColor: activeSection === 'items' ? undefined : 'var(--border-primary)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Ability</span>
                <input
                  type="text"
                  value={pokemon.ability}
                  onClick={() => setActiveSection('abilities')}
                  onFocus={() => setActiveSection('abilities')}
                  onChange={(e) => onUpdate({ ability: e.target.value })}
                  placeholder="Select ability..."
                  className={`w-full rounded border px-2.5 py-1.5 text-xs font-semibold outline-none transition-all cursor-pointer ${
                    activeSection === 'abilities' ? 'border-blue-500 ring-2 ring-blue-500/40 bg-blue-950/20' : ''
                  }`}
                  style={{
                    background: activeSection === 'abilities' ? undefined : 'var(--bg-card)',
                    borderColor: activeSection === 'abilities' ? undefined : 'var(--border-primary)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Moves Box */}
        <div
          onClick={() => setActiveSection('moves')}
          className={`md:col-span-3 card p-3 space-y-2 cursor-pointer transition-all ${
            activeSection === 'moves' ? 'border-blue-500 ring-2 ring-blue-500/30' : ''
          }`}
          style={{ background: 'var(--bg-secondary)' }}
        >
          <span className="text-[10px] uppercase font-bold text-slate-400">Moves</span>
          <div className="space-y-2">
            {pokemon.moves.map((moveName, slotIndex) => {
              const isSlotActive = activeSection === 'moves' && activeMoveSlot === slotIndex;
              return (
                <button
                  key={slotIndex}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveSection('moves');
                    setActiveMoveSlot(slotIndex);
                  }}
                  className={`w-full text-left rounded-lg border px-3 py-2 text-xs font-semibold flex items-center justify-between transition-all ${
                    isSlotActive ? 'border-blue-500 ring-2 ring-blue-500/40 bg-blue-950/20' : ''
                  }`}
                  style={{
                    background: isSlotActive ? undefined : 'var(--bg-card)',
                    borderColor: isSlotActive ? undefined : 'var(--border-primary)',
                    color: moveName ? 'var(--text-primary)' : 'var(--text-tertiary)',
                  }}
                >
                  <span className="truncate">{moveName || `Move ${slotIndex + 1}`}</span>
                  <ChevronDown className="h-3.5 w-3.5 opacity-50 flex-shrink-0" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Stats Summary Box */}
        <div
          onClick={() => setActiveSection('stats')}
          className={`md:col-span-2 card p-3 space-y-2 font-mono text-xs cursor-pointer transition-all ${
            activeSection === 'stats' ? 'border-blue-500 ring-2 ring-blue-500/30' : ''
          }`}
          style={{ background: 'var(--bg-secondary)' }}
        >
          <div className="flex items-center justify-between border-b pb-1" style={{ borderColor: 'var(--border-primary)' }}>
            <span className="text-[10px] uppercase font-bold text-slate-400 font-sans">Stats</span>
            <span className="text-[10px] text-slate-400 font-sans">EV</span>
          </div>

          <div className="space-y-1.5">
            {(['hp', 'atk', 'def', 'spa', 'spd', 'spe'] as StatName[]).map((stat) => {
              const ev = pokemon.evs[stat];
              const isPlus = currentNature.plus === stat;
              const isMinus = currentNature.minus === stat;

              return (
                <div key={stat} className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 w-8">
                    {stat.toUpperCase().slice(0, 3)}
                  </span>
                  <div className="flex-1 mx-2 h-1.5 rounded-full bg-slate-700 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(100, (baseStats[stat] / 200) * 100)}%`,
                        backgroundColor: STAT_COLORS[stat],
                      }}
                    />
                  </div>
                  <span className="text-right w-10 font-bold" style={{ color: 'var(--text-primary)' }}>
                    {ev > 0 ? `${ev}${isPlus ? '+' : isMinus ? '-' : ''}` : '—'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* DYNAMIC LOWER PANEL SECTION */}

      {/* PANEL 1: MOVES LIST */}
      {activeSection === 'moves' && (
        <div className="card p-5 space-y-4" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
          {activeMoveDetail ? (
            <div className="card p-4 space-y-2 border-indigo-500/30" style={{ background: 'var(--bg-card)' }}>
              <div className="flex items-center gap-3">
                <span className="font-bold text-base text-white">{activeMoveDetail.name}</span>
                <TypeBadge type={activeMoveDetail.type} size="sm" />
                <span className="text-xs px-2 py-0.5 rounded font-mono bg-slate-800 text-slate-300 font-semibold">
                  {activeMoveDetail.category}
                </span>
                <div className="flex items-center gap-4 text-xs font-mono text-slate-300 ml-auto">
                  <span>Power: <strong className="text-white">{activeMoveDetail.basePower || '—'}</strong></span>
                  <span>Accuracy: <strong className="text-white">{activeMoveDetail.accuracy === true ? '100%' : `${activeMoveDetail.accuracy}%`}</strong></span>
                  <span>PP: <strong className="text-white">{activeMoveDetail.pp}</strong></span>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {activeMoveDetail.desc || activeMoveDetail.shortDesc || 'No description available.'}
              </p>
            </div>
          ) : (
            <div className="text-xs text-slate-400 italic">
              Select move slot {activeMoveSlot + 1} to pick a move.
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 border rounded-xl px-3 py-2 flex-1 min-w-[240px]" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
              <Search className="h-4 w-4 text-slate-400" />
              <input
                value={moveSearchQuery}
                onChange={(e) => setMoveSearchQuery(e.target.value)}
                placeholder="Search moves..."
                className="flex-1 bg-transparent text-xs outline-none text-white"
              />
            </div>

            {/* Toggle to show/hide illegal moves */}
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

          {/* Category Filter */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-bold uppercase text-slate-500">Category:</span>
            {(['All', 'Physical', 'Special', 'Status'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setMoveCategoryFilter(cat)}
                className="px-2 py-0.5 rounded-lg transition-colors font-medium text-[10px]"
                style={{
                  background: moveCategoryFilter === cat ? 'var(--color-primary)' : 'var(--bg-card)',
                  color: moveCategoryFilter === cat ? '#fff' : 'var(--text-secondary)',
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Type Filter for Moves */}
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-[10px] font-bold uppercase text-slate-500 mr-1">Type:</span>
            <button
              onClick={() => setMoveTypeFilter('All')}
              className="px-2 py-0.5 rounded-lg transition-colors font-medium text-[10px] border"
              style={{
                background: moveTypeFilter === 'All' ? 'var(--color-primary)' : 'var(--bg-card)',
                color: moveTypeFilter === 'All' ? '#fff' : 'var(--text-secondary)',
                borderColor: moveTypeFilter === 'All' ? 'transparent' : 'var(--border-primary)',
              }}
            >
              All
            </button>
            {POKEMON_TYPES.map((type) => {
              const colors = TYPE_COLORS[type] ?? TYPE_COLORS['Normal'];
              const isActive = moveTypeFilter === type;
              return (
                <button
                  key={type}
                  onClick={() => setMoveTypeFilter(moveTypeFilter === type ? 'All' : type)}
                  className="px-2 py-0.5 rounded-lg transition-all font-semibold uppercase tracking-wide text-[10px] border"
                  style={{
                    background: isActive ? colors.bg : 'var(--bg-card)',
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

          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b pb-2 flex justify-between px-2" style={{ borderColor: 'var(--border-primary)' }}>
            <span>Learnable Moves for {pokemon.species}</span>
            <span>Name / Type / Cat / Power / Acc / PP</span>
          </div>

          <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1">
            {filteredMoves.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                No moves found.
              </div>
            ) : (
              filteredMoves.map((move) => (
                <button
                  key={move.id}
                  onClick={() => handleSelectMove(move.name)}
                  className={`w-full card card-interactive p-2.5 flex items-center justify-between text-left transition-all hover:border-blue-500 ${
                    move.isIllegal ? 'border-amber-500/40 bg-amber-950/10' : ''
                  }`}
                  style={{ background: move.isIllegal ? undefined : 'var(--bg-card)' }}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="font-semibold text-xs text-white truncate w-36 flex items-center gap-1.5">
                      {move.name}
                    </span>
                    <TypeBadge type={move.type} size="sm" />
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-slate-800 text-slate-300 font-semibold">
                      {move.category}
                    </span>

                    {/* Requirement 2: ILLEGAL badge for moves species cannot learn */}
                    {move.isIllegal && (
                      <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded font-mono bg-rose-950 text-rose-400 font-bold border border-rose-500/40">
                        <AlertTriangle className="h-3 w-3 text-rose-400" />
                        ILLEGAL
                      </span>
                    )}

                    <span className="text-xs text-slate-400 truncate flex-1 hidden sm:inline">
                      {move.shortDesc || move.desc}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-mono flex-shrink-0 ml-2">
                    <span className="w-12 text-right">Pow {move.basePower || '—'}</span>
                    <span className="w-16 text-right">Acc {move.accuracy === true ? '100%' : `${move.accuracy}%`}</span>
                    <span className="w-10 text-right">PP {move.pp}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* PANEL 2: EVS & IVS SLIDERS PANEL */}
      {activeSection === 'stats' && (
        <div className="card p-5 space-y-4" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
          <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--border-primary)' }}>
            <div className="flex items-center gap-4">
              <h3 className="font-bold text-sm text-white">EVs & IVs Editor</h3>

              <div className="flex items-center gap-1 rounded-lg border p-0.5 text-xs" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
                <button
                  onClick={() => setEvMode('standard')}
                  className={`px-2.5 py-1 rounded font-semibold transition-colors ${
                    evMode === 'standard' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Gen 9 (510 EVs)
                </button>
                <button
                  onClick={() => setEvMode('champions')}
                  className={`px-2.5 py-1 rounded font-semibold transition-colors ${
                    evMode === 'champions' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Pokémon Champions (66 Points)
                </button>
              </div>
            </div>

            <div className="text-xs font-mono font-semibold" style={{ color: remainingEVs < 0 ? '#EF4444' : 'var(--text-secondary)' }}>
              Remaining: <span className="text-white font-bold">{remainingEVs}</span> / {maxTotalEVs} {evMode === 'champions' ? 'pts' : 'EVs'}
            </div>
          </div>

          <div className="space-y-3 pt-1">
            <div className="grid grid-cols-12 gap-3 text-xs font-bold uppercase tracking-wider text-slate-400 pb-1 border-b border-slate-700/50">
              <div className="col-span-3 sm:col-span-2">Stat</div>
              <div className="col-span-2 sm:col-span-2">Base</div>
              <div className="col-span-2 sm:col-span-2 text-center">EVs</div>
              <div className="col-span-3 sm:col-span-4 text-center">EV Slider</div>
              <div className="col-span-2 sm:col-span-1 text-center">IVs</div>
              <div className="hidden sm:block sm:col-span-1 text-right">Total</div>
            </div>

            {(['hp', 'atk', 'def', 'spa', 'spd', 'spe'] as StatName[]).map((stat) => {
              const base = baseStats[stat];
              const ev = pokemon.evs[stat];
              const iv = pokemon.ivs[stat];
              const calc = calculatedStats[stat];
              const isPlus = currentNature.plus === stat;
              const isMinus = currentNature.minus === stat;

              const formattedEvString = ev > 0 ? `${ev}${isPlus ? '+' : isMinus ? '-' : ''}` : isPlus ? '0+' : isMinus ? '0-' : '—';

              return (
                <div key={stat} className="grid grid-cols-12 gap-3 items-center text-xs">
                  <div className="col-span-3 sm:col-span-2 font-bold flex items-center gap-1" style={{ color: 'var(--text-primary)' }}>
                    {STAT_LABELS[stat]}
                    {isPlus && <span className="text-emerald-400 font-extrabold text-sm">+</span>}
                    {isMinus && <span className="text-rose-400 font-extrabold text-sm">-</span>}
                  </div>

                  <div className="col-span-2 sm:col-span-2 flex items-center gap-2">
                    <span className="font-mono font-bold w-7" style={{ color: 'var(--text-primary)' }}>
                      {base}
                    </span>
                    <div className="hidden sm:block flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-tertiary)' }}>
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(100, (base / 180) * 100)}%`,
                          backgroundColor: STAT_COLORS[stat],
                        }}
                      />
                    </div>
                  </div>

                  <div className="col-span-2 sm:col-span-2 flex justify-center">
                    {editingEvStat === stat ? (
                      <input
                        autoFocus
                        type="number"
                        min={0}
                        max={maxPerStatEV}
                        value={ev || ''}
                        onChange={(e) => handleEVChange(stat, parseInt(e.target.value) || 0)}
                        onBlur={() => setEditingEvStat(null)}
                        className="w-16 text-center rounded border py-1 font-mono font-bold text-xs outline-none focus:border-indigo-500"
                        style={{
                          background: 'var(--bg-card)',
                          borderColor: 'var(--border-primary)',
                          color: 'var(--text-primary)',
                        }}
                      />
                    ) : (
                      <button
                        onClick={() => setEditingEvStat(stat)}
                        className="w-16 text-center rounded border py-1 font-mono font-bold text-xs transition-colors hover:border-indigo-500"
                        style={{
                          background: 'var(--bg-card)',
                          borderColor: 'var(--border-primary)',
                          color: isPlus ? '#34D399' : isMinus ? '#F87171' : 'var(--text-primary)',
                        }}
                      >
                        {formattedEvString}
                      </button>
                    )}
                  </div>

                  <div className="col-span-3 sm:col-span-4 flex items-center px-1">
                    <input
                      type="range"
                      min={0}
                      max={maxPerStatEV}
                      step={evStep}
                      value={ev}
                      onChange={(e) => handleEVChange(stat, parseInt(e.target.value) || 0)}
                      className="w-full accent-indigo-500 cursor-pointer"
                    />
                  </div>

                  <div className="col-span-2 sm:col-span-1 flex justify-center">
                    <input
                      type="number"
                      min={0}
                      max={31}
                      value={iv}
                      onChange={(e) => handleIVChange(stat, parseInt(e.target.value) || 0)}
                      className="w-12 text-center rounded border py-1 font-mono font-semibold text-xs outline-none focus:border-indigo-500"
                      style={{
                        background: 'var(--bg-card)',
                        borderColor: 'var(--border-primary)',
                        color: 'var(--text-primary)',
                      }}
                    />
                  </div>

                  <div className="hidden sm:block sm:col-span-1 text-right font-mono font-bold text-sm text-indigo-400">
                    {calc}
                    {isPlus && <span className="text-emerald-400 text-xs">+</span>}
                    {isMinus && <span className="text-rose-400 text-xs">-</span>}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t" style={{ borderColor: 'var(--border-primary)' }}>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>
                Nature:
              </span>
              <select
                value={pokemon.nature}
                onChange={(e) => onUpdate({ nature: e.target.value })}
                className="rounded-lg border px-3 py-1.5 text-xs font-bold outline-none cursor-pointer"
                style={{
                  background: 'var(--bg-card)',
                  borderColor: 'var(--border-primary)',
                  color: 'var(--text-primary)',
                }}
              >
                {naturesList.map((n) => (
                  <option key={n.name} value={n.name}>
                    {n.name} {n.plus ? `(+${STAT_NAMES[n.plus]}, -${STAT_NAMES[n.minus!]})` : '(Neutral)'}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>
                IV Spreads:
              </span>
              <select
                onChange={(e) => applyIVPreset(e.target.value)}
                className="rounded-lg border px-3 py-1.5 text-xs font-medium outline-none cursor-pointer"
                style={{
                  background: 'var(--bg-card)',
                  borderColor: 'var(--border-primary)',
                  color: 'var(--text-primary)',
                }}
              >
                <option value="31-all">31/31/31/31/31/31 (All 31s)</option>
                <option value="0-atk">31/0/31/31/31/31 (0 Atk - Special Attacker)</option>
                <option value="0-spe">31/31/31/31/31/0 (0 Spe - Trick Room)</option>
                <option value="0-atk-0-spe">31/0/31/31/31/0 (0 Atk / 0 Spe)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* PANEL 3: ITEMS LIST */}
      {activeSection === 'items' && (
        <div className="card p-5 space-y-4" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
          {activeItemDetail && (
            <div className="card p-3 flex items-center gap-3 border-indigo-500/30" style={{ background: 'var(--bg-card)' }}>
              <div>
                <div className="font-bold text-sm text-white flex items-center gap-2">
                  {activeItemDetail.name}
                  {Dex.items.get(pokemon.item)?.megaStone && (
                    <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-purple-900/60 text-purple-300 font-bold border border-purple-500/30">
                      Mega Stone
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-300">{activeItemDetail.desc}</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 border rounded-xl px-3 py-2" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
            <Search className="h-4 w-4 text-slate-400" />
            <input
              value={itemSearchQuery}
              onChange={(e) => setItemSearchQuery(e.target.value)}
              placeholder="Search items or Mega Stones..."
              className="flex-1 bg-transparent text-xs outline-none text-white"
            />
          </div>

          {!itemSearchQuery.trim() && (
            <div className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-purple-400 border-b pb-1" style={{ borderColor: 'var(--border-primary)' }}>
                Mega Stones
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {megaStonesList.slice(0, 18).map((item) => (
                  <button
                    key={item.name}
                    onClick={() => handleSelectItem(item.name)}
                    className={`card card-interactive p-2.5 flex items-center justify-between text-left transition-all hover:border-purple-500 ${
                      pokemon.item === item.name ? 'border-purple-500 bg-purple-950/20' : ''
                    }`}
                    style={{ background: pokemon.item === item.name ? undefined : 'var(--bg-card)' }}
                  >
                    <div className="space-y-0.5 flex-1 min-w-0">
                      <div className="font-bold text-xs text-white truncate">{item.name}</div>
                      <div className="text-[10px] text-slate-400 truncate">{item.desc || 'Mega Stone'}</div>
                    </div>
                    {pokemon.item === item.name && (
                      <Check className="h-4 w-4 text-purple-400 flex-shrink-0 ml-2" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b pb-1" style={{ borderColor: 'var(--border-primary)' }}>
              {itemSearchQuery.trim() ? 'Search Results' : 'Popular Items'}
            </div>
            <div className="space-y-1.5 max-h-[350px] overflow-y-auto pr-1">
              {filteredItems.map((item) => (
                <button
                  key={item.name}
                  onClick={() => handleSelectItem(item.name)}
                  className={`w-full card card-interactive p-2.5 flex items-center justify-between text-left transition-all hover:border-blue-500 ${
                    pokemon.item === item.name ? 'border-blue-500 bg-blue-950/20' : ''
                  }`}
                  style={{ background: pokemon.item === item.name ? undefined : 'var(--bg-card)' }}
                >
                  <div className="space-y-0.5 flex-1 min-w-0">
                    <div className="font-bold text-xs text-white flex items-center gap-2">
                      {item.name}
                      {item.isMegaStone && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded font-mono bg-purple-900/60 text-purple-300 font-semibold">
                          Mega Stone
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 truncate">{item.desc}</div>
                  </div>
                  {pokemon.item === item.name && (
                    <Check className="h-4 w-4 text-blue-400 flex-shrink-0 ml-2" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* PANEL 4: ABILITIES LIST */}
      {activeSection === 'abilities' && (
        <div className="card p-5 space-y-4" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
          {activeAbilityDetail && (
            <div className="card p-3 space-y-1 border-indigo-500/30" style={{ background: 'var(--bg-card)' }}>
              <div className="font-bold text-sm text-white">{activeAbilityDetail.name}</div>
              <p className="text-xs text-slate-300">{activeAbilityDetail.desc}</p>
            </div>
          )}

          <div className="flex items-center gap-3 border rounded-xl px-3 py-2" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
            <Search className="h-4 w-4 text-slate-400" />
            <input
              value={abilitySearchQuery}
              onChange={(e) => setAbilitySearchQuery(e.target.value)}
              placeholder="Search abilities..."
              className="flex-1 bg-transparent text-xs outline-none text-white"
            />
          </div>

          {abilitySearchQuery.trim() ? (
            <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1">
              {filteredAbilities.map((ab) => (
                <button
                  key={ab.name}
                  onClick={() => handleSelectAbility(ab.name)}
                  className={`w-full card card-interactive p-2.5 flex items-center justify-between text-left transition-all hover:border-blue-500 ${
                    pokemon.ability === ab.name ? 'border-blue-500 bg-blue-950/20' : ''
                  }`}
                  style={{ background: pokemon.ability === ab.name ? undefined : 'var(--bg-card)' }}
                >
                  <div className="space-y-0.5 flex-1 min-w-0">
                    <div className="font-bold text-xs text-white">{ab.name}</div>
                    <div className="text-xs text-slate-400 truncate">{ab.desc}</div>
                  </div>
                  {pokemon.ability === ab.name && (
                    <Check className="h-4 w-4 text-blue-400 flex-shrink-0 ml-2" />
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {speciesAbilities.primary.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b pb-1" style={{ borderColor: 'var(--border-primary)' }}>
                    Abilities for {pokemon.species}
                  </div>
                  {speciesAbilities.primary.map((ab) => (
                    <button
                      key={ab.name}
                      onClick={() => handleSelectAbility(ab.name)}
                      className={`w-full card card-interactive p-3 text-left space-y-1 transition-all hover:border-blue-500 ${
                        pokemon.ability === ab.name ? 'border-blue-500 bg-blue-950/20' : ''
                      }`}
                      style={{ background: pokemon.ability === ab.name ? undefined : 'var(--bg-card)' }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-white">{ab.name}</span>
                        {pokemon.ability === ab.name && (
                          <Check className="h-4 w-4 text-blue-400" />
                        )}
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">{ab.desc}</p>
                    </button>
                  ))}
                </div>
              )}

              {speciesAbilities.hidden.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-amber-400 border-b pb-1" style={{ borderColor: 'var(--border-primary)' }}>
                    Hidden Ability
                  </div>
                  {speciesAbilities.hidden.map((ab) => (
                    <button
                      key={ab.name}
                      onClick={() => handleSelectAbility(ab.name)}
                      className={`w-full card card-interactive p-3 text-left space-y-1 transition-all hover:border-blue-500 ${
                        pokemon.ability === ab.name ? 'border-blue-500 bg-blue-950/20' : ''
                      }`}
                      style={{ background: pokemon.ability === ab.name ? undefined : 'var(--bg-card)' }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-white">{ab.name}</span>
                        {pokemon.ability === ab.name && (
                          <Check className="h-4 w-4 text-blue-400" />
                        )}
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">{ab.desc}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Showdown Import/Export Modal */}
      {showShowdownModal && (
        <ShowdownPasteModal
          isOpen={showShowdownModal}
          onClose={() => setShowShowdownModal(false)}
          mode="single"
          currentPokemon={pokemon}
          onImportSingle={(importedPokemon) => {
            onUpdate(importedPokemon);
          }}
        />
      )}

      {/* Pokémon Picker Modal */}
      <AnimatePresence>
        {pokemonPickerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[130] bg-black/60 backdrop-blur-sm"
              onClick={() => setPokemonPickerOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.2 }}
              className="fixed left-1/2 top-[5%] z-[131] w-[95%] max-w-3xl -translate-x-1/2 rounded-2xl border flex flex-col"
              style={{
                background: 'var(--bg-card)',
                borderColor: 'var(--border-primary)',
                boxShadow: 'var(--shadow-xl)',
                maxHeight: '88vh',
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--border-primary)' }}>
                <h3 className="font-bold text-base text-white">Choose Pokémon</h3>
                <button
                  onClick={() => setPokemonPickerOpen(false)}
                  className="text-xs px-2.5 py-1 rounded-lg"
                  style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
                >
                  ESC
                </button>
              </div>

              {/* Filters */}
              <div className="p-4 space-y-3 border-b" style={{ borderColor: 'var(--border-primary)' }}>
                {/* Search */}
                <div className="flex items-center gap-3 border rounded-xl px-3 py-2" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
                  <Search className="h-4 w-4 text-slate-400 flex-shrink-0" />
                  <input
                    autoFocus
                    value={pokemonSearchQuery}
                    onChange={(e) => setPokemonSearchQuery(e.target.value)}
                    placeholder="Search Pokémon or form (e.g. Charizard, Charizard-Gmax)..."
                    className="flex-1 bg-transparent text-sm outline-none text-white"
                  />
                </div>

                {/* Generation Filter */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-bold uppercase text-slate-500 mr-1">Gen:</span>
                  <button
                    onClick={() => setPokemonGenFilter('All')}
                    className="px-2.5 py-1 rounded-lg transition-colors font-medium text-[10px] border"
                    style={{
                      background: pokemonGenFilter === 'All' ? 'var(--color-primary)' : 'var(--bg-secondary)',
                      color: pokemonGenFilter === 'All' ? '#fff' : 'var(--text-secondary)',
                      borderColor: pokemonGenFilter === 'All' ? 'transparent' : 'var(--border-primary)',
                    }}
                  >
                    All
                  </button>
                  {GENERATIONS.map((gen) => (
                    <button
                      key={gen.num}
                      onClick={() => setPokemonGenFilter(pokemonGenFilter === gen.num ? 'All' : gen.num)}
                      className="px-2.5 py-1 rounded-lg transition-all font-medium text-[10px] border"
                      style={{
                        background: pokemonGenFilter === gen.num ? 'var(--color-primary)' : 'var(--bg-secondary)',
                        color: pokemonGenFilter === gen.num ? '#fff' : 'var(--text-secondary)',
                        borderColor: pokemonGenFilter === gen.num ? 'transparent' : 'var(--border-primary)',
                      }}
                    >
                      {gen.name}
                      <span className="ml-1 opacity-60">({gen.region})</span>
                    </button>
                  ))}
                </div>

                {/* Type Filter */}
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="text-[10px] font-bold uppercase text-slate-500 mr-1">Type:</span>
                  <button
                    onClick={() => setPokemonTypeFilter('All')}
                    className="px-2.5 py-1 rounded-lg transition-colors font-medium text-[10px] border"
                    style={{
                      background: pokemonTypeFilter === 'All' ? 'var(--color-primary)' : 'var(--bg-secondary)',
                      color: pokemonTypeFilter === 'All' ? '#fff' : 'var(--text-secondary)',
                      borderColor: pokemonTypeFilter === 'All' ? 'transparent' : 'var(--border-primary)',
                    }}
                  >
                    All
                  </button>
                  {POKEMON_TYPES.map((type) => {
                    const colors = TYPE_COLORS[type] ?? TYPE_COLORS['Normal'];
                    const isActive = pokemonTypeFilter === type;
                    return (
                      <button
                        key={type}
                        onClick={() => setPokemonTypeFilter(pokemonTypeFilter === type ? 'All' : type)}
                        className="px-2.5 py-1 rounded-lg transition-all font-semibold uppercase tracking-wide text-[10px] border"
                        style={{
                          background: isActive ? colors.bg : 'var(--bg-secondary)',
                          color: isActive ? colors.text : 'var(--text-tertiary)',
                          borderColor: isActive ? colors.bg : 'var(--border-primary)',
                          opacity: isActive ? 1 : 0.7,
                        }}
                      >
                        {type}
                      </button>
                    );
                  })}
                </div>

                {/* Result count */}
                <div className="text-[11px] text-slate-500">
                  Showing <span className="text-slate-300 font-semibold">{filteredPokemon.length}</span> Pokémon
                  {pokemonTypeFilter !== 'All' && <span> · Type: <span className="text-white">{pokemonTypeFilter}</span></span>}
                  {pokemonGenFilter !== 'All' && <span> · {GENERATIONS.find(g => g.num === pokemonGenFilter)?.name}</span>}
                </div>
              </div>

              {/* Grid */}
              <div className="overflow-y-auto p-3" style={{ flex: 1 }}>
                {filteredPokemon.length === 0 ? (
                  <div className="text-center py-10 text-sm text-slate-400">No Pokémon found.</div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                    {filteredPokemon.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => {
                          handleSpeciesChange(s.name);
                          setPokemonPickerOpen(false);
                        }}
                        className={`flex flex-col items-center gap-1 rounded-xl p-2 text-center border transition-all hover:border-indigo-500 hover:scale-105 ${
                          pokemon.species === s.name ? 'border-indigo-500 ring-2 ring-indigo-500/30' : ''
                        }`}
                        style={{
                          background: pokemon.species === s.name ? 'rgba(99,102,241,0.15)' : 'var(--bg-secondary)',
                          borderColor: pokemon.species === s.name ? undefined : 'var(--border-primary)',
                        }}
                      >
                        <PokemonSprite name={s.name} dexNum={s.num} size={52} animated={false} />
                        <div className="text-[10px] font-semibold text-white leading-tight truncate w-full">
                          {s.name}
                        </div>
                        <div className="flex gap-0.5 flex-wrap justify-center">
                          {s.types.map((t) => (
                            <TypeBadge key={t} type={t as PokemonType} size="sm" />
                          ))}
                        </div>
                        <div className="text-[9px] text-slate-500 font-mono">BST {s.bst}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
