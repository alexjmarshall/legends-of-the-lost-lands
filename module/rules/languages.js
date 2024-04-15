import { randomChoice } from '../helper.js';
import { getNumExtraLanguages } from './abilities.js';

export const RARE_LANGUAGES = Object.freeze({
  ABYSSAL: 'abyssal',
  CELESTIAL: 'celestial',
  DEEP_SPEECH: 'deep speech',
  DRUIDIC: 'druidic',
  HIGH_DROW: 'high drow',
  INFERNAL: 'Infernal',
  PRIMORDIAL: 'primordial',
  THIEVES_CANT: "thieves' cant",
  UNDERCOMMON: 'undercommon',
});

export const LANGUAGES = Object.freeze({
  ABYSSAL: 'abyssal',
  ANARI: 'anari',
  CELESTIAL: 'celestial',
  CENTAUR: 'centaur',
  DEEP_SPEECH: 'deep speech',
  DRACONIC: 'draconic',
  DRUIDIC: 'druidic',
  DWARVISH: 'dwarvish',
  ERSKIN: 'erskin',
  GAELING: 'gaeling',
  GASQUEN: 'gasquen',
  GHOUL: 'ghoul',
  GNOLLISH: 'gnollish',
  GOBLINISH: 'goblinish',
  HELVAENIC: 'helvaenic',
  HIGH_BOROS: 'high boros',
  HIGH_DROW: 'high drow',
  HUUN: 'huun',
  INFERNAL: 'infernal',
  JOTUN: 'jotun',
  KHEMITIAN: 'Kkhemitian',
  KIRKUT: 'kirkut',
  KOBOLD: 'kobold',
  KRA: 'kra',
  LIZARDMAN: 'lizardman',
  MEERUWHAN: 'meeruwhan',
  MERMAN: 'merman',
  NORSK: 'norsk',
  OGHAM: 'ogham',
  ORCISH: 'orcish',
  PRIMORDIAL: 'primordial',
  SEMURIC: 'semuric',
  SYLVAN: 'sylvan',
  THIEVES_CANT: "thieves' cant",
  UNDERCOMMON: 'undercommon',
  WESTERLING: 'westerling',
  XHAEN: "xha'en",
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
