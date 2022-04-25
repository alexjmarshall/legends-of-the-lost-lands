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
    coverage: {
      high:"neck,shoulder,chest,arm pit,upper arm,elbow,forearm,hand,gut",
      mid:"chest,arm pit,upper arm,elbow,forearm,hand,gut,groin,hip",
      low:"elbow,forearm,hand,gut,groin,hip,thigh,knee",
    },
  },
  medium: {
    coverage: {
      high:"neck,arm pit,upper arm,chest,forearm,hand",
      mid:"chest,gut,elbow,forearm,hand",
      low:"elbow,forearm,hand,gut,groin,hip",
    },
  },
};
export const MATERIAL_PROPS = {
  wood: {
    weight:8,
    warmth:0,
    sp_value:10,
  },
  burlap: {
    weight:2,
    warmth:5,
    sp_value:0.5,
  },
  linen: {
    weight:1,
    warmth:8,
    sp_value:5,
  },
  wool: {
    weight:2,
    warmth:20,
    sp_value:12,
  },
  silk: {
    weight:0.5,
    warmth:14,
    sp_value:90,
  },
  fur: {
    weight:3,
    warmth:36,
    sp_value:50,
  },
  padded: {
    weight:4,
    warmth:20,
    sp_value:16,
    metal:false,
    bulky:false,
  },
  leather: {
    weight:6,
    warmth:10,
    sp_value:20,
    metal:false,
    bulky:true,
  },
  brigandine: {
    weight:18,
    warmth:16,
    sp_value:100,
    metal:true,
    bulky:true,
  },
  scale: {
    weight:22,
    warmth:14,
    sp_value:80,
    metal:true,
    bulky:false,
  },
  chain: {
    weight:12,
    warmth:2,
    sp_value:150,
    metal:true,
    bulky:false,
  },
  "elven chain": {
    weight:6,
    warmth:1,
    metal:true,
    bulky:false,
  },
  "banded mail": {
    weight:15,
    warmth:4,
    sp_value:200,
    metal:true,
    bulky:false,
  },
  lamellar: {
    weight:20,
    warmth:12,
    sp_value:120,
    metal:true,
    bulky:true,
  },
  splint: {
    weight:16,
    warmth:14,
    sp_value:160,
    metal:true,
    bulky:true,
  },
  "iron plate": {
    weight:18,
    warmth:10,
    sp_value:400,
    metal:true,
    bulky:true,
  },
  "steel plate": {
    weight:18,
    warmth:8,
    sp_value:1000,
    metal:true,
    bulky:true,
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
      ac:1,
      dr:0,
    },
    slashing: {
      ac:0,
      dr:0,
    },
  },
  wood: {
    base_AC: 3,
    blunt: {
      ac:0,
      dr:1,
    },
    piercing: {
      ac:0,
      dr:1,
    },
    slashing: {
      ac:0,
      dr:1,
    },
  },
  scale: {
    base_AC: 4,
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
      dr:1,
    },
  },
  brigandine: {
    base_AC: 4,
    blunt: {
      ac:0,
      dr:1,
    },
    piercing: {
      ac:1,
      dr:1,
    },
    slashing: {
      ac:2,
      dr:1,
    },
  },
  chain: {
    base_AC: 5,
    blunt: {
      ac:-2,
      dr:0,
    },
    piercing: {
      ac:0,
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
      ac:-2,
      dr:0,
    },
    piercing: {
      ac:0,
      dr:0,
    },
    slashing: {
      ac:1,
      dr:1,
    },
  },
  "banded mail": {
    base_AC: 6,
    blunt: {
      ac:-1,
      dr:0,
    },
    piercing: {
      ac:0,
      dr:0,
    },
    slashing: {
      ac:1,
      dr:1,
    },
  },
  lamellar: {
    base_AC: 7,
    blunt: {
      ac:-1,
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
  splint: {
    base_AC: 7,
    blunt: {
      ac:0,
      dr:1,
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
  "iron plate": {
    base_AC: 8,
    blunt: {
      ac: 0,
      dr: 1,
    },
    piercing: {
      ac: 1,
      dr: 0,
    },
    slashing: {
      ac: 1,
      dr: 2,
    },
  },
  "steel plate": {
    base_AC: 9,
    blunt: {
      ac: 1,
      dr: 1,
    },
    piercing: {
      ac: 3,
      dr: 0,
    },
    slashing: {
      ac: 2,
      dr: 2,
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

export const CURRENCY_RATIOS = {
  cps_per_sp: 12,
  cps_per_gp: 240,
};

export const LIMB_GROUPS = {
  "lower leg": ["foot","shin"],
  "leg": ["foot","shin","knee","thigh"],
  "forearm": ["hand","forearm"],
  "arm": ["hand","forearm","elbow","upper arm"],
};

export const minorBleedDesc = ' and blood streams from the wound';
export const majorBleedDesc = ' and blood spurts from the wound!';
export const internalBleedDesc = ' and the wound bleeds internally';
export const bowelBleedDesc = ' and dark blood oozes from the wound';
export const bleedDescs = [minorBleedDesc,majorBleedDesc,internalBleedDesc,bowelBleedDesc];
export const compoundFractureDesc = ' and the bones poke through the skin';
export const weaponStuckDesc = ' and the weapon is stuck';
export const knockdownDesc = ' and knocks them down';
export const knockoutDesc = ' and knocks them out';
export const knockbackDesc = ' and the blow sends them flying';
export const knockDescs = [knockdownDesc,knockoutDesc,knockbackDesc];

// weights listed in order: swing, thrust, swing_high, thrust_high, swing_low, thrust_low
export const HIT_LOCATIONS = {
  foot: {
    weights: [2,2,0,0,8,8],
    bilateral: true,
    injury: {
      blunt: {
        light: {
          text: ' and breaks a toe',
        },
        serious: {
          text: ' and breaks the ankle',
        },
        critical: {
          text: ' and crushes the foot into red pulp',
          removal: true,
        },
      },
      piercing: {
        light: {
          text: ' and splits the foot',
        },
        serious: {
          text: ' and cuts a nerve',
        },
        critical: {
          text: ' and splits the ankle and tears a ligament',
        },
      },
      slashing: {
        light: {
          text: ' and severs the tendons on top of the foot',
        },
        serious: {
          text: ' and severs the Achilles tendon',
        },
        critical: {
          text: ' and severs the foot',
          removal: true,
          bleeding: "minor",
        },
      }
    },
  },
  shin: {
    weights: [8,4,0,0,16,12],
    bilateral: true,
    injury: {
      blunt: {
        light: {
          text: ' and cracks the tibia',
        },
        serious: {
          text: ' and snaps the fibula',
        },
        critical: {
          text: ' and shatters the lower leg',
          dmgEffect: compoundFractureDesc,
        },
      },
      piercing: {
        light: {
          text: ' and splits the calf',
        },
        serious: {
          text: ' and cuts a nerve',
        },
        critical: {
          text: ' and splits the calf and nicks an artery',
          dmgEffect: minorBleedDesc,
        },
      },
      slashing: {
        light: {
          text: ' and lacerates the calf',
        },
        serious: {
          text: ' and cuts a nerve',
        },
        critical: {
          text: ' and splits the calf to the bone',
          dmgEffect: minorBleedDesc,
        },
        gruesome: {
          text: ' and severs the leg mid-shin',
          dmgEffect: majorBleedDesc,
          removal: true,
        },
      }
    },
  },
  knee: {
    weights: [8,4,4,0,16,12],
    bilateral: true,
    injury: {
      blunt: {
        light: {
          text: ' and cracks the kneecap',
        },
        serious: {
          text: ' and dislocates the joint',
        },
        critical: {
          text: ' and shatters the kneecap and dislocates the joint',
        },
      },
      piercing: {
        light: {
          text: ' and chips the kneecap',
        },
        serious: {
          text: ' and splits the joint and tears a ligament',
        },
        critical: {
          text: ' and nicks an artery',
          dmgEffect: minorBleedDesc,
        },
      },
      slashing: {
        light: {
          text: ' and severs the tendon below the knee',
        },
        serious: {
          text: ' and splits the joint and tears a ligament',
        },
        critical: {
          text: ` and lops off the lower leg`,
          removal: true,
          dmgEffect: majorBleedDesc,
        },
      },
    },
  },
  thigh: {
    weights: [10,14,4,6,16,18],
    bilateral: true,
    injury: {
      blunt: {
        light: {
          text: ' and cracks the femur',
        },
        serious: {
          text: ' and snaps the femur',
        },
        critical: {
          text: ' and shatters the femur',
          dmgEffect: compoundFractureDesc,
        },
      },
      piercing: {
        light: {
          text: ' and penetrates the muscle',
        },
        serious: {
          text: ' and cuts a nerve',
        },
        critical: {
          text: ' and penetrates the muscle and nicks an artery',
          dmgEffect: majorBleedDesc,
        },
      },
      slashing: {
        light: {
          text: ' and lacerates the muscle',
        },
        serious: {
          text: ' and severs the tendon above the knee',
        },
        critical: {
          text: ' and splits the thigh to the bone',
          dmgEffect: majorBleedDesc,
        },
        gruesome: {
          text: ' and severs the leg mid-thigh',
          dmgEffect: majorBleedDesc,
          removal: true,
        },
      }
    },
  },
  hip: {
    weights: [6,4,2,0,10,6],
    bilateral: true,
    injury: {
      blunt: {
        light: {
          text: ' and cracks the pelvis',
        },
        serious: {
          text: ' and breaks the hip',
        },
        critical: {
          text: ' and shatters the hip',
          dmgEffect: internalBleedDesc,
        },
        gruesome: {
          text: ' and shatters the pelvis',
          dmgEffect: internalBleedDesc,
        },
      },
      piercing: {
        light: {
          text: ' and pierces the buttock',
        },
        serious: {
          text: ' and cuts a nerve',
        },
        critical: {
          text: ' and splits the joint and tears a ligament',
        },
        gruesome: {
          text: ' and splits the joint and nicks an artery',
          dmgEffect: majorBleedDesc,
        },
      },
      slashing: {
        light: {
          text: ' and lacerates the buttock',
        },
        serious: {
          text: ' and cuts a nerve',
        },
        critical: {
          text: ' and splits the joint and tears a ligament',
          dmgEffect: minorBleedDesc,
        },
        gruesome: {
          text: ' and lops off the leg',
          dmgEffect: majorBleedDesc,
          removal: true,
        },
      },
    },
  },
  groin: {
    weights: [2,6,0,0,4,8],
    injury: {
      blunt: {
        light: {
          text: ' and bruises the genitals',
        },
        serious: {
          text: ' and cracks the pubic bone',
        },
        critical: {
          text: ' and shatters the pubic bone',
          dmgEffect: internalBleedDesc,
        },
      },
      piercing: {
        light: {
          text: ' and lacerates the genitals',
        },
        serious: {
          text: ' and penetrates the inner thigh and tears a ligament',
        },
        critical: {
          text: ' and penetrates the inner thigh and nicks an artery',
          dmgEffect: majorBleedDesc,
        },
      },
      slashing: {
        light: {
          text: ' and lacerates the genitals',
        },
        serious: {
          text: ' and severs the genitals',
          dmgEffect: minorBleedDesc,
        },
        critical: {
          text: ' and severs the genitals and splits the inner thigh to the bone',
          dmgEffect: majorBleedDesc,
        },
      },
    },
  },
  gut: {
    weights: [8,16,4,8,12,17],
    injury: {
      blunt: {
        light: {
          text: ' and bruises the spine',
        },
        serious: {
          text: ' and snaps the ribs',
        },
        critical: {
          text: ' and crushes the ribs into the liver',
          dmgEffect: internalBleedDesc,
        },
        gruesome: {
          text: ' and snaps the spine',
          fatal: true,
          dmgEffect: knockbackDesc,
        },
      },
      piercing: {
        light: {
          text: ' and penetrates the abdomen',
        },
        serious: {
          text: ' and penetrates the bowels',
          dmgEffect: bowelBleedDesc,
        },
        critical: {
          text: ' and penetrates the bowels and nicks an artery',
          fatal: true,
          dmgEffect: internalBleedDesc,
        },
        gruesome: {
          text: ' and penetrates the bowels and severs the spine',
          fatal: true,
          dmgEffect: weaponStuckDesc,
        },
      },
      slashing: {
        light: {
          text: ' and lacerates the abdomen',
        },
        serious: {
          text: ' and lacerates the bowels',
          dmgEffect: bowelBleedDesc,
        },
        critical: {
          text: ' and disembowels them',
          fatal: true,
          dmgEffect: bowelBleedDesc,
        },
        gruesome: {
          text: ' and cleaves the body in two spattering chunks of gore',
          fatal: true,
          removal: true,
        },
      },
    },
  },
  chest: {
    weights: [4,10,6,15,2,4],
    injury: {
      blunt: {
        light: {
          text: ' and cracks a rib',
        },
        serious: {
          text: ' and snaps the ribs',
        },
        critical: {
          text: ' and caves in the sternum',
          dmgEffect: internalBleedDesc,
        },
      },
      piercing: {
        light: {
          text: ' and chips the sternum',
        },
        serious: {
          text: ' and punctures a lung',
          dmgEffect: internalBleedDesc,
        },
        critical: {
          text: ' and pierces the heart',
          fatal: true,
        },
      },
      slashing: {
        light: {
          text: ' and lacerates the chest',
        },
        serious: {
          text: ' and cleaves through the ribs',
          dmgEffect: minorBleedDesc,
        },
        critical: {
          text: ' and cleaves through the ribs and lacerates a lung',
          dmgEffect: internalBleedDesc,
        },
      },
    },
  },
  shoulder: {
    weights: [8,6,12,12,2,2],
    bilateral: true,
    injury: {
      blunt: {
        light: {
          text: ' and dislocates the joint',
        },
        serious: {
          text: ' and snaps the collarbone',
        },
        critical: {
          text: ' and shatters the collarbone',
          dmgEffect: internalBleedDesc,
        },
      },
      piercing: {
        light: {
          text: ' and splits the joint',
        },
        serious: {
          text: ' and cuts a nerve',
        },
        critical: {
          text: ' and splits the joint and tears a ligament',
        },
      },
      slashing: {
        light: {
          text: ' and lacerates the deltoid',
        },
        serious: {
          text: ' and cleaves through the collarbone',
          dmgEffect: minorBleedDesc,
        },
        critical: {
          text: ' and lops off the arm',
          dmgEffect: majorBleedDesc,
          removal: true,
        },
      },
    },
  },
  armpit: {
    weights: [2,6,4,12,0,2],
    bilateral: true,
    injury: {
      blunt: {
        light: {
          text: ' and dislocates the shoulder',
        },
        serious: {
          text: ' and snaps the humerus',
        },
        critical: {
          text: ' and shatters the humerus',
          dmgEffect: compoundFractureDesc,
        },
      },
      piercing: {
        light: {
          text: ' and splits the shoulder',
        },
        serious: {
          text: ' and splits the shoulder and tears a ligament',
        },
        critical: {
          text: ' and nicks an artery',
          dmgEffect: majorBleedDesc,
        },
      },
      slashing: {
        light: {
          text: ' and lacerates the inner arm',
        },
        serious: {
          text: ' and cuts a nerve',
        },
        critical: {
          text: ' and splits the shoulder and tears a ligament',
          dmgEffect: minorBleedDesc,
        },
      }
    },
  },
  "upper arm": {
    weights: [6,4,10,8,2,2],
    bilateral: true,
    injury: {
      blunt: {
        light: {
          text: ' and cracks the humerus',
        },
        serious: {
          text: ' and snaps the humerus',
        },
        critical: {
          text: ' and shatters the humerus',
          dmgEffect: compoundFractureDesc,
        },
      },
      piercing: {
        light: {
          text: ' and splits the biceps',
        },
        serious: {
          text: ' and cuts a nerve',
        },
        critical: {
          text: ' nicks an artery',
          dmgEffect: majorBleedDesc,
        },
      },
      slashing: {
        light: {
          text: ' and lacerates the biceps',
        },
        serious: {
          text: ' and cuts a nerve',
        },
        critical: {
          text: ' and severs the biceps',
          dmgEffect: majorBleedDesc,
        },
        gruesome: {
          text: ' and severs the upper arm',
          dmgEffect: majorBleedDesc,
          removal: true,
        },
      }
    },
  },
  elbow: {
    weights: [8,4,10,6,2,2],
    bilateral: true,
    injury: {
      blunt: {
        light: {
          text: ' and dislocates the joint',
        },
        serious: {
          text: ' and breaks the joint',
        },
        critical: {
          text: ' and shatters and dislocates the joint',
        },
      },
      piercing: {
        light: {
          text: ' and chips a bone',
        },
        serious: {
          text: ' and splits the joint and tears a ligament',
        },
        critical: {
          text: ' and nicks an artery',
          dmgEffect: minorBleedDesc,
        },
      },
      slashing: {
        light: {
          text: ' and severs the biceps tendon',
        },
        serious: {
          text: ' and splits the joint and tears a ligament',
        },
        critical: {
          text: ` and lops off the forearm`,
          removal: true,
          dmgEffect: majorBleedDesc,
        },
      },
    },
  },
  forearm: {
    weights: [8,4,8,4,4,2],
    bilateral: true,
    injury: {
      blunt: {
        light: {
          text: ' and cracks the radial bone',
        },
        serious: {
          text: ' and snaps the ulnar bone',
        },
        critical: {
          text: ' and shatters the forearm',
          dmgEffect: compoundFractureDesc,
        },
      },
      piercing: {
        light: {
          text: ' and penetrates the muscle',
        },
        serious: {
          text: ' and cuts a nerve',
        },
        critical: {
          text: ' and penetrates the muscle and nicks an artery',
          dmgEffect: minorBleedDesc,
        },
      },
      slashing: {
        light: {
          text: ' and lacerates the forearm',
        },
        serious: {
          text: ' and cuts a nerve',
          dmgEffect: minorBleedDesc,
        },
        critical: {
          text: ' and cleaves through the ulnar bone',
          dmgEffect: minorBleedDesc,
        },
        gruesome: {
          text: ' and severs the forearm',
          dmgEffect: majorBleedDesc,
          removal: true,
        },
      }
    },
  },
  hand: {
    weights: [6,4,6,4,2,2],
    bilateral: true,
    injury: {
      blunt: {
        light: {
          text: ' and breaks a finger',
        },
        serious: {
          text: ' and breaks the wrist',
        },
        critical: {
          text: ' and crushes the hand into red pulp',
          removal: true,
        },
      },
      piercing: {
        light: {
          text: ' and splits the hand',
        },
        serious: {
          text: ' and cuts a nerve',
        },
        critical: {
          text: ' and splits the wrist and tears a ligament',
        },
      },
      slashing: {
        light: {
          text: ' and severs the tendons on top of the hand',
        },
        serious: {
          text: ' and severs a finger',
        },
        critical: {
          text: ' and severs the hand',
          removal: true,
          dmgEffect: minorBleedDesc,
        },
      }
    },
  },
  neck: {
    weights: [4,3,6,7,1,1],
    injury: {
      blunt: {
        light: {
          text: ' and crushes the larynx',
        },
        serious: {
          text: ' and fractures a vertebra',
        },
        critical: {
          text: ' and snaps the neck',
          fatal: true,
        },
      },
      piercing: {
        light: {
          text: ' and pierces the larynx',
        },
        serious: {
          text: ' and cuts a nerve',
        },
        critical: {
          text: ' and nicks the jugular vein',
          dmgEffect: majorBleedDesc,
        },
      },
      slashing: {
        light: {
          text: ' and lacerates the larynx',
        },
        serious: {
          text: ' and cuts a nerve',
          dmgEffect: minorBleedDesc,
        },
        critical: {
          text: ' and lops off the head',
          fatal: true,
          dmgEffect: majorBleedDesc,
          removal: true,
        },
      }
    },
  },
  face: {
    weights: [2,4,4,8,1,1],
    injury: {
      blunt: {
        light: {
          text: ' and breaks the nose',
        },
        serious: {
          text: ' and breaks the jaw',
        },
        critical: {
          text: ' and caves in the face and crushes the brain',
          fatal: true,
        },
        gruesome: {
          text: ' and shatters the skull spattering chunks of gore',
          fatal: true,
          removal: true,
        },
      },
      piercing: {
        light: {
          text: ' and gouges the cheek',
          dmgEffect: minorBleedDesc,
        },
        serious: {
          text: ' and breaks the teeth',
        },
        critical: {
          text: ' and penetrates the face and pierces the brain',
          fatal: true,
        },
        gruesome: {
          text: ' and penetrates the brain and penetrates the back of the skull',
          fatal: true,
          dmgEffect: weaponStuckDesc,
        },
      },
      slashing: {
        light: {
          text: ' and severs the nose',
          dmgEffect: minorBleedDesc,
        },
        serious: {
          text: ' and splits the jaw',
          dmgEffect: minorBleedDesc,
        },
        critical: {
          text: ' and splits the face and cleaves the brain',
          fatal: true,
        },
        gruesome: {
          text: ' and cleaves the head in two spattering chunks of gore',
          fatal: true,
          removal: true,
        },
      },
    },
  },
  eye: {
    weights: [0,2,2,4,0,0],
    bilateral: true,
    injury: {
      blunt: {
        light: {
          text: ' and cracks the eye socket',
        },
        serious: {
          text: ' and shatters the eye socket',
          dmgEffect: knockoutDesc,
        },
        critical: {
          text: ' and smashes the brow into the brain',
          fatal: true,
        },
        gruesome: {
          text: ' and shatters the skull spattering chunks of gore',
          fatal: true,
          removal: true,
        },
      },
      piercing: {
        light: {
          text: ' and lacerates the brow',
          dmgEffect: minorBleedDesc,
        },
        serious: {
          text: ' and gouges out the eye',
          dmgEffect: minorBleedDesc,
        },
        critical: {
          text: ' and penetrates the eye and pierces the brain',
          fatal: true,
        },
        gruesome: {
          text: ' and penetrates the brain and penetrates the back of the skull',
          fatal: true,
          dmgEffect: weaponStuckDesc,
        },
      },
      slashing: {
        light: {
          text: ' and lacerates the brow',
          dmgEffect: minorBleedDesc,
        },
        serious: {
          text: ' and eviscerates the eye',
          dmgEffect: minorBleedDesc,
        },
        critical: {
          text: ' and splits the brow and cleaves the brain',
          fatal: true,
        },
        gruesome: {
          text: ' and cleaves the head in two spattering chunks of gore',
          fatal: true,
          removal: true,
        },
      }
    },
  },
  skull: {
    weights: [8,3,18,6,2,1],
    injury: {
      blunt: {
        light: {
          text: ' and bruises the brain',
          dmgEffect: knockoutDesc,
        },
        serious: {
          text: ' and cracks the skull',
          dmgEffect: knockoutDesc,
        },
        critical: {
          text: ' and crushes the skull into the brain',
          fatal: true,
        },
        gruesome: {
          text: ' and shatters the skull spattering chunks of gore',
          fatal: true,
          removal: true,
        },
      },
      piercing: {
        light: {
          text: ' and lacerates the scalp',
          dmgEffect: minorBleedDesc,
        },
        serious: {
          text: ' and cracks the skull',
        },
        critical: {
          text: ' and penetrates the skull and pierces the brain',
          fatal: true,
        },
        gruesome: {
          text: ' and penetrates the brain and penetrates the back of the skull',
          fatal: true,
          dmgEffect: weaponStuckDesc,
        },
      },
      slashing: {
        light: {
          text: ' and lacerates the scalp',
          dmgEffect: minorBleedDesc,
        },
        serious: {
          text: ' and severs an ear',
          dmgEffect: minorBleedDesc,
        },
        critical: {
          text: ' and splits the skull and cleaves the brain',
          fatal: true,
        },
        gruesome: {
          text: ' and cleaves the head in two spattering chunks of gore',
          fatal: true,
          removal: true,
        },
      },
    },
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
