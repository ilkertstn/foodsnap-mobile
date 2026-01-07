import { auth } from "@/firebaseConfig";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import CustomAlertModal, { AlertType } from "../../components/CustomAlertModal";
import SuccessModal from "../../components/SuccessModal";
import { ALL_BADGES } from "../../constants/badges";
import { useAuth } from "../../context/AuthContext";
import { useHealth } from "../../context/HealthContext";
import { useLanguage } from "../../context/LanguageContext";
import { useMeals } from "../../context/MealContext";

const SectionHeader = ({ title, icon }: { title: string; icon: keyof typeof Ionicons.glyphMap }) => (

    <View style={styles.sectionHeader}>
        <Ionicons name={icon} size={20} color="#3b82f6" />
        <Text style={styles.sectionTitle}>{title}</Text>
    </View>
);

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

export default function Profile() {
    const { t } = useLanguage();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { profile, updateProfile, goals, updateGoals, toggleReminder } = useMeals();
    const { signOut, user } = useAuth();
    const { isEnabled: isHealthEnabled, isAvailable: isHealthAvailable, enableHealthIntegration, disableHealthIntegration } = useHealth();
    const { language, setLanguage } = useLanguage();

    const [localProfile, setLocalProfile] = useState(profile);
    const [localGoals, setLocalGoals] = useState(goals);

    const [formProfile, setFormProfile] = useState({
        age: String(profile.age),
        heightCm: String(profile.heightCm),
        weightKg: String(profile.weightKg),
        calories: String(goals.calories),
        protein: String(goals.protein),
        carbs: String(goals.carbs),
        fat: String(goals.fat),
        water: goals.water ? String(goals.water) : "",
    });

    const [isEditing, setIsEditing] = useState(false);

    const [showActivityModal, setShowActivityModal] = useState(false);
    const [showGenderModal, setShowGenderModal] = useState(false);
    const [showGoalModal, setShowGoalModal] = useState(false);


    const [showSuccessModal, setShowSuccessModal] = useState(false);


    const [alertVisible, setAlertVisible] = useState(false);
    const [alertConfig, setAlertConfig] = useState<{
        type: AlertType;
        title: string;
        message: string;
        primaryText?: string;
        secondaryText?: string;
        onPrimary: () => void;
        onSecondary?: () => void;
    }>({
        type: "info",
        title: "",
        message: "",
        onPrimary: () => { },
    });

    const showCustomAlert = (
        type: AlertType,
        title: string,
        message: string,
        primaryText: string,
        onPrimary: () => void,
        secondaryText?: string,
        onSecondary?: () => void
    ) => {
        setAlertConfig({
            type,
            title,
            message,
            primaryText,
            onPrimary,
            secondaryText,
            onSecondary
        });
        setAlertVisible(true);
    };

    const handleSignOut = async () => {

        const isAnon = user?.isAnonymous ?? true;
        if (isAnon) {
            showCustomAlert(
                "warning",
                "Warning",
                "You are currently a Guest. If you sign out now, you will lose your data permanently unless you link your account first.",
                "Sign Out Anyway",
                async () => {
                    setAlertVisible(false);
                    await signOut();

                    router.replace("/");
                },
                "Cancel",
                () => setAlertVisible(false)
            );
        } else {
            showCustomAlert(
                "warning",
                "Sign Out",
                "Are you sure you want to sign out?",
                "Sign Out",
                async () => {
                    setAlertVisible(false);
                    await signOut();
                    router.replace("/auth/login");
                },
                "Cancel",
                () => setAlertVisible(false)
            );
        }
    };



    React.useEffect(() => {
        if (!isEditing) {
            setLocalProfile(profile);
            setLocalGoals(goals);
            setFormProfile({
                age: String(profile.age),
                heightCm: String(profile.heightCm),
                weightKg: String(profile.weightKg),
                calories: String(goals.calories),
                protein: String(goals.protein),
                carbs: String(goals.carbs),
                fat: String(goals.fat),
                water: goals.water ? String(goals.water) : "",
            });
        }
    }, [profile, goals, isEditing]);


    React.useEffect(() => {
        if (isEditing) {
            setLocalProfile(profile);
            setLocalGoals(goals);
            setFormProfile({
                age: String(profile.age),
                heightCm: String(profile.heightCm),
                weightKg: String(profile.weightKg),
                calories: String(goals.calories),
                protein: String(goals.protein),
                carbs: String(goals.carbs),
                fat: String(goals.fat),
                water: goals.water ? String(goals.water) : "",
            });
        }
    }, [isEditing]);

    React.useEffect(() => {
        if (goals.strategy === "auto" && isEditing) {

            const age = Number(formProfile.age) || 0;
            const weight = Number(formProfile.weightKg) || 0;
            const height = Number(formProfile.heightCm) || 0;

            let bmr = 0;
            if (localProfile.gender === "male") {
                bmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
            } else {
                bmr = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
            }

            const multipliers: Record<string, number> = {
                sedentary: 1.2,
                light: 1.375,
                active: 1.55,
            };
            let tdee = bmr * (multipliers[localProfile.activity] || 1.2);

            if (localProfile.goal === "lose") tdee -= 500;
            if (localProfile.goal === "gain") tdee += 500;

            const newCalories = Math.round(tdee) > 0 ? Math.round(tdee) : 0;

            const pG = Math.round((newCalories * 0.3) / 4);
            const cG = Math.round((newCalories * 0.35) / 4);
            const fG = Math.round((newCalories * 0.35) / 9);


            setFormProfile(prev => ({
                ...prev,
                calories: String(newCalories),
                protein: String(pG),
                carbs: String(cG),
                fat: String(fG),
            }));


            setLocalGoals(prev => ({
                ...prev,
                calories: newCalories,
                protein: pG,
                carbs: cG,
                fat: fG,

            }));
        }
    }, [
        isEditing, goals.strategy,
        formProfile.age, formProfile.weightKg, formProfile.heightCm,
        localProfile.gender, localProfile.activity, localProfile.goal
    ]);

    const handleSave = async () => {

        if (localProfile.reminders?.water !== profile.reminders?.water) {
            await toggleReminder('water', localProfile.reminders?.water ?? false);
        }
        if (localProfile.reminders?.meals !== profile.reminders?.meals) {
            await toggleReminder('meals', localProfile.reminders?.meals ?? false);
        }


        const finalProfile = {
            ...localProfile,
            age: Number(formProfile.age) || 0,
            heightCm: Number(formProfile.heightCm) || 0,
            weightKg: Number(formProfile.weightKg) || 0,
        };

        const finalGoals = {
            ...localGoals,
            calories: Number(formProfile.calories) || 0,
            protein: Number(formProfile.protein) || 0,
            carbs: Number(formProfile.carbs) || 0,
            fat: Number(formProfile.fat) || 0,
            water: Number(formProfile.water) || 2500, // Default if empty
            strategy: goals.strategy
        };

        updateProfile(finalProfile);

        if (goals.strategy === "manual") {
            updateGoals(finalGoals);
        } else {
            // If switching back to auto, ensure strategy is set
            updateGoals({ ...finalGoals, strategy: "auto" });
        }
        setIsEditing(false);
        setShowSuccessModal(true);
    };

    const toggleStrategy = () => {

        const newStrategy = goals.strategy === "auto" ? "manual" : "auto";
        updateGoals({ strategy: newStrategy });


        setLocalGoals(prev => ({ ...prev, strategy: newStrategy }));
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <LinearGradient
                colors={["#f8fafc", "#eff6ff", "#e0f2fe"]}
                style={StyleSheet.absoluteFill}
            />

            <SelectionModal
                visible={showActivityModal}
                onClose={() => setShowActivityModal(false)}
                title={t("profile.select_activity")}
                options={[
                    { label: t('profile.sedentary'), value: "sedentary" },
                    { label: t('profile.light'), value: "light" },
                    { label: t('profile.active'), value: "active" },
                ]}
                onSelect={(val) => setLocalProfile({ ...localProfile, activity: val })}
            />
            <SelectionModal
                visible={showGenderModal}
                onClose={() => setShowGenderModal(false)}
                title={t("profile.select_gender")}
                options={[
                    { label: t("profile.male"), value: "male" },
                    { label: t("profile.female"), value: "female" },
                ]}
                onSelect={(val) => setLocalProfile({ ...localProfile, gender: val })}
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
                onSelect={(val) => setLocalProfile({ ...localProfile, goal: val })}
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.content}>
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>{t('profile.profileHeader')}</Text>
                        <Pressable onPress={() => isEditing ? handleSave() : setIsEditing(true)} style={styles.editButton}>
                            <Text style={styles.editButtonText}>{isEditing ? t('profile.save') : t('profile.edit')}</Text>
                        </Pressable>
                    </View>

                    {auth.currentUser?.isAnonymous && (
                        <View style={[styles.card, { backgroundColor: '#eff6ff', borderColor: '#3b82f6', borderWidth: 1 }]}>
                            <View style={styles.sectionHeader}>
                                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                                    <Ionicons name="cloud-upload" size={24} color="#3b82f6" />
                                    <Text style={styles.sectionTitle}>{t('profile.backupData')}</Text>
                                </View>
                            </View>
                            <Text style={{ color: '#64748b', marginBottom: 16 }}>
                                {t('profile.backupDataText')}
                            </Text>
                            <Pressable
                                style={{ backgroundColor: '#3b82f6', padding: 12, borderRadius: 12, alignItems: 'center', marginBottom: 8 }}
                                onPress={() => router.push("/auth/link-account")}
                            >
                                <Text style={{ color: 'white', fontWeight: 'bold' }}>{t('profile.createAccountSync')}</Text>
                            </Pressable>
                            <Pressable
                                style={{ padding: 12, borderRadius: 12, alignItems: 'center' }}
                                onPress={() => router.push("/auth/login")}
                            >
                                <Text style={{ color: '#3b82f6', fontWeight: 'bold' }}>{t('profile.existingUserLogin')}</Text>
                            </Pressable>
                        </View>
                    )}

                    <View style={styles.card}>
                        <SectionHeader title={t('profile.personalDetails')} icon="person" />

                        {isEditing ? (
                            <View style={styles.formGrid}>
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
                                        {localProfile.gender === "male" ? t("profile.male") : t("profile.female")}
                                    </Text>
                                </Pressable>

                                <Pressable style={styles.selectorButton} onPress={() => setShowActivityModal(true)}>
                                    <Text style={styles.selectorLabel}>{t('profile.activity')}</Text>
                                    <Text style={styles.selectorValue}>
                                        {localProfile.activity === "sedentary"
                                            ? t("profile.sedentary")
                                            : localProfile.activity === "light"
                                                ? t("profile.light")
                                                : t("profile.active")}
                                    </Text>
                                </Pressable>


                                <Pressable style={styles.selectorButton} onPress={() => setShowGoalModal(true)}>
                                    <Text style={styles.selectorLabel}>{t('profile.goal')}</Text>
                                    <Text style={styles.selectorValue}>
                                        {localProfile.goal === "lose"
                                            ? t("profile.lose")
                                            : localProfile.goal === "maintain"
                                                ? t("profile.maintain")
                                                : t("profile.gain")}
                                    </Text>

                                </Pressable>
                            </View>
                        ) : (
                            <View style={styles.readOnlyGrid}>
                                <View style={styles.readOnlyItem}>
                                    <Text style={styles.readOnlyLabel}>{t('profile.age')}</Text>
                                    <Text style={styles.readOnlyValue}>{profile.age}</Text>
                                </View>
                                <View style={styles.readOnlyItem}>
                                    <Text style={styles.readOnlyLabel}>{t('profile.gender')}</Text>
                                    <Text style={styles.readOnlyValue}>{localProfile.gender === "male" ? t("profile.male") : t("profile.female")}</Text>
                                </View>
                                <View style={styles.readOnlyItem}>
                                    <Text style={styles.readOnlyLabel}>{t('profile.height')}</Text>
                                    <Text style={styles.readOnlyValue}>{profile.heightCm} cm</Text>
                                </View>
                                <View style={styles.readOnlyItem}>
                                    <Text style={styles.readOnlyLabel}>{t('profile.weight')}</Text>
                                    <Text style={styles.readOnlyValue}>{profile.weightKg} kg</Text>
                                </View>
                                <View style={styles.readOnlyItem}>
                                    <Text style={styles.readOnlyLabel}>{t('profile.activity')}</Text>
                                    <Text style={styles.readOnlyValue}>{localProfile.activity === "sedentary" ? t("profile.sedentary") : localProfile.activity === "light" ? t("profile.light") : t("profile.active")}</Text>
                                </View>
                                <View style={styles.readOnlyItem}>
                                    <Text style={styles.readOnlyLabel}>{t('profile.goal')}</Text>
                                    <Text style={styles.readOnlyValue}>{localProfile.goal === "lose" ? t("profile.lose") : localProfile.goal === "maintain" ? t("profile.maintain") : t("profile.gain")}</Text>
                                </View>
                            </View>
                        )}
                    </View>

                    {/* Nutrition Preferences Section */}
                    <View style={styles.card}>
                        <SectionHeader title={t('profile.nutritionPreferences') || "Nutrition Preferences"} icon="restaurant" />

                        {isEditing ? (
                            <View style={{ marginTop: 12 }}>
                                {/* Diet Type */}
                                <Text style={styles.inputLabel}>{t("profile.dietType")}</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                                    {["standard", "vegetarian", "vegan", "keto", "paleo", "pescetarian"].map((d) => (
                                        <Pressable
                                            key={d}
                                            style={[styles.chip, localProfile.dietType === d && styles.chipSelected]}
                                            onPress={() => setLocalProfile({ ...localProfile, dietType: d })}
                                        >
                                            <Text style={[styles.chipText, localProfile.dietType === d && styles.chipTextSelected]}>
                                                {t(`profile.diet_${d}`)}
                                            </Text>
                                        </Pressable>
                                    ))}
                                </ScrollView>

                                {/* Allergies */}
                                <Text style={styles.inputLabel}>{t("profile.allergies")}</Text>
                                <View style={styles.wrapContainer}>
                                    {["gluten", "dairy", "nut", "shellfish", "none"].map((a) => {
                                        const currentAllergies = localProfile.allergies || [];
                                        const isSelected = currentAllergies.includes(a);
                                        return (
                                            <Pressable
                                                key={a}
                                                style={[styles.smallChip, isSelected && styles.smallChipSelected]}
                                                onPress={() => {
                                                    let newAllergies = [];
                                                    if (a === "none") {
                                                        newAllergies = ["none"];
                                                    } else {
                                                        newAllergies = isSelected
                                                            ? currentAllergies.filter(x => x !== a)
                                                            : [...currentAllergies.filter(x => x !== "none"), a];
                                                    }
                                                    setLocalProfile({ ...localProfile, allergies: newAllergies });
                                                }}
                                            >
                                                <Text style={[styles.smallChipText, isSelected && styles.smallChipTextSelected]}>
                                                    {t(`profile.allergy_${a}`)}
                                                </Text>
                                            </Pressable>
                                        );
                                    })}
                                </View>

                                {/* Meals Per Day */}
                                <Text style={[styles.inputLabel, { marginTop: 16 }]}>{t("profile.mealsPerDay")}</Text>
                                <View style={{ flexDirection: "row", gap: 12, marginTop: 8 }}>
                                    {[3, 4, 5, 6].map(num => (
                                        <Pressable
                                            key={num}
                                            style={[styles.circleButton, localProfile.mealsPerDay === num && styles.circleButtonSelected]}
                                            onPress={() => setLocalProfile({ ...localProfile, mealsPerDay: num })}
                                        >
                                            <Text style={[styles.circleText, localProfile.mealsPerDay === num && styles.circleTextSelected]}>{num}</Text>
                                        </Pressable>
                                    ))}
                                </View>
                            </View>
                        ) : (
                            <View style={styles.readOnlyGrid}>
                                <View style={styles.readOnlyItem}>
                                    <Text style={styles.readOnlyLabel}>{t('profile.dietType')}</Text>
                                    <Text style={styles.readOnlyValue}>
                                        {t(`profile.diet_${profile.dietType || "standard"}`)}
                                    </Text>
                                </View>
                                <View style={styles.readOnlyItem}>
                                    <Text style={styles.readOnlyLabel}>{t('profile.mealsPerDay')}</Text>
                                    <Text style={styles.readOnlyValue}>{profile.mealsPerDay || 4}</Text>
                                </View>
                                <View style={[styles.readOnlyItem, { width: '100%' }]}>
                                    <Text style={styles.readOnlyLabel}>{t('profile.allergies')}</Text>
                                    <Text style={styles.readOnlyValue}>
                                        {(profile.allergies && profile.allergies.length > 0 && !profile.allergies.includes("none"))
                                            ? profile.allergies.map(a => t(`profile.allergy_${a}`)).join(", ")
                                            : t('profile.allergy_none')}
                                    </Text>
                                </View>
                            </View>
                        )}
                    </View>

                    {isEditing && (
                        <>
                            <View style={styles.sectionHeader}>
                                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                                    <Ionicons name="notifications" size={20} color="#3b82f6" />
                                    <Text style={styles.sectionTitle}>{t('profile.reminders')}</Text>
                                </View>
                            </View>

                            <View style={styles.card}>
                                <View style={styles.goalRow}>
                                    <View>
                                        <Text style={styles.goalLabel}>{t('profile.waterReminders')}</Text>
                                        <Text style={styles.macroLabel}>{t('profile.every')} {localProfile.reminders?.waterInterval || 2} {t('profile.hours')}</Text>
                                    </View>
                                    <Switch
                                        value={localProfile.reminders?.water ?? false}
                                        onValueChange={(val) => {
                                            setLocalProfile(prev => ({
                                                ...prev,
                                                reminders: {
                                                    waterInterval: 2,
                                                    waterStart: "09:00",
                                                    waterEnd: "21:00",
                                                    breakfastTime: "09:00",
                                                    lunchTime: "13:00",
                                                    dinnerTime: "19:00",
                                                    meals: false,
                                                    ...prev.reminders,
                                                    water: val
                                                }
                                            }));
                                        }}
                                        trackColor={{ true: "#3b82f6" }}
                                    />
                                </View>

                                {localProfile.reminders?.water && (
                                    <View style={{ marginTop: 12, gap: 12 }}>
                                        <View style={styles.timeRow}>
                                            <Text style={styles.timeLabel}>{t('profile.startTime')}</Text>
                                            <DateTimePicker
                                                value={(() => {
                                                    const [h, m] = (localProfile.reminders?.waterStart || "09:00").split(':').map(Number);
                                                    const d = new Date(); d.setHours(h, m); return d;
                                                })()}
                                                mode="time"
                                                is24Hour={true}
                                                display="default"
                                                onChange={(e, d) => {
                                                    if (d) {
                                                        const time = d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0');
                                                        setLocalProfile(p => ({ ...p, reminders: { ...p.reminders!, waterStart: time } }));
                                                    }
                                                }}
                                                style={{ width: 100 }}
                                            />
                                        </View>
                                        <View style={styles.timeRow}>
                                            <Text style={styles.timeLabel}>{t('profile.endTime')}</Text>
                                            <DateTimePicker
                                                value={(() => {
                                                    const [h, m] = (localProfile.reminders?.waterEnd || "21:00").split(':').map(Number);
                                                    const d = new Date(); d.setHours(h, m); return d;
                                                })()}
                                                mode="time"
                                                is24Hour={true}
                                                display="default"
                                                onChange={(e, d) => {
                                                    if (d) {
                                                        const time = d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0');
                                                        setLocalProfile(p => ({ ...p, reminders: { ...p.reminders!, waterEnd: time } }));
                                                    }
                                                }}
                                                style={{ width: 100 }}
                                            />
                                        </View>
                                    </View>
                                )}

                                <View style={styles.divider} />

                                <View style={styles.goalRow}>
                                    <Text style={styles.goalLabel}>{t('profile.mealReminders')}</Text>
                                    <Switch
                                        value={localProfile.reminders?.meals ?? false}
                                        onValueChange={(val) => {
                                            setLocalProfile(prev => ({
                                                ...prev,
                                                reminders: {
                                                    waterInterval: 2,
                                                    waterStart: "09:00",
                                                    waterEnd: "21:00",
                                                    breakfastTime: "09:00",
                                                    lunchTime: "13:00",
                                                    dinnerTime: "19:00",
                                                    water: false,
                                                    ...prev.reminders,
                                                    meals: val
                                                }
                                            }));
                                        }}
                                        trackColor={{ true: "#10b981" }}
                                    />
                                </View>

                                {localProfile.reminders?.meals && (
                                    <View style={{ marginTop: 12, gap: 12 }}>
                                        {[
                                            { label: t('profile.breakfastTime'), key: "breakfastTime" },
                                            { label: t('profile.lunchTime'), key: "lunchTime" },
                                            { label: t('profile.dinnerTime'), key: "dinnerTime" }
                                        ].map((meal) => (
                                            <View key={meal.key} style={styles.timeRow}>
                                                <Text style={styles.timeLabel}>{meal.label}</Text>
                                                <DateTimePicker
                                                    value={(() => {
                                                        const [h, m] = ((localProfile.reminders as any)?.[meal.key] || "09:00").split(':').map(Number);
                                                        const d = new Date(); d.setHours(h, m); return d;
                                                    })()}
                                                    mode="time"
                                                    is24Hour={true}
                                                    display="default"
                                                    onChange={(e, d) => {
                                                        if (d) {
                                                            const time = d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0');
                                                            setLocalProfile(p => ({ ...p, reminders: { ...p.reminders!, [meal.key]: time } }));
                                                        }
                                                    }}
                                                    style={{ width: 100 }}
                                                />
                                            </View>
                                        ))}
                                    </View>
                                )}
                            </View>
                        </>
                    )}

                    <View style={styles.card}>
                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16, gap: 12, flexWrap: "wrap" }}>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                                <Ionicons name="trophy" size={20} color="#3b82f6" />
                                <Text style={styles.sectionTitle}>{t('profile.nutritionGoals')}</Text>
                            </View>
                            {isEditing ? (
                                <Pressable onPress={toggleStrategy} style={styles.strategyButton}>
                                    <Text style={styles.strategyText} numberOfLines={1}>
                                        {localGoals.strategy === "auto" ? t("profile.autoCalculated") : t("profile.manual")}
                                    </Text>
                                    <Ionicons name="swap-horizontal" size={16} color="#3b82f6" />
                                </Pressable>
                            ) : (
                                <View style={styles.strategyBadge}>
                                    <Text style={styles.strategyBadgeText}>
                                        {goals.strategy === "auto" ? t("profile.autoCalculated") : t("profile.manual")}
                                    </Text>
                                </View>
                            )}
                        </View>

                        {goals.strategy === "auto" && (
                            <View style={styles.infoBox}>
                                <Ionicons name="information-circle" size={20} color="#3b82f6" />
                                <Text style={styles.infoText}>
                                    {t("profile.autoCalculatedInfo")}
                                </Text>
                            </View>
                        )}

                        {isEditing && goals.strategy === "manual" ? (
                            <View style={styles.formGrid}>
                                <InputField
                                    label={t("profile.dailyCalories")}
                                    value={formProfile.calories}
                                    onChange={t => setFormProfile({ ...formProfile, calories: t })}
                                    placeholder="2000"
                                    numeric
                                />
                                <InputField
                                    label={t("profile.protein")}
                                    value={formProfile.protein}
                                    onChange={t => setFormProfile({ ...formProfile, protein: t })}
                                    placeholder="150"
                                    numeric
                                />
                                <InputField
                                    label={t("profile.carbs")}
                                    value={formProfile.carbs}
                                    onChange={t => setFormProfile({ ...formProfile, carbs: t })}
                                    placeholder="200"
                                    numeric
                                />
                                <InputField
                                    label={t("profile.fat")}
                                    value={formProfile.fat}
                                    onChange={t => setFormProfile({ ...formProfile, fat: t })}
                                    placeholder="65"
                                    numeric
                                />
                            </View>
                        ) : (
                            <View>
                                <View style={styles.goalRow}>
                                    <Text style={styles.goalLabel}>{t("profile.calories")}</Text>
                                    <Text style={styles.goalValue}>{goals.calories} kcal</Text>
                                </View>
                                <View style={styles.divider} />
                                <View style={styles.macroRow}>
                                    <View style={styles.macroItem}>
                                        <Text style={styles.macroValue}>{goals.protein}g</Text>
                                        <Text style={styles.macroLabel}>{t("profile.protein")}</Text>
                                    </View>
                                    <View style={styles.macroItem}>
                                        <Text style={styles.macroValue}>{goals.carbs}g</Text>
                                        <Text style={styles.macroLabel}>{t("profile.carbs")}</Text>
                                    </View>
                                    <View style={styles.macroItem}>
                                        <Text style={styles.macroValue}>{goals.fat}g</Text>
                                        <Text style={styles.macroLabel}>{t("profile.fat")}</Text>
                                    </View>
                                </View>
                                <View style={styles.divider} />
                                <View style={styles.goalRow}>
                                    <Text style={styles.goalLabel}>{t("profile.waterGoal")}</Text>
                                    <Text style={[styles.goalValue, { color: "#0ea5e9" }]}>{goals.water || 2500} ml</Text>
                                </View>
                            </View>
                        )}

                        {isEditing && (
                            <View style={[styles.formGrid, { marginTop: 16 }]}>
                                <View style={styles.divider} />
                                <Text style={[styles.sectionTitle, { fontSize: 16 }]}>{t("profile.hydrationGoal")}</Text>
                                <InputField
                                    label={t("profile.dailyWater")}
                                    value={formProfile.water}
                                    onChange={t => setFormProfile({ ...formProfile, water: t })}
                                    placeholder="2500"
                                    numeric
                                />
                            </View>
                        )}
                    </View>

                    <View style={styles.card}>
                        <View style={styles.sectionHeader}>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                                <Ionicons name="trophy" size={20} color="#f59e0b" />
                                <Text style={styles.sectionTitle}>{t("profile.achievements")}</Text>
                            </View>

                        </View>

                        <View style={styles.badgesGrid}>
                            {ALL_BADGES.map((badge) => {
                                const isUnlocked = profile.unlockedBadges?.some((b) => b.badgeId === badge.id);

                                return (
                                    <View
                                        key={badge.id}
                                        style={[styles.badgeItem, !isUnlocked && styles.badgeLocked]}
                                    >
                                        <View style={[styles.badgeIcon, !isUnlocked && styles.badgeIconLocked]}>
                                            <Ionicons
                                                name={badge.icon as any}
                                                size={28}
                                                color={isUnlocked ? "#f59e0b" : "#94a3b8"}
                                            />
                                        </View>

                                        <Text style={styles.badgeText}>{t(badge.titleKey)}</Text>
                                    </View>
                                );
                            })}
                        </View>

                    </View>

                    {/* Language Settings */}
                    <View style={styles.card}>
                        <View style={styles.sectionHeader}>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                                <Ionicons name="language" size={20} color="#8b5cf6" />
                                <Text style={styles.sectionTitle}>Dil / Language</Text>
                            </View>
                        </View>
                        <View style={{ flexDirection: "row", gap: 12, marginTop: 12 }}>
                            <Pressable
                                onPress={() => setLanguage('tr')}
                                style={[
                                    styles.languageButton,
                                    language === 'tr' && styles.languageButtonActive
                                ]}
                            >
                                <Text style={[
                                    styles.languageButtonText,
                                    language === 'tr' && styles.languageButtonTextActive
                                ]}>🇹🇷 Türkçe</Text>
                            </Pressable>
                            <Pressable
                                onPress={() => setLanguage('en')}
                                style={[
                                    styles.languageButton,
                                    language === 'en' && styles.languageButtonActive
                                ]}
                            >
                                <Text style={[
                                    styles.languageButtonText,
                                    language === 'en' && styles.languageButtonTextActive
                                ]}>🇬🇧 English</Text>
                            </Pressable>
                        </View>
                    </View>

                    {/* Health Integration */}
                    {isHealthAvailable && (
                        <View style={styles.card}>
                            <View style={styles.sectionHeader}>
                                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                                    <Ionicons name="fitness" size={20} color="#8b5cf6" />
                                    <Text style={styles.sectionTitle}>Health Integration</Text>
                                </View>
                            </View>
                            <View style={styles.goalRow}>
                                <View>
                                    <Text style={styles.goalLabel}>Apple Health / Google Fit</Text>
                                    <Text style={styles.macroLabel}>Sync steps, distance, and activity</Text>
                                </View>
                                <Switch
                                    value={isHealthEnabled}
                                    onValueChange={async (val) => {
                                        if (val) {
                                            await enableHealthIntegration();
                                        } else {
                                            await disableHealthIntegration();
                                        }
                                    }}
                                    trackColor={{ true: "#8b5cf6" }}
                                />
                            </View>
                        </View>
                    )}

                    {/* Redundant Test FB Write button removed previous step? No I am replacing content at line 653-656 */}
                    <Pressable
                        onPress={handleSignOut}
                        style={[styles.signOutButton, { opacity: 1 }]}
                    >
                        <Ionicons name={user?.isAnonymous ? "refresh-circle-outline" : "log-out-outline"} size={20} color="#ef4444" />
                        <Text style={styles.signOutText}>
                            {user?.isAnonymous ? "Reset Session & Clear Data" : "Sign Out"}
                        </Text>
                    </Pressable>

                </ScrollView>
            </KeyboardAvoidingView>

            <SuccessModal
                visible={showSuccessModal}
                title={t("profile.successTitle")}
                message={t("profile.successMessage")}
                onClose={() => setShowSuccessModal(false)}
            />

            <CustomAlertModal
                visible={alertVisible}
                type={alertConfig.type}
                title={alertConfig.title}
                message={alertConfig.message}
                primaryButtonText={alertConfig.primaryText}
                onPrimaryPress={alertConfig.onPrimary}
                secondaryButtonText={alertConfig.secondaryText}
                onSecondaryPress={alertConfig.onSecondary}
            />
        </View >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: 20,
        paddingBottom: 40,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 24,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: "800",
        color: "#1e293b",
    },
    editButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: "white",
        borderRadius: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    editButtonText: {
        fontWeight: "700",
        color: "#3b82f6",
    },
    card: {
        backgroundColor: "white",
        borderRadius: 24,
        padding: 20,
        shadowColor: "#64748b",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 24,
        elevation: 8,
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#1e293b",
    },
    formGrid: {
        gap: 16,
    },
    inputContainer: {
        gap: 6,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: "600",
        color: "#64748b",
    },
    input: {
        backgroundColor: "#f8fafc",
        borderWidth: 1,
        borderColor: "#e2e8f0",
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
        color: "#1e293b",
    },
    readOnlyGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 16,
    },
    readOnlyItem: {
        width: "45%",
        backgroundColor: "#f8fafc",
        padding: 12,
        borderRadius: 12,
    },
    readOnlyLabel: {
        fontSize: 12,
        fontWeight: "600",
        color: "#64748b",
        marginBottom: 4,
    },
    readOnlyValue: {
        fontSize: 16,
        fontWeight: "700",
        color: "#1e293b",
    },
    strategyButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        padding: 8,
        backgroundColor: "#eff6ff",
        borderRadius: 12,
    },
    strategyText: {
        fontSize: 12,
        fontWeight: "700",
        color: "#3b82f6",
    },
    strategyBadge: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        backgroundColor: "#f1f5f9",
        borderRadius: 8,
    },
    strategyBadgeText: {
        fontSize: 12,
        fontWeight: "600",
        color: "#64748b",
    },
    infoBox: {
        flexDirection: "row",
        gap: 8,
        backgroundColor: "#eff6ff",
        padding: 12,
        borderRadius: 12,
        marginBottom: 16,
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        color: "#3b82f6",
        lineHeight: 18,
    },
    goalRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-end",
    },
    goalLabel: {
        fontSize: 16,
        fontWeight: "600",
        color: "#64748b",
    },
    goalValue: {
        fontSize: 24,
        fontWeight: "800",
        color: "#3b82f6",
    },
    divider: {
        height: 1,
        backgroundColor: "#e2e8f0",
        marginVertical: 16,
    },
    macroRow: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    macroItem: {
        alignItems: "center",
    },
    macroValue: {
        fontSize: 20,
        fontWeight: "700",
        color: "#1e293b",
    },
    macroLabel: {
        fontSize: 12,
        color: "#64748b",
        marginTop: 4,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: "flex-end",
    },
    modalBackdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(0,0,0,0.5)",
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
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#1e293b",
    },
    modalOption: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#f1f5f9",
    },
    modalOptionText: {
        fontSize: 16,
        color: "#334155",
        fontWeight: "500",
    },
    selectorButton: {
        backgroundColor: "#f8fafc",
        borderWidth: 1,
        borderColor: "#e2e8f0",
        borderRadius: 12,
        padding: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    selectorLabel: {
        fontSize: 14,
        fontWeight: "600",
        color: "#64748b",
    },
    selectorValue: {
        fontSize: 16,
        color: "#1e293b",
        fontWeight: '500',
    },
    timeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 4,
    },
    timeLabel: {
        fontSize: 14,
        color: "#64748b",
        fontWeight: "500",
    },
    badgesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
        justifyContent: 'space-between',
    },
    badgeItem: {
        width: '30%',
        alignItems: 'center',
        gap: 8,
    },
    badgeLocked: {
        opacity: 0.5,
    },
    badgeIcon: {
        width: 60,
        height: 60,
        backgroundColor: '#fef3c7',
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
    },
    badgeIconLocked: {
        backgroundColor: '#e2e8f0',
    },
    badgeText: {
        fontSize: 12,
        textAlign: 'center',
        color: '#64748b',
        fontWeight: '500',
    },
    signOutButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        padding: 16,
        backgroundColor: "#fee2e2",
        borderRadius: 16,
        marginBottom: 24,
    },
    signOutText: {
        fontSize: 16,
        fontWeight: "700",
        color: "#ef4444",
    },
    languageButton: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        backgroundColor: "#f1f5f9",
        alignItems: "center",
    },
    languageButtonActive: {
        backgroundColor: "#8b5cf6",
    },
    languageButtonText: {
        fontSize: 15,
        fontWeight: "600",
        color: "#64748b",
    },
    languageButtonTextActive: {
        color: "white",
    },
    horizontalScroll: {
        flexDirection: 'row',
        marginBottom: 16,
        marginTop: 8,
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f1f5f9',
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    chipSelected: {
        backgroundColor: '#eff6ff',
        borderColor: '#3b82f6',
    },
    chipText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748b',
    },
    chipTextSelected: {
        color: '#3b82f6',
    },
    wrapContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 8,
    },
    smallChip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: '#f1f5f9',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    smallChipSelected: {
        backgroundColor: '#eff6ff',
        borderColor: '#3b82f6',
    },
    smallChipText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#64748b',
    },
    smallChipTextSelected: {
        color: '#3b82f6',
    },
    circleButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f1f5f9',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    circleButtonSelected: {
        backgroundColor: '#3b82f6',
        borderColor: '#3b82f6',
    },
    circleText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#64748b',
    },
    circleTextSelected: {
        color: '#ffffff',
    },
});


