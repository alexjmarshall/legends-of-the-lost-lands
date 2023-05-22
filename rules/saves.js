import { ABILITIES } from './abilities';
import { buildEnum, buildStats, deepFreeze } from './helper';

export const SAVE_BUILDERS = deepFreeze({
  good: (lvl, mod = 0) => ({
    baseBonus: lvl + mod,
  }),
  poor: (lvl, mod = 0) => ({
    baseBonus: Math.max(lvl + mod - 4, Math.floor((lvl * 2) / 3) + mod),
  }),
});

export const SAVE_PROGRESSIONS_ENUM = deepFreeze({
  GOOD: 'good',
  POOR: 'poor',
});

export const SAVES = deepFreeze({
  evasion: {
    ability: ABILITIES.DEX,
    armor_check_penalty: false,
    movement_penalty: true,
  },
  mental: {
    ability: ABILITIES.WIS,
    armor_check_penalty: false,
    movement_penalty: false,
  },
  physical: {
    ability: ABILITIES.CON,
    armor_check_penalty: false,
    movement_penalty: false,
  },
  luck: {
    ability: null,
    armor_check_penalty: false,
    movement_penalty: false,
  },
});

export const SAVES_ENUM = buildEnum(SAVES);

export function buildSaves(saveProgressions, lvl) {
  const { progressions, mod } = saveProgressions;
  return buildStats(SAVE_BUILDERS, lvl, progressions, mod);
}
