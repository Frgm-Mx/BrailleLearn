// ============================================================
// AppNavigator — solo navegación, sin SettingsProvider propio
//
// SettingsProvider ya envuelve todo desde App.js.
// Este archivo solo define el Stack y las transiciones.
// ============================================================
import React from "react";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";

import HomeScreen      from "../screens/HomeScreen";
import LearnScreen     from "../screens/LearnScreen";
import PracticeScreen  from "../screens/PracticeScreen";
import GameScreen      from "../screens/GameScreen";
import SettingsScreen  from "../screens/SettingsScreen";
import BluetoothScreen from "../screens/BluetoothScreen";
// SettingsProvider NO se importa aquí porque ya está en App.js
import { ProgressProvider } from "../context/ProgressContext";
import ProfileScreen from "../screens/ProfileScreen";

import {
  slideFromRight,
  fadeTransition,
  scaleUpTransition,
  slideFromBottom,
} from "../utils/transitions";

const Stack = createStackNavigator();

const DarkTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: "#0A1628",
    card:       "#0A1628",
    text:       "#FFFFFF",
    border:     "transparent",
    primary:    "#F5A623",
  },
};

const commonOptions = {
  headerShown:      false,
  cardStyle:        { backgroundColor: "#0A1628" },
  gestureEnabled:   true,
  gestureDirection: "horizontal",
};

export default function AppNavigator() {
  return (
    // ⚠️ SOLO ProgressProvider aquí (SettingsProvider está en App.js)
    <ProgressProvider>
      <NavigationContainer theme={DarkTheme}>
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{ headerShown: false }}  
        >
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ ...commonOptions, ...fadeTransition, gestureEnabled: false }}
          />
          <Stack.Screen
            name="Learn"
            component={LearnScreen}
            options={{ ...commonOptions, ...slideFromRight }}
          />
          <Stack.Screen
            name="Practice"
            component={PracticeScreen}
            options={{ ...commonOptions, ...slideFromRight }}
          />
          <Stack.Screen
            name="Game"
            component={GameScreen}
            options={{ ...commonOptions, ...scaleUpTransition }}
          />
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{
              ...commonOptions,
              ...slideFromBottom,
              presentation:     "modal",
              gestureDirection: "vertical",
            }}
          />
          <Stack.Screen
            name="Bluetooth"
            component={BluetoothScreen}
            options={{
              ...commonOptions,
              ...slideFromBottom,
              presentation:     "modal",
              gestureDirection: "vertical",
            }}
          />
          <Stack.Screen
            name="Profile"
            component={ProfileScreen}
            options={{ ...commonOptions, ...slideFromRight }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </ProgressProvider>
  );
}