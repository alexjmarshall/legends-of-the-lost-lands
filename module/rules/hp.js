// TODO when applying location
// TODO when healing applied to location HP, always cap at max. When healing applied to general HP, cap at max if max HP is suppressed by fatigue.
// TODO when damage applied to main HP and spread out to location HP, do not bring location HP below 0.

export const HP_AREAS = Object.freeze({
  head: {
    proportion: 0.36,
  },
  upper_torso: {
    proportion: 0.45,
  },
  lower_torso: {
    proportion: 0.36,
  },
  arm: {
    proportion: 0.27,
  },
  leg: {
    proportion: 0.36,
  },
});

export const getAreaHp = (hp, area) => Math.max(1, Math.round(hp * HP_AREAS[area].proportion));
