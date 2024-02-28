import { BaseClass } from './base-class';
import { SKILL_PROFS } from '../skills';
import { SAVES } from '../saves';

export class MultiClass {
  constructor(classes, lvl, origin) {
    this.classes = classes;
    this.classInstances = classes.map((c) => new c(lvl, origin));
    this.lvl = this.classInstances[0].lvl;
    // reqXp is the sum of the reqXp of all the classes
    this.reqXp = this.classInstances.reduce((acc, c) => acc + c.reqXp, 0);
    this.title = this.classInstances.map((c) => c.title).join('/');
    // skills is all the skills of each class added together, with no duplicates by name
    this.skills = this.classInstances.reduce((acc, c) => {
      acc[SKILL_PROFS.SPECIALIZED].push(...c.skills[SKILL_PROFS.SPECIALIZED]);
      acc[SKILL_PROFS.PROFICIENT].push(...c.skills[SKILL_PROFS.PROFICIENT]);
      acc[SKILL_PROFS.UNTRAINED].push(...c.skills[SKILL_PROFS.UNTRAINED]);
      return acc;
    });
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
    this.saves = {
      [SAVES.MENTAL]: Math.max(...this.classInstances.map((c) => c.saves[SAVES.MENTAL])),
      [SAVES.EVASION]: Math.max(...this.classInstances.map((c) => c.saves[SAVES.EVASION])),
      [SAVES.PHYSICAL]: Math.max(...this.classInstances.map((c) => c.saves[SAVES.PHYSICAL])),
    };
    // features is all the features of each class added together, with no duplicates by name
    this.features = this.classInstances.reduce((acc, c) => {
      acc.push(...c.features);
      return acc;
    }, []);
    this.features = this.features.filter((f, i, self) => self.findIndex((f2) => f2.name === f.name) === i);

    // CONTINUE SPELL SLOTS
  }
}
