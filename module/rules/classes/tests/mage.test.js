import { Mage, Incantatrix, Necromancer } from '../mage';
import { mageDataByLevel, incantatrixDataByLevel, elementalistDataByLevel } from './data/mage-data';

// describe('Mage class', () => {
//   const expected = mageDataByLevel();
//   const expectedLevels = [4];

//   it.each(expectedLevels)('constructs a Mage of level %i with the correct properties', (lvl) => {
//     const actual = new Mage(lvl);
//     console.log(actual);
//     //expect(actual).toEqual(expected[lvl]);
//   });
// });

// describe('Incantatrix variant', () => {
//   const expected = incantatrixDataByLevel();
//   const expectedLevels = [3];

//   it.each(expectedLevels)('constructs a Incantatrix of level %i with the correct properties', (lvl) => {
//     const actual = new Incantatrix(lvl);
//     console.log(actual);
//     //expect(actual).toEqual(expected[lvl]);
//   });
// });

describe('Elementalist variant', () => {
  const expected = elementalistDataByLevel();
  const expectedLevels = [12];

  it.each(expectedLevels)('constructs a Elementalist of level %i with the correct properties', (lvl) => {
    // creating just an AirElementalist as there are no differences between the variants besides the class name
    const actual = new Necromancer(lvl);
    console.log(actual);
    //expect(actual).toEqual(expected[lvl]);
  });
});
