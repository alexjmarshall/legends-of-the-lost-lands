import { deepFreeze } from '../../../helper';

export const fighterLvl1 = deepFreeze({
  lvl: 1,
  hitDie: 'd8',
  xpRequired: 1000,
  title: 'Veteran',
  spellSlots: [],
  baseAc: 10,
  armors: [
    'bone',
    'wood',
    'fur',
    'leather',
    'padded',
    'cuir bouilli',
    'brigandine',
    'scale',
    'mail',
    'elven mail',
    'plated mail',
    'lamellar',
    'splint',
    'iron plate',
    'steel plate',
  ],
  shields: ['small', 'medium', 'large'],
  skills: {
    axe: { baseBonus: 0, cap: 1 },
    bludgeon: { baseBonus: 0, cap: 1 },
    crossbow: { baseBonus: 0, cap: 1 },
    'curved greatsword': { baseBonus: 0, cap: 1 },
    'curved sword': { baseBonus: 0, cap: 1 },
    dagger: { baseBonus: 0, cap: 1 },
    greatsword: { baseBonus: 0, cap: 1 },
    hammer: { baseBonus: 0, cap: 1 },
    'hand-to-hand': { baseBonus: 0, cap: 1 },
    handgonne: { baseBonus: 0, cap: 1 },
    longbow: { baseBonus: 0, cap: 1 },
    'piercing sword': { baseBonus: 0, cap: 1 },
    polearm: { baseBonus: 0, cap: 1 },
    shortbow: { baseBonus: 0, cap: 1 },
    sling: { baseBonus: 0, cap: 1 },
    spear: { baseBonus: 0, cap: 1 },
    'spiked bludgeon': { baseBonus: 0, cap: 1 },
    staff: { baseBonus: 0, cap: 1 },
    'straight sword': { baseBonus: 0, cap: 1 },
    whip: { baseBonus: 0, cap: 1 },
    climb: { baseBonus: 0, cap: 0 },
    cook: { baseBonus: 0, cap: 0 },
    'distance run': { baseBonus: 0, cap: 0 },
    firecraft: { baseBonus: 0, cap: 0 },
    'handle animal': { baseBonus: 0, cap: 0 },
    hide: { baseBonus: 0, cap: 0 },
    'hunt/forage': { baseBonus: 0, cap: 0 },
    listen: { baseBonus: 0, cap: 0 },
    navigate: { baseBonus: 0, cap: 0 },
    persuade: { baseBonus: 0, cap: 0 },
    'poetry/music': { baseBonus: 0, cap: 0 },
    ride: { baseBonus: 0, cap: 0 },
    search: { baseBonus: 0, cap: 0 },
    sneak: { baseBonus: 0, cap: 0 },
    swim: { baseBonus: 0, cap: 0 },
    trade: { baseBonus: 0, cap: 0 },
    'treat wound': { baseBonus: 0, cap: 0 },
  },
  saves: {
    physical: { baseBonus: 1 },
    luck: { baseBonus: 1 },
    evasion: { baseBonus: 0 },
    mental: { baseBonus: 0 },
  },
  features: {
    'chain attack': { source: 'class', reqLvl: 1, derivedData: { attacks: 1 } },
  },
  alignments: ['lawful good', 'chaotic good', 'neutral', 'lawful evil', 'chaotic evil'],
  abilityReqs: {},
});

export const fighterLvl7 = deepFreeze({
  lvl: 7,
  hitDie: 'd8',
  xpRequired: 120000,
  title: 'Champion',
  spellSlots: [],
  baseAc: 10,
  armors: [
    'bone',
    'wood',
    'fur',
    'leather',
    'padded',
    'cuir bouilli',
    'brigandine',
    'scale',
    'mail',
    'elven mail',
    'plated mail',
    'lamellar',
    'splint',
    'iron plate',
    'steel plate',
  ],
  shields: ['small', 'medium', 'large'],
  skills: {
    axe: { baseBonus: 3, cap: 10 },
    bludgeon: { baseBonus: 3, cap: 10 },
    crossbow: { baseBonus: 3, cap: 10 },
    'curved greatsword': { baseBonus: 3, cap: 10 },
    'curved sword': { baseBonus: 3, cap: 10 },
    dagger: { baseBonus: 3, cap: 10 },
    greatsword: { baseBonus: 3, cap: 10 },
    hammer: { baseBonus: 3, cap: 10 },
    'hand-to-hand': { baseBonus: 3, cap: 10 },
    handgonne: { baseBonus: 3, cap: 10 },
    longbow: { baseBonus: 3, cap: 10 },
    'piercing sword': { baseBonus: 3, cap: 10 },
    polearm: { baseBonus: 3, cap: 10 },
    shortbow: { baseBonus: 3, cap: 10 },
    sling: { baseBonus: 3, cap: 10 },
    spear: { baseBonus: 3, cap: 10 },
    'spiked bludgeon': { baseBonus: 3, cap: 10 },
    staff: { baseBonus: 3, cap: 10 },
    'straight sword': { baseBonus: 3, cap: 10 },
    whip: { baseBonus: 3, cap: 10 },
    climb: { baseBonus: 1, cap: 5 },
    cook: { baseBonus: 1, cap: 5 },
    'distance run': { baseBonus: 1, cap: 5 },
    firecraft: { baseBonus: 1, cap: 5 },
    'handle animal': { baseBonus: 1, cap: 5 },
    hide: { baseBonus: 1, cap: 5 },
    'hunt/forage': { baseBonus: 1, cap: 5 },
    listen: { baseBonus: 1, cap: 5 },
    navigate: { baseBonus: 1, cap: 5 },
    persuade: { baseBonus: 1, cap: 5 },
    'poetry/music': { baseBonus: 1, cap: 5 },
    ride: { baseBonus: 1, cap: 5 },
    search: { baseBonus: 1, cap: 5 },
    sneak: { baseBonus: 1, cap: 5 },
    swim: { baseBonus: 1, cap: 5 },
    trade: { baseBonus: 1, cap: 5 },
    'treat wound': { baseBonus: 1, cap: 5 },
  },
  saves: {
    physical: { baseBonus: 7 },
    luck: { baseBonus: 7 },
    evasion: { baseBonus: 4 },
    mental: { baseBonus: 4 },
  },
  features: {
    'chain attack': { source: 'class', reqLvl: 1, derivedData: { attacks: 7 } },
    'extra attack': { source: 'class', reqLvl: 7, derivedData: { attacks: 1 } },
  },
  alignments: ['lawful good', 'chaotic good', 'neutral', 'lawful evil', 'chaotic evil'],
  abilityReqs: {},
});

export const fighterLvl13 = deepFreeze({
  lvl: 13,
  hitDie: 'd8',
  xpRequired: 840000,
  title: 'Lord (13th)',
  spellSlots: [],
  baseAc: 10,
  armors: [
    'bone',
    'wood',
    'fur',
    'leather',
    'padded',
    'cuir bouilli',
    'brigandine',
    'scale',
    'mail',
    'elven mail',
    'plated mail',
    'lamellar',
    'splint',
    'iron plate',
    'steel plate',
  ],
  shields: ['small', 'medium', 'large'],
  skills: {
    axe: { baseBonus: 6, cap: 17 },
    bludgeon: { baseBonus: 6, cap: 17 },
    crossbow: { baseBonus: 6, cap: 17 },
    'curved greatsword': { baseBonus: 6, cap: 17 },
    'curved sword': { baseBonus: 6, cap: 17 },
    dagger: { baseBonus: 6, cap: 17 },
    greatsword: { baseBonus: 6, cap: 17 },
    hammer: { baseBonus: 6, cap: 17 },
    'hand-to-hand': { baseBonus: 6, cap: 17 },
    handgonne: { baseBonus: 6, cap: 17 },
    longbow: { baseBonus: 6, cap: 17 },
    'piercing sword': { baseBonus: 6, cap: 17 },
    polearm: { baseBonus: 6, cap: 17 },
    shortbow: { baseBonus: 6, cap: 17 },
    sling: { baseBonus: 6, cap: 17 },
    spear: { baseBonus: 6, cap: 17 },
    'spiked bludgeon': { baseBonus: 6, cap: 17 },
    staff: { baseBonus: 6, cap: 17 },
    'straight sword': { baseBonus: 6, cap: 17 },
    whip: { baseBonus: 6, cap: 17 },
    climb: { baseBonus: 3, cap: 9 },
    cook: { baseBonus: 3, cap: 9 },
    'distance run': { baseBonus: 3, cap: 9 },
    firecraft: { baseBonus: 3, cap: 9 },
    'handle animal': { baseBonus: 3, cap: 9 },
    hide: { baseBonus: 3, cap: 9 },
    'hunt/forage': { baseBonus: 3, cap: 9 },
    listen: { baseBonus: 3, cap: 9 },
    navigate: { baseBonus: 3, cap: 9 },
    persuade: { baseBonus: 3, cap: 9 },
    'poetry/music': { baseBonus: 3, cap: 9 },
    ride: { baseBonus: 3, cap: 9 },
    search: { baseBonus: 3, cap: 9 },
    sneak: { baseBonus: 3, cap: 9 },
    swim: { baseBonus: 3, cap: 9 },
    trade: { baseBonus: 3, cap: 9 },
    'treat wound': { baseBonus: 3, cap: 9 },
  },
  saves: {
    physical: { baseBonus: 13 },
    luck: { baseBonus: 13 },
    evasion: { baseBonus: 9 },
    mental: { baseBonus: 9 },
  },
  features: {
    'chain attack': { source: 'class', reqLvl: 1, derivedData: { attacks: 13 } },
    'extra attack': { source: 'class', reqLvl: 7, derivedData: { attacks: 2 } },
  },
  alignments: ['lawful good', 'chaotic good', 'neutral', 'lawful evil', 'chaotic evil'],
  abilityReqs: {},
});

export const berserkerLvl1 = deepFreeze({
  ...fighterLvl1,
  features: {
    berserk: { source: 'class', reqLvl: 1 },
  },
});

export const berserkerLvl7 = deepFreeze({
  ...fighterLvl7,
  features: {
    berserk: { source: 'class', reqLvl: 1 },
    'extra attack': { source: 'class', reqLvl: 7, derivedData: { attacks: 1 } },
  },
});
export const berserkerLvl13 = deepFreeze({
  ...fighterLvl13,
  features: {
    berserk: { source: 'class', reqLvl: 1 },
    'extra attack': { source: 'class', reqLvl: 7, derivedData: { attacks: 2 } },
  },
});
