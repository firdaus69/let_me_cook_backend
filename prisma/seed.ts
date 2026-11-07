// Seeds the same sample data the Flutter app ships with (lib/data/sample_data.dart).
// Safe to run repeatedly: everything is upserted.
import { PrismaClient, type Difficulty, type IngredientCategory, type RecipeTone } from '@prisma/client';

const prisma = new PrismaClient();

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const countries = [{ code: 'MY', name: 'Malaysia' }];

const ingredients: [string, IngredientCategory][] = [
  ['Chicken', 'protein'], ['Eggs', 'protein'], ['Beef', 'protein'], ['Prawns', 'protein'],
  ['Tofu', 'protein'], ['Anchovies', 'protein'],
  ['Onion', 'vegetables'], ['Garlic', 'vegetables'], ['Chili', 'vegetables'], ['Tomato', 'vegetables'],
  ['Cabbage', 'vegetables'], ['Bean sprouts', 'vegetables'], ['Carrot', 'vegetables'],
  ['Lemongrass', 'vegetables'], ['Shallots', 'vegetables'],
  ['Milk', 'dairy'], ['Butter', 'dairy'], ['Cheese', 'dairy'], ['Coconut milk', 'dairy'],
  ['Rice', 'pantry'], ['Noodles', 'pantry'], ['Flour', 'pantry'], ['Soy sauce', 'pantry'],
  ['Oyster sauce', 'pantry'], ['Sugar', 'pantry'],
  ['Turmeric', 'spices'], ['Curry powder', 'spices'], ['Cumin', 'spices'], ['Black pepper', 'spices'],
  ['Belacan', 'spices'], ['Pandan', 'spices'],
];

type SeedRecipe = {
  title: string;
  minutes: number;
  difficulty: Difficulty;
  tone: RecipeTone;
  ingredients: string[];
  featuredRank?: number;
  popularity?: number;
};

const recipes: SeedRecipe[] = [
  { title: 'Nasi Lemak', minutes: 45, difficulty: 'easy', tone: 'green', featuredRank: 1, popularity: 50,
    ingredients: ['Rice', 'Coconut milk', 'Pandan', 'Eggs', 'Chili', 'Onion'] },
  { title: 'Roti Canai', minutes: 60, difficulty: 'medium', tone: 'yellow', featuredRank: 2, popularity: 45,
    ingredients: ['Flour', 'Butter', 'Eggs', 'Milk', 'Sugar'] },
  { title: 'Laksa Penang', minutes: 75, difficulty: 'medium', tone: 'red', featuredRank: 3, popularity: 40,
    ingredients: ['Noodles', 'Anchovies', 'Chili', 'Lemongrass', 'Shallots', 'Belacan'] },
  { title: 'Satay Ayam', minutes: 40, difficulty: 'easy', tone: 'brown', featuredRank: 4, popularity: 35,
    ingredients: ['Chicken', 'Lemongrass', 'Turmeric', 'Cumin', 'Shallots', 'Sugar'] },
  { title: 'Mee Goreng Mamak', minutes: 25, difficulty: 'easy', tone: 'orange', featuredRank: 5, popularity: 30,
    ingredients: ['Noodles', 'Eggs', 'Tofu', 'Bean sprouts', 'Soy sauce', 'Chili', 'Garlic'] },
  { title: 'Chicken Rendang', minutes: 120, difficulty: 'medium', tone: 'brown', popularity: 100,
    ingredients: ['Chicken', 'Coconut milk', 'Lemongrass', 'Chili', 'Shallots', 'Garlic', 'Turmeric'] },
  { title: 'Char Kway Teow', minutes: 20, difficulty: 'easy', tone: 'orange', popularity: 90,
    ingredients: ['Noodles', 'Prawns', 'Eggs', 'Bean sprouts', 'Soy sauce', 'Garlic', 'Chili'] },
  { title: 'Nasi Kerabu', minutes: 50, difficulty: 'medium', tone: 'green', popularity: 80,
    ingredients: ['Rice', 'Cabbage', 'Bean sprouts', 'Anchovies', 'Coconut milk', 'Shallots'] },
  { title: 'Ayam Masak Merah', minutes: 60, difficulty: 'easy', tone: 'red', popularity: 70,
    ingredients: ['Chicken', 'Tomato', 'Onion', 'Garlic', 'Chili'] },
  { title: 'Cendol', minutes: 30, difficulty: 'easy', tone: 'yellow', popularity: 60,
    ingredients: ['Coconut milk', 'Pandan', 'Flour', 'Sugar'] },
  { title: 'Nasi Goreng Kampung', minutes: 20, difficulty: 'easy', tone: 'orange', popularity: 20,
    ingredients: ['Rice', 'Eggs', 'Garlic', 'Onion', 'Chili'] },
  { title: 'Bubur Ayam', minutes: 45, difficulty: 'easy', tone: 'brown', popularity: 15,
    ingredients: ['Chicken', 'Rice', 'Garlic', 'Onion'] },
  { title: 'Telur Dadar Bawang', minutes: 10, difficulty: 'easy', tone: 'yellow', popularity: 10,
    ingredients: ['Eggs', 'Onion', 'Chili'] },
];

async function main() {
  for (const c of countries) {
    await prisma.country.upsert({ where: { code: c.code }, update: { name: c.name }, create: c });
  }

  for (const [name, category] of ingredients) {
    const id = slug(name);
    await prisma.ingredient.upsert({ where: { id }, update: { name, category }, create: { id, name, category } });
  }

  for (const r of recipes) {
    const id = slug(r.title);
    const data = {
      title: r.title,
      minutes: r.minutes,
      difficulty: r.difficulty,
      tone: r.tone,
      countryCode: 'MY',
      featuredRank: r.featuredRank ?? null,
      popularity: r.popularity ?? 0,
    };
    await prisma.recipe.upsert({ where: { id }, update: data, create: { id, ...data } });

    await prisma.recipeIngredient.deleteMany({ where: { recipeId: id } });
    await prisma.recipeIngredient.createMany({
      data: r.ingredients.map((name, position) => ({ recipeId: id, ingredientId: slug(name), position })),
    });
  }

  console.log(`Seeded ${countries.length} countries, ${ingredients.length} ingredients, ${recipes.length} recipes.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
