import { randomChoice, removeDuplicates } from '../helper.js';
import { SKILLS } from './skills.js';

export const RUNES = Object.freeze({
  ALE_RUNE: 'Ale-Rune',
  BEAST_RUNE: 'Beast-Rune',
  BERSERK_RUNE: 'Berserk-Rune',
  CATCH_RUNE: 'Catch-Rune',
  CHANGE_RUNE: 'Change-Rune',
  CHARM_RUNE: 'Charm-Rune',
  DEAD_RUNE: 'Dead-Rune',
  DISEASE_RUNE: 'Disease-Rune',
  FORTUNE_RUNE: 'Fortune-Rune',
  HELP_RUNE: 'Help-Rune',
  IRON_CANT_BITE_RUNE: "Iron-Can't-Bite-Rune",
  LIMB_RUNE: 'Limb-Rune',
  LORE_RUNE: 'Lore-Rune',
  LUCK_RUNE: 'Luck-Rune',
  NIS_RUNE: 'Nis-Rune',
  QUENCH_RUNE: 'Quench-Rune',
  SEA_RUNE: 'Sea-Rune',
  SHIELD_RUNE: 'Shield-Rune',
  SHOUT_RUNE: 'Shout-Rune',
  SIGHT_RUNE: 'Sight-Rune',
  SPEECH_RUNE: 'Speech-Rune',
  STRENGTH_RUNE: 'Strength-Rune',
  TRIUMPH_RUNE: 'Triumph-Rune',
  WATER_RUNE: 'Water-Rune',
});

export const getStartingRunesKnown = (classInstance) => {
  const classSkills = Object.values(classInstance.skills).flat();
  if (classInstance.lvl === 1 && classSkills.includes(SKILLS.RUNELORE)) {
    // return 2 random runes
    return removeDuplicates([randomChoice(Object.values(RUNES)), randomChoice(Object.values(RUNES))]);
  }
  return [];
};
