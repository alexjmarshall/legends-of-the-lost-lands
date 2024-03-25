import { lightArmors } from '../armors.js';
import { allCombatSkills, allThieverySkills, SKILLS } from '../skills.js';
import { saveBases } from '../saves.js';
import { FeatureConfig, features } from '../features.js';
import { BaseClass } from './base-class.js';
import { ABILITIES } from '../abilities.js';
import { WEAPON_CLASS } from '../weapons.js';
import { deepFreeze } from '../../helper.js';
import { allExceptLawfulGood, evilAlignments } from '../alignments.js';
import { RARE_LANGUAGES } from '../languages.js';

export class Thief extends BaseClass {
  static XP_REQS = Object.freeze([0, 600, 1800, 4200, 10000, 20000, 40000, 70000, 110000, 160000]);

  static XP_REQ_AFTER_NAME_LVL = 140000;

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
    new FeatureConfig(features.BACKSTAB, 1),
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
  static description = 'A master of stealth and guile.';
  static featureDescriptions = Object.freeze([
    'Backstab unaware foes for x2 damage (+1 multiple every 4 levels)',
    'Skilled with ancient languages',
    'Read magic scrolls (4th level)',
    'Requires Dexterity 9+ and cannot be Lawful Good alignment',
  ]);
  static shieldsDescription = 'buckler only';
  static armorDescription = 'light';
  static weaponDescription = 'swords, daggers, bludgeons, slings, bows and crossbows';
  static weaponClass = WEAPON_CLASS.SIMPLE;

  static abilityReqs = [
    {
      name: ABILITIES.DEX,
      min: 9,
    },
  ];

  static primeReqs = [ABILITIES.DEX];

  static alignments = allExceptLawfulGood;

  constructor(lvl, origin, Class = Thief) {
    super(lvl, origin, Class);
    this.armors = [...lightArmors];
    this.shields = [];
  }
}

export class Assassin extends Thief {
  static featuresConfig = deepFreeze([...super.featuresConfig, new FeatureConfig(features.ASSASSINATE, 1)]);

  static specializedSkills = Object.freeze([SKILLS.POISONLORE, SKILLS.POISON_HANDLING]);

  static proficientSkills = Object.freeze([
    SKILLS.SEARCHING,
    SKILLS.LISTENING,
    SKILLS.HIDING,
    ...allCombatSkills,
    ...allThieverySkills.filter((s) => s !== SKILLS.APPRAISAL && s !== SKILLS.PICKPOCKETING),
  ]);

  static description = 'The antithesis of weal.';
  static featureDescriptions = Object.freeze([
    'Backstab unaware foes for x2 damage (+1 multiple every 4 levels)',
    'Read magic scrolls (4th level)',
    'Assassinate surprised foes (save or die)',
    'Requires Dexterity 9+ and evil alignment',
  ]);
  static shieldsDescription = 'buckler only';
  static weaponDescription = 'any';
  static weaponClass = WEAPON_CLASS.MARTIAL;

  static alignments = evilAlignments;

  constructor(lvl, origin) {
    super(lvl, origin, Assassin);
    this.shields = [];
  }
}

export class Swashbuckler extends Thief {
  static featuresConfig = deepFreeze(
    (lvl) =>
      new FeatureConfig(features.DUELLIST, 1, {
        changes: [
          {
            key: 'data.attributes.base_ac.value',
            mode: 2,
            value: super.onePlusOnePerNLevels(lvl, 4),
          },
          {
            key: 'data.derived.riposte_to_hit_mod',
            mode: 2,
            value: super.onePlusOnePerNLevels(lvl, 3),
          },
          {
            key: 'data.derived.riposte_dmg_mod',
            mode: 2,
            value: super.onePlusOnePerNLevels(lvl, 3),
          },
          {
            key: 'data.derived.counter_to_hit_mod',
            mode: 2,
            value: super.onePlusOnePerNLevels(lvl, 3),
          },
          {
            key: 'data.derived.counter_dmg_mod',
            mode: 2,
            value: super.onePlusOnePerNLevels(lvl, 3),
          },
        ],
      }),
    new FeatureConfig(features.IMPROVED_EVASION, 1)
  );

  static description = 'A master of the blade and the art of the duel.';
  static featureDescriptions = Object.freeze([
    '+1 natural AC every 4 levels',
    '+1 to-hit and damage when riposting or countering every 3 levels',
    '+3 to evasion saving throws',
    'Requires Strength 9+ and Dexterity 9+',
  ]);
  static shieldsDescription = 'buckler only';
  static weaponDescription = 'swords, daggers, bludgeons, slings, bows and crossbows';
  static weaponClass = WEAPON_CLASS.MARTIAL;

  static abilityReqs = [
    {
      name: ABILITIES.DEX,
      min: 9,
    },
    {
      name: ABILITIES.STR,
      min: 9,
    },
  ];

  constructor(lvl, origin) {
    super(lvl, origin, Swashbuckler);
  }
}
