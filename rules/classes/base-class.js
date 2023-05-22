import { ALL_ALIGNMENTS } from '../alignments';

const DEFAULT_BASE_AC = 10;

export class BaseClass {
  constructor(lvl) {
    this.lvl = lvl;
    this.hitDie = '';
    this.xpRequired = 0;
    this.title = '';
    this.spellSlots = [];
    this.baseAc = DEFAULT_BASE_AC;
    this.armors = [];
    this.shields = [];
    this.skills = [];
    this.saves = [];
    this.features = [];
    this.alignments = ALL_ALIGNMENTS;
    this.abilityReqs = {};
  }
}
