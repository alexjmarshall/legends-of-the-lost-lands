import { allArmors } from '../armor-and-clothing.js';
import { allShields } from '../helms-and-shields.js';
import { allCombatSkills } from '../skills.js';
import { saveBases } from '../saves.js';
import { FeatureConfig, features } from '../features.js';
import { BaseClass } from './base-class.js';
import { ABILITIES } from '../abilities.js';
import { WEAPON_CLASS } from '../weapons.js';
import { deepFreeze } from '../../helper.js';
import { ALIGNMENTS, lawfulAlignments } from '../alignment.js';

export class Paladin extends BaseClass {
  static XP_REQS = Object.freeze([0, 1400, 4200, 10000, 22000, 45000, 95000, 170000, 350000]);

  static XP_REQ_AFTER_NAME_LVL = 230000;

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
    new FeatureConfig(features.HOLY_PROTECTION),
    new FeatureConfig(features.DISEASE_IMMUNITY),
    new FeatureConfig(features.DETECT_EVIL),
    new FeatureConfig(features.LAY_ON_HANDS_HEALING),
    new FeatureConfig(features.LAY_ON_HANDS_CURE_DISEASE),
    new FeatureConfig(features.REBUKE_UNDEAD, 3),
    new FeatureConfig(features.PALADIN_STEED, 4),
    new FeatureConfig(features.AURA_OF_PROTECTION, 6),
    new FeatureConfig(features.BANISH_EVIL, 8),
    new FeatureConfig(features.ASCETIC),
    new FeatureConfig(features.HARD_LEADER_PALADIN),
    super.multiattackFeature(7, 13),
  ]);

  static specializedSkills = Object.freeze([...allCombatSkills]);

  static saveProgressions = saveBases.cleric;

  static firstLvlHp = 'd6+4';
  static fpReserve = 15;
  static hitDie = 'd8';
  static afterNameHp = 3;
  static description = 'A warrior bold and pure who walks a narrow path.';
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

  static featuresConfig = deepFreeze([
    new FeatureConfig(features.HOLY_PROTECTION),
    new FeatureConfig(features.DISEASE_IMMUNITY),
    new FeatureConfig(features.DETECT_EVIL),
    new FeatureConfig(features.DETECT_LIE),
    (lvl) =>
      new FeatureConfig(features.DISPEL_MAGIC, 1, {
        // TODO cast as 1.5x level? what speed factor?
        usesPer: { uses: super.onePlusOnePerNLevels(lvl, 4), interval: 'day' },
      }),
    (lvl) =>
      new FeatureConfig(features.TRUE_SIGHT, 1, {
        usesPer: { uses: super.onePlusOnePerNLevels(lvl, 4), interval: 'day' },
      }),
    new FeatureConfig(features.PALADIN_STEED, 4),
    new FeatureConfig(features.ASCETIC),
    new FeatureConfig(features.HARD_LEADER_INQUISITOR),
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

  static alignments = lawfulAlignments;

  constructor(lvl, origin) {
    super(lvl, origin, Inquisitor);
  }
}
