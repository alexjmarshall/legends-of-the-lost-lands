import { Ranger, VampireHunter } from '../ranger';

describe('Ranger class', () => {
  const expectedLevels = [5];

  it.each(expectedLevels)('constructs a Ranger of level %i with the correct properties', (lvl) => {
    const actual = new Ranger(lvl);
    console.log(actual);
    //expect(actual).toEqual(expected[lvl]);
  });
});

describe('VampireHunter variant', () => {
  const expectedLevels = [10];

  it.each(expectedLevels)('constructs a VampireHunter of level %i with the correct properties', (lvl) => {
    const actual = new VampireHunter(lvl);
    console.log(actual);
    //expect(actual).toEqual(expected[lvl]);
  });
});
