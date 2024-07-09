// TODO when applying location
// TODO when healing applied to location HP, always cap at max. When healing applied to general HP, cap at max if max HP is suppressed by exhaustion.
// TODO when damage applied to main HP and spread out to location HP, do not bring location HP below 0.

import { deepFreeze } from '../helper.js';

export const HP_AREAS = Object.freeze({
  HEAD: 'head',
  CHEST: 'chest',
  ABDOMEN: 'abdomen',
  RIGHT_ARM: 'right arm',
  LEFT_ARM: 'left arm',
  RIGHT_LEG: 'right leg',
  LEFT_LEG: 'left leg',
});

export const hpAreas = deepFreeze({
  [HP_AREAS.HEAD]: {
    proportion: 0.36,
  },
  [HP_AREAS.CHEST]: {
    proportion: 0.45,
  },
  [HP_AREAS.ABDOMEN]: {
    proportion: 0.36,
  },
  [HP_AREAS.RIGHT_ARM]: {
    proportion: 0.27,
  },
  [HP_AREAS.LEFT_ARM]: {
    proportion: 0.27,
  },
  [HP_AREAS.RIGHT_LEG]: {
    proportion: 0.36,
  },
  [HP_AREAS.LEFT_LEG]: {
    proportion: 0.36,
  },
});

export const getAreaHp = (hp, area) => Math.max(1, Math.round(hp * hpAreas[area].proportion));

export const addAreaHp = (totalMaxHp, hpObj) => {
  for (const area in hpAreas) {
    hpObj[area.replace(' ', '_')] = getAreaHp(totalMaxHp, area);
  }
};
