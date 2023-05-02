import { DEFAULT_BASE_AC } from '../class';
import { SKILL_BUILDERS } from '../skills';
import { SAVE_BUILDERS } from '../saves';
import { ALL_ALIGNMENTS } from '../alignments';

/*
hit_die
xp_required
title
?spell_slots
base_ac
armors
shields
skills
saves
features
alignments
?ability_reqs
*/
const statMapper = (lvl, builder, mod) => (skill) => ({ [skill]: builder(lvl, mod) });
const statProgressionMapper = (lvl, builders, mod) => (progression, stats) =>
  stats.map(statMapper(lvl, builders[progression], mod));
const buildStats = (lvl, builders, progressions, mod) =>
  progressions.flatMap(statProgressionMapper(lvl, builders, mod));

export class BaseClass {
  constructor(lvl, xp_reqs, titles, skillProgressions, saveProgressions) {
    this.hit_die = '';
    this.xp_required = xp_reqs[lvl - 1];
    this.title = titles[lvl - 1];
    this.base_ac = DEFAULT_BASE_AC;
    this.armors = [];
    this.shields = [];
    this.skills = buildStats(lvl, SKILL_BUILDERS, skillProgressions.progressions, skillProgressions.mod);
    this.saves = buildStats(lvl, SAVE_BUILDERS, saveProgressions.progressions, saveProgressions.mod);
    this.features = [];
    this.alignments = ALL_ALIGNMENTS;
  }
}
