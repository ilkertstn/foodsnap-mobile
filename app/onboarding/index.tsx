import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View
} from "react-native";
import { useLanguage } from "../../context/LanguageContext";
import { useMeals } from "../../context/MealContext";

// --- COMPONENTS ---

const StepIndicator = ({ currentStep, totalSteps }: { currentStep: number, totalSteps: number }) => {
    return (
        <View style={styles.stepContainer}>
            {Array.from({ length: totalSteps }).map((_, index) => (
                <View
                    key={index}
                    style={[
                        styles.stepDot,
                        index + 1 <= currentStep ? styles.stepDotActive : styles.stepDotInactive
                    ]}
                />
            ))}
        </View>
    );
};

const InputField = ({ label, value, onChange, placeholder, numeric, multiline }: { label: string, value: string, onChange: (t: string) => void, placeholder: string, numeric?: boolean, multiline?: boolean }) => (
    <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>{label}</Text>
        <TextInput
            value={value}
            onChangeText={onChange}
            placeholder={placeholder}
            keyboardType={numeric ? "numeric" : "default"}
            multiline={multiline}
            style={[styles.input, multiline && { height: 80, textAlignVertical: 'top' }]}
        />
    </View>
);

const OptionButton = ({ label, selected, onPress }: { label: string, selected: boolean, onPress: () => void }) => (
    <Pressable
        style={[styles.optionButton, selected && styles.optionButtonSelected]}
        onPress={onPress}
    >
        <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{label}</Text>
        {selected && <Ionicons name="checkmark-circle" size={20} color="#22c55e" />}
    </Pressable>
);

const MultiSelectOption = ({ label, selected, onPress }: { label: string, selected: boolean, onPress: () => void }) => (
    <Pressable
        style={[styles.optionButton, selected && styles.optionButtonSelected]}
        onPress={onPress}
    >
        <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{label}</Text>
        <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
            {selected && <Ionicons name="checkmark" size={14} color="white" />}
        </View>
    </Pressable>
);


// --- MAIN SCREEN ---

export default function OnboardingScreen() {
    const { t } = useLanguage();
    const router = useRouter();
    const { profile, updateProfile, updateGoals } = useMeals();

    const [step, setStep] = useState(1);
    const TOTAL_STEPS = 4;

    // Form State
    const [data, setData] = useState({
        // Step 1: Physical
        gender: profile.gender || "male",
        age: String(profile.age || ""),
        height: String(profile.heightCm || ""),
        weight: String(profile.weightKg || ""),

        // Step 2: Lifestyle
        activity: profile.activity || "sedentary",
        sleepHours: String(profile.sleepHours || "7"),
        waterTarget: String(profile.reminders?.waterInterval ? 2500 : 2500),

        // Step 3: Nutrition
        dietType: profile.dietType || "standard",
        allergies: profile.allergies || [] as string[],
        mealsPerDay: profile.mealsPerDay || 3,

        // Step 4: Goals
        goal: profile.goal || "lose",
        weeklyPace: profile.weeklyGoalRate || 0.5
    });

    const calculatePlan = () => {
        const age = Number(data.age) || 30;
        const weight = Number(data.weight) || 75;
        const height = Number(data.height) || 175;

        let bmr = 0;
        if (data.gender === "male") {
            bmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
        } else {
            bmr = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
        }

        const activityMultipliers: Record<string, number> = {
            sedentary: 1.2,
            light: 1.375,
            active: 1.55,
        };
        let tdee = bmr * (activityMultipliers[data.activity] || 1.2);

        // Adjust for Goal
        // 1kg fat = ~7700 kcal. 
        // 0.5kg/week = ~3850 kcal/week = ~550 kcal/day deficit
        const deficit = (data.weeklyPace || 0.5) * 1100; // Rough approximation: 0.5kg -> 550kcal

        if (data.goal === "lose") tdee -= deficit;
        if (data.goal === "gain") tdee += deficit;

        const newCalories = Math.round(tdee) > 1200 ? Math.round(tdee) : 1200;

        // Macro Split (Simplified based on Diet Type)
        let pRatio = 0.30;
        let cRatio = 0.35;
        let fRatio = 0.35;

        if (data.dietType === "keto") {
            pRatio = 0.25; cRatio = 0.05; fRatio = 0.70;
        } else if (data.dietType === "vegan" || data.dietType === "vegetarian") {
            pRatio = 0.20; cRatio = 0.50; fRatio = 0.30;
        }

        return {
            calories: newCalories,
            protein: Math.round((newCalories * pRatio) / 4),
            carbs: Math.round((newCalories * cRatio) / 4),
            fat: Math.round((newCalories * fRatio) / 9),
            water: Number(data.waterTarget) || 2500,
            strategy: "auto" as const
        };
    };

    const handleFinish = () => {
        const newGoals = calculatePlan();

        updateProfile({
            ...profile,
            // Step 1
            gender: data.gender as any,
            age: Number(data.age),
            heightCm: Number(data.height),
            weightKg: Number(data.weight),
            // Step 2
            activity: data.activity as any,
            sleepHours: Number(data.sleepHours),
            // Step 3
            dietType: data.dietType,
            allergies: data.allergies,
            mealsPerDay: data.mealsPerDay,
            // Step 4
            goal: data.goal as any,
            weeklyGoalRate: data.weeklyPace,

            isOnboardingCompleted: true
        });

        updateGoals(newGoals);
        router.replace("/(tabs)/progress");
    };

    const renderStep1 = () => (
        <View style={styles.stepContent}>
            <Text style={styles.sectionTitle}>{t("onboarding.step1")}</Text>

            <View style={styles.row}>
                <OptionButton
                    label={t("profile.male")}
                    selected={data.gender === "male"}
                    onPress={() => setData({ ...data, gender: "male" })}
                />
                <OptionButton
                    label={t("profile.female")}
                    selected={data.gender === "female"}
                    onPress={() => setData({ ...data, gender: "female" })}
                />
            </View>

            <InputField label={t("profile.age")} value={data.age} onChange={t => setData({ ...data, age: t })} placeholder="30" numeric />
            <InputField label={t("profile.height") + " (cm)"} value={data.height} onChange={t => setData({ ...data, height: t })} placeholder="175" numeric />
            <InputField label={t("profile.weight") + " (kg)"} value={data.weight} onChange={t => setData({ ...data, weight: t })} placeholder="75" numeric />
        </View>
    );

    const renderStep2 = () => (
        <View style={styles.stepContent}>
            <Text style={styles.sectionTitle}>{t("onboarding.step2")}</Text>

            <Text style={styles.label}>{t("profile.activity")}</Text>
            <OptionButton label={t("profile.sedentary")} selected={data.activity === "sedentary"} onPress={() => setData({ ...data, activity: "sedentary" })} />
            <OptionButton label={t("profile.light")} selected={data.activity === "light"} onPress={() => setData({ ...data, activity: "light" })} />
            <OptionButton label={t("profile.active")} selected={data.activity === "active"} onPress={() => setData({ ...data, activity: "active" })} />

            <View style={styles.spacer} />
            <InputField label={t("profile.sleepHours")} value={data.sleepHours} onChange={t => setData({ ...data, sleepHours: t })} placeholder="7" numeric />
            <InputField label={t("profile.waterTarget") + " (ml)"} value={data.waterTarget} onChange={t => setData({ ...data, waterTarget: t })} placeholder="2500" numeric />
        </View>
    );

    const renderStep3 = () => (
        <View style={styles.stepContent}>
            <Text style={styles.sectionTitle}>{t("onboarding.step3")}</Text>

            <Text style={styles.label}>{t("profile.dietType")}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                {["standard", "vegetarian", "vegan", "keto", "paleo", "pescetarian"].map((d) => (
                    <Pressable
                        key={d}
                        style={[styles.chip, data.dietType === d && styles.chipSelected]}
                        onPress={() => setData({ ...data, dietType: d })}
                    >
                        <Text style={[styles.chipText, data.dietType === d && styles.chipTextSelected]}>
                            {t(`profile.diet_${d}`)}
                        </Text>
                    </Pressable>
                ))}
            </ScrollView>

            <Text style={styles.label}>{t("profile.allergies")}</Text>
            <View style={styles.wrapContainer}>
                {["gluten", "dairy", "nut", "shellfish", "none"].map((a) => {
                    const isSelected = data.allergies.includes(a);
                    return (
                        <Pressable
                            key={a}
                            style={[styles.smallChip, isSelected && styles.smallChipSelected]}
                            onPress={() => {
                                if (a === "none") {
                                    setData({ ...data, allergies: ["none"] });
                                } else {
                                    const newAllergies = isSelected
                                        ? data.allergies.filter(x => x !== a)
                                        : [...data.allergies.filter(x => x !== "none"), a];
                                    setData({ ...data, allergies: newAllergies });
                                }
                            }}
                        >
                            <Text style={[styles.smallChipText, isSelected && styles.smallChipTextSelected]}>
                                {t(`profile.allergy_${a}`)}
                            </Text>
                        </Pressable>
                    );
                })}
            </View>

            <View style={styles.spacer} />
            <Text style={styles.label}>{t("profile.mealsPerDay")}: {data.mealsPerDay}</Text>
            <View style={styles.row}>
                {[3, 4, 5, 6].map(num => (
                    <Pressable
                        key={num}
                        style={[styles.circleButton, data.mealsPerDay === num && styles.circleButtonSelected]}
                        onPress={() => setData({ ...data, mealsPerDay: num })}
                    >
                        <Text style={[styles.circleText, data.mealsPerDay === num && styles.circleTextSelected]}>{num}</Text>
                    </Pressable>
                ))}
            </View>
        </View>
    );

    const renderStep4 = () => (
        <View style={styles.stepContent}>
            <Text style={styles.sectionTitle}>{t("onboarding.step4")}</Text>

            <OptionButton label={t("profile.lose")} selected={data.goal === "lose"} onPress={() => setData({ ...data, goal: "lose" })} />
            <OptionButton label={t("profile.maintain")} selected={data.goal === "maintain"} onPress={() => setData({ ...data, goal: "maintain" })} />
            <OptionButton label={t("profile.gain")} selected={data.goal === "gain"} onPress={() => setData({ ...data, goal: "gain" })} />

            {data.goal !== "maintain" && (
                <>
                    <View style={styles.spacer} />
                    <Text style={styles.label}>{t("profile.weeklyPace")}</Text>
                    <OptionButton label={t("profile.pace_relaxed")} selected={data.weeklyPace === 0.25} onPress={() => setData({ ...data, weeklyPace: 0.25 })} />
                    <OptionButton label={t("profile.pace_normal")} selected={data.weeklyPace === 0.5} onPress={() => setData({ ...data, weeklyPace: 0.5 })} />
                    <OptionButton label={t("profile.pace_aggressive")} selected={data.weeklyPace === 0.8} onPress={() => setData({ ...data, weeklyPace: 0.8 })} />
                </>
            )}
        </View>
    );

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={["#ffffff", "#f8fafc", "#f1f5f9"]}
                style={StyleSheet.absoluteFill}
            />

            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>{t("onboarding.title")}</Text>
                    <StepIndicator currentStep={step} totalSteps={TOTAL_STEPS} />
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {step === 1 && renderStep1()}
                    {step === 2 && renderStep2()}
                    {step === 3 && renderStep3()}
                    {step === 4 && renderStep4()}
                </ScrollView>

                <View style={styles.footer}>
                    {step > 1 && (
                        <Pressable style={styles.backButton} onPress={() => setStep(step - 1)}>
                            <Text style={styles.backButtonText}>{t("onboarding.back")}</Text>
                        </Pressable>
                    )}

                    <Pressable
                        style={[styles.nextButton, step === 1 && { flex: 1 }]}
                        onPress={() => {
                            if (step < TOTAL_STEPS) setStep(step + 1);
                            else handleFinish();
                        }}
                    >
                        <Text style={styles.nextButtonText}>
                            {step === TOTAL_STEPS ? t("onboarding.start") : t("onboarding.next")}
                        </Text>
                        <Ionicons name="arrow-forward" size={20} color="white" />
                    </Pressable>
                </View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    safeArea: { flex: 1 },
    header: { padding: 24, paddingBottom: 10 },
    headerTitle: { fontSize: 24, fontWeight: "800", color: "#1e293b", textAlign: "center", marginBottom: 16 },
    scrollContent: { padding: 24 },
    stepContent: { gap: 16 },
    sectionTitle: { fontSize: 18, fontWeight: "600", color: "#334155", marginBottom: 8 },
    label: { fontSize: 14, fontWeight: "600", color: "#64748b", marginTop: 8, marginBottom: 4 },

    // Step Indicator
    stepContainer: { flexDirection: "row", justifyContent: "center", gap: 8 },
    stepDot: { width: 40, height: 4, borderRadius: 2 },
    stepDotActive: { backgroundColor: "#22c55e" },
    stepDotInactive: { backgroundColor: "#e2e8f0" },

    // Inputs
    inputContainer: { gap: 6, marginBottom: 12 },
    inputLabel: { fontSize: 13, fontWeight: "600", color: "#64748b", marginLeft: 4 },
    input: { backgroundColor: "white", padding: 16, borderRadius: 16, borderWidth: 1, borderColor: "#e2e8f0", fontSize: 16, color: "#1e293b" },

    // Options
    optionButton: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "white", padding: 18, borderRadius: 16, borderWidth: 1, borderColor: "#e2e8f0", marginBottom: 10 },
    optionButtonSelected: { borderColor: "#22c55e", backgroundColor: "#f0fdf4" },
    optionText: { fontSize: 16, color: "#334155", fontWeight: "500" },
    optionTextSelected: { color: "#15803d", fontWeight: "600" },

    // Chips
    horizontalScroll: { flexDirection: "row", marginBottom: 12 },
    chip: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: "white", borderRadius: 20, borderWidth: 1, borderColor: "#e2e8f0", marginRight: 8 },
    chipSelected: { backgroundColor: "#22c55e", borderColor: "#22c55e" },
    chipText: { color: "#64748b", fontWeight: "600" },
    chipTextSelected: { color: "white" },

    wrapContainer: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    smallChip: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: "white", borderRadius: 12, borderWidth: 1, borderColor: "#e2e8f0" },
    smallChipSelected: { backgroundColor: "#f0fdf4", borderColor: "#22c55e" },
    smallChipText: { fontSize: 13, color: "#475569" },
    smallChipTextSelected: { color: "#15803d", fontWeight: "600" },
    checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 2, borderColor: "#cbd5e1", alignItems: "center", justifyContent: "center" },
    checkboxSelected: { backgroundColor: "#22c55e", borderColor: "#22c55e" },

    // Circles (Meals)
    circleButton: { width: 50, height: 50, borderRadius: 25, backgroundColor: "white", borderWidth: 1, borderColor: "#e2e8f0", alignItems: "center", justifyContent: "center" },
    circleButtonSelected: { backgroundColor: "#22c55e", borderColor: "#22c55e" },
    circleText: { fontSize: 18, fontWeight: "600", color: "#64748b" },
    circleTextSelected: { color: "white" },

    // Footer
    footer: { padding: 24, flexDirection: "row", gap: 16, borderTopWidth: 1, borderTopColor: "#f1f5f9", backgroundColor: "white" },
    backButton: { flex: 1, padding: 18, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: "#f1f5f9" },
    backButtonText: { color: "#64748b", fontSize: 16, fontWeight: "600" },
    nextButton: { flex: 2, padding: 18, borderRadius: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#22c55e" },
    nextButtonText: { color: "white", fontSize: 16, fontWeight: "700" },

    row: { flexDirection: "row", gap: 12, marginBottom: 12 },
    spacer: { height: 16 },
});

