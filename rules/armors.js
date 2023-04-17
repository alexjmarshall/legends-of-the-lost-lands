export const WEIGHT_TYPES = {
  LIGHT: 'light',
  MEDIUM: 'medium',
  HEAVY: 'heavy',
};

export const ARMOR_MATERIALS = {
  bone: {
    weight: 42,
    clo: 10,
    value: 180,
    metal: false,
    bulky: true,
    type: WEIGHT_TYPES.MEDIUM,
    durability: 56,
  },
  wood: {
    weight: 40,
    clo: 10,
    value: 120,
    metal: false,
    bulky: true,
    type: WEIGHT_TYPES.MEDIUM,
    durability: 48,
  },
  fur: {
    weight: 20,
    clo: 32,
    value: 600,
    metal: false,
    bulky: false,
    type: WEIGHT_TYPES.LIGHT,
    durability: 74,
  },
  leather: {
    weight: 16,
    clo: 10,
    value: 300,
    metal: false,
    bulky: false,
    type: WEIGHT_TYPES.LIGHT,
    durability: 80,
  },
  padded: {
    weight: 18,
    clo: 18,
    value: 240,
    metal: false,
    bulky: false,
    type: WEIGHT_TYPES.LIGHT,
    durability: 72,
  },
  'cuir bouilli': {
    weight: 24,
    clo: 9,
    value: 360,
    metal: false,
    bulky: true,
    type: WEIGHT_TYPES.LIGHT,
    durability: 60,
  },
  brigandine: {
    weight: 64,
    clo: 16,
    value: 1200,
    metal: true,
    bulky: true,
    type: WEIGHT_TYPES.MEDIUM,
    durability: 68,
  },
  scale: {
    weight: 68,
    clo: 13,
    value: 960,
    metal: true,
    bulky: false,
    type: WEIGHT_TYPES.MEDIUM,
    durability: 76,
  },
  mail: {
    weight: 48,
    clo: 2,
    value: 1800,
    metal: true,
    bulky: false,
    type: WEIGHT_TYPES.MEDIUM,
    durability: 120,
  },
  'elven mail': {
    weight: 24,
    clo: 1,
    value: 18000,
    metal: true,
    bulky: false,
    type: WEIGHT_TYPES.LIGHT,
    durability: 360,
  },
  'plated mail': {
    weight: 58,
    clo: 4,
    value: 2400,
    metal: true,
    bulky: false,
    type: WEIGHT_TYPES.MEDIUM,
    durability: 84,
  },
  lamellar: {
    weight: 70,
    clo: 11,
    value: 1440,
    metal: true,
    bulky: true,
    type: WEIGHT_TYPES.HEAVY,
    durability: 52,
  },
  splint: {
    weight: 76,
    clo: 14,
    value: 1920,
    metal: true,
    bulky: true,
    type: WEIGHT_TYPES.HEAVY,
    durability: 72,
  },
  'iron plate': {
    weight: 80,
    clo: 10,
    value: 2880,
    metal: true,
    bulky: true,
    type: WEIGHT_TYPES.HEAVY,
    durability: 60,
  },
  'steel plate': {
    weight: 72,
    clo: 8,
    value: 7200,
    metal: true,
    bulky: true,
    type: WEIGHT_TYPES.HEAVY,
    durability: 70,
  },
};

export const ARMOR_VS_DMG_TYPE = {
  none: {
    base_AC: 0,
    blunt: {
      ac: 1,
      dr: 0,
    },
    piercing: {
      ac: 0,
      dr: 0,
    },
    slashing: {
      ac: -1,
      dr: 0,
    },
  },
  fur: {
    base_AC: 1,
    blunt: {
      ac: 1,
      dr: 0,
    },
    piercing: {
      ac: 0,
      dr: 0,
    },
    slashing: {
      ac: -1,
      dr: 0,
    },
  },
  leather: {
    base_AC: 2,
    blunt: {
      ac: 0,
      dr: 0,
    },
    piercing: {
      ac: 0,
      dr: 1,
    },
    slashing: {
      ac: -1,
      dr: 1,
    },
  },
  padded: {
    base_AC: 2,
    blunt: {
      ac: 0,
      dr: 1,
    },
    piercing: {
      ac: -1,
      dr: 1,
    },
    slashing: {
      ac: -1,
      dr: 0,
    },
  },
  'cuir bouilli': {
    base_AC: 2,
    blunt: {
      ac: 1,
      dr: 1,
    },
    piercing: {
      ac: 1,
      dr: 0,
    },
    slashing: {
      ac: 0,
      dr: 0,
    },
  },
  wood: {
    base_AC: 2,
    blunt: {
      ac: 1,
      dr: 1,
    },
    piercing: {
      ac: 1,
      dr: 0,
    },
    slashing: {
      ac: 0,
      dr: 0,
    },
  },
  bone: {
    base_AC: 2,
    blunt: {
      ac: 1,
      dr: 1,
    },
    piercing: {
      ac: 1,
      dr: 0,
    },
    slashing: {
      ac: 0,
      dr: 0,
    },
  },
  scale: {
    base_AC: 2,
    blunt: {
      ac: 2,
      dr: 0,
    },
    piercing: {
      ac: 1,
      dr: 0,
    },
    slashing: {
      ac: 3,
      dr: 0,
    },
  },
  brigandine: {
    base_AC: 3,
    blunt: {
      ac: 1,
      dr: 1,
    },
    piercing: {
      ac: 0,
      dr: 1,
    },
    slashing: {
      ac: 1,
      dr: 0,
    },
  },
  mail: {
    base_AC: 3,
    blunt: {
      ac: 0,
      dr: 0,
    },
    piercing: {
      ac: -1,
      dr: 1,
    },
    slashing: {
      ac: 2,
      dr: 1,
    },
  },
  'elven mail': {
    base_AC: 3,
    blunt: {
      ac: 0,
      dr: 0,
    },
    piercing: {
      ac: -1,
      dr: 1,
    },
    slashing: {
      ac: 2,
      dr: 1,
    },
  },
  lamellar: {
    base_AC: 3,
    blunt: {
      ac: 0,
      dr: 1,
    },
    piercing: {
      ac: 2,
      dr: 1,
    },
    slashing: {
      ac: 1,
      dr: 1,
    },
  },
  'plated mail': {
    base_AC: 4,
    blunt: {
      ac: 0,
      dr: 0,
    },
    piercing: {
      ac: 2,
      dr: 0,
    },
    slashing: {
      ac: 1,
      dr: 1,
    },
  },
  splint: {
    base_AC: 4,
    blunt: {
      ac: -1,
      dr: 1,
    },
    piercing: {
      ac: 1,
      dr: 0,
    },
    slashing: {
      ac: 1,
      dr: 1,
    },
  },
  'iron plate': {
    base_AC: 5,
    blunt: {
      ac: -1,
      dr: 1,
    },
    piercing: {
      ac: 2,
      dr: 0,
    },
    slashing: {
      ac: 1,
      dr: 2,
    },
  },
  'steel plate': {
    base_AC: 6,
    blunt: {
      ac: -1,
      dr: 2,
    },
    piercing: {
      ac: 3,
      dr: 0,
    },
    slashing: {
      ac: 1,
      dr: 2,
    },
  },
};

export const ALL_ARMORS = Object.keys(ARMOR_MATERIALS);

export const NON_METAL_ARMORS = Object.keys(ARMOR_MATERIALS).filter((k) => !ARMOR_MATERIALS[k].metal);

export const LIGHT_ARMORS = Object.keys(ARMOR_MATERIALS).filter((k) => ARMOR_MATERIALS[k].type === WEIGHT_TYPES.LIGHT);

export const SHIELD_TYPES = {
  SMALL: 'small',
  MEDIUM: 'medium',
  LARGE: 'large',
};

export const ALL_SHIELD_TYPES = Object.values(SHIELD_TYPES);
