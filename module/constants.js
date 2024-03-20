export const ASSETS_PATH = 'systems/brigandine/assets';
export const ATTRIBUTE_TYPES = ['String', 'Number', 'Boolean', 'Formula', 'Resource'];
export const SECONDS_IN_DAY = 86400;
export const SECONDS_IN_HOUR = 3600;
export const MIN_BLEED_DMG = 6; // TODO need? min knockdown dmg?
export const BASE_IMPALE_CHANCE = 30; // TODO need?
export const ATTITUDES = {
  HOSTILE: 'hostile',
  DISMISSIVE: 'dismissive',
  UNCERTAIN: 'uncertain',
  ACCEPTING: 'accepting',
  HELPFUL: 'helpful',
};
export const STORAGE_MATERIALS = {
  WOOD: 'wood',
  LEATHER: 'leather',
  BRASS: 'brass',
  IVORY: 'ivory',
  JADE: 'jade',
};
export const SCROLL_MATERIALS = {
  PAPYRUS: 'papyrus',
  LINEN: 'linen paper',
  PARCHMENT: 'parchment',
  VELLUM: 'vellum',
};
export const ATTITUDE_SELL_ADJ = {
  [ATTITUDES.HOSTILE]: 1.5,
  [ATTITUDES.DISMISSIVE]: 1.15,
  [ATTITUDES.UNCERTAIN]: 1,
  [ATTITUDES.ACCEPTING]: 0.95,
  [ATTITUDES.HELPFUL]: 0.85,
};
export const ATTITUDE_BUY_ADJ = {
  [ATTITUDES.HOSTILE]: 0.5,
  [ATTITUDES.DISMISSIVE]: 0.85,
  [ATTITUDES.UNCERTAIN]: 1,
  [ATTITUDES.ACCEPTING]: 1.05,
  [ATTITUDES.HELPFUL]: 1.15,
};

export const SHIELD_TYPES = {
  round: {
    L: {
      high: 'skull,eye,ear,nose,jaw,neck,shoulder,armpit,upper arm,elbow,forearm,hand,chest,gut', // TODO make shield high guard -4 atk for being blind
      mid: 'jaw,neck,shoulder,armpit,upper arm,elbow,forearm,hand,chest,gut,groin,hip,thigh', // TODO make sure weight is always computed from M coverage
      low: 'elbow,forearm,hand,gut,groin,hip,thigh,knee,shin',
    },
    M: {
      high: 'skull,eye,ear,nose,jaw,neck,shoulder,forearm,hand',
      mid: 'armpit,upper arm,elbow,forearm,hand,chest,gut',
      low: 'elbow,forearm,hand,gut,groin,hip,thigh',
    },
  },
  kite: {
    L: {
      high: 'skull,eye,ear,nose,jaw,neck,shoulder,armpit,upper arm,elbow,forearm,hand,chest,gut,groin',
      mid: 'jaw,neck,shoulder,armpit,upper arm,elbow,forearm,hand,chest,gut,groin,thigh,knee',
      low: 'elbow,forearm,hand,gut,groin,hip,thigh,knee,shin,foot',
    },
    M: {
      high: 'skull,eye,ear,nose,jaw,neck,shoulder,forearm,hand,chest',
      mid: 'shoulder,armpit,upper arm,elbow,forearm,hand,chest,gut,groin',
      low: 'elbow,forearm,hand,gut,groin,thigh',
    },
  },
  tower: {
    L: {
      // TODO can't be used on horseback
      high: 'skull,eye,ear,nose,jaw,neck,shoulder,armpit,upper arm,elbow,forearm,hand,chest,gut,groin,hip',
      mid: 'neck,shoulder,armpit,upper arm,elbow,forearm,hand,chest,gut,groin,hip,thigh,knee',
      low: 'elbow,forearm,hand,gut,groin,hip,thigh,knee,shin,foot',
    },
    M: {
      high: 'skull,eye,ear,nose,jaw,neck,shoulder,armpit,upper arm,elbow,forearm,hand,chest,gut',
      mid: 'shoulder,armpit,upper arm,elbow,forearm,hand,chest,gut,groin,hip',
      low: 'elbow,forearm,hand,gut,groin,hip,thigh,knee',
    },
  },
};
export const GARMENT_MATERIALS = {
  bone: {
    weight: 40,
    clo: 10,
    value: 180,
  },
  wood: {
    weight: 40,
    clo: 10,
    value: 120,
  },
  burlap: {
    weight: 8,
    clo: 5,
    value: 6,
  },
  linen: {
    weight: 4,
    clo: 8,
    value: 60,
  },
  wool: {
    weight: 8,
    clo: 16,
    value: 144,
  },
  silk: {
    weight: 2,
    clo: 11,
    value: 1080,
  },
  fur: {
    weight: 20,
    clo: 32,
    value: 600,
  },
  leather: {
    weight: 16,
    clo: 10,
    value: 300,
    metal: false,
    bulky: false,
  },
  padded: {
    weight: 16,
    clo: 18,
    value: 240,
    metal: false,
    bulky: false,
  },
  'cuir bouilli': {
    weight: 24,
    clo: 9,
    value: 360,
    metal: false,
    bulky: true,
  },
  brigandine: {
    weight: 80,
    clo: 16,
    value: 1200,
    metal: true,
    bulky: true,
  },
  scale: {
    weight: 88,
    clo: 13,
    value: 960,
    metal: true,
    bulky: false,
  },
  mail: {
    weight: 48,
    clo: 2,
    value: 1800,
    metal: true,
    bulky: false,
  },
  'elven mail': {
    weight: 24,
    clo: 1,
    value: 18000,
    metal: true,
    bulky: false,
  },
  'plated mail': {
    weight: 60,
    clo: 4,
    value: 2400,
    metal: true,
    bulky: false,
  },
  lamellar: {
    weight: 88,
    clo: 11,
    value: 1440,
    metal: true,
    bulky: true,
  },
  splint: {
    weight: 72,
    clo: 14,
    value: 1920,
    metal: true,
    bulky: true,
  },
  'iron plate': {
    weight: 80,
    clo: 10,
    value: 2880,
    metal: true,
    bulky: true,
  },
  'steel plate': {
    weight: 72,
    clo: 8,
    value: 7200,
    metal: true,
    bulky: true,
  },
};

export const LIMB_GROUPS = {
  'lower leg': ['foot', 'shin'],
  leg: ['foot', 'shin', 'knee', 'thigh'],
  forearm: ['hand', 'forearm'],
  arm: ['hand', 'forearm', 'elbow', 'upper arm'],
};
export const minorBleedDesc = ' and the wound bleeds heavily';
export const majorBleedDesc = (area) => ` and blood spurts from the ${area}!`;
export const internalBleedDesc = (area) => ` and the ${area} bleeds internally`;
export const compoundFractureDesc = ' and the broken bones jut through the skin';
export const weaponStuckDesc = ' and the weapon is stuck';
export const knockdownDesc = ' and knocks them down';
export const knockoutDesc = ' and knocks them out';
export const knockbackDesc = ' and knocks them flying!';
export const staggerDesc = ' and staggers them';
export const knockWindDesc = ' and knocks the wind from them';
export const bloodWellDesc = ' and blood wells around the weapon...';
const gruesBluntHeadDesc = ' and shatters the skull spattering chunks of gore!';
const gruesSlashHeadDesc = ' and cleaves through the head spattering blood in an arc!';
export const bleedDescs = [minorBleedDesc, majorBleedDesc, internalBleedDesc];
export const knockDescs = [knockdownDesc, knockoutDesc, knockbackDesc, staggerDesc, knockWindDesc];
const ranChoice = (choices) => {
  const ranInd = Math.floor(Math.random() * choices.length);
  return choices[ranInd];
};

/* TODO
0.5x STR mod on Thrusts
-1 to-hit for pre-attack maneuevers
order armor listed in inventory rows is order it is layered when worn
weapon must be balanced to riposte after parry
give some weapons a +1 parry bonus
attack bonus on riposte??? a +2 might be balanced now considering chance of overcoming parry
flex blades more durable but need to be half-sworded to avoid 1/2 damage on blunted thrust
half-swording also eliminates bonus damage vs. Large
saber/scimitar needs to do slightly more damage -- 1d9 or 2d4
OR scimitars can have expanded reach range and never get stuck
can list special weapon properties as a comma separated list on the weapon item
*/
export const ranAnnoyedMerchant = () =>
  ranChoice([
    'The merchant purses their lips.',
    'The merchant rubs the bridge of their nose.',
    'The merchant closes their eyes and sighs.',
    'The merchant clucks their tongue.',
    'The merchant looks upward.',
  ]); // CONTINUE
const ranToe = () => ranChoice(['big', 'long', 'middle', 'ring', 'little']);
const ranOrifice = () => ranChoice(['nose', 'mouth', 'ears']);
const ranFinger = () => ranChoice(['thumb', 'index finger', 'middle finger', 'ring finger', 'pinky finger']);
const ranShinBone = () => ranChoice(['fibula', 'tibia']);
const ranForearmBone = () => ranChoice(['ulnar bone', 'radial bone']);
const ranArmMuscle = () => ranChoice(['triceps', 'biceps']);
const ranThighMuscle = () => ranChoice(['quadriceps', 'quadriceps', 'hamstrings']);
const ranChestBone = () => ranChoice(['a rib', 'the sternum']);
const ranOrgan = () => ranChoice(['the liver', 'the spleen', 'a kidney', 'the bowels', 'the spine']);
const ranChestOrgan = () => ranChoice(['a lung', 'the heart']);
const ranGutBone = () => ranChoice(['a rib', 'the back']);
const lowBrainBleed = (organ = null) =>
  Math.random() < 0.25 ? ` and blood streams from the ${organ || ranOrifice()}` : '';
const highBrainBleed = (organ = null) =>
  Math.random() < 0.75 ? ` and blood streams from the ${organ || ranOrifice()}` : '';
const highMinBleed = () => (Math.random() < 0.75 ? minorBleedDesc : '');
const lowMinBleed = () => (Math.random() < 0.25 ? minorBleedDesc : '');
const highWeapStuck = () => (Math.random() < 0.75 ? weaponStuckDesc : '');
const lowWeapStuck = () => (Math.random() < 0.25 ? weaponStuckDesc : '');
const highMajBleed = (area = 'wound') => (Math.random() < 0.75 ? majorBleedDesc(area) : '');
const lowMajBleed = (area = 'wound') => (Math.random() < 0.25 ? majorBleedDesc(area) : '');
const highIntBleed = (area) => (Math.random() < 0.75 ? internalBleedDesc(area) : '');
const lowIntBleed = (area) => (Math.random() < 0.25 ? internalBleedDesc(area) : '');
const compFract = (chance, intBleed = false, area = null) => {
  if (Math.random() < 1 - chance) return '';
  intBleed = intBleed && Math.random() < 0.5;
  return compoundFractureDesc + (intBleed ? lowIntBleed(area) : lowMinBleed());
};
const highCompFract = (intBleed = false, area = null) => compFract(0.75, intBleed, area);
const lowCompFract = (intBleed = false, area = null) => compFract(0.25, intBleed, area);
export const HIT_LOC_WEIGHT_INDEXES = {
  // TODO make weights object instead of array in hit locations and remove this
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
    weights: [2, 2, 0, 0, 6, 6, 8, 4],
    bilateral: true,
    crit_chance_multi: 1,
    max_impale: 1,
    injury: {
      blunt: {
        light: {
          text: ` and crushes the ${ranToe()} toe`, // types of injuries and stat affected: leg (MV), arm,
        },
        serious: {
          text: ' and breaks the ankle', // heal interval, heal TN (Con check), effect (active Effect format)
          dmgEffect: lowCompFract(),
        },
        critical: {
          text: ' and mangles the ankle tearing the ligaments',
          // dmgEffect: lowCompFract(),
        },
        gruesome: {
          text: ' and crushes the foot into red pulp',
          dmgEffect: highMinBleed(),
          removal: true,
        },
      },
      pierce: {
        light: {
          text: ' and severs a nerve',
          dmgEffect: lowMinBleed(),
        },
        serious: {
          text: ' and tears the tendon behind the ankle',
          dmgEffect: lowMinBleed(),
        },
        critical: {
          text: ' and severs a bone',
          dmgEffect: lowWeapStuck() + lowMinBleed(),
        },
        gruesome: {
          text: ' and impales the ankle tearing a ligament',
          dmgEffect: highWeapStuck() + highMinBleed(),
        },
      },
      slash: {
        light: {
          text: ' and severs the tendons on top of the foot',
          dmgEffect: highMinBleed(),
        },
        serious: {
          text: ' and severs the tendon behind the ankle',
          dmgEffect: highMinBleed(),
        },
        critical: {
          text: ' and cleaves through the bones of the foot',
          dmgEffect: highMinBleed(),
          removal: true,
        },
        gruesome: {
          text: ' and severs the foot at the ankle',
          dmgEffect: highMinBleed() + lowMinBleed(),
          removal: true,
        },
      },
    },
  },
  shin: {
    weights: [6, 4, 0, 0, 12, 8, 16, 8],
    crit_chance_multi: 2,
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
          text: ` and snaps the ${ranShinBone()}`,
          dmgEffect: highCompFract(),
        },
        gruesome: {
          text: ' and shatters the lower leg',
          dmgEffect: highCompFract(true, 'shin'),
        },
      },
      pierce: {
        light: {
          text: ' and tears the calf muscle',
          dmgEffect: lowMinBleed(),
        },
        serious: {
          text: ' and tears the tendon below the calf',
          dmgEffect: lowMinBleed(),
        },
        critical: {
          text: ' and severs a nerve in the calf',
          dmgEffect: lowWeapStuck() + highMinBleed(),
        },
        gruesome: {
          text: ` and shatters the ${ranShinBone()}`,
          dmgEffect: highWeapStuck() + lowIntBleed('shin'),
        },
      },
      slash: {
        light: {
          text: ' and gashes the calf muscle',
          dmgEffect: highMinBleed(),
        },
        serious: {
          text: ' and severs a nerve in the calf',
          dmgEffect: highMinBleed(),
        },
        critical: {
          text: ` and severs the ${ranShinBone()}`,
          dmgEffect: highMinBleed(),
        },
        gruesome: {
          text: ' and severs the leg below the knee',
          dmgEffect: lowMajBleed() || highMinBleed(),
          removal: true,
        },
      },
    },
  },
  knee: {
    weights: [8, 4, 0, 0, 14, 8, 8, 4],
    bilateral: true,
    crit_chance_multi: 1,
    max_impale: 1,
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
          dmgEffect: lowCompFract(true, 'knee'),
        },
        gruesome: {
          text: ' and mangles the knee tearing the ligaments',
          // dmgEffect: highCompFract(true,'knee'),
        },
      },
      pierce: {
        light: {
          text: ' and chips the kneecap',
        },
        serious: {
          text: ' and tears the tendon below the knee',
          dmgEffect: lowMinBleed(),
        },
        critical: {
          text: ' and impales the knee tearing a ligament',
          dmgEffect: lowWeapStuck() + lowMajBleed(),
        },
        gruesome: {
          text: ' and shatters the kneecap',
          dmgEffect: highWeapStuck() + lowIntBleed('knee'),
        },
      },
      slash: {
        light: {
          text: ' and gashes the knee',
          dmgEffect: lowMinBleed(),
        },
        serious: {
          text: ' and severs the tendon below the knee',
          dmgEffect: lowMinBleed(),
        },
        critical: {
          text: ' and splits the knee tearing a ligament',
          dmgEffect: highMinBleed(),
        },
        gruesome: {
          text: ' and severs the leg at the knee!',
          removal: true,
          dmgEffect: highMajBleed() || minorBleedDesc,
        },
      },
    },
  },
  thigh: {
    weights: [10, 10, 4, 4, 14, 18, 16, 10],
    bilateral: true,
    crit_chance_multi: 1,
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
          // TODO injuries affect leg STR and max MV, arms DEX, torso CON, head/eyes INT, nose/neck CHA
          dmgEffect: lowCompFract(true, 'thigh'), // Light Injury -3 (heals at max max HP), Serious -6 (heals at max max HP)
          // Critical/Gruesome -6 (-3 heals at max max HP, but -3 permanent), healing a removed part requires prosthesis
        },
        gruesome: {
          text: ' and shatters the femur',
          dmgEffect: highCompFract(true, 'thigh'),
        },
      },
      pierce: {
        light: {
          text: ` and tears the ${ranThighMuscle()}`,
          dmgEffect: lowMinBleed(),
        },
        serious: {
          text: ' and tears the tendon below the hip',
          dmgEffect: lowMinBleed(),
        },
        critical: {
          text: ` and severs a nerve in the ${ranThighMuscle()}`,
          dmgEffect: lowWeapStuck() + highMajBleed(),
        },
        gruesome: {
          text: ' and pierces the femur',
          dmgEffect: highWeapStuck() + lowIntBleed('thigh'),
        },
      },
      slash: {
        light: {
          text: ` and gashes the ${ranThighMuscle()}`,
          dmgEffect: highMinBleed(),
        },
        serious: {
          text: ` and severs a nerve in the ${ranThighMuscle()}`,
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
      },
    },
  },
  hip: {
    weights: [6, 4, 2, 0, 10, 6, 4, 8],
    bilateral: true,
    crit_chance_multi: 1,
    crit_dmg_multi: 2,
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
          dmgEffect: lowCompFract(true, 'hip'),
        },
        gruesome: {
          text: ' and shatters the hip', // TODO gruesome blunt - tear off rather than shatter
          dmgEffect: highCompFract(true, 'hip'),
        },
      },
      pierce: {
        light: {
          text: ' and pierces the buttock',
          dmgEffect: lowMinBleed(),
        },
        serious: {
          text: ' and severs a nerve in the buttock',
          dmgEffect: lowMinBleed(),
        },
        critical: {
          text: ' and penetrates the pelvis and tears a ligament',
          dmgEffect: lowWeapStuck() + highMajBleed(),
        },
        gruesome: {
          text: ' and pierces the hip bone',
          dmgEffect: highWeapStuck() + lowIntBleed('hip'),
        },
      },
      slash: {
        light: {
          text: ' and gashes the buttock',
          dmgEffect: highMinBleed(),
        },
        serious: {
          text: ' and severs the tendon below the hip',
          dmgEffect: highMinBleed(),
        },
        critical: {
          text: ' and cleaves into the pelvis and severs a ligament',
          dmgEffect: lowMajBleed() || highMinBleed(),
        },
        gruesome: {
          text: ' and severs the leg at the hip',
          removal: true,
          dmgEffect: highMajBleed(),
        },
      },
    },
  },
  groin: {
    // TODO blunt hit save or be stunned by pain for male chars
    // female chars treat groin shot as gut and don't display on sheet
    // also move knockdown/bleed bonii here
    weights: [2, 8, 0, 3, 3, 12, 2, 4],
    crit_chance_multi: 3,
    crit_dmg_multi: 2,
    max_impale: 2,
    injury: {
      blunt: {
        light: {
          text: ' and bruises the genitals',
        },
        serious: {
          text: ' and crushes the genitals',
        },
        critical: {
          text: ' and fractures the pubic bone',
          dmgEffect: lowCompFract(true, 'groin'),
        },
        gruesome: {
          text: ' and shatters the pelvis',
          dmgEffect: highCompFract(true, 'groin'),
        },
      },
      pierce: {
        light: {
          text: ' and gouges the genitals',
          dmgEffect: lowMinBleed(),
        },
        serious: {
          text: ' and tears a tendon in the inner thigh',
          dmgEffect: lowMinBleed(),
        },
        critical: {
          text: ' and penetrates the pelvis and tears a ligament',
          dmgEffect: lowWeapStuck() + highMajBleed(),
        },
        gruesome: {
          text: ' and pierces the pubic bone',
          dmgEffect: highWeapStuck() + lowIntBleed('groin'),
        },
      },
      slash: {
        light: {
          text: ' and gashes the genitals',
          dmgEffect: highMinBleed(),
        },
        serious: {
          text: ' and splits the inner thigh severing a tendon',
          dmgEffect: lowMajBleed() || highMinBleed(),
        },
        critical: {
          text: ' and severs the genitals',
          dmgEffect: highMinBleed(),
          removal: true,
        },
        gruesome: {
          text: ' and cleaves through the genitals and into the inner thigh',
          dmgEffect: lowMajBleed() || highMinBleed(),
          removal: true,
        },
      },
    },
  },
  gut: {
    weights: [8, 16, 4, 9, 12, 16, 6, 12],
    crit_chance_multi: 2,
    crit_dmg_multi: 2,
    max_impale: 3,
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
          text: ' and breaks the back severing the spine', // TODO paralysis desc
        },
      },
      pierce: {
        light: {
          text: ' and gouges the gut',
          dmgEffect: lowMinBleed(),
        },
        serious: {
          text: ' and penetrates the gut and gouges the bowels',
          dmgEffect: lowMinBleed() || lowIntBleed('gut'),
        },
        critical: {
          text: ` and penetrates the gut and pierces ${ranOrgan()}`,
          dmgEffect: lowWeapStuck() + highIntBleed('gut'),
        },
        gruesome: {
          text: ` and pierces them from the gut through ${ranOrgan()} and out the back`,
          fatal: true,
          dmgEffect: highWeapStuck() + highIntBleed('gut'),
        },
      },
      slash: {
        light: {
          text: ' and gashes the gut',
          dmgEffect: highMinBleed(),
        },
        serious: {
          text: ' and tears through the gut gashing the bowels',
          dmgEffect: highMinBleed() || lowIntBleed('gut'),
        },
        critical: {
          text: ` and cleaves into the gut and eviscerates ${ranOrgan()}`,
          fatal: true,
          dmgEffect: lowIntBleed('gut') || highMinBleed(),
        },
        gruesome: {
          text: ' and cleaves the body in two at the waist',
          fatal: true,
          removal: true,
          dmgEffect: highMajBleed(),
        },
      },
    },
  },
  chest: {
    weights: [4, 12, 6, 16, 2, 5, 5, 8],
    crit_chance_multi: 1,
    crit_dmg_multi: 3,
    max_impale: 3,
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
          dmgEffect: lowCompFract(true, 'chest'),
        },
        gruesome: {
          text: ' and caves the sternum into the heart!',
          fatal: true,
          dmgEffect: highIntBleed('chest'),
        },
      },
      pierce: {
        light: {
          text: ` and chips ${ranChestBone()}`,
        },
        serious: {
          text: ' and punctures a lung',
          dmgEffect: highIntBleed('chest'),
        },
        critical: {
          text: ' and pierces the heart',
          dmgEffect: highIntBleed('chest'),
          fatal: true,
        },
        gruesome: {
          text: ` and pierces them from the chest through ${ranChestOrgan()} and out the back`,
          fatal: true,
          dmgEffect: highWeapStuck() + highIntBleed('chest'),
        },
      },
      slash: {
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
          text: ' and cleaves through the torso from chest to navel',
          fatal: true,
          dmgEffect: highMajBleed(),
        },
      },
    },
  },
  hand: {
    weights: [6, 4, 6, 4, 4, 2, 6, 4],
    bilateral: true,
    crit_chance_multi: 1,
    max_impale: 0,
    injury: {
      blunt: {
        light: {
          text: ` and crushes the ${ranFinger()}`,
        },
        serious: {
          text: ' and breaks the wrist',
          dmgEffect: lowCompFract(),
        },
        critical: {
          text: ' and shatters the wrist',
          dmgEffect: lowCompFract(true, 'wrist'),
        },
        gruesome: {
          text: ' and crushes the hand into red pulp',
          dmgEffect: highMinBleed(),
        },
      },
      pierce: {
        light: {
          text: ' and severs a nerve',
          dmgEffect: lowMinBleed(),
        },
        serious: {
          text: ' and tears a tendon in the wrist',
          dmgEffect: lowMinBleed(),
        },
        critical: {
          text: ' and severs a bone',
          dmgEffect: lowMinBleed(),
        },
        gruesome: {
          text: ' and impales the wrist tearing a ligament',
          dmgEffect: lowWeapStuck() + highMinBleed(),
        },
      },
      slash: {
        light: {
          text: ' and severs the tendons on the back of the hand',
          dmgEffect: highMinBleed(),
        },
        serious: {
          text: ' and splits the wrist tearing a ligament',
          dmgEffect: highMinBleed(),
        },
        critical: {
          text: ` and severs the ${ranFinger()}`,
          dmgEffect: highMinBleed(),
        },
        gruesome: {
          text: ' and severs the hand at the wrist',
          dmgEffect: highMinBleed(),
          removal: true,
        },
      },
    },
  },
  forearm: {
    weights: [8, 4, 8, 4, 6, 2, 8, 6],
    bilateral: true,
    max_impale: 1,
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
          dmgEffect: highCompFract(true, 'forearm'),
        },
      },
      pierce: {
        light: {
          text: ' and tears the forearm muscle',
          dmgEffect: lowMinBleed(),
        },
        serious: {
          text: ' and severs a nerve in the forearm muscle',
          dmgEffect: lowMinBleed(),
        },
        critical: {
          text: ' and tears a tendon below the elbow',
          dmgEffect: lowWeapStuck() + highMinBleed(),
        },
        gruesome: {
          text: ` and shatters the ${ranForearmBone()}`,
          dmgEffect: highWeapStuck() + lowIntBleed('forearm'),
        },
      },
      slash: {
        light: {
          text: ' and gashes the forearm muscle',
          dmgEffect: highMinBleed(),
        },
        serious: {
          text: ' and severs a nerve in the forearm muscle',
          dmgEffect: highMinBleed(),
        },
        critical: {
          text: ` and severs the ${ranForearmBone()}`,
          dmgEffect: highMinBleed(),
        },
        gruesome: {
          text: ' and severs the arm below the elbow',
          dmgEffect: highMajBleed(),
          removal: true,
        },
      },
    },
  },
  elbow: {
    weights: [8, 4, 10, 6, 2, 2, 4, 2],
    crit_chance_multi: 2,
    max_impale: 1,
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
          text: ' and shatters the elbow',
          dmgEffect: lowCompFract(true, 'elbow'),
        },
        gruesome: {
          text: ' and mangles the elbow tearing the ligaments',
          // dmgEffect: highCompFract(true,'elbow'),
        },
      },
      pierce: {
        light: {
          text: ' and chips the ulnar bone',
        },
        serious: {
          text: ' and tears the biceps tendon',
          dmgEffect: lowMinBleed(),
        },
        critical: {
          text: ' and impales the elbow tearing a ligament',
          dmgEffect: lowWeapStuck() + lowMajBleed(),
        },
        gruesome: {
          text: ' and pierces the humerus',
          dmgEffect: highWeapStuck() + lowIntBleed('elbow'),
        },
      },
      slash: {
        light: {
          text: ' and gashes the elbow',
          dmgEffect: lowMinBleed(),
        },
        serious: {
          text: ' and splits the elbow tearing a ligament',
          dmgEffect: lowMinBleed(),
        },
        critical: {
          text: ' and severs the arm at the elbow!',
          removal: true,
          dmgEffect: highMajBleed(),
        },
        gruesome: {
          text: ' and cleaves through the arm at the elbow and into the gut!',
          removal: true,
          dmgEffect: highMajBleed(),
        },
      },
    },
  },
  'upper arm': {
    weights: [6, 4, 10, 8, 2, 2, 8, 6],
    crit_chance_multi: 1,
    max_impale: 1,
    bilateral: true,
    injury: {
      blunt: {
        light: {
          text: ' and tears muscle from bone',
        },
        serious: {
          text: ' and snaps the bone',
          dmgEffect: lowCompFract(),
        },
        critical: {
          text: ' and snaps the bone',
          dmgEffect: lowCompFract(true, 'upper arm'),
        },
        gruesome: {
          text: ' and shatters the bone!',
          dmgEffect: highCompFract(true, 'upper arm'),
        },
      },
      pierce: {
        light: {
          text: ` and gashes the muscle`,
          dmgEffect: lowMinBleed(),
        },
        serious: {
          text: ` and splits the muscle severing a nerve`,
          dmgEffect: lowMinBleed(),
        },
        critical: {
          text: ' and tears a tendon below the shoulder',
          dmgEffect: lowWeapStuck() + highMajBleed(),
        },
        gruesome: {
          text: ' and impales the upper arm shattering the bone!',
          dmgEffect: lowWeapStuck() + lowIntBleed('upper arm'),
        },
      },
      slash: {
        light: {
          text: ` and gashes the muscle`,
          dmgEffect: highMinBleed(),
        },
        serious: {
          text: ` and cleaves the muscle severing a nerve`,
          dmgEffect: highMinBleed(),
        },
        critical: {
          text: ` and cleaves the muscle chipping the bone`,
          dmgEffect: lowMajBleed() || highMinBleed(),
        },
        gruesome: {
          text: ' and severs the arm below the shoulder!',
          dmgEffect: highMajBleed(),
          removal: true,
        },
      },
    },
  },
  armpit: {
    weights: [2, 6, 4, 12, 2, 4, 4, 4],
    crit_chance_multi: 2,
    crit_dmg_multi: 2,
    max_impale: 2,
    bilateral: true,
    injury: {
      blunt: {
        light: {
          text: ' and cracks the collarbone',
        },
        serious: {
          text: ' and wrenches the arm from its socket',
        },
        critical: {
          text: ' and snaps the upper arm',
          dmgEffect: lowCompFract(true, 'armpit'),
        },
        gruesome: {
          text: ' and mangles the shoulder tearing the ligaments!',
          // dmgEffect: highCompFract(true,'shoulder'),
        },
      },
      pierce: {
        light: {
          text: ' and gashes the muscle',
          dmgEffect: lowMinBleed(),
        },
        serious: {
          text: ' and tears a tendon below the shoulder',
          dmgEffect: highMinBleed(),
        },
        critical: {
          text: ' and splits the armpit severing a nerve',
          dmgEffect: lowWeapStuck() + highMajBleed(),
        },
        gruesome: {
          text: ' and impales the body through the armpit!',
          dmgEffect: highWeapStuck() + lowIntBleed('armpit'),
        },
      },
      slash: {
        light: {
          text: ' and gashes the muscle',
          dmgEffect: highMinBleed(),
        },
        serious: {
          text: ' and cleaves into the muscle severing a nerve',
          dmgEffect: highMinBleed(),
        },
        critical: {
          text: ' and cleaves into the armpit severing a tendon',
          dmgEffect: lowMajBleed() || highMinBleed(),
        },
        gruesome: {
          text: ' and severs the arm at the shoulder!',
          dmgEffect: highMajBleed(),
          removal: true,
        },
      },
    },
  },
  shoulder: {
    weights: [8, 6, 12, 12, 2, 2, 6, 6],
    crit_chance_multi: 1,
    crit_dmg_multi: 2,
    max_impale: 2,
    bilateral: true,
    injury: {
      blunt: {
        light: {
          text: ' and cracks the collarbone',
        },
        serious: {
          text: ' and wrenches the arm from its socket',
        },
        critical: {
          text: ' and snaps the collarbone',
          dmgEffect: lowCompFract(true, 'shoulder'),
        },
        gruesome: {
          text: ' and mangles the shoulder tearing the ligaments!',
          // dmgEffect: highCompFract(true,'shoulder'),
        },
      },
      pierce: {
        light: {
          text: ' and gashes the muscle',
          dmgEffect: lowMinBleed(),
        },
        serious: {
          text: ' and splits the muscle tearing a tendon',
          dmgEffect: lowMinBleed(),
        },
        critical: {
          text: ' and pierces the shoulder tearing a ligament',
          dmgEffect: lowWeapStuck() + highMajBleed(),
        },
        gruesome: {
          text: ' and impales the body through the shoulder!',
          dmgEffect: highWeapStuck() + lowIntBleed('shoulder'),
        },
      },
      slash: {
        light: {
          text: ' and gashes the muscle',
          dmgEffect: highMinBleed(),
        },
        serious: {
          text: ' and cleaves muscle severing a nerve',
          dmgEffect: highMinBleed(),
        },
        critical: {
          text: ' and severs the collarbone',
          dmgEffect: lowMajBleed() || highMinBleed(),
        },
        gruesome: {
          text: ' and severs the arm at the shoulder!',
          dmgEffect: highMajBleed(),
          removal: true,
        },
      },
    },
  },
  neck: {
    weights: [3, 2, 6, 4, 2, 1, 4, 3],
    crit_chance_multi: 3,
    crit_dmg_multi: 2,
    max_impale: 2,
    injury: {
      blunt: {
        light: {
          text: ' and crushes the windpipe',
        },
        serious: {
          text: ' and wrenches the neck cracking the spine',
        },
        critical: {
          text: ' and snaps the neck severing the spine',
          dmgEffect: lowCompFract(true, 'neck'),
        },
        gruesome: {
          text: ' and mangles the neck tearing the ligaments!',
          // dmgEffect: highCompFract(true,'neck'), TODO
          fatal: true,
        },
      },
      pierce: {
        light: {
          text: ' and pierces the windpipe',
          dmgEffect: lowMinBleed(),
        },
        serious: {
          text: ' and splits the muscle severing a nerve',
          dmgEffect: lowMinBleed(),
        },
        critical: {
          text: ' and splits the muscle tearing a tendon',
          dmgEffect: lowWeapStuck() || highMajBleed(),
        },
        gruesome: {
          text: ' and stabs into the neck piercing the spine!',
          dmgEffect: highWeapStuck() + lowMajBleed(),
          fatal: true,
        },
      },
      slash: {
        light: {
          text: ' and gashes the muscle',
          dmgEffect: highMinBleed(),
        },
        serious: {
          text: ' and cleaves the muscle severing a nerve',
          dmgEffect: lowMajBleed() || highMinBleed(),
        },
        critical: {
          text: ' and cleaves the muscle chipping the spine',
          dmgEffect: highMajBleed() || highMinBleed(),
        },
        gruesome: {
          text: ' and severs the head!',
          dmgEffect: highMajBleed(),
          fatal: true,
          removal: true,
        },
      },
    },
  },
  jaw: {
    weights: [3, 2, 6, 3, 2, 1, 2, 2],
    crit_chance_multi: 2,
    max_impale: 2,
    injury: {
      blunt: {
        light: {
          text: ' and knocks out a tooth',
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
      pierce: {
        light: {
          text: ' and gouges the cheek',
          dmgEffect: highMinBleed(),
        },
        serious: {
          text: ' and breaks the teeth',
          dmgEffect: lowMinBleed(),
        },
        critical: {
          text: ' and stabs under the chin piercing the brainstem',
          dmgEffect: lowWeapStuck() + highBrainBleed(),
          fatal: true,
        },
        gruesome: {
          text: ' and impales the head through the jaw!',
          fatal: true,
          dmgEffect: highWeapStuck() + lowBrainBleed(),
        },
      },
      slash: {
        light: {
          text: ' and gashes the mouth',
          dmgEffect: highMinBleed(),
        },
        serious: {
          text: ' and splits the chin',
          dmgEffect: highMinBleed(),
        },
        critical: {
          text: ' and cleaves through the jaw and into the brain',
          dmgEffect: lowBrainBleed(),
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
  nose: {
    weights: [1, 2, 2, 3, 1, 0, 2, 1],
    crit_chance_multi: 3,
    crit_dmg_multi: 2,
    max_impale: 2,
    injury: {
      blunt: {
        light: {
          text: ' and breaks the nose',
          dmgEffect: lowMinBleed(),
        },
        serious: {
          text: ' and bruises the brain',
          dmgEffect: knockoutDesc,
        },
        critical: {
          text: ' and smashes the nose into the brain',
          dmgEffect: lowCompFract(),
          fatal: true,
        },
        gruesome: {
          text: gruesBluntHeadDesc,
          fatal: true,
          removal: true,
        },
      },
      pierce: {
        light: {
          text: ' and gouges the nose',
          dmgEffect: lowMinBleed(),
        },
        serious: {
          text: ' and splits the nose',
          dmgEffect: lowMinBleed(),
        },
        critical: {
          text: ' and stabs into the nose piercing the brain',
          dmgEffect: lowWeapStuck() + highBrainBleed('mouth'),
          fatal: true,
        },
        gruesome: {
          text: ' and impales the head through the nose!',
          dmgEffect: highWeapStuck() + lowBrainBleed('mouth'),
          fatal: true,
        },
      },
      slash: {
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
          dmgEffect: lowBrainBleed('mouth'),
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
    weights: [0, 2, 0, 4, 0, 2, 2, 2],
    crit_chance_multi: 5,
    crit_dmg_multi: 2,
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
      pierce: {
        light: {
          text: ' and gouges the brow',
          dmgEffect: highMinBleed(),
        },
        serious: {
          text: ' and gouges the eye from the socket',
          dmgEffect: lowMinBleed(),
        },
        critical: {
          text: ' and stabs into the eye piercing the brain',
          dmgEffect: lowWeapStuck() + highBrainBleed(),
          fatal: true,
        },
        gruesome: {
          text: ' and impales the head through the eye!',
          fatal: true,
          dmgEffect: highWeapStuck() + lowBrainBleed(),
        },
      },
      slash: {
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
          dmgEffect: lowBrainBleed(),
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
  ear: {
    weights: [4, 2, 8, 4, 2, 0, 2, 2],
    crit_chance_multi: 3,
    crit_dmg_multi: 2,
    max_impale: 3,
    bilateral: true,
    injury: {
      blunt: {
        light: {
          text: ' and pulps the ear',
          dmgEffect: knockoutDesc,
        },
        serious: {
          text: ' and ruptures the ear drum',
          dmgEffect: knockoutDesc,
        },
        critical: {
          text: ' and caves the side of the head into the brain',
          dmgEffect: lowCompFract(),
          fatal: true,
        },
        gruesome: {
          text: gruesBluntHeadDesc,
          fatal: true,
          removal: true,
        },
      },
      pierce: {
        light: {
          text: ' and gouges the ear',
          dmgEffect: lowMinBleed(),
        },
        serious: {
          text: ' and splits the ear',
          dmgEffect: highMinBleed(),
        },
        critical: {
          text: ' and stabs into the ear piercing the brain',
          dmgEffect: lowWeapStuck() + highBrainBleed(),
          fatal: true,
        },
        gruesome: {
          text: ' and impales the head through the ear!',
          fatal: true,
          dmgEffect: highWeapStuck() + lowBrainBleed(),
        },
      },
      slash: {
        light: {
          text: ' and gashes the ear',
          dmgEffect: highMinBleed(),
        },
        serious: {
          text: ' and severs the ear',
          dmgEffect: highMinBleed(),
        },
        critical: {
          text: ' and cleaves through the side of the head and into the brain',
          dmgEffect: lowBrainBleed(),
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
    weights: [5, 2, 12, 4, 2, 3, 7, 4],
    crit_chance_multi: 2,
    crit_dmg_multi: 3,
    max_impale: 3,
    injury: {
      blunt: {
        light: {
          text: ' and bruises the brain',
          dmgEffect: knockoutDesc, // TODO use flags instead of the whole description
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
      pierce: {
        light: {
          text: ' and gouges the scalp',
          dmgEffect: highMinBleed(),
        },
        serious: {
          text: ' and cracks the skull',
          dmgEffect: lowMinBleed(),
        },
        critical: {
          text: ' and stabs into the skull piercing the brain',
          dmgEffect: lowWeapStuck() + highBrainBleed(),
          fatal: true,
        },
        gruesome: {
          text: ' and impales the skull through the forehead',
          fatal: true,
          dmgEffect: highWeapStuck() + lowBrainBleed('nose'),
        },
      },
      slash: {
        light: {
          text: ' and gashes the scalp',
          dmgEffect: highMinBleed(),
        },
        serious: {
          text: ' and chips the skull',
          dmgEffect: highMinBleed(),
        },
        critical: {
          text: ' and cleaves through the skull and into the brain',
          dmgEffect: lowBrainBleed(),
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
  // no real bones, sever at critical level elbow, wrist and ankle, exclamation for gruesome
};
export const STANCE_MODS = {
  // TODO move this to combat file
  power: {
    ac_mod: -2,
    atk_mod: -2,
    dmg_mod: (weap) => Math.floor(weap.data.data.attributes.impact?.value / 2) || 0,
    str_dmg_mod: (char) => Math.floor(Math.max(0, char.data.data.str_mod) / 2) || 0, // TODO don't need
    impact_mod: (weap) => Math.floor(weap.data.data.attributes.impact?.value / 2) || 0,
    speed_mod: (weap) => 0 - Math.ceil(weap.data.data.attributes.speed?.value / 2) || 0,
  },
  fluid: {
    ac_mod: 1,
    atk_mod: 2,
    dmg_mod: (weap) => 0 - Math.ceil(weap.data.data.attributes.impact?.value / 2) || 0,
    str_dmg_mod: (char) => 0 - Math.ceil(Math.max(0, char.data.data.str_mod) / 2) || 0,
    impact_mod: (weap) => 0 - Math.ceil(weap.data.data.attributes.impact?.value / 2) || 0,
    speed_mod: (weap) => Math.floor(weap.data.data.attributes.speed?.value / 2) || 0,
    shield_dr_mod: 1,
    shield_ac_mod: 1,
    shield_atk_mod: -2,
  },
  counter: {
    ac_mod: -2,
  },
};
export const PREP_MODS = {
  feint: {
    atk_mod: (weap) => 0 - Math.ceil(weap.data.data.attributes.impact?.value / 2) || 0,
    speed_mod: (weap) => 0 - Math.ceil(weap.data.data.attributes.speed?.value / 2) || 0,
  },
};
export const WEAP_BREAK_CHANCE = 5;
export const GRID_SIZE = 5;
export const ATK_HEIGHTS = ['high', 'mid', 'low'];
export const AIM_AREAS = {
  head: ['skull', 'left eye', 'right eye', 'left ear', 'right ear', 'nose', 'jaw', 'neck'],
  shoulders: ['left shoulder', 'left armpit', 'right shoulder', 'right armpit'],
  arms: [
    'left upper arm',
    'left elbow',
    'left forearm',
    'left hand',
    'right upper arm',
    'right elbow',
    'right forearm',
    'right hand',
  ],
  torso: ['chest', 'gut'],
  pelvis: ['left hip', 'groin', 'right hip'],
  legs: ['left thigh', 'left knee', 'left shin', 'left foot', 'right thigh', 'right knee', 'right shin', 'right foot'],
};
export const AIM_AREAS_UNILATERAL = {
  head: ['skull', 'eye', 'ear', 'nose', 'jaw', 'neck'],
  shoulders: ['shoulder', 'armpit'],
  arms: ['upper arm', 'elbow', 'forearm', 'hand'],
  torso: ['chest', 'gut'],
  pelvis: ['hip', 'groin'],
  legs: ['thigh', 'knee', 'shin', 'foot'],
};
export const SHIELD_WEIGHT_MULTI = {
  worn: 1.2,
  medium_kite: 0.9,
  medium_round: 1,
  large_kite: 1.2,
  large_round: 1.33,
};
// populate hit location arrays on startup
export const HIT_LOC_ARRS = {
  SWING: [],
  THRUST: [],
};
(() => {
  const fillLocArr = function (loc, weight, bi) {
    const arr = [];
    for (let i = 0; i < weight; i++) {
      const entry = bi ? (i < weight / 2 ? `left ${loc}` : `right ${loc}`) : loc;
      arr.push(entry);
    }
    return arr;
  };

  // add more hit location tables for high/low
  Object.keys(HIT_LOC_ARRS).forEach((a) =>
    ['HIGH', 'LOW'].forEach((l) => Object.assign(HIT_LOC_ARRS, { [`${a}_${l}`]: [] }))
  );
  for (const [k, v] of Object.entries(HIT_LOCATIONS)) {
    Object.keys(HIT_LOC_ARRS).forEach((arr) => {
      const i = HIT_LOC_WEIGHT_INDEXES[arr];
      HIT_LOC_ARRS[arr].push(...fillLocArr(k, v.weights[i], v.bilateral));
    });
  }
  // add more hit location tables for the aim areas
  Object.keys(HIT_LOC_ARRS).forEach((a) =>
    Object.keys(AIM_AREAS).forEach((l) => {
      const key = `${a}_${l.toUpperCase()}`;
      const values = AIM_AREAS[l].map((loc) => HIT_LOC_ARRS[a].filter((hitLoc) => hitLoc === loc)).flat();
      Object.assign(HIT_LOC_ARRS, { [key]: values });
    })
  );

  console.log('Completed loading hit locations', HIT_LOC_ARRS);
})();
export const AIM_AREA_PENALTIES = Object.fromEntries(
  Object.entries(HIT_LOC_ARRS).map(([k, v]) => {
    const getPenalty = (chance) => 0 - Math.min(8, Math.round(Math.log(100 / chance) / Math.log(1.8)));
    return [k, getPenalty(v.length)];
  })
);
export const HEIGHT_AREAS = {
  low: ['foot', 'shin', 'knee', 'thigh', 'hip', 'groin'],
  mid: ['gut', 'chest', 'hand', 'forearm', 'elbow', 'upper arm'],
  high: ['armpit', 'shoulder', 'neck', 'jaw', 'nose', 'eye', 'ear', 'skull'],
};
export const MERCHANT_SUBTYPES = [
  'apothecary',
  'magic',
  'armorer',
  'clothier',
  'jeweller',
  'innkeeper',
  'general',
  'trader',
  'weaponsmith',
  'bowyer',
];

export const HUMANOID_TYPES = ['character', 'humanoid'];
export const NONCOMBATANT_TYPES = ['container', 'merchant'];
// CONST.ACTIVE_EFFECT_MODES = { CUSTOM: 0, MULTIPLY: 1, ADD: 2, DOWNGRADE: 3, UPGRADE: 4, OVERRIDE: 5 }
// top level prop transfer: true for item active effects to affect actors
// TODO add active effects sheet tabs to items/actors
export const STATUS_EFFECTS = [
  { id: 'dead', label: 'EFFECT.StatusDead', icon: 'icons/svg/skull.svg' },
  { id: 'unconscious', label: 'EFFECT.StatusUnconscious', icon: 'icons/svg/unconscious.svg' },
  { id: 'sleep', label: 'EFFECT.StatusAsleep', icon: 'icons/svg/sleep.svg' },
  {
    id: 'stun',
    label: 'EFFECT.StatusStunned',
    icon: 'icons/svg/daze.svg',
    duration: {
      rounds: null,
      seconds: 600,
      startRound: null, // item subtype?
      startTime: null,
      startTurn: null,
      turns: null,
    },
    changes: [
      {
        key: 'data.hp.max',
        mode: 2,
        value: '-9',
      },
    ],
  },
  { id: 'prone', label: 'EFFECT.StatusProne', icon: 'icons/svg/falling.svg' },
  { id: 'restrain', label: 'EFFECT.StatusRestrained', icon: 'icons/svg/net.svg' },
  { id: 'paralysis', label: 'EFFECT.StatusParalysis', icon: 'icons/svg/paralysis.svg' },
  { id: 'fly', label: 'EFFECT.StatusFlying', icon: 'icons/svg/wing.svg' },
  { id: 'blind', label: 'EFFECT.StatusBlind', icon: 'icons/svg/blind.svg' },
  { id: 'deaf', label: 'EFFECT.StatusDeaf', icon: 'icons/svg/deaf.svg' },
  { id: 'silence', label: 'EFFECT.StatusSilenced', icon: 'icons/svg/silenced.svg' },
  { id: 'fear', label: 'EFFECT.StatusFear', icon: 'icons/svg/terror.svg' },
  { id: 'burning', label: 'EFFECT.StatusBurning', icon: 'icons/svg/fire.svg' },
  { id: 'frozen', label: 'EFFECT.StatusFrozen', icon: 'icons/svg/frozen.svg' },
  { id: 'shock', label: 'EFFECT.StatusShocked', icon: 'icons/svg/lightning.svg' },
  { id: 'corrode', label: 'EFFECT.StatusCorrode', icon: 'icons/svg/acid.svg' },
  { id: 'bleeding', label: 'EFFECT.StatusBleeding', icon: 'icons/svg/blood.svg' },
  { id: 'disease', label: 'EFFECT.StatusDisease', icon: 'icons/svg/biohazard.svg' },
  { id: 'poison', label: 'EFFECT.StatusPoison', icon: 'icons/svg/poison.svg' },
  { id: 'radiation', label: 'EFFECT.StatusRadiation', icon: 'icons/svg/radiation.svg' },
  { id: 'regen', label: 'EFFECT.StatusRegen', icon: 'icons/svg/regen.svg' },
  { id: 'degen', label: 'EFFECT.StatusDegen', icon: 'icons/svg/degen.svg' },
  { id: 'upgrade', label: 'EFFECT.StatusUpgrade', icon: 'icons/svg/upgrade.svg' },
  { id: 'downgrade', label: 'EFFECT.StatusDowngrade', icon: 'icons/svg/downgrade.svg' },
  { id: 'target', label: 'EFFECT.StatusTarget', icon: 'icons/svg/target.svg' },
  { id: 'eye', label: 'EFFECT.StatusMarked', icon: 'icons/svg/eye.svg' },
  { id: 'curse', label: 'EFFECT.StatusCursed', icon: 'icons/svg/sun.svg' },
  { id: 'bless', label: 'EFFECT.StatusBlessed', icon: 'icons/svg/angel.svg' },
  { id: 'fireShield', label: 'EFFECT.StatusFireShield', icon: 'icons/svg/fire-shield.svg' },
  { id: 'coldShield', label: 'EFFECT.StatusIceShield', icon: 'icons/svg/ice-shield.svg' },
  { id: 'magicShield', label: 'EFFECT.StatusMagicShield', icon: 'icons/svg/mage-shield.svg' },
  { id: 'holyShield', label: 'EFFECT.StatusHolyShield', icon: 'icons/svg/holy-shield.svg' },
];
export const HIDDEN_GROUPS = ['admin', 'dmg_mods', 'immunities'];
export const MAGIC_GROUPS = ['magic_dmg', 'magic_mods'];
export const GEM_BASE_VALUE = {
  ornamental: 60, // e.g. agate, lapis lazuli, obsidian, turquoise, malachite
  'semi-precious': 1200, // e.g. peridot, topaz, garnet, pearl, amethyst
  precious: 12000, // e.g. diamond, ruby, sapphire, emerald, opal
};
export const GEM_DEFAULT_WEIGHT = 0.1;
export const GEM_QUALITY_ADJ = {
  AAA: 4,
  AA: 2.8,
  A: 2,
  B: 1.4,
  C: 1,
};
export const GEM_WEIGHT_ADJ = (ratio) => ratio ** 2;
