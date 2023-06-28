import { abilitiesEnum } from './abilities';
import { buildEnum, deepFreeze } from './helper';

const { WIS, DEX, CON } = abilitiesEnum;

export const DEFAULT_SAVE_BASE = 18;

export const MIN_SAVE = 3;

export const getSaveBase = (lvl, mod) => Math.max(MIN_SAVE, DEFAULT_SAVE_BASE - Number(lvl) - Number(mod));

export const saves = deepFreeze({
  evasion: {
    ability: DEX,
    proficientArmorPenalty: false,
    nonProficientPenalty: true,
  },
  resolve: {
    ability: WIS,
    proficientArmorPenalty: false,
    nonProficientPenalty: false,
  },
  resilience: {
    ability: CON,
    proficientArmorPenalty: false,
    nonProficientPenalty: false,
  },
  luck: {
    ability: null,
    proficientArmorPenalty: false,
    nonProficientPenalty: false,
  },
});

export const savesEnum = buildEnum(saves);
