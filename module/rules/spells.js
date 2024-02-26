export const SPELL_TYPES = Object.freeze({
  SPELL_CLERIC: 'spell_cleric',
  SPELL_MAGIC: 'spell_magic',
  SPELL_DRUID: 'spell_druid',
});

export const MAX_SPELL_LEVELS = Object.freeze({
  [SPELL_TYPES.SPELL_CLERIC]: 6,
  [SPELL_TYPES.SPELL_MAGIC]: 7,
  [SPELL_TYPES.SPELL_DRUID]: 6,
});

export const SPELL_SCHOOLS = Object.freeze({
  ABJURATION: 'abjuration',
  ALTERATION: 'alteration',
  CONJURATION: 'conjuration',
  DIVINATION: 'divination',
  ENCHANTMENT: 'enchantment',
  EVOCATION: 'evocation',
  ILLUSION: 'illusion',
  NECROMANCY: 'necromancy',
});

export const SPECIALIST_CHOSEN_SCHOOLS = Object.freeze({
  ABJURER: SPELL_SCHOOLS.ABJURATION,
  CONJURER: SPELL_SCHOOLS.CONJURATION,
  DIVINER: SPELL_SCHOOLS.DIVINATION,
  ENCHANTER: SPELL_SCHOOLS.ENCHANTMENT,
  EVOKER: SPELL_SCHOOLS.EVOCATION,
  ILLUSIONIST: SPELL_SCHOOLS.ILLUSION,
  NECROMANCER: SPELL_SCHOOLS.NECROMANCY,
  TRANSMUTER: SPELL_SCHOOLS.ALTERATION,
});

export const OPPOSING_SCHOOLS = Object.freeze({
  [SPELL_SCHOOLS.ABJURATION]: [SPELL_SCHOOLS.ALTERATION],
  [SPELL_SCHOOLS.ALTERATION]: [SPELL_SCHOOLS.ABJURATION],
  [SPELL_SCHOOLS.CONJURATION]: [SPELL_SCHOOLS.DIVINATION],
  [SPELL_SCHOOLS.DIVINATION]: [SPELL_SCHOOLS.CONJURATION],
  [SPELL_SCHOOLS.ENCHANTMENT]: [SPELL_SCHOOLS.EVOCATION],
  [SPELL_SCHOOLS.EVOCATION]: [SPELL_SCHOOLS.ENCHANTMENT],
  [SPELL_SCHOOLS.ILLUSION]: [SPELL_SCHOOLS.NECROMANCY],
  [SPELL_SCHOOLS.NECROMANCY]: [SPELL_SCHOOLS.ILLUSION],
});

// TODO downtime activity macro that sets a flag on character
// so only can do one downtime at once
// if not has spell, write scroll downtime macro, if in progress, allow cancelling it
// if has spell, read scroll macro
// write scroll macro ha form for spell name and level
// after that many days, changes name of scroll item to spell name, sets has_spell to true and changes macro
