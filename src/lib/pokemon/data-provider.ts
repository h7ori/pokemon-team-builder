// Pokémon data provider using @pkmn/dex
'use client';

import { Dex } from '@pkmn/dex';
import { Generations } from '@pkmn/data';
import type { PokemonType, StatName, NatureData, BaseStats } from '@/types/pokemon';

const gen9 = new Generations(Dex).get(9);

export interface FormattedSpecies {
  id: string;
  name: string;
  num: number;
  baseSpecies: string;
  forme: string;
  baseForme: string;
  types: PokemonType[];
  baseStats: BaseStats;
  bst: number;
  abilities: string[];
  hiddenAbility?: string;
  genderRatio?: { M: number; F: number };
  weightkg: number;
  heightm: number;
  tier: string;
  isNonstandard: string | null;
  generation: number;
  isMega: boolean;
  isGmax: boolean;
  isRegional: boolean;
}

export function getAllSpecies(gen: number = 9): FormattedSpecies[] {
  const speciesList: FormattedSpecies[] = [];

  for (const s of Dex.species.all()) {
    if (s.exists && s.num > 0) {
      const bst =
        s.baseStats.hp +
        s.baseStats.atk +
        s.baseStats.def +
        s.baseStats.spa +
        s.baseStats.spd +
        s.baseStats.spe;

      const isMega = !!(s.forme && s.forme.startsWith('Mega')) || !!s.isMega;
      const isGmax = s.forme === 'Gmax';
      const isRegional = ['Alola', 'Galar', 'Hisui', 'Paldea'].includes(s.forme);

      speciesList.push({
        id: s.id,
        name: s.name,
        num: s.num,
        baseSpecies: s.baseSpecies || s.name,
        forme: s.forme || '',
        baseForme: s.baseForme || '',
        types: s.types as PokemonType[],
        baseStats: {
          hp: s.baseStats.hp,
          atk: s.baseStats.atk,
          def: s.baseStats.def,
          spa: s.baseStats.spa,
          spd: s.baseStats.spd,
          spe: s.baseStats.spe,
        },
        bst,
        abilities: Object.values(s.abilities).filter(Boolean) as string[],
        hiddenAbility: s.abilities.H,
        weightkg: s.weightkg || 0,
        heightm: (s as unknown as Record<string, number>).heightm || 0,
        tier: (s as unknown as Record<string, string>).tier ?? 'OU',
        isNonstandard: s.isNonstandard as string | null,
        generation: s.gen,
        isMega,
        isGmax,
        isRegional,
      });
    }
  }

  return speciesList.sort((a, b) => {
    if (a.num !== b.num) return a.num - b.num;
    return a.name.localeCompare(b.name);
  });
}

export function getSpecies(name: string, gen: number = 9) {
  if (!name) return null;
  const spec = Dex.species.get(name);
  if (!spec.exists) return null;
  return spec;
}

export function getSpeciesForms(baseSpeciesName: string, gen: number = 9): FormattedSpecies[] {
  const all = getAllSpecies(gen);
  const base = getSpecies(baseSpeciesName, gen);
  const targetBase = base?.baseSpecies || baseSpeciesName;

  return all.filter(
    (s) => s.baseSpecies.toLowerCase() === targetBase.toLowerCase() || s.name.toLowerCase() === targetBase.toLowerCase()
  );
}

export interface FormattedMove {
  id: string;
  name: string;
  type: PokemonType;
  category: 'Physical' | 'Special' | 'Status';
  basePower: number;
  accuracy: number | true;
  pp: number;
  priority: number;
  desc: string;
  shortDesc: string;
  isZ?: boolean | string;
  isMax?: boolean | string;
  isGmax?: boolean;
  isShadow?: boolean;
  isIllegal?: boolean;
}

export function getAllMoves(gen: number = 9): FormattedMove[] {
  const moves: FormattedMove[] = [];
  const seenIds = new Set<string>();

  for (const m of Dex.moves.all()) {
    if (m.exists && m.isNonstandard !== 'Custom') {
      const isZ = !!m.isZ;
      const isMax = !!m.isMax || m.name.startsWith('Max ');
      const isGmax = m.name.startsWith('G-Max') || (typeof m.isMax === 'string' && m.isMax !== 'true');
      const isShadow = m.name.startsWith('Shadow ');

      let moveId: string = m.id;
      if (seenIds.has(moveId)) {
        moveId = `${m.id}-${m.name.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
      }
      seenIds.add(moveId);

      moves.push({
        id: moveId,
        name: m.name,
        type: m.type as PokemonType,
        category: m.category as 'Physical' | 'Special' | 'Status',
        basePower: m.basePower,
        accuracy: m.accuracy,
        pp: m.pp,
        priority: m.priority,
        desc: m.desc || m.shortDesc || '',
        shortDesc: m.shortDesc || '',
        isZ,
        isMax,
        isGmax,
        isShadow,
        isIllegal: false,
      });
    }
  }

  return moves.sort((a, b) => a.name.localeCompare(b.name));
}

export function getMove(name: string, gen: number = 9): FormattedMove | null {
  const m = Dex.moves.get(name);
  if (!m || !m.exists) return null;
  const isZ = !!m.isZ;
  const isMax = !!m.isMax || m.name.startsWith('Max ');
  const isGmax = m.name.startsWith('G-Max') || (typeof m.isMax === 'string' && m.isMax !== 'true');
  const isShadow = m.name.startsWith('Shadow ');

  return {
    id: m.id,
    name: m.name,
    type: m.type as PokemonType,
    category: m.category as 'Physical' | 'Special' | 'Status',
    basePower: m.basePower,
    accuracy: m.accuracy,
    pp: m.pp,
    priority: m.priority,
    desc: m.desc || m.shortDesc || '',
    shortDesc: m.shortDesc || '',
    isZ,
    isMax,
    isGmax,
    isShadow,
    isIllegal: false,
  };
}

/**
 * Get learnable moves for a species with accurate isIllegal flag tagging
 */
export async function getLearnableMoves(speciesName: string): Promise<FormattedMove[]> {
  const spec = getSpecies(speciesName);
  const baseName = spec?.baseSpecies || speciesName;
  const learnsetData = await gen9.learnsets.get(baseName.toLowerCase());
  const all = getAllMoves(9);

  if (!learnsetData || !learnsetData.learnset) {
    return all.map((m) => ({ ...m, isIllegal: false }));
  }

  const learnableMoveIds = new Set(Object.keys(learnsetData.learnset));
  const isGmaxSpec = speciesName.includes('Gmax') || spec?.forme === 'Gmax';

  // Always legal universal moves
  const universalMoves = new Set(['terablast', 'struggle', 'hiddenpower', 'frustration', 'return', 'facade']);

  const taggedMoves = all.map((m) => {
    // Check base move ID without suffix for variant moves
    const baseId = m.id.split('-')[0];
    const isLegal =
      learnableMoveIds.has(m.id) ||
      learnableMoveIds.has(baseId) ||
      universalMoves.has(baseId) ||
      (isGmaxSpec && m.isGmax);

    return {
      ...m,
      isIllegal: !isLegal,
    };
  });

  // Sort legal moves first, then alphabetical
  return taggedMoves.sort((a, b) => {
    if (a.isIllegal !== b.isIllegal) {
      return a.isIllegal ? 1 : -1;
    }
    return a.name.localeCompare(b.name);
  });
}

export function getAllAbilities(gen: number = 9) {
  const abilities: Array<{
    id: string;
    name: string;
    desc: string;
    shortDesc: string;
  }> = [];

  for (const a of Dex.abilities.all()) {
    if (a.exists && a.isNonstandard !== 'Custom') {
      abilities.push({
        id: a.id,
        name: a.name,
        desc: a.desc || a.shortDesc || '',
        shortDesc: a.shortDesc || '',
      });
    }
  }

  return abilities.sort((a, b) => a.name.localeCompare(b.name));
}

export interface FormattedItem {
  id: string;
  name: string;
  desc: string;
  shortDesc: string;
  spriteNum: number;
  isMegaStone: boolean;
  megaSpecies?: string;
}

export function getAllItems(gen: number = 9): FormattedItem[] {
  const items: FormattedItem[] = [];

  for (const i of Dex.items.all()) {
    if (i.exists && i.isNonstandard !== 'Custom') {
      const isMega = !!(i.megaStone || i.name.endsWith('ite') || i.name.endsWith('ite X') || i.name.endsWith('ite Y'));
      const megaTarget = i.megaStone ? Object.values(i.megaStone)[0] : undefined;

      items.push({
        id: i.id,
        name: i.name,
        desc: i.desc || i.shortDesc || '',
        shortDesc: i.shortDesc || '',
        spriteNum: (i as unknown as Record<string, number>).spritenum ?? 0,
        isMegaStone: isMega,
        megaSpecies: megaTarget,
      });
    }
  }

  return items.sort((a, b) => a.name.localeCompare(b.name));
}

export function getAllNatures(): NatureData[] {
  const natures: NatureData[] = [];

  for (const n of Dex.natures.all()) {
    natures.push({
      name: n.name,
      plus: n.plus ? (n.plus as StatName) : null,
      minus: n.minus ? (n.minus as StatName) : null,
    });
  }

  return natures.sort((a, b) => a.name.localeCompare(b.name));
}

export function calculateStat(
  stat: StatName,
  base: number,
  iv: number,
  ev: number,
  level: number,
  nature: NatureData
): number {
  if (stat === 'hp') {
    if (base === 1) return 1;
    return Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level) / 100) + level + 10;
  }

  let value = Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level) / 100) + 5;

  if (nature.plus === stat) {
    value = Math.floor(value * 1.1);
  } else if (nature.minus === stat) {
    value = Math.floor(value * 0.9);
  }

  return value;
}

export function getAllTypes(): PokemonType[] {
  return [
    'Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice',
    'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic', 'Bug',
    'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy',
  ];
}

export const GENERATIONS = [
  { num: 1, name: 'Gen 1', label: 'RBY', region: 'Kanto' },
  { num: 2, name: 'Gen 2', label: 'GSC', region: 'Johto' },
  { num: 3, name: 'Gen 3', label: 'ADV', region: 'Hoenn' },
  { num: 4, name: 'Gen 4', label: 'DPPt', region: 'Sinnoh' },
  { num: 5, name: 'Gen 5', label: 'BW', region: 'Unova' },
  { num: 6, name: 'Gen 6', label: 'XY', region: 'Kalos' },
  { num: 7, name: 'Gen 7', label: 'SM', region: 'Alola' },
  { num: 8, name: 'Gen 8', label: 'SS', region: 'Galar' },
  { num: 9, name: 'Gen 9', label: 'SV', region: 'Paldea' },
];

const learnsetCache = new Map<string, Set<string>>();

export async function getLearnsetForSpecies(speciesId: string): Promise<Set<string>> {
  const spec = getSpecies(speciesId);
  const baseName = spec?.baseSpecies || speciesId;
  const cacheKey = baseName.toLowerCase();

  if (learnsetCache.has(cacheKey)) {
    return learnsetCache.get(cacheKey)!;
  }

  const ls = await gen9.learnsets.get(cacheKey);
  const movesSet = new Set<string>();
  if (ls && ls.learnset) {
    for (const moveId of Object.keys(ls.learnset)) {
      movesSet.add(moveId);
    }
  }
  learnsetCache.set(cacheKey, movesSet);
  return movesSet;
}

export async function filterSpeciesByMoves(
  speciesList: FormattedSpecies[],
  moveNames: string[]
): Promise<FormattedSpecies[]> {
  if (!moveNames || moveNames.length === 0) return speciesList;
  const moveIds = moveNames.map((m) => m.toLowerCase().replace(/[^a-z0-9]/g, ''));

  const matching: FormattedSpecies[] = [];
  for (const s of speciesList) {
    const ls = await getLearnsetForSpecies(s.id);
    if (moveIds.every((mId) => ls.has(mId))) {
      matching.push(s);
    }
  }
  return matching;
}

