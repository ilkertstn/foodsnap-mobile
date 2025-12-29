/* scripts/build-recipes.ts
   Build local recipe DB from TheMealDB
*/
import fs from "node:fs/promises";
import path from "node:path";

type MealDbMeal = Record<string, any>;

const BASE = "https://www.themealdb.com/api/json/v1/1"; // test key
const OUT_PATH = path.join(process.cwd(), "data", "recipes.seed.json");

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function getJson(url: string) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    return res.json();
}

function pickIngredients(meal: MealDbMeal): string[] {
    const list: string[] = [];
    for (let i = 1; i <= 20; i++) {
        const ing = (meal[`strIngredient${i}`] ?? "").toString().trim();
        const measure = (meal[`strMeasure${i}`] ?? "").toString().trim();
        if (!ing) continue;
        // measure'ı kaybetmek istemiyorsan "ing - measure" şeklinde tutabilirsin
        list.push(measure ? `${ing} (${measure})` : ing);
    }
    return list;
}

function guessMealTypes(meal: MealDbMeal): ("breakfast" | "lunch" | "dinner" | "snack")[] {
    // TheMealDB mealType vermez → basit heuristic
    const cat = (meal.strCategory ?? "").toLowerCase();
    const tags = ((meal.strTags ?? "") as string).toLowerCase();

    if (cat.includes("breakfast") || tags.includes("breakfast")) return ["breakfast"];
    if (cat.includes("dessert")) return ["snack"];
    if (cat.includes("starter") || cat.includes("side")) return ["snack", "lunch"];
    return ["lunch", "dinner"];
}

function toLocalRecipe(meal: MealDbMeal) {
    return {
        id: `mealdb_${meal.idMeal}`,
        name: meal.strMeal,
        image: meal.strMealThumb,
        mealTypes: guessMealTypes(meal),
        // ⛔ TheMealDB makro sağlamaz → şimdilik placeholder (Aşama 2’de dolduracağız)
        kcal: 450,
        protein: 25,
        carbs: 50,
        fat: 15,
        minutes: meal.intMinutes ? Number(meal.intMinutes) : undefined,
        ingredients: pickIngredients(meal),
        tags: [
            ...(meal.strTags ? meal.strTags.split(",").map((t: string) => t.trim()) : []),
            meal.strCategory,
            meal.strArea,
        ].filter(Boolean),
        source: "themealdb",
        raw: {
            category: meal.strCategory,
            area: meal.strArea,
            instructions: meal.strInstructions,
            youtube: meal.strYoutube,
            sourceUrl: meal.strSource,
        },
    };
}

async function main() {
    // 1) categories
    const cats = await getJson(`${BASE}/categories.php`);
    const categories: string[] = (cats.categories ?? []).map((c: any) => c.strCategory);

    console.log(`Found ${categories.length} categories.`);

    // 2) each category -> meals list
    const ids = new Set<string>();
    for (const c of categories) {
        const data = await getJson(`${BASE}/filter.php?c=${encodeURIComponent(c)}`);
        for (const m of data.meals ?? []) ids.add(m.idMeal);
        await delay(100); // small delay between categories
    }

    console.log(`Found ${ids.size} unique meal IDs.`);

    // 3) lookup each id (rate-limit safe: sequential)
    const recipes: any[] = [];
    let idx = 0;

    try {
        for (const id of ids) {
            idx++;
            // Delay to avoid rate limiting
            await delay(250);

            try {
                const detail = await getJson(`${BASE}/lookup.php?i=${id}`);
                const meal = detail.meals?.[0];
                if (!meal) continue;

                recipes.push(toLocalRecipe(meal));

                if (idx % 20 === 0) {
                    process.stdout.write(`\rFetched ${idx}/${ids.size} meals...`);
                }
            } catch (err) {
                console.error(`\nFailed to fetch meal ${id}:`, err);
            }
        }
    } catch (e) {
        console.error("\nMain loop error:", e);
    } finally {
        console.log("\n"); // Newline after progress

        await fs.mkdir(path.dirname(OUT_PATH), { recursive: true });
        await fs.writeFile(OUT_PATH, JSON.stringify(recipes, null, 2), "utf-8");
        console.log(`✅ Saved ${recipes.length} recipes to ${OUT_PATH}`);
    }
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
