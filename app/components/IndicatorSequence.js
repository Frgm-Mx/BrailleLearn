// ============================================================
// IndicatorSequence — muestra la secuencia indicador → letra
// en orientación vertical con diseño mejorado.
//
// Props:
//   indicatorKey   "capital" | "number"
//   indicatorData  { dots, description }
//   letterChar     string — la letra o número actual
//   letterData     { dots, description }
//   feedbackAnim   Animated.Value — para el pulso de la celda
// ============================================================
import React from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import BrailleCell from "./BrailleCell";

export default function IndicatorSequence({
  indicatorKey,
  indicatorData,
  letterChar,
  letterData,
  feedbackAnim,
}) {
  const isCapital = indicatorKey === "capital";

  const indicatorTitle = isCapital ? "Indicador de mayúscula" : "Indicador numérico";
  const indicatorColor = isCapital ? "#0D7E8E" : "#F5A623";
  const letterTitle    = isCapital ? `Letra ${letterChar}` : `Número ${letterChar}`;

  // Descripción corta de los puntos del indicador
  const indicatorDotsLabel = isCapital
    ? "Puntos 4 y 6 — columna derecha, centro e inferior"
    : "Puntos 3, 4, 5 y 6 — columna izquierda inf. + columna derecha";

  return (
    <View style={styles.container}>

      {/* ── PASO 1: INDICADOR ── */}
      <View style={[styles.stepCard, { borderColor: indicatorColor }]}>
        {/* Badge de paso */}
        <View style={[styles.stepBadge, { backgroundColor: indicatorColor }]}>
          <Text style={styles.stepBadgeNum}>1</Text>
        </View>

        {/* Etiqueta */}
        <Text style={[styles.stepTitle, { color: indicatorColor }]}>
          {indicatorTitle}
        </Text>

        {/* Celda Braille del indicador — tamaño medio, vertical */}
        <View style={styles.cellWrapper}>
          <BrailleCell activeDots={indicatorData.dots} size="medium" />
        </View>

        {/* Puntos activos */}
        <View style={styles.dotRow}>
          {indicatorData.dots.map((dot) => (
            <View key={dot} style={[styles.dotChip, { backgroundColor: indicatorColor + "30", borderColor: indicatorColor }]}>
              <Text style={[styles.dotChipText, { color: indicatorColor }]}>{dot}</Text>
            </View>
          ))}
        </View>

        {/* Descripción */}
        <Text style={styles.stepDesc}>{indicatorDotsLabel}</Text>
      </View>

      {/* ── CONECTOR ── */}
      <View style={styles.connector}>
        <View style={[styles.connectorLine, { backgroundColor: indicatorColor + "60" }]} />
        <View style={[styles.connectorDot, { backgroundColor: indicatorColor }]}>
          <Text style={styles.connectorArrow}>↓</Text>
        </View>
        <View style={[styles.connectorLine, { backgroundColor: indicatorColor + "60" }]} />
        <Text style={styles.connectorLabel}>luego presiona</Text>
      </View>

      {/* ── PASO 2: LA LETRA / NÚMERO ── */}
      <View style={[styles.stepCard, { borderColor: "#1E3A5F" }]}>
        <View style={[styles.stepBadge, { backgroundColor: "#1B3A6B" }]}>
          <Text style={styles.stepBadgeNum}>2</Text>
        </View>

        <Text style={[styles.stepTitle, { color: "#C8D8E8" }]}>
          {letterTitle}
        </Text>

        {/* Celda grande con animación de pulso */}
        <View style={styles.cellWrapper}>
          <Animated.View style={{
            transform: [{
              scale: feedbackAnim
                ? feedbackAnim.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [1, 1.06, 1],
                  })
                : 1,
            }],
          }}>
            <BrailleCell activeDots={letterData.dots} size="large" />
          </Animated.View>
        </View>

        {/* Puntos activos */}
        <View style={styles.dotRow}>
          {letterData.dots.length > 0
            ? letterData.dots.map((dot) => (
                <View key={dot} style={[styles.dotChip, { backgroundColor: "#F5A62330", borderColor: "#F5A623" }]}>
                  <Text style={[styles.dotChipText, { color: "#F5A623" }]}>{dot}</Text>
                </View>
              ))
            : <Text style={styles.noDots}>Sin puntos (espacio)</Text>
          }
        </View>

        {/* Descripción */}
        <Text style={styles.stepDesc}>{letterData.description}</Text>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "center",
    marginBottom: 16,
  },

  // ── Tarjeta de paso ──
  stepCard: {
    width: "100%",
    backgroundColor: "#0D1F35",
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 20,
    alignItems: "center",
  },
  stepBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  stepBadgeNum: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  stepTitle: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 14,
    textAlign: "center",
    letterSpacing: 0.3,
  },
  cellWrapper: {
    marginBottom: 12,
  },

  // ── Chips de puntos ──
  dotRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 10,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  dotChip: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  dotChipText: {
    fontSize: 12,
    fontWeight: "700",
  },
  noDots: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 10,
  },

  stepDesc: {
    fontSize: 12,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 18,
  },

  // ── Conector entre pasos ──
  connector: {
    alignItems: "center",
    paddingVertical: 4,
    gap: 2,
  },
  connectorLine: {
    width: 1.5,
    height: 10,
  },
  connectorDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  connectorArrow: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  connectorLabel: {
    fontSize: 10,
    color: "#64748B",
    marginTop: 2,
    letterSpacing: 0.5,
  },
});