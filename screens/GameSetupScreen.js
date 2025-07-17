import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { Ionicons } from '@expo/vector-icons';

const GameSetupScreen = ({ navigation }) => {
  const [numberOfPlayers, setNumberOfPlayers] = useState('2');
  const [targetScore, setTargetScore] = useState('10');

  const handleNext = () => {
    const players = parseInt(numberOfPlayers);
    const target = parseInt(targetScore);

    if (players < 1 || players > 8) {
      Alert.alert('Erreur', 'Le nombre de joueurs doit être entre 1 et 8');
      return;
    }

    if (target < 5 || target > 50) {
      Alert.alert('Erreur', 'Le nombre de points doit être entre 5 et 50');
      return;
    }

    navigation.navigate('PlayerSetup', { numberOfPlayers: players, targetScore: target });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.gradient}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Animatable.View animation="fadeInDown" duration={1000} style={styles.header}>
            <Ionicons name="book" size={60} color="#fff" />
            <Text style={styles.title}>Bible Quiz</Text>
            <Text style={styles.subtitle}>Configuration du jeu</Text>
          </Animatable.View>

          <Animatable.View animation="fadeInUp" delay={500} duration={1000} style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nombre de participants</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={numberOfPlayers}
                  onChangeText={setNumberOfPlayers}
                  keyboardType="numeric"
                  maxLength={1}
                />
                <Text style={styles.inputSuffix}>joueur(s)</Text>
              </View>
              <Text style={styles.hint}>Entre 1 et 8 joueurs</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Points pour gagner</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={targetScore}
                  onChangeText={setTargetScore}
                  keyboardType="numeric"
                  maxLength={2}
                />
                <Text style={styles.inputSuffix}>points</Text>
              </View>
              <Text style={styles.hint}>Entre 5 et 50 points</Text>
            </View>

            <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
              <LinearGradient
                colors={['#ff6b6b', '#ee5a52']}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>Suivant</Text>
                <Ionicons name="arrow-forward" size={24} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </Animatable.View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 50,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#fff',
    opacity: 0.8,
    marginTop: 10,
    textAlign: 'center',
  },
  formContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 30,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  inputGroup: {
    marginBottom: 30,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderWidth: 2,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  input: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#495057',
    paddingVertical: 10,
    textAlign: 'center',
  },
  inputSuffix: {
    fontSize: 16,
    color: '#6c757d',
    marginLeft: 10,
  },
  hint: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 5,
    fontStyle: 'italic',
  },
  nextButton: {
    marginTop: 20,
    borderRadius: 15,
    overflow: 'hidden',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 30,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginRight: 10,
  },
});

export default GameSetupScreen;