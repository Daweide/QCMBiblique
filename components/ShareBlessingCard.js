import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { Ionicons } from '@expo/vector-icons';
import Avatar from './Avatar';

const { width, height } = Dimensions.get('window');

const ShareBlessingCard = ({ visible, players, currentPlayerId, onSelectPlayer, onClose }) => {
  const [selectedPlayerId, setSelectedPlayerId] = useState(null);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    // ShareBlessingCard mounted
    if (visible) {
      setIsClosing(false);
    }
  }, [visible]);

  const handleConfirm = () => {
    if (isClosing) return; // Empêcher les doubles clics
    setIsClosing(true);
    onSelectPlayer(selectedPlayerId);
    onClose();
    setSelectedPlayerId(null);
  };

  const handleSkip = () => {
    if (isClosing) return; // Empêcher les doubles clics
    setIsClosing(true);
    onSelectPlayer(null); // Ne donner le bonus à personne
    onClose();
    setSelectedPlayerId(null);
  };

  // Filtrer pour ne pas afficher le joueur actuel
  const otherPlayers = players.filter(p => p.id !== currentPlayerId);
  
  // ShareBlessingCard rendering with filtered players

  return (
    <Modal
      transparent={true}
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.overlay}
        activeOpacity={1}
        onPress={() => {/* Overlay pressed */}}
      >
        <View style={styles.cardContainer}>
          <LinearGradient
            colors={['#FFD700', '#FFA500', '#FF8C00']}
            style={styles.card}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {/* En-tête */}
            <View style={styles.header}>
              <Text style={styles.title}>🎉 Félicitations ! 🎉</Text>
              <Text style={styles.subtitle}>3 bonnes réponses consécutives !</Text>
            </View>

            {/* Message */}
            <View style={styles.messageContainer}>
              <View style={styles.iconCircle}>
                <Ionicons name="gift" size={50} color="#FFF" />
              </View>
              <Text style={styles.message}>
                Vous pouvez offrir{'\n'}
                <Text style={styles.bonusText}>+1 Point Bénédiction</Text>{'\n'}
                à un joueur de votre choix
              </Text>
            </View>

            {/* Liste des joueurs */}
            <ScrollView style={styles.playersList} showsVerticalScrollIndicator={false}>
              {otherPlayers.map((player) => (
                <TouchableOpacity
                  key={player.id}
                  style={[
                    styles.playerItem,
                    selectedPlayerId === player.id && styles.playerItemSelected
                  ]}
                  onPress={() => setSelectedPlayerId(player.id)}
                >
                  <Avatar name={player.name} size={40} textSize={16} />
                  <View style={styles.playerInfo}>
                    <Text style={styles.playerName}>{player.name}</Text>
                    <Text style={styles.playerScore}>{player.score} points</Text>
                  </View>
                  {selectedPlayerId === player.id && (
                    <Ionicons name="checkmark-circle" size={24} color="#28a745" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Boutons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.skipButton]}
                onPress={handleSkip}
              >
                <Text style={styles.skipButtonText}>Ne donner à personne</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.button, 
                  styles.confirmButton,
                  !selectedPlayerId && styles.disabledButton
                ]}
                onPress={handleConfirm}
                disabled={!selectedPlayerId}
              >
                <Text style={styles.confirmButtonText}>
                  {selectedPlayerId ? 'Offrir la bénédiction' : 'Choisissez un joueur'}
                </Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContainer: {
    width: width * 0.9,
    maxWidth: 400,
    maxHeight: height * 0.7,
  },
  card: {
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  messageContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  message: {
    fontSize: 18,
    color: '#FFF',
    textAlign: 'center',
    lineHeight: 26,
  },
  bonusText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
  },
  playersList: {
    maxHeight: 200,
    marginBottom: 20,
  },
  playerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  playerItemSelected: {
    borderColor: '#28a745',
    backgroundColor: 'rgba(255, 255, 255, 1)',
  },
  playerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  playerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  playerScore: {
    fontSize: 14,
    color: '#666',
  },
  buttonContainer: {
    gap: 10,
  },
  button: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  skipButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  confirmButton: {
    backgroundColor: '#28a745',
  },
  disabledButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    opacity: 0.7,
  },
  skipButtonText: {
    fontSize: 16,
    color: '#FFF',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
});

export default ShareBlessingCard;