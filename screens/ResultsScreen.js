import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { Ionicons } from '@expo/vector-icons';
import ConfettiCannon from 'react-native-confetti-cannon';
import { useGame } from '../utils/GameContext';
import Avatar from '../components/Avatar';
import { resetQuestionCache } from '../utils/questionsLoader';

const { width } = Dimensions.get('window');

const ResultsScreen = ({ navigation }) => {
  const { state, dispatch } = useGame();
  const confettiRef1 = useRef(null);
  const confettiRef2 = useRef(null);
  const confettiRef3 = useRef(null);
  const confettiRef4 = useRef(null);
  const confettiRef5 = useRef(null);

  useEffect(() => {
    // Déclencher les confettis avec un délai
    setTimeout(() => {
      confettiRef1.current?.start();
    }, 500);
    setTimeout(() => {
      confettiRef2.current?.start();
    }, 700);
    setTimeout(() => {
      confettiRef3.current?.start();
    }, 900);
    setTimeout(() => {
      confettiRef4.current?.start();
    }, 1100);
    setTimeout(() => {
      confettiRef5.current?.start();
    }, 1300);
  }, []);
  
  const handleNewGame = () => {
    resetQuestionCache(); // Réinitialiser le cache des questions
    dispatch({ type: 'RESTART_GAME' });
    navigation.navigate('Game');
  };

  const handleBackToMenu = () => {
    dispatch({ type: 'RESET_GAME' });
    navigation.navigate('GameSetup');
  };

  const getBadge = (position) => {
    const badges = {
      1: { emoji: '🥇', color: '#FFD700', name: 'Champion' },
      2: { emoji: '🥈', color: '#C0C0C0', name: '2ème place' },
      3: { emoji: '🥉', color: '#CD7F32', name: '3ème place' }
    };
    return badges[position] || { emoji: '🎖️', color: '#87CEEB', name: 'Participant' };
  };

  const podiumHeights = [120, 150, 100];
  const podiumOrder = [1, 0, 2]; // Ordre d'affichage: 2ème, 1er, 3ème

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.gradient}
      >
        {/* Icônes en arrière-plan */}
        <View style={styles.backgroundIcons}>
          <Ionicons name="trophy-outline" size={250} style={styles.bgIcon1} />
          <Ionicons name="medal-outline" size={180} style={styles.bgIcon2} />
          <Ionicons name="ribbon-outline" size={200} style={styles.bgIcon3} />
          <Ionicons name="star-outline" size={150} style={styles.bgIcon4} />
        </View>
        
        <Animatable.View animation="fadeInDown" duration={1000} style={styles.header}>
          <Text style={styles.title}>🎉 Fin de partie! 🎉</Text>
          <Text style={styles.subtitle}>
            {state.players.length === 1 
              ? `Bravo ${state.winners[0]?.name}!`
              : state.players.length === 2
              ? `${state.winners[0]?.name} remporte la partie!`
              : 'Félicitations aux gagnants!'
            }
          </Text>
        </Animatable.View>

        <View style={styles.podiumContainer}>
          {podiumOrder.slice(0, Math.min(3, state.players.length)).map((winnerIndex, displayIndex) => {
            const player = state.winners[winnerIndex];
            if (!player) return null;
            const position = winnerIndex + 1;
            const badge = getBadge(position);
            const isWinner = position === 1;
            
            return (
              <View key={player.id} style={styles.podiumWrapper}>
                <Animatable.View
                  animation="bounceIn"
                  delay={displayIndex * 300}
                  duration={1000}
                  style={styles.playerCard}
                >
                  <Avatar name={player.name} size={40} textSize={14} />
                  <Text style={styles.playerName}>{player.name}</Text>
                  <Text style={styles.playerScore}>{player.score} pts</Text>
                  <Text style={styles.badge}>{badge.emoji}</Text>
                  <Text style={styles.badgeName}>{badge.name}</Text>
                </Animatable.View>
                <Animatable.View
                  animation="fadeInUp"
                  delay={displayIndex * 300 + 200}
                  duration={800}
                  style={[
                    styles.podiumItem,
                    { 
                      height: podiumHeights[displayIndex],
                    },
                    position === 1 && styles.goldPodium,
                    position === 2 && styles.silverPodium,
                    position === 3 && styles.bronzePodium
                  ]}
                >
                  <LinearGradient
                    colors={
                      position === 1 
                        ? ['#FFF8DC', '#FFD700', '#B8860B', '#996515']
                        : position === 2
                        ? ['#F5F5F5', '#C0C0C0', '#A8A8A8', '#808080'] 
                        : ['#F4A460', '#CD7F32', '#A0522D', '#8B4513']
                    }
                    style={styles.podiumGradient}
                  />
                  <View style={styles.podiumBase}>
                    <Text style={styles.position}>{position}</Text>
                  </View>
                </Animatable.View>
              </View>
            );
          })}
        </View>

        {state.players.length > 3 && state.winners.length === 3 && (
          <Animatable.View animation="fadeInUp" delay={1200} duration={800}>
            <View style={styles.otherPlayersContainer}>
              <Text style={styles.otherPlayersTitle}>Autres participants :</Text>
              {state.players.filter(p => !state.winners.includes(p)).map((player, index) => (
                <View key={player.id} style={styles.otherPlayerItem}>
                  <Avatar name={player.name} size={30} textSize={12} />
                  <Text style={styles.otherPlayerName}>{player.name}</Text>
                  <Text style={styles.otherPlayerScore}>{player.score} pts</Text>
                </View>
              ))}
            </View>
          </Animatable.View>
        )}

        <Animatable.View animation="fadeInUp" delay={1500} duration={800} style={styles.buttonsContainer}>
          <TouchableOpacity style={styles.button} onPress={handleNewGame}>
            <LinearGradient
              colors={['#4CAF50', '#45A049', '#388E3C']}
              style={styles.buttonGradient}
            >
              <View style={styles.buttonContent}>
                <Ionicons name="play-circle" size={28} color="#fff" />
                <Text style={styles.buttonText}>Nouvelle partie</Text>
              </View>
              <Ionicons name="arrow-forward" size={20} color="rgba(255,255,255,0.7)" />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.button, styles.buttonSecondary]} onPress={handleBackToMenu}>
            <LinearGradient
              colors={['#6B7280', '#4B5563', '#374151']}
              style={styles.buttonGradient}
            >
              <View style={styles.buttonContent}>
                <Ionicons name="home" size={24} color="#fff" />
                <Text style={styles.buttonText}>Menu principal</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animatable.View>

        <Animatable.View 
          animation="pulse" 
          iterationCount="infinite"
          duration={3000}
          style={styles.congratulations}
        >
          <Text style={styles.congratulationsText}>
            {state.players.length === 2 
              ? `Partie serrée entre ${state.players[0].name} et ${state.players[1].name}! 🎯`
              : "Merci d'avoir joué au Bible Quiz! 📖✨"
            }
          </Text>
        </Animatable.View>
        
        {/* Confettis du bas */}
        <ConfettiCannon
          ref={confettiRef1}
          count={100}
          origin={{x: width / 2, y: 0}}
          autoStart={false}
          fadeOut={true}
          duration={4000}
          fallSpeed={3500}
          explosionSpeed={500}
          colors={['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffa500', '#ff69b4']}
        />
        
        {/* Confettis côté gauche */}
        <ConfettiCannon
          ref={confettiRef2}
          count={80}
          origin={{x: -10, y: 200}}
          autoStart={false}
          fadeOut={true}
          duration={4000}
          fallSpeed={3500}
          explosionSpeed={400}
          colors={['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffa500', '#ff69b4']}
        />
        
        {/* Confettis côté droit */}
        <ConfettiCannon
          ref={confettiRef3}
          count={80}
          origin={{x: width + 10, y: 200}}
          autoStart={false}
          fadeOut={true}
          duration={4000}
          fallSpeed={3500}
          explosionSpeed={400}
          colors={['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffa500', '#ff69b4']}
        />
        
        {/* Confettis bas gauche */}
        <ConfettiCannon
          ref={confettiRef4}
          count={60}
          origin={{x: 50, y: -10}}
          autoStart={false}
          fadeOut={true}
          duration={4000}
          fallSpeed={3500}
          explosionSpeed={450}
          colors={['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffa500', '#ff69b4']}
        />
        
        {/* Confettis bas droit */}
        <ConfettiCannon
          ref={confettiRef5}
          count={60}
          origin={{x: width - 50, y: -10}}
          autoStart={false}
          fadeOut={true}
          duration={4000}
          fallSpeed={3500}
          explosionSpeed={450}
          colors={['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffa500', '#ff69b4']}
        />
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
    top: '5%',
    right: '-15%',
    color: 'rgba(255, 255, 255, 0.06)',
    transform: [{ rotate: '25deg' }],
  },
  bgIcon2: {
    position: 'absolute',
    bottom: '10%',
    left: '-15%',
    color: 'rgba(255, 255, 255, 0.06)',
    transform: [{ rotate: '-20deg' }],
  },
  bgIcon3: {
    position: 'absolute',
    top: '30%',
    left: '5%',
    color: 'rgba(255, 255, 255, 0.06)',
    transform: [{ rotate: '15deg' }],
  },
  bgIcon4: {
    position: 'absolute',
    bottom: '25%',
    right: '-5%',
    color: 'rgba(255, 255, 255, 0.06)',
    transform: [{ rotate: '-30deg' }],
  },
  header: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#fff',
    opacity: 0.9,
    textAlign: 'center',
  },
  podiumContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginHorizontal: 20,
    marginBottom: 20,
    paddingTop: 80, // Réduit l'espace pour monter les podiums
  },
  podiumWrapper: {
    alignItems: 'center',
    marginHorizontal: 5,
  },
  podiumItem: {
    alignItems: 'center',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    minWidth: width * 0.25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  goldPodium: {
    backgroundColor: '#B8860B',
    borderColor: '#996515',
    shadowColor: '#FFD700',
    shadowOpacity: 0.8,
    shadowRadius: 20,
  },
  silverPodium: {
    backgroundColor: '#C0C0C0',
    borderColor: '#A8A8A8',
    shadowColor: '#C0C0C0',
    shadowOpacity: 0.6,
    shadowRadius: 15,
  },
  bronzePodium: {
    backgroundColor: '#CD7F32',
    borderColor: '#A0522D',
    shadowColor: '#CD7F32',
    shadowOpacity: 0.6,
    shadowRadius: 15,
  },
  podiumGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  playerCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 15,
    marginBottom: 10,
    padding: 10,
    minWidth: 80,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 5,
  },
  playerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 5,
  },
  playerScore: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  badge: {
    fontSize: 24,
    marginTop: 5,
  },
  badgeName: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  podiumBase: {
    position: 'absolute',
    bottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  position: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'rgba(255, 255, 255, 0.9)',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  otherPlayersContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 20,
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
  },
  otherPlayersTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  otherPlayerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 10,
    borderRadius: 10,
    marginBottom: 8,
  },
  otherPlayerName: {
    flex: 1,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 10,
  },
  otherPlayerScore: {
    fontSize: 14,
    color: '#666',
  },
  buttonsContainer: {
    paddingHorizontal: 40,
    marginBottom: 15,
  },
  button: {
    marginBottom: 15,
    borderRadius: 25,
    overflow: 'hidden',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  buttonSecondary: {
    shadowColor: '#6B7280',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
    paddingHorizontal: 25,
    borderRadius: 25,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  congratulations: {
    alignItems: 'center',
    paddingBottom: 15,
  },
  congratulationsText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default ResultsScreen;