import { describe, expect, it } from 'vitest';

import { matchRecipes } from '../src/lib/matcher.js';

const r = (id: string, ingredients: string[], minutes = 30) => ({ id, minutes, ingredients });

describe('matchRecipes', () => {
  const omelette = r('omelette', ['Eggs', 'Onion'], 10);
  const friedRice = r('fried-rice', ['Rice', 'Eggs', 'Garlic'], 20);
  const rendang = r('rendang', ['Chicken', 'Coconut milk', 'Lemongrass', 'Chili', 'Shallots']);
  const cake = r('cake', ['Flour', 'Sugar', 'Butter']);

  it('puts ready recipes first, then fewest missing', () => {
    const matches = matchRecipes([rendang, friedRice, omelette, cake], ['Eggs', 'Onion', 'Rice']);
    expect(matches.map((m) => m.recipe.id)).toEqual(['omelette', 'fried-rice']);
    expect(matches[0]).toMatchObject({ have: 2, need: 2, missing: [] });
    expect(matches[1]).toMatchObject({ have: 2, need: 3, missing: ['Garlic'] });
  });

  it('ignores case and surrounding spaces', () => {
    expect(matchRecipes([omelette], [' eggs', 'ONION '])[0].missing).toEqual([]);
  });

  it('drops recipes missing too many or sharing nothing', () => {
    expect(matchRecipes([rendang, cake], ['Chicken', 'Chili'])).toEqual([]);
  });

  it('respects maxMissing', () => {
    expect(matchRecipes([friedRice], ['Eggs'], 2)).toHaveLength(1);
    expect(matchRecipes([friedRice], ['Eggs'], 1)).toHaveLength(0);
  });

  it('breaks ties by shorter cooking time', () => {
    const slow = r('slow', ['Eggs'], 60);
    const fast = r('fast', ['Eggs'], 5);
    expect(matchRecipes([slow, fast], ['Eggs']).map((m) => m.recipe.id)).toEqual(['fast', 'slow']);
  });
});
