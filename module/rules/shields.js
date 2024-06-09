import { HIT_LOCATIONS } from './hit-locations.js';

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

export const SHIELD_TYPES = Object.freeze({
  M: 'medium',
  L: 'large',
});

export const allShields = Object.freeze(Object.values(SHIELD_TYPES));

export const SHIELD_WEIGHT_WORN_MULTI = 1.2;

// TODO make shield high guard -4 atk for being blind
export const SHIELD_COVERAGE = {
  round: {
    L: {
      // TODO can't be used on horseback, can be used in shield wall
      high: [SKULL, EYE, EAR, NOSE, JAW, NECK, SHOULDER, UPPER_ARM, ELBOW, FOREARM, HAND, CHEST],
      mid: [JAW, NECK, SHOULDER, UPPER_ARM, ELBOW, FOREARM, HAND, CHEST, ABDOMEN, HIP],
      low: [ELBOW, FOREARM, HAND, ABDOMEN, HIP, THIGH, KNEE, SHIN],
      weight_multi: 1.2,
    },
    M: {
      high: [SKULL, EYE, EAR, NOSE, JAW, NECK, SHOULDER, FOREARM, HAND, CHEST],
      mid: [UPPER_ARM, ELBOW, FOREARM, HAND, CHEST, ABDOMEN],
      low: [FOREARM, HAND, ABDOMEN, HIP, THIGH],
      weight_multi: 1,
    },
  },
  kite: {
    L: {
      high: [SKULL, EYE, EAR, NOSE, JAW, NECK, SHOULDER, UPPER_ARM, ELBOW, FOREARM, HAND, CHEST, ABDOMEN],
      mid: [JAW, NECK, SHOULDER, UPPER_ARM, ELBOW, FOREARM, HAND, CHEST, ABDOMEN, HIP, THIGH],
      low: [ELBOW, FOREARM, HAND, ABDOMEN, HIP, THIGH, KNEE, SHIN, FOOT],
      weight_multi: 1,
    },
    M: {
      high: [SKULL, EYE, EAR, NOSE, JAW, NECK, SHOULDER, UPPER_ARM, FOREARM, HAND, CHEST],
      mid: [SHOULDER, UPPER_ARM, ELBOW, FOREARM, HAND, CHEST, ABDOMEN],
      low: [FOREARM, HAND, ABDOMEN, HIP, THIGH, KNEE],
      weight_multi: 1,
    },
  },
  tower: {
    L: {
      // TODO can't be used on horseback
      high: [SKULL, EYE, EAR, NOSE, JAW, NECK, SHOULDER, UPPER_ARM, ELBOW, FOREARM, HAND, CHEST, ABDOMEN, HIP],
      mid: [JAW, NECK, SHOULDER, UPPER_ARM, ELBOW, FOREARM, HAND, CHEST, ABDOMEN, HIP, THIGH, KNEE],
      low: [UPPER_ARM, ELBOW, FOREARM, HAND, ABDOMEN, HIP, THIGH, KNEE, SHIN, FOOT],
      weight_multi: 1.1,
    },
    M: {
      high: [SKULL, EYE, EAR, NOSE, JAW, NECK, SHOULDER, UPPER_ARM, ELBOW, FOREARM, HAND, CHEST],
      mid: [SHOULDER, UPPER_ARM, ELBOW, FOREARM, HAND, CHEST, ABDOMEN, HIP],
      low: [ELBOW, FOREARM, HAND, ABDOMEN, HIP, THIGH, KNEE],
      weight_multi: 1.1,
    },
  },
};
