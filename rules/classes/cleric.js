import { allArmorsArray, allShieldsArray, lightArmorsArray, mediumArmorsArray } from '../armors';
import { basicCombatSkillsArray, allSpellSkillsArray, skillsEnum } from '../skills.js';
import { saveModGroups } from '../saves';
import { ClassFeature, featuresEnum } from '../features';
import { BaseClass } from './base-class';
import { abilitiesEnum } from '../abilities';
import { deepFreeze } from '../helper';

export class Cleric extends BaseClass {
  static XP_REQS = Object.freeze([
    800,
    2400,
    5600,
    12000,
    25000,
    50000,
    100000,
    200000,
    350000,
    400000,
    550000,
    700000,
    850000,
    Infinity,
  ]);

  static TITLES = Object.freeze([
    'Acolyte',
    'Initiate',
    'Adept',
    'Curate',
    'Elder',
    'Priest',
    'Hierophant',
    'Hierarch',
    'High Priest',
    'High Priest (10th)',
    'High Priest (11th)',
    'High Priest (12th)',
    'High Priest (13th)',
    'High Priest (14th)',
  ]);

  static SPELL_SLOTS_BY_LEVEL = deepFreeze([
    [0],
    [1],
    [2],
    [2, 1],
    [2, 2],
    [2, 2, 1],
    [2, 2, 2, 1],
    [2, 2, 2, 2, 1],
    [3, 3, 3, 2, 2],
    [3, 3, 3, 3, 3],
    [4, 4, 4, 3, 3],
    [4, 4, 4, 4, 4, 1],
    [5, 5, 5, 4, 4, 2],
    [5, 5, 5, 5, 5, 3],
  ]);

  static features = deepFreeze([
    new ClassFeature(featuresEnum.TURN_UNDEAD, 1, (lvl) => ({
      turningLvl: lvl,
    })),
    new ClassFeature(featuresEnum.CAST_CLERIC_SPELLS, 1),
    new ClassFeature(featuresEnum.READ_CLERIC_SCROLLS, 1),
  ]);

  static specializedSkills = Object.freeze([...allSpellSkillsArray]);
  static proficientSkills = Object.freeze([
    skillsEnum.BLUDGEON,
    skillsEnum.HAND_TO_HAND,
    skillsEnum.SLING,
    skillsEnum.STAFF,
    skillsEnum.THROW,
    skillsEnum.FLAIL_WHIP,
  ]);

  static saveMods = saveModGroups.cleric;

  constructor(lvl) {
    lvl = Number(lvl);
    super(lvl, Cleric);
    this.primeReqs = [abilitiesEnum.WIS];
    this.hitDie = 'd6';
    this.reqXp = Cleric.XP_REQS[lvl - 1];
    this.title = Cleric.TITLES[lvl - 1];
    this.spellSlots = Cleric.SPELL_SLOTS_BY_LEVEL[lvl - 1];
    this.armors = [...allArmorsArray];
    this.shields = [...allShieldsArray];
    this.abilityReqs = {
      [abilitiesEnum.WIS]: {
        min: 9,
      },
    };
  }
}

export class CloisteredCleric extends Cleric {
  static specializedSkills = Object.freeze([...super.specializedSkills, skillsEnum.READ_LANGUAGES]);

  static features = deepFreeze([...super.features, new ClassFeature(featuresEnum.SCRIBE_CLERIC_SCROLLS, 1)]);

  static SPELL_SLOTS_BY_LEVEL = Object.freeze([...BaseClass.addOneSpellSlotPerLevel(Cleric.SPELL_SLOTS_BY_LEVEL)]);

  constructor(lvl) {
    lvl = Number(lvl);
    super(lvl);
    this.spellSlots = CloisteredCleric.SPELL_SLOTS_BY_LEVEL[lvl - 1];
    this.armors = [];
    this.shields = [];
    this.abilityReqs = {
      ...this.abilityReqs,
      [abilitiesEnum.INT]: {
        min: 9,
      },
    };
    this.buildSkills(CloisteredCleric);
    this.buildFeatures(CloisteredCleric, lvl);
  }
}

export class Runepriest extends Cleric {
  static specializedSkills = Object.freeze([skillsEnum.RUNELORE, skillsEnum.RUNECARVING]);
  static proficientSkills = Object.freeze([...basicCombatSkillsArray]);

  static features = deepFreeze([
    new ClassFeature(featuresEnum.TURN_UNDEAD, 1, (lvl) => ({
      turningLvl: lvl,
    })),
    new ClassFeature(featuresEnum.RUNE_MAGICK, 1),
  ]);

  constructor(lvl) {
    lvl = Number(lvl);
    super(lvl);
    this.spellSlots = [];
    this.armors = [...lightArmorsArray, ...mediumArmorsArray];
    this.shields = [...allShieldsArray];
    this.abilityReqs = {
      ...this.abilityReqs,
      [abilitiesEnum.INT]: {
        min: 9,
      },
    };
    this.buildSkills(Runepriest);
    this.buildFeatures(Runepriest, lvl);
  }
}
