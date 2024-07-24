import { deepFreeze, randomChoice, removeDuplicates } from '../helper.js';
import { SKILLS } from './skills.js';

export const TOOLS = Object.freeze({
  ALEMBIC: 'Alembic',
  MORTAR_AND_PESTLE: 'Mortar & Pestle',
  TEAPOT: 'Teapot',
  COOKPOT: 'Cookpot',
});

export const RECIPE_TYPES = Object.freeze({
  HERBAL: 'herbal',
  ALCHEMICAL: 'alchemical',
  COOKING: 'cooking',
});

export const RECIPES = Object.freeze({
  POULTICE_TO_NEUTRALIZE_POISON: 'Poultice to Neutralize Poison',
  PURIFICATION_TO_RESTORE_ENERVATION: 'Purification to Restore Enervation',
  WARD_AGAINST_VAMPIRES: 'Ward Against Vampires',
  WARD_AGAINST_LYCANTHROPES: 'Ward Against Lycanthropes',
  ELIXIR_FOR_LYCANTHROPY: 'Elixir for Lycanthropy',
  ELIXIR_FOR_NAUSEA: 'Elixir for Nausea',
  ELIXIR_FOR_COUGH: 'Elixir for Cough',
  ELIXIR_FOR_FEVER: 'Elixir for Fever',
  ELIXIR_FOR_DIARRHEA: 'Elixir for Diarrhea',
  ELIXIR_FOR_PAIN: 'Elixir for Pain',
  ELIXIR_FOR_GUT_PAIN: 'Elixir for Gut Pain',
  ELIXIR_FOR_HEADACHE: 'Elixir for Headache',
  ELIXIR_FOR_INSOMNIA: 'Elixir for Insomnia',
  ELIXIR_FOR_EXHAUSTION: 'Elixir for Exhaustion',
});

// TODO recipes that treat disease symptoms do not cure the disease itself but restore some exhaustion damage
// TODO recipes that treat injuries do not heal the injury itself but reduce its severity
export const recipes = deepFreeze({
  [RECIPES.POULTICE_TO_NEUTRALIZE_POISON]: {
    ingredients: ['Kingsfoil', 'Bandage'],
    tools: [TOOLS.MORTAR_AND_PESTLE],
    type: RECIPE_TYPES.HERBAL,
    magic: true,
  },
  [RECIPES.PURIFICATION_TO_RESTORE_ENERVATION]: {
    // TODO restores to threshold of old level
    ingredients: ['Holy Water', 'Vervain'],
    tools: [TOOLS.MORTAR_AND_PESTLE],
    type: RECIPE_TYPES.HERBAL,
    magic: true,
  },
  [RECIPES.WARD_AGAINST_VAMPIRES]: {
    ingredients: ['Garlic', 'String'],
    tools: [],
    type: RECIPE_TYPES.HERBAL,
  },
  [RECIPES.WARD_AGAINST_LYCANTHROPES]: {
    ingredients: ['Wolfsbane', 'String'],
    tools: [],
    type: RECIPE_TYPES.HERBAL,
  },
  [RECIPES.ELIXIR_FOR_LYCANTHROPY]: {
    ingredients: ['Belladonna', 'Powdered Silver'],
    tools: [TOOLS.ALEMBIC],
    type: RECIPE_TYPES.ALCHEMICAL,
  },
  [RECIPES.ELIXIR_FOR_NAUSEA]: {
    ingredients: ['Adrue'],
    tools: [TOOLS.MORTAR_AND_PESTLE, TOOLS.TEAPOT],
    type: RECIPE_TYPES.HERBAL,
  },
  [RECIPES.ELIXIR_FOR_COUGH]: {
    ingredients: ['Mallow'],
    tools: [TOOLS.MORTAR_AND_PESTLE, TOOLS.TEAPOT],
    type: RECIPE_TYPES.HERBAL,
  },
  [RECIPES.ELIXIR_FOR_FEVER]: {
    ingredients: ['Feverfew'],
    tools: [TOOLS.MORTAR_AND_PESTLE, TOOLS.TEAPOT],
    type: RECIPE_TYPES.HERBAL,
  },
  [RECIPES.ELIXIR_FOR_DIARRHEA]: {
    ingredients: ['Nutmeg'], // TODO replace
    tools: [TOOLS.MORTAR_AND_PESTLE, TOOLS.TEAPOT],
    type: RECIPE_TYPES.HERBAL,
  },
  [RECIPES.ELIXIR_FOR_PAIN]: {
    ingredients: ['Willow Bark'],
    tools: [TOOLS.MORTAR_AND_PESTLE, TOOLS.TEAPOT],
    type: RECIPE_TYPES.HERBAL, // TODO skill for alchemy
  },
  [RECIPES.ELIXIR_FOR_GUT_PAIN]: {
    ingredients: ['Anise'],
    tools: [TOOLS.MORTAR_AND_PESTLE, TOOLS.TEAPOT],
    type: RECIPE_TYPES.HERBAL,
  },
  [RECIPES.ELIXIR_FOR_HEADACHE]: {
    ingredients: ['Butterbur'],
    tools: [TOOLS.MORTAR_AND_PESTLE, TOOLS.TEAPOT],
    type: RECIPE_TYPES.HERBAL,
  },
  [RECIPES.ELIXIR_FOR_INSOMNIA]: {
    ingredients: ['Valerian'],
    tools: [TOOLS.MORTAR_AND_PESTLE, TOOLS.TEAPOT],
    type: RECIPE_TYPES.HERBAL,
  },
  [RECIPES.ELIXIR_FOR_EXHAUSTION]: {
    ingredients: ['Ginseng'], // TODO replace
    tools: [TOOLS.MORTAR_AND_PESTLE, TOOLS.TEAPOT],
    type: RECIPE_TYPES.HERBAL,
  },
}); // TODO one for bleeding

export const commonRecipes = Object.keys(recipes).filter((recipe) => recipes[recipe].magic !== true);

export const getStartingRecipesKnown = (classInstance) => {
  // return the class instance's startingRecipes
  // combined with 2 random common recipes if the classInstance has herbalism as a skill
  const startingRecipes = classInstance.startingRecipes;
  const classSkills = Object.values(classInstance.skills).flat();
  if (classSkills.includes(SKILLS.HERBALISM)) {
    startingRecipes.concat([randomChoice(commonRecipes), randomChoice(commonRecipes)]);
  }
  return removeDuplicates(startingRecipes);
};

// TODO ingredients with rarities and terrain where can be found
