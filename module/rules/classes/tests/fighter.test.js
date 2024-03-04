import { Fighter, Berserker } from '../fighter';

// describe('Fighter class', () => {
//   const expectedLevels = [14];

//   it.each(expectedLevels)('constructs a Fighter of level %i with the correct properties', (lvl) => {
//     const actual = new Fighter(lvl, 'Builder');
//     console.log(actual);
//     //expect(actual).toEqual(expected[lvl]);
//   });
// });

describe('Berserker variant', () => {
  const expectedLevels = [4];

  it.each(expectedLevels)('constructs a Berserker of level %i with the correct properties', (lvl) => {
    const actual = new Berserker(lvl, 'Innkeeper');
    console.log(actual);
    //expect(actual).toEqual(expected[lvl]);
  });
});
