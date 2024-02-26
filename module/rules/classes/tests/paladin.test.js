import { Paladin, Inquisitor } from '../paladin';

// describe('Paladin class', () => {
//   const expectedLevels = [5];

//   it.each(expectedLevels)('constructs a Paladin of level %i with the correct properties', (lvl) => {
//     const actual = new Paladin(lvl);
//     console.log(actual);
//     //expect(actual).toEqual(expected[lvl]);
//   });
// });

describe('Inquisitor variant', () => {
  const expectedLevels = [18];

  it.each(expectedLevels)('constructs a Inquisitor of level %i with the correct properties', (lvl) => {
    const actual = new Inquisitor(lvl);
    console.log(actual);
    //expect(actual).toEqual(expected[lvl]);
  });
});
