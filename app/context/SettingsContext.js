// ============================================================
// SettingsContext — ajustes persistentes con AsyncStorage
//
// Instalación requerida:
//   npx expo install @react-native-async-storage/async-storage
//
// Uso:
//   1. Envuelve <App /> o <AppNavigator /> con <SettingsProvider>
//   2. En cualquier pantalla: const { settings, updateSetting } = useSettings()
// ============================================================
import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@braille_settings_v1";

export const DEFAULT_SETTINGS = {
  voiceEnabled:  true,
  voiceSpeed:    "normal",      // "slow" | "normal" | "fast"
  voicePitch:    "normal",      // "low"  | "normal" | "high"
  language:      "es",          // "es" | "en"
  hapticEnabled: true,
  soundEnabled:  true,
  autoAdvance:   true,
  showDotLabels: true,
  difficulty:    "beginner",    // "beginner" | "intermediate" | "advanced"
  roundTime:     10,            // número: 5 | 10 | 15 | 20
  theme:         "dark",        // "dark" | "light"  (reservado para futuro)
};

// Mapas de conversión de ajuste → valor real
export const SPEED_MAP  = { slow: 0.60, normal: 0.85, fast: 1.20 };
export const PITCH_MAP  = { low:  0.80, normal: 1.00, high: 1.30 };

const SettingsContext = createContext({
  settings:      DEFAULT_SETTINGS,
  updateSetting: () => {},
  resetSettings: () => {},
  isLoaded:      false,
});

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  // Carga al montar
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          // Merge con defaults para que claves nuevas no queden undefined
          setSettings((prev) => ({ ...prev, ...JSON.parse(raw) }));
        }
      } catch (e) {
        console.warn("[Settings] Error al cargar:", e);
      } finally {
        setIsLoaded(true);
      }
    })();
  }, []);

  // Actualiza un campo y persiste inmediatamente
  const updateSetting = useCallback((key, value) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: value };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch((e) =>
        console.warn("[Settings] Error al guardar:", e)
      );
      return next;
    });
  }, []);

  // Restablece defaults y borra AsyncStorage
  const resetSettings = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      setSettings(DEFAULT_SETTINGS);
    } catch (e) {
      console.warn("[Settings] Error al resetear:", e);
    }
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, updateSetting, resetSettings, isLoaded }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);