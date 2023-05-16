// macro: macro code associated with feature for player to activate TODO
// active_effects: active effect definitions associated with feature TODO

const SOURCE_ENUM = {
  CLASS: 'class',
  RACE: 'race',
};

export default {
  'chain attack': {
    source: SOURCE_ENUM.CLASS,
    req_lvl: 1,
  },
  'extra attack': {
    source: SOURCE_ENUM.CLASS,
    req_lvl: 1,
  },
  berserk: {
    source: SOURCE_ENUM.CLASS,
    req_lvl: 1,
    // TODO definition of berserk and fatigued active effect
  },
  'turn undead': {
    source: SOURCE_ENUM.CLASS,
    req_lvl: 1,
    // TODO macro
  },
  'divine erudition': {
    source: SOURCE_ENUM.CLASS,
    req_lvl: 1,
  },
  'cast magick spells': {
    source: SOURCE_ENUM.CLASS,
    req_lvl: 1,
  },
  'scribe magick scrolls': {
    source: SOURCE_ENUM.CLASS,
    req_lvl: 1,
  },
  'read magick scrolls': {
    source: SOURCE_ENUM.CLASS,
    req_lvl: 1,
  },
  'cast cleric spells': {
    source: SOURCE_ENUM.CLASS,
    req_lvl: 1,
  },
  'scribe cleric scrolls': {
    source: SOURCE_ENUM.CLASS,
    req_lvl: 1,
  },
  'read cleric scrolls': {
    source: SOURCE_ENUM.CLASS,
    req_lvl: 1,
  },
  'cast witch spells': {
    source: SOURCE_ENUM.CLASS,
    req_lvl: 1,
  },
  'scribe witch scrolls': {
    source: SOURCE_ENUM.CLASS,
    req_lvl: 1,
  },
  'read witch scrolls': {
    source: SOURCE_ENUM.CLASS,
    req_lvl: 1,
  },
  backstab: {
    source: SOURCE_ENUM.CLASS,
    req_lvl: 1,
  },
  'steal spell': {
    source: SOURCE_ENUM.CLASS,
    req_lvl: 1,
  },
  'sense magick': {
    source: SOURCE_ENUM.CLASS,
    req_lvl: 2,
  },
  'see ethereal creatures': {
    source: SOURCE_ENUM.CLASS,
    req_lvl: 4,
  },
  'sense memorized spells': {
    source: SOURCE_ENUM.CLASS,
    req_lvl: 5,
  },
  'immune to level drain': {
    source: SOURCE_ENUM.CLASS,
    req_lvl: 7,
  },
  'drain magick': {
    source: SOURCE_ENUM.CLASS,
    req_lvl: 11,
  },
};
