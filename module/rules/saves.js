import { ABILITIES } from './abilities.js';
import { progressions } from './helper.js';
import { deepFreeze } from '../helper/helper.js';

const { WIS, DEX, CON } = ABILITIES;

export const SAVES = Object.freeze({
  MENTAL: 'mental',
  EVASION: 'evasion',
  PHYSICAL: 'physical',
});

export const saves = deepFreeze({
  [SAVES.EVASION]: {
    ability: DEX,
    proficientArmorPenalty: false,
    nonProficientPenalty: true,
  },
  [SAVES.MENTAL]: {
    ability: WIS,
    proficientArmorPenalty: false,
    nonProficientPenalty: false,
  },
  [SAVES.PHYSICAL]: {
    ability: CON,
    proficientArmorPenalty: false,
    nonProficientPenalty: false,
  },
});

export const saveBases = deepFreeze({
  fighter: {
    [SAVES.MENTAL]: progressions.slow,
    [SAVES.EVASION]: progressions.medium,
    [SAVES.PHYSICAL]: progressions.fast,
  },
  cleric: {
    [SAVES.MENTAL]: progressions.medium,
    [SAVES.EVASION]: progressions.slow,
    [SAVES.PHYSICAL]: progressions.fast,
  },
  thief: {
    [SAVES.MENTAL]: progressions.medium,
    [SAVES.EVASION]: progressions.fast,
    [SAVES.PHYSICAL]: progressions.slow,
  },
  mage: {
    [SAVES.MENTAL]: progressions.fast,
    [SAVES.EVASION]: progressions.medium,
    [SAVES.PHYSICAL]: progressions.slow,
  },
  ranger: {
    [SAVES.MENTAL]: progressions.fast,
    [SAVES.EVASION]: progressions.fast,
    [SAVES.PHYSICAL]: progressions.fast,
  },
});
