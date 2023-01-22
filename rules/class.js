// base_mv (race), size (race)
import { WEAPON_CATEGORIES } from './weapons';
import { ARMOR_MATERIALS } from './armors';

export const ALLOWED_ARMORS = {
  ANY: Object.keys(ARMOR_MATERIALS),
  NON_METAL: Object.keys(ARMOR_MATERIALS).filter((k) => !ARMOR_MATERIALS[k].metal),
  NON_BULKY: Object.keys(ARMOR_MATERIALS).filter((k) => !ARMOR_MATERIALS[k].bulky),
};
export const ALLOWED_WEAP_TIERS = {
  SIMPLE: ['simple'],
  MARTIAL: ['simple', 'martial'],
};
export const ALLOWED_WEAP_PROFS = {
  ANY: Object.values(WEAPON_CATEGORIES),
};
export const SPELL_TYPES = {
  SPELL_CLERIC: 'spell_cleric',
  SPELL_MAGIC: 'spell_magic',
  SPELL_WITCH: 'spell_witch',
};
export const MAX_SPELL_LEVELS = {
  [SPELL_TYPES.SPELL_CLERIC]: 6,
  [SPELL_TYPES.SPELL_MAGIC]: 7,
  [SPELL_TYPES.SPELL_WITCH]: 6,
};

export default {
  fighter: {
    xp_thresholds: {
      1: 0,
      2: 1000,
      3: 3000,
      4: 7000,
      5: 15000,
      6: 30000,
      7: 60000,
      8: 120000,
      9: 240000,
      10: 360000,
      11: 480000,
      12: 600000,
      13: 720000,
      14: 840000,
    },
    titles: {
      1: 'Veteran',
      2: 'Warrior',
      3: 'Swordsman',
      4: 'Hero',
      5: 'Gladiator',
      6: 'Dominator',
      7: 'Champion',
      8: 'Super Hero',
      9: 'Lord',
      10: 'Lord (10th)',
      11: 'Lord (11th)',
      12: 'Lord (12th)',
      13: 'Lord (13th)',
      14: 'Lord (14th)',
    },
    bab: (lvl) => Number(lvl),
    base_ac: 10,
    base_sv: (lvl) => Number(lvl),
    base_mv_adj: 0,
    allowed_weap_profs: ALLOWED_WEAP_PROFS.ANY, // TODO -2 penalty
    allowed_weap_tiers: ALLOWED_WEAP_TIERS.MARTIAL, // TODO -3 penalty
    allowed_armors: ALLOWED_ARMORS.ANY,
  },
};
