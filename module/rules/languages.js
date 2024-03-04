import { randomChoice } from '../helper.js';
import { getNumExtraLanguages } from './abilities.js';

export const RARE_LANGUAGES = Object.freeze({
  ABYSSAL: 'Abyssal',
  CELESTIAL: 'Celestial',
  DEEP_SPEECH: 'Deep Speech',
  DRUIDIC: 'Druidic',
  HIGH_DROW: 'High Drow',
  INFERNAL: 'Infernal',
  PRIMORDIAL: 'Primordial',
  THIEVES_CANT: "Thieves' Cant",
  UNDERCOMMON: 'Undercommon',
});

export const LANGUAGES = Object.freeze({
  ABYSSAL: 'Abyssal',
  ANARI: 'Anari',
  CELESTIAL: 'Celestial',
  CENTAUR: 'Centaur',
  DEEP_SPEECH: 'Deep Speech',
  DRACONIC: 'Draconic',
  DRUIDIC: 'Druidic',
  DWARVISH: 'Dwarvish',
  ERSKIN: 'Erskin',
  GAELING: 'Gaeling',
  GASQUEN: 'Gasquen',
  GHOUL: 'Ghoul',
  GNOLLISH: 'Gnollish',
  GOBLINISH: 'Goblinish',
  HELVAENIC: 'Helvaenic',
  HIGH_BOROS: 'High Boros',
  HIGH_DROW: 'High Drow',
  HUUN: 'Huun',
  INFERNAL: 'Infernal',
  JOTUN: 'Jotun',
  KHEMITIAN: 'Khemitian',
  KIRKUT: 'Kirkut',
  KOBOLD: 'Kobold',
  KRA: 'Kra',
  LIZARDMAN: 'Lizardman',
  MEERUWHAN: 'Meeruwhan',
  MERMAN: 'Merman',
  NORSK: 'Norsk',
  OGHAM: 'Ogham',
  ORCISH: 'Orcish',
  PRIMORDIAL: 'Primordial',
  SEMURIC: 'Semuric',
  SYLVAN: 'Sylvan',
  THIEVES_CANT: "Thieves' Cant",
  UNDERCOMMON: 'Undercommon',
  WESTERLING: 'Westerling',
  XHAEN: "Xha'en",
});

export const defaultLanguages = [LANGUAGES.WESTERLING];

export const getExtraLanguages = (languages, int) => {
  // add a number of randomly selected languages equal to num to the languages array
  // without duplicates
  const num = getNumExtraLanguages(int);
  const extraLanguages = [];
  while (extraLanguages.length < num) {
    const newLang = randomChoice(Object.values(LANGUAGES));
    if (!languages.includes(newLang)) {
      extraLanguages.push(newLang);
    }
  }
  return languages.concat(extraLanguages);
};
