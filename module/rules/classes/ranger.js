import { allArmors, allShields } from '../armors.js';
import { allCombatSkills, SKILLS } from '../skills.js';
import { saveBases } from '../saves.js';
import { FeatureConfig, features } from '../features.js';
import { BaseClass } from './base-class.js';
import { ABILITIES } from '../abilities.js';
import { WEAPON_CLASS } from '../weapons.js';
import { deepFreeze } from '../../helper.js';
import { goodAlignments } from '../alignments.js';
import { RECIPES } from '../recipes.js';

export class Ranger extends BaseClass {
  static description = 'A warrior and woodsman with a profound destiny.';

  static XP_REQS = Object.freeze([0, 1200, 3600, 8400, 18000, 40000, 90000, 150000, 220000, 320000]);

  static XP_REQ_AFTER_NAME_LVL = 200000;

  static TITLES = Object.freeze([
    'Runner',
    'Strider',
    'Scout',
    'Guide',
    'Pathfinder',
    'Warden',
    'Guardian',
    'Ranger',
    'Ranger-Knight',
    'Ranger-Lord',
  ]);

  static MAGIC_SPELL_SLOTS = Object.freeze([
    [],
    [],
    [],
    [],
    [],
    [],
    [1],
    [1],
    [2],
    [2, 1],
    [2, 1],
    [2, 2],
    [2, 2],
    [2, 2],
    [2, 2],
    [2, 2],
    [2, 2],
    [2, 2],
    [2, 2],
    [2, 2],
  ]);

  static DRUID_SPELL_SLOTS = Object.freeze([
    [],
    [],
    [],
    [],
    [],
    [1],
    [1],
    [2],
    [2],
    [2, 1],
    [2, 1],
    [2, 2],
    [2, 2],
    [2, 2],
    [2, 2],
    [2, 2],
    [2, 2],
    [2, 2],
    [2, 2],
    [2, 2],
  ]);

  static featuresConfig = deepFreeze([
    new FeatureConfig(features.ANCIENT_HATRED, 1),
    new FeatureConfig(features.ALERT, 1),
    new FeatureConfig(features.NEUTRALIZE_POISON, 1, { usesPerDay: 1 }),
    new FeatureConfig(features.CAST_DRUID_SPELLS, 6),
    new FeatureConfig(features.CAST_MAGIC_SPELLS, 7),
    new FeatureConfig(features.READ_MAGIC_SCROLLS, 7),
    new FeatureConfig(features.MASTERY_OF_THE_STONE, 7),
    new FeatureConfig(features.RELUCTANT_LEADER, 8),
    super.multiattackFeature(5, 9),
  ]);

  static specializedSkills = Object.freeze([...allCombatSkills, SKILLS.TRACKING, SKILLS.HERBALISM]);

  static proficientSkills = Object.freeze([SKILLS.HIDING, SKILLS.SNEAKING, SKILLS.HERBLORE, SKILLS.LISTENING]);

  static saveProgressions = saveBases.ranger;

  static startingRecipes = [RECIPES.POULTICE_TO_NEUTRALIZE_POISON];

  static firstLvlHp = '2d8';
  static describeFirstLvlHp = true;
  static fpReserve = 15;
  static hitDie = 'd8';
  static afterNameHp = 3;
  static weaponClass = WEAPON_CLASS.MARTIAL;

  static abilityReqs = [
    {
      name: ABILITIES.STR,
      min: 13,
    },
    {
      name: ABILITIES.INT,
      min: 13,
    },
    {
      name: ABILITIES.WIS,
      min: 14,
    },
    {
      name: ABILITIES.CON,
      min: 12,
    },
  ];

  static primeReqs = [ABILITIES.STR, ABILITIES.INT];

  static alignments = goodAlignments;

  constructor(lvl, origin, Class = Ranger) {
    super(lvl, origin, Class);
    this.armors = [...allArmors];
    this.shields = [...allShields];
  }
}

export class VampireHunter extends Ranger {
  static description = 'An implacable hunter of the undead.';

  static startingRecipes = [RECIPES.WARD_AGAINST_VAMPIRES, RECIPES.WARD_AGAINST_LYCANTHROPES];

  static featuresConfig = deepFreeze([
    new FeatureConfig(features.ANCIENT_HATRED_UNDEAD, 1),
    new FeatureConfig(features.ALERT, 1),
    new FeatureConfig(features.NEUTRALIZE_POISON, 1, { usesPerDay: 1 }),
    new FeatureConfig(features.ENERGY_DRAIN_RESISTANCE, 1),
    new FeatureConfig(features.CAST_DRUID_SPELLS, 6),
    new FeatureConfig(features.CAST_MAGIC_SPELLS, 7),
    new FeatureConfig(features.READ_MAGIC_SCROLLS, 7),
    new FeatureConfig(features.MASTERY_OF_THE_STONE, 7),
    new FeatureConfig(features.RELUCTANT_LEADER, 8),
    super.multiattackFeature(5, 9),
  ]);

  constructor(lvl, origin) {
    super(lvl, origin, VampireHunter);
  }
}
