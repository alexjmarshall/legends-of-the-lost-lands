import { allAlignments } from '../alignments.js';
import { SAVES } from '../saves.js';
import { skills, allSkills, SKILL_PROFS } from '../skills.js';
import { FeatureConfig, features } from '../features.js';
import { LANGUAGES } from '../languages.js';
import { WEAPON_CLASS } from '../weapons.js';
import { progressions } from '../helper.js';
import { removeDuplicates } from '../../helper.js';
import { allOrigins } from '../origin.js';
import { origins } from '../origin.js';

const BASE_AC_DEFAULT = 10;

export class BaseClass {
  /**
   * Adds a specified number of spell slots to each level of a spell slot array.
   *
   * @param {number[][]} spellSlots - An array representing spell slots organized by level.
   * @param {number} n - The number of spell slots to add to each level.
   * @returns {number[][]} A new array with the same structure as the input 'spellSlots' array,
   *                    but with 'n' added to each spell slot value.
   */
  static #addNSpellSlotsPerLevel(spellSlots, n) {
    return spellSlots.map((x) => x.map((y) => y + n));
  }

  /**
   * Adds one additional spell slot per level to the provided spell slots.
   *
   * @param {number[][]} spellSlots - An array representing spell slots organized by level.
   * @returns {number[][]} - A new object with one additional spell slot per level added.
   */
  static addOneSpellSlotPerLevel(spellSlots) {
    return this.#addNSpellSlotsPerLevel(spellSlots, 1);
  }

  /**
   * Removes one spell slot per level to the provided spell slots.
   *
   * @param {number[][]} spellSlots - An array representing spell slots organized by level.
   * @returns {number[][]} - A new object with one fewer spell slot per level.
   */
  static removeOneSpellSlotPerLevel(spellSlots) {
    return this.#addNSpellSlotsPerLevel(spellSlots, -1);
  }

  /**
   * Calculate the number of times an event occurs per every 'n' levels after the first 'lvl' level.
   *
   * @param {number} lvl - The current level (should be at least 1).
   * @param {number} n - The interval between occurrences (should be greater than 0).
   */
  static onePerNLevelsAfterFirst(lvl, n) {
    return Math.floor((lvl - 1) / n);
  }

  static multiattackFeature(twiceLvl, thriceLvl) {
    return (lvl) => {
      if (lvl < twiceLvl) return null;
      if (lvl < thriceLvl) return new FeatureConfig(features.MULTIATTACK_TWO, twiceLvl);
      return new FeatureConfig(features.MULTIATTACK_THREE, thriceLvl);
    };
  }

  /**
   * Calculate the additional experience points required to reach the next level.
   *
   * @param {Class} Class - The class for which you want to calculate the experience points.
   * @returns {number} The additional experience points required to reach the next level.
   */
  getXpReq(Class) {
    const afterName = this.lvl >= Class.XP_REQS.length;
    if (afterName) return Class.XP_REQ_AFTER_NAME_LVL ?? Infinity;
    return Class.XP_REQS[this.lvl] - (Class.XP_REQS[this.lvl - 1] ?? 0);
  }

  /**
   * Builds and assigns a skills object based on the provided Class, containing three skill proficiency categories.
   * @param {Class} Class - The Class object that defines skill proficiency categories.
   * @param {string} origin - The origin of the character.
   */
  buildSkills(Class, origin) {
    const actorOrigin = origins[origin];
    const spec = Class.specializedSkills ?? [];
    // add origin skills to proficient skills
    const prof = removeDuplicates([...(Class.proficientSkills ?? []), ...actorOrigin.skills]);
    const untr = Class.untrainedSkills ?? [];
    this.skills = Object.freeze({
      [SKILL_PROFS.SPECIALIZED]: removeDuplicates(spec).map((s) => ({
        name: s,
        ...progressions.fast(this.lvl),
      })),
      [SKILL_PROFS.PROFICIENT]: removeDuplicates(prof.filter((s) => !spec.includes(s))).map((s) => ({
        name: s,
        ...progressions.medium(this.lvl),
      })),
      [SKILL_PROFS.UNTRAINED]: [
        ...untr,
        ...allSkills.filter((s) => !skills[s].expert && ![...spec, ...prof, ...untr].includes(s)),
      ].map((s) => ({
        name: s,
        ...progressions.slow(this.lvl),
      })),
    });
  }

  /**
   * Builds and assigns a saves object based on the provided Class, containing four saves.
   * @param {Class} Class - The Class object that defines save progressions.
   */
  buildSaves(Class) {
    this.saves = Object.fromEntries(
      Object.values(SAVES).map((save) => {
        const saveObj = Class.saveProgressions[save]?.(this.lvl);
        return [save, saveObj.target];
      })
    );
  }

  /**
   * Builds and assigns a features object based on the provided Class.
   * @param {Class} Class - The Class object that defines features.
   */
  buildFeatures(Class) {
    this.features = Class.featuresConfig
      .map((featureConfig) => (typeof featureConfig === 'function' ? featureConfig(this.lvl) : featureConfig))
      .filter((featureConfig) => featureConfig != null && featureConfig.reqLvl <= this.lvl)
      .map((featureConfig) => ({
        ...featureConfig.feature,
        ...(featureConfig.usesPerDay !== undefined ? { usesPerDay: featureConfig.usesPerDay } : {}),
      }));
  }

  buildSpellSlots(Class) {
    this.magicSpellSlots = Class.MAGIC_SPELL_SLOTS?.[this.lvl - 1] ?? [];
    this.clericSpellSlots = Class.CLERIC_SPELL_SLOTS?.[this.lvl - 1] ?? [];
    this.druidSpellSlots = Class.DRUID_SPELL_SLOTS?.[this.lvl - 1] ?? [];
  }

  buildLanguages(Class) {
    const classLang = Class.languages ?? [];
    this.languages = [LANGUAGES.WESTERLING, ...classLang];
  }

  static firstLvlHp = 'd4+2';

  static hitDie = 'd6';

  static allowedOrigins = allOrigins;

  static alignments = allAlignments;

  static primeReqs = [];

  static weaponClass = WEAPON_CLASS.SIMPLE;

  static abilityReqs = [];

  // property defaults
  lvl = 0;
  reqXp = 0;
  title = 'Commoner';
  baseAc = BASE_AC_DEFAULT;
  armors = [];
  shields = [];
  magicSpellSlots = [];
  clericSpellSlots = [];
  druidSpellSlots = [];
  skills = {
    [SKILL_PROFS.SPECIALIZED]: [],
    [SKILL_PROFS.PROFICIENT]: [],
    [SKILL_PROFS.UNTRAINED]: [],
  };
  saves = {
    [SAVES.MENTAL]: 0,
    [SAVES.EVASION]: 0,
    [SAVES.PHYSICAL]: 0,
  };
  features = [];
  languages = [];

  constructor(lvl, origin, Class) {
    lvl = Math.max(1, Number(lvl));
    if (Class.XP_REQ_AFTER_NAME_LVL == null) {
      lvl = Math.min(lvl, Class.TITLES.length);
    }
    this.lvl = lvl;
    this.reqXp = this.getXpReq(Class);
    this.title = Class.TITLES[lvl - 1] ?? `${Class.TITLES[Class.TITLES.length - 1]} (${lvl}th Level)`;
    this.buildSkills(Class, origin);
    this.buildSaves(Class);
    this.buildFeatures(Class);
    this.buildSpellSlots(Class);
    this.buildLanguages(Class);
  }
}
