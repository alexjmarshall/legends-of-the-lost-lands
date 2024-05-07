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
export const bulkLevels = Object.freeze({
  NON: 1,
  SEMI: 2,
  BULKY: 3,
});

const { NON, SEMI, BULKY } = bulkLevels;

export const garmentMaterials = deepFreeze({
  bone: {
    weight: 36,
    clo: 10,
    value: 210,
  },
  wood: {
    weight: 40,
    clo: 10,
    value: 120,
  },
  burlap: {
    weight: 8,
    clo: 5,
    value: 6,
  },
  linen: {
    weight: 4,
    clo: 8,
    value: 60,
  },
  wool: {
    weight: 8,
    clo: 16,
    value: 144,
  },
  silk: {
    weight: 2,
    clo: 11,
    value: 1080,
  },
  fur: {
    weight: 24,
    clo: 32,
    value: 600,
  },
  padded: {
    weight: 20,
    clo: 18,
    value: 234,
  },
  leather: {
    weight: 16,
    clo: 10,
    value: 288,
  },
  'cuir bouilli': {
    weight: 28,
    clo: 9,
    value: 360,
  },
  brigandine: {
    weight: 60,
    clo: 16,
    value: 1600,
  },
  scale: {
    weight: 64,
    clo: 13,
    value: 952,
  },
  mail: {
    weight: 48,
    clo: 2,
    value: 1824,
  },
  'elven mail': {
    weight: 24,
    clo: 1,
    value: 18240,
  },
  'plated mail': {
    weight: 56,
    clo: 4,
    value: 2552,
  },
  lamellar: {
    weight: 72,
    clo: 11,
    value: 1408,
  },
  splint: {
    weight: 68,
    clo: 14,
    value: 1516,
  },
  'iron plate': {
    weight: 84,
    clo: 10,
    value: 2880,
  },
  'steel plate': {
    weight: 76,
    clo: 8,
    value: 7200,
  },
});

export const armorMaterials = deepFreeze({
  fur: {
    metal: false,
    bulk: NON,
    type: LIGHT,
    durability: 40,
  },
  padded: {
    metal: false,
    bulk: SEMI,
    type: LIGHT,
    durability: 60,
  },
  leather: {
    metal: false,
    bulk: NON,
    type: LIGHT,
    durability: 50,
  },
  'cuir bouilli': {
    metal: false,
    bulk: BULKY,
    type: LIGHT,
    durability: 80,
  },
  wood: {
    metal: false,
    bulk: BULKY,
    type: MEDIUM,
    durability: 120,
  },
  bone: {
    metal: false,
    bulk: BULKY,
    type: MEDIUM,
    durability: 70,
  },
  scale: {
    metal: true,
    bulk: SEMI,
    type: MEDIUM,
    durability: 130,
  },
  brigandine: {
    metal: true,
    bulk: SEMI,
    type: MEDIUM,
    durability: 170,
  },
  mail: {
    metal: true,
    bulk: NON,
    type: MEDIUM,
    durability: 230,
  },
  'elven mail': {
    metal: true,
    bulk: NON,
    type: LIGHT,
    durability: 2300,
  },
  'plated mail': {
    metal: true,
    bulk: SEMI,
    type: MEDIUM,
    durability: 200,
  },
  lamellar: {
    metal: true,
    bulk: SEMI,
    type: HEAVY,
    durability: 140,
  },
  splint: {
    metal: true,
    bulk: BULKY,
    type: HEAVY,
    durability: 160,
  },
  'iron plate': {
    metal: true,
    bulk: BULKY,
    type: HEAVY,
    durability: 180,
  },
  'steel plate': {
    metal: true,
    bulk: BULKY,
    type: HEAVY,
    durability: 220,
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
