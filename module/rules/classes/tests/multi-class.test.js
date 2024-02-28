import CLASSES from '../index.js';

describe('MultiClass', () => {
  const expectedLevels = [1];
  const classes = [CLASSES.Fighter, CLASSES.Mage];

  it.each(expectedLevels)('constructs a MultiClass of level %i with the correct properties', (lvl) => {
    const actual = new CLASSES.MultiClass(classes, lvl, 'Innkeeper');
    console.log(actual);
  });
});
