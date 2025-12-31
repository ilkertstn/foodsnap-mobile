import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLanguage } from "../../context/LanguageContext";
import { useMeals } from "../../context/MealContext";

const InputField = ({ label, value, onChange, placeholder, numeric = false }: { label: string, value: string, onChange: (t: string) => void, placeholder: string, numeric?: boolean }) => (
    <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>{label}</Text>
        <TextInput
            value={value}
            onChangeText={onChange}
            placeholder={placeholder}
            keyboardType={numeric ? "numeric" : "default"}
            style={styles.input}
        />
    </View>
);

const SelectionModal = ({
    visible,
    onClose,
    title,
    options,
    onSelect
}: {
    visible: boolean;
    onClose: () => void;
    title: string;
    options: { label: string; value: string }[];
    onSelect: (value: any) => void;
}) => (
    <Modal visible={visible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
            <Pressable style={styles.modalBackdrop} onPress={onClose} />
            <View style={[styles.modalContent, { paddingBottom: 40 }]}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>{title}</Text>
                    <Pressable onPress={onClose}>
                        <Ionicons name="close-circle" size={24} color="#94a3b8" />
                    </Pressable>
                </View>
                {options.map((opt) => (
                    <Pressable
                        key={opt.value}
                        style={styles.modalOption}
                        onPress={() => { onSelect(opt.value); onClose(); }}
                    >
                        <Text style={styles.modalOptionText}>{opt.label}</Text>
                        <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
                    </Pressable>
                ))}
            </View>
        </View>
    </Modal>
);

export default function OnboardingScreen() {
    const { t, language, setLanguage } = useLanguage();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { profile, updateProfile, goals, updateGoals } = useMeals();

    const [formProfile, setFormProfile] = useState({
        age: String(profile.age || ""),
        heightCm: String(profile.heightCm || ""),
        weightKg: String(profile.weightKg || ""),
        gender: profile.gender,
        activity: profile.activity,
        goal: profile.goal
    });

    const [showActivityModal, setShowActivityModal] = useState(false);
    const [showGenderModal, setShowGenderModal] = useState(false);
    const [showGoalModal, setShowGoalModal] = useState(false);

    // Auto-calculate logic (borrowed from Profile.tsx)
    const calculateGoals = () => {
        const age = Number(formProfile.age) || 30;
        const weight = Number(formProfile.weightKg) || 75;
        const height = Number(formProfile.heightCm) || 175;

        let bmr = 0;
        if (formProfile.gender === "male") {
            bmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
        } else {
            bmr = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
        }

        const multipliers: Record<string, number> = {
            sedentary: 1.2,
            light: 1.375,
            active: 1.55,
        };
        let tdee = bmr * (multipliers[formProfile.activity] || 1.2);

        if (formProfile.goal === "lose") tdee -= 500;
        if (formProfile.goal === "gain") tdee += 500;

        const newCalories = Math.round(tdee) > 0 ? Math.round(tdee) : 2000;
        const pG = Math.round((newCalories * 0.3) / 4);
        const cG = Math.round((newCalories * 0.35) / 4);
        const fG = Math.round((newCalories * 0.35) / 9);

        return {
            calories: newCalories,
            protein: pG,
            carbs: cG,
            fat: fG,
            water: 2500,
            strategy: "auto" as const
        };
    };

    const handleStart = () => {
        const newGoals = calculateGoals();

        // Save Profile
        updateProfile({
            ...profile,
            age: Number(formProfile.age) || 30,
            heightCm: Number(formProfile.heightCm) || 175,
            weightKg: Number(formProfile.weightKg) || 75,
            gender: formProfile.gender as any,
            activity: formProfile.activity as any,
            goal: formProfile.goal as any,
            isOnboardingCompleted: true
        });

        // Save Goals
        updateGoals(newGoals);

        // Redirect
        router.replace("/(tabs)/progress");
    };

    return (
        <View style={[styles.container]}>
            <LinearGradient
                colors={["#ffffff", "#f8fafc", "#f1f5f9"]}
                style={StyleSheet.absoluteFill}
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.content}>
                    <View style={styles.header}>
                        <View style={{ flexDirection: "row", justifyContent: "flex-end", width: "100%", marginBottom: 20 }}>
                            <View style={{ flexDirection: "row", gap: 8, backgroundColor: "white", padding: 4, borderRadius: 12 }}>
                                <Pressable
                                    onPress={() => setLanguage('tr')}
                                    style={[
                                        styles.langButton,
                                        language === 'tr' && styles.langButtonActive
                                    ]}
                                >
                                    <Text style={[styles.langText, language === 'tr' && styles.langTextActive]}>TR</Text>
                                </Pressable>
                                <Pressable
                                    onPress={() => setLanguage('en')}
                                    style={[
                                        styles.langButton,
                                        language === 'en' && styles.langButtonActive
                                    ]}
                                >
                                    <Text style={[styles.langText, language === 'en' && styles.langTextActive]}>EN</Text>
                                </Pressable>
                            </View>
                        </View>

                        <Text style={styles.title}>{t("onboarding.title")}</Text>
                        <Text style={styles.subtitle}>{t("onboarding.subtitle")}</Text>
                    </View>

                    <View style={styles.formCard}>
                        <InputField
                            label={t('profile.age')}
                            value={formProfile.age}
                            onChange={t => setFormProfile({ ...formProfile, age: t })}
                            placeholder="30"
                            numeric
                        />
                        <InputField
                            label={t('profile.height')}
                            value={formProfile.heightCm}
                            onChange={t => setFormProfile({ ...formProfile, heightCm: t })}
                            placeholder="175"
                            numeric
                        />
                        <InputField
                            label={t('profile.weight')}
                            value={formProfile.weightKg}
                            onChange={t => setFormProfile({ ...formProfile, weightKg: t })}
                            placeholder="75"
                            numeric
                        />

                        <Pressable style={styles.selectorButton} onPress={() => setShowGenderModal(true)}>
                            <Text style={styles.selectorLabel}>{t('profile.gender')}</Text>
                            <Text style={styles.selectorValue}>
                                {formProfile.gender === "male" ? t("profile.male") : t("profile.female")}
                            </Text>
                            <Ionicons name="chevron-down" size={20} color="#94a3b8" />
                        </Pressable>

                        <Pressable style={styles.selectorButton} onPress={() => setShowActivityModal(true)}>
                            <Text style={styles.selectorLabel}>{t('profile.activity')}</Text>
                            <Text style={styles.selectorValue}>
                                {formProfile.activity === "sedentary"
                                    ? t("profile.sedentary")
                                    : formProfile.activity === "light"
                                        ? t("profile.light")
                                        : t("profile.active")}
                            </Text>
                            <Ionicons name="chevron-down" size={20} color="#94a3b8" />
                        </Pressable>

                        <Pressable style={styles.selectorButton} onPress={() => setShowGoalModal(true)}>
                            <Text style={styles.selectorLabel}>{t('profile.goal')}</Text>
                            <Text style={styles.selectorValue}>
                                {formProfile.goal === "lose"
                                    ? t("profile.lose")
                                    : formProfile.goal === "maintain"
                                        ? t("profile.maintain")
                                        : t("profile.gain")}
                            </Text>
                            <Ionicons name="chevron-down" size={20} color="#94a3b8" />
                        </Pressable>
                    </View>

                    <Pressable style={styles.startButton} onPress={handleStart}>
                        <Text style={styles.startButtonText}>{t("onboarding.start")}</Text>
                        <Ionicons name="arrow-forward" size={20} color="white" />
                    </Pressable>
                </ScrollView>
            </KeyboardAvoidingView>

            <SelectionModal
                visible={showActivityModal}
                onClose={() => setShowActivityModal(false)}
                title={t("profile.select_activity")}
                options={[
                    { label: t('profile.sedentary'), value: "sedentary" },
                    { label: t('profile.light'), value: "light" },
                    { label: t('profile.active'), value: "active" },
                ]}
                onSelect={(val) => setFormProfile({ ...formProfile, activity: val })}
            />
            <SelectionModal
                visible={showGenderModal}
                onClose={() => setShowGenderModal(false)}
                title={t("profile.select_gender")}
                options={[
                    { label: t("profile.male"), value: "male" },
                    { label: t("profile.female"), value: "female" },
                ]}
                onSelect={(val) => setFormProfile({ ...formProfile, gender: val })}
            />
            <SelectionModal
                visible={showGoalModal}
                onClose={() => setShowGoalModal(false)}
                title={t('profile.goal')}
                options={[
                    { label: t('profile.lose'), value: "lose" },
                    { label: t('profile.maintain'), value: "maintain" },
                    { label: t('profile.gain'), value: "gain" },
                ]}
                onSelect={(val) => setFormProfile({ ...formProfile, goal: val })}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: 24,
    },
    header: {
        marginVertical: 40,
        alignItems: "center",
    },
    title: {
        fontSize: 28,
        fontWeight: "800",
        color: "#1e293b",
        marginBottom: 12,
        textAlign: "center",
    },
    subtitle: {
        fontSize: 16,
        color: "#64748b",
        textAlign: "center",
        lineHeight: 24,
    },
    formCard: {
        backgroundColor: "white",
        borderRadius: 24,
        padding: 20,
        gap: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 2,
        marginBottom: 32,
    },
    inputContainer: {
        gap: 8,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: "600",
        color: "#64748b",
        marginLeft: 4,
    },
    input: {
        backgroundColor: "#f8fafc",
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#e2e8f0",
        fontSize: 16,
        color: "#1e293b",
    },
    selectorButton: {
        backgroundColor: "#f8fafc",
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#e2e8f0",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    selectorLabel: {
        fontSize: 12,
        fontWeight: "600",
        color: "#64748b",
        position: "absolute",
        top: 8,
        left: 16,
    },
    selectorValue: {
        fontSize: 16,
        color: "#1e293b",
        marginTop: 14,
    },
    startButton: {
        backgroundColor: "#22c55e",
        padding: 20,
        borderRadius: 20,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        gap: 12,
        shadowColor: "#22c55e",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 8,
    },
    startButtonText: {
        color: "white",
        fontSize: 18,
        fontWeight: "700",
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        justifyContent: "flex-end",
    },
    modalBackdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(0,0,0,0.4)",
    },
    modalContent: {
        backgroundColor: "white",
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: "#1e293b",
    },
    modalOption: {
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#f1f5f9",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    modalOptionText: {
        fontSize: 16,
        color: "#334155",
        fontWeight: "500",
    },

    langButton: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 8,
    },
    langButtonActive: {
        backgroundColor: "#e0f2fe",
    },
    langText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#64748b",
    },
    langTextActive: {
        color: "#0284c7",
    },
});
