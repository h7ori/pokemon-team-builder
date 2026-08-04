// Pokémon sprite URL helpers

const POKEAPI_SPRITES = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';
const SHOWDOWN_SPRITES = 'https://play.pokemonshowdown.com/sprites';

/**
 * Get the official artwork URL for a Pokémon
 */
export function getOfficialArtwork(dexNum: number): string {
  return `${POKEAPI_SPRITES}/other/official-artwork/${dexNum}.png`;
}

/**
 * Get the animated sprite URL (Pokémon Showdown)
 */
export function getAnimatedSprite(name: string, shiny: boolean = false): string {
  const slug = toShowdownSlug(name);
  const folder = shiny ? 'ani-shiny' : 'ani';
  return `${SHOWDOWN_SPRITES}/${folder}/${slug}.gif`;
}

/**
 * Get the static sprite URL (fallback)
 */
export function getStaticSprite(name: string, shiny: boolean = false): string {
  const slug = toShowdownSlug(name);
  const folder = shiny ? 'gen5-shiny' : 'gen5';
  return `${SHOWDOWN_SPRITES}/${folder}/${slug}.png`;
}

/**
 * Get the Pokémon sprite with fallback chain
 */
export function getPokemonSprite(
  name: string,
  dexNum: number,
  options: { animated?: boolean; shiny?: boolean } = {}
): { primary: string; fallback: string; artwork: string } {
  const { animated = true, shiny = false } = options;

  return {
    primary: animated
      ? getAnimatedSprite(name, shiny)
      : getStaticSprite(name, shiny),
    fallback: getStaticSprite(name, shiny),
    artwork: getOfficialArtwork(dexNum),
  };
}

/**
 * Get the item sprite URL
 */
export function getItemSprite(name: string): string {
  const slug = toShowdownSlug(name);
  return `${SHOWDOWN_SPRITES}/itemicons-sheet.png`;
}

/**
 * Get type icon URL (we use embedded SVGs instead)
 */
export function getTypeIconUrl(type: string): string {
  return `${SHOWDOWN_SPRITES}/types/${type}.png`;
}

/**
 * Convert a Pokémon name to the Showdown sprite slug format
 */
function toShowdownSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .replace(/^-+|-+$/g, '');
}

/**
 * Type color map for UI theming
 */
export const TYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Normal:   { bg: '#A8A77A', text: '#fff', border: '#8a896a' },
  Fire:     { bg: '#EE8130', text: '#fff', border: '#c96a28' },
  Water:    { bg: '#6390F0', text: '#fff', border: '#4f73c2' },
  Electric: { bg: '#F7D02C', text: '#333', border: '#c9a824' },
  Grass:    { bg: '#7AC74C', text: '#fff', border: '#5fa33a' },
  Ice:      { bg: '#96D9D6', text: '#333', border: '#78b3b0' },
  Fighting: { bg: '#C22E28', text: '#fff', border: '#9e2520' },
  Poison:   { bg: '#A33EA1', text: '#fff', border: '#843282' },
  Ground:   { bg: '#E2BF65', text: '#333', border: '#b89a51' },
  Flying:   { bg: '#A98FF3', text: '#fff', border: '#8973c5' },
  Psychic:  { bg: '#F95587', text: '#fff', border: '#c9446c' },
  Bug:      { bg: '#A6B91A', text: '#fff', border: '#879716' },
  Rock:     { bg: '#B6A136', text: '#fff', border: '#94832c' },
  Ghost:    { bg: '#735797', text: '#fff', border: '#5d467a' },
  Dragon:   { bg: '#6F35FC', text: '#fff', border: '#592bca' },
  Dark:     { bg: '#705746', text: '#fff', border: '#5a4638' },
  Steel:    { bg: '#B7B7CE', text: '#333', border: '#9494a7' },
  Fairy:    { bg: '#D685AD', text: '#fff', border: '#ad6b8c' },
  Stellar:  { bg: '#44628E', text: '#fff', border: '#374f73' },
};

/**
 * Type gradient for premium UI effects
 */
export const TYPE_GRADIENTS: Record<string, string> = {
  Normal:   'linear-gradient(135deg, #A8A77A, #C6C5A0)',
  Fire:     'linear-gradient(135deg, #EE8130, #F4A460)',
  Water:    'linear-gradient(135deg, #6390F0, #87CEEB)',
  Electric: 'linear-gradient(135deg, #F7D02C, #FFE87C)',
  Grass:    'linear-gradient(135deg, #7AC74C, #A0D870)',
  Ice:      'linear-gradient(135deg, #96D9D6, #BFF0EE)',
  Fighting: 'linear-gradient(135deg, #C22E28, #E8524D)',
  Poison:   'linear-gradient(135deg, #A33EA1, #C860C5)',
  Ground:   'linear-gradient(135deg, #E2BF65, #F0D88A)',
  Flying:   'linear-gradient(135deg, #A98FF3, #C4B2F7)',
  Psychic:  'linear-gradient(135deg, #F95587, #FF7FAA)',
  Bug:      'linear-gradient(135deg, #A6B91A, #C4D52E)',
  Rock:     'linear-gradient(135deg, #B6A136, #D4BF54)',
  Ghost:    'linear-gradient(135deg, #735797, #9570BB)',
  Dragon:   'linear-gradient(135deg, #6F35FC, #9060FF)',
  Dark:     'linear-gradient(135deg, #705746, #8C6E5E)',
  Steel:    'linear-gradient(135deg, #B7B7CE, #D4D4E8)',
  Fairy:    'linear-gradient(135deg, #D685AD, #F0A8CC)',
  Stellar:  'linear-gradient(135deg, #44628E, #6080B0)',
};
