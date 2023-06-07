import { ALL_ARMORS, ALL_SHIELDS } from '../armors';
import { ALL_WEAPONS, BASIC_SKILLS_EXCL_WEAPON, SKILL_PROGRESSIONS_ENUM, buildSkills } from '../skills';
import { SAVES_ENUM, SAVE_PROGRESSIONS_ENUM, buildSaves } from '../saves';
import { buildFeatures } from '../features';
import { BaseClass } from './base-class';
import { CLASSES_ENUM } from './classes-enum';
import { deepFreeze } from '../helper';

const { SPECIALIZED, BASIC } = SKILL_PROGRESSIONS_ENUM;
const { GOOD, POOR } = SAVE_PROGRESSIONS_ENUM;
const { RESILIENCE, RESOLVE, EVASION, LUCK } = SAVES_ENUM;
const { FIGHTER, BERSERKER } = CLASSES_ENUM;

export class Fighter extends BaseClass {
  #XP_REQS = Object.freeze([
    1000,
    3000,
    7000,
    15000,
    30000,
    60000,
    120000,
    240000,
    420000,
    600000,
    780000,
    960000,
    1140000,
    Infinity,
  ]);

  #TITLES = Object.freeze([
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
  ]);

  #SKILLS = deepFreeze({
    progressions: {
      [SPECIALIZED]: ALL_WEAPONS,
      [BASIC]: BASIC_SKILLS_EXCL_WEAPON,
    },
  });

  #SAVES = deepFreeze({
    progressions: {
      [GOOD]: [RESILIENCE, LUCK],
      [POOR]: [RESOLVE, EVASION],
    },
  });

  constructor(lvl) {
    super(lvl);
    this.hitDie = 'd8';
    this.xpRequired = this.#XP_REQS[lvl - 1];
    this.title = this.#TITLES[lvl - 1];
    this.armors = ALL_ARMORS;
    this.shields = ALL_SHIELDS;
    this.skills = buildSkills(this.#SKILLS, lvl);
    this.saves = buildSaves(this.#SAVES, lvl);
    this.features = buildFeatures(FIGHTER, lvl);
  }
}

export class Berserker extends Fighter {
  constructor(lvl) {
    super(lvl);
    this.features = buildFeatures(BERSERKER, lvl);
  }
}
