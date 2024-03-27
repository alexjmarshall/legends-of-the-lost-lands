import { allArmors, allShields } from '../armors.js';
import { allCombatSkills } from '../skills.js';
import { saveBases } from '../saves.js';
import { FeatureConfig, features } from '../features.js';
import { BaseClass } from './base-class.js';
import { ABILITIES } from '../abilities.js';
import { WEAPON_CLASS } from '../weapons.js';
import { deepFreeze } from '../../helper.js';
import { ALIGNMENTS, lawfulAlignments } from '../alignments.js';

export class Paladin extends BaseClass {
  static XP_REQS = Object.freeze([0, 1300, 4000, 9000, 20000, 45000, 95000, 170000, 340000]);

  static XP_REQ_AFTER_NAME_LVL = 220000;

  static TITLES = Object.freeze([
    'Gallant',
    'Keeper',
    'Protector',
    'Defender',
    'Cavalier',
    'Sentinel',
    'Crusader',
    'Justiciar',
    'Paladin',
  ]);

  static featuresConfig = deepFreeze([
    new FeatureConfig(features.LAY_ON_HANDS, 1, { usesPerDay: 1 }),
    new FeatureConfig(features.HOLY_PROTECTION, 1),
    new FeatureConfig(features.FEARLESS, 1),
    new FeatureConfig(features.DETECT_EVIL, 1),
    new FeatureConfig(features.ASCETIC, 1),
    new FeatureConfig(features.REBUKE_UNDEAD, 3),
    new FeatureConfig(features.PALADIN_STEED, 4),
    new FeatureConfig(features.AURA_OF_PROTECTION, 6),
    new FeatureConfig(features.BANISH_EVIL, 8),
    super.multiattackFeature(7, 13),
  ]);

  static specializedSkills = Object.freeze([...allCombatSkills]);

  static saveProgressions = saveBases.cleric;

  static firstLvlHp = 'd6+2';
  static fpReserve = 15;
  static hitDie = 'd8';
  static afterNameHp = 3;
  static description = 'A warrior bold and pure.';
  static featureDescriptions = Object.freeze([
    'Lay on hands to heal 2 HP/level (1/day)',
    '+2 to saving throws and AC',
    'Immune to fear',
    'Immune to disease',
    'Detect evil creatures and enchantments',
    'Continually gives away excess wealth',
    'Turn the undead (level 3, requires a holy sword)',
    'Summons an intelligent warhorse (level 4)',
    "+2 to saving throws & AC, +4 to saving throws vs. fear for allies in a 10' radius (level 6)",
    'Attack 2x at 7th level, 3x at 13th level',
    'Banish summoned/extraplanar creatures (level 8, requires a holy sword)',
    'Requires Strength 12+, Wisdom 9+, Charisma 17+ and Lawful Good alignment',
  ]);
  static shieldsDescription = 'any';
  static armorDescription = 'any';
  static weaponDescription = 'any';
  static weaponClass = WEAPON_CLASS.MARTIAL;

  static abilityReqs = [
    {
      name: ABILITIES.STR,
      min: 12,
    },
    {
      name: ABILITIES.WIS,
      min: 9,
    },
    {
      name: ABILITIES.CHA,
      min: 17,
    },
  ];

  static primeReqs = [ABILITIES.STR, ABILITIES.CHA];

  static alignments = [ALIGNMENTS.LG];

  constructor(lvl, origin, Class = Paladin) {
    super(lvl, origin, Class);
    this.armors = [...allArmors];
    this.shields = [...allShields];
  }
}

export class Inquisitor extends Paladin {
  static description = 'A remorseless upholder of the law.';
  static featureDescriptions = Object.freeze([
    '+2 to saving throws and AC',
    'Immune to fear',
    'Immune to disease',
    'Detect evil creatures and enchantments',
    'Detect lies',
    'Continually gives away excess wealth',
    'Turn the undead (level 3, requires a holy sword)',
    'Dispel magic (level 5, 1/day every 4 levels)',
    'True sight (level 5, 1/day every 4 levels)',
    'Attack 2x at 7th level, 3x at 13th level',
    'Banish summoned/extraplanar creatures (level 8, requires a holy sword)',
    'Requires Strength 9+, Wisdom 13+, Charisma 16+ and Lawful alignment',
  ]);

  static featuresConfig = deepFreeze([
    new FeatureConfig(features.HOLY_PROTECTION, 1),
    new FeatureConfig(features.FEARLESS, 1),
    new FeatureConfig(features.DETECT_EVIL, 1),
    new FeatureConfig(features.DETECT_LIE, 1),
    new FeatureConfig(features.ASCETIC, 1),
    new FeatureConfig(features.REBUKE_UNDEAD, 3),
    (lvl) => new FeatureConfig(features.DISPEL_MAGIC, 5, { usesPerDay: super.onePlusOnePerNLevels(lvl - 4, 4) }),
    (lvl) => new FeatureConfig(features.TRUE_SIGHT, 5, { usesPerDay: super.onePlusOnePerNLevels(lvl - 4, 4) }),
    new FeatureConfig(features.BANISH_EVIL, 8),
    super.multiattackFeature(7, 13),
  ]);

  static abilityReqs = [
    {
      name: ABILITIES.STR,
      min: 9,
    },
    {
      name: ABILITIES.WIS,
      min: 13,
    },
    {
      name: ABILITIES.CHA,
      min: 16,
    },
  ];

  static primeReqs = [ABILITIES.WIS, ABILITIES.CHA];

  static alignments = lawfulAlignments;

  constructor(lvl, origin) {
    super(lvl, origin, Inquisitor);
  }
}
