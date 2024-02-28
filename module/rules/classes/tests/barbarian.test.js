import { Barbarian } from '../barbarian';
import { barbarianDataByLevel } from './data/barbarian-data';

describe('Barbarian class', () => {
  const expected = barbarianDataByLevel();
  const expectedLevels = [1];

  it.each(expectedLevels)('constructs a Barbarian of level %i with the correct properties', (lvl) => {
    const actual = new Barbarian(lvl, 'Innkeeper');
    console.log(actual);
    // expect(actual).toEqual(expected[lvl]);
  });
});
