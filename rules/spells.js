export const spellTypesEnum = Object.freeze({
  SPELL_CLERIC: 'spell_cleric',
  SPELL_MAGICK: 'spell_magick',
  SPELL_WITCH: 'spell_witch',
});

export const maxSpellLevels = Object.freeze({
  [SPELL_TYPES.SPELL_CLERIC]: 6,
  [SPELL_TYPES.SPELL_MAGICK]: 7,
  [SPELL_TYPES.SPELL_WITCH]: 6,
});
