import { deepFreeze } from '../helper.js';
import { PHYSICAL_DMG_TYPES } from './attack-and-damage.js';

const { BLUNT, PIERCE, SLASH } = PHYSICAL_DMG_TYPES;

export const WEIGHT_TYPES = Object.freeze({
  LIGHT: 'light',
  MEDIUM: 'medium',
  HEAVY: 'heavy',
});

const { LIGHT, MEDIUM, HEAVY } = WEIGHT_TYPES;

export const MAX_DR = 3;

// worn armor layer bulk levels must be less than or equal to 5
export const BULK_LEVELS = Object.freeze({
  NON: 1,
  SEMI: 2,
  BULKY: 3,
});

const { NON, SEMI, BULKY } = BULK_LEVELS;

export const GARMENT_MATERIALS = Object.freeze({
  BONE: 'bone',
  WOOD: 'wood',
  BURLAP: 'burlap',
  LINEN: 'linen',
  WOOL: 'wool',
  SILK: 'silk',
  FURS: 'furs',
  AKETON: 'aketon',
  GAMBESON: 'gambeson',
  LEATHER: 'leather',
  CUIR_BOUILLI: 'cuir bouilli',
  BRIGANDINE: 'brigandine',
  SCALE: 'scale',
  MAIL: 'mail',
  ELVEN_MAIL: 'elven mail',
  PLATED_MAIL: 'plated mail',
  LAMELLAR: 'lamellar',
  SPLINT: 'splint',
  IRON_PLATE: 'iron plate',
  STEEL_PLATE: 'steel plate',
});

const {
  BONE,
  WOOD,
  BURLAP,
  LINEN,
  WOOL,
  SILK,
  FURS,
  AKETON,
  GAMBESON,
  LEATHER,
  CUIR_BOUILLI,
  BRIGANDINE,
  SCALE,
  MAIL,
  ELVEN_MAIL,
  PLATED_MAIL,
  LAMELLAR,
  SPLINT,
  IRON_PLATE,
  STEEL_PLATE,
} = GARMENT_MATERIALS;

export const garmentMaterials = deepFreeze({
  [BONE]: {
    weight: 36,
    clo: 10,
    value: 210,
  },
  [WOOD]: {
    weight: 40,
    clo: 10,
    value: 120,
  },
  [BURLAP]: {
    weight: 8,
    clo: 5,
    value: 6,
  },
  [LINEN]: {
    weight: 4,
    clo: 8,
    value: 60,
  },
  [WOOL]: {
    weight: 8,
    clo: 16,
    value: 144,
  },
  [SILK]: {
    weight: 2,
    clo: 11,
    value: 1080,
  },
  [FURS]: {
    weight: 24,
    clo: 32,
    value: 600,
  },
  [AKETON]: {
    weight: 12,
    clo: 11,
    value: 150,
  },
  [GAMBESON]: {
    weight: 20,
    clo: 18,
    value: 216,
  },
  [LEATHER]: {
    weight: 16,
    clo: 10,
    value: 264,
  },
  [CUIR_BOUILLI]: {
    weight: 28,
    clo: 9,
    value: 360,
  },
  [BRIGANDINE]: {
    weight: 60,
    clo: 16,
    value: 1800,
  },
  [SCALE]: {
    weight: 64,
    clo: 13,
    value: 1100,
  },
  [MAIL]: {
    weight: 48,
    clo: 2,
    value: 2400,
  },
  [ELVEN_MAIL]: {
    weight: 24,
    clo: 1,
    value: 24000,
  },
  [PLATED_MAIL]: {
    weight: 56,
    clo: 4,
    value: 3000,
  },
  [LAMELLAR]: {
    weight: 72,
    clo: 11,
    value: 1400,
  },
  [SPLINT]: {
    weight: 68,
    clo: 14,
    value: 1650,
  },
  [IRON_PLATE]: {
    weight: 84,
    clo: 10,
    value: 3400,
  },
  [STEEL_PLATE]: {
    weight: 76,
    clo: 8,
    value: 7200,
  },
});

export const armorMaterials = deepFreeze({
  [FURS]: {
    metal: false,
    bulk: NON,
    type: LIGHT,
    durability: 60,
    cuttable: true,
  },
  [AKETON]: {
    metal: false,
    bulk: NON,
    type: LIGHT,
    durability: 80,
    cuttable: true,
  },
  [GAMBESON]: {
    metal: false,
    bulk: SEMI,
    type: LIGHT,
    durability: 120,
    cuttable: true,
  },
  [LEATHER]: {
    metal: false,
    bulk: NON,
    type: LIGHT,
    durability: 150,
    cuttable: true,
  },
  [CUIR_BOUILLI]: {
    metal: false,
    bulk: BULKY,
    type: LIGHT,
    durability: 130,
    cuttable: false,
  },
  [WOOD]: {
    metal: false,
    bulk: BULKY,
    type: MEDIUM,
    durability: 120,
    cuttable: false,
  },
  [BONE]: {
    metal: false,
    bulk: BULKY,
    type: MEDIUM,
    durability: 100,
    cuttable: false,
  },
  [SCALE]: {
    metal: true,
    bulk: SEMI,
    type: MEDIUM,
    durability: 130,
    cuttable: false,
  },
  [BRIGANDINE]: {
    metal: true,
    bulk: SEMI,
    type: MEDIUM,
    durability: 170,
    cuttable: false,
  },
  [MAIL]: {
    metal: true,
    bulk: NON,
    type: MEDIUM,
    durability: 230,
    cuttable: false,
  },
  [ELVEN_MAIL]: {
    metal: true,
    bulk: NON,
    type: LIGHT,
    durability: 2300,
    cuttable: false,
  },
  [PLATED_MAIL]: {
    metal: true,
    bulk: SEMI,
    type: MEDIUM,
    durability: 200,
    cuttable: false,
  },
  [LAMELLAR]: {
    metal: true,
    bulk: SEMI,
    type: HEAVY,
    durability: 140,
    cuttable: false,
  },
  [SPLINT]: {
    metal: true,
    bulk: SEMI,
    type: HEAVY,
    durability: 160,
    cuttable: false,
  },
  [IRON_PLATE]: {
    metal: true,
    bulk: BULKY,
    type: HEAVY,
    durability: 180,
    cuttable: false,
  },
  [STEEL_PLATE]: {
    metal: true,
    bulk: BULKY,
    type: HEAVY,
    durability: 220,
    cuttable: false,
  },
});

// TODO for each dmg type, need AC mod, pen TN and DR
// pen is in secondary effects, ac mod and dr in weapon vs armor
export const armorVsDmgType = deepFreeze({
  none: {
    baseAc: 0,
    [BLUNT]: {
      ac: 0,
      pen: 0,
      dr: 0,
    },
    [PIERCE]: {
      ac: 1,
      pen: 0,
      dr: 0,
    },
    [SLASH]: {
      ac: 0,
      pen: 0,
      dr: 0,
    },
  },
  [FURS]: {
    baseAc: 2,
    [BLUNT]: {
      ac: 0,
      pen: 8,
      dr: 1,
    },
    [PIERCE]: {
      ac: 0,
      pen: 1,
      dr: 0,
    },
    [SLASH]: {
      ac: -1,
      pen: 2,
      dr: 0,
    },
  },
  [AKETON]: {
    baseAc: 2,
    [BLUNT]: {
      ac: 0,
      pen: 9,
      dr: 1,
    },
    [PIERCE]: {
      ac: 0,
      pen: 1,
      dr: 0,
    },
    [SLASH]: {
      ac: -1,
      pen: 2,
      dr: 0,
    },
  },
  [GAMBESON]: {
    baseAc: 2,
    [BLUNT]: {
      ac: 0,
      pen: 9,
      dr: 1,
    },
    [PIERCE]: {
      ac: 0,
      pen: 2,
      dr: 1,
    },
    [SLASH]: {
      ac: 0,
      pen: 4,
      dr: 1,
    },
  },
  [LEATHER]: {
    baseAc: 2,
    [BLUNT]: {
      ac: 0,
      pen: 8,
      dr: 0,
    },
    [PIERCE]: {
      ac: 1,
      pen: 2,
      dr: 0,
    },
    [SLASH]: {
      ac: -1,
      pen: 3,
      dr: 1,
    },
  },
  [CUIR_BOUILLI]: {
    baseAc: 3,
    [BLUNT]: {
      ac: 0,
      pen: 6,
      dr: 0,
    },
    [PIERCE]: {
      ac: 1,
      pen: 3,
      dr: 0,
    },
    [SLASH]: {
      ac: -1,
      pen: 5,
      dr: 0,
    },
  },
  [WOOD]: {
    baseAc: 3,
    [BLUNT]: {
      ac: 0,
      pen: 7,
      dr: 0,
    },
    [PIERCE]: {
      ac: 0,
      pen: 3,
      dr: 0,
    },
    [SLASH]: {
      ac: -1,
      pen: 4,
      dr: 0,
    },
  },
  [BONE]: {
    baseAc: 3,
    [BLUNT]: {
      ac: 0,
      pen: 7,
      dr: 0,
    },
    [PIERCE]: {
      ac: 0,
      pen: 3,
      dr: 0,
    },
    [SLASH]: {
      ac: 0,
      pen: 5,
      dr: 0,
    },
  },
  [SCALE]: {
    baseAc: 4,
    [BLUNT]: {
      ac: -1,
      pen: 10,
      dr: 1,
    },
    [PIERCE]: {
      ac: -1,
      pen: 4,
      dr: 1,
    },
    [SLASH]: {
      ac: 1,
      pen: 6,
      dr: 1,
    },
  },
  [BRIGANDINE]: {
    baseAc: 4,
    [BLUNT]: {
      ac: -1,
      pen: 11,
      dr: 1,
    },
    [PIERCE]: {
      ac: 1,
      pen: 5,
      dr: 1,
    },
    [SLASH]: {
      ac: 0,
      pen: 7,
      dr: 1,
    },
  },
  [MAIL]: {
    baseAc: 3,
    [BLUNT]: {
      ac: 0,
      pen: 12,
      dr: 0,
    },
    [PIERCE]: {
      ac: -1,
      pen: 5,
      dr: 1,
    },
    [SLASH]: {
      ac: 1,
      pen: 8,
      dr: 1,
    },
  },
  [ELVEN_MAIL]: {
    baseAc: 3,
    [BLUNT]: {
      ac: 0,
      pen: 16,
      dr: 0,
    },
    [PIERCE]: {
      ac: -1,
      pen: 9,
      dr: 1,
    },
    [SLASH]: {
      ac: 1,
      pen: 12,
      dr: 1,
    },
  },
  [PLATED_MAIL]: {
    baseAc: 4,
    [BLUNT]: {
      ac: 0,
      pen: 11,
      dr: 0,
    },
    [PIERCE]: {
      ac: 0,
      pen: 6,
      dr: 1,
    },
    [SLASH]: {
      ac: 1,
      pen: 9,
      dr: 1,
    },
  },
  [LAMELLAR]: {
    baseAc: 4,
    [BLUNT]: {
      ac: 0,
      pen: 11,
      dr: 1,
    },
    [PIERCE]: {
      ac: 0,
      pen: 6,
      dr: 1,
    },
    [SLASH]: {
      ac: 0,
      pen: 8,
      dr: 1,
    },
  },
  [SPLINT]: {
    baseAc: 5,
    [BLUNT]: {
      ac: -1,
      pen: 10,
      dr: 1,
    },
    [PIERCE]: {
      ac: 0,
      pen: 4,
      dr: 1,
    },
    [SLASH]: {
      ac: 1,
      pen: 7,
      dr: 1,
    },
  },
  [IRON_PLATE]: {
    baseAc: 7,
    [BLUNT]: {
      ac: -2,
      pen: 8,
      dr: 0,
    },
    [PIERCE]: {
      ac: 1,
      pen: 7,
      dr: 0,
    },
    [SLASH]: {
      ac: 0,
      pen: 9,
      dr: 1,
    },
  },
  [STEEL_PLATE]: {
    baseAc: 8,
    [BLUNT]: {
      ac: -2,
      pen: 10,
      dr: 0,
    },
    [PIERCE]: {
      ac: 1,
      pen: 9,
      dr: 0,
    },
    [SLASH]: {
      ac: 0,
      pen: 12,
      dr: 1,
    },
  },
});

export const allArmors = Object.freeze(Object.keys(armorMaterials));

export const nonMetalArmors = Object.freeze(Object.keys(armorMaterials).filter((k) => !armorMaterials[k].metal));

export const lightArmors = Object.freeze(
  Object.keys(armorMaterials).filter((k) => armorMaterials[k].type === WEIGHT_TYPES.LIGHT)
);

export const mediumArmors = Object.freeze(
  Object.keys(armorMaterials).filter((k) => armorMaterials[k].type === WEIGHT_TYPES.MEDIUM)
);
