import { deepFreeze } from './helper';

export const SPELL_TYPES = deepFreeze({
  SPELL_CLERIC: 'spell_cleric',
  SPELL_MAGICK: 'spell_magick',
  SPELL_WITCH: 'spell_witch',
});

export const MAX_SPELL_LEVELS = deepFreeze({
  [SPELL_TYPES.SPELL_CLERIC]: 6,
  [SPELL_TYPES.SPELL_MAGICK]: 7,
  [SPELL_TYPES.SPELL_WITCH]: 6,
});

export const SPELL_SCHOOLS = Array.freeze([
  'abjuration',
  'alteration',
  'conjuration',
  'divination',
  'enchantment',
  'evocation',
  'illusion',
  'necromancy',
]);
