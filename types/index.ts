export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export type FoodResult = {
    meal_name: string;
    category: MealType;
    calories_kcal: number;
    macros_g: { protein: number; carbs: number; fat: number };
    ingredients: string[];
    confidence: "low" | "medium" | "high";
    notes: string;
    quantity_basis?: "100g" | "serving";
};

export type BadgeCondition =
    | { type: 'count'; metric: 'water_log' | 'meal_log' | 'weight_log'; count: number }
    | { type: 'streak_days'; metric: 'water_goal' | 'calorie_goal' | 'protein_goal' | 'log_streak'; days: number }
    | { type: 'consistency'; metric: 'calorie_goal'; days: number; window: number } // e.g. 5 days in window of 7
    | { type: 'value'; metric: 'weight_loss_kg'; value: number }
    | string;


export type Badge = {
    id: string;
    icon: string;
    condition: any;
    titleKey: string;
    descKey: string;
};

export type Profile = {
    name: string;
    age: number;
    gender: "male" | "female";
    heightCm: number;
    weightKg: number;
    activity: "sedentary" | "light" | "active";
    goal: "lose" | "maintain" | "gain";
    reminders?: {
        water: boolean;
        waterInterval: number; // in hours, default 2
        waterStart: string; // HH:mm, default "09:00"
        waterEnd: string; // HH:mm, default "21:00"
        meals: boolean;
        breakfastTime: string; // HH:mm, default "09:00"
        lunchTime: string; // HH:mm, default "13:00"
        dinnerTime: string; // HH:mm, default "19:00"
    };
    unlockedBadges?: { badgeId: string; unlockedAt: number }[];
    isOnboardingCompleted?: boolean;
    // Expanded Onboarding Fields
    sleepHours?: number;
    dietType?: string;
    allergies?: string[];
    mealsPerDay?: number;
    weeklyGoalRate?: number; // kg per week (e.g. 0.5)
};

export type Goals = {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    water: number; // Daily water goal in ml
    strategy: "auto" | "manual";
};

export type FoodEntry = FoodResult & {
    id: string;
    createdAt: number;
    grams: number | null;
    imageUri?: string; // base64 saklama, sadece uri
};

export type ExerciseEntry = {
    id: string;
    type: string;
    durationMinutes: number;
    caloriesBurned: number;
    createdAt: number;
};

export type DayLog = {
    date: string; // YYYY-MM-DD
    meals: Record<MealType, FoodEntry[]>;
    water_ml: number; // Daily water intake in ml
    exercises: ExerciseEntry[];
};

export type WeightEntry = {
    date: string; // YYYY-MM-DD
    weight: number;
};

export type Logs = Record<string, DayLog>; // key = date
