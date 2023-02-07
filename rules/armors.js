export const ARMOR_MATERIALS = {
  bone: {
    weight: 40,
    clo: 10,
    value: 180,
    metal: false,
    bulky: true,
  },
  wood: {
    weight: 40,
    clo: 10,
    value: 120,
    metal: false,
    bulky: true,
  },
  fur: {
    weight: 20,
    clo: 32,
    value: 600,
    metal: false,
    bulky: false,
  },
  leather: {
    weight: 16,
    clo: 10,
    value: 300,
    metal: false,
    bulky: false,
  },
  padded: {
    weight: 16,
    clo: 18,
    value: 240,
    metal: false,
    bulky: false,
  },
  'cuir bouilli': {
    weight: 24,
    clo: 9,
    value: 360,
    metal: false,
    bulky: true,
  },
  brigandine: {
    weight: 80,
    clo: 16,
    value: 1200,
    metal: true,
    bulky: true,
  },
  scale: {
    weight: 88,
    clo: 13,
    value: 960,
    metal: true,
    bulky: false,
  },
  mail: {
    weight: 48,
    clo: 2,
    value: 1800,
    metal: true,
    bulky: false,
  },
  'elven mail': {
    weight: 24,
    clo: 1,
    value: 18000,
    metal: true,
    bulky: false,
  },
  'plated mail': {
    weight: 60,
    clo: 4,
    value: 2400,
    metal: true,
    bulky: false,
  },
  lamellar: {
    weight: 88,
    clo: 11,
    value: 1440,
    metal: true,
    bulky: true,
  },
  splint: {
    weight: 72,
    clo: 14,
    value: 1920,
    metal: true,
    bulky: true,
  },
  'iron plate': {
    weight: 80,
    clo: 10,
    value: 2880,
    metal: true,
    bulky: true,
  },
  'steel plate': {
    weight: 72,
    clo: 8,
    value: 7200,
    metal: true,
    bulky: true,
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
    rending: {
      ac: 0,
      dr: 0,
    },
  },
  fur: {
    base_AC: 1,
    blunt: {
      ac: 0,
      dr: 1,
    },
    piercing: {
      ac: 0,
      dr: 1,
    },
    slashing: {
      ac: 0,
      dr: 0,
    },
    rending: {
      ac: -1,
      dr: 1,
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
    rending: {
      ac: -2,
      dr: 2,
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
    rending: {
      ac: -2,
      dr: 1,
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
    rending: {
      ac: -2,
      dr: 2,
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
    rending: {
      ac: -2,
      dr: 2,
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
    rending: {
      ac: -2,
      dr: 2,
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
    rending: {
      ac: -2,
      dr: 2,
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
    rending: {
      ac: -3,
      dr: 2,
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
    rending: {
      ac: -3,
      dr: 3,
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
    rending: {
      ac: -3,
      dr: 3,
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
    rending: {
      ac: -3,
      dr: 3,
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
    rending: {
      ac: -4,
      dr: 3,
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
    rending: {
      ac: -4,
      dr: 2,
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
    rending: {
      ac: -5,
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
    rending: {
      ac: -6,
      dr: 2,
    },
  },
};
