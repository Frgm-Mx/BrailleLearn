import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Modal,
} from "react-native";

// FIX: mapa completo de todos los modos posibles
const MODE_LABELS = {
  beginner:    "🌱 Principiante",
  lowercase:   "🔡 Minúsculas",
  uppercase:   "🔠 Mayúsculas",
  numbers:     "🔢 Números",
  punctuation: "✳️ Puntuación",
  accented:    "áéí Acentuadas",
  full:        "🌎 Completo",
  curious:     "🔍 Explorador",
  vowels:      "🔤 Vocales",
  consonants:  "🔡 Consonantes",
  all:         "🌎 Todo",
  local:       "👥 Dos jugadores",
  "vs IA easy":   "🤖 vs IA Fácil",
  "vs IA medium": "🤖 vs IA Medio",
  "vs IA hard":   "🤖 vs IA Difícil",
};



export default function FeedbackModal({
  visible,
  score,
  total,
  mode,
  xpEarned,
  onRepeat,
  onContinue,
  onHome,
}) {
  const scaleAnim   = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1, tension: 80, friction: 6, useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1, duration: 300, useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;

  const getPerformance = () => {
    if (percentage === 100) return {
      emoji: "🏆", title: "¡Perfecto!",
      message: "Dominaste todas las letras sin un solo error.",
      color: "#F5A623",
    };
    if (percentage >= 80) return {
      emoji: "⭐", title: "¡Excelente!",
      message: "Vas muy bien. Sigue practicando para llegar al 100%.",
      color: "#0D7E8E",
    };
    if (percentage >= 60) return {
      emoji: "💪", title: "¡Buen intento!",
      message: "Ya vas agarrando el ritmo. Un poco más de práctica y lo dominas.",
      color: "#1B3A6B",
    };
    return {
      emoji: "🌱", title: "Sigue intentando",
      message: "El Braille toma tiempo. Repite la lección y verás cómo mejoras.",
      color: "#5B2D8E",
    };
  };

  const performance = getPerformance();
  const stars = percentage === 100 ? 3 : percentage >= 70 ? 2 : 1;

  // FIX: lookup en el mapa, con fallback genérico
  const modeLabel = MODE_LABELS[mode] || (mode ? `📖 ${mode}` : "📖 Sesión");

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <View style={styles.overlay}>
        <Animated.View style={[styles.card, {
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
        }]}>

          <View style={[styles.header, { backgroundColor: performance.color }]}>
            <Text style={styles.emoji}>{performance.emoji}</Text>
            <Text style={styles.title}>{performance.title}</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3].map((star) => (
                <Text key={star} style={[styles.star, star <= stars ? styles.starActive : styles.starInactive]}>★</Text>
              ))}
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{score}</Text>
              <Text style={styles.statLabel}>Correctas</Text>
            </View>
            <View style={[styles.statBox, styles.statBoxMiddle]}>
              <Text style={styles.statNumber}>{percentage}%</Text>
              <Text style={styles.statLabel}>Precisión</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{total - score}</Text>
              <Text style={styles.statLabel}>Errores</Text>
            </View>
          </View>

          {/* FIX: usa el mapa de modos */}
          <View style={styles.modeBadge}>
            <Text style={styles.modeBadgeText}>{modeLabel}</Text>
          </View>

          <Text style={styles.message}>{performance.message}</Text>
{xpEarned > 0 && (
  <View style={styles.xpEarnedRow}>
    <Text style={styles.xpEarnedIcon}>⚡</Text>
    <Text style={styles.xpEarnedText}>+{xpEarned} XP ganados</Text>
  </View>
)}
          <View style={styles.buttons}>
            <TouchableOpacity style={styles.btnRepeat} onPress={onRepeat} accessibilityLabel="Repetir lección">
              <Text style={styles.btnRepeatText}>🔄 Repetir</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btnContinue, { backgroundColor: performance.color }]}
              onPress={onContinue}
              accessibilityLabel="Continuar al siguiente nivel"
            >
              <Text style={styles.btnContinueText}>Continuar →</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.btnHome} onPress={onHome} accessibilityLabel="Volver al menú principal">
            <Text style={styles.btnHomeText}>← Menú principal</Text>
          </TouchableOpacity>

        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center", alignItems: "center", paddingHorizontal: 24,
  },
  card: {
    backgroundColor: "#0A1628", borderRadius: 24,
    overflow: "hidden", width: "100%", maxWidth: 380,
  },
  header: { paddingVertical: 28, alignItems: "center" },
  emoji:  { fontSize: 52, marginBottom: 8 },
  title:  { fontSize: 28, fontWeight: "900", color: "#FFFFFF", marginBottom: 12 },
  starsRow: { flexDirection: "row", gap: 8 },
  star:        { fontSize: 32 },
  starActive:  { color: "#FFFFFF" },
  starInactive: { color: "rgba(255,255,255,0.3)" },
  statsRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#1E3A5F" },
  statBox:       { flex: 1, paddingVertical: 20, alignItems: "center" },
  statBoxMiddle: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: "#1E3A5F" },
  statNumber: { fontSize: 28, fontWeight: "900", color: "#FFFFFF" },
  statLabel:  { fontSize: 11, color: "#64748B", marginTop: 4, textTransform: "uppercase", letterSpacing: 1 },
  modeBadge: {
    marginTop: 16, marginHorizontal: 24, backgroundColor: "#1B3A6B",
    borderRadius: 8, paddingVertical: 8, alignItems: "center",
  },
  modeBadgeText: { color: "#C8D8E8", fontSize: 13, fontWeight: "600" },
  message: {
    fontSize: 14, color: "#C8D8E8", textAlign: "center",
    marginHorizontal: 24, marginTop: 16, marginBottom: 20, lineHeight: 22,
  },
  buttons: { flexDirection: "row", gap: 12, marginHorizontal: 24, marginBottom: 12 },
  btnRepeat: {
    flex: 1, backgroundColor: "#1B3A6B", borderRadius: 12,
    paddingVertical: 14, alignItems: "center",
  },
  xpEarnedRow: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  marginHorizontal: 24,
  marginBottom: 16,
  backgroundColor: "#F5A62315",
  borderRadius: 10,
  paddingVertical: 10,
  borderWidth: 1,
  borderColor: "#F5A62340",
},
xpEarnedIcon: { fontSize: 18 },
xpEarnedText: {
  fontSize: 16,
  fontWeight: "700",
  color: "#F5A623",
},
  btnRepeatText:    { color: "#FFFFFF", fontWeight: "700", fontSize: 15 },
  btnContinue:      { flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  btnContinueText:  { color: "#FFFFFF", fontWeight: "700", fontSize: 15 },
  btnHome:          { alignItems: "center", paddingVertical: 16 },
  btnHomeText:      { color: "#64748B", fontSize: 14 },
});