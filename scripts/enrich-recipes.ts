/* scripts/enrich-recipes.ts
   Estimate nutritional values based on ingredient list using rule-based approach.
   This replaces the placeholder 450kcal with calculated values.
*/

import fs from "node:fs/promises";
import path from "node:path";

const SEED_PATH = path.join(process.cwd(), "data", "recipes.seed.json");

// Kabaca kalori değerleri (kcal / 100g)
const KCAL_DB: Record<string, number> = {
    // Proteins
    chicken: 165,
    beef: 250,
    pork: 242,
    lamb: 294,
    fish: 206,
    salmon: 208,
    tuna: 132,
    egg: 155, // approx (50g per egg -> ~75kcal)
    tofu: 76,
    beans: 347, // dry
    lentils: 116, // cooked

    // Carbs
    rice: 130, // cooked
    pasta: 131, // cooked
    bread: 265,
    potato: 77,
    flour: 364,
    oats: 389,
    sugar: 387,
    noodle: 138,
    quinoa: 120,

    // Fats / Dairy
    oil: 884,
    olive: 884,
    butter: 717,
    cheese: 402,
    cheddar: 403,
    mozzarella: 280,
    milk: 42,
    cream: 340,
    yogurt: 59,

    // Veggies / Fruits (low cal but adds up)
    onion: 40,
    garlic: 149,
    tomato: 18,
    potatoe: 77,
    carrot: 41,
    pepper: 20,
    spinach: 23,
    broccoli: 34,
    lettuce: 15,
    cucumber: 15,
    avocado: 160,
    lemon: 29,
    lime: 30,
    apple: 52,
    banana: 89,
    orange: 47,

    // Misc
    sauce: 80, // generic soy/etc
    honey: 304,
    chocolate: 546,
    nut: 600, // generic
};

// Unit conversions to grams (approx)
const UNITS: Record<string, number> = {
    kg: 1000,
    g: 1,
    gram: 1,
    lb: 450,
    pound: 450,
    oz: 28,
    ounce: 28,
    cup: 200, // Solid average
    tsp: 5,
    tbsp: 15,
    tablespoon: 15,
    teaspoon: 5,
    ml: 1, // Assume density ~water
    l: 1000,
    liter: 1000,
    clove: 5, // garlic
    slice: 30, // bread/cheese
    pinch: 1,
    dash: 1,
    large: 150, // onion/potato
    medium: 100,
    small: 50,
    fillet: 150,
    can: 400,
};

function parseAmount(str: string): number {
    // "1.5 kg" -> 1.5, "1/2" -> 0.5
    if (str.includes('/')) {
        const [n, d] = str.split('/').map(Number);
        return d ? n / d : 0;
    }
    return parseFloat(str) || 1; // default multiplier 1 if just "onion"
}

function estimateCalories(ingredients: string[]): { kcal: number, p: number, c: number, f: number } {
    let totalKcal = 0;

    // Makrolar için basit oranlar (guesstimate)
    // Protein %20, Carb %40, Fat %40 generic distribution of total calories unless specific
    // Bunu daha da detaylandırabiliriz ama şimdilik toplam KCAL önemli.

    for (const raw of ingredients) {
        // Raw: "1kg Chicken Breast" or "Chicken Breast (1kg)" script formatına göre değişir.
        // Scriptimiz "Chicken Breast (1kg)" formatında üretiyor: list.push(measure ? `${ing} (${measure})` : ing);
        // Örn: "Soy Sauce (3/4 cup)"

        const lower = raw.toLowerCase();

        // 1. Keyword match in DB
        const key = Object.keys(KCAL_DB).find(k => lower.includes(k));
        if (!key) continue; // Unknown ingredient, skip (or assume 0)

        const calPer100g = KCAL_DB[key];

        // 2. Extract amount and unit
        // Regex to find things like "3/4 cup", "500g", "2 tbsp" inside parens or at start
        // "Chicken Breast (1kg)" -> match "1kg"
        // "3/4 cup Sugar" -> match "3/4 cup"

        let grams = 100; // Default serving 100g

        // Try to find units in the string
        let foundUnit = false;
        for (const [unitName, multiplier] of Object.entries(UNITS)) {
            // Regex: number followed by unit, possibly with space
            // e.g. "1 kg", "1.5kg", "1/2 cup"
            // \b ensures we don't match "g" in "egg"
            const regex = new RegExp(`([\\d./]+)\\s*${unitName}\\b`, 'i');
            const match = lower.match(regex);

            if (match) {
                const amount = parseAmount(match[1]);
                grams = amount * multiplier;
                foundUnit = true;
                break;
            }
        }

        // If no unit found, but numbers exist "2 onions"
        if (!foundUnit) {
            const numMatch = lower.match(/(\d+)/);
            if (numMatch) {
                const count = parseInt(numMatch[1], 10);
                if (count < 20) { // Avoid "350 degree" being interpreted as 350 onions
                    grams = count * 100; // Assume 1 item ~ 100g
                }
            }
        }

        totalKcal += (grams / 100) * calPer100g;
    }

    // Sanity checks
    if (totalKcal < 50) totalKcal = 150; // Minimum meal
    if (totalKcal > 2000) totalKcal = 1200; // Cap ridiculous parsing errors

    // Generate macro split estimate based on ingredients keywords
    // If "chicken" in ingredients -> heavy protein
    // If "rice" -> heavy carbs
    // If "oil" -> heavy fat

    const str = ingredients.join(' ').toLowerCase();
    let p_ratio = 0.2;
    let c_ratio = 0.4;
    let f_ratio = 0.4;

    if (str.includes('chicken') || str.includes('beef') || str.includes('fish') || str.includes('egg')) {
        p_ratio += 0.2; c_ratio -= 0.1; f_ratio -= 0.1;
    }
    if (str.includes('rice') || str.includes('pasta') || str.includes('bread') || str.includes('potato')) {
        c_ratio += 0.2; p_ratio -= 0.1; f_ratio -= 0.1;
    }
    if (str.includes('cream') || str.includes('cheese') || str.includes('oil') || str.includes('butter')) {
        f_ratio += 0.2; p_ratio -= 0.1; c_ratio -= 0.1;
    }

    // Normalize
    const total = p_ratio + c_ratio + f_ratio;
    p_ratio /= total;
    c_ratio /= total;
    f_ratio /= total;

    return {
        kcal: Math.round(totalKcal),
        p: Math.round((totalKcal * p_ratio) / 4),
        c: Math.round((totalKcal * c_ratio) / 4),
        f: Math.round((totalKcal * f_ratio) / 9),
    };
}

async function main() {
    if (!(await fs.stat(SEED_PATH).catch(() => false))) {
        console.error("Seed file not found. Run build-recipes.ts first.");
        process.exit(1);
    }

    const raw = await fs.readFile(SEED_PATH, "utf-8");
    const recipes = JSON.parse(raw);

    console.log(`Processing ${recipes.length} recipes...`);

    let updatedCount = 0;
    const updatedRecipes = recipes.map((r: any) => {
        if (!r.ingredients || r.ingredients.length === 0) return r;

        const est = estimateCalories(r.ingredients);

        // Update recipe
        return {
            ...r,
            kcal: est.kcal,
            protein: est.p,
            carbs: est.c,
            fat: est.f,
            // Flag to show it's estimated
            isEstimated: true
        };
    });

    await fs.writeFile(SEED_PATH, JSON.stringify(updatedRecipes, null, 2), "utf-8");
    console.log(`✅ Enriched ${updatedRecipes.length} recipes with nutrition estimates.`);
}

main().catch(console.error);
