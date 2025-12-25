import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { FoodEntry, Goals, Logs, MealType, Profile } from "../types";

const STORAGE_KEYS = {
    PROFILE: "user_profile",
    GOALS: "user_goals",
    LOGS: "food_logs",
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
    strategy: "auto",
};

type MealContextType = {
    profile: Profile;
    updateProfile: (p: Partial<Profile>) => void;
    goals: Goals;
    updateGoals: (g: Partial<Goals>) => void;
    logs: Logs;
    addEntry: (date: string, mealType: MealType, entry: Omit<FoodEntry, "id" | "createdAt">) => void;
    removeEntry: (date: string, mealType: MealType, id: string) => void;
    getDailySummary: (dateStr?: string) => { consumed: { calories: number; protein: number; carbs: number; fat: number }; remaining: { calories: number; protein: number; carbs: number; fat: number } };
};

const MealContext = createContext<MealContextType | undefined>(undefined);

export const MealProvider = ({ children }: { children: React.ReactNode }) => {
    const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
    const [goals, setGoals] = useState<Goals>(DEFAULT_GOALS);
    const [logs, setLogs] = useState<Logs>({});

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
            const [p, g, l] = await Promise.all([
                AsyncStorage.getItem(STORAGE_KEYS.PROFILE),
                AsyncStorage.getItem(STORAGE_KEYS.GOALS),
                AsyncStorage.getItem(STORAGE_KEYS.LOGS),
            ]);

            if (p) setProfile(JSON.parse(p));
            if (g) setGoals(JSON.parse(g));
            if (l) setLogs(JSON.parse(l));
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

    const updateProfile = (newProfile: Partial<Profile>) => {
        setProfile((prev) => ({ ...prev, ...newProfile }));
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
            const dayLog = prev[date] || { date, meals: { breakfast: [], lunch: [], dinner: [], snack: [] } };
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

    const getDailySummary = (dateStr?: string) => {
        const targetDate = dateStr || new Date().toISOString().split("T")[0];
        const dayLog = logs[targetDate];

        const consumed = { calories: 0, protein: 0, carbs: 0, fat: 0 };

        if (dayLog) {
            Object.values(dayLog.meals).flat().forEach(meal => {
                consumed.calories += meal.calories_kcal;
                consumed.protein += meal.macros_g.protein;
                consumed.carbs += meal.macros_g.carbs;
                consumed.fat += meal.macros_g.fat;
            });
        }

        const remaining = {
            calories: Math.max(0, goals.calories - consumed.calories),
            protein: Math.max(0, goals.protein - consumed.protein),
            carbs: Math.max(0, goals.carbs - consumed.carbs),
            fat: Math.max(0, goals.fat - consumed.fat),
        };

        return { consumed, remaining };
    };

    return (
        <MealContext.Provider
            value={{
                profile,
                updateProfile,
                goals,
                updateGoals,
                logs,
                addEntry,
                removeEntry,
                getDailySummary,
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
