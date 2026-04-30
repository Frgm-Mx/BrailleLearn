// ============================================================
// LearnScreen
// FIX: usa useSpeakWithSettings en vez de speak directo de helpers
// ============================================================
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, Animated,
} from "react-native";
import BrailleCell from "../components/BrailleCell";
import IndicatorSequence from "../components/IndicatorSequence";
import FeedbackModal from "../components/FeedbackModal";
import LoadingScreen from "./LoadingScreen";
import XPNotification from "../components/XPNotification";
import {
  INDICATORS, categories, describeChar, getCharData,
} from "../data/brailleAlphabet";
import { stopSpeaking, useSpeakWithSettings } from "../utils/helpers";
import { useSettings } from "../context/SettingsContext";
import { useProgress, XP_CONFIG } from "../context/ProgressContext";
import useBluetooth from "../utils/useBluetooth";
import BluetoothService from "../services/BluetoothService";

const MODES = [
  { key: "beginner",    emoji: "🌱", label: "Principiante",  desc: "Solo vocales — ideal para empezar",    color: "#0A7C5E" },
  { key: "lowercase",   emoji: "🔡", label: "Minúsculas",    desc: "Letras A–Z",                           color: "#1B3A6B" },
  { key: "uppercase",   emoji: "🔠", label: "Mayúsculas",    desc: "A–Z con indicador (puntos 4 y 6)",     color: "#0D7E8E" },
  { key: "numbers",     emoji: "🔢", label: "Números",       desc: "0–9 con indicador (puntos 3,4,5,6)",   color: "#5B2D8E" },
  { key: "punctuation", emoji: "✳️", label: "Puntuación",    desc: ", . ! ? - ' \" ( )",                  color: "#1B3A6B" },
  { key: "accented",    emoji: "áéí", label: "Acentos",      desc: "Á É Í Ó Ú Ü Ñ — patrón propio",       color: "#7C3A0A" },
  { key: "full",        emoji: "🌎", label: "Completo",      desc: "Todas las categorías combinadas",      color: "#1B3A6B" },
];

export default function LearnScreen({ navigation }) {
  // ── Hooks en el orden correcto: primero contexto, luego estado ──
  const { settings } = useSettings();
  const { addXP, recordAnswer, completeLesson } = useProgress();
  const speak = useSpeakWithSettings();

  const [mode, setMode]                 = useState(null);
  const [isLoading, setIsLoading]         = useState(false);
  const [selectedMode, setSelectedMode]   = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [letters, setLetters]           = useState([]);
  const [waitingInput, setWaitingInput] = useState(false);
  const [feedback, setFeedback]         = useState(null);
  const [score, setScore]               = useState({ correct: 0, total: 0 });
  const [showModal, setShowModal]       = useState(false);
  const [notification, setNotification] = useState(null);
  // { type: "xp", amount: 10 } | { type: "achievement", id: "first_letter" }

  const feedbackAnim   = useRef(new Animated.Value(0)).current;
  const scrollRef      = useRef(null);
  const isConnectedRef = useRef(false);
  const isMountedRef   = useRef(true);
  const timeoutRef     = useRef(null);  // FIX: cleanup del setTimeout de presentLetter

  const { isConnected } = useBluetooth({
    onButtonPress: ({ dots }) => {
      if (!waitingInput) return;
      const correct     = letters[currentIndex];
      const correctData = getCharData(correct);
      if (!correctData) { simulateDeviceInput(false); return; }
      const isRight = dots.length === correctData.dots.length &&
        correctData.dots.every((d) => dots.includes(d));
      simulateDeviceInput(isRight);
    },
  });

  useEffect(() => { isConnectedRef.current = isConnected; }, [isConnected]);

  useEffect(() => {
    isMountedRef.current = true;
    speak("¿Cómo quieres aprender hoy?");
    return () => {
      isMountedRef.current = false;
      clearTimeout(timeoutRef.current);
      stopSpeaking();
    };
  }, []);

  const selectMode = useCallback((selectedMode) => {
    const map = {
      beginner:    categories.vowels,
      lowercase:   categories.lowercase,
      uppercase:   categories.uppercase,
      numbers:     categories.numbers,
      punctuation: categories.punctuation,
      accented:    categories.accented,
      full:        categories.full,
      curious:     categories.full,
    };
    setMode(selectedMode);
    setLetters(map[selectedMode] || categories.full);
    setCurrentIndex(0);
    setScore({ correct: 0, total: 0 });
    setWaitingInput(false);
  }, []);

  const chooseMode = (modeKey) => {
    setSelectedMode(modeKey);
    setIsLoading(true);
  };

  const onLoadingFinish = () => {
    selectMode(selectedMode);
    setIsLoading(false);
    setSelectedMode(null);
  };

  useEffect(() => {
    if (!mode || letters.length === 0) return;
    presentLetter();
  }, [mode, currentIndex, letters]);

  const presentLetter = useCallback(() => {
    if (!isMountedRef.current || letters.length === 0) return;

    // FIX: cancela timeout anterior para no acumular llamadas
    clearTimeout(timeoutRef.current);

    const letter        = letters[currentIndex];
    const data          = getCharData(letter) || { dots: [], description: "Patrón no encontrado" };
    const isUppercase   = mode === "uppercase";
    const isNumbers     = mode === "numbers";
    const indicatorKey  = isUppercase ? "capital" : isNumbers ? "number" : null;
    const indicatorData = indicatorKey ? INDICATORS[indicatorKey] : null;

    scrollRef.current?.scrollTo({ y: 0, animated: true });

    timeoutRef.current = setTimeout(async () => {
      if (!isMountedRef.current) return;

      if (isConnectedRef.current) {
        if (indicatorData) {
          await BluetoothService.teachLetter(indicatorKey, indicatorData.dots, indicatorData.audio);
        }
        await BluetoothService.teachLetter(letter, data.dots, data.audio);
      }

      if (indicatorData) {
        speak(
          indicatorKey === "capital"
            ? `Mayúscula ${letter}. Primero el indicador: puntos 4 y 6. Luego la letra.`
            : `Número ${letter}. Primero el indicador numérico: puntos 3, 4, 5 y 6. Luego el número.`
        );
      } else {
        speak(describeChar(letter));
      }

      if (isMountedRef.current) setWaitingInput(true);
    }, 500);
  }, [letters, currentIndex, mode, speak]);

  const simulateDeviceInput = (correct) => {
    if (!waitingInput || !isMountedRef.current) return;
    setWaitingInput(false);
    correct ? handleCorrect() : handleWrong();
  };

  const handleCorrect = () => {
    if (!isMountedRef.current) return;
    setFeedback("correct");
    setScore((s) => ({ correct: s.correct + 1, total: s.total + 1 }));
    speak("¡Correcto! Muy bien.");
    animateFeedback();

    // XP + progreso
    const currentLetter = letters[currentIndex];
    const newAchievements = addXP(XP_CONFIG.correctAnswer);
    recordAnswer(currentLetter, true);

    // Muestra notificación
    if (newAchievements.length > 0) {
      setNotification({ type: "achievement", id: newAchievements[0] });
    } else {
      setNotification({ type: "xp", amount: XP_CONFIG.correctAnswer });
    }

    setTimeout(() => {
      if (!isMountedRef.current) return;
      setFeedback(null);
      if (currentIndex >= letters.length - 1) {
        const isPerfect = (score.correct + 1) === (score.total + 1);
        completeLesson(score.correct + 1, score.total + 1, isPerfect);
        speak("¡Felicidades! Terminaste todas las letras.");
        setTimeout(() => { if (isMountedRef.current) setShowModal(true); }, 1000);
      } else {
        setCurrentIndex((i) => i + 1);
      }
    }, 1500);
  };

  const handleWrong = () => {
    if (!isMountedRef.current) return;
    setFeedback("wrong");
    setScore((s) => ({ ...s, total: s.total + 1 }));
    recordAnswer(currentIndex < letters.length ? letters[currentIndex] : "", false);
    speak("Inténtalo de nuevo. " + describeChar(letters[currentIndex]));
    animateFeedback();
    setTimeout(() => {
      if (!isMountedRef.current) return;
      setFeedback(null);
      setWaitingInput(true);
    }, 2000);
  };

  const animateFeedback = () => {
    feedbackAnim.setValue(0);
    Animated.spring(feedbackAnim, {
      toValue: 1, useNativeDriver: true, tension: 100, friction: 6,
    }).start();
  };

  // Pantalla de carga entre selección y lección
  if (isLoading) {
    return (
      <LoadingScreen
        message="Preparando lección..."
        onFinish={onLoadingFinish}
        minDuration={4500}
      />
    );
  }

  // ── SELECCIÓN DE MODO ────────────────────────────────────────
  if (!mode) {
    return (
      <SafeAreaView style={styles.container}>
        {notification?.type === "xp" && (
          <XPNotification
            xp={notification.amount}
            onHide={() => setNotification(null)}
          />
        )}
        {notification?.type === "achievement" && (
          <XPNotification
            achievement={notification.id}
            onHide={() => setNotification(null)}
          />
        )}
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => { stopSpeaking(); navigation.goBack(); }}
          accessibilityLabel="Volver al inicio"
        >
          <Text style={styles.backText}>← Volver</Text>
        </TouchableOpacity>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modeScroll}>
          <Text style={styles.pageTitle}>¿Cómo quieres aprender?</Text>

          {MODES.map((opt) => (
            <TouchableOpacity
              key={opt.key}
              style={[styles.modeCard, { borderLeftColor: opt.color }]}
              onPress={() => chooseMode(opt.key)}
              accessibilityLabel={`${opt.label}. ${opt.desc}`}
            >
              <View style={[styles.modeIconBox, { backgroundColor: opt.color + "30" }]}>
                <Text style={styles.modeEmoji}>{opt.emoji}</Text>
              </View>
              <View style={styles.modeInfo}>
                <Text style={styles.modeTitle}>{opt.label}</Text>
                <Text style={styles.modeDesc}>{opt.desc}</Text>
              </View>
              <Text style={styles.modeArrow}>›</Text>
            </TouchableOpacity>
          ))}

          <View style={{ height: 24 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── PANTALLA DE LECCIÓN ──────────────────────────────────────
  const currentLetter = letters[currentIndex];
  const currentData   = getCharData(currentLetter) || { dots: [], description: "Patrón no encontrado" };
  const isUppercase   = mode === "uppercase";
  const isNumbers     = mode === "numbers";
  const indicatorKey  = isUppercase ? "capital" : isNumbers ? "number" : null;
  const indicatorData = indicatorKey ? INDICATORS[indicatorKey] : null;
  const progressPct   = ((currentIndex + 1) / letters.length) * 100;

  return (
    <SafeAreaView style={styles.container}>
      {notification?.type === "xp" && (
        <XPNotification
          xp={notification.amount}
          onHide={() => setNotification(null)}
        />
      )}
      {notification?.type === "achievement" && (
        <XPNotification
          achievement={notification.id}
          onHide={() => setNotification(null)}
        />
      )}

      {/* Header fijo */}
      <View style={styles.header}>
        {/* Volver → selección de modo (sin salir de la pantalla) */}
        <TouchableOpacity
          onPress={() => { stopSpeaking(); clearTimeout(timeoutRef.current); setMode(null); }}
          accessibilityLabel="Volver a selección de modo"
        >
          <Text style={styles.backText}>← Modos</Text>
        </TouchableOpacity>
        <Text style={styles.progress}>{currentIndex + 1} / {letters.length}</Text>
        <Text style={styles.scoreText}>✓ {score.correct}/{score.total}</Text>
      </View>

      {/* Barra de progreso */}
      <View style={styles.progressBarBg}>
        <View style={[styles.progressBarFill, { width: `${progressPct}%` }]} />
      </View>

      {/* Contenido scrollable */}
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.lessonScroll}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.letterDisplay}>{currentLetter}</Text>

        <View style={styles.modePill}>
          <Text style={styles.modePillText}>
            {MODES.find((m) => m.key === mode)?.label ?? mode}
          </Text>
        </View>

        {/* Secuencia indicador + letra */}
        {indicatorData ? (
          <IndicatorSequence
            indicatorKey={indicatorKey}
            indicatorData={indicatorData}
            letterChar={currentLetter}
            letterData={currentData}
            feedbackAnim={feedbackAnim}
          />
        ) : (
          <>
            <Animated.View style={{
              transform: [{ scale: feedbackAnim.interpolate({
                inputRange: [0, 0.5, 1], outputRange: [1, 1.05, 1],
              }) }],
            }}>
              <BrailleCell
                activeDots={currentData.dots}
                size="large"
                showLabels={settings.showDotLabels}
              />
            </Animated.View>

            <View style={styles.dotRow}>
              {currentData.dots.length > 0
                ? currentData.dots.map((dot) => (
                    <View key={dot} style={styles.dotChip}>
                      <Text style={styles.dotChipText}>{dot}</Text>
                    </View>
                  ))
                : <Text style={styles.noDotsLabel}>Sin puntos (espacio)</Text>
              }
            </View>

            <Text style={styles.description}>{currentData.description}</Text>
          </>
        )}

        {/* Estado */}
        <View style={[
          styles.statusBadge,
          feedback === "correct" && styles.statusCorrect,
          feedback === "wrong"   && styles.statusWrong,
          !feedback              && styles.statusWaiting,
        ]}
          accessible
          accessibilityLiveRegion="polite"
        >
          <Text style={styles.statusText}>
            {feedback === "correct" ? "¡Correcto! 🎉"
              : feedback === "wrong"   ? "Inténtalo de nuevo 🔄"
              : waitingInput           ? "Esperando tu respuesta..."
              : "Preparando..."}
          </Text>
        </View>

        {/* Botones */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.btnRepeat}
            onPress={() => speak(describeChar(currentLetter))}
            accessibilityLabel="Repetir instrucción"
          >
            <Text style={styles.btnIcon}>🔊</Text>
            <Text style={styles.btnLabel}>Repetir</Text>
          </TouchableOpacity>

          {currentIndex > 0 && (
            <TouchableOpacity
              style={styles.btnPrev}
              onPress={() => {
                stopSpeaking();
                clearTimeout(timeoutRef.current);
                setCurrentIndex((i) => i - 1);
              }}
              accessibilityLabel="Letra anterior"
            >
              <Text style={styles.btnIcon}>←</Text>
              <Text style={styles.btnLabel}>Anterior</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Simulación */}
        {!isConnected && (
          <View style={styles.simBox}>
            <Text style={styles.simLabel}>Simulación — sin dispositivo físico</Text>
            <View style={styles.simRow}>
              <TouchableOpacity style={styles.btnCorrect} onPress={() => simulateDeviceInput(true)}>
                <Text style={styles.btnText}>✓ Correcto</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnWrong} onPress={() => simulateDeviceInput(false)}>
                <Text style={styles.btnText}>✗ Incorrecto</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {isConnected && (
          <View style={styles.deviceBadge}>
            <View style={styles.deviceDot} />
            <Text style={styles.deviceText}>Dispositivo conectado — usa los botones físicos</Text>
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>

      <FeedbackModal
        visible={showModal}
        score={score.correct}
        total={score.total}
        mode={mode}
        xpEarned={score.correct * XP_CONFIG.correctAnswer + XP_CONFIG.lessonComplete}
        onRepeat={() => {
          setShowModal(false);
          setCurrentIndex(0);
          setScore({ correct: 0, total: 0 });
          setTimeout(() => presentLetter(), 400);
        }}
        onContinue={() => {
          const isPerfect = score.correct === score.total;
          completeLesson(score.correct, score.total, isPerfect);
          setShowModal(false);
          if (mode === "beginner") {
            speak("¡Muy bien! Ahora prueba con todo el abecedario.");
            selectMode("full");  // FIX: "curious" → "full" que sí existe en el mapa
          } else {
            navigation.navigate("Practice");
          }
        }}
        onHome={() => {
          setShowModal(false);
          stopSpeaking();
          navigation.navigate("Home");
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A1628", paddingHorizontal: 24 },
  backBtn:   { marginTop: 16 },
  backText:  { color: "#C8D8E8", fontSize: 16 },

  modeScroll: { paddingTop: 8 },
  pageTitle: {
    fontSize: 26, fontWeight: "800", color: "#FFFFFF",
    marginTop: 28, marginBottom: 24,
  },
  modeCard: {
    backgroundColor: "#111E30", borderRadius: 14, padding: 16,
    flexDirection: "row", alignItems: "center", marginBottom: 12,
    borderLeftWidth: 4, borderWidth: 1, borderColor: "#1E3A5F",
  },
  modeIconBox: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: "center", justifyContent: "center", marginRight: 14,
  },
  modeEmoji: { fontSize: 22 },
  modeInfo:  { flex: 1 },
  modeTitle: { fontSize: 16, fontWeight: "700", color: "#FFFFFF", marginBottom: 2 },
  modeDesc:  { fontSize: 12, color: "#64748B", lineHeight: 18 },
  modeArrow: { fontSize: 22, color: "#F5A623", fontWeight: "300" },

  header: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", marginTop: 16, marginBottom: 10,
  },
  progress:  { color: "#C8D8E8", fontSize: 14 },
  scoreText: { color: "#F5A623", fontSize: 14, fontWeight: "700" },
  progressBarBg: {
    height: 5, backgroundColor: "#1E3A5F", borderRadius: 3, marginBottom: 4,
  },
  progressBarFill: { height: 5, backgroundColor: "#F5A623", borderRadius: 3 },

  lessonScroll: { alignItems: "center", paddingTop: 8 },
  letterDisplay: {
    fontSize: 88, fontWeight: "900", color: "#FFFFFF",
    textAlign: "center", marginBottom: 8,
  },
  modePill: {
    backgroundColor: "#1B3A6B", borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 5, marginBottom: 20,
  },
  modePillText: { color: "#C8D8E8", fontSize: 12, fontWeight: "600" },

  dotRow: {
    flexDirection: "row", gap: 6, marginTop: 12,
    justifyContent: "center", flexWrap: "wrap",
  },
  dotChip: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: "#F5A62330", borderWidth: 1.5,
    borderColor: "#F5A623", alignItems: "center", justifyContent: "center",
  },
  dotChipText:  { color: "#F5A623", fontSize: 12, fontWeight: "700" },
  noDotsLabel:  { fontSize: 12, color: "#64748B" },
  description: {
    fontSize: 14, color: "#C8D8E8", textAlign: "center",
    marginTop: 12, marginBottom: 4, lineHeight: 22, paddingHorizontal: 8,
  },

  statusBadge: {
    width: "100%", borderRadius: 12, padding: 14,
    marginTop: 16, marginBottom: 12, alignItems: "center",
  },
  statusWaiting: { backgroundColor: "#1B3A6B" },
  statusCorrect: { backgroundColor: "#0A7C5E" },
  statusWrong:   { backgroundColor: "#7C1A0A" },
  statusText: { color: "#FFFFFF", fontSize: 15, fontWeight: "600" },

  actionsRow: { flexDirection: "row", gap: 10, marginBottom: 16, width: "100%" },
  btnRepeat: {
    flex: 1, backgroundColor: "#1B3A6B", borderRadius: 12,
    paddingVertical: 12, flexDirection: "row",
    alignItems: "center", justifyContent: "center", gap: 6,
  },
  btnPrev: {
    flex: 1, backgroundColor: "#0D1F35", borderRadius: 12,
    paddingVertical: 12, borderWidth: 1, borderColor: "#1E3A5F",
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
  },
  btnIcon:  { fontSize: 16 },
  btnLabel: { color: "#FFFFFF", fontSize: 14, fontWeight: "600" },

  simBox: {
    backgroundColor: "#0D1F35", borderRadius: 12, padding: 16,
    marginBottom: 12, width: "100%",
    borderWidth: 1, borderColor: "#1E3A5F",
  },
  simLabel: { color: "#64748B", fontSize: 11, marginBottom: 10, textAlign: "center" },
  simRow:   { flexDirection: "row", gap: 10, justifyContent: "center" },
  btnCorrect: {
    backgroundColor: "#0A7C5E", borderRadius: 10,
    paddingVertical: 10, paddingHorizontal: 22,
  },
  btnWrong: {
    backgroundColor: "#7C1A0A", borderRadius: 10,
    paddingVertical: 10, paddingHorizontal: 22,
  },
  btnText: { color: "#FFFFFF", fontWeight: "700", fontSize: 14 },

  deviceBadge: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#0A1F15", borderRadius: 12, padding: 14,
    marginBottom: 12, width: "100%",
    borderWidth: 1, borderColor: "#0A7C5E40",
  },
  deviceDot:  { width: 8, height: 8, borderRadius: 4, backgroundColor: "#0A7C5E" },
  deviceText: { color: "#C8D8E8", fontSize: 13, flex: 1 },
});