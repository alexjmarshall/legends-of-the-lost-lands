import { ALL_ARMORS, ALL_SHIELD_TYPES } from '../armors';
import { ALL_WEAPONS, BASIC_SKILLS_EXCL_WEAPON, SKILL_PROGRESSIONS_ENUM, buildSkills } from '../skills';
import { SAVES_ENUM, SAVE_PROGRESSIONS_ENUM, buildSaves } from '../saves';
import { buildFeatures } from '../features';
import { BaseClass } from './base-class';

const { SPECIALIZED, BASIC } = SKILL_PROGRESSIONS_ENUM;
const { GOOD, POOR } = SAVE_PROGRESSIONS_ENUM;
const { PHYSICAL, EVASION, MENTAL, LUCK } = SAVES_ENUM;

export class Fighter extends BaseClass {
  #XP_REQS = [1000, 3000, 7000, 15000, 30000, 60000, 120000, 240000, 360000, 480000, 600000, 720000, 840000, Infinity];

  #TITLES = [
    'Veteran',
    'Warrior',
    'Swordsman',
    'Hero',
    'Gladiator',
    'Dominator',
    'Champion',
    'Super Hero',
    'Lord',
    'Lord (10th)',
    'Lord (11th)',
    'Lord (12th)',
    'Lord (13th)',
    'Lord (14th)',
  ];

  #SKILL_PROGRESSIONS = {
    progressions: {
      [SPECIALIZED]: ALL_WEAPONS,
      [BASIC]: BASIC_SKILLS_EXCL_WEAPON,
    },
  };

  #SAVE_PROGRESSIONS = {
    progressions: {
      [GOOD]: [PHYSICAL, LUCK],
      [POOR]: [EVASION, MENTAL],
    },
  };

  constructor(lvl) {
    super(lvl);
    this.hitDie = 'd8';
    this.xpRequired = this.#XP_REQS[lvl - 1];
    this.title = this.#TITLES[lvl - 1];
    this.armors = ALL_ARMORS;
    this.shields = ALL_SHIELD_TYPES;
    this.skills = buildSkills(this.#SKILL_PROGRESSIONS, lvl);
    this.saves = buildSaves(this.#SAVE_PROGRESSIONS, lvl);
    this.features = buildFeatures('fighter', lvl);
  }
}

export class Berserker extends Fighter {
  constructor(lvl) {
    super(lvl);
    this.features = buildFeatures('berserker', lvl);
  }
}
