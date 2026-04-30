// Hook personalizado que conecta el BluetoothService
// con cualquier pantalla de React Native de forma limpia

import { useState, useEffect, useCallback } from "react";
import BluetoothService, {
  BLE_UNAVAILABLE_MESSAGE,
  CONNECTION_STATE,
  isBleNativeAvailable,
} from "../services/BluetoothService";

export default function useBluetooth({ onButtonPress, onModeChange } = {}) {

  const [connectionState, setConnectionState] = useState(
    BluetoothService.connectionState
  );
  const [devices, setDevices]         = useState([]);
  const [batteryLevel, setBatteryLevel] = useState(null);
  const [scanning, setScanning]       = useState(false);
  const [error, setError]             = useState(
    isBleNativeAvailable() ? null : BLE_UNAVAILABLE_MESSAGE
  );

  useEffect(() => {
    // Suscribirse a eventos del servicio BLE
    const unsubState = BluetoothService.on("connectionState", ({ state }) => {
      setConnectionState(state);
      if (state === CONNECTION_STATE.SCANNING) setScanning(true);
      else setScanning(false);
    });

    const unsubError = BluetoothService.on("error", (message) => {
      setError(message);
    });

    const unsubBattery = BluetoothService.on("batteryLevel", ({ level }) => {
      setBatteryLevel(level);
    });

    const unsubButton = BluetoothService.on("buttonPress", (data) => {
      onButtonPress?.(data);
    });

    const unsubMode = BluetoothService.on("modeChange", (data) => {
      onModeChange?.(data);
    });

    // Limpieza al desmontar la pantalla
    return () => {
      unsubState();
      unsubError();
      unsubBattery();
      unsubButton();
      unsubMode();
    };
  }, [onButtonPress, onModeChange]);

  const scan = useCallback(() => {
    setDevices([]);
    setError(null);
    BluetoothService.startScan(
      (device) => setDevices((prev) => [...prev, device]),
      (err)    => setError(err)
    );
  }, []);

  const connect = useCallback(async (deviceId) => {
    setError(null);
    return await BluetoothService.connect(deviceId);
  }, []);

  const disconnect = useCallback(async () => {
    await BluetoothService.disconnect();
  }, []);

  return {
    connectionState,
    isConnected:  connectionState === CONNECTION_STATE.CONNECTED,
    scanning,
    devices,
    batteryLevel,
    error,
    scan,
    connect,
    disconnect,
  };
}