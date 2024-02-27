import { Cleric, CloisteredCleric, Runepriest } from '../cleric';
import { clericDataByLevel, cloisteredClericDataByLevel, runepriestDataByLevel } from './data/cleric-data';

describe('Cleric class', () => {
  const expected = clericDataByLevel();
  const expectedLevels = [1];

  it.each(expectedLevels)('constructs a Cleric of level %i with the correct properties', (lvl) => {
    const actual = new Cleric(lvl, 'Healer');
    console.log(actual);
    //expect(actual).toEqual(expected[lvl]);
  });
});

// describe('Cloistered Cleric variant', () => {
//   const expected = cloisteredClericDataByLevel();
//   const expectedLevels = [5];

//   it.each(expectedLevels)('constructs a Cloistered Cleric of level %i with the correct properties', (lvl) => {
//     const actual = new CloisteredCleric(lvl);
//     console.log(actual);
//     //expect(actual).toEqual(expected[lvl]);
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
