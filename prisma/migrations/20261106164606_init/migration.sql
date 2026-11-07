-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('easy', 'medium', 'hard');

-- CreateEnum
CREATE TYPE "IngredientCategory" AS ENUM ('protein', 'vegetables', 'dairy', 'pantry', 'spices');

-- CreateEnum
CREATE TYPE "RecipeTone" AS ENUM ('orange', 'green', 'yellow', 'red', 'brown');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "country_code" TEXT NOT NULL DEFAULT 'MY',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "countries" (
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "countries_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "recipes" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "minutes" INTEGER NOT NULL,
    "difficulty" "Difficulty" NOT NULL,
    "tone" "RecipeTone" NOT NULL DEFAULT 'orange',
    "image_url" TEXT,
    "steps" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "country_code" TEXT NOT NULL,
    "featured_rank" INTEGER,
    "popularity" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recipes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ingredients" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "IngredientCategory" NOT NULL,

    CONSTRAINT "ingredients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipe_ingredients" (
    "recipe_id" TEXT NOT NULL,
    "ingredient_id" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "quantity" TEXT,

    CONSTRAINT "recipe_ingredients_pkey" PRIMARY KEY ("recipe_id","ingredient_id")
);

-- CreateTable
CREATE TABLE "saved_recipes" (
    "user_id" TEXT NOT NULL,
    "recipe_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_recipes_pkey" PRIMARY KEY ("user_id","recipe_id")
);

-- CreateTable
CREATE TABLE "cook_events" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "recipe_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cook_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "recipes_country_code_idx" ON "recipes"("country_code");

-- CreateIndex
CREATE UNIQUE INDEX "ingredients_name_key" ON "ingredients"("name");

-- CreateIndex
CREATE INDEX "recipe_ingredients_ingredient_id_idx" ON "recipe_ingredients"("ingredient_id");

-- CreateIndex
CREATE INDEX "cook_events_recipe_id_created_at_idx" ON "cook_events"("recipe_id", "created_at");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_country_code_fkey" FOREIGN KEY ("country_code") REFERENCES "countries"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_country_code_fkey" FOREIGN KEY ("country_code") REFERENCES "countries"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_ingredients" ADD CONSTRAINT "recipe_ingredients_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_ingredients" ADD CONSTRAINT "recipe_ingredients_ingredient_id_fkey" FOREIGN KEY ("ingredient_id") REFERENCES "ingredients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_recipes" ADD CONSTRAINT "saved_recipes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_recipes" ADD CONSTRAINT "saved_recipes_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cook_events" ADD CONSTRAINT "cook_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cook_events" ADD CONSTRAINT "cook_events_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
