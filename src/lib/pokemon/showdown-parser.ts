import { Sets } from '@pkmn/sets';
import type { TeamPokemon, Gender, PokemonType } from '@/types/pokemon';
import { createEmptyPokemon } from '@/types/pokemon';

/**
 * Parses a Pokémon Showdown text string into a TeamPokemon object
 */
export function parseShowdownSet(text: string): TeamPokemon {
  const parsed = Sets.importSet(text);
  const pokemon = createEmptyPokemon();

  if (!parsed || !parsed.species) {
    return pokemon;
  }

  pokemon.species = parsed.species;
  pokemon.nickname = parsed.name && parsed.name !== parsed.species ? parsed.name : '';
  pokemon.item = parsed.item || '';
  pokemon.ability = parsed.ability || '';
  pokemon.nature = parsed.nature || 'Adamant';
  pokemon.level = parsed.level || 100;
  pokemon.gender = (parsed.gender as Gender) || null;
  pokemon.isShiny = !!parsed.shiny;
  pokemon.happiness = parsed.happiness !== undefined ? parsed.happiness : 255;
  pokemon.teraType = (parsed.teraType as PokemonType) || '';
  pokemon.pokeball = parsed.pokeball || 'pokeball';

  // Moves
  const moves: [string, string, string, string] = ['', '', '', ''];
  if (parsed.moves && Array.isArray(parsed.moves)) {
    parsed.moves.forEach((move, i) => {
      if (i < 4) moves[i] = move;
    });
  }
  pokemon.moves = moves;

  // EVs
  if (parsed.evs) {
    pokemon.evs = {
      hp: parsed.evs.hp || 0,
      atk: parsed.evs.atk || 0,
      def: parsed.evs.def || 0,
      spa: parsed.evs.spa || 0,
      spd: parsed.evs.spd || 0,
      spe: parsed.evs.spe || 0,
    };
  }

  // IVs
  if (parsed.ivs) {
    pokemon.ivs = {
      hp: parsed.ivs.hp !== undefined ? parsed.ivs.hp : 31,
      atk: parsed.ivs.atk !== undefined ? parsed.ivs.atk : 31,
      def: parsed.ivs.def !== undefined ? parsed.ivs.def : 31,
      spa: parsed.ivs.spa !== undefined ? parsed.ivs.spa : 31,
      spd: parsed.ivs.spd !== undefined ? parsed.ivs.spd : 31,
      spe: parsed.ivs.spe !== undefined ? parsed.ivs.spe : 31,
    };
  }

  // Forms / Gmax
  if (parsed.gigantamax) {
    pokemon.isGmax = true;
  }

  return pokemon;
}

/**
 * Converts a TeamPokemon object to a Pokémon Showdown text string
 */
export function exportShowdownSet(pokemon: TeamPokemon): string {
  if (!pokemon.species) return '';

  const set = {
    name: pokemon.nickname || pokemon.species,
    species: pokemon.species,
    item: pokemon.item || undefined,
    ability: pokemon.ability || undefined,
    moves: pokemon.moves.filter(Boolean),
    nature: pokemon.nature || 'Adamant',
    gender: pokemon.gender || undefined,
    level: pokemon.level !== 100 ? pokemon.level : undefined,
    shiny: pokemon.isShiny || undefined,
    happiness: pokemon.happiness !== 255 ? pokemon.happiness : undefined,
    teraType: pokemon.teraType || undefined,
    evs: pokemon.evs,
    ivs: pokemon.ivs,
    gigantamax: pokemon.isGmax || undefined,
  };

  return Sets.exportSet(set as any);
}

/**
 * Parses a full team text block (multiple Showdown sets separated by newlines)
 */
export function parseShowdownTeam(text: string): TeamPokemon[] {
  const blocks = text.split(/\n\s*\n/);
  const result: TeamPokemon[] = [];

  for (const block of blocks) {
    if (block.trim()) {
      const parsed = parseShowdownSet(block);
      if (parsed.species) {
        result.push(parsed);
      }
    }
  }

  return result.slice(0, 6);
}

/**
 * Exports a full team of TeamPokemon objects to a Showdown text block
 */
export function exportShowdownTeam(pokemonList: TeamPokemon[]): string {
  return pokemonList
    .filter((p) => p.species)
    .map((p) => exportShowdownSet(p))
    .join('\n\n');
}
