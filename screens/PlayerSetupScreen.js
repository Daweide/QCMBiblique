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
import { useGame } from '../utils/GameContext';
import Avatar from '../components/Avatar';

const PlayerSetupScreen = ({ route, navigation }) => {
  const { numberOfPlayers, targetScore } = route.params;
  const { dispatch } = useGame();
  
  const [players, setPlayers] = useState(
    Array.from({ length: numberOfPlayers }, (_, i) => ({
      id: i + 1,
      name: '',
      level: 'facile',
      score: 0
    }))
  );
  const levels = [
    { key: 'facile', label: 'Facile', color: '#4CAF50', gradientColors: ['#4CAF50', '#45A049'], icon: 'leaf', description: 'Questions simples' },
    { key: 'moyen', label: 'Moyen', color: '#FF9800', gradientColors: ['#FF9800', '#F57C00'], icon: 'flame', description: 'Niveau intermédiaire' },
    { key: 'difficile', label: 'Difficile', color: '#F44336', gradientColors: ['#F44336', '#D32F2F'], icon: 'flash', description: 'Expert biblique' }
  ];

  const updatePlayer = (index, field, value) => {
    const updatedPlayers = [...players];
    updatedPlayers[index][field] = value;
    setPlayers(updatedPlayers);
  };

  const handleStartGame = () => {
    const invalidPlayers = players.filter(p => !p.name.trim());
    
    if (invalidPlayers.length > 0) {
      Alert.alert('Erreur', 'Veuillez saisir le nom de tous les joueurs');
      return;
    }

    dispatch({ type: 'SET_PLAYERS', payload: players });
    dispatch({ type: 'SET_TARGET_SCORE', payload: targetScore });
    navigation.navigate('Game');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.gradient}
      >
        {/* Icônes en arrière-plan */}
        <View style={styles.backgroundIcons}>
          <Ionicons name="people-outline" size={250} style={styles.bgIcon1} />
          <Ionicons name="settings-outline" size={180} style={styles.bgIcon2} />
          <Ionicons name="game-controller-outline" size={200} style={styles.bgIcon3} />
        </View>
        
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Animatable.View animation="fadeInDown" duration={1000} style={styles.header}>
            <View style={styles.headerIcon}>
              <Ionicons name="people" size={50} color="#fff" />
            </View>
            <Text style={styles.title}>Qui va jouer ?</Text>
            <View style={styles.infoContainer}>
              <View style={styles.infoBadge}>
                <Ionicons name="people" size={16} color="#667eea" />
                <Text style={styles.infoText}>{numberOfPlayers} joueur{numberOfPlayers > 1 ? 's' : ''}</Text>
              </View>
              <View style={styles.infoBadge}>
                <Ionicons name="trophy" size={16} color="#667eea" />
                <Text style={styles.infoText}>{targetScore} points</Text>
              </View>
            </View>
          </Animatable.View>

          <View style={styles.playersContainer}>
            {players.map((player, index) => (
              <Animatable.View 
                key={player.id} 
                animation="fadeInUp" 
                delay={300 + index * 100} 
                duration={800}
              >
                <View style={styles.playerCard}>
                  <View style={styles.playerContent}>
                    <View style={styles.avatarSection}>
                      <Avatar name={player.name || `J${player.id}`} size={70} textSize={24} />
                    </View>

                    <View style={styles.inputSection}>
                      <View style={styles.inputContainer}>
                        <Ionicons name="person-outline" size={20} color="#667eea" style={styles.inputIcon} />
                        <TextInput
                          style={styles.nameInput}
                          placeholder="Entrez votre nom..."
                          placeholderTextColor="#9CA3AF"
                          value={player.name}
                          onChangeText={(text) => updatePlayer(index, 'name', text)}
                          maxLength={15}
                        />
                      </View>
                      
                      <Text style={styles.levelTitle}>Choisissez votre niveau</Text>
                      <View style={styles.levelButtons}>
                        {levels.map((level) => (
                          <TouchableOpacity
                            key={level.key}
                            style={[
                              styles.levelButton,
                              player.level === level.key && styles.levelButtonSelected
                            ]}
                            onPress={() => updatePlayer(index, 'level', level.key)}
                          >
                            {player.level === level.key ? (
                              <LinearGradient
                                colors={level.gradientColors}
                                style={styles.levelGradient}
                              >
                                <Ionicons name={level.icon} size={20} color="#fff" />
                                <Text style={styles.levelTextSelected}>{level.label}</Text>
                                <Text style={styles.levelDescription}>{level.description}</Text>
                              </LinearGradient>
                            ) : (
                              <View style={[styles.levelContent, { backgroundColor: level.color + '15' }]}>
                                <Ionicons name={level.icon} size={20} color={level.color} />
                                <Text style={[styles.levelText, { color: level.color }]}>{level.label}</Text>
                                <Text style={[styles.levelDescriptionUnselected]}>{level.description}</Text>
                              </View>
                            )}
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  </View>
                </View>
              </Animatable.View>
            ))}
          </View>

          <Animatable.View animation="bounceIn" delay={600 + numberOfPlayers * 100} duration={1000}>
            <TouchableOpacity style={styles.startButton} onPress={handleStartGame}>
              <LinearGradient
                colors={['#4CAF50', '#45A049', '#388E3C']}
                style={styles.buttonGradient}
              >
                <View style={styles.buttonContent}>
                  <Ionicons name="play-circle" size={32} color="#fff" />
                  <Text style={styles.buttonText}>Lancer la partie</Text>
                </View>
                <Ionicons name="arrow-forward" size={24} color="rgba(255,255,255,0.7)" />
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
    position: 'relative',
  },
  backgroundIcons: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  bgIcon1: {
    position: 'absolute',
    top: '-10%',
    right: '-20%',
    color: 'rgba(255, 255, 255, 0.08)',
    transform: [{ rotate: '15deg' }],
  },
  bgIcon2: {
    position: 'absolute',
    bottom: '10%',
    left: '-15%',
    color: 'rgba(255, 255, 255, 0.08)',
    transform: [{ rotate: '-20deg' }],
  },
  bgIcon3: {
    position: 'absolute',
    top: '40%',
    right: '-10%',
    color: 'rgba(255, 255, 255, 0.08)',
    transform: [{ rotate: '25deg' }],
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 30,
  },
  headerIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 15,
  },
  infoContainer: {
    flexDirection: 'row',
    gap: 15,
  },
  infoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  infoText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  playersContainer: {
    paddingTop: 10,
  },
  playerCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: 25,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 10,
    overflow: 'hidden',
  },
  playerContent: {
    flexDirection: 'row',
    padding: 20,
  },
  avatarSection: {
    alignItems: 'center',
    marginRight: 20,
  },
  inputSection: {
    flex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 15,
    paddingHorizontal: 15,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  inputIcon: {
    marginRight: 10,
  },
  nameInput: {
    flex: 1,
    paddingVertical: 15,
    fontSize: 16,
    color: '#333',
  },
  levelTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  levelButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  levelButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  levelButtonSelected: {
    borderColor: 'transparent',
  },
  levelGradient: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderRadius: 12,
  },
  levelContent: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderRadius: 12,
  },
  levelText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 4,
  },
  levelTextSelected: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 4,
  },
  levelDescription: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  levelDescriptionUnselected: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 2,
  },
  startButton: {
    marginTop: 30,
    borderRadius: 25,
    overflow: 'hidden',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 10,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
    paddingHorizontal: 30,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  buttonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default PlayerSetupScreen;