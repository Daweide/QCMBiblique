import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import GameCard from '../components/GameCard';
import ShareBlessingCard from '../components/ShareBlessingCard';

const TestCardsScreen = () => {
  const [currentCard, setCurrentCard] = useState(null);
  const [showShareCard, setShowShareCard] = useState(false);

  // Données fictives pour tester la carte de partage
  const mockPlayers = [
    { id: 1, name: 'Marie', score: 15 },
    { id: 2, name: 'Jean', score: 12 },
    { id: 3, name: 'Pierre', score: 10 },
    { id: 4, name: 'Sarah', score: 8 }
  ];

  const cardTypes = [
    { type: 'blessing', name: 'Bénédiction', color: '#4CAF50' },
    { type: 'trial', name: 'Épreuve de la vie', color: '#f44336' },
    { type: 'revelation', name: 'Révélation Divine', color: '#9C27B0' },
    { type: 'reversal', name: 'Les derniers seront les premiers', color: '#FF5722' },
    { type: 'miracle', name: 'Miracle', color: '#2196F3' },
    { type: 'share', name: 'Partage de bénédiction', color: '#00BCD4' }
  ];

  const handleCardSelect = (type) => {
    if (type === 'share') {
      setShowShareCard(true);
    } else {
      setCurrentCard(type);
    }
  };

  const handleShareBonus = (targetPlayerId) => {
    // Bonus partagé avec le joueur: targetPlayerId
    setShowShareCard(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.gradient}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Test des Cartes</Text>
            <Text style={styles.subtitle}>
              Appuyez sur une carte pour la voir
            </Text>
          </View>

          <View style={styles.cardsGrid}>
            {cardTypes.map((card, index) => (
              <TouchableOpacity
                key={card.type}
                style={[styles.cardButton, { backgroundColor: card.color }]}
                onPress={() => handleCardSelect(card.type)}
              >
                <Text style={styles.cardButtonText}>{card.name}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => {
              setCurrentCard(null);
              setShowShareCard(false);
            }}
          >
            <Text style={styles.closeButtonText}>Fermer toutes les cartes</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Affichage des cartes normales */}
        <GameCard
          type={currentCard}
          visible={currentCard !== null}
          onClose={() => setCurrentCard(null)}
        />

        {/* Affichage de la carte de partage */}
        {showShareCard && (
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10000, elevation: 10000 }}>
            <ShareBlessingCard
              visible={true}
              players={mockPlayers}
              currentPlayerId={2} // Jean est le joueur actuel
              onSelectPlayer={handleShareBonus}
              onClose={() => setShowShareCard(false)}
            />
          </View>
        )}
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
    paddingBottom: 50,
  },
  header: {
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.8,
  },
  cardsGrid: {
    paddingHorizontal: 20,
  },
  cardButton: {
    marginBottom: 15,
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  cardButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    marginHorizontal: 20,
    marginTop: 20,
    padding: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
});

export default TestCardsScreen;