// ============================================================
// helpers.js — utilidades de voz
//
// FIX: todos los imports al inicio del archivo (ES modules requiere esto)
// FIX: sin dependencia circular — useSpeakWithSettings recibe settings
//      como parámetro en vez de importar SettingsContext desde aquí
// ============================================================
import * as Speech from "expo-speech";
import { useCallback } from "react";
import { useSettings, SPEED_MAP, PITCH_MAP } from "../context/SettingsContext";

/**
 * speak() base — acepta opciones explícitas.
 * Úsala cuando no estés en un componente React.
 */
export const speak = (text, options = {}) => {
  Speech.stop();
  Speech.speak(text, {
    language: options.language ?? "es-MX",
    pitch:    options.pitch    ?? 1.0,
    rate:     options.rate     ?? 0.85,
  });
};

export const stopSpeaking = () => Speech.stop();

/**
 * Hook que devuelve una función speak configurada con los ajustes del usuario.
 * Úsalo dentro de componentes React:
 *
 *   const speak = useSpeakWithSettings();
 *   speak("Hola mundo");
 */
export function useSpeakWithSettings() {
  const { settings } = useSettings();

  return useCallback((text, extraOptions = {}) => {
    if (!settings.voiceEnabled) return;
    speak(text, {
      rate:     SPEED_MAP[settings.voiceSpeed]  ?? 0.85,
      pitch:    PITCH_MAP[settings.voicePitch]  ?? 1.0,
      language: settings.language === "en" ? "en-US" : "es-MX",
      ...extraOptions,   // permite sobreescribir puntualmente
    });
  }, [settings.voiceEnabled, settings.voiceSpeed, settings.voicePitch, settings.language]);
}