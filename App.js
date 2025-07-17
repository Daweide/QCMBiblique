import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GameProvider } from './utils/GameContext';

import GameSetupScreen from './screens/GameSetupScreen';
import PlayerSetupScreen from './screens/PlayerSetupScreen';
import GameScreen from './screens/GameScreen';
import ResultsScreen from './screens/ResultsScreen';
import TestResultsScreen from './screens/TestResultsScreen';
import TestCardsScreen from './screens/TestCardsScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <GameProvider>
        <NavigationContainer>
          <StatusBar style="dark" />
          <Stack.Navigator
            initialRouteName="GameSetup"
            screenOptions={{
              headerShown: false,
              gestureEnabled: false,
            }}
          >
            <Stack.Screen name="GameSetup" component={GameSetupScreen} />
            <Stack.Screen name="PlayerSetup" component={PlayerSetupScreen} />
            <Stack.Screen name="Game" component={GameScreen} />
            <Stack.Screen name="Results" component={ResultsScreen} />
            <Stack.Screen name="TestResults" component={TestResultsScreen} />
            <Stack.Screen name="TestCards" component={TestCardsScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </GameProvider>
    </SafeAreaProvider>
  );
}