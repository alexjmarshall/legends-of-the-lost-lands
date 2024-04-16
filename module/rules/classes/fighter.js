import { allArmors, lightArmors, mediumArmors, allShields } from '../armors.js';
import { allCombatSkills, allMeleeWeaponSkills, allMissileWeaponSkills } from '../skills.js';
import { saveBases } from '../saves.js';
import { FeatureConfig, features } from '../features.js';
import { BaseClass } from './base-class.js';
import { ABILITIES } from '../abilities.js';
import { WEAPON_CLASS } from '../weapons.js';
import { deepFreeze } from '../../helper.js';
import { chaoticAlignments } from '../alignment.js';

export class Fighter extends BaseClass {
  static description = 'A stalwart champion of the battlefield.';

  static XP_REQS = Object.freeze([0, 1000, 3000, 7000, 15000, 30000, 60000, 120000, 240000]);

  static XP_REQ_AFTER_NAME_LVL = 180000;

  static TITLES = Object.freeze([
    'Veteran',
    'Warrior',
    'Swordsman',
    'Hero',
    'Gladiator',
    'Dominator',
    'Champion',
    'Super Hero',
    'Lord',
  ]);

  static featuresConfig = deepFreeze([new FeatureConfig(features.CHAIN_ATTACK, 1), super.multiattackFeature(7, 13)]);
  static specializedSkills = Object.freeze([...allCombatSkills]);
  static saveProgressions = saveBases.fighter;
  static firstLvlHp = 'd6+2';
  static fpReserve = 20;
  static hitDie = 'd8';
  static afterNameHp = 3;
  static weaponClass = WEAPON_CLASS.MARTIAL;
  static primeReqs = [ABILITIES.STR];

  constructor(lvl, origin, Class = Fighter) {
    super(lvl, origin, Class);
    this.armors = [...allArmors];
    this.shields = [...allShields];
  }
}

export class Berserker extends Fighter {
  static description = 'A terrifying warrior who fights with reckless abandon.';

  static featuresConfig = deepFreeze([
    new FeatureConfig(features.CHAIN_ATTACK, 1),
    (lvl) => new FeatureConfig(features.BERSERK, 1, { usesPerDay: super.onePlusOnePerNLevels(lvl, 4) }),
    super.multiattackFeature(7, 13),
  ]);

  static armorDescription = 'medium';

  static specializedSkills = Object.freeze([...allMeleeWeaponSkills]);
  static untrainedSkills = Object.freeze([...allMissileWeaponSkills]);
  static abilityReqs = [
    {
      name: ABILITIES.STR,
      min: 11,
    },
    {
      name: ABILITIES.WIS,
      max: 11,
    },
  ];
  static alignments = chaoticAlignments;

  constructor(lvl, origin) {
    super(lvl, origin, Berserker);
    this.armors = [...lightArmors, ...mediumArmors];
  }
}
