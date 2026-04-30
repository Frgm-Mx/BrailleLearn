import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  FlatList,
  Animated,
  ActivityIndicator,
} from "react-native";
import useBluetooth from "../utils/useBluetooth";
import BluetoothService, { CONNECTION_STATE } from "../services/BluetoothService";

// Indicador animado de señal para cada dispositivo encontrado
function SignalBars({ rssi }) {
  const strength = rssi > -60 ? 3 : rssi > -80 ? 2 : 1;
  return (
    <View style={styles.signalBars}>
      {[1, 2, 3].map((bar) => (
        <View
          key={bar}
          style={[
            styles.signalBar,
            { height: bar * 6 },
            bar <= strength
              ? styles.signalBarActive
              : styles.signalBarInactive,
          ]}
        />
      ))}
    </View>
  );
}

// Punto pulsante animado que indica escaneo activo
function ScanningDot() {
  const pulse = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.4, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1.0, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={[styles.scanDot, { transform: [{ scale: pulse }] }]} />
  );
}

export default function BluetoothScreen({ navigation }) {
  const [connectingId, setConnectingId] = useState(null);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  const {
    connectionState,
    isConnected,
    scanning,
    devices,
    batteryLevel,
    error,
    scan,
    connect,
    disconnect,
  } = useBluetooth();

  // Animación de entrada
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  // Inicia escaneo automático al entrar
  useEffect(() => {
    if (!isConnected) scan();
  }, []);

  const handleConnect = useCallback(async (deviceId) => {
    setConnectingId(deviceId);
    const success = await connect(deviceId);
    setConnectingId(null);
    if (!success) return;
  }, [connect]);

  const handleDisconnect = useCallback(async () => {
    await disconnect();
  }, [disconnect]);

  // Color e icono según estado de conexión
  const getStateUI = () => {
    switch (connectionState) {
      case CONNECTION_STATE.CONNECTED:
        return { color: "#0A7C5E", icon: "📡", label: "Conectado" };
      case CONNECTION_STATE.CONNECTING:
        return { color: "#F5A623", icon: "🔄", label: "Conectando..." };
      case CONNECTION_STATE.SCANNING:
        return { color: "#0D7E8E", icon: "🔍", label: "Buscando dispositivos..." };
      case CONNECTION_STATE.ERROR:
        return { color: "#7C1A0A", icon: "⚠️", label: "Error de conexión" };
      default:
        return { color: "#64748B", icon: "📶", label: "Sin conexión" };
    }
  };

  const stateUI = getStateUI();

  // ── RENDER DE CADA DISPOSITIVO ENCONTRADO ──────────────────
  const renderDevice = ({ item, index }) => {
    const isConnecting = connectingId === item.id;
    const isThisConnected = isConnected &&
      BluetoothService.device?.id === item.id;

    return (
      <Animated.View style={{
        opacity: fadeAnim,
        transform: [{ translateY: fadeAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [20 * (index + 1), 0],
        })}],
      }}>
        <TouchableOpacity
          style={[
            styles.deviceCard,
            isThisConnected && styles.deviceCardConnected,
          ]}
          onPress={() => isThisConnected
            ? handleDisconnect()
            : handleConnect(item.id)
          }
          disabled={isConnecting}
          accessibilityLabel={`${item.name}. ${isThisConnected
            ? "Conectado, toca para desconectar"
            : "Toca para conectar"}`}
        >
          {/* Icono del dispositivo */}
          <View style={[
            styles.deviceIcon,
            isThisConnected && styles.deviceIconConnected,
          ]}>
            <Text style={styles.deviceIconText}>
              {isThisConnected ? "📡" : "⬡"}
            </Text>
          </View>

          {/* Info del dispositivo */}
          <View style={styles.deviceInfo}>
            <Text style={styles.deviceName}>{item.name}</Text>
            <Text style={styles.deviceId}>
              {item.id.substring(0, 17)}...
            </Text>
            {isThisConnected && batteryLevel !== null && (
              <Text style={styles.batteryText}>
                🔋 {batteryLevel}% batería
              </Text>
            )}
          </View>

          {/* Estado derecho */}
          <View style={styles.deviceRight}>
            {isConnecting
              ? <ActivityIndicator color="#F5A623" size="small" />
              : isThisConnected
                ? <Text style={styles.connectedBadge}>Conectado</Text>
                : <SignalBars rssi={item.rssi} />
            }
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          accessibilityLabel="Volver"
        >
          <Text style={styles.backText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Dispositivo</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Estado actual de conexión */}
      <Animated.View style={[styles.stateCard, { opacity: fadeAnim }]}>
        <View style={[styles.stateDot, { backgroundColor: stateUI.color }]}>
          {scanning && <ScanningDot />}
        </View>
        <View style={styles.stateInfo}>
          <Text style={styles.stateLabel}>{stateUI.label}</Text>
          {isConnected && BluetoothService.device && (
            <Text style={styles.stateDevice}>
              {BluetoothService.device.name || "Dispositivo Braille"}
            </Text>
          )}
        </View>
        <Text style={styles.stateIcon}>{stateUI.icon}</Text>
      </Animated.View>

      {/* Error */}
      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
        </View>
      )}

      {/* Si está conectado, muestra panel de control */}
      {isConnected ? (
        <View style={styles.controlPanel}>
          <Text style={styles.sectionTitle}>PANEL DE CONTROL</Text>

          {/* Batería */}
          {batteryLevel !== null && (
            <View style={styles.batteryBar}>
              <Text style={styles.batteryLabel}>Batería del dispositivo</Text>
              <View style={styles.batteryTrack}>
                <View style={[
                  styles.batteryFill,
                  {
                    width: `${batteryLevel}%`,
                    backgroundColor: batteryLevel > 50
                      ? "#0A7C5E"
                      : batteryLevel > 20
                        ? "#F5A623"
                        : "#7C1A0A",
                  },
                ]} />
              </View>
              <Text style={styles.batteryPercent}>{batteryLevel}%</Text>
            </View>
          )}

          {/* Pruebas rápidas */}
          <Text style={styles.testTitle}>Probar dispositivo</Text>
          <View style={styles.testGrid}>
            {[
              {
                label: "Patrón A",
                icon: "🔤",
                action: () => BluetoothService.showPattern([1]),
              },
              {
                label: "Patrón B",
                icon: "🔤",
                action: () => BluetoothService.showPattern([1, 2]),
              },
              {
                label: "Vibrar",
                icon: "📳",
                action: () => BluetoothService.feedbackCorrect(),
              },
              {
                label: "Resetear",
                icon: "↺",
                action: () => BluetoothService.resetServos(),
              },
            ].map((test) => (
              <TouchableOpacity
                key={test.label}
                style={styles.testBtn}
                onPress={test.action}
                accessibilityLabel={`Probar ${test.label}`}
              >
                <Text style={styles.testBtnIcon}>{test.icon}</Text>
                <Text style={styles.testBtnLabel}>{test.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Desconectar */}
          <TouchableOpacity
            style={styles.disconnectBtn}
            onPress={handleDisconnect}
            accessibilityLabel="Desconectar dispositivo"
          >
            <Text style={styles.disconnectText}>Desconectar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        // Lista de dispositivos encontrados
        <View style={styles.scanSection}>
          <View style={styles.scanHeader}>
            <Text style={styles.sectionTitle}>
              {scanning ? "BUSCANDO..." : "DISPOSITIVOS ENCONTRADOS"}
            </Text>
            <TouchableOpacity
              onPress={scan}
              disabled={scanning}
              accessibilityLabel="Buscar dispositivos de nuevo"
            >
              <Text style={[
                styles.rescanText,
                scanning && { opacity: 0.4 },
              ]}>
                {scanning ? "Buscando..." : "🔄 Buscar"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Animación mientras escanea */}
          {scanning && devices.length === 0 && (
            <View style={styles.scanningContainer}>
              <ActivityIndicator color="#0D7E8E" size="large" />
              <Text style={styles.scanningText}>
                Asegúrate de que el dispositivo esté encendido y cerca.
              </Text>
            </View>
          )}

          {/* Lista de dispositivos */}
          {devices.length > 0 && (
            <FlatList
              data={devices}
              keyExtractor={(item) => item.id}
              renderItem={renderDevice}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ gap: 10, paddingBottom: 20 }}
            />
          )}

          {/* Sin dispositivos */}
          {!scanning && devices.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📶</Text>
              <Text style={styles.emptyTitle}>
                No se encontraron dispositivos
              </Text>
              <Text style={styles.emptyDesc}>
                Verifica que el dispositivo Braille esté encendido,
                que el Bluetooth de tu celular esté activo,
                y que estés a menos de 10 metros del dispositivo.
              </Text>
              <TouchableOpacity
                style={styles.retryBtn}
                onPress={scan}
                accessibilityLabel="Intentar de nuevo"
              >
                <Text style={styles.retryText}>Intentar de nuevo</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* Guía de uso */}
      <View style={styles.guideBox}>
        <Text style={styles.guideTitle}>💡 ¿Cómo conectar?</Text>
        <Text style={styles.guideText}>
          1. Enciende el dispositivo Braille.{"\n"}
          2. Espera a que aparezca en la lista.{"\n"}
          3. Toca su nombre para conectarlo.{"\n"}
          4. El dispositivo vibrará al conectarse.
        </Text>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A1628",
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 16,
    paddingBottom: 8,
  },
  backText:  { color: "#C8D8E8", fontSize: 16 },
  title: {
    fontSize: 20,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  stateCard: {
    backgroundColor: "#111E30",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginVertical: 16,
  },
  stateDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    justifyContent: "center",
    alignItems: "center",
  },
  stateInfo: { flex: 1 },
  stateLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  stateDevice: {
    fontSize: 12,
    color: "#C8D8E8",
    marginTop: 2,
  },
  stateIcon: { fontSize: 24 },
  errorBox: {
    backgroundColor: "#2A0A0A",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  errorText: { color: "#F5A623", fontSize: 13 },
  scanSection: { flex: 1 },
  scanHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
    letterSpacing: 1.5,
  },
  rescanText: {
    color: "#0D7E8E",
    fontSize: 14,
    fontWeight: "600",
  },
  scanningContainer: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 16,
  },
  scanningText: {
    color: "#64748B",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
  },
  scanDot: {
    position: "absolute",
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#0D7E8E",
    opacity: 0.4,
  },
  deviceCard: {
    backgroundColor: "#111E30",
    borderRadius: 14,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  deviceCardConnected: {
    borderColor: "#0A7C5E",
    backgroundColor: "#0A1F15",
  },
  deviceIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#1B3A6B",
    justifyContent: "center",
    alignItems: "center",
  },
  deviceIconConnected: { backgroundColor: "#0A7C5E" },
  deviceIconText: { fontSize: 22 },
  deviceInfo:  { flex: 1 },
  deviceName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  deviceId: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
  batteryText: {
    fontSize: 11,
    color: "#0A7C5E",
    marginTop: 4,
  },
  deviceRight: {
    alignItems: "flex-end",
    gap: 4,
  },
  connectedBadge: {
    backgroundColor: "#0A7C5E",
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  signalBars: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 3,
  },
  signalBar: {
    width: 5,
    borderRadius: 2,
  },
  signalBarActive:   { backgroundColor: "#0D7E8E" },
  signalBarInactive: { backgroundColor: "#1E3A5F" },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 12,
  },
  emptyIcon:  { fontSize: 48 },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  emptyDesc: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 20,
  },
  retryBtn: {
    backgroundColor: "#1B3A6B",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 28,
    marginTop: 8,
  },
  retryText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
  controlPanel: { flex: 1 },
  batteryBar: {
    backgroundColor: "#111E30",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    gap: 8,
  },
  batteryLabel: {
    color: "#C8D8E8",
    fontSize: 13,
  },
  batteryTrack: {
    height: 8,
    backgroundColor: "#1E3A5F",
    borderRadius: 4,
    overflow: "hidden",
  },
  batteryFill: {
    height: 8,
    borderRadius: 4,
  },
  batteryPercent: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
    textAlign: "right",
  },
  testTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  testGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
  },
  testBtn: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "#111E30",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    gap: 6,
  },
  testBtnIcon:  { fontSize: 24 },
  testBtnLabel: { color: "#C8D8E8", fontSize: 12, fontWeight: "600" },
  disconnectBtn: {
    backgroundColor: "#2A0A0A",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#7C1A0A",
  },
  disconnectText: {
    color: "#F5A623",
    fontWeight: "700",
    fontSize: 15,
  },
  guideBox: {
    backgroundColor: "#111E30",
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
  },
  guideTitle: {
    color: "#F5A623",
    fontWeight: "700",
    fontSize: 13,
    marginBottom: 8,
  },
  guideText: {
    color: "#64748B",
    fontSize: 13,
    lineHeight: 24,
  },
});