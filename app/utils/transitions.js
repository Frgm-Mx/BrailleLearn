// ============================================================
// TRANSITIONS — Animaciones de navegación para la app Braille
// Uso: pasar como `options` en el Stack.Screen de React Navigation
// ============================================================

import { Animated, Easing } from "react-native";

// ── Duración base ─────────────────────────────────────────────
const DURATION = 320;

// ── 1. Slide desde la derecha (estándar iOS) ─────────────────
export const slideFromRight = {
  cardStyleInterpolator: ({ current, next, layouts }) => {
    const translateX = current.progress.interpolate({
      inputRange: [0, 1],
      outputRange: [layouts.screen.width, 0],
    });
    const nextTranslateX = next
      ? next.progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -layouts.screen.width * 0.3],
        })
      : 0;
    return {
      cardStyle: { transform: [{ translateX }] },
      containerStyle: {
        // Pantalla que queda detrás se mueve ligeramente a la izquierda
        transform: [{ translateX: nextTranslateX }],
      },
    };
  },
  transitionSpec: {
    open: {
      animation: "spring",
      config: { stiffness: 260, damping: 28, mass: 1, overshootClamping: false },
    },
    close: {
      animation: "spring",
      config: { stiffness: 260, damping: 28, mass: 1 },
    },
  },
};

// ── 2. Fade suave ─────────────────────────────────────────────
export const fadeTransition = {
  cardStyleInterpolator: ({ current }) => ({
    cardStyle: {
      opacity: current.progress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1],
      }),
    },
  }),
  transitionSpec: {
    open:  { animation: "timing", config: { duration: DURATION, easing: Easing.out(Easing.ease) } },
    close: { animation: "timing", config: { duration: DURATION, easing: Easing.in(Easing.ease) } },
  },
};

// ── 3. Scale + Fade (para modales y pantallas de juego) ───────
export const scaleUpTransition = {
  cardStyleInterpolator: ({ current }) => ({
    cardStyle: {
      opacity: current.progress.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0, 0.8, 1],
      }),
      transform: [
        {
          scale: current.progress.interpolate({
            inputRange: [0, 1],
            outputRange: [0.92, 1],
          }),
        },
      ],
    },
  }),
  transitionSpec: {
    open:  { animation: "timing", config: { duration: 350, easing: Easing.out(Easing.back(1.2)) } },
    close: { animation: "timing", config: { duration: 250, easing: Easing.in(Easing.ease) } },
  },
};

// ── 4. Slide desde abajo (para ajustes / bluetooth) ───────────
export const slideFromBottom = {
  cardStyleInterpolator: ({ current, layouts }) => ({
    cardStyle: {
      transform: [
        {
          translateY: current.progress.interpolate({
            inputRange: [0, 1],
            outputRange: [layouts.screen.height, 0],
          }),
        },
      ],
    },
    overlayStyle: {
      opacity: current.progress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 0.5],
      }),
    },
  }),
  transitionSpec: {
    open: {
      animation: "spring",
      config: { stiffness: 300, damping: 30, mass: 1 },
    },
    close: {
      animation: "spring",
      config: { stiffness: 300, damping: 30, mass: 1 },
    },
  },
};

// ── 5. Flip horizontal (para cambio de modo en Learn) ─────────
export const flipTransition = {
  cardStyleInterpolator: ({ current }) => {
    const rotateY = current.progress.interpolate({
      inputRange: [0, 1],
      outputRange: ["90deg", "0deg"],
    });
    return {
      cardStyle: {
        opacity: current.progress.interpolate({
          inputRange: [0, 0.3, 1],
          outputRange: [0, 1, 1],
        }),
        transform: [{ perspective: 800 }, { rotateY }],
      },
    };
  },
  transitionSpec: {
    open:  { animation: "timing", config: { duration: 380, easing: Easing.out(Easing.ease) } },
    close: { animation: "timing", config: { duration: 280, easing: Easing.in(Easing.ease) } },
  },
};