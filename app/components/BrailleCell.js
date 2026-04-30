// ============================================================
// BrailleCell — celda Braille animada
// FIX: cancela animaciones Animated.loop al desmontar
// FIX: grid 2×3 robusto con position: absolute + coordenadas fijas
// MEJORA: acepta showLabels prop para mostrar número de cada punto
// ============================================================
import React, { useEffect, useRef } from "react";
import { View, Text, Animated, StyleSheet } from "react-native";

// Posición fija de cada punto en la cuadrícula 2×3
// col 0 = izquierda (puntos 1,2,3), col 1 = derecha (puntos 4,5,6)
const DOT_LAYOUT = {
  1: { col: 0, row: 0 },
  2: { col: 0, row: 1 },
  3: { col: 0, row: 2 },
  4: { col: 1, row: 0 },
  5: { col: 1, row: 1 },
  6: { col: 1, row: 2 },
};

const DOTS = [1, 2, 3, 4, 5, 6];

export default function BrailleCell({
  activeDots = [],
  size = "large",
  showLabels = false,
}) {
  const dotSize  = size === "large" ? 30 : size === "medium" ? 22 : 16;
  const gap      = size === "large" ? 14 : size === "medium" ? 10 : 8;
  const cellPad  = size === "large" ? 18 : size === "medium" ? 12 : 8;

  const colW   = dotSize;
  const colGap = gap;
  const rowH   = dotSize;
  const rowGap = gap;

  const cellW = colW * 2 + colGap + cellPad * 2;
  const cellH = rowH * 3 + rowGap * 2 + cellPad * 2;

  // Un Animated.Value por punto
  const anims = useRef(DOTS.map(() => new Animated.Value(1))).current;
  // Refs de las animaciones loop para poder detenerlas
  const loopRefs = useRef(DOTS.map(() => null));

  useEffect(() => {
    DOTS.forEach((dot, i) => {
      // Detener animación anterior
      if (loopRefs.current[i]) {
        loopRefs.current[i].stop();
        loopRefs.current[i] = null;
      }

      if (activeDots.includes(dot)) {
        const loop = Animated.loop(
          Animated.sequence([
            Animated.timing(anims[i], { toValue: 1.18, duration: 700, useNativeDriver: true }),
            Animated.timing(anims[i], { toValue: 1.00, duration: 700, useNativeDriver: true }),
          ])
        );
        loop.start();
        loopRefs.current[i] = loop;
      } else {
        anims[i].setValue(1);
      }
    });

    // Cleanup al desmontar o cuando cambian los dots
    return () => {
      loopRefs.current.forEach((loop) => { if (loop) loop.stop(); });
    };
  }, [activeDots.join(",")]);  // string key estable

  return (
    <View style={[styles.cell, { width: cellW, height: cellH, padding: cellPad }]}>
      <View style={{ width: cellW - cellPad * 2, height: cellH - cellPad * 2, position: "relative" }}>
        {DOTS.map((dot, i) => {
          const isActive = activeDots.includes(dot);
          const { col, row } = DOT_LAYOUT[dot];
          const x = col * (dotSize + colGap);
          const y = row * (dotSize + rowGap);

          return (
            <Animated.View
              key={dot}
              style={[
                styles.dot,
                {
                  width: dotSize,
                  height: dotSize,
                  borderRadius: dotSize / 2,
                  left: x,
                  top: y,
                  backgroundColor: isActive ? "#F5A623" : "#1E3A5F",
                  transform: [{ scale: anims[i] }],
                },
                isActive && styles.dotActiveShadow,
              ]}
            >
              {showLabels && (
                <Text style={[styles.dotLabel, { fontSize: dotSize * 0.32 }]}>
                  {dot}
                </Text>
              )}
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cell: {
    backgroundColor: "#1B3A6B",
    borderRadius: 16,
    alignSelf: "center",
  },
  dot: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  dotActiveShadow: {
    shadowColor: "#F5A623",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 6,
    elevation: 4,
  },
  dotLabel: {
    color: "#0A1628",
    fontWeight: "800",
  },
});