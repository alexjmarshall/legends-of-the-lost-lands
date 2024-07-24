import { randomChoice } from '../helper.js';
import { PHYSICAL_DMG_TYPES, ATK_HEIGHTS } from './attack-and-damage.js';

const { BLUNT, PIERCE, SLASH } = PHYSICAL_DMG_TYPES;

export const HIT_LOCATIONS = Object.freeze({
  FOOT: 'foot',
  SHIN: 'shin',
  KNEE: 'knee',
  THIGH: 'thigh',
  HIP: 'hip',
  ABDOMEN: 'abdomen',
  CHEST: 'chest',
  HAND: 'hand',
  FOREARM: 'forearm',
  ELBOW: 'elbow',
  UPPER_ARM: 'upperarm',
  SHOULDER: 'shoulder',
  NECK: 'neck',
  JAW: 'jaw',
  NOSE: 'nose',
  EYE: 'eye',
  EAR: 'ear',
  SKULL: 'skull',
});

export const HIT_LOCATION_LIST = Object.values(HIT_LOCATIONS);

const {
  FOOT,
  SHIN,
  KNEE,
  THIGH,
  HIP,
  ABDOMEN,
  CHEST,
  HAND,
  FOREARM,
  ELBOW,
  UPPER_ARM,
  SHOULDER,
  NECK,
  JAW,
  NOSE,
  EYE,
  EAR,
  SKULL,
} = HIT_LOCATIONS;

export const HEIGHT_AREAS = {
  [ATK_HEIGHTS.LOW]: [FOOT, SHIN, KNEE, THIGH, HIP],
  [ATK_HEIGHTS.MID]: [ABDOMEN, CHEST, HAND, FOREARM, ELBOW, UPPER_ARM],
  [ATK_HEIGHTS.HIGH]: [SHOULDER, NECK, JAW, NOSE, EYE, EAR, SKULL],
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

const ranToe = () => randomChoice(['big', 'long', 'middle', 'ring', 'little']);
const ranOrifice = () => randomChoice(['nose', 'mouth', 'ears']);
const ranFinger = () => randomChoice(['thumb', 'index finger', 'middle finger', 'ring finger', 'pinky finger']);
const ranShinBone = () => randomChoice(['fibula', 'tibia']);
const ranForearmBone = () => randomChoice(['ulnar bone', 'radial bone']);
const ranArmMuscle = () => randomChoice(['triceps', 'biceps']);
const ranThighMuscle = () => randomChoice(['quadriceps', 'quadriceps', 'hamstrings']);
const ranChestBone = () => randomChoice(['a rib', 'the sternum']);
const ranOrgan = () => randomChoice(['the liver', 'the spleen', 'a kidney', 'the bowels', 'the spine']);
const ranChestOrgan = () => randomChoice(['a lung', 'the heart']);
const ranAbdomenBone = () => randomChoice(['a rib', 'the back']);
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
  SWING: 0,
  THRUST: 1,
  SWING_HIGH: 2,
  THRUST_HIGH: 3,
  SWING_LOW: 4,
  THRUST_LOW: 5,
  WEIGHT_WORN: 6,
  WEIGHT_UNWORN: 7,
};

export const hitLocations = {
  [FOOT]: {
    weights: [2, 2, 0, 0, 6, 6, 10, 4],
    bilateral: true,
    soft: false, // if soft, blunt DR of 1 for size M+
    max_impale: 1,
    impale_multi: {
      [BLUNT]: 0,
      [PIERCE]: 0.5,
      [SLASH]: 0.5,
    },
    bleed_mod: 1, // apply to cutting roll to determine bleed, positive is easier bleed
    major_bleed: '1d3+1', // bleed has to be at least 1d4+1 to be described as spurting
    injury: {
      [BLUNT]: {
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
      [PIERCE]: {
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
      [SLASH]: {
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
    amputated: [FOOT],
  },
  [SHIN]: {
    weights: [6, 4, 0, 0, 14, 8, 16, 8],
    bilateral: true,
    soft: false,
    max_impale: 2,
    impale_multi: {
      [BLUNT]: 0,
      [PIERCE]: 1,
      [SLASH]: 0.5,
    },
    bleed_mod: 0,
    major_bleed: '1d3+1',
    injury: {
      [BLUNT]: {
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
      [PIERCE]: {
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
      [SLASH]: {
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
    amputated: [FOOT, SHIN],
  },
  [KNEE]: {
    weights: [8, 4, 0, 0, 14, 8, 8, 4],
    bilateral: true,
    soft: false,
    max_impale: 2,
    impale_multi: {
      [BLUNT]: 0,
      [PIERCE]: 0.5,
      [SLASH]: 0.5,
    },
    bleed_mod: 0,
    major_bleed: '1d5+1',
    injury: {
      [BLUNT]: {
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
      [PIERCE]: {
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
      [SLASH]: {
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
    amputated: [FOOT, SHIN, KNEE],
  },
  [THIGH]: {
    weights: [8, 10, 2, 2, 16, 20, 14, 10],
    bilateral: true,
    soft: true,
    max_impale: 4,
    impale_multi: {
      [BLUNT]: 0,
      [PIERCE]: 1,
      [SLASH]: 0.5,
    },
    bleed_mod: -1,
    major_bleed: '1d8+1',
    injury: {
      [BLUNT]: {
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
      [PIERCE]: {
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
      [SLASH]: {
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
    amputated: [FOOT, SHIN, KNEE, THIGH],
  },
  [HIP]: {
    weights: [8, 8, 4, 2, 16, 16, 8, 10],
    bilateral: true,
    soft: false,
    max_impale: 3,
    impale_multi: {
      [BLUNT]: 0,
      [PIERCE]: 1,
      [SLASH]: 0.5,
    },
    bleed_mod: 0,
    major_bleed: '1d8+1',
    injury: {
      [BLUNT]: {
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
      [PIERCE]: {
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
      [SLASH]: {
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
    amputated: [FOOT, SHIN, KNEE, THIGH, HIP],
  },
  [HAND]: {
    weights: [6, 4, 6, 4, 4, 2, 8, 4],
    bilateral: true,
    soft: false,
    max_impale: 1,
    impale_multi: {
      [BLUNT]: 0,
      [PIERCE]: 0.5,
      [SLASH]: 0.5,
    },
    bleed_mod: 1,
    major_bleed: '1d3+1',
    injury: {
      [BLUNT]: {
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
      [PIERCE]: {
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
      [SLASH]: {
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
    amputated: [HAND],
  },
  [FOREARM]: {
    weights: [8, 6, 8, 6, 4, 2, 10, 6],
    bilateral: true,
    soft: true,
    max_impale: 1,
    impale_multi: {
      [BLUNT]: 0,
      [PIERCE]: 1,
      [SLASH]: 0.5,
    },
    bleed_mod: 0,
    major_bleed: '1d3+1',
    injury: {
      [BLUNT]: {
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
      [PIERCE]: {
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
      [SLASH]: {
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
    amputated: [HAND, FOREARM],
  },
  [ELBOW]: {
    weights: [6, 4, 8, 6, 2, 2, 4, 2],
    bilateral: true,
    soft: false,
    max_impale: 1,
    impale_multi: {
      [BLUNT]: 0,
      [PIERCE]: 0.5,
      [SLASH]: 0.5,
    },
    bleed_mod: 0,
    major_bleed: '1d4+1',
    injury: {
      [BLUNT]: {
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
      [PIERCE]: {
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
      [SLASH]: {
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
          text: ' and cleaves through the arm at the elbow and into the abdomen!',
          removal: true,
          dmgEffect: highMajBleed(),
        },
      },
    },
    amputated: [HAND, FOREARM, ELBOW],
  },
  [UPPER_ARM]: {
    weights: [6, 4, 10, 10, 2, 2, 8, 6],
    bilateral: true,
    soft: true,
    max_impale: 2,
    impale_multi: {
      [BLUNT]: 0,
      [PIERCE]: 1,
      [SLASH]: 0.5,
    },
    bleed_mod: -1,
    major_bleed: '1d6+1',
    injury: {
      [BLUNT]: {
        light: {
          text: ' and tears muscle from bone',
        },
        serious: {
          text: ' and snaps the bone',
          dmgEffect: lowCompFract(),
        },
        critical: {
          text: ' and snaps the bone',
          dmgEffect: lowCompFract(true, 'upperarm'),
        },
        gruesome: {
          text: ' and shatters the bone!',
          dmgEffect: highCompFract(true, 'upperarm'),
        },
      },
      [PIERCE]: {
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
      [SLASH]: {
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
    amputated: [HAND, FOREARM, ELBOW, UPPER_ARM],
  },
  [ABDOMEN]: {
    weights: [10, 18, 6, 12, 18, 25, 6, 14],
    soft: true,
    max_impale: 5,
    impale_multi: {
      [BLUNT]: 0,
      [PIERCE]: 1.5,
      [SLASH]: 0.5,
    },
    bleed_mod: -2,
    major_bleed: '1d8+1',
    injury: {
      [BLUNT]: {
        light: {
          text: ` and bruises ${ranOrgan()}`,
          dmgEffect: lowIntBleed('abdomen'),
        },
        serious: {
          text: ` and breaks ${ranAbdomenBone()}`,
          dmgEffect: lowIntBleed('abdomen'),
        },
        critical: {
          text: ` and crushes the ribs into ${ranOrgan()}`,
          dmgEffect: highIntBleed('abdomen'),
        },
        gruesome: {
          text: ' and breaks the back severing the spine', // TODO paralysis desc
        },
      },
      [PIERCE]: {
        light: {
          text: ' and gouges the abdomen',
          dmgEffect: lowMinBleed(),
        },
        serious: {
          text: ' and penetrates the abdomen and gouges the bowels',
          dmgEffect: lowMinBleed() || lowIntBleed('abdomen'),
        },
        critical: {
          text: ` and penetrates the abdomen and pierces ${ranOrgan()}`,
          dmgEffect: lowWeapStuck() + highIntBleed('abdomen'),
        },
        gruesome: {
          text: ` and pierces them from the abdomen through ${ranOrgan()} and out the back`,
          fatal: true,
          dmgEffect: highWeapStuck() + highIntBleed('abdomen'),
        },
      },
      [SLASH]: {
        light: {
          text: ' and gashes the abdomen',
          dmgEffect: highMinBleed(),
        },
        serious: {
          text: ' and tears through the abdomen gashing the bowels',
          dmgEffect: highMinBleed() || lowIntBleed('abdomen'),
        },
        critical: {
          text: ` and cleaves into the abdomen and eviscerates ${ranOrgan()}`,
          fatal: true,
          dmgEffect: lowIntBleed('abdomen') || highMinBleed(),
        },
        gruesome: {
          text: ' and cleaves the body in two at the waist',
          fatal: true,
          removal: true,
          dmgEffect: highMajBleed(),
        },
      },
    },
    amputated: [FOOT, SHIN, KNEE, THIGH, HIP, ABDOMEN],
  },
  [CHEST]: {
    weights: [6, 14, 8, 18, 2, 7, 5, 9],
    soft: false,
    max_impale: 4,
    impale_multi: {
      [BLUNT]: 0,
      [PIERCE]: 2,
      [SLASH]: 0.5,
    },
    bleed_mod: -1,
    major_bleed: '1d10+1',
    major_bleed_exclude_dmg_type: [BLUNT, SLASH],
    injury: {
      [BLUNT]: {
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
      [PIERCE]: {
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
      [SLASH]: {
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
    amputated: [FOOT, SHIN, KNEE, THIGH, HIP, ABDOMEN, CHEST],
  },
  [SHOULDER]: {
    weights: [10, 8, 14, 14, 2, 2, 6, 8],
    bilateral: true,
    soft: false,
    max_impale: 3,
    impale_multi: {
      [BLUNT]: 0,
      [PIERCE]: 1.5,
      [SLASH]: 0.5,
    },
    bleed_mod: -1,
    major_bleed: '1d6+1',
    injury: {
      [BLUNT]: {
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
      [PIERCE]: {
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
      [SLASH]: {
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
    amputated: [HAND, FOREARM, ELBOW, UPPER_ARM, SHOULDER],
  },
  [NECK]: {
    weights: [3, 3, 6, 4, 0, 0, 3, 3],
    soft: true,
    max_impale: 3,
    impale_multi: {
      [BLUNT]: 0.5,
      [PIERCE]: 1.5,
      [SLASH]: 1,
    },
    bleed_mod: 1,
    major_bleed: '1d10+1',
    injury: {
      [BLUNT]: {
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
      [PIERCE]: {
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
      [SLASH]: {
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
    amputated: [NECK, SKULL],
  },
  [JAW]: {
    weights: [3, 2, 4, 4, 0, 0, 2, 2],
    soft: false,
    max_impale: 2,
    impale_multi: {
      [BLUNT]: 0.5,
      [PIERCE]: 0.5,
      [SLASH]: 0.5,
    },
    bleed_mod: 1,
    major_bleed: '1d4+1',
    injury: {
      [BLUNT]: {
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
      [PIERCE]: {
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
      [SLASH]: {
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
    amputated: [JAW],
  },
  [NOSE]: {
    weights: [1, 2, 2, 4, 0, 0, 2, 2],
    soft: false,
    max_impale: 2,
    impale_multi: {
      [BLUNT]: 0.5,
      [PIERCE]: 1,
      [SLASH]: 0.5,
    },
    bleed_mod: 1,
    major_bleed: '1d3+1',
    injury: {
      [BLUNT]: {
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
      [PIERCE]: {
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
      [SLASH]: {
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
    amputated: [NOSE],
  },
  [EYE]: {
    weights: [0, 2, 2, 4, 0, 0, 2, 2],
    bilateral: true,
    soft: false,
    max_impale: 4,
    impale_multi: {
      [BLUNT]: 0.5,
      [PIERCE]: 2,
      [SLASH]: 1,
    },
    bleed_mod: 2,
    major_bleed: '1d3+1',
    injury: {
      [BLUNT]: {
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
      [PIERCE]: {
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
      [SLASH]: {
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
    amputated: [EYE],
  },
  [EAR]: {
    weights: [4, 2, 8, 4, 0, 0, 2, 2],
    bilateral: true,
    soft: false,
    max_impale: 3,
    impale_multi: {
      [BLUNT]: 0.5,
      [PIERCE]: 0.5,
      [SLASH]: 0.5,
    },
    bleed_mod: 1,
    major_bleed: '1d3+1',
    injury: {
      [BLUNT]: {
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
      [PIERCE]: {
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
      [SLASH]: {
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
    amputated: [EAR],
  },
  [SKULL]: {
    weights: [5, 3, 12, 6, 0, 0, 6, 4],
    soft: false,
    max_impale: 3,
    impale_multi: {
      [BLUNT]: 0.5,
      [PIERCE]: 0.5,
      [SLASH]: 0.5,
    },
    bleed_mod: 1,
    major_bleed: '1d3+1',
    injury: {
      [BLUNT]: {
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
      [PIERCE]: {
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
      [SLASH]: {
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
    amputated: [SKULL],
  },
  // TODO sever at critical level elbow, wrist and ankle, exclamation for gruesome
  // TODO injury threshold derived 4, 7, 10, +1 every 10 max HP?
  // disabled = -4 or worse, or permanent if amputation unless prosthetic
  // derived disabled from amputation items vs. prosthetic items
  // all we need to worry about is how to handle hook and peg leg?
  // prosthetic item can have ITS OWN active effect! -- removes disabled prop when worn, but adds maluses
};

// TODO back of knee, inside of elbow, armpit and groin are 'weak points' to skip bulky armor.
export const AIM_AREAS = {
  head: {
    bloodied_desc: 'their vision swims',
    hitLocations: [SKULL, `left ${EYE}`, `right ${EYE}`, `left ${EAR}`, `right ${EAR}`, NOSE, JAW, NECK],
  },
  left_arm: {
    bloodied_desc: 'their left arm is numb with pain',
    hitLocations: [`left ${SHOULDER}`, `left ${UPPER_ARM}`, `left ${ELBOW}`, `left ${FOREARM}`, `left ${HAND}`],
  },
  right_arm: {
    bloodied_desc: 'their right arm is numb with pain',
    hitLocations: [`right ${SHOULDER}`, `right ${UPPER_ARM}`, `right ${ELBOW}`, `right ${FOREARM}`, `right ${HAND}`],
  },
  chest: {
    bloodied_desc: 'they have trouble breathing',
    hitLocations: [CHEST],
  },
  abdomen: {
    bloodied_desc: 'they double over in pain',
    hitLocations: [ABDOMEN],
  },
  left_leg: {
    bloodied_desc: 'their left leg is numb with pain',
    hitLocations: [`left ${HIP}`, `left ${THIGH}`, `left ${KNEE}`, `left ${SHIN}`, `left ${FOOT}`],
  },
  right_leg: {
    bloodied_desc: 'their right leg is numb with pain',
    hitLocations: [`right ${HIP}`, `right ${THIGH}`, `right ${KNEE}`, `right ${SHIN}`, `right ${FOOT}`],
  },
};

// populate hit location arrays on startup
export const HIT_LOC_ARRS = {
  SWING: [],
  SWING_HIGH: [],
  SWING_LOW: [],
  THRUST: [],
  THRUST_HIGH: [],
  THRUST_LOW: [],
};
(() => {
  const fillLocArr = function (loc, weight) {
    const arr = [];
    for (let i = 0; i < weight; i++) {
      arr.push(loc);
    }
    return arr;
  };

  for (const [k, v] of Object.entries(hitLocations)) {
    Object.keys(HIT_LOC_ARRS).forEach((arr) => {
      const i = HIT_LOC_WEIGHT_INDEXES[arr];
      HIT_LOC_ARRS[arr].push(...fillLocArr(k, v.weights[i]));
    });
  }

  console.log('Completed loading hit locations', HIT_LOC_ARRS);
})();

export const AIM_AREA_PENALTIES = Object.fromEntries(
  Object.entries(HIT_LOC_ARRS).map(([k, v]) => {
    const getPenalty = (chance) => 0 - Math.min(8, Math.round(Math.log(100 / chance) / Math.log(1.8)));
    return [k, getPenalty(v.length)];
  })
);
