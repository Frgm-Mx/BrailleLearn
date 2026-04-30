// ============================================================
// SettingsScreen — ajustes persistentes conectados a SettingsContext
// FIX: Eliminado el efecto rebote y conflicto con gesto de cerrar pantalla
// ============================================================
import React, { useState } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet,
  Switch, Alert, Platform,
} from "react-native";
import { ScrollView } from "react-native-gesture-handler"; // ← Importante: mejor manejo de gestos
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSettings, SPEED_MAP, PITCH_MAP } from "../context/SettingsContext";
import { speak, stopSpeaking } from "../utils/helpers";

// ── Componentes internos ──────────────────────────────────────

const Divider = () => <View style={styles.divider} />;

const SectionTitle = ({ children }) => (
  <Text style={styles.sectionTitle}>{children}</Text>
);

function SettingRow({ label, description, value, onValueChange, trackColor }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{label}</Text>
        {description ? <Text style={styles.rowDesc}>{description}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={trackColor ?? { false: "#1E3A5F", true: "#0D7E8E" }}
        thumbColor="#FFFFFF"
        ios_backgroundColor="#1E3A5F"
      />
    </View>
  );
}

function OptionPills({ options, selected, onSelect, accentColor = "#0D7E8E" }) {
  return (
    <View style={styles.pillRow}>
      {options.map((opt) => {
        const isSelected = selected === opt.value;
        return (
          <TouchableOpacity
            key={opt.value}
            style={[
              styles.pill,
              isSelected && { backgroundColor: accentColor, borderColor: accentColor },
            ]}
            onPress={() => onSelect(opt.value)}
            accessibilityRole="radio"
            accessibilityState={{ checked: isSelected }}
            accessibilityLabel={opt.label}
          >
            <Text style={[styles.pillText, isSelected && styles.pillTextActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ── Pantalla principal ────────────────────────────────────────

export default function SettingsScreen({ navigation }) {
  const { settings, updateSetting, resetSettings } = useSettings();
  const insets = useSafeAreaInsets();
  // Estado local solo para saber si el usuario está probando la voz
  const [previewPending, setPreviewPending] = useState(false);

  const previewVoice = () => {
    if (previewPending) return;
    setPreviewPending(true);
    speak("Así suena la voz con tus ajustes actuales.", {
      rate:  SPEED_MAP[settings.voiceSpeed],
      pitch: PITCH_MAP[settings.voicePitch],
      language: settings.language === "en" ? "en-US" : "es-MX",
    });
    setTimeout(() => setPreviewPending(false), 2500);
  };

  const handleReset = () => {
    Alert.alert(
      "Restablecer ajustes",
      "¿Estás seguro? Todos los ajustes volverán a los valores por defecto.",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Restablecer", style: "destructive", onPress: resetSettings },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity
          onPress={() => { stopSpeaking(); navigation.goBack(); }}
          accessibilityLabel="Volver"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.backText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Ajustes</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* ScrollView con todas las propiedades para eliminar el rebote y conflicto de gestos */}
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingTop: insets.bottom + 8, paddingBottom: 40 }]}
        keyboardShouldPersistTaps="handled"
        bounces={false}              // ← Elimina el rebote en iOS
        overScrollMode="never"       // ← Elimina el efecto de rebote/glow en Android
        alwaysBounceVertical={false} // ← Evita rebote vertical incluso con contenido pequeño
        nestedScrollEnabled={true}   // ← Importante para manejar scroll anidado en Android
      >

        {/* ── VOZ ── */}
        <SectionTitle>🔊 Voz</SectionTitle>
        <View style={styles.card}>
          <SettingRow
            label="Instrucciones por voz"
            description="Narración en cada paso de la lección"
            value={settings.voiceEnabled}
            onValueChange={(v) => updateSetting("voiceEnabled", v)}
          />
          <Divider />

          <Text style={styles.subLabel}>Velocidad</Text>
          <OptionPills
            options={[
              { label: "🐢  Lenta",  value: "slow"   },
              { label: "😊  Normal", value: "normal" },
              { label: "⚡  Rápida", value: "fast"   },
            ]}
            selected={settings.voiceSpeed}
            onSelect={(v) => updateSetting("voiceSpeed", v)}
            accentColor="#0D7E8E"
          />
          <Divider />

          <Text style={styles.subLabel}>Tono</Text>
          <OptionPills
            options={[
              { label: "↓  Grave",  value: "low"    },
              { label: "●  Normal", value: "normal" },
              { label: "↑  Agudo",  value: "high"   },
            ]}
            selected={settings.voicePitch}
            onSelect={(v) => updateSetting("voicePitch", v)}
            accentColor="#0D7E8E"
          />
          <Divider />

          <TouchableOpacity
            style={[styles.previewBtn, previewPending && styles.previewBtnDisabled]}
            onPress={previewVoice}
            disabled={previewPending}
          >
            <Text style={styles.previewBtnText}>
              {previewPending ? "Reproduciendo..." : "🔊  Escuchar previsualización"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── IDIOMA ── */}
        <SectionTitle>🌐 Idioma</SectionTitle>
        <View style={styles.card}>
          <Text style={styles.subLabel}>Idioma de instrucciones</Text>
          <OptionPills
            options={[
              { label: "🇲🇽  Español", value: "es" },
              { label: "🇺🇸  English",  value: "en" },
            ]}
            selected={settings.language}
            onSelect={(v) => updateSetting("language", v)}
            accentColor="#5B2D8E"
          />
        </View>

        {/* ── FEEDBACK ── */}
        <SectionTitle>📳 Retroalimentación</SectionTitle>
        <View style={styles.card}>
          <SettingRow
            label="Vibración"
            description="El dispositivo vibra al responder"
            value={settings.hapticEnabled}
            onValueChange={(v) => updateSetting("hapticEnabled", v)}
            trackColor={{ false: "#1E3A5F", true: "#0A7C5E" }}
          />
          <Divider />
          <SettingRow
            label="Sonidos de interfaz"
            description="Pitidos de confirmación y error"
            value={settings.soundEnabled}
            onValueChange={(v) => updateSetting("soundEnabled", v)}
            trackColor={{ false: "#1E3A5F", true: "#0A7C5E" }}
          />
        </View>

        {/* ── APRENDIZAJE ── */}
        <SectionTitle>📖 Aprendizaje</SectionTitle>
        <View style={styles.card}>
          <SettingRow
            label="Avance automático"
            description="Pasa a la siguiente letra sin confirmar"
            value={settings.autoAdvance}
            onValueChange={(v) => updateSetting("autoAdvance", v)}
            trackColor={{ false: "#1E3A5F", true: "#F5A623" }}
          />
          <Divider />
          <SettingRow
            label="Números de punto visibles"
            description="Muestra el nº de cada punto en la celda Braille"
            value={settings.showDotLabels}
            onValueChange={(v) => updateSetting("showDotLabels", v)}
            trackColor={{ false: "#1E3A5F", true: "#F5A623" }}
          />
          <Divider />

          <Text style={styles.subLabel}>Nivel de dificultad</Text>
          <OptionPills
            options={[
              { label: "🌱  Básico",   value: "beginner"     },
              { label: "📘  Medio",    value: "intermediate" },
              { label: "🔥  Avanzado", value: "advanced"     },
            ]}
            selected={settings.difficulty}
            onSelect={(v) => updateSetting("difficulty", v)}
            accentColor="#F5A623"
          />
          <Divider />

          {/* FIX: roundTime guardado como número, no string */}
          <Text style={styles.subLabel}>Tiempo por pregunta</Text>
          <OptionPills
            options={[
              { label: "5 s",  value: 5  },
              { label: "10 s", value: 10 },
              { label: "15 s", value: 15 },
              { label: "20 s", value: 20 },
            ]}
            selected={settings.roundTime}
            onSelect={(v) => updateSetting("roundTime", v)}
            accentColor="#F5A623"
          />
          <View style={styles.roundTimeNote}>
            <Text style={styles.roundTimeNoteText}>
              Este valor se aplica en los modos Práctica y Juego.
            </Text>
          </View>
        </View>

        {/* ── DISPOSITIVO ── */}
        <SectionTitle>📡 Dispositivo físico</SectionTitle>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.navRow}
            onPress={() => navigation.navigate("Bluetooth")}
            accessibilityLabel="Conectar dispositivo Braille"
          >
            <View style={styles.navIcon}>
              <Text style={{ fontSize: 20 }}>🔗</Text>
            </View>
            <View style={styles.navText}>
              <Text style={styles.navTitle}>Conectar dispositivo</Text>
              <Text style={styles.navDesc}>Vincula tu dispositivo Braille por Bluetooth</Text>
            </View>
            <Text style={styles.navArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* ── RESTABLECER ── */}
        <SectionTitle>⚠️ Datos</SectionTitle>
        <View style={styles.card}>
          <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
            <Text style={styles.resetBtnText}>Restablecer ajustes por defecto</Text>
          </TouchableOpacity>
        </View>

        {/* ── ACERCA DE ── */}
        <SectionTitle>ℹ️ Acerca de</SectionTitle>
        <View style={[styles.card, styles.aboutCard]}>
          {/* Celda Braille decorativa */}
          <View style={styles.brailleDecor}>
            {[1,4,2,5,3,6].map((dot, i) => (
              <View
                key={i}
                style={[
                  styles.decorDot,
                  [1,3,5].includes(dot) && styles.decorDotActive,
                ]}
              />
            ))}
          </View>
          <Text style={styles.appName}>BRAILLE</Text>
          <Text style={styles.appTagline}>Aprende a tu ritmo</Text>
          <Text style={styles.appVersion}>Versión 1.0.0 · Prototipo</Text>
          <Text style={styles.appDesc}>
            Proyecto educativo para la enseñanza del sistema Braille español.
            Diseñado con accesibilidad como prioridad.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A1628" },
  scrollView: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24, paddingTop: 16, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: "#1E3A5F",
  },
  backText: { color: "#C8D8E8", fontSize: 16 },
  title: { fontSize: 18, fontWeight: "800", color: "#FFFFFF" },

  scroll: { paddingTop: 8 },

  sectionTitle: {
    fontSize: 11, fontWeight: "700", color: "#64748B",
    textTransform: "uppercase", letterSpacing: 1.5,
    marginTop: 28, marginBottom: 8, paddingHorizontal: 24,
  },

  card: {
    backgroundColor: "#111E30", marginHorizontal: 16,
    borderRadius: 16, overflow: "hidden",
    borderWidth: 1, borderColor: "#1E3A5F",
  },

  // Switch row
  row: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 14,
  },
  rowText: { flex: 1, paddingRight: 12 },
  rowLabel: { fontSize: 15, fontWeight: "600", color: "#FFFFFF" },
  rowDesc:  { fontSize: 12, color: "#64748B", marginTop: 3, lineHeight: 18 },

  divider: { height: 1, backgroundColor: "#1E3A5F", marginHorizontal: 16 },

  // Sub-etiqueta para pills
  subLabel: {
    fontSize: 12, fontWeight: "600", color: "#C8D8E8",
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6,
  },

  // Pills
  pillRow: {
    flexDirection: "row", flexWrap: "wrap",
    gap: 8, paddingHorizontal: 16, paddingBottom: 14,
  },
  pill: {
    borderWidth: 1.5, borderColor: "#2A3F5F",
    borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8,
    backgroundColor: "transparent",
  },
  pillText:       { color: "#64748B", fontSize: 13, fontWeight: "600" },
  pillTextActive: { color: "#FFFFFF" },

  // Preview voz
  previewBtn: {
    backgroundColor: "#0D7E8E", margin: 14, borderRadius: 10,
    paddingVertical: 12, alignItems: "center",
  },
  previewBtnDisabled: { backgroundColor: "#0D7E8E60" },
  previewBtnText: { color: "#FFFFFF", fontWeight: "700", fontSize: 14 },

  // Nota roundTime
  roundTimeNote: {
    paddingHorizontal: 16, paddingBottom: 14,
  },
  roundTimeNoteText: { fontSize: 11, color: "#64748B", lineHeight: 16 },

  // Nav row (Bluetooth)
  navRow: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 16, gap: 14,
  },
  navIcon: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: "#1B3A6B", alignItems: "center", justifyContent: "center",
  },
  navText:  { flex: 1 },
  navTitle: { fontSize: 15, fontWeight: "600", color: "#FFFFFF" },
  navDesc:  { fontSize: 12, color: "#64748B", marginTop: 2 },
  navArrow: { fontSize: 22, color: "#F5A623" },

  // Reset
  resetBtn: {
    margin: 14, borderRadius: 10,
    paddingVertical: 13, alignItems: "center",
    borderWidth: 1.5, borderColor: "#7C1A0A",
  },
  resetBtnText: { color: "#F87171", fontWeight: "700", fontSize: 14 },

  // About
  aboutCard: { alignItems: "center", paddingVertical: 24, paddingHorizontal: 20 },
  brailleDecor: {
    flexDirection: "row", flexWrap: "wrap",
    width: 44, gap: 6, marginBottom: 16,
  },
  decorDot: {
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: "#1E3A5F",
  },
  decorDotActive: { backgroundColor: "#F5A623" },
  appName:    { fontSize: 24, fontWeight: "900", color: "#FFFFFF", letterSpacing: 5, marginBottom: 4 },
  appTagline: { fontSize: 13, color: "#F5A623", marginBottom: 8 },
  appVersion: { fontSize: 11, color: "#64748B", marginBottom: 12 },
  appDesc:    { fontSize: 13, color: "#C8D8E8", textAlign: "center", lineHeight: 21 },
});