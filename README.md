BrailleBox — Dispositivo Educativo para la Enseñanza del Sistema Braille

Proyecto de Investigación e Innovación Tecnológica
Tecnológico Superior de San Felipe del Progreso


Descripción

BrailleBox es un dispositivo educativo embebido de código abierto que permite aprender el sistema Braille de forma táctil e interactiva. Utiliza seis servomotores SG90 como actuadores dinámicos que levantan y bajan pines físicos para representar caracteres Braille, complementado con una aplicación móvil en React Native que se comunica vía Bluetooth Low Energy (BLE).

El dispositivo opera en modo offline completo — las lecciones y el progreso del usuario se almacenan localmente en el ESP32. La aplicación móvil funciona como capa de mejora opcional.

Perfiles de usuario soportados:

PerfilCanal principalCanal secundarioCiegoTactil (pines Braille) + AudioHaptico (vibracion)SordoTactil (pines Braille) + LED RGBHaptico (vibracion)SordociegoTactil exclusivoHaptico (vibracion)


Stack Tecnologico

Firmware: ESP32 Arduino Core 3.x + BLE (Bluedroid)
App movil: React Native 0.81 + Expo SDK 54 + react-native-ble-plx + TypeScript
Comunicacion: Bluetooth Low Energy 5.0 — protocolo GATT propio
Hardware: ESP32 DevKit V1 + 6x SG90 + LED RGB + carcasa PLA impresa en 3D


Instalacion y ejecucion

Firmware ESP32

1. Abrir firmware/braillebox.ino en Arduino IDE
2. Seleccionar placa: ESP32 Dev Module
3. Seleccionar el puerto COM correspondiente
4. Cargar el firmware

Comandos de debug por Serial Monitor (115200 baud):

A / E / I / O / U   mostrar vocal en modo ensenanza
PRACTICE            iniciar practica de eliminacion
PIN_TOGGLE:3        alternar pin 3 arriba/abajo
CONFIRM:100000      validar patron de 6 bits
RESET               bajar todos los pines
STATUS              solicitar estado actual

Aplicacion movil

# Instalar dependencias
npm install

# Instalar modulos nativos
npx expo install react-native-ble-plx expo-dev-client expo-build-properties

# Compilar para Android (primera vez, ~10 minutos)
npx expo run:android

# Recargar sin recompilar tras cambios de codigo
npx expo start --dev-client

Requisitos:


Android 7.0 o superior (API 24+)
Bluetooth 4.2 BLE
No funciona en Expo Go — requiere development build


Generar APK de distribucion

# Opcion A — Compilacion en la nube (requiere cuenta en expo.dev)
npm install -g eas-cli
eas login
eas build --platform android --profile preview

# Opcion B — Compilacion local
cd android
./gradlew assembleRelease


Protocolo BLE

UUIDs

Service UUID : 12345678-1234-1234-1234-123456789012
CMD UUID     : 12345678-1234-1234-1234-123456789013  (WRITE)
STATE UUID   : 12345678-1234-1234-1234-123456789014  (NOTIFY)

Comandos recibidos por el ESP32 (App a ESP32)

ComandoDescripcionA / E / I / O / UMostrar vocal en modo ensenanzaPRACTICEIniciar practica de eliminacionPIN_TOGGLE:NAlternar pin N (1 al 6)CONFIRM:XXXXXXValidar patron de 6 bits (ej. 101010)HINTMostrar letra correcta durante 2 segundosNEXTSiguiente letraRESETBajar todos los pinesSTATUSSolicitar estado actual

Notificaciones enviadas por el ESP32 (ESP32 a App)

MensajeDescripcionCONNECTEDESP32 listo y sincronizadoPATTERN:XXXXXX:AEnsenanza — patron de 6 bits mas letraELIM_START:XXXXXXTodos los pines arriba, practica listaPIN_STATE:XXXXXXEstado actual de los 6 pinesRESULT:CORRECT:ARespuesta correctaRESULT:WRONG:A:15Respuesta incorrecta — letra correcta y puntosSCORE:3:5Puntaje — aciertos sobre intentosTIMEOUTTiempo de practica agotado


Mapa de pines ESP32

Servos (LEDC PWM 50Hz, resolucion 16 bits):
  p1 -> GPIO 13      p4 -> GPIO 25
  p2 -> GPIO 27      p5 -> GPIO 15
  p3 -> GPIO 26      p6 -> GPIO 2

LED RGB:
  Rojo   -> GPIO 4  (220 ohm)
  Verde  -> GPIO 5  (150 ohm)
  Azul   -> GPIO 18 (100 ohm)

Valores de duty cycle:
  Posicion ABAJO : 700 us  -> 2293 (16-bit)
  Posicion ARRIBA: 1800 us -> 5898 (16-bit)


Modos de aprendizaje

Exploracion

El usuario selecciona una vocal. Los pines del patron suben con torque activo — el usuario los siente firmes y los memoriza. Basado en la etapa de apresto de la metodologia ONCE para ensenanza Braille.

Eliminacion

Todos los pines suben durante 3 segundos para que el usuario memorice el patron. Despues bajan y el usuario debe reproducirlo de memoria presionando los pines incorrectos hacia abajo. Basado en recall activo.

Reconoce

El dispositivo muestra un patron con torque activo. El usuario lo siente y selecciona la letra correspondiente en la app. Usa un algoritmo de repeticion espaciada que prioriza las letras con mayor tasa de error.

score = (1 - tasa_aciertos) x 3 + min(minutos_desde_ultima_practica, 10) x 0.1

Velocidad

Serie de 10 letras consecutivas contra el tiempo. Consolida el reconocimiento automatico por exposicion repetida.


Funcionalidades del firmware


Control de 6 servos SG90 via LEDC PWM de 16 bits a 50 Hz
Arranque en cascada con 45 ms entre servos para evitar picos de corriente (anti-brownout)
Detach asincrono del PWM — el loop BLE no se bloquea por delays mecanicos
Baraja Fisher-Yates con semilla de alta entropia (64 lecturas de ADC en pin flotante)
Timeout de practica configurable (120 segundos por defecto)
Timer de ocultamiento automatico del patron (3 segundos de exposicion)
Reconexion automatica BLE con reinicio de advertising tras desconexion



Estructura del proyecto

braillebox/
├── firmware/
│   └── braillebox.ino          Firmware ESP32 v5.4
├── app/
│   ├── App.tsx                 Aplicacion React Native principal
│   ├── app.json                Configuracion Expo
│   ├── package.json
│   └── android/
│       └── local.properties    Ruta SDK Android (no incluir en git)
├── hardware/
│   ├── schematic.pdf           Esquematico del circuito
│   └── 3d-models/              Archivos STL de la carcasa Braille
├── docs/
│   └── protocol.md             Documentacion del protocolo BLE
└── README.md


Roadmap


 6 servos SG90 con control LEDC 16-bit
 Comunicacion BLE bidireccional con protocolo propio
 4 modos de aprendizaje con fundamento pedagogico
 Baraja Fisher-Yates con semilla de alta entropia
 Detach asincrono de servos para loop no bloqueante
 Aplicacion React Native con cola de mensajes BLE
 Carcasa Braille impresa en 3D con 6 pines moviles
 Microswitches bajo cada pin para deteccion automatica
 DFPlayer Mini con audio para usuarios ciegos
 DRV2605L con motor LRA para retroalimentacion haptica
 Soporte de abecedario completo (A-Z)
 Almacenamiento de progreso en NVS flash del ESP32
 Modo sordociego con canal tactico exclusivo



Contribuir


Fork del repositorio
Crear rama: git checkout -b feature/descripcion
Commit: git commit -m "feat: descripcion del cambio"
Push: git push origin feature/descripcion
Abrir Pull Request



Licencia

MIT License — ver el archivo LICENSE para detalles.
