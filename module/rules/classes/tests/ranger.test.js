import { Ranger, VampireHunter } from '../ranger';

describe('Ranger class', () => {
  const expectedLevels = [5];

  it.each(expectedLevels)('constructs a Ranger of level %i with the correct properties', (lvl) => {
    const actual = new Ranger(lvl, 'Wildling');
    console.log(actual);
  });
});

describe('VampireHunter variant', () => {
  const expectedLevels = [10];

  it.each(expectedLevels)('constructs a VampireHunter of level %i with the correct properties', (lvl) => {
    const actual = new VampireHunter(lvl, 'Acolyte');
    console.log(actual);
  });
});
