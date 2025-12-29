

import seed from "../data/recipes.seed.json";


export interface Recipe {
  id: string;
  title: string;
  image?: string;
  calories: number;
  protein: string; 
  carbs: string;
  fat: string;     
  minutes?: number;
  ingredients?: string[];
  tags?: string[];
  mealTypes?: ("breakfast" | "lunch" | "dinner" | "snack")[];
}

export interface MealPlanDay {
  date: string; // YYYY-MM-DD
  breakfast: Recipe | null;
  lunch: Recipe | null;
  dinner: Recipe | null;
  snacks: Recipe[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
}

export interface MealPlan {
  id: string;
  createdAt: Date;
  startDate: string;
  endDate: string;
  days: MealPlanDay[];
  goals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

export interface ShoppingListItem {
  ingredient: string;
  amount: string;
  category: "protein" | "produce" | "dairy" | "grains" | "other";
}

/** ---- Helpers ---- */

const toRecipe = (r: any): Recipe => ({
  id: r.id,
  title: r.name ?? r.title,
  image: r.image,
  calories: Number(r.kcal ?? r.calories ?? 0),
  protein: `${Number(r.protein ?? 0)}g`,
  carbs: `${Number(r.carbs ?? 0)}g`,
  fat: `${Number(r.fat ?? 0)}g`,
  minutes: r.minutes,
  ingredients: r.ingredients ?? [],
  tags: r.tags ?? [],
  mealTypes: r.mealTypes ?? [],
});

const ALL_RECIPES: Recipe[] = (seed as any[]).map(toRecipe);

const parseG = (v: string | undefined) => parseInt((v ?? "0").replace("g", ""), 10) || 0;

type MealType = "breakfast" | "lunch" | "dinner" | "snack";

type Targets = { calories: number; protein: number; carbs: number; fat: number };

function scoreRecipe(r: Recipe, t: Targets) {
  const p = Math.abs(t.protein - parseG(r.protein));
  const c = Math.abs(t.carbs - parseG(r.carbs));
  const f = Math.abs(t.fat - parseG(r.fat));
  const k = Math.abs(t.calories - (r.calories ?? 0)) / 10;

  // Protein'e biraz daha ağırlık verdim (fitness odaklı kullanım için iyi)
  return p * 2.0 + c * 1.0 + f * 1.2 + k * 0.8;
}

function pickBest(
  pool: Recipe[],
  target: Targets,
  usedIds: Set<string>,
  limit = 1
): Recipe[] {
  const ranked = pool
    .filter(r => !usedIds.has(r.id))
    .map(r => ({ r, s: scoreRecipe(r, target) }))
    .sort((a, b) => a.s - b.s)
    .slice(0, Math.max(6, limit * 6)); 


  const out: Recipe[] = [];
  while (out.length < limit && ranked.length > 0) {
    const pickFrom = ranked.slice(0, Math.min(4, ranked.length));
    const chosen = pickFrom[Math.floor(Math.random() * pickFrom.length)];
    out.push(chosen.r);
    usedIds.add(chosen.r.id);

    const idx = ranked.findIndex(x => x.r.id === chosen.r.id);
    if (idx >= 0) ranked.splice(idx, 1);
  }
  return out;
}

function mealPool(type: MealType) {

  const hasMealTypes = ALL_RECIPES.some(r => (r.mealTypes?.length ?? 0) > 0);
  if (!hasMealTypes) return ALL_RECIPES;

  return ALL_RECIPES.filter(r => r.mealTypes?.includes(type));
}

function categorizeIngredient(name: string): ShoppingListItem["category"] {
  const lower = name.toLowerCase();
  if (["chicken", "beef", "salmon", "turkey", "fish", "egg", "tofu", "tuna"].some(x => lower.includes(x))) return "protein";
  if (["milk", "cheese", "yogurt", "butter", "cream", "cottage"].some(x => lower.includes(x))) return "dairy";
  if (["rice", "quinoa", "bread", "pasta", "oat", "flour", "granola", "tortilla"].some(x => lower.includes(x))) return "grains";
  if (["lettuce", "tomato", "onion", "garlic", "pepper", "spinach", "carrot", "broccoli", "cucumber", "avocado", "berries", "lemon"].some(x => lower.includes(x))) return "produce";
  return "other";
}


export async function generateMealPlan(
  goals: { calories: number; protein: number; carbs: number; fat: number },
  startDate: Date = new Date()
): Promise<MealPlan> {
  const days: MealPlanDay[] = [];

  const split = {
    breakfast: 0.25,
    lunch: 0.35,
    dinner: 0.30,
    snack: 0.10,
  };

  // ✅ Haftalık unique için: günlerin dışına aldık
  const usedWeek = new Set<string>();

  // Seed küçükse çökmemek için: toplam ihtiyaç
  const neededPerWeek = 7 * (1 + 1 + 1 + 1); // b+l+d+snack = 4
  const poolSize = ALL_RECIPES.length;
  const allowRepeatsIfNeeded = poolSize < neededPerWeek;

  const pickBestWeekUnique = (
    pool: Recipe[],
    target: Targets,
    limit = 1
  ): Recipe[] => {
    // önce unique dene
    const uniquePicked = pickBest(pool, target, usedWeek, limit);

    if (uniquePicked.length === limit) return uniquePicked;

    // unique kalmadıysa ve seed küçükse tekrar izni ver
    if (allowRepeatsIfNeeded) {
      const tempUsed = new Set<string>(); // o öğün içinde tekrar etmesin
      return pickBest(pool, target, tempUsed, limit);
    }

    // seed yeterli olmalıydı ama yine de garanti:
    return uniquePicked;
  };

  for (let i = 0; i < 7; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split("T")[0];

    const breakfastTarget: Targets = {
      calories: Math.round(goals.calories * split.breakfast),
      protein: Math.round(goals.protein * split.breakfast),
      carbs: Math.round(goals.carbs * split.breakfast),
      fat: Math.round(goals.fat * split.breakfast),
    };
    const lunchTarget: Targets = {
      calories: Math.round(goals.calories * split.lunch),
      protein: Math.round(goals.protein * split.lunch),
      carbs: Math.round(goals.carbs * split.lunch),
      fat: Math.round(goals.fat * split.lunch),
    };
    const dinnerTarget: Targets = {
      calories: Math.round(goals.calories * split.dinner),
      protein: Math.round(goals.protein * split.dinner),
      carbs: Math.round(goals.carbs * split.dinner),
      fat: Math.round(goals.fat * split.dinner),
    };
    const snackTarget: Targets = {
      calories: Math.round(goals.calories * split.snack),
      protein: Math.round(goals.protein * split.snack),
      carbs: Math.round(goals.carbs * split.snack),
      fat: Math.round(goals.fat * split.snack),
    };

    const breakfast =
      pickBestWeekUnique(mealPool("breakfast"), breakfastTarget, 1)[0] ?? null;
    const lunch =
      pickBestWeekUnique(mealPool("lunch"), lunchTarget, 1)[0] ?? null;
    const dinner =
      pickBestWeekUnique(mealPool("dinner"), dinnerTarget, 1)[0] ?? null;

    const snacks = pickBestWeekUnique(mealPool("snack"), snackTarget, 1);

    const totalCalories =
      (breakfast?.calories || 0) +
      (lunch?.calories || 0) +
      (dinner?.calories || 0) +
      snacks.reduce((sum, s) => sum + (s?.calories || 0), 0);

    days.push({
      date: dateStr,
      breakfast,
      lunch,
      dinner,
      snacks,
      totalCalories,
      totalProtein:
        parseG(breakfast?.protein) +
        parseG(lunch?.protein) +
        parseG(dinner?.protein) +
        snacks.reduce((sum, s) => sum + parseG(s?.protein), 0),
      totalCarbs:
        parseG(breakfast?.carbs) +
        parseG(lunch?.carbs) +
        parseG(dinner?.carbs) +
        snacks.reduce((sum, s) => sum + parseG(s?.carbs), 0),
      totalFat:
        parseG(breakfast?.fat) +
        parseG(lunch?.fat) +
        parseG(dinner?.fat) +
        snacks.reduce((sum, s) => sum + parseG(s?.fat), 0),
    });
  }

  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 6);

  return {
    id: `plan_${Date.now()}`,
    createdAt: new Date(),
    startDate: startDate.toISOString().split("T")[0],
    endDate: endDate.toISOString().split("T")[0],
    days,
    goals,
  };
}



export function generateShoppingList(plan: MealPlan): ShoppingListItem[] {
  const ingredientCounts = new Map<string, number>();

  const allMeals: Recipe[] = [];
  for (const d of plan.days) {
    if (d.breakfast) allMeals.push(d.breakfast);
    if (d.lunch) allMeals.push(d.lunch);
    if (d.dinner) allMeals.push(d.dinner);
    allMeals.push(...(d.snacks ?? []));
  }


  const hasIngredients = allMeals.some(m => (m.ingredients?.length ?? 0) > 0);
  if (!hasIngredients) {
    return [
      { ingredient: "Chicken breast", amount: "1 kg", category: "protein" },
      { ingredient: "Greek yogurt", amount: "1 kg", category: "dairy" },
      { ingredient: "Quinoa", amount: "500g", category: "grains" },
      { ingredient: "Mixed greens", amount: "300g", category: "produce" },
      { ingredient: "Olive oil", amount: "500ml", category: "other" },
    ];
  }

  for (const meal of allMeals) {
    for (const ing of meal.ingredients ?? []) {
      const key = ing.trim();
      ingredientCounts.set(key, (ingredientCounts.get(key) ?? 0) + 1);
    }
  }


  const items: ShoppingListItem[] = Array.from(ingredientCounts.entries()).map(
    ([ingredient, count]) => {

      const amount =
        count >= 4 ? "Large" : count === 3 ? "Medium" : count === 2 ? "Small" : "1x";

      return {
        ingredient,
        amount,
        category: categorizeIngredient(ingredient),
      };
    }
  );


  const order: Record<ShoppingListItem["category"], number> = {
    protein: 0,
    produce: 1,
    dairy: 2,
    grains: 3,
    other: 4,
  };

  return items.sort((a, b) => order[a.category] - order[b.category] || a.ingredient.localeCompare(b.ingredient));
}


export function getDayName(dateStr: string): string {
  const date = new Date(dateStr);
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return days[date.getDay()];
}


export function getShortDayName(dateStr: string): string {
  const date = new Date(dateStr);
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return days[date.getDay()];
}
