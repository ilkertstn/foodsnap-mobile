// Wait, I put setLocal in LocalStorage.ts.
import { ALL_BADGES } from "@/constants/badges";
import { auth } from "@/firebaseConfig";
import { LocalData } from "@/types/sync"; // Check types/sync.ts
import { setLocal } from "@/utils/sync/LocalStorage";
import { bootstrapSync } from "@/utils/sync/SyncBootstrap";
import { pushCloud } from "@/utils/sync/SyncService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Badge, ExerciseEntry, FoodEntry, FoodResult, Goals, Logs, MealType, Profile, WeightEntry } from "../types";
import { cancelReminders, registerForPushNotificationsAsync, scheduleMealReminders, scheduleWaterReminders, sendImmediateNotification } from "../utils/notifications";

const STORAGE_KEYS = {
    PROFILE: "foodsnap_profile",
    GOALS: "foodsnap_goals",
    LOGS: "foodsnap_logs",
    WEIGHT_HISTORY: "foodsnap_weight_history",
    RECENT_SCANS: "foodsnap_recent_scans",
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
    addWeightEntry: (weight: number) => void;
    recentScans: FoodResult[];
    addRecentScan: (scan: FoodResult) => void;
    addEntry: (date: string, mealType: MealType, entry: Omit<FoodEntry, "id" | "createdAt">) => void;
    removeEntry: (date: string, mealType: MealType, id: string) => void;
    addWater: (date: string, amount: number) => void;
    addExercise: (date: string, exercise: Omit<ExerciseEntry, "id" | "createdAt">) => void;
    removeExercise: (date: string, id: string) => void;
    toggleReminder: (type: 'water' | 'meals', enabled: boolean) => Promise<boolean>;
    checkSmartReminders: () => Promise<void>;
    getTotalMealCount: () => number;
    streaks: {
        water: number;
        log: number;
    };
    newlyUnlockedBadge: Badge | null;
    clearNewBadge: () => void;
    showBackupPrompt: boolean;
    dismissBackupPrompt: () => void;
    getDailySummary: (dateStr?: string) => {
        consumed: { calories: number; protein: number; carbs: number; fat: number; water: number };
        burned: number;
        remaining: { calories: number; protein: number; carbs: number; fat: number; water: number }
    };
};

const MealContext = createContext<MealContextType | undefined>(undefined);

export const MealProvider = ({ children }: { children: React.ReactNode }) => {
    // Track current user ID reactively using onAuthStateChanged
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [authReady, setAuthReady] = useState(false);

    useEffect(() => {
        const { onAuthStateChanged } = require("firebase/auth");
        const unsubscribe = onAuthStateChanged(auth, (user: any) => {
            setCurrentUserId(user?.uid ?? null);
            setAuthReady(true);
        });
        return () => unsubscribe();
    }, []);

    const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
    const [goals, setGoals] = useState<Goals>(DEFAULT_GOALS);
    const [logs, setLogs] = useState<Logs>({});
    const [weightHistory, setWeightHistory] = useState<WeightEntry[]>([]);
    const [recentScans, setRecentScans] = useState<FoodResult[]>([]);
    const [newlyUnlockedBadge, setNewlyUnlockedBadge] = useState<Badge | null>(null);
    const [showBackupPrompt, setShowBackupPrompt] = useState(false);

    const checkBackupTrigger = async () => {
        if (!auth.currentUser?.isAnonymous) return;

        try {
            const hasSeen = await AsyncStorage.getItem("foodsnap_has_seen_backup_prompt");
            if (hasSeen === "true") return;

            const countStr = await AsyncStorage.getItem("foodsnap_action_count");
            const count = parseInt(countStr || "0", 10) + 1;
            await AsyncStorage.setItem("foodsnap_action_count", count.toString());

            if (count >= 3) {
                setShowBackupPrompt(true);
            }
        } catch (e) {
            console.error("Error checking backup trigger", e);
        }
    };

    const dismissBackupPrompt = async () => {
        setShowBackupPrompt(false);
        try {
            await AsyncStorage.setItem("foodsnap_has_seen_backup_prompt", "true");
        } catch (e) {
            console.error("Error setting has seen prompt", e);
        }
    };

    const [isLoadingData, setIsLoadingData] = useState(true);
    const lastLoadedUidRef = React.useRef<string | null>(null);

    // Initial Sync
    useEffect(() => {
        if (!authReady) return; // Wait for auth to initialize

        const init = async () => {
            const userId = currentUserId;
            if (!userId) return;

            // Mark that we're loading a new user
            lastLoadedUidRef.current = null;

            // Reset state first to prevent leaking old user data
            setIsLoadingData(true);
            setProfile(DEFAULT_PROFILE);
            setGoals(DEFAULT_GOALS);
            setLogs({});
            setWeightHistory([]);
            setRecentScans([]);

            try {
                const emptyData: LocalData = {
                    schemaVersion: 1,
                    updatedAt: Date.now(),
                    profile: DEFAULT_PROFILE,
                    goals: DEFAULT_GOALS,
                    logs: {},
                    weightHistory: [],
                    recentScans: [],
                };

                const data = await bootstrapSync(userId, () => emptyData);

                if (data) {
                    setProfile(data.profile);
                    setGoals(data.goals);
                    setLogs(data.logs);
                    setWeightHistory(data.weightHistory);
                    setRecentScans(data.recentScans);
                }

                // Mark that this user's data is now loaded
                lastLoadedUidRef.current = userId;
            } catch (e) {
                console.error("Bootstrap failed", e);
            } finally {
                setIsLoadingData(false);
            }
        };

        if (currentUserId) {
            init();
        } else {
            // No user, reset to defaults
            lastLoadedUidRef.current = null;
            setProfile(DEFAULT_PROFILE);
            setGoals(DEFAULT_GOALS);
            setLogs({});
            setWeightHistory([]);
            setRecentScans([]);
            setIsLoadingData(false);
        }
    }, [currentUserId, authReady]);

    // Unified Persistence: Debounced save to Local + Cloud
    useEffect(() => {
        const userId = currentUserId;
        // Skip if loading, no user, or if the current user doesn't match what we loaded
        // (prevents cross-user writes during user switch)
        if (isLoadingData || !userId || lastLoadedUidRef.current !== userId) return;

        const timer = setTimeout(async () => {
            // Double-check uid hasn't changed during the debounce
            if (lastLoadedUidRef.current !== userId) return;

            const currentData: LocalData = {
                schemaVersion: 1,
                updatedAt: Date.now(),
                profile: { ...profile, unlockedBadges: profile.unlockedBadges || [] },
                goals,
                logs,
                weightHistory,
                recentScans,
            };

            await setLocal(userId, currentData);
            await pushCloud(currentData);
        }, 3000);

        return () => clearTimeout(timer);
    }, [profile, goals, logs, weightHistory, recentScans, isLoadingData, currentUserId]);

    // Recalculate goals on profile change (Strategy logic kept)
    useEffect(() => {
        if (goals.strategy === "auto") {
            recalculateGoals(profile);
        }
    }, [profile.weightKg, profile.heightCm, profile.age, profile.gender, profile.activity, profile.goal]);

    // Removed old loadData/saveData functions and individual effects

    const recalculateGoals = (p: Profile) => {
        let bmr = 0;
        if (p.gender === "male") {
            bmr = 88.362 + (13.397 * p.weightKg) + (4.799 * p.heightCm) - (5.677 * p.age);
        } else {
            bmr = 447.593 + (9.247 * p.weightKg) + (3.098 * p.heightCm) - (4.330 * p.age);
        }

        const multipliers = {
            sedentary: 1.2,
            light: 1.375,
            active: 1.55,
        };
        let tdee = bmr * multipliers[p.activity];

        if (p.goal === "lose") tdee -= 500;
        if (p.goal === "gain") tdee += 500;

        const newCalories = Math.round(tdee);

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
        setProfile((prev) => {
            const updated = { ...prev, ...newProfile };


            if (newProfile.weightKg && newProfile.weightKg !== prev.weightKg) {
                const today = new Date().toISOString().split('T')[0];
                setWeightHistory(prevHistory => {
                    const filtered = prevHistory.filter(h => h.date !== today);
                    const newHistory = [...filtered, { date: today, weight: newProfile.weightKg! }];
                    return newHistory.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                });
            }

            return updated;
        });
    };

    const addWeightEntry = (weight: number) => {
        const today = new Date().toISOString().split('T')[0];
        setWeightHistory(prev => {
            const filtered = prev.filter(e => e.date !== today);
            return [...filtered, { date: today, weight }].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        });
        updateProfile({ weightKg: weight });
    };

    const addRecentScan = (scan: FoodResult) => {
        setRecentScans(prev => {

            const filtered = prev.filter(p => p.meal_name.toLowerCase() !== scan.meal_name.toLowerCase());

            return [scan, ...filtered].slice(0, 10);
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

        checkBackupTrigger();

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


        const currentLog = logs[date];
        const currentWater = currentLog?.water_ml || 0;

        if (currentWater + amount >= 2000) {
            if (!profile.unlockedBadges?.some(b => b.badgeId === "water_2l")) {

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

            const token = await registerForPushNotificationsAsync();
            if (!token && !__DEV__) {

            }

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

    const streaks = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        let waterStreak = 0;
        let logStreak = 0;

        let checkDate = new Date();

        for (let i = 0; i < 30; i++) {
            const dStr = checkDate.toISOString().split('T')[0];
            const log = logs[dStr];

            if (log && log.water_ml >= (goals.water || 2000)) {
                waterStreak++;
            } else if (dStr !== today) {
                break;
            }
            checkDate.setDate(checkDate.getDate() - 1);
        }

        checkDate = new Date();
        for (let i = 0; i < 30; i++) {
            const dStr = checkDate.toISOString().split('T')[0];
            const log = logs[dStr];
            const mealCount = log ? (log.meals.breakfast.length + log.meals.lunch.length + log.meals.dinner.length + log.meals.snack.length) : 0;

            if (mealCount >= 2) {
                logStreak++;
            } else if (dStr !== today) {
                break;
            }
            checkDate.setDate(checkDate.getDate() - 1);
        }

        return { water: waterStreak, log: logStreak };
    }, [logs, goals.water]);


    const evaluateBadges = async () => {
        console.log("Evaluate Badges Running");
        // const streaks = calculateStreaks(); // Removed function call
        const unlockedIds = new Set(profile.unlockedBadges?.map(b => b.badgeId) || []);
        let newBadge: Badge | null = null;
        let updatedProfile = { ...profile };

        for (const badge of ALL_BADGES) {
            if (unlockedIds.has(badge.id)) continue;

            let unlocked = false;
            const { condition } = badge;
            if (typeof condition === 'string') continue;

            const today = new Date().toISOString().split('T')[0];

            if (condition.type === 'count') {
                if (condition.metric === 'water_log') {
                    const daysWithWater = Object.values(logs).filter(l => l.water_ml > 0).length;
                    if (daysWithWater >= condition.count) unlocked = true;
                }
            } else if (condition.type === 'streak_days') {
                if (condition.metric === 'water_goal' && streaks.water >= condition.days) unlocked = true;
                if (condition.metric === 'log_streak' && streaks.log >= condition.days) unlocked = true;

                if (condition.metric === 'calorie_goal') {
                    let calStreak = 0;
                    let d = new Date();
                    for (let i = 0; i < condition.days + 2; i++) {
                        const dateStr = d.toISOString().split('T')[0];
                        const dayLog = logs[dateStr];
                        const cals = dayLog ? (Object.values(dayLog.meals.breakfast).reduce((a, b) => a + b.calories_kcal, 0) +
                            Object.values(dayLog.meals.lunch).reduce((a, b) => a + b.calories_kcal, 0) +
                            Object.values(dayLog.meals.dinner).reduce((a, b) => a + b.calories_kcal, 0) +
                            Object.values(dayLog.meals.snack).reduce((a, b) => a + b.calories_kcal, 0)) : 0;

                        if (dayLog && cals > 0 && cals <= goals.calories) {
                            calStreak++;
                        } else if (dateStr !== today) {
                            // If we miss a day other than today (which might be incomplete), break
                            break;
                        }
                        d.setDate(d.getDate() - 1);
                    }
                    if (calStreak >= condition.days) unlocked = true;
                }
            } else if (condition.type === 'consistency') {
                if (condition.metric === 'calorie_goal') {
                    let hitCount = 0;
                    let d = new Date();
                    for (let i = 0; i < condition.window; i++) {
                        const dateStr = d.toISOString().split('T')[0];
                        const dayLog = logs[dateStr];

                        const cals = dayLog ? (
                            [...dayLog.meals.breakfast, ...dayLog.meals.lunch, ...dayLog.meals.dinner, ...dayLog.meals.snack]
                                .reduce((acc, item) => acc + item.calories_kcal, 0)
                        ) : 0;

                        if (cals > 0 && cals <= goals.calories) {
                            hitCount++;
                        }
                        d.setDate(d.getDate() - 1);
                    }
                    if (hitCount >= condition.days) unlocked = true;
                }
            }

            if (unlocked) {
                newBadge = badge;
                // Avoid duplicates using updatedProfile which tracks accumulations in this loop
                if (!updatedProfile.unlockedBadges?.some(b => b.badgeId === badge.id)) {
                    updatedProfile.unlockedBadges = [
                        ...(updatedProfile.unlockedBadges || []),
                        { badgeId: badge.id, unlockedAt: Date.now() }
                    ];
                }
                unlockedIds.add(badge.id);
            }
        }

        if (newBadge) {
            console.log("Unlocking new badge:", newBadge.id);
            setProfile(updatedProfile);
            setNewlyUnlockedBadge(newBadge);
        }
    };

    const getTotalMealCount = () => {
        let count = 0;
        Object.values(logs).forEach(log => {
            count += log.meals.breakfast.length + log.meals.lunch.length + log.meals.dinner.length + log.meals.snack.length;
        });
        return count;
    };

    const checkSmartReminders = async () => {
        // Respect user settings
        const reminders = profile.reminders;
        if (!reminders) return; // If settings not loaded or all off, don't nag.

        const today = new Date().toISOString().split('T')[0];
        const summary = getDailySummary(today);
        const currentHour = new Date().getHours();

        if (reminders.water && currentHour >= 14 && currentHour < 20 && summary.consumed.water < 1000) {
            await sendImmediateNotification("💧 Drink Water!", "You're behind on your water goal. Grab a glass!");
        }

        if (reminders.meals && currentHour >= 20 && currentHour < 22 && summary.consumed.calories < (goals.calories * 0.5)) {
            await sendImmediateNotification("🍽️ Low Energy?", "You've only eaten 50% of your daily goal. Don't forget dinner!");
        }
    };

    useEffect(() => {
        if (!isLoadingData) {
            checkSmartReminders();
        }
    }, [isLoadingData]);


    useEffect(() => {
        // if (Object.keys(logs).length > 0) {
        //    evaluateBadges();
        // }
    }, [logs]);

    const contextValue = useMemo(() => ({
        profile,
        updateProfile,
        goals,
        updateGoals,
        logs,
        weightHistory,
        addWeightEntry,
        recentScans,
        addRecentScan,
        addEntry,
        removeEntry,
        addWater,
        addExercise,
        removeExercise,
        getDailySummary,
        toggleReminder,
        checkSmartReminders,
        getTotalMealCount,
        streaks,
        newlyUnlockedBadge,
        clearNewBadge,
        showBackupPrompt,
        dismissBackupPrompt,
    }), [
        profile, goals, logs, weightHistory, recentScans, streaks, newlyUnlockedBadge, showBackupPrompt
    ]);

    return (
        <MealContext.Provider value={contextValue}>
            {children}
        </MealContext.Provider>
    );
};

export const useMeals = () => {
    const context = useContext(MealContext);
    if (!context) throw new Error("useMeals must be used within a MealProvider");
    return context;
};
