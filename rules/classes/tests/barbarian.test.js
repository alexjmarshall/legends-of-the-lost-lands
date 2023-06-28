import { Barbarian } from '../barbarian';
import { barbarianDataByLevel } from './data/barbarian-data';

describe('Barbarian', () => {
  const expected = barbarianDataByLevel();

  it.each(Object.keys(expected))('constructs a Barbarian of level %i with the correct properties', (lvl) => {
    const actual = new Barbarian(lvl);
    expect(actual).toEqual(expected[lvl]);
  });
});
