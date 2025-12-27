import { ALL_BADGES } from "@/constants/badges";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { Badge, ExerciseEntry, FoodEntry, Goals, Logs, MealType, Profile, WeightEntry } from "../types";
import { cancelReminders, registerForPushNotificationsAsync, scheduleMealReminders, scheduleWaterReminders } from "../utils/notifications";

const STORAGE_KEYS = {
    PROFILE: "foodsnap_profile",
    GOALS: "foodsnap_goals",
    LOGS: "foodsnap_logs",
    WEIGHT_HISTORY: "foodsnap_weight_history",
};

const DEFAULT_PROFILE: Profile = {
    name: "User",
    age: 30,
    gender: "male",
    heightCm: 175,
    weightKg: 75,
    activity: "sedentary",
    goal: "maintain",
};

const DEFAULT_GOALS: Goals = {
    calories: 2000,
    protein: 150,
    carbs: 200,
    fat: 65,
    water: 2500,
    strategy: "auto",
};



type MealContextType = {
    profile: Profile;
    updateProfile: (p: Partial<Profile>) => void;
    goals: Goals;
    updateGoals: (g: Partial<Goals>) => void;
    logs: Logs;
    weightHistory: WeightEntry[];
    addEntry: (date: string, mealType: MealType, entry: Omit<FoodEntry, "id" | "createdAt">) => void;
    removeEntry: (date: string, mealType: MealType, id: string) => void;
    addWater: (date: string, amount: number) => void;
    addExercise: (date: string, exercise: Omit<ExerciseEntry, "id" | "createdAt">) => void;
    removeExercise: (date: string, id: string) => void;
    toggleReminder: (type: 'water' | 'meals', enabled: boolean) => Promise<boolean>;
    newlyUnlockedBadge: Badge | null;
    clearNewBadge: () => void;
    getDailySummary: (dateStr?: string) => {
        consumed: { calories: number; protein: number; carbs: number; fat: number; water: number };
        burned: number;
        remaining: { calories: number; protein: number; carbs: number; fat: number; water: number }
    };
};

const MealContext = createContext<MealContextType | undefined>(undefined);

export const MealProvider = ({ children }: { children: React.ReactNode }) => {
    const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
    const [goals, setGoals] = useState<Goals>(DEFAULT_GOALS);
    const [logs, setLogs] = useState<Logs>({});
    const [weightHistory, setWeightHistory] = useState<WeightEntry[]>([]);
    const [newlyUnlockedBadge, setNewlyUnlockedBadge] = useState<Badge | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        saveData(STORAGE_KEYS.PROFILE, profile);
        if (goals.strategy === "auto") {
            recalculateGoals(profile);
        }
    }, [profile]);

    useEffect(() => {
        saveData(STORAGE_KEYS.GOALS, goals);
    }, [goals]);

    useEffect(() => {
        saveData(STORAGE_KEYS.LOGS, logs);
    }, [logs]);

    const loadData = async () => {
        try {
            const [p, g, l, w] = await Promise.all([
                AsyncStorage.getItem(STORAGE_KEYS.PROFILE),
                AsyncStorage.getItem(STORAGE_KEYS.GOALS),
                AsyncStorage.getItem(STORAGE_KEYS.LOGS),
                AsyncStorage.getItem(STORAGE_KEYS.WEIGHT_HISTORY),
            ]);

            if (p) {
                const loadedProfile = JSON.parse(p);
                setProfile(loadedProfile);

                // If we have a profile but no weight history, initialize it with current weight
                if ((!w || JSON.parse(w).length === 0) && loadedProfile.weightKg) {
                    const today = new Date().toISOString().split('T')[0];
                    const initialHistory = [{ date: today, weight: loadedProfile.weightKg }];
                    setWeightHistory(initialHistory);
                    AsyncStorage.setItem(STORAGE_KEYS.WEIGHT_HISTORY, JSON.stringify(initialHistory));
                }
            } else {
                // First time load?
            }

            if (g) setGoals((prev) => ({ ...prev, ...JSON.parse(g) }));
            if (l) setLogs(JSON.parse(l));
            if (w) setWeightHistory(JSON.parse(w));
        } catch (e) {
            console.error("Failed to load data", e);
        }
    };

    const saveData = async (key: string, value: any) => {
        try {
            await AsyncStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.error(`Failed to save ${key}`, e);
        }
    };

    const recalculateGoals = (p: Profile) => {
        // Harris-Benedict BMR
        let bmr = 0;
        if (p.gender === "male") {
            bmr = 88.362 + (13.397 * p.weightKg) + (4.799 * p.heightCm) - (5.677 * p.age);
        } else {
            bmr = 447.593 + (9.247 * p.weightKg) + (3.098 * p.heightCm) - (4.330 * p.age);
        }

        // Activity Multiplier
        const multipliers = {
            sedentary: 1.2,
            light: 1.375,
            active: 1.55,
        };
        let tdee = bmr * multipliers[p.activity];

        // Goal Adjustment
        if (p.goal === "lose") tdee -= 500;
        if (p.goal === "gain") tdee += 500;

        const newCalories = Math.round(tdee);

        // Simple Macro Split: 30% P, 35% C, 35% F
        const pG = Math.round((newCalories * 0.3) / 4);
        const cG = Math.round((newCalories * 0.35) / 4);
        const fG = Math.round((newCalories * 0.35) / 9);

        setGoals((prev) => ({
            ...prev,
            calories: newCalories,
            protein: pG,
            carbs: cG,
            fat: fG,
            strategy: "auto",
        }));
    };

    useEffect(() => {
        AsyncStorage.setItem(STORAGE_KEYS.WEIGHT_HISTORY, JSON.stringify(weightHistory));
    }, [weightHistory]);

    const updateProfile = (newProfile: Partial<Profile>) => {
        setProfile((prev) => {
            const updated = { ...prev, ...newProfile };

            // If weight changed, add to history
            if (newProfile.weightKg && newProfile.weightKg !== prev.weightKg) {
                const today = new Date().toISOString().split('T')[0];
                setWeightHistory(prevHistory => {
                    const newHistory = [...prevHistory, { date: today, weight: newProfile.weightKg! }];
                    // Sort by date
                    return newHistory.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                });
            }

            AsyncStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(updated));
            return updated;
        });
    };

    const updateGoals = (newGoals: Partial<Goals>) => {
        const newStrategy = newGoals.strategy !== undefined ? newGoals.strategy : "manual";
        setGoals((prev) => ({ ...prev, ...newGoals, strategy: newStrategy }));
    };

    const addEntry = (date: string, mealType: MealType, entryData: Omit<FoodEntry, "id" | "createdAt">) => {
        const newEntry: FoodEntry = {
            ...entryData,
            id: Math.random().toString(36).substr(2, 9),
            createdAt: Date.now(),
        };

        if ("imageBase64" in newEntry) {
            delete (newEntry as any).imageBase64;
        }

        setLogs((prev) => {
            const dayLog = prev[date] || { date, meals: { breakfast: [], lunch: [], dinner: [], snack: [] }, water_ml: 0, exercises: [] };
            return {
                ...prev,
                [date]: {
                    ...dayLog,
                    meals: {
                        ...dayLog.meals,
                        [mealType]: [...(dayLog.meals[mealType] || []), newEntry],
                    },
                },
            };
        });

        // Check for "first_log" badge immediately
        if (!profile.unlockedBadges?.some(b => b.badgeId === "first_log")) {
            unlockBadge("first_log");
        }
    };

    const removeEntry = (date: string, mealType: MealType, id: string) => {
        setLogs((prev) => {
            const dayLog = prev[date];
            if (!dayLog) return prev;

            return {
                ...prev,
                [date]: {
                    ...dayLog,
                    meals: {
                        ...dayLog.meals,
                        [mealType]: dayLog.meals[mealType].filter((e) => e.id !== id),
                    },
                },
            };
        });
    };

    const addWater = (date: string, amount: number) => {
        setLogs((prev) => {
            const dayLog = prev[date] || {
                date,
                meals: { breakfast: [], lunch: [], dinner: [], snack: [] },
                water_ml: 0,
                exercises: []
            };

            const currentWater = dayLog.water_ml || 0;
            const newWater = Math.max(0, currentWater + amount);

            return {
                ...prev,
                [date]: {
                    ...dayLog,
                    water_ml: newWater,
                },
            };
        });

        // Check for water badge (using current state + amount approximation)
        // Accessing logs from state might be slightly stale if rapid updates occur, but acceptable for this check
        const currentLog = logs[date];
        const currentWater = currentLog?.water_ml || 0;

        if (currentWater + amount >= 2000) {
            if (!profile.unlockedBadges?.some(b => b.badgeId === "water_2l")) {
                // Determine if we should unlock. 
                // Since this runs after setLogs, hopefully referencing state is fine enough.
                // Or we can just trust the condition met.
                unlockBadge("water_2l");
            }
        }
    };
    const addExercise = (date: string, exerciseData: Omit<ExerciseEntry, "id" | "createdAt">) => {
        const newExercise: ExerciseEntry = {
            ...exerciseData,
            id: Math.random().toString(36).substr(2, 9),
            createdAt: Date.now(),
        };

        setLogs((prev) => {
            const dayLog = prev[date] || {
                date,
                meals: { breakfast: [], lunch: [], dinner: [], snack: [] },
                water_ml: 0,
                exercises: []
            };

            return {
                ...prev,
                [date]: {
                    ...dayLog,
                    exercises: [...(dayLog.exercises || []), newExercise],
                },
            };
        });
    };

    const removeExercise = (date: string, id: string) => {
        setLogs((prev) => {
            const dayLog = prev[date];
            if (!dayLog) return prev;

            return {
                ...prev,
                [date]: {
                    ...dayLog,
                    exercises: (dayLog.exercises || []).filter(e => e.id !== id),
                },
            };
        });
    };

    const getDailySummary = (dateStr?: string) => {
        const targetDate = dateStr || new Date().toISOString().split("T")[0];
        const dayLog = logs[targetDate];
        const consumed = { calories: 0, protein: 0, carbs: 0, fat: 0, water: 0 };
        let burned = 0;

        if (dayLog) {
            consumed.water = dayLog.water_ml || 0;
            if (dayLog.exercises) {
                burned = dayLog.exercises.reduce((acc, curr) => acc + curr.caloriesBurned, 0);
            }
            Object.values(dayLog.meals).flat().forEach(meal => {
                consumed.calories += meal.calories_kcal;
                consumed.protein += meal.macros_g.protein;
                consumed.carbs += meal.macros_g.carbs;
                consumed.fat += meal.macros_g.fat;
            });
        }

        const remaining = {
            calories: Math.max(0, (goals.calories + burned) - consumed.calories),
            protein: Math.max(0, goals.protein - consumed.protein),
            carbs: Math.max(0, goals.carbs - consumed.carbs),
            fat: Math.max(0, goals.fat - consumed.fat),
            water: Math.max(0, goals.water - consumed.water),
        };

        return { consumed, remaining, burned };
    };

    const toggleReminder = async (type: 'water' | 'meals', enabled: boolean) => {
        if (enabled) {
            // Check permissions first
            const token = await registerForPushNotificationsAsync();
            if (!token && !__DEV__) {
                // In prod we need token/permission, in dev/simulator we might skip token check for local notifs
                // actually registerForPushNotificationsAsync requests permission even if token fails on sim
            }
            // we rely on the permission request inside registerForPushNotificationsAsync
        }

        const currentReminders = profile.reminders || {
            water: false,
            waterInterval: 2,
            waterStart: "09:00",
            waterEnd: "21:00",
            meals: false,
            breakfastTime: "09:00",
            lunchTime: "13:00",
            dinnerTime: "19:00"
        };

        if (type === 'water') {
            if (enabled) {
                await scheduleWaterReminders({
                    start: currentReminders.waterStart || "09:00",
                    end: currentReminders.waterEnd || "21:00",
                    interval: currentReminders.waterInterval || 2
                });
            } else await cancelReminders('water');
        } else {
            if (enabled) {
                await scheduleMealReminders({
                    breakfast: currentReminders.breakfastTime || "09:00",
                    lunch: currentReminders.lunchTime || "13:00",
                    dinner: currentReminders.dinnerTime || "19:00"
                });
            } else await cancelReminders('meal');
        }

        updateProfile({
            reminders: {
                ...currentReminders,
                water: type === 'water' ? enabled : currentReminders.water,
                meals: type === 'meals' ? enabled : currentReminders.meals,
            }
        });

        return true;
    };

    const unlockBadge = (badgeId: string) => {
        const badge = ALL_BADGES.find(b => b.id === badgeId);
        if (!badge) return;

        setProfile(prev => {
            // double check inside setter to be safe against race conditions
            if (prev.unlockedBadges?.some(b => b.badgeId === badgeId)) return prev;

            setNewlyUnlockedBadge(badge);

            return {
                ...prev,
                unlockedBadges: [
                    ...(prev.unlockedBadges || []),
                    { badgeId, unlockedAt: Date.now() }
                ]
            };
        });
    };

    const clearNewBadge = () => setNewlyUnlockedBadge(null);

    const checkDailyGoal = (dayLog: typeof logs[string], currentGoals: Goals, type: 'calories' | 'protein') => {
        if (!dayLog) return false;

        let consumed = 0;
        let burned = 0;

        if (dayLog.exercises) {
            burned = dayLog.exercises.reduce((acc, curr) => acc + curr.caloriesBurned, 0);
        }

        const meals = Object.values(dayLog.meals).flat();
        if (type === 'calories') {
            consumed = meals.reduce((acc, curr) => acc + curr.calories_kcal, 0);
            const net = consumed - burned;
            // Allow 10% variance or strict? Let's say +/- 100kcal or just under goal?
            // User prompt implied "tutturdun" (hit the target). 
            // Common app logic: (Goal - 200) <= Net <= (Goal + 200)
            return net >= (currentGoals.calories - 200) && net <= (currentGoals.calories + 200);
        } else if (type === 'protein') {
            consumed = meals.reduce((acc, curr) => acc + curr.macros_g.protein, 0);
            return consumed >= currentGoals.protein;
        }
        return false;
    };

    const evaluateBadges = () => {
        const unlockedIds = new Set(profile.unlockedBadges?.map(b => b.badgeId) || []);

        ALL_BADGES.forEach(badge => {
            if (unlockedIds.has(badge.id)) return;

            let earned = false;
            const today = new Date().toISOString().split('T')[0];

            if (badge.condition === "water_2l") {
                // Already checked in addWater but good to re-check
                if ((logs[today]?.water_ml || 0) >= 2000) earned = true;
            } else if (badge.condition === "first_log") {
                // Already checked
            } else if (badge.condition === "streak_7") {
                let streak = 0;
                // Check last 7 days including today? Or 7 days COMPLETED?
                // Let's check last 7 days up to yesterday + today if complete?
                // Simpler: Check last 7 days.
                for (let i = 0; i < 7; i++) {
                    const d = new Date();
                    d.setDate(d.getDate() - i);
                    const dateStr = d.toISOString().split('T')[0];
                    if (checkDailyGoal(logs[dateStr], goals, 'calories')) streak++;
                    else break;
                }
                if (streak >= 7) earned = true;
            } else if (badge.condition === "protein_streak_3") {
                let streak = 0;
                for (let i = 0; i < 3; i++) {
                    const d = new Date();
                    d.setDate(d.getDate() - i);
                    const dateStr = d.toISOString().split('T')[0];
                    if (checkDailyGoal(logs[dateStr], goals, 'protein')) streak++;
                    else break;
                }
                if (streak >= 3) earned = true;
            } else if (badge.condition === "activity_3_per_week") {
                let activeDays = 0;
                for (let i = 0; i < 7; i++) {
                    const d = new Date();
                    d.setDate(d.getDate() - i);
                    const dateStr = d.toISOString().split('T')[0];
                    const dayLog = logs[dateStr];
                    if (dayLog && dayLog.exercises && dayLog.exercises.length > 0) activeDays++;
                }
                if (activeDays >= 3) earned = true;
            }

            if (earned) unlockBadge(badge.id);
        });
    };

    // Evaluate badges whenever logs change
    useEffect(() => {
        // Debounce could be good but for now simple effect
        if (Object.keys(logs).length > 0) {
            evaluateBadges();
        }
    }, [logs]);

    return (
        <MealContext.Provider
            value={{
                profile,
                updateProfile,
                goals,
                updateGoals,
                logs,
                weightHistory,
                addEntry,
                removeEntry,
                addWater,
                addExercise,
                removeExercise,
                getDailySummary,
                toggleReminder,
                newlyUnlockedBadge,
                clearNewBadge,
            }}
        >
            {children}
        </MealContext.Provider>
    );
};

export const useMeals = () => {
    const context = useContext(MealContext);
    if (!context) throw new Error("useMeals must be used within a MealProvider");
    return context;
};
