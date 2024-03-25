import { lightArmors, mediumArmors, allShields } from '../armors.js';
import { allCombatSkills, SKILLS } from '../skills.js';
import { saveBases } from '../saves.js';
import { FeatureConfig, features } from '../features.js';
import { BaseClass } from './base-class.js';
import { chaoticAlignments } from '../alignments.js';
import { ABILITIES } from '../abilities.js';
import { WEAPON_CLASS } from '../weapons.js';
import { deepFreeze } from '../../helper.js';

export class Barbarian extends BaseClass {
  static XP_REQS = Object.freeze([0, 700, 2000, 5000, 10000, 25000, 45000, 90000, 150000, 230000]);

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
    new FeatureConfig(features.NATURAL_TOUGHNESS, 1), // immune to bleed and backstab
    new FeatureConfig(features.FEARLESS, 1),
    new FeatureConfig(features.FLEET_FOOTED, 1),
    new FeatureConfig(features.WIZARD_SLAYER, 1),
    new FeatureConfig(features.FIRST_ATTACK_FEROCITY, 1),
    new FeatureConfig(features.SENSE_DANGER, 1),
    super.multiattackFeature(8, 15),
  ]);

  static specializedSkills = Object.freeze([...allCombatSkills]);

  static proficientSkills = Object.freeze([SKILLS.CLIMBING]);

  static saveProgressions = saveBases.fighter;

  static getArmorsByLevel(lvl) {
    if (lvl < 4) return [];
    if (lvl < 7) return lightArmors;
    return [...lightArmors, ...mediumArmors];
  }

  static description = 'A grim warrior of the untamed hinterlands.';

  static featureDescriptions = Object.freeze([
    '+2 natural ac',
    'Immune to bleeding',
    'Fear causes the Barbarian to attack in fury rather than flee',
    'Enhanced movement rate (15)',
    'Makes a free attack against casting mages within melee range',
    '+1-4 to-hit and damage when attacking with initiative',
    'Sixth sense warns of danger',
    'Attack 2x at 7th level, 3x at 13th level',
    'Requires Constitution 15+, Strength 14+ and Dexterity 13+',
  ]);

  static firstLvlHp = 'd8+8';

  static fpReserve = 15;

  static afterNameHp = 3;

  static hitDie = 'd10';

  static shieldsDescription = 'any';

  static armorDescription = 'none (level 1-3), light (level 4+), medium (level 7+)';

  static weaponDescription = 'any';

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
