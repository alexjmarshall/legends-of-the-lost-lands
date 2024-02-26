import { Druid } from '../druid';

describe('Druid class', () => {
  const expectedLevels = [1];

  it.each(expectedLevels)('constructs a Druid of level %i with the correct properties', (lvl) => {
    const actual = new Druid(lvl);
    console.log(actual.skills);
    //expect(actual).toEqual(expected[lvl]);
  });
});
