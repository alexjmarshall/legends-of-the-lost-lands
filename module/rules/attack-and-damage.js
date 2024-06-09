import { ABILITIES } from './abilities.js';

export const PHYSICAL_DMG_TYPES = Object.freeze({
  BLUNT: 'blunt', // B
  PIERCE: 'pierce', // P
  SLASH: 'slash', // S
});

export const physicalDmgTypes = Object.freeze(Object.values(PHYSICAL_DMG_TYPES));

export const MAGIC_DMG_TYPES = Object.freeze({
  HOLY: 'holy', // H
  FIRE: 'fire', // F
  COLD: 'cold', // C
  ELECTRICITY: 'electricity', // E
  ACID: 'acid', // A
});

export const ATK_TYPES = Object.freeze({
  MELEE: 'melee',
  MISSILE: 'missile',
});

export const ATK_FORMS = Object.freeze({
  SWING: 'swing',
  THRUST: 'thrust',
  SHOOT: 'shoot',
  THROW: 'throw',
});

export const ATK_MODES = {
  'swi(B)': {
    ATK_ATTR: [ABILITIES.STR],
    DMG_ATTR: [ABILITIES.STR],
    DMG_TYPE: [PHYSICAL_DMG_TYPES.BLUNT],
    ATK_TYPE: [ATK_TYPES.MELEE],
    ATK_FORM: [ATK_FORMS.SWING],
  },
  'swi(S)': {
    ATK_ATTR: [ABILITIES.STR],
    DMG_ATTR: [ABILITIES.STR],
    DMG_TYPE: [PHYSICAL_DMG_TYPES.SLASH],
    ATK_TYPE: [ATK_TYPES.MELEE],
    ATK_FORM: [ATK_FORMS.SWING],
  },
  'swi(P)': {
    ATK_ATTR: [ABILITIES.STR],
    DMG_ATTR: [ABILITIES.STR],
    DMG_TYPE: [PHYSICAL_DMG_TYPES.PIERCE],
    ATK_TYPE: [ATK_TYPES.MELEE],
    ATK_FORM: [ATK_FORMS.SWING],
  },
  'thr(B)': {
    ATK_ATTR: [ABILITIES.DEX],
    DMG_ATTR: [ABILITIES.STR],
    DMG_TYPE: [PHYSICAL_DMG_TYPES.BLUNT],
    ATK_TYPE: [ATK_TYPES.MELEE],
    ATK_FORM: [ATK_FORMS.THRUST],
  },
  'thr(S)': {
    ATK_ATTR: [ABILITIES.DEX],
    DMG_ATTR: [ABILITIES.STR],
    DMG_TYPE: [PHYSICAL_DMG_TYPES.SLASH],
    ATK_TYPE: [ATK_TYPES.MELEE],
    ATK_FORM: [ATK_FORMS.THRUST],
  },
  'thr(P)': {
    ATK_ATTR: [ABILITIES.DEX],
    DMG_ATTR: [ABILITIES.STR],
    DMG_TYPE: [PHYSICAL_DMG_TYPES.PIERCE],
    ATK_TYPE: [ATK_TYPES.MELEE],
    ATK_FORM: [ATK_FORMS.THRUST],
  },
  'sho(B)': {
    ATK_ATTR: [ABILITIES.DEX],
    DMG_ATTR: null,
    DMG_TYPE: [PHYSICAL_DMG_TYPES.BLUNT],
    ATK_TYPE: [ATK_TYPES.MISSILE],
    ATK_FORM: [ATK_FORMS.SHOOT],
  },
  'sho(S)': {
    ATK_ATTR: [ABILITIES.DEX],
    DMG_ATTR: null,
    DMG_TYPE: [PHYSICAL_DMG_TYPES.SLASH],
    ATK_TYPE: [ATK_TYPES.MISSILE],
    ATK_FORM: [ATK_FORMS.SHOOT],
  },
  'sho(P)': {
    ATK_ATTR: [ABILITIES.DEX],
    DMG_ATTR: null,
    DMG_TYPE: [PHYSICAL_DMG_TYPES.PIERCE],
    ATK_TYPE: [ATK_TYPES.MISSILE],
    ATK_FORM: [ATK_FORMS.SHOOT],
  },
  'thrw(B)': {
    ATK_ATTR: [ABILITIES.DEX],
    DMG_ATTR: [ABILITIES.STR],
    DMG_TYPE: [PHYSICAL_DMG_TYPES.BLUNT],
    ATK_TYPE: [ATK_TYPES.MISSILE],
    ATK_FORM: [ATK_FORMS.THROW],
  },
  'thrw(S)': {
    ATK_ATTR: [ABILITIES.DEX],
    DMG_ATTR: [ABILITIES.STR],
    DMG_TYPE: [PHYSICAL_DMG_TYPES.SLASH],
    ATK_TYPE: [ATK_TYPES.MISSILE],
    ATK_FORM: [ATK_FORMS.THROW],
  },
  'thrw(P)': {
    ATK_ATTR: [ABILITIES.DEX],
    DMG_ATTR: [ABILITIES.STR],
    DMG_TYPE: [PHYSICAL_DMG_TYPES.PIERCE],
    ATK_TYPE: [ATK_TYPES.MISSILE],
    ATK_FORM: [ATK_FORMS.THROW],
  },
};
