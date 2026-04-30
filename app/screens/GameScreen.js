// ============================================================
// GameScreen — FIX: lee roundTime de Settings
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
import { brailleAlphabet, categories } from "../data/brailleAlphabet";
import { stopSpeaking } from "../utils/helpers";
import { useSpeakWithSettings } from "../utils/helpers";
import { useSettings } from "../context/SettingsContext";
import { useProgress, XP_CONFIG } from "../context/ProgressContext";
import useBluetooth from "../utils/useBluetooth";
import BluetoothService from "../services/BluetoothService";

const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);
const TOTAL_ROUNDS = 8;

const AI_PROFILES = {
  easy:   { name: "🤖 Fácil",   reactionMs: 5000, accuracy: 0.50 },
  medium: { name: "🤖 Medio",   reactionMs: 3000, accuracy: 0.75 },
  hard:   { name: "🤖 Difícil", reactionMs: 1500, accuracy: 0.92 },
};

export default function GameScreen({ navigation }) {
  const { settings } = useSettings();
  const { completeGame, addXP } = useProgress();
  const speak = useSpeakWithSettings();
  // FIX: ROUND_TIME viene de ajustes
  const ROUND_TIME = settings.roundTime ?? 8;

  const [phase, setPhase]                 = useState("config");
  const [isLoading, setIsLoading]         = useState(false);
  const [selectedGameMode, setSelectedGameMode] = useState(null);
  const [selectedAiDiff, setSelectedAiDiff] = useState(null);
  const [gameMode, setGameMode]           = useState(null);
  const [aiDifficulty, setAiDiff]         = useState(null);
  const [queue, setQueue]                 = useState([]);
  const [currentIndex, setCurrentIndex]   = useState(0);
  const [playerScore, setPlayerScore]     = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [selected, setSelected]           = useState(null);
  const [opponentSelected, setOpponentSelected] = useState(null);
  const [options, setOptions]             = useState([]);
  const [timeLeft, setTimeLeft]           = useState(ROUND_TIME);
  const [countdown, setCountdown]         = useState(3);
  const [roundResult, setRoundResult]     = useState(null);
  const [showModal, setShowModal]         = useState(false);
  const [notification, setNotification]   = useState(null);
  const [currentPlayer, setCurrentPlayer] = useState(1);

  const timerRef     = useRef(null);
  const aiTimerRef   = useRef(null);
  const progressAnim = useRef(new Animated.Value(1)).current;
  const scoreAnim    = useRef(new Animated.Value(1)).current;
  const isMountedRef = useRef(true);
  const roundDoneRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      clearInterval(timerRef.current);
      clearTimeout(aiTimerRef.current);
      stopSpeaking();
    };
  }, []);

  const startGame = (mode, difficulty = null) => {
    setGameMode(mode);
    setAiDiff(difficulty);
    setQueue(shuffle(categories.all).slice(0, TOTAL_ROUNDS));
    setCurrentIndex(0);
    setPlayerScore(0);
    setOpponentScore(0);
    setPhase("countdown");
    let count = 3;
    setCountdown(count);
    const iv = setInterval(() => {
      if (!isMountedRef.current) { clearInterval(iv); return; }
      count--;
      if (count <= 0) { clearInterval(iv); setPhase("playing"); }
      else setCountdown(count);
    }, 1000);
  };

  const chooseGame = (mode, diff = null) => {
    setSelectedGameMode(mode);
    setSelectedAiDiff(diff);
    setIsLoading(true);
  };

  const onLoadingFinish = () => {
    startGame(selectedGameMode, selectedAiDiff);
    setIsLoading(false);
    setSelectedGameMode(null);
    setSelectedAiDiff(null);
  };

  useEffect(() => {
    if (phase !== "playing" || queue.length === 0) return;
    roundDoneRef.current = false;
    const letter  = queue[currentIndex];
    const newOpts = generateOptions(letter);
    setOptions(newOpts);
    setSelected(null);
    setOpponentSelected(null);
    setRoundResult(null);
    setCurrentPlayer(1);
    startRoundTimer();
    if (gameMode === "ai" && aiDifficulty) scheduleAiResponse(letter, newOpts);
  }, [currentIndex, phase]);

  const generateOptions = (correctLetter) => {
    const distractors = shuffle(categories.all.filter((l) => l !== correctLetter)).slice(0, 3);
    return shuffle([correctLetter, ...distractors]);
  };

  const startRoundTimer = () => {
    clearInterval(timerRef.current);
    if (!isMountedRef.current) return;
    setTimeLeft(ROUND_TIME);
    progressAnim.setValue(1);
    Animated.timing(progressAnim, { toValue: 0, duration: ROUND_TIME * 1000, useNativeDriver: false }).start();
    timerRef.current = setInterval(() => {
      if (!isMountedRef.current) { clearInterval(timerRef.current); return; }
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          if (!roundDoneRef.current) {
            roundDoneRef.current = true;
            setOpponentSelected((os) => { handleRoundEnd(null, os); return os; });
          }
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  };

  const scheduleAiResponse = (correctLetter, opts) => {
    clearTimeout(aiTimerRef.current);
    const profile  = AI_PROFILES[aiDifficulty];
    const isRight  = Math.random() < profile.accuracy;
    const aiAnswer = isRight ? correctLetter : shuffle(opts.filter((o) => o !== correctLetter))[0];
    aiTimerRef.current = setTimeout(() => {
      if (isMountedRef.current) setOpponentSelected(aiAnswer);
    }, profile.reactionMs);
  };

  const { isConnected } = useBluetooth({
    onButtonPress: useCallback(({ dots }) => {
      if (phase !== "playing" || roundResult !== null || roundDoneRef.current) return;
      const dotsStr = [...dots].sort().join(",");
      const match   = Object.entries(brailleAlphabet).find(([, d]) => [...d.dots].sort().join(",") === dotsStr);
      if (match && options.includes(match[0])) handlePlayerAnswer(match[0]);
    }, [phase, roundResult, options]),
  });

  useEffect(() => {
    if (phase !== "playing" || queue.length === 0 || !isConnected) return;
    const data = brailleAlphabet[queue[currentIndex]];
    if (data) BluetoothService.showPattern(data.dots);
  }, [currentIndex, phase, isConnected]);

  useEffect(() => {
    return () => { if (isConnected) BluetoothService.resetServos(); };
  }, []);

  const handlePlayerAnswer = (letter) => {
    if (selected !== null || roundDoneRef.current || !isMountedRef.current) return;

    if (gameMode === "local" && currentPlayer === 1) {
      setSelected(letter);
      setCurrentPlayer(2);
      speak("Turno del jugador 2");
      return;
    }
    if (gameMode === "local" && currentPlayer === 2) {
      roundDoneRef.current = true;
      clearInterval(timerRef.current);
      setOpponentSelected(letter);
      handleRoundEnd(selected, letter);
      return;
    }
    roundDoneRef.current = true;
    clearInterval(timerRef.current);
    setSelected(letter);
    handleRoundEnd(letter, opponentSelected);
  };

  const handleRoundEnd = useCallback((playerAnswer, opponentAnswer) => {
    if (!isMountedRef.current) return;
    const correct       = queue[currentIndex];
    const playerRight   = playerAnswer === correct;
    const opponentRight = opponentAnswer === correct;

    let result = "tie";
    if (playerRight  && !opponentRight) result = "win";
    if (!playerRight && opponentRight)  result = "lose";
    if (playerRight  && opponentRight && gameMode === "ai") result = "win";

    setRoundResult(result);
    if (result === "win") {
      setPlayerScore((s) => s + 1);
      addXP(XP_CONFIG.correctAnswer);
      speak("¡Punto para ti!");
      Animated.sequence([
        Animated.timing(scoreAnim, { toValue: 1.3, duration: 150, useNativeDriver: true }),
        Animated.timing(scoreAnim, { toValue: 1.0, duration: 150, useNativeDriver: true }),
      ]).start();
      if (isConnected) BluetoothService.feedbackCorrect();
    } else if (result === "lose") {
      setOpponentScore((s) => s + 1);
      speak(`Punto para el oponente. Era ${correct}.`);
      if (isConnected) BluetoothService.feedbackWrong();
    } else {
      speak(`Empate. Era ${correct}.`);
    }

    setTimeout(() => {
      if (!isMountedRef.current) return;
      if (currentIndex >= queue.length - 1) {
        setPhase("finished");
        if (isConnected) BluetoothService.resetServos();

        // Registra la partida y da XP
        const playerWon   = playerScore > opponentScore;
        const vsHard      = gameMode === "ai" && aiDifficulty === "hard";
        completeGame(playerWon, vsHard);

        // Notificación de XP
        const xpGanado = playerWon ? 40 : 15;
        setNotification({ type: "xp", amount: xpGanado });

        setTimeout(() => { if (isMountedRef.current) setShowModal(true); }, 600);
      } else {
        setCurrentIndex((i) => i + 1);
      }
    }, 2000);
  }, [queue, currentIndex, gameMode, isConnected]);

  // Pantalla de carga entre selección y juego
  if (isLoading) {
    return (
      <LoadingScreen
        message="Preparando juego..."
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
          <Text style={styles.title}>Juego</Text>
          <Text style={styles.subtitle}>Compite contra la IA o un amigo.</Text>

          <Text style={styles.sectionLabel}>Contra la IA</Text>
          <View style={styles.aiRow}>
            {Object.entries(AI_PROFILES).map(([key, p]) => (
              <TouchableOpacity key={key} style={styles.aiCard} onPress={() => chooseGame("ai", key)}>
                <Text style={styles.aiEmoji}>{key === "easy" ? "😊" : key === "medium" ? "😐" : "😤"}</Text>
                <Text style={styles.aiLabel}>{key === "easy" ? "Fácil" : key === "medium" ? "Medio" : "Difícil"}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.sectionLabel, { marginTop: 24 }]}>Con un amigo</Text>
          <TouchableOpacity style={styles.localCard} onPress={() => chooseGame("local")}>
            <Text style={{ fontSize: 32 }}>👥</Text>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={styles.localTitle}>Dos jugadores</Text>
              <Text style={styles.localDesc}>Turno por turno en el mismo dispositivo</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.rulesBox}>
            <Text style={styles.rulesTitle}>📋 Reglas</Text>
            <Text style={styles.rulesText}>
              • {TOTAL_ROUNDS} rondas por partida{"\n"}
              • {ROUND_TIME} segundos por pregunta (ajustable en Ajustes){"\n"}
              • Gana quien más puntos acumule
            </Text>
            <View style={styles.deviceRow}>
              <View style={[styles.deviceDot, { backgroundColor: isConnected ? "#0A7C5E" : "#7C1A0A" }]} />
              <Text style={styles.deviceLabel}>{isConnected ? "Dispositivo conectado" : "Sin dispositivo"}</Text>
            </View>
          </View>
          <View style={{ height: 24 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (phase === "countdown") {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Text style={styles.countdownNum}>{countdown}</Text>
        <Text style={styles.countdownLabel}>¡Prepárate!</Text>
      </SafeAreaView>
    );
  }

  const currentLetter = queue[currentIndex];
  const currentData   = brailleAlphabet[currentLetter];
  const opponentName  = gameMode === "ai" ? AI_PROFILES[aiDifficulty].name : "Jugador 2";

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
      <View style={styles.scoreboard}>
        <View style={styles.scoreBox}>
          <Text style={styles.scoreLabel}>Tú</Text>
          <Animated.Text style={[styles.scoreNum, { transform: [{ scale: scoreAnim }] }]}>{playerScore}</Animated.Text>
        </View>
        <View style={styles.roundBadge}>
          <Text style={styles.roundText}>{currentIndex + 1}/{TOTAL_ROUNDS}</Text>
          {roundResult && <Text style={styles.roundResult}>{roundResult === "win" ? "🏆 +1" : roundResult === "lose" ? "💀" : "🤝"}</Text>}
        </View>
        <View style={styles.scoreBox}>
          <Text style={styles.scoreLabel}>{opponentName}</Text>
          <Text style={[styles.scoreNum, { color: "#F5A623" }]}>{opponentScore}</Text>
        </View>
      </View>

      <Animated.View style={[styles.timerBar, {
        width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }),
        backgroundColor: progressAnim.interpolate({ inputRange: [0, 0.3, 1], outputRange: ["#7C1A0A", "#F5A623", "#0D7E8E"] }),
      }]} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.playScroll} scrollEnabled={false}>
        {gameMode === "local" && (
          <View style={[styles.turnBadge, { backgroundColor: currentPlayer === 1 ? "#1B3A6B" : "#5B2D8E" }]}>
            <Text style={styles.turnText}>Jugador {currentPlayer}</Text>
          </View>
        )}
        <Text style={styles.question}>¿Qué letra es?</Text>
        <BrailleCell activeDots={currentData.dots} size="large" showLabels={settings.showDotLabels} />
        {gameMode === "ai" && (
          <View style={styles.aiStatus}>
            <Text style={styles.aiStatusText}>
              {opponentSelected ? `🤖 Respondió ${opponentSelected === currentLetter ? "✓" : "✗"}` : "🤖 Pensando..."}
            </Text>
          </View>
        )}
        <View style={styles.optGrid}>
          {options.map((letter) => {
            const isPlayerPick = selected === letter;
            const isCorrect    = letter === currentLetter;
            const showResult   = roundResult !== null;
            let s = {};
            if (showResult) { if (isCorrect) s = styles.optCorrect; else if (isPlayerPick) s = styles.optWrong; }
            else if (isPlayerPick && gameMode === "local") s = styles.optSelected;
            return (
              <TouchableOpacity key={letter} style={[styles.optBtn, s]}
                onPress={() => handlePlayerAnswer(letter)}
                disabled={roundResult !== null || (gameMode === "local" && currentPlayer === 2 && selected === null)}>
                <Text style={styles.optText}>{letter}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <FeedbackModal
        visible={showModal}
        score={playerScore}
        total={TOTAL_ROUNDS}
        mode={gameMode === "ai" ? `vs IA ${aiDifficulty}` : "local"}
        onRepeat={() => { setShowModal(false); startGame(gameMode, aiDifficulty); }}
        onContinue={() => { 
          const won = playerScore > opponentScore;
          const vsAiHard = gameMode === "ai" && aiDifficulty === "hard";
          completeGame(won, vsAiHard);
          setShowModal(false); 
          stopSpeaking(); 
          navigation.navigate("Home");
        }}
        onHome={() => { setShowModal(false); stopSpeaking(); navigation.navigate("Home"); }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: "#0A1628", paddingHorizontal: 24 },
  centerContainer: { flex: 1, backgroundColor: "#0A1628", justifyContent: "center", alignItems: "center" },
  backBtn:     { marginTop: 16 },
  backText:    { color: "#C8D8E8", fontSize: 16 },
  configScroll:{ paddingTop: 8 },
  title:       { fontSize: 28, fontWeight: "900", color: "#FFFFFF", marginTop: 24, marginBottom: 8 },
  subtitle:    { fontSize: 14, color: "#C8D8E8", marginBottom: 28 },
  sectionLabel:{ fontSize: 11, color: "#64748B", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 12 },
  aiRow:       { flexDirection: "row", gap: 10 },
  aiCard:      { flex: 1, backgroundColor: "#111E30", borderRadius: 14, padding: 16, alignItems: "center", borderWidth: 1, borderColor: "#1E3A5F" },
  aiEmoji:     { fontSize: 28, marginBottom: 8 },
  aiLabel:     { color: "#FFFFFF", fontWeight: "700", fontSize: 13 },
  localCard:   { backgroundColor: "#5B2D8E20", borderRadius: 14, padding: 18, flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#5B2D8E" },
  localTitle:  { fontSize: 16, fontWeight: "700", color: "#FFFFFF" },
  localDesc:   { fontSize: 12, color: "#C8D8E8", marginTop: 4 },
  rulesBox:    { backgroundColor: "#0D1F35", borderRadius: 12, padding: 16, marginTop: 24, borderWidth: 1, borderColor: "#1E3A5F" },
  rulesTitle:  { color: "#F5A623", fontWeight: "700", fontSize: 13, marginBottom: 8 },
  rulesText:   { color: "#64748B", fontSize: 13, lineHeight: 24, marginBottom: 12 },
  deviceRow:   { flexDirection: "row", alignItems: "center", gap: 8 },
  deviceDot:   { width: 8, height: 8, borderRadius: 4 },
  deviceLabel: { color: "#C8D8E8", fontSize: 12 },
  countdownNum: { fontSize: 96, fontWeight: "900", color: "#F5A623" },
  countdownLabel:{ fontSize: 18, color: "#C8D8E8", marginTop: 8 },
  scoreboard:  { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 16, marginBottom: 10 },
  scoreBox:    { alignItems: "center", flex: 1 },
  scoreLabel:  { color: "#C8D8E8", fontSize: 12, marginBottom: 4 },
  scoreNum:    { color: "#FFFFFF", fontSize: 36, fontWeight: "900" },
  roundBadge:  { alignItems: "center" },
  roundText:   { color: "#64748B", fontSize: 13 },
  roundResult: { fontSize: 16, fontWeight: "700", color: "#F5A623", marginTop: 4 },
  timerBar:    { height: 5, borderRadius: 3, marginBottom: 12 },
  playScroll:  { alignItems: "center", paddingTop: 4 },
  turnBadge:   { borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6, marginBottom: 12 },
  turnText:    { color: "#FFFFFF", fontWeight: "700", fontSize: 13 },
  question:    { fontSize: 18, fontWeight: "700", color: "#FFFFFF", textAlign: "center", marginBottom: 20 },
  aiStatus:    { backgroundColor: "#0D1F35", borderRadius: 10, padding: 10, marginTop: 16, alignItems: "center" },
  aiStatusText:{ color: "#64748B", fontSize: 13 },
  optGrid:     { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 20, justifyContent: "center", width: "100%" },
  optBtn:      { width: "45%", backgroundColor: "#1B3A6B", borderRadius: 14, paddingVertical: 22, alignItems: "center" },
  optSelected: { backgroundColor: "#0D7E8E" },
  optCorrect:  { backgroundColor: "#0A7C5E" },
  optWrong:    { backgroundColor: "#7C1A0A" },
  optText:     { fontSize: 32, fontWeight: "900", color: "#FFFFFF" },
});