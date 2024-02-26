import { SIZES as actorSizes } from '../helper/actor.js';

export const sizes = Object.freeze({
  [actorSizes.TINY]: {
    hpModifier: -1,
  },
  [actorSizes.SMALL]: {
    hpModifier: 0,
  },
  [actorSizes.MEDIUM]: {
    hpModifier: 0,
  },
  [actorSizes.LARGE]: {
    hpModifier: 1,
  },
});
