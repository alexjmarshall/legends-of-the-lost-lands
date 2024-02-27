import { deepFreeze } from '../helper/helper.js';
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
export const bulkLevels = Object.freeze({
  NON: 1,
  SEMI: 2,
  BULKY: 3,
});

const { NON, SEMI, BULKY } = bulkLevels;

// TODO combine this with armorVsDmgType, but split out weight, warmth and value to garmentMaterials with clothing
export const armorMaterials = deepFreeze({
  fur: {
    weight: 24,
    warmth: 32,
    value: 600,
    metal: false,
    bulk: NON,
    type: LIGHT,
    durability: 48,
    gaps: false,
  },
  padded: {
    weight: 20,
    warmth: 18,
    value: 234,
    metal: false,
    bulk: SEMI,
    type: LIGHT,
    durability: 60,
    gaps: false,
  },
  leather: {
    weight: 16,
    warmth: 10,
    value: 288,
    metal: false,
    bulk: NON,
    type: LIGHT,
    durability: 64,
    gaps: false,
  },
  'cuir bouilli': {
    weight: 28,
    warmth: 9,
    value: 360,
    metal: false,
    bulk: BULKY,
    type: LIGHT,
    durability: 84,
    gaps: true,
  },
  wood: {
    weight: 40,
    warmth: 10,
    value: 120,
    metal: false,
    bulk: BULKY,
    type: MEDIUM,
    durability: 120,
    gaps: true,
  },
  bone: {
    weight: 36,
    warmth: 10,
    value: 210,
    metal: false,
    bulk: BULKY,
    type: MEDIUM,
    durability: 72,
    gaps: true,
  },
  scale: {
    weight: 64,
    warmth: 13,
    value: 952,
    metal: true,
    bulk: SEMI,
    type: MEDIUM,
    durability: 128,
    gaps: true,
  },
  brigandine: {
    weight: 60,
    warmth: 16,
    value: 1600,
    metal: true,
    bulk: SEMI,
    type: MEDIUM,
    durability: 180,
    gaps: false,
  },
  mail: {
    weight: 46,
    warmth: 2,
    value: 1824,
    metal: true,
    bulk: NON,
    type: MEDIUM,
    durability: 230,
    gaps: false,
  },
  'elven mail': {
    weight: 24,
    warmth: 1,
    value: 18240,
    metal: true,
    bulk: NON,
    type: LIGHT,
    durability: 2300,
    gaps: false,
  },
  'plated mail': {
    weight: 56,
    warmth: 4,
    value: 2552,
    metal: true,
    bulk: SEMI,
    type: MEDIUM,
    durability: 252,
    gaps: false,
  },
  lamellar: {
    weight: 70,
    warmth: 11,
    value: 1408,
    metal: true,
    bulk: SEMI,
    type: HEAVY,
    durability: 140,
    gaps: true,
  },
  splint: {
    weight: 72,
    warmth: 14,
    value: 1516,
    metal: true,
    bulk: BULKY,
    type: HEAVY,
    durability: 216,
    gaps: true,
  },
  'iron plate': {
    weight: 82,
    warmth: 10,
    value: 2880,
    metal: true,
    bulk: BULKY,
    type: HEAVY,
    durability: 164,
  },
  'steel plate': {
    weight: 74,
    warmth: 8,
    value: 7200,
    metal: true,
    bulk: BULKY,
    type: HEAVY,
    durability: 222,
    gaps: true,
  },
});

export const armorVsDmgType = deepFreeze({
  none: {
    base_AC: 0,
    [BLUNT]: {
      ac: 1,
      dr: 0,
    },
    [PIERCE]: {
      ac: 0,
      dr: 0,
    },
    [SLASH]: {
      ac: -2,
      dr: 0,
    },
  },
  fur: {
    base_AC: 1,
    [BLUNT]: {
      ac: 1,
      dr: 0,
    },
    [PIERCE]: {
      ac: 1,
      dr: 0,
    },
    [SLASH]: {
      ac: -2,
      dr: 0,
    },
  },
  leather: {
    base_AC: 1,
    [BLUNT]: {
      ac: 1,
      dr: 0,
    },
    [PIERCE]: {
      ac: 1,
      dr: 1,
    },
    [SLASH]: {
      ac: 0,
      dr: 0,
    },
  },
  padded: {
    base_AC: 1,
    [BLUNT]: {
      ac: 1,
      dr: 1,
    },
    [PIERCE]: {
      ac: -1,
      dr: 0,
    },
    [SLASH]: {
      ac: 0,
      dr: 0,
    },
  },
  'cuir bouilli': {
    base_AC: 2,
    [BLUNT]: {
      ac: 1,
      dr: 1,
    },
    [PIERCE]: {
      ac: 1,
      dr: 0,
    },
    [SLASH]: {
      ac: 0,
      dr: 0,
    },
  },
  wood: {
    base_AC: 2,
    [BLUNT]: {
      ac: 0,
      dr: 1,
    },
    [PIERCE]: {
      ac: 2,
      dr: 0,
    },
    [SLASH]: {
      ac: 0,
      dr: 0,
    },
  },
  bone: {
    base_AC: 2,
    [BLUNT]: {
      ac: 0,
      dr: 1,
    },
    [PIERCE]: {
      ac: 1,
      dr: 0,
    },
    [SLASH]: {
      ac: 1,
      dr: 0,
    },
  },
  scale: {
    base_AC: 3,
    [BLUNT]: {
      ac: 1,
      dr: 0,
    },
    [PIERCE]: {
      ac: 0,
      dr: 1,
    },
    [SLASH]: {
      ac: 2,
      dr: 0,
    },
  },
  brigandine: {
    base_AC: 3,
    [BLUNT]: {
      ac: 0,
      dr: 1,
    },
    [PIERCE]: {
      ac: 0,
      dr: 1,
    },
    [SLASH]: {
      ac: 1,
      dr: 1,
    },
  },
  mail: {
    base_AC: 3,
    [BLUNT]: {
      ac: 0,
      dr: 0,
    },
    [PIERCE]: {
      ac: -1,
      dr: 1,
    },
    [SLASH]: {
      ac: 1,
      dr: 1,
    },
  },
  'elven mail': {
    base_AC: 3,
    [BLUNT]: {
      ac: 0,
      dr: 0,
    },
    [PIERCE]: {
      ac: -1,
      dr: 1,
    },
    [SLASH]: {
      ac: 1,
      dr: 1,
    },
  },
  'plated mail': {
    base_AC: 4,
    [BLUNT]: {
      ac: 0,
      dr: 0,
    },
    [PIERCE]: {
      ac: 0,
      dr: 1,
    },
    [SLASH]: {
      ac: 1,
      dr: 1,
    },
  },
  lamellar: {
    base_AC: 4,
    [BLUNT]: {
      ac: 0,
      dr: 1,
    },
    [PIERCE]: {
      ac: 0,
      dr: 1,
    },
    [SLASH]: {
      ac: 0,
      dr: 1,
    },
  },
  splint: {
    base_AC: 5,
    [BLUNT]: {
      ac: -1,
      dr: 1,
    },
    [PIERCE]: {
      ac: 0,
      dr: 1,
    },
    [SLASH]: {
      ac: 1,
      dr: 1,
    },
  },
  'iron plate': {
    base_AC: 5,
    [BLUNT]: {
      ac: -1,
      dr: 1,
    },
    [PIERCE]: {
      ac: 1,
      dr: 0,
    },
    [SLASH]: {
      ac: 2,
      dr: 1,
    },
  },
  'steel plate': {
    base_AC: 6,
    [BLUNT]: {
      ac: -1,
      dr: 1,
    },
    [PIERCE]: {
      ac: 1,
      dr: 0,
    },
    [SLASH]: {
      ac: 3,
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

export const SHIELD_TYPES = Object.freeze({
  MEDIUM: 'medium',
  LARGE: 'large',
});

export const allShields = Object.freeze(Object.values(SHIELD_TYPES));
