'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calculator, Swords, Shield, Zap, FileText, Check, RotateCcw, Copy, Download, Upload } from 'lucide-react';
import { calculate, Pokemon, Move, Field } from '@smogon/calc';
import { Dex } from '@pkmn/dex';
import { useTeamStore } from '@/stores/team-store';
import {
  getAllSpecies,
  getAllMoves,
  getAllItems,
  getAllAbilities,
  getAllNatures,
  getAllTypes,
  getSpecies,
  calculateStat,
} from '@/lib/pokemon/data-provider';
import { parseShowdownSet, exportShowdownSet } from '@/lib/pokemon/showdown-parser';
import { PokemonSprite } from '@/components/shared/PokemonSprite';
import { TypeBadge } from '@/components/shared/TypeBadge';
import type { TeamPokemon, PokemonType, StatName, BaseStats, Gender } from '@/types/pokemon';
import { createEmptyPokemon } from '@/types/pokemon';
import { ShowdownPasteModal } from '@/components/team/ShowdownPasteModal';

export interface CalculatorMoveState {
  name: string;
  bp: number;
  type: PokemonType;
  category: 'Physical' | 'Special' | 'Status';
  isCrit: boolean;
  isZ: boolean;
  isMax: boolean;
}

export default function CalculatorPage() {
  const { teams } = useTeamStore();

  // Selected Generation & Game Mode
  const [selectedGen, setSelectedGen] = useState<number>(9);
  const [gameMode, setGameMode] = useState<'onevsone' | 'onevsall' | 'allvsone' | 'champions' | 'random'>('onevsone');
  const [battleFormat, setBattleFormat] = useState<'singles' | 'doubles'>('singles');

  // Attacker & Defender states
  const [attacker, setAttacker] = useState<TeamPokemon>(() => {
    const p = createEmptyPokemon();
    p.species = 'Abomasnow';
    p.ability = 'Snow Warning';
    p.item = 'Eject Pack';
    p.moves = ['Leaf Storm', 'Blizzard', 'Earth Power', 'Aurora Veil'];
    p.evs = { hp: 0, atk: 0, def: 4, spa: 252, spd: 0, spe: 252 };
    p.ivs = { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 };
    p.nature = 'Timid';
    p.level = 100;
    return p;
  });

  const [defender, setDefender] = useState<TeamPokemon>(() => {
    const p = createEmptyPokemon();
    p.species = 'Abomasnow';
    p.ability = 'Snow Warning';
    p.item = 'Eject Pack';
    p.moves = ['Leaf Storm', 'Blizzard', 'Earth Power', 'Aurora Veil'];
    p.evs = { hp: 0, atk: 0, def: 4, spa: 252, spd: 0, spe: 252 };
    p.ivs = { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 };
    p.nature = 'Timid';
    p.level = 100;
    return p;
  });

  // Interactive 4 Moves State for Attacker & Defender
  const [attackerMovesState, setAttackerMovesState] = useState<CalculatorMoveState[]>([
    { name: 'Leaf Storm', bp: 130, type: 'Grass', category: 'Special', isCrit: false, isZ: false, isMax: false },
    { name: 'Blizzard', bp: 110, type: 'Ice', category: 'Special', isCrit: false, isZ: false, isMax: false },
    { name: 'Earth Power', bp: 90, type: 'Ground', category: 'Special', isCrit: false, isZ: false, isMax: false },
    { name: 'Aurora Veil', bp: 0, type: 'Ice', category: 'Status', isCrit: false, isZ: false, isMax: false },
  ]);

  const [defenderMovesState, setDefenderMovesState] = useState<CalculatorMoveState[]>([
    { name: 'Leaf Storm', bp: 130, type: 'Grass', category: 'Special', isCrit: false, isZ: false, isMax: false },
    { name: 'Blizzard', bp: 110, type: 'Ice', category: 'Special', isCrit: false, isZ: false, isMax: false },
    { name: 'Earth Power', bp: 90, type: 'Ground', category: 'Special', isCrit: false, isZ: false, isMax: false },
    { name: 'Aurora Veil', bp: 0, type: 'Ice', category: 'Status', isCrit: false, isZ: false, isMax: false },
  ]);

  // Stat Boosts (-6 to +6)
  const [attackerBoosts, setAttackerBoosts] = useState<Record<StatName, number>>({
    hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0,
  });

  const [defenderBoosts, setDefenderBoosts] = useState<Record<StatName, number>>({
    hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0,
  });

  // Status
  const [attackerStatus, setAttackerStatus] = useState<string>('Healthy');
  const [defenderStatus, setDefenderStatus] = useState<string>('Healthy');

  // HP Percentages
  const [attackerHpPercent, setAttackerHpPercent] = useState<number>(100);
  const [defenderHpPercent, setDefenderHpPercent] = useState<number>(100);

  // Selected Move Index (0 to 3)
  const [selectedMoveIndex, setSelectedMoveIndex] = useState<number>(1);

  // Field states
  const [weather, setWeather] = useState<'Sun' | 'Rain' | 'Sand' | 'Snow' | ''>('Snow');
  const [terrain, setTerrain] = useState<'Electric' | 'Grassy' | 'Misty' | 'Psychic' | ''>('');
  const [isMagicRoom, setIsMagicRoom] = useState(false);
  const [isWonderRoom, setIsWonderRoom] = useState(false);
  const [isGravity, setIsGravity] = useState(false);

  // Hazards & Side Conditions
  const [p1StealthRock, setP1StealthRock] = useState(false);
  const [p1Spikes, setP1Spikes] = useState(0);
  const [p1Reflect, setP1Reflect] = useState(false);
  const [p1LightScreen, setP1LightScreen] = useState(false);
  const [p1AuroraVeil, setP1AuroraVeil] = useState(false);

  const [p2StealthRock, setP2StealthRock] = useState(false);
  const [p2Spikes, setP2Spikes] = useState(0);
  const [p2Reflect, setP2Reflect] = useState(false);
  const [p2LightScreen, setP2LightScreen] = useState(false);
  const [p2AuroraVeil, setP2AuroraVeil] = useState(false);
  const [p2HelpingHand, setP2HelpingHand] = useState(false);
  const [p2Tailwind, setP2Tailwind] = useState(false);

  // Preset select dropdown key trackers
  const [p1PresetKey, setP1PresetKey] = useState<string>('');
  const [p2PresetKey, setP2PresetKey] = useState<string>('');

  // Paste Text Box
  const [pasteText, setPasteText] = useState('');
  const [showdownModalTarget, setShowdownModalTarget] = useState<'p1' | 'p2' | null>(null);

  const speciesList = useMemo(() => getAllSpecies(selectedGen), [selectedGen]);
  const itemsList = useMemo(() => getAllItems(selectedGen), [selectedGen]);
  const abilitiesList = useMemo(() => getAllAbilities(selectedGen), [selectedGen]);
  const naturesList = useMemo(() => getAllNatures(), []);
  const typesList = useMemo(() => getAllTypes(), []);

  // Helper to sync move state when move name changes
  const initMoveSlot = (moveName: string): CalculatorMoveState => {
    const dexMove = Dex.moves.get(moveName);
    if (dexMove && dexMove.exists) {
      const isMax = !!dexMove.isMax || dexMove.name.startsWith('Max ') || dexMove.name.startsWith('G-Max');
      const isZ = !!dexMove.isZ;
      return {
        name: dexMove.name,
        bp: dexMove.basePower || (isMax ? 130 : 0),
        type: (dexMove.type as PokemonType) || 'Normal',
        category: (dexMove.category as 'Physical' | 'Special' | 'Status') || 'Physical',
        isCrit: false,
        isZ,
        isMax,
      };
    }
    return {
      name: moveName,
      bp: 0,
      type: 'Normal',
      category: 'Physical',
      isCrit: false,
      isZ: false,
      isMax: false,
    };
  };

  const syncAttackerMoves = (moves: string[]) => {
    const nextState = moves.map((m) => initMoveSlot(m));
    while (nextState.length < 4) {
      nextState.push(initMoveSlot(''));
    }
    setAttackerMovesState(nextState.slice(0, 4));
  };

  const syncDefenderMoves = (moves: string[]) => {
    const nextState = moves.map((m) => initMoveSlot(m));
    while (nextState.length < 4) {
      nextState.push(initMoveSlot(''));
    }
    setDefenderMovesState(nextState.slice(0, 4));
  };

  // Team Presets list
  const teamPresets = useMemo(() => {
    const presets: Array<{ label: string; pokemon: TeamPokemon }> = [];
    teams.forEach((t) => {
      t.pokemon.forEach((p) => {
        if (p.species) {
          presets.push({
            label: `${t.name}: ${p.nickname || p.species}`,
            pokemon: p,
          });
        }
      });
    });
    return presets;
  }, [teams]);

  // Handle Preset Load
  const handleLoadPreset = (indexStr: string, target: 'p1' | 'p2') => {
    if (indexStr === '') return;
    const index = parseInt(indexStr);
    if (isNaN(index)) return;
    const preset = teamPresets[index];
    if (!preset) return;

    const p: TeamPokemon = JSON.parse(JSON.stringify(preset.pokemon));
    if (!p.moves || p.moves.length < 4) {
      const m = ['', '', '', ''];
      (p.moves || []).forEach((move, i) => {
        if (i < 4) m[i] = move;
      });
      p.moves = m as [string, string, string, string];
    }

    if (target === 'p1') {
      setAttacker(p);
      syncAttackerMoves(p.moves);
      setAttackerStatus('Healthy');
      setAttackerHpPercent(100);
      setAttackerBoosts({ hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 });
      setP1PresetKey(indexStr);
    } else {
      setDefender(p);
      syncDefenderMoves(p.moves);
      setDefenderStatus('Healthy');
      setDefenderHpPercent(100);
      setDefenderBoosts({ hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 });
      setP2PresetKey(indexStr);
    }
  };

  // Import / Export Handlers
  const handleImportToAttacker = () => {
    if (!pasteText.trim()) return;
    const parsed = parseShowdownSet(pasteText);
    if (parsed.species) {
      setAttacker(parsed);
      syncAttackerMoves(parsed.moves);
      setAttackerStatus('Healthy');
      setAttackerHpPercent(100);
    }
  };

  const handleImportToDefender = () => {
    if (!pasteText.trim()) return;
    const parsed = parseShowdownSet(pasteText);
    if (parsed.species) {
      setDefender(parsed);
      syncDefenderMoves(parsed.moves);
      setDefenderStatus('Healthy');
      setDefenderHpPercent(100);
    }
  };

  const handleExportAttacker = () => {
    const text = exportShowdownSet({
      ...attacker,
      moves: attackerMovesState.map((m) => m.name) as [string, string, string, string],
    });
    setPasteText(text);
    if (navigator.clipboard) navigator.clipboard.writeText(text);
  };

  const handleExportDefender = () => {
    const text = exportShowdownSet({
      ...defender,
      moves: defenderMovesState.map((m) => m.name) as [string, string, string, string],
    });
    setPasteText(text);
    if (navigator.clipboard) navigator.clipboard.writeText(text);
  };

  // Base Stats & Total Stats for P1 and P2
  const p1SpeciesData = useMemo(() => getSpecies(attacker.species, selectedGen), [attacker.species, selectedGen]);
  const p2SpeciesData = useMemo(() => getSpecies(defender.species, selectedGen), [defender.species, selectedGen]);

  const p1BaseStats = useMemo(() => p1SpeciesData?.baseStats || { hp: 90, atk: 92, def: 75, spa: 92, spd: 85, spe: 60 }, [p1SpeciesData]);
  const p2BaseStats = useMemo(() => p2SpeciesData?.baseStats || { hp: 90, atk: 92, def: 75, spa: 92, spd: 85, spe: 60 }, [p2SpeciesData]);

  const p1Nature = useMemo(() => naturesList.find((n) => n.name === attacker.nature) || naturesList[0], [naturesList, attacker.nature]);
  const p2Nature = useMemo(() => naturesList.find((n) => n.name === defender.nature) || naturesList[0], [naturesList, defender.nature]);

  const p1CalculatedStats = useMemo(() => {
    const keys: StatName[] = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'];
    const res: BaseStats = { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
    for (const k of keys) {
      res[k] = calculateStat(k, p1BaseStats[k], attacker.ivs[k], attacker.evs[k], attacker.level, p1Nature);
    }
    return res;
  }, [p1BaseStats, attacker.ivs, attacker.evs, attacker.level, p1Nature]);

  const p2CalculatedStats = useMemo(() => {
    const keys: StatName[] = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'];
    const res: BaseStats = { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
    for (const k of keys) {
      res[k] = calculateStat(k, p2BaseStats[k], defender.ivs[k], defender.evs[k], defender.level, p2Nature);
    }
    return res;
  }, [p2BaseStats, defender.ivs, defender.evs, defender.level, p2Nature]);

  // Calculate damage results using generation number (selectedGen) & custom BP / Type / Category
  const moveCalcResults = useMemo(() => {
    return attackerMovesState.map((moveSlot, index) => {
      if (!moveSlot.name || !attacker.species || !defender.species) {
        return { name: moveSlot.name || `Move ${index + 1}`, descText: '0 - 0%', minPercent: 0, maxPercent: 0, resultObj: null, fullDesc: '' };
      }

      try {
        const genNum = selectedGen as import('@smogon/calc').GenerationNum;

        const attackerCalc = new Pokemon(genNum, attacker.species, {
          level: attacker.level || 100,
          ability: attacker.ability || undefined,
          item: attacker.item || undefined,
          nature: attacker.nature || 'Adamant',
          evs: attacker.evs,
          ivs: attacker.ivs,
          boosts: attackerBoosts,
          teraType: attacker.teraType || undefined,
          status: attackerStatus !== 'Healthy' ? (attackerStatus.toLowerCase() as any) : undefined,
          curHP: Math.floor((p1CalculatedStats.hp * attackerHpPercent) / 100),
        });

        const defenderCalc = new Pokemon(genNum, defender.species, {
          level: defender.level || 100,
          ability: defender.ability || undefined,
          item: defender.item || undefined,
          nature: defender.nature || 'Adamant',
          evs: defender.evs,
          ivs: defender.ivs,
          boosts: defenderBoosts,
          teraType: defender.teraType || undefined,
          status: defenderStatus !== 'Healthy' ? (defenderStatus.toLowerCase() as any) : undefined,
          curHP: Math.floor((p2CalculatedStats.hp * defenderHpPercent) / 100),
        });

        const moveCalc = new Move(genNum, moveSlot.name || 'Tackle', {
          isCrit: moveSlot.isCrit,
          useZ: moveSlot.isZ,
          useMax: moveSlot.isMax,
          overrides: {
            basePower: moveSlot.bp,
            type: moveSlot.type,
            category: moveSlot.category,
          },
        });

        const fieldCalc = new Field({
          gameType: battleFormat === 'doubles' ? 'Doubles' : 'Singles',
          weather: weather ? (weather as any) : undefined,
          terrain: terrain ? (terrain as any) : undefined,
          isMagicRoom,
          isWonderRoom,
          isGravity,
          attackerSide: {
            isSR: p1StealthRock,
            spikes: p1Spikes,
            isReflect: p1Reflect,
            isLightScreen: p1LightScreen,
            isAuroraVeil: p1AuroraVeil,
          },
          defenderSide: {
            isSR: p2StealthRock,
            spikes: p2Spikes,
            isReflect: p2Reflect,
            isLightScreen: p2LightScreen,
            isAuroraVeil: p2AuroraVeil,
            isHelpingHand: p2HelpingHand,
            isTailwind: p2Tailwind,
          },
        });

        const result = calculate(genNum, attackerCalc, defenderCalc, moveCalc, fieldCalc);
        const descStr = result.desc();
        const match = descStr.match(/\(([\d.]+\s*-\s*[\d.]+%\))/);
        const percentRange = match ? match[1] : '';

        return {
          name: moveSlot.name,
          descText: percentRange || `${result.kochance()?.text || ''}`,
          resultObj: result,
          fullDesc: descStr,
        };
      } catch (e) {
        return { name: moveSlot.name, descText: '0 - 0%', resultObj: null, fullDesc: '' };
      }
    });
  }, [
    selectedGen, attacker, defender, attackerMovesState, attackerBoosts, defenderBoosts, attackerStatus, defenderStatus,
    attackerHpPercent, defenderHpPercent, battleFormat, weather, terrain,
    isMagicRoom, isWonderRoom, isGravity, p1StealthRock, p1Spikes, p1Reflect, p1LightScreen, p1AuroraVeil,
    p2StealthRock, p2Spikes, p2Reflect, p2LightScreen, p2AuroraVeil, p2HelpingHand, p2Tailwind,
    p1CalculatedStats, p2CalculatedStats,
  ]);

  const activeResult = moveCalcResults[selectedMoveIndex] || moveCalcResults[0];

  const damageRollsArray = useMemo(() => {
    if (!activeResult?.resultObj?.damage) return [];
    const damage = activeResult.resultObj.damage;
    if (typeof damage === 'number') return [damage];
    return damage;
  }, [activeResult]);

  const handleUpdateAttackerMoveSlot = (index: number, updates: Partial<CalculatorMoveState>) => {
    setAttackerMovesState((prev) => {
      const next = [...prev];
      const current = { ...next[index] };

      if (updates.name !== undefined && updates.name !== current.name) {
        const freshlyInitted = initMoveSlot(updates.name);
        next[index] = { ...freshlyInitted, ...updates };
      } else {
        next[index] = { ...current, ...updates };
      }
      return next;
    });
  };

  const handleUpdateDefenderMoveSlot = (index: number, updates: Partial<CalculatorMoveState>) => {
    setDefenderMovesState((prev) => {
      const next = [...prev];
      const current = { ...next[index] };

      if (updates.name !== undefined && updates.name !== current.name) {
        const freshlyInitted = initMoveSlot(updates.name);
        next[index] = { ...freshlyInitted, ...updates };
      } else {
        next[index] = { ...current, ...updates };
      }
      return next;
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-4 select-none">
      {/* Top Header & Gen Selector */}
      <div className="card p-3 space-y-2 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border-slate-700 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-indigo-400" />
            <h1 className="font-bold text-lg text-white">Pokémon Damage Calculator</h1>
          </div>

          {/* Generation Tabs */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono">
            {[
              { gen: 1, label: 'RBY' },
              { gen: 2, label: 'GSC' },
              { gen: 3, label: 'ADV' },
              { gen: 4, label: 'DPP' },
              { gen: 5, label: 'B/W' },
              { gen: 6, label: 'X/Y' },
              { gen: 7, label: 'S/M' },
              { gen: 8, label: 'S/V' },
              { gen: 9, label: '9th' },
            ].map((g) => (
              <button
                key={g.gen}
                onClick={() => setSelectedGen(g.gen)}
                className={`px-2 py-1 rounded font-bold transition-all ${
                  selectedGen === g.gen ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>

          {/* Mode Tabs */}
          <div className="flex items-center gap-1 text-xs">
            {[
              { id: 'onevsone', label: 'One vs One' },
              { id: 'onevsall', label: 'One vs All' },
              { id: 'allvsone', label: 'All vs One' },
              { id: 'champions', label: 'Champions' },
            ].map((mode) => (
              <button
                key={mode.id}
                onClick={() => setGameMode(mode.id as any)}
                className={`px-2.5 py-1 rounded-lg border font-semibold transition-all ${
                  gameMode === mode.id ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-900 text-slate-300 border-slate-700'
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>

        {/* Moves Bar */}
        <div className="pt-2 border-t border-slate-800/80">
          <div className="text-[10px] uppercase font-bold text-slate-400 mb-1.5 flex items-center justify-between">
            <span>{attacker.species || 'Attacker'}&apos;s Moves (select one to show detailed results)</span>
            <span className="text-indigo-400 font-mono">Gen {selectedGen} • Format: {battleFormat.toUpperCase()}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {moveCalcResults.map((m, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedMoveIndex(idx)}
                className={`card p-2.5 text-left border transition-all ${
                  selectedMoveIndex === idx
                    ? 'border-indigo-500 ring-2 ring-indigo-500/40 bg-indigo-950/40'
                    : 'border-slate-800 bg-slate-900/80 hover:border-slate-700'
                }`}
              >
                <div className="font-bold text-xs text-white truncate">{m.name || `Move ${idx + 1}`}</div>
                <div className="text-xs font-mono font-bold text-emerald-400 mt-0.5">{m.descText}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Calculation Result Summary Banner */}
        <div className="card p-3 bg-slate-950 border-indigo-500/40 space-y-1">
          <div className="text-sm md:text-base font-bold font-mono text-white">
            {activeResult?.fullDesc || 'Select attacker, defender, and move to calculate.'}
          </div>
          {damageRollsArray.length > 0 && (
            <div className="text-xs font-mono text-slate-400 truncate">
              Possible damage amounts: ({damageRollsArray.join(', ')})
            </div>
          )}
        </div>
      </div>

      {/* Main 3-Column Layout: Pokémon 1 | Field | Pokémon 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* POKÉMON 1 (ATTACKER) - COLS 1-5 */}
        <div className="lg:col-span-5 card p-4 space-y-3" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
          <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: 'var(--border-primary)' }}>
            <div className="flex items-center gap-2">
              <Swords className="h-4 w-4 text-red-500" />
              <h2 className="font-bold text-sm text-white">Pokémon 1 (Attacker)</h2>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setShowdownModalTarget('p1')}
                className="text-[11px] px-2 py-0.5 rounded border border-slate-700 bg-slate-800 text-white font-semibold hover:bg-slate-700"
              >
                Paste Set
              </button>
              {teamPresets.length > 0 && (
                <select
                  value={p1PresetKey}
                  onChange={(e) => handleLoadPreset(e.target.value, 'p1')}
                  className="text-[11px] rounded border border-indigo-500/50 bg-indigo-950 text-white px-2 py-0.5 outline-none font-semibold cursor-pointer"
                >
                  <option value="">Load Preset...</option>
                  {teamPresets.map((p, idx) => (
                    <option key={idx} value={idx.toString()}>{p.label}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Species & Types */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] text-slate-400 font-bold uppercase mb-0.5">Species</label>
              <input
                type="text"
                list="species-calc-list"
                value={attacker.species}
                onChange={(e) => setAttacker({ ...attacker, species: e.target.value })}
                className="w-full rounded border border-slate-700 bg-slate-900 text-white px-2.5 py-1 text-xs font-bold outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 font-bold uppercase mb-0.5">Tera Type</label>
              <select
                value={attacker.teraType || ''}
                onChange={(e) => setAttacker({ ...attacker, teraType: e.target.value as PokemonType })}
                className="w-full rounded border border-slate-700 bg-slate-900 text-white px-2 py-1 text-xs font-bold outline-none cursor-pointer"
              >
                <option value="">(None)</option>
                {typesList.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Level, Gender, Status */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[10px] text-slate-400 font-bold uppercase mb-0.5">Level</label>
              <input
                type="number"
                min={1}
                max={100}
                value={attacker.level}
                onChange={(e) => setAttacker({ ...attacker, level: parseInt(e.target.value) || 100 })}
                className="w-full text-center rounded border border-slate-700 bg-slate-900 text-white py-1 text-xs font-bold outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 font-bold uppercase mb-0.5">Gender</label>
              <select
                value={attacker.gender || ''}
                onChange={(e) => setAttacker({ ...attacker, gender: (e.target.value as Gender) || null })}
                className="w-full text-center rounded border border-slate-700 bg-slate-900 text-white py-1 text-xs font-bold outline-none cursor-pointer"
              >
                <option value="">(Select)</option>
                <option value="M">Male</option>
                <option value="F">Female</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 font-bold uppercase mb-0.5">Status</label>
              <select
                value={attackerStatus}
                onChange={(e) => setAttackerStatus(e.target.value)}
                className="w-full text-center rounded border border-slate-700 bg-slate-900 text-white py-1 text-xs font-bold outline-none cursor-pointer"
              >
                <option value="Healthy">Healthy</option>
                <option value="Poisoned">Poisoned</option>
                <option value="Badly Poisoned">Badly Poisoned</option>
                <option value="Burned">Burned</option>
                <option value="Paralyzed">Paralyzed</option>
                <option value="Asleep">Asleep</option>
                <option value="Frozen">Frozen</option>
              </select>
            </div>
          </div>

          {/* STATS TABLE */}
          <div className="space-y-1 text-xs font-mono border-t border-b py-2 border-slate-800">
            <div className="grid grid-cols-12 gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider pb-1">
              <div className="col-span-2">Stat</div>
              <div className="col-span-2 text-center">Base</div>
              <div className="col-span-2 text-center">IVs</div>
              <div className="col-span-2 text-center">EVs</div>
              <div className="col-span-2 text-center">Boost</div>
              <div className="col-span-2 text-right">Total</div>
            </div>

            {(['hp', 'atk', 'def', 'spa', 'spd', 'spe'] as StatName[]).map((stat) => (
              <div key={stat} className="grid grid-cols-12 gap-1 items-center">
                <div className="col-span-2 font-bold uppercase text-slate-300">{stat.toUpperCase()}</div>
                <div className="col-span-2 text-center text-slate-400">{p1BaseStats[stat]}</div>
                <div className="col-span-2 flex justify-center">
                  <input
                    type="number"
                    min={0}
                    max={31}
                    value={attacker.ivs[stat]}
                    onChange={(e) => setAttacker({ ...attacker, ivs: { ...attacker.ivs, [stat]: parseInt(e.target.value) || 0 } })}
                    className="w-10 text-center rounded border border-slate-800 bg-slate-900 text-white text-[11px]"
                  />
                </div>
                <div className="col-span-2 flex justify-center">
                  <input
                    type="number"
                    min={0}
                    max={252}
                    value={attacker.evs[stat]}
                    onChange={(e) => setAttacker({ ...attacker, evs: { ...attacker.evs, [stat]: parseInt(e.target.value) || 0 } })}
                    className="w-12 text-center rounded border border-slate-800 bg-slate-900 text-white text-[11px]"
                  />
                </div>
                <div className="col-span-2 flex justify-center">
                  <select
                    value={attackerBoosts[stat]}
                    onChange={(e) => setAttackerBoosts({ ...attackerBoosts, [stat]: parseInt(e.target.value) })}
                    className="w-12 text-center rounded border border-slate-800 bg-slate-900 text-white text-[11px] cursor-pointer"
                  >
                    {[-6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6].map((b) => (
                      <option key={b} value={b}>{b > 0 ? `+${b}` : b}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2 text-right font-bold text-indigo-400">
                  {p1CalculatedStats[stat]}
                </div>
              </div>
            ))}
          </div>

          {/* Nature, Ability, Item */}
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <label className="block text-[10px] text-slate-400 font-bold uppercase mb-0.5">Nature</label>
              <select
                value={attacker.nature}
                onChange={(e) => setAttacker({ ...attacker, nature: e.target.value })}
                className="w-full rounded border border-slate-700 bg-slate-900 text-white px-2 py-1 outline-none font-bold cursor-pointer"
              >
                {naturesList.map((n) => (
                  <option key={n.name} value={n.name}>{n.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 font-bold uppercase mb-0.5">Ability</label>
              <input
                type="text"
                list="abilities-calc-list"
                value={attacker.ability}
                onChange={(e) => setAttacker({ ...attacker, ability: e.target.value })}
                className="w-full rounded border border-slate-700 bg-slate-900 text-white px-2 py-1 outline-none font-medium text-[11px]"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 font-bold uppercase mb-0.5">Item</label>
              <input
                type="text"
                list="items-calc-list"
                value={attacker.item}
                onChange={(e) => setAttacker({ ...attacker, item: e.target.value })}
                className="w-full rounded border border-slate-700 bg-slate-900 text-white px-2 py-1 outline-none font-medium text-[11px]"
              />
            </div>
          </div>

          {/* Current HP Slider */}
          <div className="space-y-1 pt-1">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400 font-bold">Current HP</span>
              <span className="text-white font-bold">
                {Math.floor((p1CalculatedStats.hp * attackerHpPercent) / 100)} / {p1CalculatedStats.hp} ({attackerHpPercent}%)
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={attackerHpPercent}
              onChange={(e) => setAttackerHpPercent(parseInt(e.target.value) || 0)}
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>

          {/* 4 INTERACTIVE MOVES ROWS */}
          <div className="space-y-2 border-t pt-2 border-slate-800">
            <div className="flex items-center justify-between">
              <label className="block text-[10px] uppercase font-bold text-slate-400">Moves & Base Power (BP)</label>
              <span className="text-[10px] text-slate-500 font-mono">BP is editable</span>
            </div>

            {attackerMovesState.map((moveSlot, index) => (
              <div key={index} className="grid grid-cols-12 gap-1.5 items-center bg-slate-950/60 p-1.5 rounded-lg border border-slate-800">
                <div className="col-span-4">
                  <input
                    type="text"
                    list="moves-calc-list"
                    value={moveSlot.name}
                    onChange={(e) => handleUpdateAttackerMoveSlot(index, { name: e.target.value })}
                    placeholder={`Move ${index + 1}`}
                    className="w-full rounded border border-slate-700 bg-slate-900 text-white px-2 py-1 text-xs font-bold outline-none truncate"
                  />
                </div>

                <div className="col-span-2 flex items-center justify-center">
                  <input
                    type="number"
                    min={0}
                    max={250}
                    value={moveSlot.bp}
                    onChange={(e) => handleUpdateAttackerMoveSlot(index, { bp: parseInt(e.target.value) || 0 })}
                    title="Change Base Power (BP)"
                    className="w-full text-center rounded border border-indigo-500/50 bg-slate-900 text-white py-1 text-xs font-mono font-bold outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                  />
                </div>

                <div className="col-span-2">
                  <select
                    value={moveSlot.type}
                    onChange={(e) => handleUpdateAttackerMoveSlot(index, { type: e.target.value as PokemonType })}
                    className="w-full rounded border border-slate-700 bg-slate-900 text-white py-1 text-[11px] font-semibold outline-none cursor-pointer"
                  >
                    {typesList.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2">
                  <select
                    value={moveSlot.category}
                    onChange={(e) => handleUpdateAttackerMoveSlot(index, { category: e.target.value as 'Physical' | 'Special' | 'Status' })}
                    className="w-full rounded border border-slate-700 bg-slate-900 text-white py-1 text-[11px] font-semibold outline-none cursor-pointer"
                  >
                    <option value="Physical">Physical</option>
                    <option value="Special">Special</option>
                    <option value="Status">Status</option>
                  </select>
                </div>

                <div className="col-span-2 flex items-center gap-1 justify-end">
                  <button
                    onClick={() => handleUpdateAttackerMoveSlot(index, { isCrit: !moveSlot.isCrit })}
                    className={`text-[10px] px-1.5 py-1 rounded font-bold border transition-colors ${
                      moveSlot.isCrit ? 'bg-amber-500 text-black border-amber-400' : 'bg-slate-900 text-slate-400 border-slate-800'
                    }`}
                  >
                    Crit
                  </button>
                  <button
                    onClick={() => handleUpdateAttackerMoveSlot(index, { isMax: !moveSlot.isMax, isZ: false })}
                    className={`text-[10px] px-1.5 py-1 rounded font-bold border transition-colors ${
                      moveSlot.isMax ? 'bg-purple-600 text-white border-purple-400' : 'bg-slate-900 text-slate-400 border-slate-800'
                    }`}
                  >
                    Max
                  </button>
                </div>
              </div>
            ))}

            {/* Side Export Button */}
            <div className="flex justify-end pt-1">
              <button
                onClick={handleExportAttacker}
                className="inline-flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
              >
                <Download className="h-3 w-3" />
                Export P1 Set
              </button>
            </div>
          </div>
        </div>

        {/* CENTER FIELD CONTROLS - COLS 6-7 */}
        <div className="lg:col-span-2 card p-3 space-y-3 bg-slate-900 border-slate-800">
          <div className="text-center font-bold text-xs uppercase tracking-wider text-slate-400 border-b pb-1.5 border-slate-800">
            Field Controls
          </div>

          {/* Format */}
          <div className="flex rounded-lg border border-slate-800 p-0.5 bg-slate-950 text-xs">
            <button
              onClick={() => setBattleFormat('singles')}
              className={`flex-1 py-1 rounded font-bold ${battleFormat === 'singles' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
            >
              Singles
            </button>
            <button
              onClick={() => setBattleFormat('doubles')}
              className={`flex-1 py-1 rounded font-bold ${battleFormat === 'doubles' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
            >
              Doubles
            </button>
          </div>

          {/* Level Presets */}
          <div className="grid grid-cols-3 gap-1 text-[11px]">
            {[100, 50, 5].map((lvl) => (
              <button
                key={lvl}
                onClick={() => {
                  setAttacker({ ...attacker, level: lvl });
                  setDefender({ ...defender, level: lvl });
                }}
                className="py-1 rounded border border-slate-800 bg-slate-950 text-slate-300 font-semibold hover:border-slate-700"
              >
                Lvl {lvl}
              </button>
            ))}
          </div>

          {/* Weather Buttons */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Weather</span>
            <div className="grid grid-cols-2 gap-1 text-[11px]">
              {(['', 'Sun', 'Rain', 'Sand', 'Snow'] as const).map((w) => (
                <button
                  key={w}
                  onClick={() => setWeather(w)}
                  className={`py-1 rounded border transition-colors font-semibold ${
                    weather === w ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  {w || 'None'}
                </button>
              ))}
            </div>
          </div>

          {/* Terrain Buttons */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Terrain</span>
            <div className="grid grid-cols-2 gap-1 text-[11px]">
              {(['', 'Electric', 'Grassy', 'Misty', 'Psychic'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTerrain(t)}
                  className={`py-1 rounded border transition-colors font-semibold ${
                    terrain === t ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  {t || 'None'}
                </button>
              ))}
            </div>
          </div>

          {/* Field Effects Toggles */}
          <div className="space-y-1 text-xs font-semibold text-slate-300">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={isMagicRoom} onChange={(e) => setIsMagicRoom(e.target.checked)} />
              Magic Room
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={isWonderRoom} onChange={(e) => setIsWonderRoom(e.target.checked)} />
              Wonder Room
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={isGravity} onChange={(e) => setIsGravity(e.target.checked)} />
              Gravity
            </label>
          </div>

          {/* Side Hazards / Screens Table */}
          <div className="space-y-2 border-t pt-2 border-slate-800 text-xs">
            <div className="text-[10px] font-bold text-slate-400 uppercase">Side Hazards / Screens</div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              {/* P1 Side */}
              <div className="space-y-1 bg-slate-950 p-2 rounded border border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 block border-b border-slate-800 pb-1">P1 Side</span>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input type="checkbox" checked={p1StealthRock} onChange={(e) => setP1StealthRock(e.target.checked)} />
                  Stealth Rock
                </label>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input type="checkbox" checked={p1Reflect} onChange={(e) => setP1Reflect(e.target.checked)} />
                  Reflect
                </label>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input type="checkbox" checked={p1LightScreen} onChange={(e) => setP1LightScreen(e.target.checked)} />
                  Light Screen
                </label>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input type="checkbox" checked={p1AuroraVeil} onChange={(e) => setP1AuroraVeil(e.target.checked)} />
                  Aurora Veil
                </label>
              </div>

              {/* P2 Side */}
              <div className="space-y-1 bg-slate-950 p-2 rounded border border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 block border-b border-slate-800 pb-1">P2 Side</span>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input type="checkbox" checked={p2StealthRock} onChange={(e) => setP2StealthRock(e.target.checked)} />
                  Stealth Rock
                </label>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input type="checkbox" checked={p2Reflect} onChange={(e) => setP2Reflect(e.target.checked)} />
                  Reflect
                </label>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input type="checkbox" checked={p2LightScreen} onChange={(e) => setP2LightScreen(e.target.checked)} />
                  Light Screen
                </label>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input type="checkbox" checked={p2AuroraVeil} onChange={(e) => setP2AuroraVeil(e.target.checked)} />
                  Aurora Veil
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* POKÉMON 2 (DEFENDER) - COLS 8-12 */}
        <div className="lg:col-span-5 card p-4 space-y-3" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
          <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: 'var(--border-primary)' }}>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-blue-500" />
              <h2 className="font-bold text-sm text-white">Pokémon 2 (Defender)</h2>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setShowdownModalTarget('p2')}
                className="text-[11px] px-2 py-0.5 rounded border border-slate-700 bg-slate-800 text-white font-semibold hover:bg-slate-700"
              >
                Paste Set
              </button>
              {teamPresets.length > 0 && (
                <select
                  value={p2PresetKey}
                  onChange={(e) => handleLoadPreset(e.target.value, 'p2')}
                  className="text-[11px] rounded border border-indigo-500/50 bg-indigo-950 text-white px-2 py-0.5 outline-none font-semibold cursor-pointer"
                >
                  <option value="">Load Preset...</option>
                  {teamPresets.map((p, idx) => (
                    <option key={idx} value={idx.toString()}>{p.label}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Species & Types */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] text-slate-400 font-bold uppercase mb-0.5">Species</label>
              <input
                type="text"
                list="species-calc-list"
                value={defender.species}
                onChange={(e) => setDefender({ ...defender, species: e.target.value })}
                className="w-full rounded border border-slate-700 bg-slate-900 text-white px-2.5 py-1 text-xs font-bold outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 font-bold uppercase mb-0.5">Tera Type</label>
              <select
                value={defender.teraType || ''}
                onChange={(e) => setDefender({ ...defender, teraType: e.target.value as PokemonType })}
                className="w-full rounded border border-slate-700 bg-slate-900 text-white px-2 py-1 text-xs font-bold outline-none cursor-pointer"
              >
                <option value="">(None)</option>
                {typesList.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Level, Gender, Status */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[10px] text-slate-400 font-bold uppercase mb-0.5">Level</label>
              <input
                type="number"
                min={1}
                max={100}
                value={defender.level}
                onChange={(e) => setDefender({ ...defender, level: parseInt(e.target.value) || 100 })}
                className="w-full text-center rounded border border-slate-700 bg-slate-900 text-white py-1 text-xs font-bold outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 font-bold uppercase mb-0.5">Gender</label>
              <select
                value={defender.gender || ''}
                onChange={(e) => setDefender({ ...defender, gender: (e.target.value as Gender) || null })}
                className="w-full text-center rounded border border-slate-700 bg-slate-900 text-white py-1 text-xs font-bold outline-none cursor-pointer"
              >
                <option value="">(Select)</option>
                <option value="M">Male</option>
                <option value="F">Female</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 font-bold uppercase mb-0.5">Status</label>
              <select
                value={defenderStatus}
                onChange={(e) => setDefenderStatus(e.target.value)}
                className="w-full text-center rounded border border-slate-700 bg-slate-900 text-white py-1 text-xs font-bold outline-none cursor-pointer"
              >
                <option value="Healthy">Healthy</option>
                <option value="Poisoned">Poisoned</option>
                <option value="Badly Poisoned">Badly Poisoned</option>
                <option value="Burned">Burned</option>
                <option value="Paralyzed">Paralyzed</option>
                <option value="Asleep">Asleep</option>
                <option value="Frozen">Frozen</option>
              </select>
            </div>
          </div>

          {/* STATS TABLE */}
          <div className="space-y-1 text-xs font-mono border-t border-b py-2 border-slate-800">
            <div className="grid grid-cols-12 gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider pb-1">
              <div className="col-span-2">Stat</div>
              <div className="col-span-2 text-center">Base</div>
              <div className="col-span-2 text-center">IVs</div>
              <div className="col-span-2 text-center">EVs</div>
              <div className="col-span-2 text-center">Boost</div>
              <div className="col-span-2 text-right">Total</div>
            </div>

            {(['hp', 'atk', 'def', 'spa', 'spd', 'spe'] as StatName[]).map((stat) => (
              <div key={stat} className="grid grid-cols-12 gap-1 items-center">
                <div className="col-span-2 font-bold uppercase text-slate-300">{stat.toUpperCase()}</div>
                <div className="col-span-2 text-center text-slate-400">{p2BaseStats[stat]}</div>
                <div className="col-span-2 flex justify-center">
                  <input
                    type="number"
                    min={0}
                    max={31}
                    value={defender.ivs[stat]}
                    onChange={(e) => setDefender({ ...defender, ivs: { ...defender.ivs, [stat]: parseInt(e.target.value) || 0 } })}
                    className="w-10 text-center rounded border border-slate-800 bg-slate-900 text-white text-[11px]"
                  />
                </div>
                <div className="col-span-2 flex justify-center">
                  <input
                    type="number"
                    min={0}
                    max={252}
                    value={defender.evs[stat]}
                    onChange={(e) => setDefender({ ...defender, evs: { ...defender.evs, [stat]: parseInt(e.target.value) || 0 } })}
                    className="w-12 text-center rounded border border-slate-800 bg-slate-900 text-white text-[11px]"
                  />
                </div>
                <div className="col-span-2 flex justify-center">
                  <select
                    value={defenderBoosts[stat]}
                    onChange={(e) => setDefenderBoosts({ ...defenderBoosts, [stat]: parseInt(e.target.value) })}
                    className="w-12 text-center rounded border border-slate-800 bg-slate-900 text-white text-[11px] cursor-pointer"
                  >
                    {[-6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6].map((b) => (
                      <option key={b} value={b}>{b > 0 ? `+${b}` : b}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2 text-right font-bold text-indigo-400">
                  {p2CalculatedStats[stat]}
                </div>
              </div>
            ))}
          </div>

          {/* Nature, Ability, Item */}
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <label className="block text-[10px] text-slate-400 font-bold uppercase mb-0.5">Nature</label>
              <select
                value={defender.nature}
                onChange={(e) => setDefender({ ...defender, nature: e.target.value })}
                className="w-full rounded border border-slate-700 bg-slate-900 text-white px-2 py-1 outline-none font-bold cursor-pointer"
              >
                {naturesList.map((n) => (
                  <option key={n.name} value={n.name}>{n.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 font-bold uppercase mb-0.5">Ability</label>
              <input
                type="text"
                list="abilities-calc-list"
                value={defender.ability}
                onChange={(e) => setDefender({ ...defender, ability: e.target.value })}
                className="w-full rounded border border-slate-700 bg-slate-900 text-white px-2 py-1 outline-none font-medium text-[11px]"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 font-bold uppercase mb-0.5">Item</label>
              <input
                type="text"
                list="items-calc-list"
                value={defender.item}
                onChange={(e) => setDefender({ ...defender, item: e.target.value })}
                className="w-full rounded border border-slate-700 bg-slate-900 text-white px-2 py-1 outline-none font-medium text-[11px]"
              />
            </div>
          </div>

          {/* Current HP Slider */}
          <div className="space-y-1 pt-1">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400 font-bold">Current HP</span>
              <span className="text-white font-bold">
                {Math.floor((p2CalculatedStats.hp * defenderHpPercent) / 100)} / {p2CalculatedStats.hp} ({defenderHpPercent}%)
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={defenderHpPercent}
              onChange={(e) => setDefenderHpPercent(parseInt(e.target.value) || 0)}
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>

          {/* 4 DEFENDER MOVES ROWS */}
          <div className="space-y-2 border-t pt-2 border-slate-800">
            <div className="flex items-center justify-between">
              <label className="block text-[10px] uppercase font-bold text-slate-400">Moves & Base Power (BP)</label>
              <span className="text-[10px] text-slate-500 font-mono">BP is editable</span>
            </div>

            {defenderMovesState.map((moveSlot, index) => (
              <div key={index} className="grid grid-cols-12 gap-1.5 items-center bg-slate-950/60 p-1.5 rounded-lg border border-slate-800">
                <div className="col-span-4">
                  <input
                    type="text"
                    list="moves-calc-list"
                    value={moveSlot.name}
                    onChange={(e) => handleUpdateDefenderMoveSlot(index, { name: e.target.value })}
                    placeholder={`Move ${index + 1}`}
                    className="w-full rounded border border-slate-700 bg-slate-900 text-white px-2 py-1 text-xs font-bold outline-none truncate"
                  />
                </div>

                <div className="col-span-2 flex items-center justify-center">
                  <input
                    type="number"
                    min={0}
                    max={250}
                    value={moveSlot.bp}
                    onChange={(e) => handleUpdateDefenderMoveSlot(index, { bp: parseInt(e.target.value) || 0 })}
                    title="Change Base Power (BP)"
                    className="w-full text-center rounded border border-indigo-500/50 bg-slate-900 text-white py-1 text-xs font-mono font-bold outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                  />
                </div>

                <div className="col-span-2">
                  <select
                    value={moveSlot.type}
                    onChange={(e) => handleUpdateDefenderMoveSlot(index, { type: e.target.value as PokemonType })}
                    className="w-full rounded border border-slate-700 bg-slate-900 text-white py-1 text-[11px] font-semibold outline-none cursor-pointer"
                  >
                    {typesList.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2">
                  <select
                    value={moveSlot.category}
                    onChange={(e) => handleUpdateDefenderMoveSlot(index, { category: e.target.value as 'Physical' | 'Special' | 'Status' })}
                    className="w-full rounded border border-slate-700 bg-slate-900 text-white py-1 text-[11px] font-semibold outline-none cursor-pointer"
                  >
                    <option value="Physical">Physical</option>
                    <option value="Special">Special</option>
                    <option value="Status">Status</option>
                  </select>
                </div>

                <div className="col-span-2 flex items-center gap-1 justify-end">
                  <button
                    onClick={() => handleUpdateDefenderMoveSlot(index, { isCrit: !moveSlot.isCrit })}
                    className={`text-[10px] px-1.5 py-1 rounded font-bold border transition-colors ${
                      moveSlot.isCrit ? 'bg-amber-500 text-black border-amber-400' : 'bg-slate-900 text-slate-400 border-slate-800'
                    }`}
                  >
                    Crit
                  </button>
                  <button
                    onClick={() => handleUpdateDefenderMoveSlot(index, { isMax: !moveSlot.isMax, isZ: false })}
                    className={`text-[10px] px-1.5 py-1 rounded font-bold border transition-colors ${
                      moveSlot.isMax ? 'bg-purple-600 text-white border-purple-400' : 'bg-slate-900 text-slate-400 border-slate-800'
                    }`}
                  >
                    Max
                  </button>
                </div>
              </div>
            ))}

            {/* Side Export Button */}
            <div className="flex justify-end pt-1">
              <button
                onClick={handleExportDefender}
                className="inline-flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
              >
                <Download className="h-3 w-3" />
                Export P2 Set
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Custom Set Import / Export Box */}
      <div className="card p-4 space-y-3 bg-slate-900 border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="font-bold text-xs text-white uppercase tracking-wider">
            Import / Export Showdown Sets
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleImportToAttacker}
              className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1 text-xs font-bold text-white shadow hover:bg-indigo-500 transition-colors"
            >
              <Upload className="h-3.5 w-3.5" />
              Import to Attacker (P1)
            </button>
            <button
              onClick={handleImportToDefender}
              className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1 text-xs font-bold text-white shadow hover:bg-blue-500 transition-colors"
            >
              <Upload className="h-3.5 w-3.5" />
              Import to Defender (P2)
            </button>
            <button
              onClick={handleExportAttacker}
              className="inline-flex items-center gap-1 rounded-lg bg-slate-800 border border-slate-700 px-3 py-1 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              Export P1 Set
            </button>
            <button
              onClick={handleExportDefender}
              className="inline-flex items-center gap-1 rounded-lg bg-slate-800 border border-slate-700 px-3 py-1 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              Export P2 Set
            </button>
          </div>
        </div>

        <textarea
          value={pasteText}
          onChange={(e) => setPasteText(e.target.value)}
          placeholder="Paste Showdown set format here to import into P1/P2, or click Export buttons above to get set text..."
          rows={5}
          className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs font-mono text-white outline-none focus:border-indigo-500"
        />
      </div>

      {/* Datalists */}
      <datalist id="species-calc-list">
        {speciesList.map((s, idx) => (
          <option key={`${s.id}-${s.name}-${idx}`} value={s.name} />
        ))}
      </datalist>

      <datalist id="items-calc-list">
        {itemsList.slice(0, 300).map((i, idx) => (
          <option key={`${i.id}-${i.name}-${idx}`} value={i.name} />
        ))}
      </datalist>

      <datalist id="abilities-calc-list">
        {abilitiesList.slice(0, 300).map((a, idx) => (
          <option key={`${a.id}-${a.name}-${idx}`} value={a.name} />
        ))}
      </datalist>

      <datalist id="moves-calc-list">
        {getAllMoves(selectedGen).slice(0, 500).map((m, idx) => (
          <option key={`${m.id}-${m.name}-${idx}`} value={m.name} />
        ))}
      </datalist>

      {/* Showdown Import Modal */}
      {showdownModalTarget && (
        <ShowdownPasteModal
          isOpen={!!showdownModalTarget}
          onClose={() => setShowdownModalTarget(null)}
          mode="single"
          currentPokemon={showdownModalTarget === 'p1' ? attacker : defender}
          onImportSingle={(p) => {
            if (showdownModalTarget === 'p1') {
              setAttacker(p);
              syncAttackerMoves(p.moves);
              setAttackerStatus('Healthy');
              setAttackerHpPercent(100);
            } else {
              setDefender(p);
              syncDefenderMoves(p.moves);
              setDefenderStatus('Healthy');
              setDefenderHpPercent(100);
            }
          }}
        />
      )}
    </div>
  );
}
