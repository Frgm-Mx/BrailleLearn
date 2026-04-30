// ============================================================
// LoadingScreen — pantalla de carga con datos curiosos animada
// Props:
//   message     string     — texto de carga (opcional)
//   onFinish    function   — callback cuando termina la animación
//   minDuration number     — duración mínima en ms (default 2500)
// ============================================================
import React, { useEffect, useRef, useState } from "react";
import {
  View, Text, Animated, StyleSheet,
  Dimensions, TouchableOpacity,
} from "react-native";
import { getRandomFact, FACT_TYPES } from "../data/brailleFacts";

const { width } = Dimensions.get("window");

// Celda Braille animada decorativa
function AnimatedBrailleCell({ dots, color }) {
  const anims = useRef([1,2,3,4,5,6].map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const animations = anims.map((anim, i) => {
      const isDot = dots.includes(i + 1);
      return Animated.sequence([
        Animated.delay(i * 80),
        Animated.spring(anim, {
          toValue: isDot ? 1 : 0.3,
          useNativeDriver: true,
          tension: 120,
          friction: 6,
        }),
      ]);
    });
    Animated.parallel(animations).start();
  }, [dots]);

  return (
    <View style={styles.brailleCell}>
      {[1,4,2,5,3,6].map((dot, i) => {
        const isActive = dots.includes(dot);
        return (
          <Animated.View
            key={dot}
            style={[
              styles.brailleDot,
              {
                backgroundColor: isActive ? color : "#1E3A5F",
                transform: [{ scale: anims[dot - 1] }],
                shadowColor: isActive ? color : "transparent",
                shadowOpacity: isActive ? 0.8 : 0,
                shadowRadius: 6,
                elevation: isActive ? 4 : 0,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

export default function LoadingScreen({
  message = "Cargando...",
  onFinish,
  minDuration = 4500,
}) {
  const [fact]          = useState(() => getRandomFact());
  const [showDetail, setShowDetail] = useState(false);

  // Animaciones
  const fadeIn          = useRef(new Animated.Value(0)).current;
  const slideUp         = useRef(new Animated.Value(30)).current;
  const progressAnim    = useRef(new Animated.Value(0)).current;
  const logoScale       = useRef(new Animated.Value(0.8)).current;
  const dotPulse        = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Secuencia de entrada
    Animated.parallel([
      Animated.timing(fadeIn, {
        toValue: 1, duration: 600, useNativeDriver: true,
      }),
      Animated.spring(slideUp, {
        toValue: 0, tension: 80, friction: 8, useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1, tension: 100, friction: 6, useNativeDriver: true,
      }),
    ]).start();

    // Barra de progreso
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: minDuration - 400,
      useNativeDriver: false,
    }).start();

    // Pulso de los puntos de carga
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(dotPulse, { toValue: 0.4, duration: 600, useNativeDriver: true }),
        Animated.timing(dotPulse, { toValue: 1.0, duration: 600, useNativeDriver: true }),
      ])
    );
    pulse.start();

    // Finaliza después de la duración mínima
    const timer = setTimeout(() => {
      Animated.timing(fadeIn, {
        toValue: 0, duration: 400, useNativeDriver: true,
      }).start(() => onFinish?.());
      pulse.stop();
    }, minDuration);

    return () => {
      clearTimeout(timer);
      pulse.stop();
    };
  }, []);

  const typeInfo = FACT_TYPES[fact.type];

  return (
    <Animated.View style={[styles.container, { opacity: fadeIn }]}>

      {/* Logo animado */}
      <Animated.View style={[
        styles.logoContainer,
        { transform: [{ scale: logoScale }] },
      ]}>
        <AnimatedBrailleCell
          dots={fact.id % 2 === 0 ? [1, 2] : [1, 4, 5]}
          color={fact.color}
        />
        <Text style={styles.logoText}>BRAILLE</Text>
        <Text style={styles.logoSub}>Aprende a tu ritmo</Text>
      </Animated.View>

      {/* Tarjeta del dato curioso */}
      <Animated.View style={[
        styles.factCard,
        { transform: [{ translateY: slideUp }] },
      ]}>
        {/* Badge de tipo */}
        <View style={[styles.typeBadge, { backgroundColor: fact.color + "30", borderColor: fact.color + "60" }]}>
          <Text style={[styles.typeText, { color: fact.color }]}>
            {fact.emoji}  {typeInfo?.label ?? "Dato"}
          </Text>
        </View>

        {/* Dato principal */}
        <Text style={styles.factText}>{fact.fact}</Text>

        {/* Detalle expandible */}
        {showDetail ? (
          <Text style={styles.detailText}>{fact.detail}</Text>
        ) : (
          <TouchableOpacity
            onPress={() => setShowDetail(true)}
            accessibilityLabel="Ver más detalles"
          >
            <Text style={styles.showMoreText}>Ver más  ›</Text>
          </TouchableOpacity>
        )}
      </Animated.View>

      {/* Barra de progreso */}
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0%", "100%"],
                }),
                backgroundColor: fact.color,
              },
            ]}
          />
        </View>
        <Animated.Text style={[styles.loadingText, { opacity: dotPulse }]}>
          {message}
        </Animated.Text>
      </View>

    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A1628",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 60,
    paddingHorizontal: 28,
  },
  logoContainer: {
    alignItems: "center",
    gap: 16,
  },
  brailleCell: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: 72,
    gap: 10,
  },
  brailleDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  logoText: {
    fontSize: 36,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 8,
  },
  logoSub: {
    fontSize: 13,
    color: "#64748B",
    letterSpacing: 1,
  },
  factCard: {
    width: "100%",
    backgroundColor: "#111E30",
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: "#1E3A5F",
    gap: 14,
  },
  typeBadge: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  typeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  factText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    lineHeight: 26,
  },
  detailText: {
    fontSize: 14,
    color: "#C8D8E8",
    lineHeight: 22,
  },
  showMoreText: {
    fontSize: 13,
    color: "#F5A623",
    fontWeight: "600",
  },
  progressContainer: {
    width: "100%",
    gap: 10,
    alignItems: "center",
  },
  progressTrack: {
    width: "100%",
    height: 4,
    backgroundColor: "#1E3A5F",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
  },
  loadingText: {
    fontSize: 12,
    color: "#64748B",
    letterSpacing: 1,
  },
});