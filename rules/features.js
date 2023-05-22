import { buildEnum, deepFreeze } from './helper';
import CLASSES_ENUM from './classes/classes-enum';

// macro: macro code associated with feature for player to activate TODO
// active_effects: active effect definitions associated with feature TODO

const SOURCE_ENUM = deepFreeze({
  CLASS: 'class',
  RACE: 'race',
});
const { CLASS, RACE } = SOURCE_ENUM;
const { FIGHTER, BERSERKER, CLERIC, CLOISTERED_CLERIC, MAGE, INCANTATRIX, THIEF, WITCH } = CLASSES_ENUM;

const oneEverySixLevels = (lvl) => Math.floor((Number(lvl) - 1) / 6);

export const FEATURES = deepFreeze({
  'chain attack': {
    source: CLASS,
    reqLvl: {
      [FIGHTER]: 1,
    },
    derivedData: {
      attacks: {
        [FIGHTER]: (lvl) => lvl,
      },
    },
  },
  'extra attack': {
    source: CLASS,
    reqLvl: {
      [FIGHTER]: 7,
      [BERSERKER]: 7,
    },
    derivedData: {
      attacks: {
        [FIGHTER]: oneEverySixLevels,
        [BERSERKER]: oneEverySixLevels,
      },
    },
  },
  berserk: {
    source: CLASS,
    reqLvl: {
      [BERSERKER]: 1,
    },
    // TODO definition of berserk and fatigued active effect
  },
  'turn undead': {
    source: CLASS,
    reqLvl: {
      [CLERIC]: 1,
    },
  },
  'divine erudition': {
    source: CLASS,
    reqLvl: {
      [CLOISTERED_CLERIC]: 1,
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
  },
  'steal spell': {
    source: CLASS,
    reqLvl: {
      [INCANTATRIX]: 1,
    },
  },
  'sense magick': {
    source: CLASS,
    sources: {
      [INCANTATRIX]: 2,
    },
  },
  'see ethereal creatures': {
    source: CLASS,
    reqLvl: {
      [INCANTATRIX]: 4,
    },
  },
  'sense memorized spells': {
    source: CLASS,
    reqLvl: {
      [INCANTATRIX]: 5,
    },
  },
  'immune to level drain': {
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
