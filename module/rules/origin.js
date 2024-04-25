import { deepFreeze } from '../helper.js';
import { rollDice } from '../dice.js';
import { SKILLS } from './skills.js';

export const ORIGINS = Object.freeze({
  WILDLING: 'Wildling',
  URCHIN: 'Urchin',
  SERF: 'Serf',
  FARMER: 'Farmer',
  BUILDER: 'Builder',
  BLACKSMITH: 'Blacksmith',
  MINER: 'Miner',
  HEALER: 'Healer',
  SAILOR: 'Sailor',
  TAILOR: 'Tailor',
  BOWYER: 'Bowyer',
  INNKEEPER: 'Innkeeper',
  MINSTREL: 'Minstrel',
  SAGE: 'Sage',
  ACOLYTE: 'Acolyte',
  MERCHANT: 'Merchant',
  HERALD: 'Herald',
  COURTIER: 'Courtier',
  LANDLESS_NOBLE: 'Landless Noble',
});

export const origins = deepFreeze({
  [ORIGINS.WILDLING]: {
    description: 'You were raised in the wilderness, far from civilization.',
    skills: [SKILLS.FIRECRAFT, SKILLS.HUNTING, SKILLS.FORAGING, SKILLS.RUNNING],
    hpBonus: 2,
    startingSp: '1d6 x 10',
    startingWealth: () => rollDice('1d6') * 10,
  },
  [ORIGINS.URCHIN]: {
    description: 'You grew up on the streets, learning to survive by any means necessary.',
    skills: [SKILLS.INTIMIDATION, SKILLS.DECEPTION, SKILLS.SNEAKING, SKILLS.HAND_TO_HAND],
    hpBonus: 2,
    startingSp: '1d6 x 10',
    startingWealth: () => rollDice('1d6') * 10,
  },
  [ORIGINS.SERF]: {
    description:
      'You were born into serfdom, working the land for a lord. You are used to hard work and little reward.',
    skills: [SKILLS.FARMING, SKILLS.RUNNING, SKILLS.FORAGING, SKILLS.COOKERY],
    hpBonus: 2,
    startingSp: '1d6 x 10',
    startingWealth: () => rollDice('1d6') * 10,
  },
  [ORIGINS.FARMER]: {
    description: 'Your family owned a small farm, and you learned to till the land and care for animals.',
    skills: [SKILLS.FARMING, SKILLS.ANIMAL_HANDLING, SKILLS.LEATHERWORKING, SKILLS.COOKERY],
    hpBonus: 1,
    startingSp: '2d6 x 10',
    startingWealth: () => rollDice('2d6') * 10,
  },
  [ORIGINS.BUILDER]: {
    description: 'You labored as a builder, constructing homes and other structures.',
    skills: [SKILLS.WOODWORKING, SKILLS.STONEWORKING],
    hpBonus: 1,
    startingSp: '2d6 x 10',
    startingWealth: () => rollDice('2d6') * 10,
  },
  [ORIGINS.BLACKSMITH]: {
    description: 'You apprenticed under a blacksmith, learning the trade and how to work with metal.',
    skills: [SKILLS.BLACKSMITHING, SKILLS.TRADING],
    hpBonus: 1,
    startingSp: '2d6 x 10',
    startingWealth: () => rollDice('2d6') * 10,
  },
  [ORIGINS.MINER]: {
    description: 'You toiled in the mines, digging for precious metals and gems.',
    skills: [SKILLS.STONEWORKING, SKILLS.NAVIGATION, SKILLS.APPRAISAL],
    hpBonus: 1,
    startingSp: '2d6 x 10',
    startingWealth: () => rollDice('2d6') * 10,
  },
  [ORIGINS.HEALER]: {
    description: 'You grew up in a small village, learning to care for the sick and injured.',
    skills: [SKILLS.WOUND_TREATMENT, SKILLS.PHYSICA, SKILLS.HERBALISM],
    hpBonus: 0,
    startingSp: '2d6 x 10',
    startingWealth: () => rollDice('2d6') * 10,
  },
  [ORIGINS.SAILOR]: {
    description: 'You traveled the seas as a sailor, learning to navigate and survive on the open water.',
    skills: [SKILLS.SAILING, SKILLS.FISHING, SKILLS.NAVIGATION, SKILLS.SWIMMING],
    hpBonus: 1,
    startingSp: '2d6 x 10',
    startingWealth: () => rollDice('2d6') * 10,
  },
  [ORIGINS.TAILOR]: {
    description: 'You apprenticed as a tailor, making and repairing clothes and other textiles.',
    skills: [SKILLS.TAILORING, SKILLS.LEATHERWORKING, SKILLS.TRADING],
    hpBonus: 0,
    startingSp: '2d6 x 10',
    startingWealth: () => rollDice('2d6') * 10,
  },
  [ORIGINS.BOWYER]: {
    description: 'You were trained as a bowyer, crafting bows and arrows for hunters and soldiers.',
    skills: [SKILLS.BOWYERY, SKILLS.WOODWORKING, SKILLS.TRADING],
    hpBonus: 0,
    startingSp: '3d6 x 10',
    startingWealth: () => rollDice('3d6') * 10,
  },
  [ORIGINS.INNKEEPER]: {
    description: 'Your family owned an inn, and you learned to cook, clean, and run a business.',
    skills: [SKILLS.COOKERY, SKILLS.TRADING, SKILLS.MUSIC],
    hpBonus: 0,
    startingSp: '3d6 x 10',
    startingWealth: () => rollDice('3d6') * 10,
  },
  [ORIGINS.MINSTREL]: {
    description: 'You traveled as a performer, entertaining crowds with your music, dance and storytelling.',
    skills: [SKILLS.MUSIC, SKILLS.DANCING, SKILLS.POETRY, SKILLS.PERSUASION],
    hpBonus: 0,
    startingSp: '3d6 x 10',
    startingWealth: () => rollDice('3d6') * 10,
  },
  [ORIGINS.SAGE]: {
    description: 'You apprenticed under a scholar, learning to read, write and study the natural world.',
    skills: [SKILLS.ANCIENT_LANGUAGES, SKILLS.HERBLORE, SKILLS.HISTORY],
    hpBonus: -1,
    startingSp: '3d6 x 10',
    startingWealth: () => rollDice('3d6') * 10,
  },
  [ORIGINS.ACOLYTE]: {
    description:
      'You served in a temple, performing ceremonial duties and tending to the spiritual and physical health of others.',
    skills: [SKILLS.RELIGION, SKILLS.TAILORING, SKILLS.DEMONLORE, SKILLS.PHYSICA],
    hpBonus: -1,
    startingSp: '3d6 x 10',
    startingWealth: () => rollDice('3d6') * 10,
  },
  [ORIGINS.HERALD]: {
    description: 'You served as a herald, carrying messages and news between lords and ladies.',
    skills: [SKILLS.HERALDRY, SKILLS.ETIQUETTE, SKILLS.RUNNING, SKILLS.RIDING],
    hpBonus: 0,
    startingSp: '3d6 x 10',
    startingWealth: () => rollDice('4d6') * 10,
  },
  [ORIGINS.MERCHANT]: {
    description: 'You grew up in a merchant family, learning how to appraise goods and negotiate deals.',
    skills: [SKILLS.TRADING, SKILLS.APPRAISAL, SKILLS.FORGERY, SKILLS.NAVIGATION],
    hpBonus: -1,
    startingSp: '4d6 x 10',
    startingWealth: () => rollDice('4d6') * 10,
  },
  [ORIGINS.COURTIER]: {
    description: 'You were an attendant at court, learning to navigate the intrigues of the nobility.',
    skills: [SKILLS.CALLIGRAPHY, SKILLS.PERSUASION, SKILLS.ETIQUETTE, SKILLS.FORGERY],
    hpBonus: -1,
    startingSp: '4d6 x 10',
    startingWealth: () => rollDice('4d6') * 10,
  },
  [ORIGINS.LANDLESS_NOBLE]: {
    description:
      'You were born into a noble family fallen under hard times. You stand to inherit little but your name.',
    skills: [SKILLS.RIDING, SKILLS.ETIQUETTE, SKILLS.HERALDRY, SKILLS.HISTORY],
    hpBonus: -1,
    startingSp: '5d6 x 10',
    startingWealth: () => rollDice('5d6') * 10,
  },
});

export const allOrigins = Object.freeze(Object.keys(origins));
