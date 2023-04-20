import { ALL_ARMORS, ALL_SHIELD_TYPES } from '../armors';
import { ALL_WEAPONS, BASIC_SKILLS_EXCL_WEAPON_SKILLS } from '../skills';
import FEATURES from '../features';
import { ALL_ALIGNMENTS } from '../alignments';
import { DEFAULT_BASE_AC } from '../class';

export class Fighter {
  constructor(lvl) {
    this.hit_die = 'd8';
    this.xp_requirements = [
      0, 1000, 3000, 7000, 15000, 30000, 60000, 120000, 240000, 360000, 480000, 600000, 720000, 840000,
    ];
    this.titles = [
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
    this.base_ac = DEFAULT_BASE_AC;
    this.base_sv = Number(lvl);
    this.armors = ALL_ARMORS;
    this.shields = ALL_SHIELD_TYPES;
    this.specialized_skills = ALL_WEAPONS;
    this.untrained_skills = BASIC_SKILLS_EXCL_WEAPON_SKILLS;
    this.features = [
      { ...FEATURES['chain attack'], max_attacks: Number(lvl) },
      { ...FEATURES['extra attack'], attacks: Math.floor((Number(lvl) - 1) / 6) },
    ];
    this.allowed_alignments = ALL_ALIGNMENTS;
  }
}

export class Berserker extends Fighter {
  constructor(lvl) {
    super(lvl);
    this.features = [{ ...FEATURES['extra attack'], attacks: Math.floor((Number(lvl) - 1) / 6) }, FEATURES['berserk']];
  }
}
