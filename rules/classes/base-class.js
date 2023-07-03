import { allAlignmentsArray } from '../alignments';
import { savesEnum, DEFAULT_SAVE_BASE, getSaveBase } from '../saves';
import { skills, allSkillsArray, skillProfsEnum } from '../skills';

const DEFAULT_BASE_AC = 10;

export class BaseClass {
  static #addNSpellSlotsPerLevel(spellSlots, n) {
    return spellSlots.map((x) => x.map((y) => y + n));
  }

  static addOneSpellSlotPerLevel(spellSlots) {
    return this.#addNSpellSlotsPerLevel(spellSlots, 1);
  }

  static removeOneSpellSlotPerLevel(spellSlots) {
    return this.#addNSpellSlotsPerLevel(spellSlots, -1);
  }

  static onePerNLevelsAfterFirst(lvl, n) {
    return Math.floor((lvl - 1) / n);
  }

  static onePlusOnePerFourLevels(lvl) {
    return 1 + this.onePerNLevelsAfterFirst(lvl, 4);
  }

  static oneAtEightAndTwoAtFourteen(lvl) {
    return lvl >= 14 ? 2 : lvl >= 8 ? 1 : 0;
  }

  buildSkills(Class) {
    this.skills = Object.freeze({
      [skillProfsEnum.SPECIALIZED]: Class.specializedSkills,
      [skillProfsEnum.PROFICIENT]: Class.proficientSkills,
      [skillProfsEnum.UNTRAINED]: allSkillsArray.filter(
        (s) => !skills[s].expert && ![...Class.specializedSkills, ...Class.proficientSkills].includes(s)
      ),
    });
  }

  buildSaves(Class) {
    this.saves = Object.fromEntries(
      Object.values(savesEnum).map((save) => [save, getSaveBase(this.lvl, Class.saveMods[save])])
    );
  }

  buildFeatures(Class, lvl) {
    this.features = Class.features
      .filter((f) => f.reqLvl <= lvl)
      .map((f) => ({ ...f, derivedData: f.derivedData ? f.derivedData(lvl) : {} }));
  }

  // class properties
  lvl = 0;
  primeReqs = [];
  hitDie = '';
  reqXp = 0;
  title = '';
  spellSlots = [];
  baseAc = DEFAULT_BASE_AC;
  armors = [];
  shields = [];
  skills = {
    [skillProfsEnum.SPECIALIZED]: [],
    [skillProfsEnum.PROFICIENT]: [],
    [skillProfsEnum.UNTRAINED]: [],
  };
  saves = {
    [savesEnum.RESOLVE]: DEFAULT_SAVE_BASE,
    [savesEnum.EVASION]: DEFAULT_SAVE_BASE,
    [savesEnum.RESILIENCE]: DEFAULT_SAVE_BASE,
    [savesEnum.LUCK]: DEFAULT_SAVE_BASE,
  };
  features = [];
  alignments = allAlignmentsArray;
  languages = [];
  abilityReqs = {};

  constructor(lvl, Class) {
    lvl = Number(lvl);
    this.lvl = lvl;
    this.buildSkills(Class);
    this.buildSaves(Class);
    this.buildFeatures(Class, lvl);
  }
}
