import Ionicons from "@expo/vector-icons/Ionicons";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  intensities,
  sportMeta,
  sports,
  statusMeta,
  statuses,
  duplicateWorkoutStep,
  moveWorkoutStep,
  validateTrainingDraft,
} from "../data/trainingPlan";
import { colors, radius, spacing, typography } from "../theme";

function toFormValue(session) {
  return {
    ...session,
    durationMinutes: String(session.durationMinutes ?? ""),
    source: session.source ?? "",
    description: session.description ?? "",
    notes: session.notes ?? "",
    blocks: Array.isArray(session.workoutSteps) && session.workoutSteps.length
      ? session.workoutSteps.map((step) => ({ ...step, title: step.name, detail: step.instructions, durationValue: step.durationValue ? String(step.durationValue) : "", targetMin: step.targetMin ? String(step.targetMin) : "", targetMax: step.targetMax ? String(step.targetMax) : "", repetitions: step.repetitions ? String(step.repetitions) : "" }))
      : Array.isArray(session.blocks) ? session.blocks.map((block, index) => ({ ...block, id: `step-${index + 1}`, phase: "free", durationType: "open", durationValue: "", targetType: "none", targetMin: "", targetMax: "", unit: "", repetitions: "", recoveryStep: false }))
      : [],
  };
}

export function TrainingFormModal({
  visible,
  mode,
  initialSession,
  onCancel,
  onSave,
}) {
  const [form, setForm] = useState(() => toFormValue(initialSession));
  const [initialSnapshot, setInitialSnapshot] = useState("");
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!visible) {
      return;
    }

    const nextForm = toFormValue(initialSession);
    setForm(nextForm);
    setInitialSnapshot(JSON.stringify(nextForm));
    setErrors({});
  }, [initialSession, visible]);

  const isDirty = useMemo(
    () => Boolean(initialSnapshot) && JSON.stringify(form) !== initialSnapshot,
    [form, initialSnapshot],
  );

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function requestCancel() {
    if (!isDirty) {
      onCancel();
      return;
    }

    Alert.alert(
      "Änderungen verwerfen?",
      "Deine Eingaben wurden noch nicht gespeichert.",
      [
        { text: "Weiter bearbeiten", style: "cancel" },
        { text: "Verwerfen", style: "destructive", onPress: onCancel },
      ],
    );
  }

  function submit() {
    const nextErrors = validateTrainingDraft(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      return;
    }

    onSave({
      ...form,
      durationMinutes: Math.round(Number(form.durationMinutes)),
      title: form.title.trim(),
      source: form.source.trim(),
      description: form.description.trim(),
      notes: form.notes.trim(),
      blocks: form.blocks.map((block) => ({
        title: block.title.trim(),
        detail: block.detail.trim(),
      })),
      workoutSteps: form.blocks.map((block, index) => ({ id: block.id, order: index + 1, name: block.title.trim(), phase: block.phase, durationType: block.durationType, durationValue: block.durationValue, targetType: block.targetType, targetMin: block.targetMin, targetMax: block.targetMax, unit: block.unit, repetitions: block.repetitions, recoveryStep: block.recoveryStep, instructions: block.detail.trim() })),
    });
  }

  function addBlock() {
    setForm((current) => ({
      ...current,
      blocks: [...current.blocks, { id: `step-${Date.now()}`, title: "", detail: "", phase: "free", durationType: "open", durationValue: "", targetType: "none", targetMin: "", targetMax: "", unit: "", repetitions: "", recoveryStep: false }],
    }));
  }

  function updateBlock(index, field, value) {
    setForm((current) => ({
      ...current,
      blocks: current.blocks.map((block, blockIndex) => (
        blockIndex === index ? { ...block, [field]: value } : block
      )),
    }));
  }

  function removeBlock(index) {
    setForm((current) => ({
      ...current,
      blocks: current.blocks.filter((_, blockIndex) => blockIndex !== index),
    }));
  }

  function moveBlock(index, direction) { setForm((current) => ({ ...current, blocks: moveWorkoutStep(current.blocks.map((block) => ({ ...block, name: block.title, instructions: block.detail })), index, direction).map((step) => ({ ...step, title: step.name, detail: step.instructions, durationValue: step.durationValue ? String(step.durationValue) : "", targetMin: step.targetMin ? String(step.targetMin) : "", targetMax: step.targetMax ? String(step.targetMax) : "", repetitions: step.repetitions ? String(step.repetitions) : "" })) })); }
  function duplicateBlock(index) { setForm((current) => ({ ...current, blocks: duplicateWorkoutStep(current.blocks.map((block) => ({ ...block, name: block.title, instructions: block.detail })), index).map((step) => ({ ...step, title: step.name, detail: step.instructions, durationValue: step.durationValue ? String(step.durationValue) : "", targetMin: step.targetMin ? String(step.targetMin) : "", targetMax: step.targetMax ? String(step.targetMax) : "", repetitions: step.repetitions ? String(step.repetitions) : "" })) })); }

  return (
    <Modal
      animationType="slide"
      presentationStyle="pageSheet"
      visible={visible}
      onRequestClose={requestCancel}
    >
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.keyboardView}
        >
          <View style={styles.header}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Formular abbrechen"
              onPress={requestCancel}
              style={({ pressed }) => [styles.headerAction, pressed && styles.pressed]}
            >
              <Text style={styles.cancelText}>Abbrechen</Text>
            </Pressable>
            <Text style={styles.headerTitle}>
              {mode === "edit"
                ? "Einheit bearbeiten"
                : mode === "duplicate"
                  ? "Einheit duplizieren"
                  : "Einheit hinzufügen"}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Training speichern"
              onPress={submit}
              style={({ pressed }) => [styles.headerAction, pressed && styles.pressed]}
            >
              <Text style={styles.saveText}>Speichern</Text>
            </Pressable>
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.content}
          >
            <FormField
              label="Datum"
              error={errors.date}
              value={form.date}
              onChangeText={(value) => updateField("date", value)}
              placeholder="JJJJ-MM-TT"
              autoCapitalize="none"
              keyboardType="numbers-and-punctuation"
            />

            <Selector
              label="Sportart"
              error={errors.sport}
              options={sports.map((value) => ({
                value,
                label: sportMeta[value].label,
                icon: sportMeta[value].icon,
              }))}
              value={form.sport}
              onChange={(value) => updateField("sport", value)}
            />

            <FormField
              label="Titel"
              error={errors.title}
              value={form.title}
              onChangeText={(value) => updateField("title", value)}
              placeholder="Zum Beispiel lockerer Dauerlauf"
            />

            <FormField
              label="Dauer in Minuten"
              error={errors.durationMinutes}
              value={form.durationMinutes}
              onChangeText={(value) => updateField("durationMinutes", value)}
              placeholder="45"
              keyboardType="number-pad"
            />

            <Selector
              label="Intensität"
              error={errors.intensity}
              options={intensities.map((value) => ({ value, label: value }))}
              value={form.intensity}
              onChange={(value) => updateField("intensity", value)}
            />

            <Selector
              label="Status"
              error={errors.status}
              options={statuses.map((value) => ({
                value,
                label: statusMeta[value].label,
              }))}
              value={form.status}
              onChange={(value) => updateField("status", value)}
            />

            <FormField
              label="Quelle"
              value={form.source}
              onChangeText={(value) => updateField("source", value)}
              placeholder="AthleteOS, Garmin oder Strava"
            />

            <FormField
              label="Beschreibung"
              value={form.description}
              onChangeText={(value) => updateField("description", value)}
              placeholder="Ziel und Ablauf der Einheit"
              multiline
            />

            <View style={styles.blockSection}>
              <View style={styles.blockHeader}>
                <View style={styles.blockHeaderText}>
                  <Text style={styles.sectionTitle}>Trainingsblöcke</Text>
                  <Text style={styles.sectionHint}>In der geplanten Reihenfolge</Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Trainingsblock hinzufügen"
                  onPress={addBlock}
                  style={({ pressed }) => [styles.addBlockButton, pressed && styles.pressed]}
                >
                  <Ionicons name="add" size={20} color={colors.textPrimary} />
                  <Text style={styles.addBlockText}>Block</Text>
                </Pressable>
              </View>

              <View style={styles.blocks}>
                {form.blocks.map((block, index) => (
                  <View key={index} style={styles.block}>
                    <View style={styles.blockTopline}>
                      <Text style={styles.blockNumber}>BLOCK {index + 1}</Text>
                      <View style={styles.blockActions}>
                        <Pressable accessibilityRole="button" accessibilityLabel={`Block ${index + 1} nach oben`} disabled={index === 0} onPress={() => moveBlock(index, -1)}><Ionicons name="arrow-up" size={18} color={index === 0 ? colors.textMuted : colors.textPrimary} /></Pressable>
                        <Pressable accessibilityRole="button" accessibilityLabel={`Block ${index + 1} nach unten`} disabled={index === form.blocks.length - 1} onPress={() => moveBlock(index, 1)}><Ionicons name="arrow-down" size={18} color={index === form.blocks.length - 1 ? colors.textMuted : colors.textPrimary} /></Pressable>
                        <Pressable accessibilityRole="button" accessibilityLabel={`Block ${index + 1} duplizieren`} onPress={() => duplicateBlock(index)}><Ionicons name="copy-outline" size={18} color={colors.textPrimary} /></Pressable>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Trainingsblock ${index + 1} entfernen`}
                        hitSlop={8}
                        onPress={() => removeBlock(index)}
                      >
                        <Ionicons name="trash-outline" size={19} color={colors.danger} />
                      </Pressable>
                      </View>
                    </View>
                    <TextInput
                      accessibilityLabel={`Titel von Trainingsblock ${index + 1}`}
                      style={styles.blockInput}
                      value={block.title}
                      onChangeText={(value) => updateBlock(index, "title", value)}
                      placeholder="Name des Blocks"
                      placeholderTextColor={colors.textMuted}
                    />
                    <TextInput
                      accessibilityLabel={`Inhalt von Trainingsblock ${index + 1}`}
                      style={[styles.blockInput, styles.blockDetailInput]}
                      value={block.detail}
                      onChangeText={(value) => updateBlock(index, "detail", value)}
                      placeholder="Inhalt, Wiederholungen oder Pausen"
                      placeholderTextColor={colors.textMuted}
                      multiline
                    />
                    <View style={styles.stepGrid}>
                      <TextInput accessibilityLabel={`Phase von Block ${index + 1}`} style={styles.stepInput} value={block.phase} onChangeText={(value) => updateBlock(index, "phase", value)} placeholder="Phase" placeholderTextColor={colors.textMuted} />
                      <TextInput accessibilityLabel={`Dauerart von Block ${index + 1}`} style={styles.stepInput} value={block.durationType} onChangeText={(value) => updateBlock(index, "durationType", value)} placeholder="time/distance/open" placeholderTextColor={colors.textMuted} />
                      <TextInput accessibilityLabel={`Dauerwert von Block ${index + 1}`} style={styles.stepInput} keyboardType="decimal-pad" value={block.durationValue} onChangeText={(value) => updateBlock(index, "durationValue", value)} placeholder="Dauerwert" placeholderTextColor={colors.textMuted} />
                      <TextInput accessibilityLabel={`Zielart von Block ${index + 1}`} style={styles.stepInput} value={block.targetType} onChangeText={(value) => updateBlock(index, "targetType", value)} placeholder="rpe/power/pace" placeholderTextColor={colors.textMuted} />
                      <TextInput accessibilityLabel={`Zielminimum von Block ${index + 1}`} style={styles.stepInput} keyboardType="decimal-pad" value={block.targetMin} onChangeText={(value) => updateBlock(index, "targetMin", value)} placeholder="Ziel min." placeholderTextColor={colors.textMuted} />
                      <TextInput accessibilityLabel={`Zielmaximum von Block ${index + 1}`} style={styles.stepInput} keyboardType="decimal-pad" value={block.targetMax} onChangeText={(value) => updateBlock(index, "targetMax", value)} placeholder="Ziel max." placeholderTextColor={colors.textMuted} />
                    </View>
                  </View>
                ))}
              </View>
            </View>

            <FormField
              label="Notizen"
              value={form.notes}
              onChangeText={(value) => updateField("notes", value)}
              placeholder="Persönliche Hinweise zur Einheit"
              multiline
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

function FormField({ label, error, multiline = false, ...inputProps }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        style={[styles.input, multiline && styles.multilineInput, error && styles.inputError]}
        placeholderTextColor={colors.textMuted}
        multiline={multiline}
        textAlignVertical={multiline ? "top" : "center"}
        {...inputProps}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

function Selector({ label, error, options, value, onChange }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.options}>
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityLabel={`${label}: ${option.label}`}
              accessibilityState={{ selected }}
              onPress={() => onChange(option.value)}
              style={({ pressed }) => [
                styles.option,
                selected && styles.optionSelected,
                pressed && styles.pressed,
              ]}
            >
              {option.icon ? (
                <Ionicons
                  name={option.icon}
                  size={17}
                  color={selected ? colors.white : colors.textPrimary}
                />
              ) : null}
              <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  headerAction: {
    minWidth: 72,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    ...typography.caption,
    flex: 1,
    textAlign: "center",
    color: colors.textPrimary,
  },
  cancelText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  saveText: {
    ...typography.caption,
    color: colors.textPrimary,
  },
  pressed: {
    opacity: 0.65,
  },
  content: {
    padding: spacing.xl,
    paddingBottom: spacing.huge,
  },
  field: {
    marginBottom: spacing.xl,
  },
  fieldLabel: {
    ...typography.label,
    marginBottom: spacing.sm,
    color: colors.textSecondary,
  },
  input: {
    minHeight: 52,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    ...typography.body,
    color: colors.textPrimary,
  },
  multilineInput: {
    minHeight: 112,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
  },
  inputError: {
    borderColor: colors.danger,
  },
  error: {
    ...typography.caption,
    marginTop: spacing.sm,
    color: colors.danger,
  },
  options: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  option: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  optionSelected: {
    borderColor: colors.black,
    backgroundColor: colors.black,
  },
  optionText: {
    ...typography.caption,
    color: colors.textPrimary,
  },
  optionTextSelected: {
    color: colors.white,
  },
  blockSection: {
    marginBottom: spacing.xl,
  },
  blockHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  blockHeaderText: {
    flex: 1,
  },
  sectionTitle: {
    ...typography.title,
    color: colors.textPrimary,
  },
  sectionHint: {
    ...typography.caption,
    marginTop: spacing.xs,
    color: colors.textSecondary,
  },
  addBlockButton: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  addBlockText: {
    ...typography.caption,
    color: colors.textPrimary,
  },
  blocks: {
    gap: spacing.md,
  },
  block: {
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  blockTopline: {
    minHeight: 32,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  blockNumber: {
    ...typography.label,
    color: colors.textMuted,
  },
  blockActions: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  blockInput: {
    minHeight: 44,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderColor: colors.border,
    ...typography.body,
    color: colors.textPrimary,
  },
  blockDetailInput: {
    minHeight: 72,
    borderBottomWidth: 0,
    textAlignVertical: "top",
  },
  stepGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.md },
  stepInput: { width: "47%", flexGrow: 1, minHeight: 42, paddingHorizontal: spacing.sm, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, color: colors.textPrimary, backgroundColor: colors.background },
});
