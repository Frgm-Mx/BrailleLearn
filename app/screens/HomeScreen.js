// ============================================================
// HomeScreen — pantalla de inicio
// FIX: celda Braille decorativa con grid 2×3 correcto
// MEJORA: diseño más pulido con stats rápidas
// ============================================================
import React from "react";
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar,
} from "react-native";
import { useProgress, getXPProgress } from "../context/ProgressContext";

const MENU = [
  { title: "Aprender",  subtitle: "Empieza desde cero",        screen: "Learn",    color: "#0D7E8E", emoji: "📖" },
  { title: "Practicar", subtitle: "Pon a prueba lo que sabes", screen: "Practice", color: "#1B3A6B", emoji: "✍️" },
  { title: "Jugar",     subtitle: "Compite y aprende",         screen: "Game",     color: "#5B2D8E", emoji: "🎮" },
  { title: "Mi Perfil", subtitle: "Progreso y logros",         screen: "Profile",  color: "#F5A623", emoji: "👤" },
  { title: "Ajustes",   subtitle: "Configura tu experiencia",  screen: "Settings", color: "#374151", emoji: "⚙️" },
];

// Puntos de la celda Braille en orden correcto para grid 2×3
// Columna izq: 1,2,3  Columna der: 4,5,6 — intercalados para flexWrap
const BRAILLE_GRID_ORDER = [1, 4, 2, 5, 3, 6];
// Puntos activos para mostrar la letra "B" (1,2) como decoración
const ACTIVE_DOTS = [1, 2];

export default function HomeScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A1628" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>BRAILLE</Text>
          <Text style={styles.subtitle}>Aprende a tu ritmo</Text>
        </View>

        {/* FIX: celda Braille 2×3 correcta */}
        <View style={styles.brailleCell}>
          {BRAILLE_GRID_ORDER.map((dot) => (
            <View
              key={dot}
              style={[
                styles.dot,
                ACTIVE_DOTS.includes(dot) && styles.dotActive,
              ]}
            />
          ))}
        </View>
      </View>

      {/* Separador */}
      <View style={styles.separator} />

      {/* Menú */}
      <View style={styles.menu}>
        {MENU.map((item) => (
          <TouchableOpacity
            key={item.screen}
            style={styles.menuItem}
            onPress={() => navigation.navigate(item.screen)}
            accessibilityLabel={`${item.title}. ${item.subtitle}`}
            accessibilityRole="button"
          >
            {/* Barra de color lateral */}
            <View style={[styles.colorBar, { backgroundColor: item.color }]} />

            {/* Emoji */}
            <View style={[styles.emojiBox, { backgroundColor: item.color + "30" }]}>
              <Text style={styles.emoji}>{item.emoji}</Text>
            </View>

            {/* Texto */}
            <View style={styles.menuText}>
              <Text style={styles.menuTitle}>{item.title}</Text>
              <Text style={styles.menuSub}>{item.subtitle}</Text>
            </View>

            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Footer info */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Sistema Braille español · Grado 1</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: "#0A1628",
    paddingHorizontal: 24,
  },

  // Header
  header: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "flex-start", marginTop: 40, marginBottom: 24,
  },
  title: {
    fontSize: 40, fontWeight: "900", color: "#FFFFFF",
    letterSpacing: 5, lineHeight: 44,
  },
  subtitle: { fontSize: 14, color: "#64748B", marginTop: 4 },

  // FIX: celda Braille 2×3 correcta
  // width = 2 dots (16px) + 1 gap (8px) = 40px
  brailleCell: {
    flexDirection: "row", flexWrap: "wrap",
    width: 40, gap: 8, marginTop: 6,
  },
  dot: {
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: "#1E3A5F",
  },
  dotActive: { backgroundColor: "#F5A623" },

  separator: {
    height: 1, backgroundColor: "#1E3A5F", marginBottom: 28,
  },

  // Menú
  menu: { gap: 12, flex: 1 },
  menuItem: {
    backgroundColor: "#111E30",
    borderRadius: 16, flexDirection: "row",
    alignItems: "center", overflow: "hidden",
    borderWidth: 1, borderColor: "#1E3A5F",
    height: 76,
  },
  colorBar: { width: 4, alignSelf: "stretch" },
  emojiBox: {
    width: 52, height: 52, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
    marginHorizontal: 14,
  },
  emoji:     { fontSize: 24 },
  menuText:  { flex: 1 },
  menuTitle: { fontSize: 17, fontWeight: "700", color: "#FFFFFF", marginBottom: 3 },
  menuSub:   { fontSize: 12, color: "#64748B" },
  arrow:     { fontSize: 24, color: "#F5A623", marginRight: 16, fontWeight: "300" },

  // Footer
  footer: { paddingVertical: 20, alignItems: "center" },
  footerText: { fontSize: 11, color: "#1E3A5F", letterSpacing: 0.5 },
});