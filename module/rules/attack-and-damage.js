export const PHYSICAL_DMG_TYPES = {
  BLUNT: 'blunt', // B
  PIERCE: 'pierce', // P
  SLASH: 'slash', // S
  // TODO rend?
};

export const MAGIC_DMG_TYPES = {
  HOLY: 'holy', // H
  FIRE: 'fire', // F
  COLD: 'cold', // C
  ELECTRICITY: 'electricity', // E
  ACID: 'acid', // A
};

export const ATK_MODES = {
  'swi(B)': {
    ATK_ATTR: 'str',
    DMG_ATTR: 'str',
    DMG_TYPE: 'blunt',
    ATK_TYPE: 'melee',
    ATK_FORM: 'swing',
  },
  'swi(S)': {
    ATK_ATTR: 'str',
    DMG_ATTR: 'str',
    DMG_TYPE: 'slash',
    ATK_TYPE: 'melee',
    ATK_FORM: 'swing',
  },
  'swi(P)': {
    ATK_ATTR: 'str',
    DMG_ATTR: 'str',
    DMG_TYPE: 'pierce',
    ATK_TYPE: 'melee',
    ATK_FORM: 'swing',
  },
  'thr(B)': {
    ATK_ATTR: 'dex',
    DMG_ATTR: 'str',
    DMG_TYPE: 'blunt',
    ATK_TYPE: 'melee',
    ATK_FORM: 'thrust',
  },
  'thr(S)': {
    ATK_ATTR: 'dex',
    DMG_ATTR: 'str',
    DMG_TYPE: 'slash',
    ATK_TYPE: 'melee',
    ATK_FORM: 'thrust',
  },
  'thr(P)': {
    ATK_ATTR: 'dex',
    DMG_ATTR: 'str',
    DMG_TYPE: 'pierce',
    ATK_TYPE: 'melee',
    ATK_FORM: 'thrust',
  },
  'sho(B)': {
    ATK_ATTR: 'dex',
    DMG_ATTR: null,
    DMG_TYPE: 'blunt',
    ATK_TYPE: 'missile',
    ATK_FORM: 'shoot',
  },
  'sho(S)': {
    ATK_ATTR: 'dex',
    DMG_ATTR: null,
    DMG_TYPE: 'slash',
    ATK_TYPE: 'missile',
    ATK_FORM: 'shoot',
  },
  'sho(P)': {
    ATK_ATTR: 'dex',
    DMG_ATTR: null,
    DMG_TYPE: 'pierce',
    ATK_TYPE: 'missile',
    ATK_FORM: 'shoot',
  },
  'thrw(B)': {
    ATK_ATTR: 'dex',
    DMG_ATTR: 'str',
    DMG_TYPE: 'blunt',
    ATK_TYPE: 'missile',
    ATK_FORM: 'throw',
  },
  'thrw(S)': {
    ATK_ATTR: 'dex',
    DMG_ATTR: 'str',
    DMG_TYPE: 'slash',
    ATK_TYPE: 'missile',
    ATK_FORM: 'throw',
  },
  'thrw(P)': {
    ATK_ATTR: 'dex',
    DMG_ATTR: 'str',
    DMG_TYPE: 'pierce',
    ATK_TYPE: 'missile',
    ATK_FORM: 'throw',
  },
};
