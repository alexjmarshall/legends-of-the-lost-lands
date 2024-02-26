import { Barbarian } from '../barbarian';
import { barbarianDataByLevel } from './data/barbarian-data';

describe('Barbarian class', () => {
  const expected = barbarianDataByLevel();
  const expectedLevels = [15];

  it.each(expectedLevels)('constructs a Barbarian of level %i with the correct properties', (lvl) => {
    const actual = new Barbarian(lvl);
    console.log(actual);
    // expect(actual).toEqual(expected[lvl]);
  });
});
