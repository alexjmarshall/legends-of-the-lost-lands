export const ATTRIBUTE_TYPES = ["String", "Number", "Boolean", "Formula", "Resource"];
export const AC_MIN = 9;
export const DEFAULT_REST_DICE = 'd3';
export const REST_TYPES = {
  "d3": "Peasant",
  "d4": "Merchant",
  "d6": "Noble",
  "d8": "Royal",
};
export const SECONDS_IN_DAY = 86400;
export const SECONDS_IN_HOUR = 3600;
export const REQ_CLO_BY_SEASON = {
  "summer": 1,
  "fall": 2,
  "spring": 2,
  "winter": 3
};
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
export const DMG_TYPES = {
  "arrow": {
    ATK_TYPE: "missile",
    HIT_SOUND: "arrow_hit",
    MISS_SOUND: "arrow_miss",
    VS_AC_MODS: {
      "none": 0,
      "leather": 2,
      "chain": 0,
      "plate": -2
    }
  },
  "attack": {
    ATK_TYPE: "melee",
    HIT_SOUND: undefined,
    MISS_SOUND: undefined,
    VS_AC_MODS: {
      "none": 0,
      "leather": 0,
      "chain": 0,
      "plate": 0
    }
  },
  "bludgeon": {
    ATK_TYPE: "melee",
    HIT_SOUND: "bludgeon_hit",
    MISS_SOUND: "bludgeon_miss",
    VS_AC_MODS: {
      "none": 0,
      "leather": 0,
      "chain": 2,
      "plate": 4
    }
  },
  "bolt": {
    ATK_TYPE: "missile",
    HIT_SOUND: "bolt_hit",
    MISS_SOUND: "bolt_miss",
    VS_AC_MODS: {
      "none": 0,
      "leather": 0,
      "chain": 2,
      "plate": 0
    }
  },
  "cut": {
    ATK_TYPE: "melee",
    HIT_SOUND: "cut_hit",
    MISS_SOUND: "cut_miss",
    VS_AC_MODS: {
      "none": 2,
      "leather": 0,
      "chain": -2,
      "plate": -4
    }
  },
  "grapple": {
    ATK_TYPE: "touch",
    HIT_SOUND: undefined,
    MISS_SOUND: undefined,
    VS_AC_MODS: {
      "none": -2,
      "leather": 0,
      "chain": 0,
      "plate": 2
    }
  },
  "hew": {
    ATK_TYPE: "melee",
    HIT_SOUND: "hew_hit",
    MISS_SOUND: "hew_miss",
    VS_AC_MODS: {
      "none": 0,
      "leather": 2,
      "chain": 0,
      "plate": -2
    }
  },
  "hook": {
    ATK_TYPE: "touch",
    HIT_SOUND: undefined,
    MISS_SOUND: undefined,
    VS_AC_MODS: {
      "none": -2,
      "leather": 0,
      "chain": 0,
      "plate": 2
    }
  },
  "punch": {
    ATK_TYPE: "melee",
    HIT_SOUND: undefined,
    MISS_SOUND: undefined,
    VS_AC_MODS: {
      "none": 2,
      "leather": 0,
      "chain": 0,
      "plate": -2
    }
  },
  "slingstone": {
    ATK_TYPE: "missile",
    HIT_SOUND: "slingstone_hit",
    MISS_SOUND: "slingstone_miss",
    VS_AC_MODS: {
      "none": 0,
      "leather": 0,
      "chain": 2,
      "plate": 4
    }
  },
  "throw": {
    ATK_TYPE: "missile",
    HIT_SOUND: "throw_hit",
    MISS_SOUND: "throw_miss",
    VS_AC_MODS: {
      "none": 2,
      "leather": 0,
      "chain": 0,
      "plate": -2
    }
  },
  "thrust": {
    ATK_TYPE: "melee",
    HIT_SOUND: "thrust_hit",
    MISS_SOUND: "thrust_miss",
    VS_AC_MODS: {
      "none": -2,
      "leather": 0,
      "chain": 2,
      "plate": 0
    }
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
