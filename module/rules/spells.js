import { deepFreeze, randomChoice } from '../helper.js';

export const SPELL_TYPES = Object.freeze({
  CLERIC: 'cleric',
  MAGIC: 'magic',
  DRUID: 'druid',
});

export const MAX_SPELL_LEVELS = Object.freeze({
  [SPELL_TYPES.CLERIC]: 7,
  [SPELL_TYPES.MAGIC]: 9,
  [SPELL_TYPES.DRUID]: 7,
});

export const SPELL_SCHOOLS = Object.freeze({
  ABJURATION: 'abjuration',
  ALTERATION: 'alteration',
  CONJURATION: 'conjuration',
  DIVINATION: 'divination',
  ENCHANTMENT: 'enchantment',
  EVOCATION: 'evocation',
  ILLUSION: 'illusion',
  NECROMANCY: 'necromancy',
});

export const SPECIALIST_CHOSEN_SCHOOLS = Object.freeze({
  ABJURER: SPELL_SCHOOLS.ABJURATION,
  CONJURER: SPELL_SCHOOLS.CONJURATION,
  DIVINER: SPELL_SCHOOLS.DIVINATION,
  ENCHANTER: SPELL_SCHOOLS.ENCHANTMENT,
  EVOKER: SPELL_SCHOOLS.EVOCATION,
  ILLUSIONIST: SPELL_SCHOOLS.ILLUSION,
  NECROMANCER: SPELL_SCHOOLS.NECROMANCY,
  TRANSMUTER: SPELL_SCHOOLS.ALTERATION,
});

export const OPPOSING_SCHOOLS = Object.freeze({
  [SPELL_SCHOOLS.ABJURATION]: [SPELL_SCHOOLS.ALTERATION],
  [SPELL_SCHOOLS.ALTERATION]: [SPELL_SCHOOLS.ABJURATION],
  [SPELL_SCHOOLS.CONJURATION]: [SPELL_SCHOOLS.DIVINATION],
  [SPELL_SCHOOLS.DIVINATION]: [SPELL_SCHOOLS.CONJURATION],
  [SPELL_SCHOOLS.ENCHANTMENT]: [SPELL_SCHOOLS.EVOCATION],
  [SPELL_SCHOOLS.EVOCATION]: [SPELL_SCHOOLS.ENCHANTMENT],
  [SPELL_SCHOOLS.ILLUSION]: [SPELL_SCHOOLS.NECROMANCY],
  [SPELL_SCHOOLS.NECROMANCY]: [SPELL_SCHOOLS.ILLUSION],
});

const clericSpells = deepFreeze({
  1: [
    'Bless',
    'Command',
    'Create Water',
    'Cure Light Wounds',
    'Detect Evil',
    'Detect Magic',
    'Doom',
    'Light',
    'Protection From Evil',
    'Purify Food & Drink',
    'Remove Fear',
    'Resist Cold',
    'Sanctuary',
  ],
  2: [
    'Augury',
    'Chant',
    'Detect Charm',
    'Detect Life',
    'Find Traps',
    'Hold Person',
    'Know Alignment',
    'Resist Fire',
    "Silence 15' Radius",
    'Slow Poison',
    'Snake Charm',
    'Speak With Animals',
    'Spiritual Hammer',
  ],
  3: [
    'Animate Dead',
    'Continual Light',
    'Create Food & Water',
    'Cure Blindness',
    'Cure Disease',
    'Dispel Magic',
    'Feign Death',
    'Glyph of Warding',
    'Locate Object',
    'Meld Into Stone',
    'Prayer',
    'Remove Curse',
    'Speak With Dead',
  ],
  4: [
    // TODO add a spell to resist exhaustion and potion to reduce
    // Spare the Dying to stabilize characters in Shock
    'Abjure',
    'Cloak of Fear',
    'Cure Serious Wounds',
    'Detect Lie',
    'Divination',
    'Exorcise',
    'Lower Water',
    'Neutralize Poison',
    "Protection From Evil 10' Radius",
    'Speak With Plants',
    'Spell Immunity',
    'Sticks to Snakes',
    'Tongues',
  ],
  5: [
    'Atonement',
    'Commune',
    'Cure Critical Wounds',
    'Dispel Evil',
    'Flame Strike',
    'Golem',
    'Insect Plague',
    'Plane Shift',
    'Quest',
    'Raise Dead',
    'True Seeing',
  ],
  6: [
    'Aerial Servant',
    'Animate Object',
    'Blade Barrier',
    'Conjure Animals',
    'False Dawn',
    'Find the Path',
    'Heal',
    'Part Water',
    'Speak With Monsters',
    'Stone Tell',
    'Word Of Recall',
  ],
  7: [
    'Astral Spell',
    'Control Weather',
    'Earthquake',
    'Gate',
    'Holy Word',
    'Regenerate',
    'Restoration',
    'Resurrection',
    'Succor',
    'Symbol',
    'Wind Walk',
  ],
});

const druidSpells = deepFreeze({
  1: [
    'Animal Friendship',
    'Detect Magic',
    'Detect Snares & Pits',
    'Detect Poison',
    'Entangle',
    'Faerie Fire',
    'Invisibility to Animals',
    'Locate Animals or Plants',
    'Pass Without Trace',
    'Predict Weather',
    'Purify Water',
    'Shillelagh',
    'Speak With Animals',
  ],
  2: [
    'Barkskin',
    'Charm Mammal',
    'Create Water',
    'Cure Light Wounds',
    'Feign Death',
    'Fire Trap',
    'Goodberry',
    'Heat Metal',
    'Moonbeam',
    'Obscurement',
    'Produce Flame',
    'Trip',
    'Warp Wood',
  ],
  3: [
    'Call Lightning',
    'Cure Disease',
    'Fireworks',
    'Hold Animal',
    'Neutralize Poison',
    'Plant Growth',
    'Protection From Fire',
    'Snare',
    'Spike Growth',
    'Stone Shape',
    'Summon Insects',
    'Tree',
    'Water Breathing',
  ],
  4: [
    'Animal Summoning I',
    'Call Woodland Beings',
    "Control Temperature 10' Radius",
    'Cloudburst',
    'Cure Serious Wounds',
    'Dispel Magic',
    'Hallucinatory Forest',
    'Hold Plant',
    'Plant Door',
    'Produce Fire',
    'Protection From Lightning',
    'Repel Insects',
    'Speak With Plants',
  ],
  5: [
    'Animal Growth',
    'Animal Summoning II',
    'Anti-Plant Shell',
    'Commune With Nature',
    'Control Winds',
    'Inset Plague',
    'Pass Plant',
    'Spike Stones',
    'Sticks to Snakes',
    'Transmute Rock to Mud',
    'Wall of Fire',
  ],
  6: [
    'Animal Summoning III',
    'Anti-Animal Shell',
    'Conjure Fire Elemental',
    'Cure Critical Wounds',
    'Feeblemind',
    'Fire Seeds',
    'Lifeoak',
    'Transport via Plants',
    'Turn Wood',
    'Wall of Thorns',
    'Weather Summoning',
  ],
  7: [
    'Animate Rock',
    'Changestaff',
    'Chariot of Sustarre',
    'Confusion',
    'Conjure Earth Elemental',
    'Control Weather',
    'Creeping Doom',
    'Finger of Death',
    'Fire Storm',
    'Reincarnate',
    'Transmute Metal to Wood',
  ],
});

const getHighestSpellLvl = (spellSlots) => {
  // return highest index of spellSlots that has a value > 0
  for (let i = spellSlots.length - 1; i >= 0; i--) {
    if (spellSlots[i] > 0) {
      return i + 1;
    }
  }
  return 0;
};

export const getClericSpellsKnown = (classInstance) => {
  const highestSpellLvl = getHighestSpellLvl(classInstance.clericSpellSlots);
  if (highestSpellLvl === 0) {
    return [];
  }
  // return every cleric spell from clericSpells of a level up to highestSpellLvl
  return Object.values(clericSpells).reduce((acc, spells, lvl) => {
    if (lvl <= highestSpellLvl) {
      return acc.concat(spells);
    }
    return acc;
  }, []);
};

export const getDruidSpellsKnown = (classInstance) => {
  const highestSpellLvl = getHighestSpellLvl(classInstance.druidSpellSlots);
  if (highestSpellLvl === 0) {
    return [];
  }
  // return every druid game spell with a lvl attribute up to highestSpellLvl
  return Object.values(druidSpells).reduce((acc, spells, lvl) => {
    if (lvl <= highestSpellLvl) {
      return acc.concat(spells);
    }
    return acc;
  }, []);
};

const firstLvlMagicSpells = deepFreeze({
  offensive: [
    'Burning Hands',
    'Charm Person',
    'Color Spray',
    'Enlarge',
    'Friends',
    'Light',
    'Magic Missile',
    'Push',
    'Shocking Grasp',
    'Sleep',
  ],
  defensive: [
    'Alarm',
    'Armor',
    'Dancing Lights',
    'Feather Fall',
    'Hold Portal',
    'Jump',
    'Protection from Evil',
    'Shield',
    'Spider Climb',
    'Ventriloquism',
  ],
  miscellaneous: [
    'Comprehend Languages',
    'Detect Magic',
    'Erase',
    'Find Familiar',
    'Identify',
    'Mending',
    'Message',
    "Tenser's Floating Disc",
    'Unseen Servant',
    'Write',
  ],
});

export const getStartingMagicSpellsKnown = (classInstance) => {
  const addMagicSpells = classInstance.lvl === 1 && classInstance.magicSpellSlots.length;
  if (!addMagicSpells) {
    return [];
  }
  return [
    randomChoice(firstLvlMagicSpells.offensive),
    randomChoice(firstLvlMagicSpells.defensive),
    randomChoice(firstLvlMagicSpells.miscellaneous),
  ];
};

// TODO downtime activity macro that sets a flag on character
// so only can do one downtime at once
// if not has spell, write scroll downtime macro, if in progress, allow cancelling it
// if has spell, read scroll macro
// write scroll macro ha form for spell name and level
// after that many days, changes name of scroll item to spell name, sets has_spell to true and changes macro

// TODO requres Int 18 to learn level 9 spells, etc.
