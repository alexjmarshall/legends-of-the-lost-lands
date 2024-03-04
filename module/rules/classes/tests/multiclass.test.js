import * as CLASSES from '../index.js';

describe('MultiClass', () => {
  const expectedLevels = [14];
  const classes = [CLASSES.Fighter, CLASSES.Druid, CLASSES.Thief];

  it.each(expectedLevels)('constructs a MultiClass of level %i with the correct properties', (lvl) => {
    const actual = new CLASSES.MultiClass(classes, lvl, 'Healer');
    console.log(actual);
  });
});
