import { ALL_ARMORS, ALL_SHIELD_TYPES } from '../armors';
import { ALL_WEAPONS, BASIC_SKILLS_EXCL_WEAPON_SKILLS, SKILL_PROGRESSIONS_ENUM } from '../skills';
import { SAVES_ENUM, SAVE_PROGRESSIONS_ENUM } from '../saves';
import FEATURES from '../features';
import { BaseClass } from './base-class';

const xp_reqs = [0, 1000, 3000, 7000, 15000, 30000, 60000, 120000, 240000, 360000, 480000, 600000, 720000, 840000];
const titles = [
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

const fighterSkillProgressions = {
  mod: 0,
  progressions: [
    [SKILL_PROGRESSIONS_ENUM.SPECIALIZED, ALL_WEAPONS],
    [SKILL_PROGRESSIONS_ENUM.BASIC, BASIC_SKILLS_EXCL_WEAPON_SKILLS],
  ],
};
const fighterSaveProgressions = {
  mod: 0,
  progressions: [
    [SAVE_PROGRESSIONS_ENUM.GOOD, [SAVES_ENUM.PHYSICAL, SAVES_ENUM.LUCK]],
    [SAVE_PROGRESSIONS_ENUM.POOR, [SAVES_ENUM.EVASION, SAVES_ENUM.MENTAL]],
  ],
};

const attacks = (lvl) => Math.floor((Number(lvl) - 1) / 6);

export class Fighter extends BaseClass {
  constructor(lvl, skillProgressions = fighterSkillProgressions, saveProgressions = fighterSaveProgressions) {
    super(lvl, xp_reqs, titles, skillProgressions, saveProgressions);
    this.hit_die = 'd8';
    this.armors = ALL_ARMORS;
    this.shields = ALL_SHIELD_TYPES;
    this.features = [
      { ...FEATURES['chain attack'], max_attacks: Number(lvl) },
      { ...FEATURES['extra attack'], attacks: attacks(lvl) },
    ];
  }
}

export class Berserker extends Fighter {
  constructor(lvl) {
    super(lvl);
    this.features = [{ ...FEATURES['extra attack'], attacks: attacks(lvl) }, FEATURES['berserk']];
  }
}
