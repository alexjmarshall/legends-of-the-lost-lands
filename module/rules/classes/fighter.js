import { allArmors, lightArmors, mediumArmors, allShields } from '../armors.js';
import { allCombatSkills, allMeleeWeaponSkills, allMissileWeaponSkills, SKILLS } from '../skills.js';
import { saveBases } from '../saves.js';
import { FeatureConfig, features } from '../features.js';
import { BaseClass } from './base-class.js';
import { ABILITIES } from '../abilities.js';
import { WEAPON_CLASS } from '../weapons.js';
import { deepFreeze } from '../helper.js';
import { chaoticAlignments } from '../alignments.js';

export class Fighter extends BaseClass {
  static XP_REQS = Object.freeze([1000, 3000, 7000, 15000, 30000, 60000, 120000, 240000]);

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
  static hitDie = 'd8';
  static description = 'A champion of the battlefield.';
  static featureDescriptions = Object.freeze([
    'Extra attack after killing an enemy',
    'Attack 2x at 7th level, 3x at 13th level',
  ]);
  static shieldsDescription = 'any';
  static armorDescription = 'any';
  static weaponDescription = 'any';
  static weaponClass = WEAPON_CLASS.MARTIAL;

  static primeReqs = [ABILITIES.STR];

  constructor(lvl, Class = Fighter) {
    super(lvl, Class);
    this.armors = [...allArmors];
    this.shields = [...allShields];
  }
}

export class Berserker extends Fighter {
  static description = 'A dangerous warrior who fights with reckless abandon.';
  static featureDescriptions = Object.freeze([
    'Extra attack after killing an enemy',
    'Attack 2x at 7th level, 3x at 13th level',
    'Berserk rage (+2 to-hit & damage, +2/level temporary HP, immune to charm, fear, sleep and bleeding)',
    'Requires Strength 11+ and Wisdom no greater than 11',
  ]);

  static featuresConfig = deepFreeze([
    new FeatureConfig(features.CHAIN_ATTACK, 1),
    (lvl) => new FeatureConfig(features.BERSERK, 1, 1 + super.onePerNLevelsAfterFirst(lvl, 4)),
    super.multiattackFeature(7, 13),
  ]);

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

  constructor(lvl) {
    super(lvl, Berserker);
    this.armors = [...lightArmors, ...mediumArmors];
  }
}

export class Runecaster extends Fighter {
  static description = 'A warrior who has learned to harness the power of runes.';
  static featureDescriptions = Object.freeze([
    'Carve magic runes',
    'Attack 2x at 8th level, 3x at 15th level',
    'Requires Intelligence 9+ and Wisdom 13+',
  ]);
  static armorDescription = 'medium';

  static featuresConfig = deepFreeze([new FeatureConfig(features.RUNE_MAGIC, 1), super.multiattackFeature(8, 15)]);

  static specializedSkills = Object.freeze([...super.specializedSkills, SKILLS.RUNELORE, SKILLS.RUNECARVING]);

  static abilityReqs = [
    {
      name: ABILITIES.INT,
      min: 9,
    },
    {
      name: ABILITIES.WIS,
      min: 13,
    },
  ];

  constructor(lvl) {
    super(lvl, Berserker);
    this.armors = [...lightArmors, ...mediumArmors];
  }
}
