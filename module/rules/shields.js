export const SHIELD_TYPES = Object.freeze({
  M: 'medium',
  L: 'large',
});

export const allShields = Object.freeze(Object.values(SHIELD_TYPES));

export const SHIELD_WEIGHT_MULTI = {
  worn: 1.2,
  medium_kite: 0.9,
  medium_round: 1,
  large_kite: 1.2,
  large_round: 1.33,
};

export const SHIELD_COVERAGE = {
  round: {
    L: {
      high: 'skull,eye,ear,nose,jaw,neck,shoulder,armpit,upper arm,elbow,forearm,hand,chest,abdomen', // TODO make shield high guard -4 atk for being blind
      mid: 'jaw,neck,shoulder,armpit,upper arm,elbow,forearm,hand,chest,abdomen,groin,hip,thigh', // TODO make sure weight is always computed from M coverage
      low: 'elbow,forearm,hand,abdomen,groin,hip,thigh,knee,shin',
    },
    M: {
      high: 'skull,eye,ear,nose,jaw,neck,shoulder,forearm,hand',
      mid: 'armpit,upper arm,elbow,forearm,hand,chest,abdomen',
      low: 'elbow,forearm,hand,abdomen,groin,hip,thigh',
    },
  },
  kite: {
    L: {
      high: 'skull,eye,ear,nose,jaw,neck,shoulder,armpit,upper arm,elbow,forearm,hand,chest,abdomen,groin',
      mid: 'jaw,neck,shoulder,armpit,upper arm,elbow,forearm,hand,chest,abdomen,groin,thigh,knee',
      low: 'elbow,forearm,hand,abdomen,groin,hip,thigh,knee,shin,foot',
    },
    M: {
      high: 'skull,eye,ear,nose,jaw,neck,shoulder,forearm,hand,chest',
      mid: 'shoulder,armpit,upper arm,elbow,forearm,hand,chest,abdomen,groin',
      low: 'elbow,forearm,hand,abdomen,groin,thigh',
    },
  },
  tower: {
    L: {
      // TODO can't be used on horseback
      high: 'skull,eye,ear,nose,jaw,neck,shoulder,armpit,upper arm,elbow,forearm,hand,chest,abdomen,groin,hip',
      mid: 'neck,shoulder,armpit,upper arm,elbow,forearm,hand,chest,abdomen,groin,hip,thigh,knee',
      low: 'elbow,forearm,hand,abdomen,groin,hip,thigh,knee,shin,foot',
    },
    M: {
      high: 'skull,eye,ear,nose,jaw,neck,shoulder,armpit,upper arm,elbow,forearm,hand,chest,abdomen',
      mid: 'shoulder,armpit,upper arm,elbow,forearm,hand,chest,abdomen,groin,hip',
      low: 'elbow,forearm,hand,abdomen,groin,hip,thigh,knee',
    },
  },
};
