// ============================================================
// ProgressBar — Barra de progreso animada
// Props:
//   value         {number}  0–1 (fracción actual)
//   color         {string}  color del fill (default #F5A623)
//   backgroundColor {string} color del track (default #1E3A5F)
//   height        {number}  altura en px (default 6)
//   animated      {boolean} anima el cambio de valor (default true)
//   showLabel     {boolean} muestra el % encima (default false)
//   labelColor    {string}  color del label (default #C8D8E8)
//   style         {object}  estilos extra para el contenedor
//   accessibilityLabel {string} descripción para lectores de pantalla
// ============================================================

import React, { useEffect, useRef } from "react";
import { View, Text, Animated, StyleSheet, AccessibilityInfo } from "react-native";

export default function ProgressBar({
  value = 0,
  color = "#F5A623",
  backgroundColor = "#1E3A5F",
  height = 6,
  animated = true,
  showLabel = false,
  labelColor = "#C8D8E8",
  style,
  accessibilityLabel,
}) {
  // Clamp value entre 0 y 1
  const clamped = Math.min(1, Math.max(0, value));
  const animatedWidth = useRef(new Animated.Value(clamped)).current;

  useEffect(() => {
    if (animated) {
      Animated.spring(animatedWidth, {
        toValue: clamped,
        useNativeDriver: false,
        tension: 80,
        friction: 10,
      }).start();
    } else {
      animatedWidth.setValue(clamped);
    }
  }, [clamped, animated]);

  const percentage = Math.round(clamped * 100);

  return (
    <View
      style={[styles.container, style]}
      accessible
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: percentage }}
      accessibilityLabel={accessibilityLabel || `Progreso: ${percentage}%`}
    >
      {showLabel && (
        <Text style={[styles.label, { color: labelColor }]}>
          {percentage}%
        </Text>
      )}
      <View
        style={[
          styles.track,
          { height, backgroundColor, borderRadius: height / 2 },
        ]}
      >
        <Animated.View
          style={[
            styles.fill,
            {
              height,
              borderRadius: height / 2,
              backgroundColor: color,
              width: animatedWidth.interpolate({
                inputRange: [0, 1],
                outputRange: ["0%", "100%"],
              }),
              // Brillo sutil en el extremo derecho del fill
              shadowColor: color,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.6,
              shadowRadius: 4,
              elevation: 2,
            },
          ]}
        />
      </View>
    </View>
  );
}

// ── Variante con gradiente de colores según el valor ──────────
// Útil para el timer (verde → amarillo → rojo)
export function TimerBar({
  value = 1,         // 1 = tiempo completo, 0 = tiempo agotado
  height = 5,
  style,
}) {
  const animatedWidth = useRef(new Animated.Value(value)).current;
  const animatedColor = useRef(new Animated.Value(value)).current;

  useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: value,
      duration: 1000,
      useNativeDriver: false,
    }).start();
    Animated.timing(animatedColor, {
      toValue: value,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [value]);

  const color = animatedColor.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: ["#7C1A0A", "#F5A623", "#0D7E8E"],
  });

  return (
    <View
      style={[{ height, backgroundColor: "#1E3A5F", borderRadius: height / 2 }, style]}
      accessible
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(value * 100) }}
      accessibilityLabel={`Tiempo restante: ${Math.round(value * 100)}%`}
    >
      <Animated.View
        style={{
          height,
          borderRadius: height / 2,
          backgroundColor: color,
          width: animatedWidth.interpolate({
            inputRange: [0, 1],
            outputRange: ["0%", "100%"],
          }),
        }}
      />
    </View>
  );
}

// ── Variante circular (para el score modal) ───────────────────
export function CircularProgress({
  value = 0,        // 0–1
  size = 80,
  strokeWidth = 8,
  color = "#F5A623",
  backgroundColor = "#1E3A5F",
  label,            // texto en el centro (ej: "75%")
  labelColor = "#FFFFFF",
}) {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(animatedValue, {
      toValue: value,
      useNativeDriver: false,
      tension: 60,
      friction: 8,
    }).start();
  }, [value]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(1, Math.max(0, value));

  const strokeDashoffset = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Animated.View>
        {/* SVG para el arco — usamos View + border como alternativa RN pura */}
        <View
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: backgroundColor,
            position: "absolute",
          }}
        />
      </Animated.View>
      {/* Label central */}
      {label && (
        <Text
          style={{
            color: labelColor,
            fontSize: size * 0.22,
            fontWeight: "700",
          }}
        >
          {label}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
    textAlign: "right",
  },
  track: {
    width: "100%",
    overflow: "hidden",
  },
  fill: {
    position: "absolute",
    left: 0,
    top: 0,
  },
});