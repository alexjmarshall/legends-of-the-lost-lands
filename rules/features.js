import { buildEnum, deepFreeze } from './helper';
import { CLASSES_ENUM } from './classes/classes-enum';

// macro: macro code associated with feature for player to activate TODO
// active_effects: active effect definitions associated with feature TODO

const SOURCE_ENUM = Object.freeze({
  CLASS: 'class',
  RACE: 'race',
});
const { CLASS, RACE } = SOURCE_ENUM;
const {
  FIGHTER,
  BERSERKER,
  CLERIC,
  CLOISTERED_CLERIC,
  MAGE,
  INCANTATRIX,
  AIR_ELEMENTALIST,
  FIRE_ELEMENTALIST,
  EARTH_ELEMENTALIST,
  WATER_ELEMENTALIST,
  THIEF,
  ASSASSIN,
  SWASHBUCKLER,
  WITCH,
} = CLASSES_ENUM;

const onePerNLevelsAfterFirst = (lvl, n) => Math.floor((Number(lvl) - 1) / n);

export const CLASS_FEATURES_ENUM = Object.freeze({
  CHAIN_ATTACK: 'chain attack',
  EXTRA_ATTACK: 'extra attack',
  BERSERK: 'berserk',
  TURN_UNDEAD: 'turn undead',
  CAST_MAGICK_SPELLS: 'cast magick spells',
  READ_MAGICK_SCROLLS: 'read magick scrolls',
  SCRIBE_MAGICK_SCROLLS: 'scribe magick scrolls',
  CAST_CLERIC_SPELLS: 'cast cleric spells',
  READ_CLERIC_SCROLLS: 'read cleric scrolls',
  SCRIBE_CLERIC_SCROLLS: 'scribe cleric scrolls',
  CAST_WITCH_SPELLS: 'cast witch spells',
  READ_WITCH_SCROLLS: 'read witch scrolls',
  SCRIBE_WITCH_SCROLLS: 'scribe witch scrolls',
  CARVE_RUNE: 'carve rune',
  BACKSTAB: 'backstab',
  ASSASSINATE: 'assassinate',
  DUELLIST: 'duellist',
  STEAL_SPELL: 'steal spell',
  SENSE_SPELL: 'sense spell',
  SENSE_MEMORIZED_SPELLS: 'sense memorized spells',
  SENSE_MAGICK: 'sense magick',
  DRAIN_MAGICK: 'drain magick',
  AIR_ELEMENTAL_FOCUS: 'air elemental focus',
  EARTH_ELEMENTAL_FOCUS: 'earth elemental focus',
  FIRE_ELEMENTAL_FOCUS: 'fire elemental focus',
  WATER_ELEMENTAL_FOCUS: 'water elemental focus',
  ELEMENTAL_SURGE: 'elemental surge',
  DANGER_SENSE: 'danger sense',
  FEARLESS: 'fearless',
  FLEET_FOOTED: 'fleet footed',
  WIZARD_SLAYER: 'wizard slayer',
});

export const FEATURES = deepFreeze({
  'extra attack': {
    source: CLASS,
    reqLvl: {
      [FIGHTER]: 7,
      [BERSERKER]: 7,
    },
    derivedData: {
      attacks: {
        [FIGHTER]: (lvl) => onePerNLevelsAfterFirst(lvl, 6),
        [BERSERKER]: (lvl) => onePerNLevelsAfterFirst(lvl, 6),
      },
    },
  },
  berserk: {
    source: CLASS,
    reqLvl: {
      [BERSERKER]: 1,
    },
    derivedData: {
      usesPerDay: {
        [BERSERKER]: (lvl) => onePerNLevelsAfterFirst(lvl, 4) + 1,
      },
    },
    // TODO definition of berserk and fatigued active effect
  },
  'turn undead': {
    source: CLASS,
    reqLvl: {
      [CLERIC]: 1,
    },
  },
  'cast magick spells': {
    source: CLASS,
    reqLvl: {
      [MAGE]: 1,
    },
  },
  'scribe magick scrolls': {
    source: CLASS,
    reqLvl: {
      [MAGE]: 1,
    },
  },
  'read magick scrolls': {
    source: CLASS,
    reqLvl: {
      [MAGE]: 1,
      [THIEF]: 10,
    },
  },
  'cast cleric spells': {
    source: CLASS,
    reqLvl: {
      [CLERIC]: 1,
      [CLOISTERED_CLERIC]: 1,
    },
  },
  'scribe cleric scrolls': {
    source: CLASS,
    reqLvl: {
      [CLOISTERED_CLERIC]: 1,
    },
  },
  'read cleric scrolls': {
    source: CLASS,
    reqLvl: {
      [CLERIC]: 1,
      [CLOISTERED_CLERIC]: 1,
    },
  },
  'cast witch spells': {
    source: CLASS,
    reqLvl: {
      [WITCH]: 1,
    },
  },
  'scribe witch scrolls': {
    source: CLASS,
    reqLvl: {
      [WITCH]: 1,
    },
  },
  'read witch scrolls': {
    source: CLASS,
    reqLvl: {
      [WITCH]: 1,
    },
  },
  backstab: {
    source: CLASS,
    reqLvl: {
      [THIEF]: 1,
    },
    derivedData: {
      damageMultiplier: {
        [THIEF]: (lvl) => onePerNLevelsAfterFirst(lvl, 4) + 1,
      },
    },
  },
  assassinate: {
    source: CLASS,
    reqLvl: {
      [ASSASSIN]: 1,
    },
  },
  duellist: {
    source: CLASS,
    reqLvl: {
      [SWASHBUCKLER]: 1,
    },
    derivedData: {
      acBonus: {
        [SWASHBUCKLER]: (lvl) => onePerNLevelsAfterFirst(lvl, 4) + 1,
      },
      dmgBonus: {
        [SWASHBUCKLER]: (lvl) => onePerNLevelsAfterFirst(lvl, 4) + 1,
      },
    },
  },
  'steal spell': {
    source: CLASS,
    reqLvl: {
      [INCANTATRIX]: 1,
    },
  },
  'sense spell': {
    source: CLASS,
    reqLvl: {
      [INCANTATRIX]: 3,
    },
  },
  'sense memorized spells': {
    source: CLASS,
    reqLvl: {
      [INCANTATRIX]: 5,
    },
  },
  'sense magick': {
    source: CLASS,
    reqLvl: {
      [INCANTATRIX]: 7,
    },
  },
  'drain magick': {
    source: CLASS,
    reqLvl: {
      [INCANTATRIX]: 11,
    },
  },
  'air elemental focus': {
    source: CLASS,
    reqLvl: {
      [AIR_ELEMENTALIST]: 1,
    },
  },
  'fire elemental focus': {
    source: CLASS,
    reqLvl: {
      [FIRE_ELEMENTALIST]: 1,
    },
  },
  'earth elemental focus': {
    source: CLASS,
    reqLvl: {
      [EARTH_ELEMENTALIST]: 1,
    },
  },
  'water elemental focus': {
    source: CLASS,
    reqLvl: {
      [WATER_ELEMENTALIST]: 1,
    },
  },
  'elemental surge': {
    source: CLASS,
    reqLvl: {
      [AIR_ELEMENTALIST]: 1,
      [FIRE_ELEMENTALIST]: 1,
      [EARTH_ELEMENTALIST]: 1,
      [WATER_ELEMENTALIST]: 1,
    },
    derivedData: {
      usesPerDay: {
        [AIR_ELEMENTALIST]: 1,
        [FIRE_ELEMENTALIST]: 1,
        [EARTH_ELEMENTALIST]: 1,
        [WATER_ELEMENTALIST]: 1,
      },
    },
  },
  'sense danger': {
    source: CLASS,
  },
  fearless: {
    source,
  },
});

export const FEATURES_ENUM = buildEnum(FEATURES);

export function buildFeatures(source, lvl) {
  {
    const sourceFeatures = Object.keys(FEATURES).filter((key) => FEATURES[key].reqLvl?.[source] <= lvl);
    const features = {};
    sourceFeatures.forEach((key) => {
      features[key] = buildFeature(key, source, lvl);
    });

    return features;
  }
}

export function buildFeature(key, source, lvl) {
  const feature = { ...FEATURES[key] };
  feature.reqLvl = feature.reqLvl[source];
  Object.entries(feature.derivedData ?? {}).forEach(([k, v]) => {
    if (v[source] && typeof v[source] === 'function') {
      feature.derivedData = { ...feature.derivedData, [k]: v[source](lvl) };
    }
  });

  return feature;
}
