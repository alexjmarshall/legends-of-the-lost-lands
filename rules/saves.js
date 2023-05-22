import { ABILITIES as ABILITIES_ENUM } from './abilities';
import { buildEnum, buildStats, deepFreeze } from './helper';

const { WIS, DEX, CON } = ABILITIES_ENUM;

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
    ability: DEX,
    armor_check_penalty: false,
    movement_penalty: true,
  },
  mental: {
    ability: WIS,
    armor_check_penalty: false,
    movement_penalty: false,
  },
  physical: {
    ability: CON,
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
