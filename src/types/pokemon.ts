// Core Pokémon type definitions

export type PokemonType =
  | 'Normal' | 'Fire' | 'Water' | 'Electric' | 'Grass' | 'Ice'
  | 'Fighting' | 'Poison' | 'Ground' | 'Flying' | 'Psychic' | 'Bug'
  | 'Rock' | 'Ghost' | 'Dragon' | 'Dark' | 'Steel' | 'Fairy';

export type StatName = 'hp' | 'atk' | 'def' | 'spa' | 'spd' | 'spe';

export type MoveCategory = 'Physical' | 'Special' | 'Status';

export type Gender = 'M' | 'F' | 'N';

export interface BaseStats {
  hp: number;
  atk: number;
  def: number;
  spa: number;
  spd: number;
  spe: number;
}

export interface EVSpread {
  hp: number;
  atk: number;
  def: number;
  spa: number;
  spd: number;
  spe: number;
}

export interface IVSpread {
  hp: number;
  atk: number;
  def: number;
  spa: number;
  spd: number;
  spe: number;
}

export interface CalculatedStats {
  hp: number;
  atk: number;
  def: number;
  spa: number;
  spd: number;
  spe: number;
}

export interface NatureData {
  name: string;
  plus: StatName | null;
  minus: StatName | null;
}

export interface MoveData {
  name: string;
  type: PokemonType;
  category: MoveCategory;
  basePower: number;
  accuracy: number | true; // true = always hits
  pp: number;
  priority: number;
  description: string;
  flags: Record<string, boolean>;
}

export interface PokemonSpecies {
  id: number;
  name: string;
  types: PokemonType[];
  baseStats: BaseStats;
  abilities: string[];
  hiddenAbility?: string;
  genderRatio?: { M: number; F: number };
  weightkg: number;
  heightm: number;
  tier?: string;
  isLegendary: boolean;
  isMythical: boolean;
  generation: number;
  forms: string[];
  evolutions: string[];
  learnset?: string[];
}

export interface TeamPokemon {
  id: string; // Unique instance ID
  species: string;
  nickname: string;
  gender: Gender | null;
  level: number;
  happiness: number;
  nature: string;
  ability: string;
  item: string;
  teraType: PokemonType | '';
  isShiny: boolean;
  pokeball: string;
  moves: [string, string, string, string];
  evs: EVSpread;
  ivs: IVSpread;
  form: string;
  isMega: boolean;
  isGmax: boolean;
  isDynamaxed: boolean;
}

export interface Team {
  id: string;
  name: string;
  pokemon: TeamPokemon[];
  generation: number;
  format: string;
  createdAt: number;
  updatedAt: number;
  isFavorite: boolean;
  isArchived: boolean;
  folder: string;
  notes: string;
}

export const DEFAULT_EVS: EVSpread = { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
export const DEFAULT_IVS: IVSpread = { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 };
export const MAX_EVS_TOTAL = 510;
export const MAX_EV_SINGLE = 252;
export const MAX_IV_SINGLE = 31;
export const MAX_TEAM_SIZE = 6;
export const MAX_MOVES = 4;
export const STAT_NAMES: Record<StatName, string> = {
  hp: 'HP',
  atk: 'Attack',
  def: 'Defense',
  spa: 'Sp. Atk',
  spd: 'Sp. Def',
  spe: 'Speed',
};

export const STAT_COLORS: Record<StatName, string> = {
  hp: '#FF5959',
  atk: '#F5AC78',
  def: '#FAE078',
  spa: '#9DB7F5',
  spd: '#A7DB8D',
  spe: '#FA92B2',
};

export function createEmptyPokemon(): TeamPokemon {
  return {
    id: crypto.randomUUID(),
    species: '',
    nickname: '',
    gender: null,
    level: 100,
    happiness: 255,
    nature: 'Adamant',
    ability: '',
    item: '',
    teraType: '',
    isShiny: false,
    pokeball: 'pokeball',
    moves: ['', '', '', ''],
    evs: { ...DEFAULT_EVS },
    ivs: { ...DEFAULT_IVS },
    form: '',
    isMega: false,
    isGmax: false,
    isDynamaxed: false,
  };
}

export function createEmptyTeam(): Team {
  return {
    id: crypto.randomUUID(),
    name: 'Untitled Team',
    pokemon: [],
    generation: 9,
    format: '',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isFavorite: false,
    isArchived: false,
    folder: '',
    notes: '',
  };
}
