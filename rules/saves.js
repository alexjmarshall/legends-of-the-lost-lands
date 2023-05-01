import { ABILITIES } from './abilities';

export const SAVE_BUILDERS = {
  good: (lvl) => ({
    baseBonus: Math.floor((lvl * 2) / 3),
  }),
  poor: (lvl) => ({
    baseBonus: Math.floor(lvl / 2),
  }),
};

export const SAVES = {
  evasion: {
    ability: ABILITIES.DEX,
    armor_check_penalty: true,
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
};

export const SAVES_ENUM = {
  EVASION: 'evasion',
  MENTAL: 'mental',
  PHYSICAL: 'physical',
};
