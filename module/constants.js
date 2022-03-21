export const ATTRIBUTE_TYPES = ["String", "Number", "Boolean", "Formula", "Resource"];
export const SECONDS_IN_DAY = 86400;
export const SECONDS_IN_HOUR = 3600;
export const AC_MIN = 10;
export const SPELL_TYPES = {
  SPELL_CLERIC: "spell_cleric",
  SPELL_MAGIC: "spell_magic",
  SPELL_WITCH: "spell_witch"
};
export const MAX_SPELL_LEVELS = {
  [SPELL_TYPES.SPELL_CLERIC]: 5,
  [SPELL_TYPES.SPELL_MAGIC]: 9,
  [SPELL_TYPES.SPELL_WITCH]: 6
};
export const ATTITUDES = {
  HOSTILE: "hostile",
  DISMISSIVE: "dismissive",
  UNCERTAIN: "uncertain",
  ACCEPTING: "accepting",
  HELPFUL: "helpful"
};
export const ATTITUDE_SELL_ADJ = {
  [ATTITUDES.HOSTILE]: 1.3,
  [ATTITUDES.DISMISSIVE]: 1.1,
  [ATTITUDES.UNCERTAIN]: 1,
  [ATTITUDES.ACCEPTING]: 0.95,
  [ATTITUDES.HELPFUL]: 0.85
};
export const ATTITUDE_BUY_ADJ = {
  [ATTITUDES.HOSTILE]: 0.7,
  [ATTITUDES.DISMISSIVE]: 0.9,
  [ATTITUDES.UNCERTAIN]: 1,
  [ATTITUDES.ACCEPTING]: 1.05,
  [ATTITUDES.HELPFUL]: 1.15
};
export const FIGHTER_XP_PROGRESSION = [
  {xpRequired: 240000, updateData: {"data.level": 9, "data.bab": 9, "data.st": 9, "data.xp.max": 360000}},
  {xpRequired: 120000, updateData: {"data.level": 8, "data.bab": 8, "data.st": 9, "data.xp.max": 240000}},
  {xpRequired: 60000, updateData: {"data.level": 7, "data.bab": 7, "data.st": 10, "data.xp.max": 120000}},
  {xpRequired: 30000, updateData: {"data.level": 6, "data.bab": 6, "data.st": 11, "data.xp.max": 60000}},
  {xpRequired: 15000, updateData: {"data.level": 5, "data.bab": 5, "data.st": 11, "data.xp.max": 30000}},
  {xpRequired: 7000, updateData: {"data.level": 4, "data.bab": 4, "data.st": 12, "data.xp.max": 15000}},
  {xpRequired: 3000, updateData: {"data.level": 3, "data.bab": 3, "data.st": 13, "data.xp.max": 7000}},
  {xpRequired: 1000, updateData: {"data.level": 2, "data.bab": 2, "data.st": 13, "data.xp.max": 3000}},
  {xpRequired: 0, updateData: {"data.level": 1, "data.bab": 1, "data.st": 14, "data.xp.max": 1000}}
];
export const DMG_TYPES = ["blunt", "piercing", "slashing"];
export const SHIELD_TYPES = {
  large: {
    coverage: "chest,gut,neck,shoulder,upper arm,elbow,forearm,hand,groin,hip",
    material: "wood",
  },
  medium: {
    coverage: "chest,gut,elbow,forearm,hand",
    material: "wood",
  },
};
export const MATERIAL_WARMTH_WEIGHT = {
  wood: {
    weight:8,
    warmth:0,
  },
  linen: {
    weight:3,
    warmth:12,
  },
  wool: {
    weight:4,
    warmth:20,
  },
  silk: {
    weight:2,
    warmth:16,
  },
  fur: {
    weight:6,
    warmth:36,
  },
  padded: {
    weight:4,
    warmth:24,
  },
  leather: {
    weight:6,
    warmth:10,
  },
  brigandine: {
    weight:20,
    warmth:18,
  },
  chain: {
    weight:12,
    warmth:2,
  },
  "elven chain": {
    weight:6,
    warmth:1,
  },
  scale: {
    weight:24,
    warmth:12,
  },
  lamellar: {
    weight:22,
    warmth:14,
  },
  splint: {
    weight:18,
    warmth:16,
  },
  "banded mail": {
    weight:16,
    warmth:6,
  },
  "iron plate": {
    weight:20,
    warmth:10,
  },
  "steel plate": {
    weight:18,
    warmth:8,
  },
};
export const ARMOR_VS_DMG_TYPE = {
  none: {
    base_AC: 0,
    blunt: {
      ac:1,
      dr:0,
    },
    piercing: {
      ac:0,
      dr:0,
    },
    slashing: {
      ac:-1,
      dr:0,
    },
  },
  fur: {
    base_AC: 1,
    blunt: {
      ac:0,
      dr:1,
    },
    piercing: {
      ac:0,
      dr:0,
    },
    slashing: {
      ac:-1,
      dr:0,
    },
  },
  padded: {
    base_AC: 2,
    blunt: {
      ac:0,
      dr:1,
    },
    piercing: {
      ac:-2,
      dr:1,
    },
    slashing: {
      ac:0,
      dr:0,
    },
  },
  leather: {
    base_AC: 3,
    blunt: {
      ac:0,
      dr:1,
    },
    piercing: {
      ac:0,
      dr:0,
    },
    slashing: {
      ac:-1,
      dr:0,
    },
  },
  wood: {
    base_AC: 3,
    blunt: {
      ac:0,
      dr:0,
    },
    piercing: {
      ac:0,
      dr:0,
    },
    slashing: {
      ac:0,
      dr:0,
    },
  },
  brigandine: {
    base_AC: 4,
    blunt: {
      ac:2,
      dr:1,
    },
    piercing: {
      ac:1,
      dr:1,
    },
    slashing: {
      ac:0,
      dr:1,
    },
  },
  chain: {
    base_AC: 5,
    blunt: {
      ac:-1,
      dr:0,
    },
    piercing: {
      ac:1,
      dr:0,
    },
    slashing: {
      ac:1,
      dr:1,
    },
  },
  "elven chain": {
    base_AC: 5,
    blunt: {
      ac:-1,
      dr:0,
    },
    piercing: {
      ac:1,
      dr:0,
    },
    slashing: {
      ac:1,
      dr:1,
    },
  },
  scale: {
    base_AC: 6,
    blunt: {
      ac:0,
      dr:0,
    },
    piercing: {
      ac:0,
      dr:0,
    },
    slashing: {
      ac:-1,
      dr:0,
    },
  },
  lamellar: {
    base_AC: 7,
    blunt: {
      ac:0,
      dr:0,
    },
    piercing: {
      ac:1,
      dr:0,
    },
    slashing: {
      ac:0,
      dr:1,
    },
  },
  splint: {
    base_AC: 7,
    blunt: {
      ac:1,
      dr:0,
    },
    piercing: {
      ac:0,
      dr:0,
    },
    slashing: {
      ac:1,
      dr:0,
    },
  },
  "banded mail": {
    base_AC: 7,
    blunt: {
      ac:0,
      dr:0,
    },
    piercing: {
      ac:1,
      dr:0,
    },
    slashing: {
      ac:0,
      dr:1,
    },
  },
  "iron plate": {
    base_AC: 8,
    blunt: {
      ac: 0,
      dr: 0,
    },
    piercing: {
      ac: 1,
      dr: 0,
    },
    slashing: {
      ac: 1,
      dr: 1,
    },
  },
  "steel plate": {
    base_AC: 9,
    blunt: {
      ac: 1,
      dr: 0,
    },
    piercing: {
      ac: 2,
      dr: 1,
    },
    slashing: {
      ac: 1,
      dr: 1,
    },
  },
}
export const ATK_MODES = {
  "swing(b)": {
    ATK_ATTR: "str",
    DMG_ATTR: "str",
    HIT_SOUND: "bludgeon_hit",
    MISS_SOUND: "bludgeon_miss",
    DMG_TYPE: "blunt",
    ATK_TYPE: "melee",
    ATK_FORM: "swing",
  },
  "swing(s)": {
    ATK_ATTR: "str",
    DMG_ATTR: "str",
    HIT_SOUND: "cut_hit",
    MISS_SOUND: "cut_miss",
    DMG_TYPE: "slashing",
    ATK_TYPE: "melee",
    ATK_FORM: "swing",
  },
  "swing(p)": {
    ATK_ATTR: "str",
    DMG_ATTR: "str",
    HIT_SOUND: "hew_hit",
    MISS_SOUND: "hew_miss",
    DMG_TYPE: "piercing",
    ATK_TYPE: "melee",
    ATK_FORM: "swing",
  },
  "thrust(b)": {
    ATK_ATTR: "dex",
    DMG_ATTR: "str",
    HIT_SOUND: "bludgeon_hit",
    MISS_SOUND: "bludgeon_miss",
    DMG_TYPE: "blunt",
    ATK_TYPE: "melee",
    ATK_FORM: "thrust",
  },
  "thrust(s)": {
    ATK_ATTR: "dex",
    DMG_ATTR: "str",
    HIT_SOUND: "hew_hit",
    MISS_SOUND: "hew_miss",
    DMG_TYPE: "slashing",
    ATK_TYPE: "melee",
    ATK_FORM: "thrust",
  },
  "thrust(p)": {
    ATK_ATTR: "dex",
    DMG_ATTR: "str",
    HIT_SOUND: "thrust_hit",
    MISS_SOUND: "thrust_miss",
    DMG_TYPE: "piercing",
    ATK_TYPE: "melee",
    ATK_FORM: "thrust",
  },
  "shoot(b)": {
    ATK_ATTR: "dex",
    DMG_ATTR: undefined,
    HIT_SOUND: "slingstone_hit",
    MISS_SOUND: "slingstone_miss",
    DMG_TYPE: "blunt",
    ATK_TYPE: "missile",
    ATK_FORM: "shoot",
  },
  "shoot(s)": {
    ATK_ATTR: "dex",
    DMG_ATTR: undefined,
    HIT_SOUND: "arrow_hit",
    MISS_SOUND: "arrow_miss",
    DMG_TYPE: "slashing",
    ATK_TYPE: "missile",
    ATK_FORM: "shoot",
  },
  "shoot(p)": {
    ATK_ATTR: "dex",
    DMG_ATTR: undefined,
    HIT_SOUND: "bolt_hit",
    MISS_SOUND: "bolt_miss",
    DMG_TYPE: "piercing",
    ATK_TYPE: "missile",
    ATK_FORM: "shoot",
  },
  "throw(b)": {
    ATK_ATTR: "dex",
    DMG_ATTR: "str",
    HIT_SOUND: "throw_hit",
    MISS_SOUND: "throw_miss",
    DMG_TYPE: "blunt",
    ATK_TYPE: "missile",
    ATK_FORM: "throw",
  },
  "throw(s)": {
    ATK_ATTR: "dex",
    DMG_ATTR: "str",
    HIT_SOUND: "throw_hit",
    MISS_SOUND: "throw_miss",
    DMG_TYPE: "slashing",
    ATK_TYPE: "missile",
    ATK_FORM: "throw",
  },
  "throw(p)": {
    ATK_ATTR: "dex",
    DMG_ATTR: "str",
    HIT_SOUND: "throw_hit",
    MISS_SOUND: "throw_miss",
    DMG_TYPE: "piercing",
    ATK_TYPE: "missile",
    ATK_FORM: "throw",
  },
};
export const VOICE_MOODS = {
  AMUSED: "amused",
  ANGRY: "angry",
  BORED: "bored",
  DEATH: "death",
  DYING: "dying",
  HURT: "hurt",
  KILL: "kill",
  LEAD: "lead",
  OK: "ok",
  PARTY_DEATH: "party_death",
  PARTY_FAIL: "party_fail",
  RETREAT: "retreat",
  SLEEPY: "sleepy",
  TOOT: "toot",
  WHAT: "what"
};
export const VOICE_MOOD_ICONS = {
  [VOICE_MOODS.AMUSED]: "https://img.icons8.com/external-wanicon-lineal-wanicon/50/000000/external-laughing-emoji-wanicon-lineal-wanicon.png",
  [VOICE_MOODS.ANGRY]: "https://img.icons8.com/ios/50/000000/battle.png",
  [VOICE_MOODS.BORED]: "https://img.icons8.com/ios/50/000000/bored.png",
  [VOICE_MOODS.DEATH]: "https://img.icons8.com/ios/50/000000/dying.png",
  [VOICE_MOODS.DYING]: "https://img.icons8.com/ios/50/000000/wound.png",
  [VOICE_MOODS.HURT]: "https://img.icons8.com/ios/50/000000/action.png",
  [VOICE_MOODS.KILL]:"https://img.icons8.com/ios/50/000000/murder.png",
  [VOICE_MOODS.LEAD]: "https://img.icons8.com/ios/50/000000/leadership.png",
  [VOICE_MOODS.OK]: "https://img.icons8.com/ios/50/000000/easy.png",
  [VOICE_MOODS.PARTY_DEATH]: "https://img.icons8.com/external-prettycons-lineal-prettycons/50/000000/external-rip-holidays-prettycons-lineal-prettycons.png",
  [VOICE_MOODS.PARTY_FAIL]: "https://img.icons8.com/ios/50/000000/facepalm.png",
  [VOICE_MOODS.RETREAT]: "https://img.icons8.com/ios/50/000000/running-rabbit.png",
  [VOICE_MOODS.SLEEPY]: "https://img.icons8.com/external-tulpahn-detailed-outline-tulpahn/50/000000/external-sleepy-heart-feeling-tulpahn-detailed-outline-tulpahn.png",
  [VOICE_MOODS.TOOT]: "https://img.icons8.com/ios-glyphs/50/000000/air-element--v1.png",
  [VOICE_MOODS.WHAT]: "https://img.icons8.com/ios/50/000000/question-mark--v1.png"
};
const VOICE_PROFILES = [
  "F_Barb", 
  "F_Bard", 
  "F_Drow", 
  "F_Fgt01", 
  "F_Fgt02",
  "F_Fgt03",
  "F_Fgt04",
  "F_Fgt05",
  "F_HOrc1",
  "F_HoW1",
  "F_HoW2",
  "F_HoW3",
  "F_Mage1",
  "F_Mage2",
  "F_Mage3",
  "F_Mage4",
  "F_Mage5",
  "F_Sorc1",
  "F_Thief1",
  "F_Thief2",
  "M_Barb",
  "M_Bard",
  "M_Drow",
  "M_Fgt01",
  "M_Fgt02",
  "M_Fgt03",
  "M_Fgt04",
  "M_Fgt05",
  "M_HOrc1",
  "M_HoW1",
  "M_HoW2",
  "M_HoW3",
  "M_Mage1",
  "M_Mage2",
  "M_Mage3",
  "M_Mage4",
  "M_Mage5",
  "M_Monk1",
  "M_Sorc1",
  "MThief1",
  "MThief2"
];
export const VOICE_SOUNDS = new Map();
// populate voice sounds on startup
(async function() {
  for (const voice of VOICE_PROFILES) {
    const moodMap = new Map();
    const response = await fetch(`systems/lostlands/sounds/${voice}/DirContents.txt/`);
    const fileList = await response.text();
    const fileArr = fileList.replace(/DirContents.txt[\s\S]?/,'').split(/\n/).filter(item => item);
    for (const mood of Object.values(VOICE_MOODS)) {
      const pathArr = fileArr.filter(f => new RegExp(`\^${mood}_\\d+.mp3`).test(f)).map(f => `systems/lostlands/sounds/${voice}/${f}`);
      moodMap.set(`${mood}`, pathArr);
    }
    VOICE_SOUNDS.set(`${voice}`, moodMap);
  }
  console.log('Completed loading voice sound file paths', VOICE_SOUNDS);
})();


// weights listed in order: swing, thrust, swing_high, thrust_high, swing_low, thrust_low
export const HIT_LOCATIONS = {
  foot: {
    weights: [2,4,0,2,8,8],
    bilateral: true
  },
  shin: {
    weights: [8,6,2,2,16,12],
    bilateral: true
  },
  knee: {
    weights: [8,6,4,2,16,12],
    bilateral: true
  },
  thigh: {
    weights: [10,14,4,6,16,18],
    bilateral: true
  },
  hip: {
    weights: [6,4,4,2,10,6],
    bilateral: true
  },
  groin: {
    weights: [2,6,1,2,4,8],
  },
  gut: {
    weights: [8,16,3,8,12,18],
  },
  chest: {
    weights: [4,10,6,16,2,5],
  },
  shoulder: {
    weights: [8,6,12,12,2,2],
    bilateral: true
  },
  "upper arm": {
    weights: [6,4,10,8,2,2],
    bilateral: true
  },
  elbow: {
    weights: [8,4,10,6,2,2],
    bilateral: true
  },
  forearm: {
    weights: [8,4,8,4,4,2],
    bilateral: true
  },
  hand: {
    weights: [6,4,6,4,2,2],
    bilateral: true
  },
  neck: {
    weights: [4,3,6,8,1,1]
  },
  face: {
    weights: [3,4,4,8,1,1]
  },
  eye: {
    weights: [1,2,2,4,0,0],
    bilateral: true
  },
  skull: {
    weights: [8,3,18,6,2,1],
  },
};

// populate hit location arrays on startup
export const HIT_LOC_ARRS = {
  SWING: [],
  THRUST: [],
  SWING_HIGH: [],
  THRUST_HIGH: [],
  SWING_LOW: [],
  THRUST_LOW: []
};
(async function() {
  const fillLocArr = function (loc, weight, bi) {
    const arr = [];
    for (let i = 0; i < weight; i++) {
      const entry = bi ? i < weight / 2 ? `left ${loc}`: `right ${loc}` : loc;
      arr.push(entry);
    }
    return arr;
  };
  for (const [k, v] of Object.entries(HIT_LOCATIONS)) {

    ["SWING", "THRUST", "SWING_HIGH", "THRUST_HIGH", "SWING_LOW", "THRUST_LOW"].forEach((arr, i) => {
      HIT_LOC_ARRS[arr] = HIT_LOC_ARRS[arr].concat(fillLocArr(k, v.weights[i], v.bilateral));
    });
  }
  console.log('Completed loading hit locations', HIT_LOC_ARRS);
})();

export const SIZE_VALUES = {
  T: 0, // tiny
  S: 1, // small
  M: 2, // medium
  L: 3, // large
  H: 4, // huge
  G: 5, // gargantuan
};

export const WEAPON_PROFICIENCY_CATEGORIES = [
  "axes",
  "bludgeons",
  "bows",
  "crossbows",
  "curved swords",
  "daggers",
  "hammers",
  "large swords",
  "piercing swords",
  "polearms",
  "spears",
  "spiked bludgeons",
  "staves",
  "straight swords",
  "whip/sling",
];
