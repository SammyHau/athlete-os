import Ionicons from "@expo/vector-icons/Ionicons";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { sportMeta, statusMeta } from "../data/trainingPlan";
import { colors, radius, spacing, typography } from "../theme";

const dateFormatter = new Intl.DateTimeFormat("de-DE", {
  weekday: "long",
  day: "2-digit",
  month: "long",
  year: "numeric",
});

export function TrainingDetailModal({
  session,
  visible,
  onClose,
  onToggleStatus,
}) {
  if (!session) {
    return null;
  }

  const sport = sportMeta[session.sport];
  const status = statusMeta[session.status];
  const completed = session.status === "completed";
  const sessionDate = new Date(`${session.date}T00:00:00`);

  return (
    <Modal
      animationType="slide"
      presentationStyle="pageSheet"
      visible={visible}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <View style={styles.modalHeader}>
          <View style={styles.handle} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Detailansicht schließen"
            hitSlop={12}
            onPress={onClose}
            style={({ pressed }) => [
              styles.closeButton,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </Pressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          <View style={styles.sportRow}>
            <View style={styles.sportIcon}>
              <Ionicons name={sport.icon} size={22} color={colors.textPrimary} />
            </View>
            <Text style={styles.sport}>{sport.label.toUpperCase()}</Text>
          </View>

          <Text style={styles.title}>{session.title}</Text>
          <Text style={styles.date}>{dateFormatter.format(sessionDate)}</Text>

          <View style={styles.facts}>
            <Fact label="DAUER" value={`${session.durationMinutes} min`} />
            <Fact label="INTENSITÄT" value={session.intensity} />
            <Fact label="STATUS" value={status.label} />
          </View>

          <DetailSection title="Beschreibung">
            <Text style={styles.body}>{session.description}</Text>
          </DetailSection>

          <DetailSection title="Trainingsblöcke">
            <View style={styles.blocks}>
              {session.blocks.map((block, index) => (
                <View key={`${block.title}-${index}`} style={styles.block}>
                  <Text style={styles.blockIndex}>{String(index + 1).padStart(2, "0")}</Text>
                  <View style={styles.blockContent}>
                    <Text style={styles.blockTitle}>{block.title}</Text>
                    <Text style={styles.blockDetail}>{block.detail}</Text>
                  </View>
                </View>
              ))}
            </View>
          </DetailSection>

          <DetailSection title="Notizen">
            <Text style={styles.body}>{session.notes || "Keine Notizen vorhanden."}</Text>
          </DetailSection>

          {session.source ? (
            <Text style={styles.source}>Quelle: {session.source}</Text>
          ) : null}
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              completed
                ? "Wieder als geplant markieren"
                : "Als erledigt markieren"
            }
            onPress={onToggleStatus}
            style={({ pressed }) => [styles.action, pressed && styles.pressed]}
          >
            <Ionicons
              name={completed ? "refresh-outline" : "checkmark"}
              size={20}
              color={colors.black}
            />
            <Text style={styles.actionText}>
              {completed
                ? "Wieder als geplant markieren"
                : "Als erledigt markieren"}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

function Fact({ label, value }) {
  return (
    <View style={styles.fact}>
      <Text style={styles.factLabel}>{label}</Text>
      <Text style={styles.factValue}>{value}</Text>
    </View>
  );
}

function DetailSection({ title, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
  },
  closeButton: {
    position: "absolute",
    right: spacing.xl,
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
  },
  pressed: {
    opacity: 0.68,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  sportRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  sportIcon: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
  },
  sport: {
    ...typography.label,
    color: colors.textSecondary,
  },
  title: {
    ...typography.headline,
    marginTop: spacing.lg,
    color: colors.textPrimary,
  },
  date: {
    ...typography.body,
    marginTop: spacing.sm,
    color: colors.textSecondary,
  },
  facts: {
    flexDirection: "row",
    marginTop: spacing.xxl,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  fact: {
    flex: 1,
    minWidth: 0,
  },
  factLabel: {
    fontSize: 9,
    lineHeight: 12,
    fontWeight: "800",
    color: colors.textMuted,
  },
  factValue: {
    ...typography.caption,
    marginTop: spacing.xs,
    color: colors.textPrimary,
  },
  section: {
    marginTop: spacing.xxl,
  },
  sectionTitle: {
    ...typography.title,
    marginBottom: spacing.md,
    color: colors.textPrimary,
  },
  body: {
    ...typography.body,
    color: colors.textSecondary,
  },
  blocks: {
    gap: spacing.sm,
  },
  block: {
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  blockIndex: {
    ...typography.label,
    color: colors.textMuted,
  },
  blockContent: {
    flex: 1,
  },
  blockTitle: {
    ...typography.caption,
    color: colors.textPrimary,
  },
  blockDetail: {
    ...typography.body,
    marginTop: spacing.xs,
    color: colors.textSecondary,
  },
  source: {
    ...typography.caption,
    marginTop: spacing.xxl,
    color: colors.textMuted,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    borderTopWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  action: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
  },
  actionText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "800",
    color: colors.black,
  },
});
