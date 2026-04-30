// ============================================================
// PracticeScreen — FIX: lee roundTime de Settings, fix race condition timer
// ============================================================
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, Animated,
} from "react-native";
import BrailleCell from "../components/BrailleCell";
import FeedbackModal from "../components/FeedbackModal";
import LoadingScreen from "./LoadingScreen";
import XPNotification from "../components/XPNotification";
import {
  brailleAlphabet, brailleNumbers, braillePunctuation,
  brailleAccented, categories,
} from "../data/brailleAlphabet";
import { stopSpeaking } from "../utils/helpers";
import { useSpeakWithSettings } from "../utils/helpers";
import { useSettings } from "../context/SettingsContext";
import { useProgress, XP_CONFIG } from "../context/ProgressContext";
import useBluetooth from "../utils/useBluetooth";
import BluetoothService from "../services/BluetoothService";

const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);
const TOTAL_ROUNDS = 10;

const MODE_LABELS = {
  vowels: "Vocales", consonants: "Consonantes", lowercase: "Minúsculas",
  uppercase: "Mayúsculas", numbers: "Números", accented: "Acentuadas",
  punctuation: "Puntuación", all: "Todo", full: "Completo",
};

export default function PracticeScreen({ navigation }) {
  const { settings } = useSettings();
  const { addXP, recordAnswer, completeLesson } = useProgress();
  const speak = useSpeakWithSettings();

  // roundTime viene de ajustes como número (5|10|15|20)
  const ROUND_TIME = settings.roundTime ?? 10;

  const [phase, setPhase]               = useState("config");
  const [isLoading, setIsLoading]         = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [category, setCategory]         = useState(null);
  const [queue, setQueue]               = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [options, setOptions]           = useState([]);
  const [selected, setSelected]         = useState(null);
  const [score, setScore]               = useState({ correct: 0, total: 0 });
  const [showModal, setShowModal]       = useState(false);
  const [notification, setNotification] = useState(null);
  const [streak, setStreak]             = useState(0);
  const [timeLeft, setTimeLeft]         = useState(ROUND_TIME);

  const timerRef     = useRef(null);
  const shakeAnim    = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(1)).current;
  const isMountedRef = useRef(true);
  // FIX race condition: ref que indica si la ronda ya fue resuelta
  const roundDoneRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      clearInterval(timerRef.current);
      stopSpeaking();
    };
  }, []);

  const startSession = (selectedCategory) => {
    setCategory(selectedCategory);
    const poolMap = {
      vowels: categories.vowels, consonants: categories.consonants,
      lowercase: categories.lowercase, uppercase: categories.uppercase,
      numbers: categories.numbers, accented: categories.accented,
      punctuation: categories.punctuation, all: categories.all, full: categories.full,
    };
    const pool = poolMap[selectedCategory] || categories.all;
    setQueue(shuffle(pool).slice(0, TOTAL_ROUNDS));
    setCurrentIndex(0);
    setScore({ correct: 0, total: 0 });
    setStreak(0);
    setPhase("playing");
  };

  const chooseCategory = (catKey) => {
    setSelectedCategory(catKey);
    setIsLoading(true);
  };

  const onLoadingFinish = () => {
    startSession(selectedCategory);
    setIsLoading(false);
    setSelectedCategory(null);
  };

  const generateOptions = useCallback((correctLetter, pool) => {
    const fallbackPool = pool.length >= 4 ? pool : [...new Set([...pool, ...categories.all])];
    const distractors  = shuffle(fallbackPool.filter((l) => l !== correctLetter)).slice(0, 3);
    return shuffle([correctLetter, ...distractors]);
  }, []);

  useEffect(() => {
    if (phase !== "playing" || queue.length === 0) return;
    roundDoneRef.current = false;
    const letter = queue[currentIndex];
    setOptions(generateOptions(letter, categories[category] || categories.all));
    setSelected(null);
    startTimer();
    speak("Identifica el patrón Braille.");
  }, [currentIndex, phase, queue]);

  const startTimer = () => {
    clearInterval(timerRef.current);
    if (!isMountedRef.current) return;
    setTimeLeft(ROUND_TIME);
    progressAnim.setValue(1);
    Animated.timing(progressAnim, {
      toValue: 0, duration: ROUND_TIME * 1000, useNativeDriver: false,
    }).start();

    timerRef.current = setInterval(() => {
      if (!isMountedRef.current) { clearInterval(timerRef.current); return; }
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          // FIX race condition: solo procesa si la ronda no está resuelta
          if (!roundDoneRef.current) {
            roundDoneRef.current = true;
            const correct = queue[currentIndex];
            speak(`Tiempo agotado. Era ${correct}.`);
            setStreak(0);
            setScore((s) => ({ ...s, total: s.total + 1 }));
            setSelected("TIMEOUT");
            setTimeout(() => { if (isMountedRef.current) advanceOrFinish(); }, 2000);
          }
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  };

  const handleAnswer = useCallback((letter) => {
    // FIX: doble protección — selected Y roundDoneRef
    if (selected !== null || roundDoneRef.current || !isMountedRef.current) return;
    roundDoneRef.current = true;
    clearInterval(timerRef.current);
    setSelected(letter);

    const correct = queue[currentIndex];
    const isRight = letter === correct;

    if (isRight) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      setScore((s) => ({ correct: s.correct + 1, total: s.total + 1 }));

      // Bonus XP por racha
      const streakBonus = newStreak >= 3 ? XP_CONFIG.streakBonus * newStreak : 0;
      const totalXP     = XP_CONFIG.correctAnswer + streakBonus;

      const streakMsg = newStreak >= 3 ? `¡${newStreak} en racha! ` : "";
      speak(`${streakMsg}¡Correcto! Letra ${correct}.`);
      if (isConnected) BluetoothService.feedbackCorrect();

      const newAchievements = addXP(totalXP);
      recordAnswer(correct, true);

      if (newAchievements.length > 0) {
        setNotification({ type: "achievement", id: newAchievements[0] });
      } else {
        setNotification({ type: "xp", amount: totalXP });
      }
    } else {
      setStreak(0);
      setScore((s) => ({ ...s, total: s.total + 1 }));
      speak(`Incorrecto. Era ${correct}.`);
      triggerShake();
      if (isConnected) BluetoothService.feedbackWrong();
      recordAnswer(correct, false);
    }
    setTimeout(() => { if (isMountedRef.current) advanceOrFinish(); }, 1800);
  }, [selected, queue, currentIndex, streak, addXP, recordAnswer]);

  const advanceOrFinish = () => {
    if (!isMountedRef.current) return;
    if (currentIndex >= queue.length - 1) {
      setPhase("finished");
      setTimeout(() => { if (isMountedRef.current) setShowModal(true); }, 600);
    } else {
      setCurrentIndex((i) => i + 1);
    }
  };

  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6,   duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,   duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const { isConnected } = useBluetooth({
    onButtonPress: useCallback(({ dots }) => {
      if (phase !== "playing" || selected !== null || roundDoneRef.current) return;
      const dotsStr = [...dots].sort().join(",");
      const allData = { ...brailleAlphabet, ...brailleNumbers, ...braillePunctuation, ...brailleAccented };
      const match = Object.entries(allData).find(([, d]) => [...d.dots].sort().join(",") === dotsStr);
      if (match && options.includes(match[0])) handleAnswer(match[0]);
    }, [phase, selected, options, handleAnswer]),
  });

  useEffect(() => {
    if (phase !== "playing" || queue.length === 0 || !isConnected) return;
    const letter = queue[currentIndex];
    const data = brailleAlphabet[letter] || brailleNumbers[letter] || brailleAccented[letter];
    if (data) BluetoothService.showPattern(data.dots);
  }, [currentIndex, phase, isConnected]);

  // Pantalla de carga entre selección y práctica
  if (isLoading) {
    return (
      <LoadingScreen
        message="Preparando práctica..."
        onFinish={onLoadingFinish}
        minDuration={4500}
      />
    );
  }

  // ── CONFIG ──
  if (phase === "config") {
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
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Volver</Text>
        </TouchableOpacity>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.configScroll}>
          <Text style={styles.title}>Práctica</Text>
          <Text style={styles.subtitle}>El dispositivo muestra el patrón. Tú identificas la letra.</Text>

          {[
            { key: "vowels",      emoji: "🔤", label: "Vocales",      desc: "A, E, I, O, U" },
            { key: "lowercase",   emoji: "🔡", label: "Minúsculas",   desc: "A–Z" },
            { key: "uppercase",   emoji: "🔠", label: "Mayúsculas",   desc: "A–Z con indicador" },
            { key: "numbers",     emoji: "🔢", label: "Números",      desc: "0–9 con indicador" },
            { key: "punctuation", emoji: "✳️", label: "Puntuación",   desc: ", . ! ? - \" ( )" },
            { key: "accented",    emoji: "áéí", label: "Acentuadas",  desc: "Á É Í Ó Ú Ü Ñ" },
            { key: "full",        emoji: "🌎", label: "Completo",     desc: "Todo combinado" },
          ].map((opt) => (
            <TouchableOpacity
              key={opt.key} style={styles.optCard}
              onPress={() => chooseCategory(opt.key)}
              accessibilityLabel={`${opt.label}. ${opt.desc}`}
            >
              <Text style={styles.optEmoji}>{opt.emoji}</Text>
              <View style={styles.optText}>
                <Text style={styles.optLabel}>{opt.label}</Text>
                <Text style={styles.optDesc}>{opt.desc}</Text>
              </View>
              <Text style={styles.optArrow}>›</Text>
            </TouchableOpacity>
          ))}

          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              ⏱  {ROUND_TIME} seg por pregunta  ·  🎯  {TOTAL_ROUNDS} letras por sesión{"\n"}
              🔥  Construye rachas de aciertos consecutivos
            </Text>
            <View style={styles.deviceRow}>
              <View style={[styles.deviceDot, { backgroundColor: isConnected ? "#0A7C5E" : "#7C1A0A" }]} />
              <Text style={styles.deviceLabel}>
                {isConnected ? "Dispositivo conectado" : "Sin dispositivo — modo simulación"}
              </Text>
            </View>
          </View>
          <View style={{ height: 24 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── JUEGO ──
  const currentLetter = queue[currentIndex];
  const currentData   =
    brailleAlphabet[currentLetter]    || brailleNumbers[currentLetter] ||
    brailleAccented[currentLetter]    || braillePunctuation[currentLetter] || null;
  if (!currentData) return null;

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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => { clearInterval(timerRef.current); stopSpeaking(); setPhase("config"); }}>
          <Text style={styles.backText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.roundText}>{currentIndex + 1} / {queue.length}</Text>
        <View style={styles.streakBadge}>
          <Text style={styles.streakText}>{streak >= 2 ? `🔥 ${streak}` : `✓ ${score.correct}`}</Text>
        </View>
      </View>

      <Animated.View style={[styles.timerBar, {
        width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }),
        backgroundColor: progressAnim.interpolate({ inputRange: [0, 0.3, 1], outputRange: ["#7C1A0A", "#F5A623", "#0D7E8E"] }),
      }]} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.playScroll} scrollEnabled={false}>
        <Text style={[styles.timerNum, timeLeft <= 3 && styles.timerUrgent]}>{timeLeft}s</Text>
        <Text style={styles.instruction}>¿Qué letra es este patrón?</Text>

        <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
          <BrailleCell
            activeDots={currentData.dots}
            size="large"
            showLabels={settings.showDotLabels}
          />
        </Animated.View>

        <View style={styles.optionsGrid}>
          {options.map((letter) => {
            const isSelected = selected === letter;
            const isCorrect  = letter === currentLetter;
            const isTimeout  = selected === "TIMEOUT";
            let btnStyle = {};
            if (selected !== null) {
              if (isCorrect)       btnStyle = styles.optCorrect;
              else if (isSelected) btnStyle = styles.optWrong;
            }
            return (
              <TouchableOpacity
                key={letter} style={[styles.optBtn, btnStyle]}
                onPress={() => handleAnswer(letter)}
                disabled={selected !== null}
                accessibilityLabel={`Letra ${letter}`}
              >
                <Text style={styles.optText}>{letter}</Text>
                {selected !== null && isCorrect  && <Text style={styles.optMark}>✓</Text>}
                {isSelected && !isCorrect         && <Text style={styles.optMark}>✗</Text>}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <FeedbackModal
        visible={showModal}
        score={score.correct}
        total={score.total}
        mode={category}
        onRepeat={() => { setShowModal(false); startSession(category); }}
        onContinue={() => { 
          const isPerfect = score.correct === score.total;
          completeLesson(score.correct, score.total, isPerfect);
          setShowModal(false); 
          stopSpeaking(); 
          navigation.navigate("Game");
        }}
        onHome={() => { setShowModal(false); stopSpeaking(); navigation.navigate("Home"); }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: "#0A1628", paddingHorizontal: 24 },
  backBtn:     { marginTop: 16 },
  backText:    { color: "#C8D8E8", fontSize: 16 },
  configScroll:{ paddingTop: 8 },
  title:       { fontSize: 28, fontWeight: "900", color: "#FFFFFF", marginTop: 24, marginBottom: 8 },
  subtitle:    { fontSize: 14, color: "#C8D8E8", lineHeight: 22, marginBottom: 28 },
  optCard: {
    backgroundColor: "#111E30", borderRadius: 14, padding: 16,
    flexDirection: "row", alignItems: "center", marginBottom: 10,
    borderWidth: 1, borderColor: "#1E3A5F",
  },
  optEmoji: { fontSize: 26, marginRight: 14 },
  optText:  { flex: 1 },
  optLabel: { fontSize: 16, fontWeight: "700", color: "#FFFFFF" },
  optDesc:  { fontSize: 12, color: "#64748B", marginTop: 2 },
  optArrow: { fontSize: 22, color: "#F5A623" },
  infoBox:  { backgroundColor: "#0D1F35", borderRadius: 12, padding: 16, marginTop: 8, borderWidth: 1, borderColor: "#1E3A5F" },
  infoText: { color: "#64748B", fontSize: 13, lineHeight: 22, marginBottom: 12 },
  deviceRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  deviceDot: { width: 8, height: 8, borderRadius: 4 },
  deviceLabel: { color: "#C8D8E8", fontSize: 12 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 16, marginBottom: 8 },
  roundText: { color: "#C8D8E8", fontSize: 14 },
  streakBadge: { backgroundColor: "#1B3A6B", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  streakText: { color: "#F5A623", fontWeight: "700", fontSize: 14 },
  timerBar: { height: 5, borderRadius: 3, marginBottom: 4 },
  playScroll: { alignItems: "center", paddingTop: 4 },
  timerNum: { color: "#64748B", fontSize: 13, alignSelf: "flex-end", marginBottom: 12 },
  timerUrgent: { color: "#F5A623", fontWeight: "700" },
  instruction: { fontSize: 18, fontWeight: "700", color: "#FFFFFF", textAlign: "center", marginBottom: 24 },
  optionsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 28, justifyContent: "center", width: "100%" },
  optBtn: { width: "45%", backgroundColor: "#1B3A6B", borderRadius: 14, paddingVertical: 20, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 6 },
  optCorrect: { backgroundColor: "#0A7C5E" },
  optWrong:   { backgroundColor: "#7C1A0A" },
  optText:    { fontSize: 32, fontWeight: "900", color: "#FFFFFF" },
  optMark:    { fontSize: 18, color: "#FFFFFF" },
});