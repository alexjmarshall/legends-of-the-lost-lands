import { Fighter, Berserker } from '../../classes';
import {
  fighterLvl1,
  fighterLvl7,
  fighterLvl13,
  berserkerLvl1,
  berserkerLvl7,
  berserkerLvl13,
} from './data/fighter-data';

test('constructs a Fighter with the correct properties', () => {
  const expectedLvl1 = fighterLvl1;
  const actualLvl1 = new Fighter(1);
  expect(actualLvl1).toEqual(expectedLvl1);

  const expectedLvl7 = fighterLvl7;
  const actualLvl7 = new Fighter(7);
  expect(actualLvl7).toEqual(expectedLvl7);

  const expectedLvl13 = fighterLvl13;
  const actualLvl13 = new Fighter(13);
  expect(actualLvl13).toEqual(expectedLvl13);
});

test('constructs a Berserker with the correct properties', () => {
  const expectedLvl1 = berserkerLvl1;
  const actualLvl1 = new Berserker(1);
  expect(actualLvl1).toEqual(expectedLvl1);

  const expectedLvl7 = berserkerLvl7;
  const actualLvl7 = new Berserker(7);
  expect(actualLvl7).toEqual(expectedLvl7);

  const expectedLvl13 = berserkerLvl13;
  const actualLvl13 = new Berserker(13);
  expect(actualLvl13).toEqual(expectedLvl13);
});
