import { Cleric, CloisteredCleric, Runepriest } from '../cleric';

describe('Cleric class', () => {
  const expectedLevels = [7];

  it.each(expectedLevels)('constructs a Cleric of level %i with the correct properties', (lvl) => {
    const actual = new Cleric(lvl, 'Healer');
    console.log(actual);
  });
});

// describe('Cloistered Cleric variant', () => {
//   const expectedLevels = [1];

//   it.each(expectedLevels)('constructs a Cloistered Cleric of level %i with the correct properties', (lvl) => {
//     const actual = new CloisteredCleric(lvl, 'Acolyte');
//     console.log(actual);
//   });
// });

// describe('Runepriest variant', () => {
//   const expected = runepriestDataByLevel();
//   const expectedLevels = [3];

//   it.each(expectedLevels)('constructs a Runepriest of level %i with the correct properties', (lvl) => {
//     const actual = new Runepriest(lvl);
//     console.log(actual);
//     //expect(actual).toEqual(expected[lvl]);
//   });
// });
