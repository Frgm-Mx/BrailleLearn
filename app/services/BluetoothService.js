// ============================================================
// BLUETOOTH SERVICE
// Maneja toda la comunicación BLE entre la app y el ESP32
// Usa la librería react-native-ble-plx
// ============================================================

import { BleManager, State } from "react-native-ble-plx";
import { NativeModules, Platform, PermissionsAndroid } from "react-native";
import { BrailleContext } from "../data/brailleAlphabet";

// ── UUID del servicio y características ──────────────────────
// Estos deben coincidir EXACTAMENTE con los que defines
// en el firmware del ESP32
const BRAILLE_SERVICE_UUID      = "12345678-1234-1234-1234-123456789ABC";
const CHARACTERISTIC_INPUT_UUID = "12345678-1234-1234-1234-123456789ABD"; // ESP32 → App
const CHARACTERISTIC_OUTPUT_UUID= "12345678-1234-1234-1234-123456789ABE"; // App → ESP32

// ── Comandos que la app envía al ESP32 ────────────────────────
export const COMMANDS = {
  // Servos
  RAISE_DOT:    (dot)  => `SR:${dot}`,        // Sube el servo del punto N
  LOWER_DOT:    (dot)  => `SL:${dot}`,        // Baja el servo del punto N
  SHOW_PATTERN: (dots) => `SP:${dots.join(",")}`, // Muestra un patrón completo
  RESET_ALL:    ()     => "SA:0",             // Baja todos los servos

  // Audio del dispositivo
  PLAY_AUDIO:   (file) => `PA:${file}`,       // Reproduce archivo en DFPlayer
  SET_VOLUME:   (vol)  => `PV:${vol}`,        // Volumen 0-30

  // Vibración
  VIBRATE:      (ms)   => `VA:${ms}`,         // Vibra N milisegundos
  VIBRATE_PATTERN: (p) => `VP:${p}`,          // Patrón de vibración

  // Sistema
  PING:         ()     => "SYS:PING",         // Verifica conexión
  SET_MODE:     (mode) => `SYS:MODE:${mode}`, // Cambia modo del dispositivo
};

// ── Estados de conexión ───────────────────────────────────────
export const CONNECTION_STATE = {
  DISCONNECTED:  "disconnected",
  SCANNING:      "scanning",
  CONNECTING:    "connecting",
  CONNECTED:     "connected",
  ERROR:         "error",
};

/** react-native-ble-plx solo funciona con código nativo enlazado (p. ej. `npx expo run:android`), no en Expo Go. */
export function isBleNativeAvailable() {
  return NativeModules.BlePlx != null;
}

export const BLE_UNAVAILABLE_MESSAGE =
  "Bluetooth BLE no disponible en este cliente. Cierra Expo Go y ejecuta: npx expo run:android (o run:ios) para generar una app con el módulo nativo.";

// ── Clase principal del servicio ──────────────────────────────
class BluetoothService {
  constructor() {
    // Evita `createClient` de null si BlePlx no está en el binario (Expo Go, etc.)
    this.manager         = isBleNativeAvailable() ? new BleManager() : null;
    this.device          = null;
    this.context         = new BrailleContext();
    this.connectionState = CONNECTION_STATE.DISCONNECTED;
    this.listeners       = {};       // callbacks registrados
    this.reconnectTimer  = null;
    this.pingInterval    = null;
    this.lastDeviceId    = null;     // para reconexión automática
  }

  // ── PERMISOS ─────────────────────────────────────────────────
  async requestPermissions() {
    if (Platform.OS === "android") {
      const apiLevel = Platform.Version;

      if (apiLevel >= 31) {
        // Android 12+
        const results = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);
        return Object.values(results).every(
          (r) => r === PermissionsAndroid.RESULTS.GRANTED
        );
      } else {
        // Android < 12
        const result = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        return result === PermissionsAndroid.RESULTS.GRANTED;
      }
    }
    // iOS no necesita permisos explícitos aquí
    return true;
  }

  // ── VERIFICAR BLUETOOTH ACTIVO ────────────────────────────────
  async isBluetoothEnabled() {
    if (!this.manager) return false;
    const state = await this.manager.state();
    return state === State.PoweredOn;
  }

  // ── ESCANEO ───────────────────────────────────────────────────
  async startScan(onDeviceFound, onError) {
    if (!this.manager) {
      onError(BLE_UNAVAILABLE_MESSAGE);
      return;
    }

    const hasPermissions = await this.requestPermissions();
    if (!hasPermissions) {
      onError("Permisos de Bluetooth denegados.");
      return;
    }

    const btEnabled = await this.isBluetoothEnabled();
    if (!btEnabled) {
      onError("El Bluetooth está apagado. Actívalo e intenta de nuevo.");
      return;
    }

    this.setConnectionState(CONNECTION_STATE.SCANNING);
    const found = new Set();

    this.manager.startDeviceScan(
      [BRAILLE_SERVICE_UUID], // Filtra solo dispositivos Braille
      { allowDuplicates: false },
      (error, device) => {
        if (error) {
          this.setConnectionState(CONNECTION_STATE.ERROR);
          onError(error.message);
          return;
        }
        if (device && !found.has(device.id)) {
          found.add(device.id);
          onDeviceFound({
            id:   device.id,
            name: device.name || "Dispositivo Braille",
            rssi: device.rssi, // Intensidad de señal
          });
        }
      }
    );

    // Detiene el escaneo después de 15 segundos
    setTimeout(() => this.stopScan(), 15000);
  }

  stopScan() {
    if (!this.manager) return;
    this.manager.stopDeviceScan();
    if (this.connectionState === CONNECTION_STATE.SCANNING) {
      this.setConnectionState(CONNECTION_STATE.DISCONNECTED);
    }
  }

  // ── CONEXIÓN ──────────────────────────────────────────────────
  async connect(deviceId) {
    if (!this.manager) {
      this.setConnectionState(CONNECTION_STATE.ERROR);
      this.emit("error", BLE_UNAVAILABLE_MESSAGE);
      return false;
    }

    try {
      this.stopScan();
      this.setConnectionState(CONNECTION_STATE.CONNECTING);
      this.lastDeviceId = deviceId;

      // Conectar al dispositivo
      this.device = await this.manager.connectToDevice(deviceId, {
        autoConnect: false,
        timeout: 10000,
      });

      // Descubrir servicios y características
      await this.device.discoverAllServicesAndCharacteristics();

      // Verificar que el servicio Braille existe
      const services = await this.device.services();
      const brailleService = services.find(
        (s) => s.uuid.toUpperCase() === BRAILLE_SERVICE_UUID.toUpperCase()
      );

      if (!brailleService) {
        throw new Error("El dispositivo no tiene el servicio Braille esperado.");
      }

      this.setConnectionState(CONNECTION_STATE.CONNECTED);
      this.emit("connected", { deviceId, name: this.device.name });

      // Iniciar escucha de datos del ESP32
      this.startListening();

      // Iniciar heartbeat para detectar desconexiones
      this.startHeartbeat();

      // Manejar desconexión inesperada
      this.device.onDisconnected((error) => {
        this.handleDisconnection(error);
      });

      return true;

    } catch (error) {
      this.setConnectionState(CONNECTION_STATE.ERROR);
      this.emit("error", error.message);
      return false;
    }
  }

  // ── ESCUCHA DE DATOS DEL ESP32 ────────────────────────────────
  startListening() {
    if (!this.device) return;

    this.device.monitorCharacteristicForService(
      BRAILLE_SERVICE_UUID,
      CHARACTERISTIC_INPUT_UUID,
      (error, characteristic) => {
        if (error) {
          console.warn("Error en monitoreo BLE:", error.message);
          return;
        }
        if (characteristic?.value) {
          this.handleIncomingData(characteristic.value);
        }
      }
    );
  }

  // ── PROCESAR DATOS RECIBIDOS ──────────────────────────────────
  // El ESP32 manda paquetes en base64
  // Formato: "BTN:1,3,5" (botones presionados)
  //          "MODE:learn" (cambio de modo)
  //          "BAT:85" (nivel de batería)
  handleIncomingData(base64Value) {
    try {
      // Decodifica de base64 a string
      const raw     = atob(base64Value);
      const [type, payload] = raw.split(":");

      switch (type) {
        case "BTN": {
          // El usuario presionó botones en el dispositivo físico
          const dots = payload
            .split(",")
            .map(Number)
            .filter((n) => n >= 1 && n <= 6);

          const result = this.context.interpret(dots);
          this.emit("buttonPress", { dots, result });
          break;
        }

        case "MODE": {
          // El usuario cambió de modo desde el dispositivo
          this.emit("modeChange", { mode: payload });
          break;
        }

        case "BAT": {
          // Nivel de batería del dispositivo
          const level = parseInt(payload, 10);
          this.emit("batteryLevel", { level });
          break;
        }

        case "PONG": {
          // Respuesta al heartbeat
          this.emit("pong");
          break;
        }

        default:
          console.warn("Paquete BLE desconocido:", raw);
      }
    } catch (e) {
      console.warn("Error procesando dato BLE:", e);
    }
  }

  // ── ENVIAR COMANDOS AL ESP32 ──────────────────────────────────
  async sendCommand(command) {
    if (!this.device || this.connectionState !== CONNECTION_STATE.CONNECTED) {
      console.warn("No hay dispositivo conectado para enviar comando.");
      return false;
    }

    try {
      // Codifica el comando en base64 para BLE
      const encoded = btoa(command);
      await this.device.writeCharacteristicWithResponseForService(
        BRAILLE_SERVICE_UUID,
        CHARACTERISTIC_OUTPUT_UUID,
        encoded
      );
      return true;
    } catch (error) {
      console.warn("Error enviando comando BLE:", error.message);
      return false;
    }
  }

  // ── COMANDOS DE ALTO NIVEL ────────────────────────────────────
  // Estos son los que usas directamente en las pantallas

  // Muestra un patrón Braille en los servos
  async showPattern(dots) {
    await this.sendCommand(COMMANDS.RESET_ALL());
    await this.sendCommand(COMMANDS.SHOW_PATTERN(dots));
  }

  // Enseña una letra: mueve servos + reproduce audio
  async teachLetter(letter, dots, audioFile) {
    await this.showPattern(dots);
    await this.sendCommand(COMMANDS.PLAY_AUDIO(audioFile));
  }

  // Feedback correcto: vibración corta + audio
  async feedbackCorrect() {
    await this.sendCommand(COMMANDS.VIBRATE(200));
    await this.sendCommand(COMMANDS.PLAY_AUDIO("correcto"));
  }

  // Feedback incorrecto: vibración larga
  async feedbackWrong() {
    await this.sendCommand(COMMANDS.VIBRATE(600));
    await this.sendCommand(COMMANDS.PLAY_AUDIO("incorrecto"));
  }

  // Resetea todos los servos a posición baja
  async resetServos() {
    await this.sendCommand(COMMANDS.RESET_ALL());
  }

  // ── HEARTBEAT ─────────────────────────────────────────────────
  startHeartbeat() {
    clearInterval(this.pingInterval);
    this.pingInterval = setInterval(async () => {
      const ok = await this.sendCommand(COMMANDS.PING());
      if (!ok) this.handleDisconnection(new Error("Heartbeat falló"));
    }, 5000);
  }

  // ── DESCONEXIÓN ───────────────────────────────────────────────
  handleDisconnection(error) {
    clearInterval(this.pingInterval);
    this.setConnectionState(CONNECTION_STATE.DISCONNECTED);
    this.emit("disconnected", { error: error?.message });

    // Intenta reconectar automáticamente después de 3 segundos
    if (this.lastDeviceId) {
      this.reconnectTimer = setTimeout(() => {
        this.connect(this.lastDeviceId);
      }, 3000);
    }
  }

  async disconnect() {
    clearInterval(this.pingInterval);
    clearTimeout(this.reconnectTimer);
    if (this.device) {
      await this.device.cancelConnection();
      this.device = null;
    }
    this.lastDeviceId = null;
    this.setConnectionState(CONNECTION_STATE.DISCONNECTED);
  }

  // ── SISTEMA DE EVENTOS ────────────────────────────────────────
  // Permite que las pantallas se suscriban a eventos BLE
  on(event, callback) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
    // Devuelve función para desuscribirse
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(
      (cb) => cb !== callback
    );
  }

  emit(event, data) {
    if (!this.listeners[event]) return;
    this.listeners[event].forEach((cb) => cb(data));
  }

  setConnectionState(state) {
    this.connectionState = state;
    this.emit("connectionState", { state });
  }

  // Resetea el contexto Braille al iniciar nueva sesión
  resetContext() {
    this.context.reset();
  }

  isConnected() {
    return this.connectionState === CONNECTION_STATE.CONNECTED;
  }
}

// Exporta una única instancia compartida por toda la app
// Así todas las pantallas usan el mismo servicio
export default new BluetoothService();