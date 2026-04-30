// ============================================================
// App.js — punto de entrada raíz
//
// Estructura:
//   App.js
//   └─ SettingsProvider        ← ajustes persistentes disponibles en toda la app
//      └─ AppContent           ← espera que AsyncStorage cargue antes de renderizar
//         └─ AppNavigator      ← NavigationContainer + Stack de pantallas
//
// IMPORTANTE: AppNavigator NO debe tener otro SettingsProvider ni
// NavigationContainer propio — ambos viven aquí.
//
// Rutas de import asumen que App.js está en la raíz del proyecto
// y el código fuente en ./app/ (estructura Expo por defecto).
// Si tu carpeta se llama src/ en vez de app/, ajusta los paths.
// ============================================================
import React from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { SettingsProvider, useSettings } from "./app/context/SettingsContext";
import AppNavigator from "./app/navigation/AppNavigator";
import LoadingScreen from "./app/screens/LoadingScreen";

function AppContent() {
  const { isLoaded } = useSettings();

  // Evita el flash de valores por defecto mientras AsyncStorage carga
  if (!isLoaded) {
    return (
      <LoadingScreen
        message="Cargando ajustes..."
        onFinish={() => {}}
        minDuration={4500}
      />
    );
  }

  return <AppNavigator />;
}

export default function App() {
  return (
    <SettingsProvider>
      <AppContent />
    </SettingsProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: "#0A1628",
    justifyContent: "center",
    alignItems: "center",
  },
});