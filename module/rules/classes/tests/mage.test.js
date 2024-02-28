import { Mage, Incantatrix, Necromancer } from '../mage';

describe('Mage class', () => {
  const expectedLevels = [4];

  it.each(expectedLevels)('constructs a Mage of level %i with the correct properties', (lvl) => {
    const actual = new Mage(lvl, 'Sage');
    console.log(actual);
  });
});

describe('Incantatrix variant', () => {
  const expectedLevels = [1];

  it.each(expectedLevels)('constructs a Incantatrix of level %i with the correct properties', (lvl) => {
    const actual = new Incantatrix(lvl, 'Herald');
    console.log(actual);
  });
});

describe('Necromancer variant', () => {
  const expectedLevels = [1];

  it.each(expectedLevels)('constructs a Necromancer of level %i with the correct properties', (lvl) => {
    const actual = new Necromancer(lvl, 'Healer');
    console.log(actual);
  });
});
