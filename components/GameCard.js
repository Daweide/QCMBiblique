import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const GameCard = ({ type, visible, onClose }) => {
  const cardRef = useRef(null);

  useEffect(() => {
    if (visible) {
      // Auto-fermer après 3.5 secondes
      const timer = setTimeout(() => {
        onClose();
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [visible, onClose]);

  const getCardConfig = () => {
    switch (type) {
      case 'blessing':
        return {
          title: 'Bénédiction Divine',
          subtitle: 'La grâce est avec vous',
          icon: 'gift',
          gradientColors: ['#FFD700', '#FFA500', '#FF8C00'],
          borderColor: '#FFD700',
          message: '+1 Point Bénédiction',
          symbolTop: '✨',
          symbolBottom: '🙏',
        };
      
      case 'trial':
        return {
          title: 'Épreuve de la Vie',
          subtitle: 'La foi est mise à l\'épreuve',
          icon: 'warning',
          gradientColors: ['#8B0000', '#DC143C', '#FF6347'],
          borderColor: '#8B0000',
          message: '-1 Point',
          symbolTop: '⚡',
          symbolBottom: '🔥',
        };
      
      case 'revelation':
        return {
          title: 'Révélation Divine',
          subtitle: 'La vérité vous éclaire',
          icon: 'bulb',
          gradientColors: ['#6A0DAD', '#9B59B6', '#E8B4F8'],
          borderColor: '#6A0DAD',
          message: '2 réponses éliminées',
          symbolTop: '✨',
          symbolBottom: '💜',
        };
      
      case 'reversal':
        return {
          title: 'Les Derniers Seront Les Premiers',
          subtitle: 'L\'ordre divin est inversé',
          icon: 'swap-vertical',
          gradientColors: ['#1E90FF', '#4169E1', '#6495ED'],
          borderColor: '#1E90FF',
          message: 'Échange 1er ↔ Dernier',
          symbolTop: '↕️',
          symbolBottom: '⚖️',
        };
      
      case 'miracle':
        return {
          title: 'Miracle Divin',
          subtitle: 'Une bénédiction inattendue',
          icon: 'star',
          gradientColors: ['#FFD700', '#FFA500', '#FF8C00'],
          borderColor: '#FFD700',
          message: 'Proche de la victoire !',
          symbolTop: '⭐',
          symbolBottom: '🌟',
        };
      
      default:
        return {
          title: 'Carte Mystère',
          subtitle: '',
          icon: 'help-circle',
          gradientColors: ['#808080', '#A9A9A9', '#C0C0C0'],
          borderColor: '#808080',
          message: '',
          symbolTop: '?',
          symbolBottom: '?',
        };
    }
  };

  const config = getCardConfig();

  if (!visible) return null;

  return (
    <Modal
      transparent
      animationType="none"
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.overlay} 
        activeOpacity={1}
        onPress={onClose}
      >
        <Animatable.View
          ref={cardRef}
          animation="zoomIn"
          duration={500}
          style={styles.cardContainer}
        >
          <View style={[styles.card, { borderColor: config.borderColor }]}>
            <LinearGradient
              colors={config.gradientColors}
              style={styles.gradientBackground}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {/* Coins décoratifs */}
              <Text style={[styles.cornerSymbol, styles.topLeft]}>{config.symbolTop}</Text>
              <Text style={[styles.cornerSymbol, styles.topRight]}>{config.symbolTop}</Text>
              <Text style={[styles.cornerSymbol, styles.bottomLeft]}>{config.symbolBottom}</Text>
              <Text style={[styles.cornerSymbol, styles.bottomRight]}>{config.symbolBottom}</Text>

              {/* Bordure intérieure */}
              <View style={styles.innerBorder}>
              {/* En-tête de la carte */}
              <View style={styles.header}>
                <View style={styles.headerLine} />
                <Text style={styles.cardTitle}>{config.title}</Text>
                <View style={styles.headerLine} />
              </View>

              {/* Icône centrale */}
              <View style={styles.iconContainer}>
                <View style={styles.iconCircle}>
                  <Ionicons name={config.icon} size={60} color="#FFF" />
                </View>
              </View>

              {/* Message principal */}
              <Animatable.Text 
                animation="pulse" 
                iterationCount="infinite" 
                style={styles.message}
              >
                {config.message}
              </Animatable.Text>

              {/* Sous-titre */}
              <Text style={styles.subtitle}>{config.subtitle}</Text>

              {/* Décoration du bas */}
              <View style={styles.bottomDecoration}>
                <View style={styles.decorativeLine} />
                <Text style={styles.decorativeText}>✦</Text>
                <View style={styles.decorativeLine} />
              </View>
            </View>
            </LinearGradient>
          </View>
        </Animatable.View>
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
    width: width * 0.8,
    height: height * 0.5,
    maxWidth: 350,
    maxHeight: 500,
  },
  card: {
    flex: 1,
    borderRadius: 25,
    borderWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
    overflow: 'hidden',
    backgroundColor: '#000', // Fond noir pour voir si il y a des espaces
  },
  gradientBackground: {
    flex: 1,
    borderRadius: 21, // 25 - 4 = 21 pour s'adapter parfaitement
  },
  innerBorder: {
    flex: 1,
    borderRadius: 19, // Un peu plus petit pour être sûr
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    padding: 20,
    margin: 2,
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
  },
  cornerSymbol: {
    position: 'absolute',
    fontSize: 24,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  topLeft: {
    top: 15,
    left: 15,
  },
  topRight: {
    top: 15,
    right: 15,
  },
  bottomLeft: {
    bottom: 15,
    left: 15,
  },
  bottomRight: {
    bottom: 15,
    right: 15,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  headerLine: {
    flex: 1,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 10,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
  },
  iconContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  message: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
    marginVertical: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 10,
  },
  bottomDecoration: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  decorativeLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 10,
  },
  decorativeText: {
    fontSize: 20,
    color: 'rgba(255, 255, 255, 0.8)',
  },
});

export default GameCard;