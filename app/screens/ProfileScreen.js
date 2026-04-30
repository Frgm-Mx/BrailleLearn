import React, { useState } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, Animated,
} from "react-native";
import {
  useProgress, LEVELS, ACHIEVEMENTS,
  getLevelForXP, getXPProgress, XP_CONFIG,
} from "../context/ProgressContext";

// Barra de XP animada
function XPBar({ percentage, color }) {
  const anim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.spring(anim, {
      toValue: percentage,
      tension: 60, friction: 8, useNativeDriver: false,
    }).start();
  }, [percentage]);

  return (
    <View style={xpStyles.track}>
      <Animated.View style={[xpStyles.fill, {
        width: anim.interpolate({
          inputRange: [0, 1],
          outputRange: ["0%", "100%"],
        }),
        backgroundColor: color,
      }]} />
    </View>
  );
}

const xpStyles = StyleSheet.create({
  track: {
    height: 10, backgroundColor: "#1E3A5F",
    borderRadius: 5, overflow: "hidden", width: "100%",
  },
  fill: { height: 10, borderRadius: 5 },
});

// Carta de logro
function AchievementCard({ achievement, unlocked }) {
  const data = ACHIEVEMENTS.find((a) => a.id === achievement.id || a.id === achievement);
  if (!data) return null;
  const isUnlocked = unlocked.includes(data.id);

  return (
    <View style={[
      styles.achievementCard,
      !isUnlocked && styles.achievementLocked,
    ]}>
      <Text style={[styles.achievementEmoji, !isUnlocked && styles.lockedEmoji]}>
        {isUnlocked ? data.emoji : "🔒"}
      </Text>
      <View style={styles.achievementInfo}>
        <Text style={[styles.achievementTitle, !isUnlocked && styles.lockedText]}>
          {data.title}
        </Text>
        <Text style={styles.achievementDesc}>{data.desc}</Text>
      </View>
      <View style={[styles.xpReward, !isUnlocked && styles.xpRewardLocked]}>
        <Text style={[styles.xpRewardText, !isUnlocked && styles.lockedText]}>
          +{data.xpReward}
        </Text>
      </View>
    </View>
  );
}

export default function ProfileScreen({ navigation }) {
  const { progress } = useProgress();
  const [activeTab, setActiveTab] = useState("stats"); // stats | achievements | letters

  const xpData       = getXPProgress(progress.totalXP);
  const currentLevel = xpData.current;
  const accuracy     = progress.totalCorrect + progress.totalWrong > 0
    ? Math.round((progress.totalCorrect / (progress.totalCorrect + progress.totalWrong)) * 100)
    : 0;

  const letterKeys = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  return (
    <SafeAreaView style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mi Progreso</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── Tarjeta de nivel ── */}
        <View style={[styles.levelCard, { borderColor: currentLevel.color + "60" }]}>
          <View style={styles.levelLeft}>
            <Text style={styles.levelEmoji}>{currentLevel.emoji}</Text>
            <View>
              <Text style={styles.levelNumber}>Nivel {currentLevel.level}</Text>
              <Text style={[styles.levelTitle, { color: currentLevel.color }]}>
                {currentLevel.title}
              </Text>
            </View>
          </View>
          <View style={styles.levelRight}>
            <Text style={styles.totalXP}>{progress.totalXP.toLocaleString()}</Text>
            <Text style={styles.xpLabel}>XP total</Text>
          </View>
        </View>

        {/* Barra de progreso al siguiente nivel */}
        {xpData.next && (
          <View style={styles.xpProgressContainer}>
            <View style={styles.xpProgressHeader}>
              <Text style={styles.xpProgressLabel}>
                {xpData.xpInLevel} / {xpData.xpNeeded} XP
              </Text>
              <Text style={styles.xpNextLevel}>
                Próximo: {xpData.next.emoji} Nivel {xpData.next.level}
              </Text>
            </View>
            <XPBar percentage={xpData.percentage} color={currentLevel.color} />
          </View>
        )}

        {/* Racha diaria */}
        <View style={styles.streakContainer}>
          <View style={styles.streakCard}>
            <Text style={styles.streakEmoji}>🔥</Text>
            <Text style={styles.streakNumber}>{progress.currentStreak}</Text>
            <Text style={styles.streakLabel}>días seguidos</Text>
          </View>
          <View style={styles.streakCard}>
            <Text style={styles.streakEmoji}>📅</Text>
            <Text style={styles.streakNumber}>{progress.longestStreak}</Text>
            <Text style={styles.streakLabel}>racha máxima</Text>
          </View>
          <View style={styles.streakCard}>
            <Text style={styles.streakEmoji}>⚡</Text>
            <Text style={styles.streakNumber}>{progress.dailyXP}</Text>
            <Text style={styles.streakLabel}>XP hoy</Text>
          </View>
        </View>

        {/* Meta diaria */}
        <View style={styles.dailyGoalContainer}>
          <View style={styles.dailyGoalHeader}>
            <Text style={styles.dailyGoalTitle}>Meta diaria</Text>
            <Text style={styles.dailyGoalValue}>
              {Math.min(progress.dailyXP, XP_CONFIG.dailyGoal)} / {XP_CONFIG.dailyGoal} XP
            </Text>
          </View>
          <XPBar
            percentage={Math.min(progress.dailyXP / XP_CONFIG.dailyGoal, 1)}
            color="#F5A623"
          />
          {progress.dailyXP >= XP_CONFIG.dailyGoal && (
            <Text style={styles.goalComplete}>🎯 ¡Meta completada!</Text>
          )}
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          {[
            { key: "stats",        label: "Estadísticas" },
            { key: "achievements", label: "Logros"       },
            { key: "letters",      label: "Letras"       },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── TAB: Estadísticas ── */}
        {activeTab === "stats" && (
          <View style={styles.tabContent}>
            {[
              { label: "Letras dominadas", value: progress.lettersLearned.length, total: 26,  emoji: "🔤" },
              { label: "Precisión",        value: `${accuracy}%`,                 total: null, emoji: "🎯" },
              { label: "Respuestas correctas", value: progress.totalCorrect,       total: null, emoji: "✅" },
              { label: "Sesiones totales", value: progress.totalSessions,          total: null, emoji: "📖" },
              { label: "Partidas jugadas", value: progress.gamesPlayed,            total: null, emoji: "🎮" },
              { label: "Partidas ganadas", value: progress.gamesWon,               total: null, emoji: "🏆" },
            ].map((stat) => (
              <View key={stat.label} style={styles.statRow}>
                <Text style={styles.statEmoji}>{stat.emoji}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
                <Text style={styles.statValue}>
                  {stat.value}{stat.total ? ` / ${stat.total}` : ""}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* ── TAB: Logros ── */}
        {activeTab === "achievements" && (
          <View style={styles.tabContent}>
            <Text style={styles.achievementCount}>
              {progress.achievements.length} / {ACHIEVEMENTS.length} desbloqueados
            </Text>
            {ACHIEVEMENTS.map((achievement) => (
              <AchievementCard
                key={achievement.id}
                achievement={achievement}
                unlocked={progress.achievements}
              />
            ))}
          </View>
        )}

        {/* ── TAB: Letras ── */}
        {activeTab === "letters" && (
          <View style={styles.tabContent}>
            <Text style={styles.lettersSubtitle}>
              Verde = dominada (3+ aciertos) · Gris = no vista aún
            </Text>
            <View style={styles.lettersGrid}>
              {letterKeys.map((letter) => {
                const stats    = progress.lettersStats[letter];
                const learned  = progress.lettersLearned.includes(letter);
                const hasSeen  = stats && (stats.correct + stats.wrong) > 0;
                const accuracy = hasSeen
                  ? Math.round((stats.correct / (stats.correct + stats.wrong)) * 100)
                  : null;

                return (
                  <View
                    key={letter}
                    style={[
                      styles.letterTile,
                      learned  && styles.letterTileLearned,
                      hasSeen && !learned && styles.letterTileSeen,
                    ]}
                  >
                    <Text style={[
                      styles.letterTileChar,
                      learned && styles.letterTileCharLearned,
                    ]}>
                      {letter}
                    </Text>
                    {accuracy !== null && (
                      <Text style={styles.letterAccuracy}>{accuracy}%</Text>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: "#0A1628" },
  header: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24, paddingTop: 16, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: "#1E3A5F",
  },
  backText:    { color: "#C8D8E8", fontSize: 16 },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#FFFFFF" },

  // Nivel
  levelCard: {
    margin: 16, backgroundColor: "#111E30",
    borderRadius: 20, padding: 20,
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", borderWidth: 1.5,
  },
  levelLeft:   { flexDirection: "row", alignItems: "center", gap: 14 },
  levelEmoji:  { fontSize: 40 },
  levelNumber: { fontSize: 13, color: "#64748B", fontWeight: "600" },
  levelTitle:  { fontSize: 20, fontWeight: "800", marginTop: 2 },
  levelRight:  { alignItems: "flex-end" },
  totalXP: {
    fontSize: 28, fontWeight: "900", color: "#FFFFFF",
  },
  xpLabel: { fontSize: 11, color: "#64748B", marginTop: 2 },

  // Barra XP
  xpProgressContainer: {
    marginHorizontal: 16, marginBottom: 12, gap: 8,
  },
  xpProgressHeader: {
    flexDirection: "row", justifyContent: "space-between",
  },
  xpProgressLabel: { fontSize: 12, color: "#C8D8E8" },
  xpNextLevel:     { fontSize: 12, color: "#64748B"  },

  // Racha
  streakContainer: {
    flexDirection: "row", gap: 10,
    marginHorizontal: 16, marginBottom: 12,
  },
  streakCard: {
    flex: 1, backgroundColor: "#111E30",
    borderRadius: 14, padding: 14,
    alignItems: "center", gap: 4,
    borderWidth: 1, borderColor: "#1E3A5F",
  },
  streakEmoji:  { fontSize: 22 },
  streakNumber: { fontSize: 22, fontWeight: "900", color: "#FFFFFF" },
  streakLabel:  { fontSize: 10, color: "#64748B", textAlign: "center" },

  // Meta diaria
  dailyGoalContainer: {
    marginHorizontal: 16, marginBottom: 16,
    backgroundColor: "#111E30", borderRadius: 14,
    padding: 16, gap: 10,
    borderWidth: 1, borderColor: "#1E3A5F",
  },
  dailyGoalHeader: {
    flexDirection: "row", justifyContent: "space-between",
  },
  dailyGoalTitle: { fontSize: 13, fontWeight: "700", color: "#FFFFFF" },
  dailyGoalValue: { fontSize: 13, color: "#F5A623", fontWeight: "600" },
  goalComplete:   { fontSize: 13, color: "#0A7C5E", fontWeight: "700", textAlign: "center" },

  // Tabs
  tabs: {
    flexDirection: "row", marginHorizontal: 16,
    backgroundColor: "#111E30", borderRadius: 12,
    padding: 4, marginBottom: 16,
    borderWidth: 1, borderColor: "#1E3A5F",
  },
  tab: {
    flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center",
  },
  tabActive:     { backgroundColor: "#1B3A6B" },
  tabText:       { fontSize: 13, color: "#64748B", fontWeight: "600" },
  tabTextActive: { color: "#FFFFFF" },
  tabContent:    { paddingHorizontal: 16 },

  // Stats
  statRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#111E30", borderRadius: 12,
    padding: 14, marginBottom: 8, gap: 12,
    borderWidth: 1, borderColor: "#1E3A5F",
  },
  statEmoji: { fontSize: 20 },
  statLabel: { flex: 1, fontSize: 14, color: "#C8D8E8", fontWeight: "500" },
  statValue: { fontSize: 16, fontWeight: "700", color: "#FFFFFF" },

  // Logros
  achievementCount: {
    fontSize: 13, color: "#64748B",
    marginBottom: 12, textAlign: "center",
  },
  achievementCard: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#111E30", borderRadius: 12,
    padding: 14, marginBottom: 8, gap: 12,
    borderWidth: 1, borderColor: "#1E3A5F",
  },
  achievementLocked: { opacity: 0.5 },
  achievementEmoji:  { fontSize: 26 },
  lockedEmoji:       { opacity: 0.4 },
  achievementInfo:   { flex: 1 },
  achievementTitle:  { fontSize: 14, fontWeight: "700", color: "#FFFFFF", marginBottom: 2 },
  achievementDesc:   { fontSize: 12, color: "#64748B", lineHeight: 18 },
  lockedText:        { color: "#64748B" },
  xpReward: {
    backgroundColor: "#F5A62320", borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 4,
    borderWidth: 1, borderColor: "#F5A623",
  },
  xpRewardLocked: { borderColor: "#64748B", backgroundColor: "transparent" },
  xpRewardText:   { color: "#F5A623", fontSize: 12, fontWeight: "700" },

  // Letras
  lettersSubtitle: {
    fontSize: 11, color: "#64748B",
    textAlign: "center", marginBottom: 16, lineHeight: 18,
  },
  lettersGrid: {
    flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center",
  },
  letterTile: {
    width: 52, height: 52, borderRadius: 10,
    backgroundColor: "#111E30", alignItems: "center",
    justifyContent: "center", borderWidth: 1, borderColor: "#1E3A5F",
  },
  letterTileSeen:    { borderColor: "#F5A62360", backgroundColor: "#1A2A10" },
  letterTileLearned: { borderColor: "#0A7C5E", backgroundColor: "#0A1F15" },
  letterTileChar: {
    fontSize: 20, fontWeight: "800", color: "#64748B",
  },
  letterTileCharLearned: { color: "#0A7C5E" },
  letterAccuracy: {
    fontSize: 9, color: "#64748B", marginTop: 1,
  },
});