import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import SuccessModal from "../../components/SuccessModal";
import { ALL_BADGES } from "../../constants/badges";
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
    const insets = useSafeAreaInsets();
    const { profile, updateProfile, goals, updateGoals, toggleReminder } = useMeals();

    const [localProfile, setLocalProfile] = useState(profile);
    const [localGoals, setLocalGoals] = useState(goals);
    const [isEditing, setIsEditing] = useState(false);

    const [showActivityModal, setShowActivityModal] = useState(false);
    const [showGenderModal, setShowGenderModal] = useState(false);
    const [showGoalModal, setShowGoalModal] = useState(false);


    const [showSuccessModal, setShowSuccessModal] = useState(false);


    React.useEffect(() => {
        if (isEditing) {
            setLocalProfile(profile);
            setLocalGoals(goals);
        }

        if (goals.strategy === "auto" && isEditing) {
            let bmr = 0;
            if (localProfile.gender === "male") {
                bmr = 88.362 + (13.397 * localProfile.weightKg) + (4.799 * localProfile.heightCm) - (5.677 * localProfile.age);
            } else {
                bmr = 447.593 + (9.247 * localProfile.weightKg) + (3.098 * localProfile.heightCm) - (4.330 * localProfile.age);
            }

            const multipliers = {
                sedentary: 1.2,
                light: 1.375,
                active: 1.55,
            };
            let tdee = bmr * multipliers[localProfile.activity];

            if (localProfile.goal === "lose") tdee -= 500;
            if (localProfile.goal === "gain") tdee += 500;

            const newCalories = Math.round(tdee);


            const pG = Math.round((newCalories * 0.3) / 4);
            const cG = Math.round((newCalories * 0.35) / 4);
            const fG = Math.round((newCalories * 0.35) / 9);

            setLocalGoals({
                calories: newCalories,
                protein: pG,
                carbs: cG,
                fat: fG,
                water: localGoals.water || 2500,
                strategy: "auto"
            });
        }
    }, [isEditing, profile, goals, localProfile.age, localProfile.activity, localProfile.gender, localProfile.goal, localProfile.heightCm, localProfile.weightKg, goals.strategy, localGoals.water]);

    const handleSave = async () => {
        // Check if reminders changed
        if (localProfile.reminders?.water !== profile.reminders?.water) {
            await toggleReminder('water', localProfile.reminders?.water ?? false);
        }
        if (localProfile.reminders?.meals !== profile.reminders?.meals) {
            await toggleReminder('meals', localProfile.reminders?.meals ?? false);
        }

        updateProfile(localProfile);

        if (localGoals.strategy === "manual") {
            updateGoals(localGoals);
        } else {
            // If switching back to auto, ensure strategy is set
            updateGoals({ strategy: "auto" });
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
                title="Select Activity Level"
                options={[
                    { label: "Sedentary (Little/no exercise)", value: "sedentary" },
                    { label: "Light (Exercise 1-3 days/wk)", value: "light" },
                    { label: "Active (Exercise 3-5 days/wk)", value: "active" },
                ]}
                onSelect={(val) => setLocalProfile({ ...localProfile, activity: val })}
            />

            <SelectionModal
                visible={showGenderModal}
                onClose={() => setShowGenderModal(false)}
                title="Select Gender"
                options={[
                    { label: "Male", value: "male" },
                    { label: "Female", value: "female" },
                ]}
                onSelect={(val) => setLocalProfile({ ...localProfile, gender: val })}
            />

            <SelectionModal
                visible={showGoalModal}
                onClose={() => setShowGoalModal(false)}
                title="Select Goal"
                options={[
                    { label: "Lose Weight (-500 kcal)", value: "lose" },
                    { label: "Maintain Weight", value: "maintain" },
                    { label: "Gain Muscle (+500 kcal)", value: "gain" },
                ]}
                onSelect={(val) => setLocalProfile({ ...localProfile, goal: val })}
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.content}>
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Profile & Goals</Text>
                        <Pressable onPress={() => isEditing ? handleSave() : setIsEditing(true)} style={styles.editButton}>
                            <Text style={styles.editButtonText}>{isEditing ? "Save" : "Edit"}</Text>
                        </Pressable>
                    </View>

                    <View style={styles.card}>
                        <SectionHeader title="Personal Details" icon="person" />

                        {isEditing ? (
                            <View style={styles.formGrid}>
                                <InputField
                                    label="Age"
                                    value={String(localProfile.age)}
                                    onChange={t => setLocalProfile({ ...localProfile, age: Number(t) })}
                                    placeholder="30"
                                    numeric
                                />
                                <InputField
                                    label="Height (cm)"
                                    value={String(localProfile.heightCm)}
                                    onChange={t => setLocalProfile({ ...localProfile, heightCm: Number(t) })}
                                    placeholder="175"
                                    numeric
                                />
                                <InputField
                                    label="Weight (kg)"
                                    value={String(localProfile.weightKg)}
                                    onChange={t => setLocalProfile({ ...localProfile, weightKg: Number(t) })}
                                    placeholder="75"
                                    numeric
                                />

                                <Pressable style={styles.selectorButton} onPress={() => setShowGenderModal(true)}>
                                    <Text style={styles.selectorLabel}>Gender</Text>
                                    <Text style={styles.selectorValue}>{localProfile.gender.charAt(0).toUpperCase() + localProfile.gender.slice(1)}</Text>
                                </Pressable>

                                <Pressable style={styles.selectorButton} onPress={() => setShowActivityModal(true)}>
                                    <Text style={styles.selectorLabel}>Activity</Text>
                                    <Text style={styles.selectorValue}>
                                        {localProfile.activity === "sedentary" ? "Sedentary" :
                                            localProfile.activity === "light" ? "Light Activity" : "Active"}
                                    </Text>
                                </Pressable>

                                <Pressable style={styles.selectorButton} onPress={() => setShowGoalModal(true)}>
                                    <Text style={styles.selectorLabel}>Goal</Text>
                                    <Text style={styles.selectorValue}>
                                        {localProfile.goal === "lose" ? "Lose Weight" :
                                            localProfile.goal === "maintain" ? "Maintain" : "Gain Muscle"}
                                    </Text>
                                </Pressable>
                            </View>
                        ) : (
                            <View style={styles.readOnlyGrid}>
                                <View style={styles.readOnlyItem}>
                                    <Text style={styles.readOnlyLabel}>Age</Text>
                                    <Text style={styles.readOnlyValue}>{profile.age}</Text>
                                </View>
                                <View style={styles.readOnlyItem}>
                                    <Text style={styles.readOnlyLabel}>Gender</Text>
                                    <Text style={styles.readOnlyValue}>{profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1)}</Text>
                                </View>
                                <View style={styles.readOnlyItem}>
                                    <Text style={styles.readOnlyLabel}>Height</Text>
                                    <Text style={styles.readOnlyValue}>{profile.heightCm} cm</Text>
                                </View>
                                <View style={styles.readOnlyItem}>
                                    <Text style={styles.readOnlyLabel}>Weight</Text>
                                    <Text style={styles.readOnlyValue}>{profile.weightKg} kg</Text>
                                </View>
                                <View style={styles.readOnlyItem}>
                                    <Text style={styles.readOnlyLabel}>Activity</Text>
                                    <Text style={styles.readOnlyValue}>{profile.activity.charAt(0).toUpperCase() + profile.activity.slice(1)}</Text>
                                </View>
                                <View style={styles.readOnlyItem}>
                                    <Text style={styles.readOnlyLabel}>Goal</Text>
                                    <Text style={styles.readOnlyValue}>{profile.goal.charAt(0).toUpperCase() + profile.goal.slice(1)}</Text>
                                </View>
                            </View>
                        )}
                    </View>

                    {isEditing && (
                        <>
                            <View style={styles.sectionHeader}>
                                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                                    <Ionicons name="notifications" size={20} color="#3b82f6" />
                                    <Text style={styles.sectionTitle}>Reminders</Text>
                                </View>
                            </View>

                            <View style={styles.card}>
                                <View style={styles.goalRow}>
                                    <View>
                                        <Text style={styles.goalLabel}>💧 Water Reminders</Text>
                                        <Text style={styles.macroLabel}>Every {localProfile.reminders?.waterInterval || 2} hours</Text>
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
                                            <Text style={styles.timeLabel}>Start Time</Text>
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
                                            <Text style={styles.timeLabel}>End Time</Text>
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
                                    <Text style={styles.goalLabel}>🍽️ Meal Reminders</Text>
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
                                            { label: "Breakfast", key: "breakfastTime" },
                                            { label: "Lunch", key: "lunchTime" },
                                            { label: "Dinner", key: "dinnerTime" }
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
                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                                <Ionicons name="trophy" size={20} color="#3b82f6" />
                                <Text style={styles.sectionTitle}>Nutrition Goals</Text>
                            </View>
                            {isEditing ? (
                                <Pressable onPress={toggleStrategy} style={styles.strategyButton}>
                                    <Text style={styles.strategyText}>
                                        {localGoals.strategy === "auto" ? "Auto-Calculated" : "Manual"}
                                    </Text>
                                    <Ionicons name="swap-horizontal" size={16} color="#3b82f6" />
                                </Pressable>
                            ) : (
                                <View style={styles.strategyBadge}>
                                    <Text style={styles.strategyBadgeText}>
                                        {goals.strategy === "auto" ? "Auto-Calculated" : "Manual"}
                                    </Text>
                                </View>
                            )}
                        </View>

                        {goals.strategy === "auto" && (
                            <View style={styles.infoBox}>
                                <Ionicons name="information-circle" size={20} color="#3b82f6" />
                                <Text style={styles.infoText}>
                                    Goals are calculated based on your profile details using the Harris-Benedict formula.
                                </Text>
                            </View>
                        )}

                        {isEditing && goals.strategy === "manual" ? (
                            <View style={styles.formGrid}>
                                <InputField
                                    label="Daily Calories"
                                    value={String(localGoals.calories)}
                                    onChange={t => setLocalGoals({ ...localGoals, calories: Number(t) })}
                                    placeholder="2000"
                                    numeric
                                />
                                <InputField
                                    label="Protein (g)"
                                    value={String(localGoals.protein)}
                                    onChange={t => setLocalGoals({ ...localGoals, protein: Number(t) })}
                                    placeholder="150"
                                    numeric
                                />
                                <InputField
                                    label="Carbs (g)"
                                    value={String(localGoals.carbs)}
                                    onChange={t => setLocalGoals({ ...localGoals, carbs: Number(t) })}
                                    placeholder="200"
                                    numeric
                                />
                                <InputField
                                    label="Fat (g)"
                                    value={String(localGoals.fat)}
                                    onChange={t => setLocalGoals({ ...localGoals, fat: Number(t) })}
                                    placeholder="65"
                                    numeric
                                />
                            </View>
                        ) : (
                            <View>
                                <View style={styles.goalRow}>
                                    <Text style={styles.goalLabel}>Calories</Text>
                                    <Text style={styles.goalValue}>{goals.calories} kcal</Text>
                                </View>
                                <View style={styles.divider} />
                                <View style={styles.macroRow}>
                                    <View style={styles.macroItem}>
                                        <Text style={styles.macroValue}>{goals.protein}g</Text>
                                        <Text style={styles.macroLabel}>Protein</Text>
                                    </View>
                                    <View style={styles.macroItem}>
                                        <Text style={styles.macroValue}>{goals.carbs}g</Text>
                                        <Text style={styles.macroLabel}>Carbs</Text>
                                    </View>
                                    <View style={styles.macroItem}>
                                        <Text style={styles.macroValue}>{goals.fat}g</Text>
                                        <Text style={styles.macroLabel}>Fat</Text>
                                    </View>
                                </View>
                                <View style={styles.divider} />
                                <View style={styles.goalRow}>
                                    <Text style={styles.goalLabel}>Water Goal</Text>
                                    <Text style={[styles.goalValue, { color: "#0ea5e9" }]}>{goals.water || 2500} ml</Text>
                                </View>
                            </View>
                        )}

                        {isEditing && (
                            <View style={[styles.formGrid, { marginTop: 16 }]}>
                                <View style={styles.divider} />
                                <Text style={[styles.sectionTitle, { fontSize: 16 }]}>Hydration Goal</Text>
                                <InputField
                                    label="Daily Water (ml)"
                                    value={localGoals.water ? String(localGoals.water) : ""}
                                    onChange={t => setLocalGoals({ ...localGoals, water: t === "" ? 0 : Number(t) })}
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
                                <Text style={styles.sectionTitle}>Achievements</Text>
                            </View>
                        </View>

                        <View style={styles.badgesGrid}>
                            {ALL_BADGES.map((badge) => {
                                const isUnlocked = profile.unlockedBadges?.some(b => b.badgeId === badge.id);
                                return (
                                    <View key={badge.id} style={[styles.badgeItem, !isUnlocked && styles.badgeLocked]}>
                                        <View style={[styles.badgeIcon, !isUnlocked && styles.badgeIconLocked]}>
                                            <Ionicons name={badge.icon as any} size={28} color={isUnlocked ? "#f59e0b" : "#94a3b8"} />
                                        </View>
                                        <Text style={styles.badgeText}>{badge.title}</Text>
                                    </View>
                                );
                            })}
                        </View>
                    </View>

                </ScrollView>
            </KeyboardAvoidingView>

            <SuccessModal
                visible={showSuccessModal}
                title="Profile Saved"
                message="Your goals have been updated based on your new profile settings."
                onClose={() => setShowSuccessModal(false)}
            />
        </View>
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
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: "#fef3c7",
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: "#fcd34d",
    },
    badgeIconLocked: {
        backgroundColor: "#f1f5f9",
        borderColor: "#cbd5e1",
    },
    badgeText: {
        fontSize: 12,
        fontWeight: "600",
        color: "#1e293b",
        textAlign: "center",
    },
});
