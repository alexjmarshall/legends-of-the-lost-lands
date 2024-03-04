import { allArmors, allShields } from '../armors.js';
import { allCombatSkills, allSurvivalSkills, SKILLS } from '../skills.js';
import { saveBases } from '../saves.js';
import { FeatureConfig, features } from '../features.js';
import { BaseClass } from './base-class.js';
import { ABILITIES } from '../abilities.js';
import { WEAPON_CLASS } from '../weapons.js';
import { deepFreeze } from '../../helper.js';
import { goodAlignments } from '../alignments.js';
import { RECIPES } from '../recipes.js';

export class Ranger extends BaseClass {
  static XP_REQS = Object.freeze([0, 1100, 3300, 7700, 16500, 40000, 90000, 150000, 220000, 320000]);

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
    [2, 2, 1],
    [2, 2, 2],
    [2, 2, 2],
    [2, 2, 2],
    [2, 2, 2],
    [2, 2, 2],
    [2, 2, 2],
  ]);

  static featuresConfig = deepFreeze([
    new FeatureConfig(features.ANCIENT_HATRED, 1),
    new FeatureConfig(features.ALERT, 1),
    new FeatureConfig(features.CAST_DRUID_SPELLS, 6),
    new FeatureConfig(features.CAST_MAGIC_SPELLS, 7),
    new FeatureConfig(features.READ_MAGIC_SCROLLS, 7),
    new FeatureConfig(features.SCRIBE_MAGIC_SCROLLS, 7),
    new FeatureConfig(features.MASTERY_OF_THE_STONE, 7),
    new FeatureConfig(features.RELUCTANT_LEADER, 8),
    super.multiattackFeature(8, 15),
  ]);

  static specializedSkills = Object.freeze([...allCombatSkills, SKILLS.TRACKING, SKILLS.HERBALISM]);

  static proficientSkills = Object.freeze([SKILLS.HIDING, SKILLS.SNEAKING, SKILLS.HERBLORE, ...allSurvivalSkills]);

  static saveProgressions = saveBases.ranger;

  static firstLvlHp = 'd6+6';
  static fpReserve = 15;
  static hitDie = 'd8';
  static afterNameHp = 3;
  static description = 'A warrior and woodsman with a profound destiny.';
  static featureDescriptions = Object.freeze([
    '+1 damage every 3 levels against evil humanoids',
    'Immune to backstabs and +4 to avoid surprise',
    'Cast druid spells (level 6)',
    'Cast magic spells (level 7)',
    'Read magic scrolls (level 7)',
    'Scribe magic scrolls (level 7)',
    'Employ magic items pertaining to clairaudience, clairvoyance, ESP, and telepathy (level 7)',
    'Cannot lead retainers or followers until level 8',
    'Attack 2x at 8th level, 3x at 15th level',
    'Requires Strength 13+, Intelligence 13+, Wisdom 14+, Constitution 12+ and Good alignment',
  ]);
  static startingRecipes = [RECIPES.POULTICE_TO_SLOW_POISON];
  static shieldsDescription = 'any';
  static armorDescription = 'any';
  static weaponDescription = 'any';
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
  static description = 'An implacable hunter of the most terrible undead.';
  static featureDescriptions = Object.freeze([
    '+1 damage every 3 levels against the undead',
    'Immune to backstabs and +4 to avoid surprise',
    '+4 bonus to saving throws vs. energy drain',
    'Cast druid spells (level 6)',
    'Cast magic spells (level 7)',
    'Read magic scrolls (level 7)',
    'Scribe magic scrolls (level 7)',
    'Employ magic items pertaining to clairaudience, clairvoyance, ESP, and telepathy (level 7)',
    'Cannot lead retainers or followers until level 8',
    'Attack 2x at 8th level, 3x at 15th level',
    'Requires Strength 13+, Intelligence 13+, Wisdom 14+, Constitution 12+ and Good alignment',
  ]);

  static startingRecipes = [RECIPES.WARD_AGAINST_VAMPIRES, RECIPES.WARD_AGAINST_LYCANTHROPES];

  static featuresConfig = deepFreeze([
    new FeatureConfig(features.ANCIENT_HATRED, 1),
    new FeatureConfig(features.ALERT, 1),
    new FeatureConfig(features.ENERGY_DRAIN_RESISTANCE, 1),
    new FeatureConfig(features.CAST_MAGIC_SPELLS, 4),
    new FeatureConfig(features.READ_MAGIC_SCROLLS, 4),
    new FeatureConfig(features.SCRIBE_MAGIC_SCROLLS, 4),
    new FeatureConfig(features.MASTERY_OF_THE_STONE, 7),
    new FeatureConfig(features.RELUCTANT_LEADER, 8),
    super.multiattackFeature(8, 15),
  ]);

  constructor(lvl, origin) {
    super(lvl, origin, VampireHunter);
  }
}
