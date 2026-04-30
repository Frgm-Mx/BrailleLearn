// ============================================================
// ProgressContext — sistema de progreso, XP y logros
// Persiste en AsyncStorage automáticamente
// ============================================================
import React, {
  createContext, useContext, useEffect,
  useState, useCallback,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@braille_progress_v1";

// ── Configuración del sistema de XP ──────────────────────────
export const XP_CONFIG = {
  correctAnswer:    10,   // respuesta correcta
  streakBonus:       5,   // bonus por cada respuesta en racha (×racha)
  lessonComplete:   50,   // completar una lección
  perfectLesson:   100,   // lección sin errores
  firstTime:        20,   // primera vez que aprendes una letra
  dailyGoal:       200,   // XP para la meta diaria
};

// ── Niveles del sistema ───────────────────────────────────────
export const LEVELS = [
  { level: 1,  minXP: 0,    title: "Principiante",  emoji: "🌱", color: "#64748B" },
  { level: 2,  minXP: 100,  title: "Aprendiz",      emoji: "📖", color: "#0D7E8E" },
  { level: 3,  minXP: 300,  title: "Explorador",    emoji: "🔍", color: "#1B3A6B" },
  { level: 4,  minXP: 600,  title: "Practicante",   emoji: "✍️", color: "#5B2D8E" },
  { level: 5,  minXP: 1000, title: "Competente",    emoji: "⭐", color: "#F5A623" },
  { level: 6,  minXP: 1500, title: "Avanzado",      emoji: "🏆", color: "#F59E0B" },
  { level: 7,  minXP: 2200, title: "Experto",       emoji: "🎯", color: "#0A7C5E" },
  { level: 8,  minXP: 3000, title: "Maestro",       emoji: "🦁", color: "#DC2626" },
  { level: 9,  minXP: 4000, title: "Gran Maestro",  emoji: "👑", color: "#7C3AED" },
  { level: 10, minXP: 5500, title: "Leyenda",       emoji: "💎", color: "#0EA5E9" },
];

// ── Logros disponibles ────────────────────────────────────────
export const ACHIEVEMENTS = [
  { id: "first_letter",    title: "Primera Letra",    desc: "Aprende tu primera letra Braille",          emoji: "🔤", xpReward: 20  },
  { id: "all_vowels",      title: "Vocalista",        desc: "Domina las 5 vocales",                      emoji: "🎵", xpReward: 50  },
  { id: "streak_3",        title: "En Racha",         desc: "3 respuestas correctas consecutivas",       emoji: "🔥", xpReward: 30  },
  { id: "streak_7",        title: "Imparable",        desc: "7 respuestas correctas consecutivas",       emoji: "⚡", xpReward: 75  },
  { id: "perfect_lesson",  title: "Perfeccionista",   desc: "Completa una lección sin errores",          emoji: "💯", xpReward: 100 },
  { id: "alphabet_half",   title: "Mitad del Camino", desc: "Aprende 13 letras del abecedario",          emoji: "📚", xpReward: 80  },
  { id: "full_alphabet",   title: "Alfabetizado",     desc: "Aprende las 26 letras completas",           emoji: "🏅", xpReward: 200 },
  { id: "numbers_all",     title: "Numerólogo",       desc: "Domina todos los números del 0 al 9",       emoji: "🔢", xpReward: 100 },
  { id: "daily_goal",      title: "Meta del Día",     desc: "Alcanza 200 XP en un día",                  emoji: "🎯", xpReward: 50  },
  { id: "streak_days_3",   title: "3 Días Seguidos",  desc: "Usa la app 3 días consecutivos",            emoji: "📅", xpReward: 60  },
  { id: "streak_days_7",   title: "Semana Completa",  desc: "Usa la app 7 días consecutivos",            emoji: "🗓️", xpReward: 150 },
  { id: "first_game",      title: "Jugador",          desc: "Completa tu primera partida",               emoji: "🎮", xpReward: 30  },
  { id: "beat_ai_hard",    title: "Dominador",        desc: "Gana a la IA en modo difícil",              emoji: "🤖", xpReward: 150 },
  { id: "level_5",         title: "Nivel 5",          desc: "Alcanza el nivel Competente",               emoji: "⭐", xpReward: 100 },
];

// ── Estado inicial ────────────────────────────────────────────
const DEFAULT_PROGRESS = {
  totalXP:          0,
  level:            1,
  lettersLearned:   [],      // letras dominadas
  lettersStats:     {},      // { A: { correct: 5, wrong: 2, totalMs: 3000 } }
  achievements:     [],      // ids de logros desbloqueados
  currentStreak:    0,       // racha de días consecutivos
  longestStreak:    0,
  lastActiveDate:   null,    // ISO string del último día activo
  dailyXP:          0,       // XP del día actual
  dailyDate:        null,    // fecha del día actual para reset
  totalSessions:    0,
  totalCorrect:     0,
  totalWrong:       0,
  gamesPlayed:      0,
  gamesWon:         0,
};

// ── Utilidades ────────────────────────────────────────────────
export const getLevelForXP = (xp) => {
  let current = LEVELS[0];
  for (const lvl of LEVELS) {
    if (xp >= lvl.minXP) current = lvl;
    else break;
  }
  return current;
};

export const getNextLevel = (currentLevel) =>
  LEVELS.find((l) => l.level === currentLevel + 1) || null;

export const getXPProgress = (xp) => {
  const current = getLevelForXP(xp);
  const next    = getNextLevel(current.level);
  if (!next) return { current, next: null, percentage: 1, xpInLevel: 0, xpNeeded: 0 };
  const xpInLevel = xp - current.minXP;
  const xpNeeded  = next.minXP - current.minXP;
  return {
    current,
    next,
    percentage: xpInLevel / xpNeeded,
    xpInLevel,
    xpNeeded,
  };
};

// ── Contexto ──────────────────────────────────────────────────
const ProgressContext = createContext({
  progress:          DEFAULT_PROGRESS,
  addXP:             () => [],
  recordAnswer:      () => {},
  completeLesson:    () => [],
  completeGame:      () => [],
  checkAchievements: () => [],
  isLoaded:          false,
});

export function ProgressProvider({ children }) {
  const [progress, setProgress] = useState(DEFAULT_PROGRESS);
  const [isLoaded, setIsLoaded] = useState(false);

  // Carga al montar
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          setProgress((prev) => ({ ...prev, ...JSON.parse(raw) }));
        }
      } catch (e) {
        console.warn("[Progress] Error al cargar:", e);
      } finally {
        setIsLoaded(true);
      }
    })();
  }, []);

  // Guarda en AsyncStorage cada vez que cambia el progreso
  const save = useCallback((newProgress) => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newProgress)).catch((e) =>
      console.warn("[Progress] Error al guardar:", e)
    );
  }, []);

  // ── Actualiza racha de días ──────────────────────────────────
  const updateDailyStreak = useCallback((current) => {
    const today     = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    let { currentStreak, longestStreak, lastActiveDate, dailyXP, dailyDate } = current;

    // Reset XP diario si es un día nuevo
    if (dailyDate !== today) {
      dailyXP   = 0;
      dailyDate = today;
    }

    // Actualiza racha
    if (lastActiveDate === yesterday) {
      currentStreak += 1;
    } else if (lastActiveDate !== today) {
      currentStreak = 1;
    }

    longestStreak = Math.max(longestStreak, currentStreak);

    return {
      ...current,
      currentStreak,
      longestStreak,
      lastActiveDate: today,
      dailyXP,
      dailyDate,
    };
  }, []);

  // ── Verifica y desbloquea logros ──────────────────────────────
  const checkAchievements = useCallback((current) => {
    const newAchievements = [];
    const unlocked = new Set(current.achievements);

    const check = (id, condition) => {
      if (!unlocked.has(id) && condition) {
        unlocked.add(id);
        newAchievements.push(id);
      }
    };

    check("first_letter",   current.lettersLearned.length >= 1);
    check("all_vowels",     ["A","E","I","O","U"].every((v) => current.lettersLearned.includes(v)));
    check("streak_3",       current.currentStreak >= 3 || (current.lettersStats && Object.values(current.lettersStats).some((s) => s.correct >= 3)));
    check("streak_7",       current.currentStreak >= 7);
    check("perfect_lesson", current.achievements?.includes("perfect_lesson") || false);
    check("alphabet_half",  current.lettersLearned.length >= 13);
    check("full_alphabet",  current.lettersLearned.length >= 26);
    check("daily_goal",     current.dailyXP >= XP_CONFIG.dailyGoal);
    check("streak_days_3",  current.currentStreak >= 3);
    check("streak_days_7",  current.currentStreak >= 7);
    check("first_game",     current.gamesPlayed >= 1);
    check("level_5",        current.level >= 5);

    // Calcula XP de recompensa por logros nuevos
    const bonusXP = newAchievements.reduce((sum, id) => {
      const achievement = ACHIEVEMENTS.find((a) => a.id === id);
      return sum + (achievement?.xpReward ?? 0);
    }, 0);

    return {
      updated: { ...current, achievements: [...unlocked] },
      newAchievements,
      bonusXP,
    };
  }, []);

  // ── Agrega XP ────────────────────────────────────────────────
  const addXP = useCallback((amount, reason = "") => {
    let newAchievements = [];

    setProgress((prev) => {
      let next = updateDailyStreak({ ...prev });
      next.totalXP  += amount;
      next.dailyXP  += amount;
      next.level     = getLevelForXP(next.totalXP).level;

      const { updated, newAchievements: unlocked, bonusXP } = checkAchievements(next);
      next = updated;

      if (bonusXP > 0) {
        next.totalXP += bonusXP;
        next.dailyXP += bonusXP;
        next.level    = getLevelForXP(next.totalXP).level;
      }

      newAchievements = unlocked;
      save(next);
      return next;
    });

    return newAchievements;
  }, [updateDailyStreak, checkAchievements, save]);

  // ── Registra una respuesta ────────────────────────────────────
  const recordAnswer = useCallback((letter, isCorrect, streak = 0) => {
    setProgress((prev) => {
      const stats = { ...prev.lettersStats };
      if (!stats[letter]) stats[letter] = { correct: 0, wrong: 0 };

      if (isCorrect) {
        stats[letter].correct += 1;
      } else {
        stats[letter].wrong += 1;
      }

      // Marca letra como aprendida si tiene 3+ aciertos
      let lettersLearned = [...prev.lettersLearned];
      if (isCorrect && stats[letter].correct >= 3 && !lettersLearned.includes(letter)) {
        lettersLearned.push(letter);
      }

      const next = {
        ...prev,
        lettersStats:  stats,
        lettersLearned,
        totalCorrect:  prev.totalCorrect + (isCorrect ? 1 : 0),
        totalWrong:    prev.totalWrong   + (isCorrect ? 0 : 1),
      };

      save(next);
      return next;
    });
  }, [save]);

  // ── Completa una lección ──────────────────────────────────────
  const completeLesson = useCallback((correct, total, isPerfect = false) => {
    let xp = XP_CONFIG.lessonComplete;
    if (isPerfect) xp += XP_CONFIG.perfectLesson;

    setProgress((prev) => {
      let next = updateDailyStreak({ ...prev, totalSessions: prev.totalSessions + 1 });

      if (isPerfect) {
        const { updated } = checkAchievements({
          ...next,
          achievements: [...next.achievements, "perfect_lesson"],
        });
        next = updated;
      }

      next.totalXP += xp;
      next.dailyXP += xp;
      next.level    = getLevelForXP(next.totalXP).level;

      const { updated, newAchievements, bonusXP } = checkAchievements(next);
      next = updated;
      if (bonusXP > 0) {
        next.totalXP += bonusXP;
        next.level    = getLevelForXP(next.totalXP).level;
      }

      save(next);
      return next;
    });

    return xp;
  }, [updateDailyStreak, checkAchievements, save]);

  // ── Completa una partida ──────────────────────────────────────
  const completeGame = useCallback((won, vsAiHard = false) => {
    setProgress((prev) => {
      let next = {
        ...prev,
        gamesPlayed: prev.gamesPlayed + 1,
        gamesWon:    prev.gamesWon + (won ? 1 : 0),
      };
      next = updateDailyStreak(next);

      const xp = won ? 40 : 15;
      next.totalXP += xp;
      next.dailyXP += xp;
      next.level    = getLevelForXP(next.totalXP).level;

      if (won && vsAiHard) {
        const unlocked = new Set(next.achievements);
        unlocked.add("beat_ai_hard");
        next.achievements = [...unlocked];
      }

      const { updated, bonusXP } = checkAchievements(next);
      next = updated;
      if (bonusXP > 0) {
        next.totalXP += bonusXP;
        next.level    = getLevelForXP(next.totalXP).level;
      }

      save(next);
      return next;
    });
  }, [updateDailyStreak, checkAchievements, save]);

  return (
    <ProgressContext.Provider value={{
      progress,
      addXP,
      recordAnswer,
      completeLesson,
      completeGame,
      checkAchievements,
      isLoaded,
    }}>
      {children}
    </ProgressContext.Provider>
  );
}

export const useProgress = () => useContext(ProgressContext);