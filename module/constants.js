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
  round: {
    L: {
      high:"skull,eye,face,jaw,neck,shoulder,armpit,upper arm,elbow,forearm,hand,chest,gut", // TODO make shield high guards actually cover head, but -4 atk for being blind
      mid:"jaw,neck,shoulder,armpit,upper arm,elbow,forearm,hand,chest,gut,groin,hip", // also add a kite shield
      low:"elbow,forearm,hand,gut,groin,hip,thigh,knee,shin",
    },
    M: {
      high:"skull,eye,face,jaw,neck,shoulder,forearm,hand,chest",
      mid:"armpit,upper arm,elbow,forearm,hand,chest,gut",
      low:"elbow,forearm,hand,gut,groin,hip",
    },
  },
};
export const MATERIAL_PROPS = {
  wood: {
    weight:10,
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
    weight:5,
    warmth:36,
    sp_value:50,
  },
  leather: {
    weight:5,
    warmth:10,
    sp_value:25,
    metal:false,
    bulky:false,
  },
  padded: {
    weight:4,
    warmth:20,
    sp_value:20,
    metal:false,
    bulky:false,
  },
  "cuir bouilli": {
    weight:6,
    warmth:10,
    sp_value:30,
    metal:false,
    bulky:true,
  },
  brigandine: {
    weight:20,
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
    sp_value: 1500,
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
    weight:22,
    warmth:12,
    sp_value:120,
    metal:true,
    bulky:true,
  },
  splint: {
    weight:18,
    warmth:14,
    sp_value:160,
    metal:true,
    bulky:true,
  },
  "iron plate": {
    weight:20,
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
      dr:1,
    },
    slashing: {
      ac:0,
      dr:0,
    },
  },
  leather: {
    base_AC: 2,
    blunt: {
      ac:0,
      dr:0,
    },
    piercing: {
      ac:0,
      dr:1,
    },
    slashing: {
      ac:-1,
      dr:1,
    },
  },
  padded: {
    base_AC: 2,
    blunt: {
      ac:0,
      dr:1,
    },
    piercing: {
      ac:-1,
      dr:1,
    },
    slashing: {
      ac:-1,
      dr:0,
    },
  },
  "cuir bouilli": {
    base_AC: 2,
    blunt: {
      ac:1,
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
    base_AC: 2,
    blunt: {
      ac:1,
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
  scale: {
    base_AC: 2,
    blunt: {
      ac:2,
      dr:0,
    },
    piercing: {
      ac:1,
      dr:0,
    },
    slashing: {
      ac:3,
      dr:0,
    },
  },
  brigandine: {
    base_AC: 3,
    blunt: {
      ac:1,
      dr:1,
    },
    piercing: {
      ac:0,
      dr:1,
    },
    slashing: {
      ac:1,
      dr:0,
    },
  },
  chain: {
    base_AC: 3,
    blunt: {
      ac:0,
      dr:0,
    },
    piercing: {
      ac:1,
      dr:0,
    },
    slashing: {
      ac:2,
      dr:1,
    },
  },
  "elven chain": {
    base_AC: 3,
    blunt: {
      ac:0,
      dr:0,
    },
    piercing: {
      ac:1,
      dr:0,
    },
    slashing: {
      ac:2,
      dr:1,
    },
  },
  lamellar: {
    base_AC: 3,
    blunt: {
      ac:0,
      dr:1,
    },
    piercing: {
      ac:2,
      dr:1,
    },
    slashing: {
      ac:1,
      dr:1,
    },
  },
  "banded mail": {
    base_AC: 4,
    blunt: {
      ac:0,
      dr:0,
    },
    piercing: {
      ac:2,
      dr:0,
    },
    slashing: {
      ac:1,
      dr:1,
    },
  },
  splint: {
    base_AC: 4,
    blunt: {
      ac:-1,
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
    base_AC: 5,
    blunt: {
      ac: -1,
      dr: 1,
    },
    piercing: {
      ac: 2,
      dr: 0,
    },
    slashing: {
      ac: 1,
      dr: 2,
    },
  },
  "steel plate": {
    base_AC: 6,
    blunt: {
      ac: -1,
      dr: 2,
    },
    piercing: {
      ac: 3,
      dr: 0,
    },
    slashing: {
      ac: 1,
      dr: 2,
    },
  },
}
export const MAX_ARMOR_DR = 3;
export const MAX_IMPALES = 5;
export const MIN_BLEED_DMG = 6;
export const BLEED_CHANCE = 17;
export const ATK_MODES = {
  "swi(b)": {
    ATK_ATTR: "str",
    DMG_ATTR: "str",
    HIT_SOUND: "bludgeon_hit",
    MISS_SOUND: "bludgeon_miss",
    DMG_TYPE: "blunt",
    ATK_TYPE: "melee",
    ATK_FORM: "swing",
  },
  "swi(s)": {
    ATK_ATTR: "str",
    DMG_ATTR: "str",
    HIT_SOUND: "cut_hit",
    MISS_SOUND: "cut_miss",
    DMG_TYPE: "slashing",
    ATK_TYPE: "melee",
    ATK_FORM: "swing",
  },
  "swi(p)": {
    ATK_ATTR: "str",
    DMG_ATTR: "str",
    HIT_SOUND: "hew_hit",
    MISS_SOUND: "hew_miss",
    DMG_TYPE: "piercing",
    ATK_TYPE: "melee",
    ATK_FORM: "swing",
  },
  "thr(b)": {
    ATK_ATTR: "dex",
    DMG_ATTR: "str",
    HIT_SOUND: "bludgeon_hit",
    MISS_SOUND: "bludgeon_miss",
    DMG_TYPE: "blunt",
    ATK_TYPE: "melee",
    ATK_FORM: "thrust",
  },
  "thr(s)": {
    ATK_ATTR: "dex",
    DMG_ATTR: "str",
    HIT_SOUND: "hew_hit",
    MISS_SOUND: "hew_miss",
    DMG_TYPE: "slashing",
    ATK_TYPE: "melee",
    ATK_FORM: "thrust",
  },
  "thr(p)": {
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
  "thrw(b)": {
    ATK_ATTR: "dex",
    DMG_ATTR: "str",
    HIT_SOUND: "throw_hit",
    MISS_SOUND: "throw_miss",
    DMG_TYPE: "blunt",
    ATK_TYPE: "missile",
    ATK_FORM: "throw",
  },
  "thrw(s)": {
    ATK_ATTR: "dex",
    DMG_ATTR: "str",
    HIT_SOUND: "throw_hit",
    MISS_SOUND: "throw_miss",
    DMG_TYPE: "slashing",
    ATK_TYPE: "missile",
    ATK_FORM: "throw",
  },
  "thrw(p)": {
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

export const minorBleedDesc = ` and blood streams from the wound`;
export const majorBleedDesc = ` and blood spurts from the wound!`;
export const internalBleedDesc = area => ` and the ${area} bleeds internally...`;
export const compoundFractureDesc = ' and the broken bones poke through the skin';
export const weaponStuckDesc = ' and the weapon is stuck';
export const knockdownDesc = ' and knocks them down';
export const knockoutDesc = ' and knocks them out';
export const knockbackDesc = ' and knocks them flying!';
export const staggerDesc = ' and staggers them';
export const bloodWellDesc = ' and blood wells around the weapon...';
const gruesBluntHeadDesc = ' and shatters the skull spattering chunks of gore!';
const gruesSlashHeadDesc = ' and cleaves through the head spattering blood in an arc!';
export const bleedDescs = [minorBleedDesc,majorBleedDesc,internalBleedDesc];
export const knockDescs = [knockdownDesc,knockoutDesc,knockbackDesc,staggerDesc];

const ranChoice = (choices) => {
  const ranInd = Math.floor(Math.random() * choices.length);
  return choices[ranInd];
}
const ranToe = () => ranChoice(['big','long','middle','ring','little']);
const ranFinger = () => ranChoice(['thumb','index','middle','ring','pinky']);
const ranShinBone = () => ranChoice(['fibula','tibia']);
const ranForearmBone = () => ranChoice(['ulnar bone','radial bone']);
const ranArmMuscle = () => ranChoice(['triceps','biceps']);
const ranChestBone = () => ranChoice(['a rib','the sternum']);
const ranOrgan = () => ranChoice(['the liver','the spleen','a kidney','the bowels','the spine']);
const ranChestOrgan = () => ranChoice(['a lung','the heart']);
const ranGutBone = () => ranChoice(['a rib','the back']);
const highMinBleed = () => (Math.random() < 0.75) ? minorBleedDesc : '';
const lowMinBleed = () => (Math.random() < 0.25) ? minorBleedDesc : '';
const highWeapStuck = () => (Math.random() < 0.75) ? weaponStuckDesc : '';
const lowWeapStuck = () => (Math.random() < 0.25) ? weaponStuckDesc : '';
const highMajBleed = () => (Math.random() < 0.75) ? majorBleedDesc : '';
const lowMajBleed = () => (Math.random() < 0.25) ? majorBleedDesc : '';
const highIntBleed = area => (Math.random() < 0.75) ? internalBleedDesc(area) : '';
const lowIntBleed = area => (Math.random() < 0.25) ? internalBleedDesc(area) : '';
const compFract = (chance, intBleed=false, area=null) => {
  if (Math.random() < (1 - chance)) return '';
  intBleed = intBleed && Math.random() < 0.5;
  return compoundFractureDesc + (intBleed ? lowIntBleed(area) : lowMinBleed());
};
const highCompFract = (intBleed=false, area=null) => compFract(0.75, intBleed, area);
const lowCompFract = (intBleed=false, area=null) => compFract(0.25, intBleed, area);

export const HIT_LOC_WEIGHT_INDEXES = {
  SWING: 0,
  THRUST: 1,
  SWING_HIGH: 2,
  THRUST_HIGH: 3,
  SWING_LOW: 4,
  THRUST_LOW: 5,
  WEIGHT_WORN: 6,
  WEIGHT_UNWORN: 7,
};
export const HIT_LOCATIONS = {
  foot: {
    weights: [2,2,0,0,8,6,10,4],
    bilateral: true,
    max_impale: 1,
    injury: {
      blunt: {
        light: {
          text: ` and crushes the ${ranToe()} toe`,
        },
        serious: {
          text: ' and breaks the ankle',
          dmgEffect: lowCompFract(),
        },
        critical: {
          text: ' and shatters the ankle',
          dmgEffect: lowCompFract(),
        },
        gruesome: {
          text: ' and crushes the foot into red pulp',
          dmgEffect: highMinBleed(),
        },
      },
      piercing: {
        light: {
          text: ' and cuts a nerve in the foot',
          dmgEffect: lowMinBleed(),
        },
        serious: {
          text: ' and tears the tendon behind the ankle',
          dmgEffect: lowMinBleed(),
        },
        critical: {
          text: ' and impales the foot and severs a bone',
          dmgEffect: lowWeapStuck() + lowMinBleed(),
        },
        gruesome: {
          text: ' and impales the ankle and tears a ligament',
          dmgEffect: highWeapStuck() + highMinBleed(),
        },
      },
      slashing: {
        light: {
          text: ' and severs the tendons on top of the foot',
          dmgEffect: highMinBleed(),
        },
        serious: {
          text: ' severs the tendon behind the ankle',
          dmgEffect: highMinBleed(),
        },
        critical: {
          text: ' and cleaves through the bones of the foot',//' and splits the ankle tearing a ligament',
          dmgEffect: highMinBleed(),
          removal: true,
        },
        gruesome: {
          text: ' and cleaves through the ankle and severs the foot',
          dmgEffect: highMinBleed() + lowMinBleed(),
          removal: true,
        },
      }
    },
  },
  shin: {
    weights: [6,4,0,0,14,10,20,10],
    bilateral: true,
    max_impale: 2,
    injury: {
      blunt: {
        light: {
          text: ` and cracks the ${ranShinBone()}`,
        },
        serious: {
          text: ` and snaps the ${ranShinBone()}`,
          dmgEffect: lowCompFract(),
        },
        critical: {
          text: ' and snaps the tibia',
          dmgEffect: highCompFract(),
        },
        gruesome: {
          text: ' and shatters both shin bones',
          dmgEffect: highCompFract(true, 'shin'),
        },
      },
      piercing: {
        light: {
          text: ' and pierces the calf muscle',
          dmgEffect: lowMinBleed(),
        },
        serious: {
          text: ' and cuts a nerve in the calf muscle',
          dmgEffect: lowMinBleed(),
        },
        critical: {
          text: ' and impales the calf',
          dmgEffect: lowWeapStuck() + highMinBleed(),
        },
        gruesome: {
          text: ` and impales the calf and pierces the ${ranShinBone()}`,
          dmgEffect: highWeapStuck() + lowIntBleed('shin'),
        },
      },
      slashing: {
        light: {
          text: ' and gashes the calf muscle',
          dmgEffect: highMinBleed(),
        },
        serious: {
          text: ' and cuts a nerve in the calf muscle',
          dmgEffect: highMinBleed(),
        },
        critical: {
          text: ` and cleaves into the calf and severs the ${ranShinBone()}`,
          dmgEffect: highMinBleed(),
        },
        gruesome: {
          text: ' and cleaves through both bones and severs the lower leg',
          dmgEffect: lowMajBleed() || highMinBleed(),
          removal: true,
        },
      }
    },
  },
  knee: {
    weights: [8,4,0,0,16,10,8,4],
    bilateral: true,
    crit_chance: 1,
    crit_dmg: 1,
    max_impale: 2,
    injury: {
      blunt: {
        light: {
          text: ' and cracks the kneecap',
        },
        serious: {
          text: ' and dislocates the knee',
        },
        critical: {
          text: ' and shatters the kneecap',
          dmgEffect: lowCompFract(true,'knee'),
        },
        gruesome: {
          text: ' shatters the knee and tears the ligaments',
          dmgEffect: highCompFract(true,'knee'),
        },
      },
      piercing: {
        light: {
          text: ' and chips the kneecap',
        },
        serious: {
          text: ' and tears the tendon below the knee',
          dmgEffect: lowMinBleed(),
        },
        critical: {
          text: ' and impales the knee and tears a ligament', // TODO level of injury in brackets of chat msg
          dmgEffect: lowWeapStuck() + lowMajBleed(),
        },
        gruesome: {
          text: ' pierces the kneecap and impales the knee',
          dmgEffect: highWeapStuck() + lowIntBleed('knee'),
        },
      },
      slashing: {
        light: {
          text: ' and gashes the knee',
          dmgEffect: lowMinBleed(),
        },
        serious: {
          text: ` and severs the tendon below the knee`,
          dmgEffect: lowMinBleed(),
        },
        critical: {
          text: ' and splits the knee and tears a ligament',
          dmgEffect: highMinBleed(),
        },
        gruesome: {
          text: ` and cleaves through the knee and severs the lower leg`,
          removal: true,
          dmgEffect: highMajBleed() || minorBleedDesc,
        },
      },
    },
  },
  thigh: {
    weights: [10,10,4,4,16,20,14,14],
    bilateral: true,
    crit_chance: 1,
    crit_dmg: 1,
    max_impale: 3,
    injury: {
      blunt: {
        light: {
          text: ' and bruises the femur',
        },
        serious: {
          text: ' and cracks the femur',
        },
        critical: {
          text: ' and snaps the femur',
          // TODO injuries affect leg STR, arms DEX, torso CON, head/eyes INT, face/neck CHA
          dmgEffect: lowCompFract(true,'thigh'), // Light Injury -3 (heals at max max HP), Serious -6 (heals at max max HP)
          // Critical/Gruesome -6 (-3 heals at max max HP, but -3 permanent), healing a removed part requires prosthesis
        },
        gruesome: {
          text: ' and shatters the femur',
          dmgEffect: highCompFract(true,'thigh'),
        },
      },
      piercing: {
        light: {
          text: ' and pierces the thigh muscle',
          dmgEffect: lowMinBleed(),
        },
        serious: {
          text: ' and cuts a nerve in the thigh muscle',
          dmgEffect: lowMinBleed(),
        },
        critical: {
          text: ' and impales the thigh',
          dmgEffect: lowWeapStuck() + highMajBleed(),
        },
        gruesome: {
          text: ' and impales the thigh and pierces the femur',
          dmgEffect: highWeapStuck() + lowIntBleed('thigh'),
        },
      },
      slashing: {
        light: {
          text: ' and gashes the thigh muscle',
          dmgEffect: highMinBleed(),
        },
        serious: {
          text: ' and cuts a nerve in the thigh',
          dmgEffect: highMinBleed(),
        },
        critical: {
          text: ' and severs the hamstring tendons',
          dmgEffect: highMinBleed(),
        },
        gruesome: {
          text: ' and cleaves the thigh to the bone',
          dmgEffect: lowMajBleed() || highMinBleed(),
        },
      }
    },
  },
  hip: {
    weights: [6,4,2,0,10,6,4,6],
    bilateral: true,
    crit_chance: 1,
    crit_dmg: 1,
    max_impale: 2,
    injury: {
      blunt: {
        light: {
          text: ' and cracks the femur',
        },
        serious: {
          text: ' and dislocates the hip',
        },
        critical: {
          text: ' and breaks the hip',
          dmgEffect: lowCompFract(true,'hip'),
        },
        gruesome: {
          text: ' and shatters the hip joint',
          dmgEffect: highCompFract(true,'hip'),
        },
      },
      piercing: {
        light: {
          text: ' and pierces the buttock',
          dmgEffect: lowMinBleed(),
        },
        serious: {
          text: ' and cuts a nerve in the buttock',
          dmgEffect: lowMinBleed(),
        },
        critical: {
          text: ' and impales the hip and tears a ligament',
          dmgEffect: lowWeapStuck() + highMajBleed(),
        },
        gruesome: {
          text: ' and impales the pelvis and pierces the hip bone',
          dmgEffect: highWeapStuck() + lowIntBleed('hip'),
        },
      },
      slashing: {
        light: {
          text: ' and gashes the buttock',
          dmgEffect: highMinBleed(),
        },
        serious: {
          text: ' and severs the tendon below the hip',
          dmgEffect: highMinBleed(),
        },
        critical: {
          text: ' and splits the hip and tears a ligament',
          dmgEffect: lowMajBleed() || highMinBleed(),
        },
        gruesome: {
          text: ' and cleaves through the hip and severs the leg',
          removal: true,
          dmgEffect: highMajBleed(),
        },
      },
    },
  },
  groin: {
    weights: [2,8,0,3,3,12,3,4],
    crit_chance: 2,
    crit_dmg: 1,
    max_impale: 3,
    injury: {
      blunt: {
        light: {
          text: ' and bruises the genitals',
        },
        serious: {
          text: ' and lacerates the genitals',
        },
        critical: {
          text: ' and fractures the pubic bone',
          dmgEffect: lowCompFract(true,'groin'),
        },
        gruesome: {
          text: ' and shatters the pelvis',
          dmgEffect: highCompFract(true,'groin'),
        },
      },
      piercing: {
        light: {
          text: ' and gouges the genitals',
          dmgEffect: lowMinBleed(),
        },
        serious: {
          text: ' tears a tendon in the groin',
          dmgEffect: lowMinBleed(),
        },
        critical: {
          text: ' and impales the groin and tears a ligament',
          dmgEffect: lowWeapStuck() + highMajBleed(),
        },
        gruesome: {
          text: ' and impales the groin and pierces the pubic bone',
          dmgEffect: highWeapStuck() + lowIntBleed('groin'),
        },
      },
      slashing: {
        light: {
          text: ' and gashes the genitals',
          dmgEffect: highMinBleed(),
        },
        serious: {
          text: ' and splits the inner thigh and tears a tendon',
          dmgEffect: lowMajBleed() || highMinBleed(),
        },
        critical: {
          text: ' and severs the genitals',
          dmgEffect: highMinBleed(),
        },
        gruesome: {
          text: ' and cleaves through the genitals and into the inner thigh',
          dmgEffect: lowMajBleed() || highMinBleed(),
        },
      },
    },
  },
  gut: {
    weights: [8,16,4,9,12,16,8,12],
    crit_chance: 2,
    crit_dmg: 1,
    max_impale: 5,
    injury: {
      blunt: {
        light: {
          text: ` and bruises ${ranOrgan()}`,
          dmgEffect: lowIntBleed('gut'),
        },
        serious: {
          text: ` and breaks ${ranGutBone()}`,
          dmgEffect: lowIntBleed('gut'),
        },
        critical: {
          text: ` and crushes the ribs into ${ranOrgan()}`,
          dmgEffect: highIntBleed('gut'),
        },
        gruesome: {
          text: ' and breaks the back and severs the spine',
        },
      },
      piercing: {
        light: {
          text: ' and gouges the abdomen',
          dmgEffect: lowMinBleed(),
        },
        serious: {
          text: ` and impales the abdomen and gouges the bowels`,
          dmgEffect: lowMinBleed() || lowIntBleed('gut'),
        },
        critical: {
          text: ` and impales the abdomen and pierces the ${ranOrgan()}`,
          dmgEffect: lowWeapStuck() + highIntBleed('gut'),
        },
        gruesome: {
          text: ` and impales them through the abdomen and through the ${ranOrgan()} and through the back`,
          fatal: true,
          dmgEffect: highWeapStuck() + highIntBleed('gut'),
        },
      },
      slashing: {
        light: {
          text: ' and gashes the abdominal muscle',
          dmgEffect: highMinBleed(),
        },
        serious: {
          text: ' and tears through the abdominal muscle and gashes the bowels',
          dmgEffect: highMinBleed() || lowIntBleed('gut'),
        },
        critical: {
          text: ` and cleaves into the abdomen and eviscerates the ${ranOrgan()}`,
          fatal: true,
          dmgEffect: lowIntBleed('gut') || highMinBleed(),
        },
        gruesome: {
          text: ' and cleaves the body in two at the waist',
          fatal: true,
          dmgEffect: highMajBleed(),
        },
      },
    },
  },
  chest: {
    weights: [4,12,6,16,2,5,5,8],
    crit_chance: 2,
    crit_dmg: 2,
    max_impale: 5,
    injury: {
      blunt: {
        light: {
          text: ` and cracks ${ranChestBone()}`,
        },
        serious: {
          text: ` and breaks ${ranChestBone()}`,
          dmgEffect: lowIntBleed('chest'),
        },
        critical: {
          text: ' and snaps the collarbone',
          dmgEffect: lowCompFract(true,'chest'),
        },
        gruesome: {
          text: ` and caves the sternum into the heart`,
          fatal: true,
          dmgEffect: highIntBleed('chest'),
        },
      },
      piercing: {
        light: {
          text: ` and chips ${ranChestBone()}`,
        },
        serious: {
          text: ' and impales the chest and punctures a lung',
          dmgEffect: highIntBleed('chest'),
        },
        critical: {
          text: ' and impales the chest and pierces the heart',
          dmgEffect: highIntBleed('chest'),
          fatal: true,
        },
        gruesome: {
          text: ` and impales them through the chest and through ${ranChestOrgan()} and through the back`,
          fatal: true,
          dmgEffect: highWeapStuck() + highIntBleed('gut'),
        },
      },
      slashing: {
        light: {
          text: ' and gashes the chest muscle',
          dmgEffect: highMinBleed(),
        },
        serious: {
          text: ' and severs the collarbone',
          dmgEffect: lowMajBleed(),
        },
        critical: {
          text: ' and cleaves through the ribs and gashes a lung',
          dmgEffect: lowMajBleed(),
        },
        gruesome: {
          text: ' and cleaves through the torso from collarbone to navel',
          fatal: true,
          dmgEffect: highMajBleed(),
        },
      },
    },
  },
  hand: {
    weights: [6,4,6,4,4,2,6,4],
    bilateral: true,
    max_impale: 1,
    injury: {
      blunt: {
        light: {
          text: ` and crushes the ${ranFinger()} finger`,
        },
        serious: {
          text: ' and breaks the wrist',
          dmgEffect: lowCompFract(),
        },
        critical: {
          text: ' and shatters the wrist',
          dmgEffect: lowCompFract(true,'wrist'),
        },
        gruesome: {
          text: ' and crushes the hand into red pulp',
          dmgEffect: highMinBleed(),
        },
      },
      piercing: {
        light: {
          text: ' and cuts a nerve in the hand',
          dmgEffect: lowMinBleed(),
        },
        serious: {
          text: ' and tears a tendon in the hand',
          dmgEffect: lowMinBleed(),
        },
        critical: {
          text: ' and impales the hand and severs a bone',
          dmgEffect: lowMinBleed(),
        },
        gruesome: {
          text: ' and impales the wrist and tears a ligament',
          dmgEffect: highMinBleed(),
        },
      },
      slashing: {
        light: {
          text: ' and severs the tendons on the back of the hand',
          dmgEffect: highMinBleed(),
        },
        serious: {
          text: ' and splits the wrist and tears a ligament',
          dmgEffect: highMinBleed(),
        },
        critical: {
          text: ` severs the ${ranFinger()} finger`,
          dmgEffect: highMinBleed(),
        },
        gruesome: {
          text: ' and cleaves through the wrist and severs the hand',
          dmgEffect: highMinBleed(),
          removal: true,
        },
      }
    },
  },
  forearm: {
    weights: [8,4,8,4,6,2,6,4],
    bilateral: true,
    max_impale: 2,
    injury: {
      blunt: {
        light: {
          text: ` and snaps the ${ranForearmBone()}`,
        },
        serious: {
          text: ` and snaps the ${ranForearmBone()}`,
          dmgEffect: lowCompFract(),
        },
        critical: {
          text: ` and snaps the ${ranForearmBone()}`,
          dmgEffect: highCompFract(),
        },
        gruesome: {
          text: ' and shatters the forearm',
          dmgEffect: highCompFract(true,'forearm'),
        },
      },
      piercing: {
        light: {
          text: ' and pierces the forearm muscle',
          dmgEffect: lowMinBleed(),
        },
        serious: {
          text: ' and cuts a nerve in the forearm',
          dmgEffect: lowMinBleed(),
        },
        critical: {
          text: ' and impales the forearm',
          dmgEffect: lowWeapStuck() + highMinBleed(),
        },
        gruesome: {
          text: ` and impales the forearm and pierces the ${ranForearmBone()}`,
          dmgEffect: highWeapStuck() + lowIntBleed('forearm'),
        },
      },
      slashing: {
        light: {
          text: ' and gashes the forearm muscle',
          dmgEffect: highMinBleed(),
        },
        serious: {
          text: ' and cuts a nerve in the forearm',
          dmgEffect: highMinBleed(),
        },
        critical: {
          text: ` and cleaves into the forearm and severs the ${ranForearmBone()}`,
          dmgEffect: highMinBleed(),
        },
        gruesome: {
          text: ' and cleaves through both bones and severs the forearm',
          dmgEffect: highMajBleed(),
          removal: true,
        },
      }
    },
  },
  elbow: {
    weights: [8,4,10,6,2,2,4,2],
    crit_chance: 1,
    crit_dmg: 1,
    max_impale: 2,
    bilateral: true,
    injury: {
      blunt: {
        light: {
          text: ' and dislocates the elbow',
        },
        serious: {
          text: ' and breaks the elbow',
          dmgEffect: lowCompFract(),
        },
        critical: {
          text: ' and shatters the elbow joint',
          dmgEffect: lowCompFract(true,'elbow'),
        },
        gruesome: {
          text: ' and shatters the elbow and tears the ligaments',
          dmgEffect: highCompFract(true,'elbow'),
        },
      },
      piercing: {
        light: {
          text: ' and chips the ulnar bone',
        },
        serious: {
          text: ' and tears the biceps tendon',
          dmgEffect: lowMinBleed(),
        },
        critical: {
          text: ' and impales the elbow and tears a ligament',
          dmgEffect: lowWeapStuck() + lowMajBleed(),
        },
        gruesome: {
          text: ' and impales the elbow and pierces the humerus',
          dmgEffect: highWeapStuck() + lowIntBleed('elbow'),
        },
      },
      slashing: {
        light: {
          text: ' and gashes the elbow',
          dmgEffect: lowMinBleed(),
        },
        serious: {
          text: ` and severs the biceps tendon`,
          dmgEffect: lowMinBleed(),
        },
        critical: {
          text: ' and splits the elbow and tears a ligament',
          dmgEffect: highMinBleed(),
        },
        gruesome: {
          text: ` and cleaves through the elbow and severs the forearm`,
          removal: true,
          dmgEffect: highMajBleed(),
        },
      },
    },
  },
  "upper arm": {
    weights: [6,4,10,8,2,2,6,6],
    crit_chance: 1,
    crit_dmg: 1,
    max_impale: 2,
    bilateral: true,
    injury: {
      blunt: {
        light: {
          text: ' and cracks the humerus',
        },
        serious: {
          text: ' and snaps the humerus',
          dmgEffect: lowCompFract(),
        },
        critical: {
          text: ' and snaps the humerus',
          dmgEffect: lowCompFract(true,'upper arm'),
        },
        gruesome: {
          text: ' and shatters the humerus',
          dmgEffect: highCompFract(true,'upper arm'),
        },
      },
      piercing: {
        light: {
          text: ` and pierces the ${ranArmMuscle()}`,
          dmgEffect: lowMinBleed(),
        },
        serious: {
          text: ` and cuts a nerve in the ${ranArmMuscle()}`,
          dmgEffect: lowMinBleed(),
        },
        critical: {
          text: ' impales the upper arm',
          dmgEffect: lowWeapStuck() + highMajBleed(),
        },
        gruesome: {
          text: ' and impales the upper arm and pierces the humerus',
          dmgEffect: lowWeapStuck() + lowIntBleed('upper arm'),
        },
      },
      slashing: {
        light: {
          text: ` and gashes the ${ranArmMuscle()}`,
          dmgEffect: highMinBleed(),
        },
        serious: {
          text: ` and cuts a nerve in the ${ranArmMuscle()}`,
          dmgEffect: highMinBleed(),
        },
        critical: {
          text: ` and severs the ${ranArmMuscle()}`,
          dmgEffect: lowMajBleed() || highMinBleed(),
        },
        gruesome: {
          text: ' and cleaves through the humerus and severs the arm',
          dmgEffect: highMajBleed(),
          removal: true,
        },
      }
    },
  },
  armpit: {
    weights: [2,6,4,12,2,4,2,2],
    crit_chance: 2,
    crit_dmg: 1,
    max_impale: 3,
    bilateral: true,
    injury: {
      blunt: {
        light: {
          text: ' and dislocates the shoulder',
        },
        serious: {
          text: ' and separates the shoulder',
        },
        critical: {
          text: ' and snaps the humerus',
          dmgEffect: lowCompFract(true,'armpit'),
        },
        gruesome: {
          text: ' and shatters the shoulder',
          dmgEffect: highCompFract(true,'armpit'),
        },
      },
      piercing: {
        light: {
          text: ' and pierces the upper back muscle',
          dmgEffect: lowMinBleed(),
        },
        serious: {
          text: ' and tears a tendon in the armpit',
          dmgEffect: highMinBleed(),
        },
        critical: {
          text: ' and impales the armpit',
          dmgEffect: lowWeapStuck() + highMajBleed(),
        },
        gruesome: {
          text: ' and impales the armpit and severs a rib',
          dmgEffect: highWeapStuck() + lowIntBleed('armpit'),
        },
      },
      slashing: {
        light: {
          text: ' and gashes the upper back muscle',
          dmgEffect: highMinBleed(),
        },
        serious: {
          text: ' and cuts a nerve in the armpit',
          dmgEffect: highMinBleed(),
        },
        critical: {
          text: ' and cleaves into the armpit and severs a tendon',
          dmgEffect: lowMajBleed() || highMinBleed(),
        },
        gruesome: {
          text: ' and cleaves through the shoulder and severs the arm',
          dmgEffect: highMajBleed(),
          removal: true,
        },
      }
    },
  },
  shoulder: {
    weights: [8,6,12,12,2,2,6,6],
    crit_chance: 1,
    crit_dmg: 1,
    max_impale: 3,
    bilateral: true,
    injury: {
      blunt: {
        light: {
          text: ' and dislocates the shoulder',
        },
        serious: {
          text: ' and separates the shoulder',
        },
        critical: {
          text: ' and snaps the collarbone',
          dmgEffect: lowCompFract(true,'shoulder'),
        },
        gruesome: {
          text: ' and shatters the shoulder joint',
          dmgEffect: highCompFract(true,'shoulder'),
        },
      },
      piercing: {
        light: {
          text: ' and pierces the shoulder muscle',
          dmgEffect: lowMinBleed(),
        },
        serious: {
          text: ' and tears a tendon in the shoulder',
          dmgEffect: lowMinBleed(),
        },
        critical: {
          text: ' and impales the shoulder and tears a ligament',
          dmgEffect: lowWeapStuck() + highMajBleed(),
        },
        gruesome: {
          text: ' and impales them through the shoulder and through the upper back',
          dmgEffect: highWeapStuck() + lowIntBleed('shoulder'),
        },
      },
      slashing: {
        light: {
          text: ' and gashes the shoulder muscle',
          dmgEffect: highMinBleed(),
        },
        serious: {
          text: ' and cuts a nerve in the shoulder muscle',
          dmgEffect: highMinBleed(),
        },
        critical: {
          text: ' and severs the collarbone',
          dmgEffect: lowMajBleed() || highMinBleed(),
        },
        gruesome: {
          text: ' and cleaves through the shoulder and severs the arm',
          dmgEffect: highMajBleed(),
          removal: true,
        },
      },
    },
  },
  neck: {
    weights: [3,2,6,4,0,0,3,3],
    crit_chance: 3,
    crit_dmg: 1,
    max_impale: 2,
    injury: {
      blunt: {
        light: {
          text: ' and crushes the larynx',
        },
        serious: {
          text: ' and fractures a vertebra',
          dmgEffect: lowCompFract(true,'neck'),
        },
        critical: {
          text: ' and snaps the neck and severs the spine',
        },
        gruesome: {
          text: ' and shatters the neck and tears the ligaments',
          dmgEffect: highCompFract(true,'neck'),
          fatal: true,
        }
      },
      piercing: {
        light: {
          text: ' and pierces the larynx',
          dmgEffect: lowMinBleed(),
        },
        serious: {
          text: ' and cuts a nerve in the neck',
          dmgEffect: lowMinBleed(),
        },
        critical: {
          text: ' and impales the neck and tears a ligament',
          dmgEffect: lowWeapStuck() || highMajBleed(),
        },
        gruesome: {
          text: ' and impales the neck and severs the spine',
          dmgEffect: highWeapStuck() + lowMajBleed(),
          fatal: true,
        }
      },
      slashing: {
        light: {
          text: ' and gashes the neck muscle',
          dmgEffect: highMinBleed(),
        },
        serious: {
          text: ' and cuts a nerve in the neck',
          dmgEffect: lowMajBleed() || highMinBleed(),
        },
        critical: {
          text: ' and cleaves into the neck and severs a muscle',
          dmgEffect: highMajBleed() || highMinBleed(),
        },
        gruesome: {
          text: ' and cleaves through the neck and severs the head',
          dmgEffect: highMajBleed(),
          fatal: true,
          removal: true,
        }
      },
    },
  },
  jaw: {
    weights: [3,2,6,3,1,1,2,2],
    crit_chance: 3,
    crit_dmg: 1,
    max_impale: 2,
    injury: {
      blunt: {
        light: {
          text: ' and lacerates the jaw',
          dmgEffect: lowMinBleed(),
        },
        serious: {
          text: ' and breaks the jaw',
          dmgEffect: lowCompFract(),
        },
        critical: {
          text: ' and smashes the jaw into the brain',
          dmgEffect: lowCompFract(),
          fatal: true,
        },
        gruesome: {
          text: gruesBluntHeadDesc,
          fatal: true,
          removal: true,
        },
      },
      piercing: {
        light: {
          text: ' and gouges the cheek',
          dmgEffect: highMinBleed(),
        },
        serious: {
          text: ' and breaks the teeth',
          dmgEffect: lowMinBleed(),
        },
        critical: {
          text: ' and impales the jaw and pierces the brainstem',
          dmgEffect: lowWeapStuck() + highMinBleed(),
          fatal: true,
        },
        gruesome: {
          text: ' and impales them through the jaw and through the brainstem and through the back of the skull',
          fatal: true,
          dmgEffect: highWeapStuck() + lowMinBleed(),
        },
      },
      slashing: {
        light: {
          text: ' and gashes the mouth',
          dmgEffect: highMinBleed(),
        },
        serious: {
          text: ' and splits the jaw',
          dmgEffect: highMinBleed(),
        },
        critical: {
          text: ' and cleaves through the jaw and into the brain',
          dmgEffect: lowMinBleed(),
          fatal: true,
        },
        gruesome: {
          text: gruesSlashHeadDesc,
          dmgEffect: lowMajBleed(),
          fatal: true,
          removal: true,
        },
      },
    },
  },
  "face": {
    weights: [1,2,2,3,0,0,2,1],
    crit_chance: 3,
    crit_dmg: 2,
    max_impale: 2,
    injury: {
      blunt: {
        light: {
          text: ' and lacerates the nose',
          dmgEffect: lowMinBleed(),
        },
        serious: {
          text: ' and breaks the nose',
          dmgEffect: lowMinBleed(),
        },
        critical: {
          text: ' and caves the nose into the brain',
          dmgEffect: lowCompFract(),
          fatal: true,
        },
        gruesome: {
          text: gruesBluntHeadDesc,
          fatal: true,
          removal: true,
        },
      },
      piercing: {
        light: {
          text: ' and gouges the nose',
          dmgEffect: lowMinBleed(),
        },
        serious: {
          text: ' and splits the nose',
          dmgEffect: lowMinBleed(),
        },
        critical: {
          text: ' and impales the nose and pierces the brain',
          dmgEffect: lowWeapStuck() + highMinBleed(),
          fatal: true,
        },
        gruesome: {
          text: ' and impales them through the nose and through the brain and through the back of the skull',
          fatal: true,
          dmgEffect: highWeapStuck() + lowMinBleed(),
        },
      },
      slashing: {
        light: {
          text: ' and gashes the nose',
          dmgEffect: highMinBleed(),
        },
        serious: {
          text: ' and severs the nose',
          dmgEffect: highMinBleed(),
        },
        critical: {
          text: ' and cleaves through the nose and into the brain',
          dmgEffect: lowMinBleed(),
          fatal: true,
        },
        gruesome: {
          text: gruesSlashHeadDesc,
          dmgEffect: lowMajBleed(),
          fatal: true,
          removal: true,
        },
      },
    },
  },
  eye: {
    weights: [2,2,4,4,0,0,2,2],
    crit_chance: 5,
    crit_dmg: 2,
    max_impale: 3,
    bilateral: true,
    injury: {
      blunt: {
        light: {
          text: ' and cracks the eye socket',
          dmgEffect: knockoutDesc,
        },
        serious: {
          text: ' and shatters the eye socket',
          dmgEffect: knockoutDesc,
        },
        critical: {
          text: ' and smashes the brow into the brain',
          dmgEffect: lowCompFract(),
          fatal: true,
        },
        gruesome: {
          text: gruesBluntHeadDesc,
          fatal: true,
          removal: true,
        },
      },
      piercing: {
        light: {
          text: ' and gouges the brow',
          dmgEffect: highMinBleed(),
        },
        serious: {
          text: ' and gouges the eye out of the socket',
          dmgEffect: lowMinBleed(),
        },
        critical: {
          text: ' and impales the eye and pierces the brain',
          dmgEffect: lowWeapStuck() + highMinBleed(),
          fatal: true,
        },
        gruesome: {
          text: ' and impales them through the eye and through the brain and through the back of the skull',
          fatal: true,
          dmgEffect: highWeapStuck() + lowMinBleed(),
        },
      },
      slashing: {
        light: {
          text: ' and gashes the brow',
          dmgEffect: highMinBleed(),
        },
        serious: {
          text: ' and eviscerates the eye',
          dmgEffect: highMinBleed(),
        },
        critical: {
          text: ' and cleaves through the brow and into the brain',
          dmgEffect: lowMinBleed(),
          fatal: true,
        },
        gruesome: {
          text: gruesSlashHeadDesc,
          dmgEffect: lowMinBleed(),
          fatal: true,
          removal: true,
        },
      },
    },
  },
  skull: {
    weights: [7,4,16,8,0,0,9,6],
    crit_chance: 2,
    crit_dmg: 3,
    max_impale: 3,
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
          text: ' and smashes the skull into the brain',
          fatal: true,
        },
        gruesome: {
          text: gruesBluntHeadDesc,
          fatal: true,
          removal: true,
        },
      },
      piercing: {
        light: {
          text: ' and gouges the scalp',
          dmgEffect: highMinBleed(),
        },
        serious: {
          text: ' and cracks the skull',
          dmgEffect: lowMinBleed(),
        },
        critical: {
          text: ' and penetrates the skull and pierces the brain',
          dmgEffect: lowWeapStuck() + highMinBleed(),
          fatal: true,
        },
        gruesome: {
          text: ' and impales them through the ear and through the brain and through the back of the skull',
          fatal: true,
          dmgEffect: highWeapStuck() + lowMinBleed(),
        },
      },
      slashing: {
        light: {
          text: ' and gashes the scalp',
          dmgEffect: highMinBleed(),
        },
        serious: {
          text: ' and severs an ear',
          dmgEffect: highMinBleed(),
        },
        critical: {
          text: ' and cleaves through the skull and into the brain',
          dmgEffect: lowMinBleed(),
          fatal: true,
        },
        gruesome: {
          text: gruesSlashHeadDesc,
          dmgEffect: lowMinBleed(),
          fatal: true,
          removal: true,
        },
      },
    },
  },
};

const halfAttr = (weap, attr) => Math.max(1, Math.floor(weap.data.data.attributes[attr]?.value / 2));
export const STANCE_MODS = {
  power: {
    ac_mod: -3,
    atk_mod: -2,
    dmg_mod: weap => halfAttr(weap, 'impact'),
    impact_mod: weap =>  halfAttr(weap, 'impact'),
    counter_mod: weap => 0 - halfAttr(weap, 'counter'),
  },
  fluid: {
    atk_mod: 3,
    dmg_mod: weap => 0 - halfAttr(weap, 'impact'),
    impact_mod: weap => 0 - halfAttr(weap, 'impact'),
    counter_mod: weap => halfAttr(weap, 'counter'),
  },
  counter: {
    ac_mod: -1,
  }
}

export const WEAP_BREAK_CHANCE = 5;
export const SQUARE_SIZE = 5;

export const AMMO_TYPES = [
  "bodkin arrow",
  "broadhead arrow",
  "bolt",
  "quarrel",
];

export const AIM_AREAS = {
  head: ['skull','left eye','right eye','face','jaw','neck'],
  left_arm: ['left shoulder','left upper arm','left elbow','left forearm','left hand'],
  upper_torso: ['left armpit','chest','right armpit'],
  right_arm: ['right shoulder','right upper arm','right elbow','right forearm','right hand'],
  lower_torso: ['gut','groin',],
  left_leg: ['left hip','left thigh','left knee','left shin','left foot'],
  right_leg: ['right hip','right thigh','right knee','right shin','right foot'],
};

export const AIM_AREAS_UNILATERAL = {
  head: ['skull','eye','face','jaw','neck'],
  arm: ['shoulder','upper arm','elbow','forearm','hand'],
  upper_torso: ['armpit','chest','armpit'],
  lower_torso: ['gut','groin',],
  leg: ['hip','thigh','knee','shin','foot'],
};

export const SHIELD_WEIGHT_MULTI = {
  worn: 1.2,
  large: 1.33,
};

// populate hit location arrays on startup
export const HIT_LOC_ARRS = {
  SWING: [],
  THRUST: [],
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

  // add more hit location tables for high/low
  Object.keys(HIT_LOC_ARRS).forEach(a => ["HIGH","LOW"].forEach(l => Object.assign(HIT_LOC_ARRS, {[`${a}_${l}`]: []})));
  for (const [k, v] of Object.entries(HIT_LOCATIONS)) {
    Object.keys(HIT_LOC_ARRS).forEach(arr => {
      const i = HIT_LOC_WEIGHT_INDEXES[arr];
      HIT_LOC_ARRS[arr].push(...fillLocArr(k, v.weights[i], v.bilateral));
    });
  }
  // add more hit location tables for the aim areas
  Object.keys(HIT_LOC_ARRS).forEach(a => Object.keys(AIM_AREAS).forEach(l => {
    const key = `${a}_${l.toUpperCase()}`;
    const values = AIM_AREAS[l].map(loc => HIT_LOC_ARRS[a].filter(hitLoc => hitLoc === loc)).flat();
    Object.assign(HIT_LOC_ARRS, {[key]: values});
  }));

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

export const HEIGHT_AREAS = {
  low: ['foot','shin','knee','thigh','hip','groin'],
  mid: ['gut','chest','hand','forearm','elbow','upper arm'],
  high: ['armpit','shoulder','neck','jaw','face','eye','skull'],
}

export const WEAPON_CATEGORIES = [
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
