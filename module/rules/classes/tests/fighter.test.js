import { Fighter, Berserker } from '../fighter';
import { fighterDataByLevel, berserkerDataByLevel } from './data/fighter-data';

describe('Fighter class', () => {
  const expected = fighterDataByLevel();
  const expectedLevels = [1];

  it.each(expectedLevels)('constructs a Fighter of level %i with the correct properties', (lvl) => {
    const actual = new Fighter(lvl);
    console.log(actual);
    //expect(actual).toEqual(expected[lvl]);
  });
});

describe('Berserker variant', () => {
  const expected = berserkerDataByLevel();
  const expectedLevels = [4];

  it.each(expectedLevels)('constructs a Berserker of level %i with the correct properties', (lvl) => {
    const actual = new Berserker(lvl);
    // console.log(actual);
    //expect(actual).toEqual(expected[lvl]);
  });
});
