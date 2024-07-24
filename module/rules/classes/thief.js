import { lightArmors } from '../armor-and-clothing.js';
import { allMeleeWeaponSkills, allMissileWeaponSkills, allThieverySkills, SKILLS } from '../skills.js';
import { saveBases } from '../saves.js';
import { FeatureConfig, features } from '../features.js';
import { BaseClass } from './base-class.js';
import { ABILITIES } from '../abilities.js';
import { WEAPON_CLASS } from '../weapons.js';
import { deepFreeze } from '../../helper.js';
import { allExceptLawfulGood, evilAlignments } from '../alignment.js';
import { RARE_LANGUAGES } from '../languages.js';

export class Thief extends BaseClass {
  static description = "A rogue who uses stealth and guile to liberate the underworld's treasures.";

  static XP_REQS = Object.freeze([0, 600, 1800, 4200, 10000, 20000, 40000, 70000, 110000, 160000]);

  static XP_REQ_AFTER_NAME_LVL = 120000;

  static TITLES = Object.freeze([
    'Apprentice',
    'Footpad',
    'Cutpurse',
    'Robber',
    'Burglar',
    'Filcher',
    'Pilferer',
    'Magsman',
    'Thief',
    'Master Thief',
  ]);

  static featuresConfig = deepFreeze([
    new FeatureConfig(features.BACKSTAB),
    new FeatureConfig(features.READ_MAGIC_SCROLLS, 4),
  ]);

  static specializedSkills = Object.freeze([
    SKILLS.SEARCHING,
    SKILLS.LISTENING,
    SKILLS.HIDING,
    ...allThieverySkills.filter((s) => s !== SKILLS.DISGUISE),
  ]);

  static proficientSkills = Object.freeze([
    SKILLS.STRAIGHT_SWORD,
    SKILLS.CURVED_SWORD,
    SKILLS.DAGGER,
    SKILLS.BLUDGEON,
    SKILLS.HAND_TO_HAND,
    SKILLS.SLING,
    SKILLS.BOW,
    SKILLS.CROSSBOW,
    SKILLS.ANCIENT_LANGUAGES,
  ]);

  static saveProgressions = saveBases.thief;

  static languages = Object.freeze([RARE_LANGUAGES.THIEVES_CANT]);

  static firstLvlHp = 'd4+1';
  static fpReserve = 10;
  static hitDie = 'd4';
  static afterNameHp = 1;
  static shieldsDescription = 'buckler only';
  static armorDescription = 'light';
  static weaponDescription = 'one-handed swords, daggers, bludgeons, slings, bows and crossbows';
  static weaponClass = WEAPON_CLASS.SIMPLE;

  static primeReqs = [ABILITIES.DEX];

  static alignments = allExceptLawfulGood;

  constructor(lvl, origin, Class = Thief) {
    super(lvl, origin, Class);
    this.armors = [...lightArmors];
    this.shields = [];
  }
}

export class Assassin extends Thief {
  static description = 'The antithesis of weal.';

  static featuresConfig = deepFreeze([
    new FeatureConfig(features.BACKSTAB),
    new FeatureConfig(features.ASSASSINATE),
    new FeatureConfig(features.READ_MAGIC_SCROLLS, 4),
  ]);

  static specializedSkills = Object.freeze([SKILLS.POISONLORE, SKILLS.POISON_HANDLING, SKILLS.DISGUISE]);

  static proficientSkills = Object.freeze([
    SKILLS.SEARCHING,
    SKILLS.LISTENING,
    SKILLS.HIDING,
    ...allMeleeWeaponSkills,
    ...allMissileWeaponSkills,
    ...allThieverySkills.filter((s) => s !== SKILLS.APPRAISAL && s !== SKILLS.PICKPOCKETING && s !== SKILLS.DISGUISE),
  ]);
  static weaponClass = WEAPON_CLASS.MARTIAL;
  static alignments = evilAlignments;

  static abilityReqs = [
    {
      name: ABILITIES.INT,
      min: 11,
    },
    {
      name: ABILITIES.CHA,
      max: 10,
    },
  ];

  constructor(lvl, origin) {
    super(lvl, origin, Assassin);
  }
}

export class Swashbuckler extends Thief {
  static description = 'A duelist who uses their agility and wits to outmaneuver opponents.';

  static featuresConfig = deepFreeze([
    (lvl) =>
      new FeatureConfig(features.DUELLIST, 1, {
        changes: [
          {
            key: 'data.base_ac',
            mode: 2,
            value: super.onePlusOnePerNLevels(lvl, 4),
          },
          {
            key: 'data.melee_to_hit_mod',
            mode: 2,
            value: super.onePlusOnePerNLevels(lvl, 3),
          },
          {
            key: 'data.melee_dmg_mod',
            mode: 2,
            value: super.onePlusOnePerNLevels(lvl, 4),
          },
        ],
      }),
    new FeatureConfig(features.IMPROVED_EVASION),
    new FeatureConfig(features.READ_MAGIC_SCROLLS, 4),
  ]);

  static proficientSkills = Thief.proficientSkills.filter((s) => s !== SKILLS.ANCIENT_LANGUAGES);

  static weaponDescription = 'swords, daggers, bludgeons, slings, bows and crossbows';
  static weaponClass = WEAPON_CLASS.MARTIAL;

  static abilityReqs = [
    {
      name: ABILITIES.DEX,
      min: 13,
    },
    {
      name: ABILITIES.CHA,
      min: 11,
    },
  ];

  constructor(lvl, origin) {
    super(lvl, origin, Swashbuckler);
  }
}
