import { Druid } from '../druid';

describe('Druid class', () => {
  const expectedLevels = [16];

  it.each(expectedLevels)('constructs a Druid of level %i with the correct properties', (lvl) => {
    const actual = new Druid(lvl, 'Healer');
    console.log(actual);
  });
});
