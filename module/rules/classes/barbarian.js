import { lightArmors, mediumArmors, heavyArmors } from '../armor-and-clothing.js';
import { allShields } from '../helms-and-shields.js';
import { allCombatSkills, SKILLS } from '../skills.js';
import { saveBases } from '../saves.js';
import { FeatureConfig, features } from '../features.js';
import { BaseClass } from './base-class.js';
import { chaoticAlignments } from '../alignment.js';
import { ABILITIES } from '../abilities.js';
import { WEAPON_CLASS } from '../weapons.js';
import { deepFreeze } from '../../helper.js';

export class Barbarian extends BaseClass {
  static description = 'A grim warrior of the untamed hinterlands.';

  static XP_REQS = Object.freeze([0, 700, 2000, 5000, 10000, 25000, 50000, 90000, 150000, 220000]);

  static XP_REQ_AFTER_NAME_LVL = 160000;

  static TITLES = Object.freeze([
    'Savage',
    'Tribesman',
    'Clansman',
    'Hunter',
    'Raider',
    'Brave',
    'Hetman',
    'Destroyer',
    'Conqueror',
    'Chieftain',
  ]);

  static featuresConfig = deepFreeze([
    new FeatureConfig(features.NATURAL_TOUGHNESS),
    new FeatureConfig(features.BLEED_IMMUNITY),
    new FeatureConfig(features.ALERT),
    new FeatureConfig(features.SENSE_DANGER),
    new FeatureConfig(features.FLEET_FOOTED),
    new FeatureConfig(features.FEARLESS),
    new FeatureConfig(features.WIZARD_SLAYER),
    new FeatureConfig(features.FIRST_ATTACK_FEROCITY),
    super.multiattackFeature(8, 15),
  ]);

  static specializedSkills = Object.freeze([...allCombatSkills]);
  static proficientSkills = Object.freeze([SKILLS.CLIMBING, SKILLS.LISTENING, SKILLS.SNEAKING]);
  static saveProgressions = saveBases.fighter;

  static getArmorsByLevel(lvl) {
    if (lvl < 4) return [];
    if (lvl < 7) return lightArmors;
    if (lvl < 10) return mediumArmors;
    return [...lightArmors, ...mediumArmors, ...heavyArmors];
  }

  static firstLvlHp = '3d8';
  static describeFirstLvlHp = true;
  static fpReserve = 15;
  static afterNameHp = 3;
  static hitDie = 'd8';
  static armorDescription = 'none (level 1-3), light (level 4+), medium (level 7+), heavy (10+)';
  static weaponClass = WEAPON_CLASS.MARTIAL;
  static abilityReqs = [
    {
      name: ABILITIES.CON,
      min: 15,
    },
    {
      name: ABILITIES.STR,
      min: 14,
    },
    {
      name: ABILITIES.DEX,
      min: 13,
    },
  ];

  static primeReqs = [ABILITIES.STR, ABILITIES.CON];
  static alignments = chaoticAlignments;

  constructor(lvl, origin) {
    super(lvl, origin, Barbarian);
    this.armors = Barbarian.getArmorsByLevel(lvl);
    this.shields = allShields;
  }
}
