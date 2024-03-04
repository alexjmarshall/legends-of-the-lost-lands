import { SKILL_PROFS } from '../skills.js';
import { SAVES } from '../saves.js';
import { removeDuplicates } from '../../helper.js';
import { WEAPON_CLASS } from '../weapons.js';

export class MultiClass {
  static getFpReserve(classes) {
    // highest fpReserve of all classes
    return Math.max(...classes.map((c) => c.fpReserve));
  }

  constructor(classes, lvl, origin) {
    this.classes = classes;
    const classInstances = classes.map((c) => new c(lvl, origin));

    this.lvl = lvl;
    this.title = classInstances.map((c) => c.title).join('/');

    // baseAc is the highest baseAc of all the classes
    this.baseAc = Math.max(...classInstances.map((c) => c.baseAc));

    // reqXp is the sum of the reqXp of all the classes
    // replace any classes that have Infinity with MULTICLASS_XP_AFTER_NAME_LVL
    classInstances.forEach((c) => {
      if (c.reqXp === Infinity) {
        c.reqXp = c.constructor.MULTICLASS_XP_AFTER_NAME_LVL;
      }
    });
    this.reqXp = classInstances.reduce((acc, c) => acc + c.reqXp, 0);

    // skills is all the skills of each class added together, with no duplicates by name
    this.skills = classInstances.reduce(
      (acc, c) => {
        acc[SKILL_PROFS.SPECIALIZED].push(...c.skills[SKILL_PROFS.SPECIALIZED]);
        acc[SKILL_PROFS.PROFICIENT].push(...c.skills[SKILL_PROFS.PROFICIENT]);
        acc[SKILL_PROFS.UNTRAINED].push(...c.skills[SKILL_PROFS.UNTRAINED]);
        return acc;
      },
      { [SKILL_PROFS.SPECIALIZED]: [], [SKILL_PROFS.PROFICIENT]: [], [SKILL_PROFS.UNTRAINED]: [] }
    );
    this.skills[SKILL_PROFS.SPECIALIZED] = this.skills[SKILL_PROFS.SPECIALIZED].filter(
      (s, i, self) => self.findIndex((s2) => s2.name === s.name) === i
    );
    this.skills[SKILL_PROFS.PROFICIENT] = this.skills[SKILL_PROFS.PROFICIENT].filter(
      (s, i, self) =>
        self.findIndex((s2) => s2.name === s.name) === i &&
        !this.skills[SKILL_PROFS.SPECIALIZED].map((s) => s.name).includes(s.name)
    );
    this.skills[SKILL_PROFS.UNTRAINED] = this.skills[SKILL_PROFS.UNTRAINED].filter(
      (s, i, self) =>
        self.findIndex((s2) => s2.name === s.name) === i &&
        !this.skills[SKILL_PROFS.SPECIALIZED].map((s) => s.name).includes(s.name) &&
        !this.skills[SKILL_PROFS.PROFICIENT].map((s) => s.name).includes(s.name)
    );

    // saves is the highest save of each type of all the classes
    this.saves = {
      [SAVES.MENTAL]: Math.max(...classInstances.map((c) => c.saves[SAVES.MENTAL])),
      [SAVES.EVASION]: Math.max(...classInstances.map((c) => c.saves[SAVES.EVASION])),
      [SAVES.PHYSICAL]: Math.max(...classInstances.map((c) => c.saves[SAVES.PHYSICAL])),
    };

    // features is all the features of each class added together, with no duplicates by name
    this.features = classInstances.reduce((acc, c) => {
      acc.push(...c.features);
      return acc;
    }, []);
    this.features = this.features.filter((f, i, self) => self.findIndex((f2) => f2.name === f.name) === i);

    // languages is all the languages of each class added together, with no duplicates
    this.languages = removeDuplicates(
      classInstances.reduce((acc, c) => {
        acc.push(...c.languages);
        return acc;
      }, [])
    );

    // hitDie is the average of all classes, rounded down
    // function that removes everything up to and including the letter 'd'
    const hitDieNumber = (hitDie) => Number(hitDie.toString().replace(/.*d/, ''));
    this.hitDie = `d${Math.floor(classes.reduce((acc, c) => acc + hitDieNumber(c.hitDie), 0) / classInstances.length)}`;

    // thisLevelHp is hitDie, unless all classes are after name level
    // in which case it's the average of all classes, rounded down
    this.thisLevelHp = classInstances.every((c) => c.thisLevelHp === c.constructor.afterNameHp)
      ? `${Math.floor(classInstances.reduce((acc, c) => acc + hitDieNumber(c.thisLevelHp), 0) / classInstances.length)}`
      : this.hitDie;

    // armor & shields is all the types of each class added together, with no duplicates
    this.armors = removeDuplicates(
      classInstances.reduce((acc, c) => {
        acc.push(...c.armors);
        return acc;
      }, [])
    );
    this.shields = removeDuplicates(
      classInstances.reduce((acc, c) => {
        acc.push(...c.shields);
        return acc;
      }, [])
    );

    // weapon class is martial if any class has martial, otherwise simple
    this.weaponClass = classes.some((c) => c.weaponClass === WEAPON_CLASS.MARTIAL)
      ? WEAPON_CLASS.MARTIAL
      : WEAPON_CLASS.SIMPLE;

    // spell slots is taken from the class with the most slots at first level
    /* e.g. magicSpellSlots:
      class 1: [3, 2, 1]
      class 2: [2, 1]
    */
    const spellSlotReducer = (spellSlotType) => (acc, c) => {
      if (acc[0] == null || c[spellSlotType][0] > acc[0]) {
        acc = c[spellSlotType];
      }
      return acc;
    };
    this.magicSpellSlots = classInstances.reduce(
      spellSlotReducer('magicSpellSlots'),
      classInstances[0].magicSpellSlots
    );
    this.clericSpellSlots = classInstances.reduce(
      spellSlotReducer('clericSpellSlots'),
      classInstances[0].clericSpellSlots
    );
    this.druidSpellSlots = classInstances.reduce(
      spellSlotReducer('druidSpellSlots'),
      classInstances[0].druidSpellSlots
    );
  }
}
