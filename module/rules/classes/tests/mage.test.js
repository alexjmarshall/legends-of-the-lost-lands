import { Mage, Incantatrix, Necromancer } from '../mage';
import { mageDataByLevel, incantatrixDataByLevel, elementalistDataByLevel } from './data/mage-data';

describe('Mage class', () => {
  const expected = mageDataByLevel();
  const expectedLevels = [4];

  it.each(expectedLevels)('constructs a Mage of level %i with the correct properties', (lvl) => {
    const actual = new Mage(lvl, 'Sage');
    console.log(actual.skills);
    //expect(actual).toEqual(expected[lvl]);
  });
});

describe('Incantatrix variant', () => {
  const expected = incantatrixDataByLevel();
  const expectedLevels = [3];

  it.each(expectedLevels)('constructs a Incantatrix of level %i with the correct properties', (lvl) => {
    const actual = new Incantatrix(lvl, 'Herald');
    console.log(actual);
    //expect(actual).toEqual(expected[lvl]);
  });
});

describe('Necromancer variant', () => {
  const expectedLevels = [1];

  it.each(expectedLevels)('constructs a Necromancer of level %i with the correct properties', (lvl) => {
    const actual = new Necromancer(lvl, 'Healer');
    console.log(actual.skills);
    //expect(actual).toEqual(expected[lvl]);
  });
});
