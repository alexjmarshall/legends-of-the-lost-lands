// base_mv (race), size (race)
import { WEAPON_CATEGORIES, WEAPON_TIERS } from './weapons';
import { ARMOR_MATERIALS } from './armors';
import { SPELL_TYPES, MAX_SPELL_LEVELS } from './magic';

const ALL_WEAP_CATS = Object.values(WEAPON_CATEGORIES);
const ALL_WEAP_TIERS = Object.values(WEAPON_TIERS);
const ALL_ARMORS = Object.keys(ARMOR_MATERIALS);
const NON_METAL_ARMORS = Object.keys(ARMOR_MATERIALS).filter((k) => !ARMOR_MATERIALS[k].metal);
const NON_BULKY_ARMORS = Object.keys(ARMOR_MATERIALS).filter((k) => !ARMOR_MATERIALS[k].bulky);

export default { // TODO aura of threat around character
  fighter: { // TODO aura type active effects that get added to other characters in radius
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
    allowed_weap_profs: ALL_WEAP_CATS, // TODO -2 penalty
    allowed_weap_tiers: ALL_WEAP_TIERS, // TODO -3 penalty
    allowed_armors: ALL_ARMORS,
    variants: {
      BERSERKER: 'berserker',
      DUELLIST: 'duellist',
    },
  },
  cleric: {
    xp_thresholds: {
      1: 0,
      2: 800,
      3: 2400,
      4: 5600,
      5: 12000,
      6: 25000,
      7: 55000,
      8: 110000,
      9: 220000,
      10: 330000,
      11: 440000,
      12: 550000,
      13: 660000,
      14: 770000,
    },
    titles: {
      1: 'Acolyte',
      2: 'Adept',
      3: 'Curate',
      4: 'Vicar',
      5: 'Priest',
      6: 'Bishop',
      7: 'Lama',
      8: 'Hierarch',
      9: 'High Priest',
      10: 'High Priest (10th)',
      11: 'High Priest (11th)',
      12: 'High Priest (12th)',
      13: 'High Priest (13th)',
      14: 'High Priest (14th)',
    },
    bab: (lvl) => Math.floor((Number(lvl) * 2) / 3),
    base_ac: 10,
    base_sv: (lvl) => Number(lvl) + 1,
    base_mv_adj: 0,
    allowed_weap_profs: [
      WEAPON_CATEGORIES.BLUDGEON,
      WEAPON_CATEGORIES.HAMMER,
      WEAPON_CATEGORIES.HAND_TO_HAND,
      WEAPON_CATEGORIES.SLING,
      WEAPON_CATEGORIES.STAFF,
      WEAPON_CATEGORIES.WHIP,
    ],
    allowed_weap_tiers: WEAPON_TIERS.SIMPLE, // TODO if weapon has bleed > 0, apply blunt dmg (1d3)
    allowed_armors: ALL_ARMORS,
    variants: {
      CLOISTERED_CLERIC: 'cloistered cleric',
      RUNEPRIEST: 'runepriest',
    },
  },
};
