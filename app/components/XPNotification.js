// ============================================================
// XPNotification — aparece brevemente cuando el usuario gana XP
// o desbloquea un logro
// ============================================================
import React, { useEffect, useRef } from "react";
import { View, Text, Animated, StyleSheet } from "react-native";
import { ACHIEVEMENTS } from "../context/ProgressContext";

export default function XPNotification({ xp, achievement, onHide }) {
  const slideY  = useRef(new Animated.Value(-80)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const achievementData = achievement
    ? ACHIEVEMENTS.find((a) => a.id === achievement)
    : null;

  useEffect(() => {
    // Entra desde arriba
    Animated.parallel([
      Animated.spring(slideY, {
        toValue: 0, tension: 100, friction: 8, useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1, duration: 200, useNativeDriver: true,
      }),
    ]).start();

    // Sale después de 2.5 segundos
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(slideY, {
          toValue: -80, duration: 300, useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0, duration: 300, useNativeDriver: true,
        }),
      ]).start(() => onHide?.());
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View style={[
      styles.container,
      { transform: [{ translateY: slideY }], opacity },
    ]}>
      {achievementData ? (
        // Notificación de logro
        <View style={styles.achievementRow}>
          <Text style={styles.achievementEmoji}>{achievementData.emoji}</Text>
          <View style={styles.achievementText}>
            <Text style={styles.achievementTitle}>¡Logro desbloqueado!</Text>
            <Text style={styles.achievementName}>{achievementData.title}</Text>
          </View>
          <View style={styles.xpBadge}>
            <Text style={styles.xpBadgeText}>+{achievementData.xpReward} XP</Text>
          </View>
        </View>
      ) : (
        // Notificación de XP simple
        <View style={styles.xpRow}>
          <Text style={styles.xpIcon}>⚡</Text>
          <Text style={styles.xpText}>+{xp} XP</Text>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 60,
    left: 20,
    right: 20,
    zIndex: 999,
    backgroundColor: "#111E30",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#F5A623",
    shadowColor: "#F5A623",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  xpRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  xpIcon: { fontSize: 20 },
  xpText: {
    fontSize: 20,
    fontWeight: "900",
    color: "#F5A623",
  },
  achievementRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  achievementEmoji:  { fontSize: 28 },
  achievementText:   { flex: 1 },
  achievementTitle: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  achievementName: {
    fontSize: 15,
    color: "#FFFFFF",
    fontWeight: "700",
    marginTop: 2,
  },
  xpBadge: {
    backgroundColor: "#F5A62320",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "#F5A623",
  },
  xpBadgeText: {
    color: "#F5A623",
    fontSize: 13,
    fontWeight: "700",
  },
});