import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { Ionicons } from '@expo/vector-icons';
import ConfettiCannon from 'react-native-confetti-cannon';
import { useGame } from '../utils/GameContext';
import { loadQuestions, getQuestionsByLevel, getRandomQuestion, resetQuestionCache } from '../utils/questionsLoader';
import Avatar from '../components/Avatar';
import GameCard from '../components/GameCard';
import ShareBlessingCard from '../components/ShareBlessingCard';

const { width, height } = Dimensions.get('window');

// Fonction pour générer une couleur basée sur le nom (même logique que Avatar)
const getColorFromName = (name) => {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57',
    '#FF9FF3', '#54A0FF', '#5F27CD', '#00D2D3', '#FF9F43',
    '#FF6348', '#2ED573', '#3742FA', '#F8B500', '#FF6B9D',
    '#C44569', '#F8B500', '#3D5A80', '#EE5A6F', '#06FFA5'
  ];
  
  if (!name) return colors[0];
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

// Fonction pour créer un dégradé à partir d'une couleur
const getGradientColors = (baseColor) => {
  // Créer une version plus claire de la couleur
  const lighterColor = baseColor + '88'; // Ajouter de la transparence
  return [baseColor, lighterColor];
};

const GameScreen = ({ navigation }) => {
  const { state, dispatch } = useGame();
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [loading, setLoading] = useState(true);
  const [shuffledAnswers, setShuffledAnswers] = useState([]);
  const [answerMapping, setAnswerMapping] = useState({});
  const [showCard, setShowCard] = useState(false);
  const [cardType, setCardType] = useState(null);
  const [cardBonus, setCardBonus] = useState(0);
  const [showShareCard, setShowShareCard] = useState(false);
  const [playerToReward, setPlayerToReward] = useState(null);
  const [eliminatedAnswers, setEliminatedAnswers] = useState([]);
  const [isProcessingCard, setIsProcessingCard] = useState(false);
  const shareCardLock = useRef(false); // Verrou pour empêcher les doubles affichages
  const confettiRef = useRef(null);

  useEffect(() => {
    initializeGame();
  }, []);

  useEffect(() => {
    if (state.gameFinished) {
      setTimeout(() => {
        navigation.navigate('Results');
      }, 1000); // Réduit de 2s à 1s
    }
  }, [state.gameFinished]);

  const [hasProcessedCurrentShareCard, setHasProcessedCurrentShareCard] = useState(false);

  useEffect(() => {
    // Vérifier si on doit afficher la carte de partage après une réponse
    if (state.shouldShowShareCard && !showShareCard && !isProcessingCard && !state.gameFinished && !hasProcessedCurrentShareCard && !shareCardLock.current) {
      
      // Verrouiller immédiatement
      shareCardLock.current = true;
      setIsProcessingCard(true);
      setHasProcessedCurrentShareCard(true); // Marquer comme traité pour cette occurrence
      
      // Fermer immédiatement toute carte bonus/malus qui serait ouverte
      setShowCard(false);
      setCardType(null);
      
      const currentPlayer = state.players[state.currentPlayerIndex];
      
      // Réinitialiser shouldShowShareCard immédiatement dans le state
      dispatch({
        type: 'RESET_CONSECUTIVE_COUNT',
        payload: { playerId: currentPlayer?.id }
      });
      
      // Attendre un peu pour éviter les conflits avec d'autres cartes
      setTimeout(() => {
        // Vérifier à nouveau que le jeu n'est pas fini et que la carte n'est pas déjà affichée
        if (state.gameFinished || showShareCard) {
          setIsProcessingCard(false);
          shareCardLock.current = false;
          return;
        }
        
        if (currentPlayer) {
          // Vérifier qu'il y a d'autres joueurs à qui donner le bonus
          if (state.players.length > 1 && !showShareCard) { // Double vérification
            // S'assurer qu'aucune autre carte n'est affichée
            setShowCard(false);
            setPlayerToReward(currentPlayer);
            setShowShareCard(true);
          } else if (state.players.length === 1) {
            // Only one player, skipping share card
            // Passer au joueur suivant
            dispatch({ type: 'NEXT_PLAYER' });
            loadNextQuestion();
          }
        } else {
          console.error('Current player not found!');
        }
        setIsProcessingCard(false);
        // Ne pas déverrouiller ici, le faire dans handleShareBonus
      }, 500);
    }
    
    // Réinitialiser le flag quand shouldShowShareCard devient false
    if (!state.shouldShowShareCard) {
      setHasProcessedCurrentShareCard(false);
    }
  }, [state.shouldShowShareCard, state.gameFinished, hasProcessedCurrentShareCard]);

  // useEffect supprimé car l'effet est maintenant appliqué directement dans checkForCard

  // Fonction pour mélanger un tableau
  const shuffleArray = (array) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  // Fonction pour mélanger les réponses et créer le mapping
  const shuffleAnswers = (question, playerOverride = null) => {
    if (!question || !question.answers) return;
    
    // Pour les questions Vrai/Faux, ne pas mélanger
    if (question.type === 'VF') {
      setShuffledAnswers(question.answers);
      setAnswerMapping({0: 0, 1: 1});
      return;
    }
    
    const currentPlayer = playerOverride || state.players[state.currentPlayerIndex];
    const isEasyMode = currentPlayer.level === 'facile';
    
    // Shuffle debug info: player level and mode
    
    // Créer un tableau d'indices
    const indices = question.answers.map((_, index) => index);
    let shuffledIndices;
    
    // En mode facile, 40% de chance que la bonne réponse soit en première position
    if (isEasyMode && Math.random() < 0.4) {
      // EASY MODE: Placing correct answer first (40% chance triggered)
      // Mettre la bonne réponse en première position
      const correctIndex = question.correctAnswer;
      const otherIndices = indices.filter(i => i !== correctIndex);
      const shuffledOthers = shuffleArray(otherIndices);
      shuffledIndices = [correctIndex, ...shuffledOthers];
    } else {
      // Pour tous les autres cas (moyen, difficile et facile sans le 40%)
      // Simple mélange aléatoire sans manipulation
      shuffledIndices = shuffleArray(indices);
      // NORMAL SHUFFLE: Random shuffle for all positions
    }
    
    // Créer le nouveau tableau de réponses mélangées
    const shuffled = shuffledIndices.map(index => question.answers[index]);
    
    // Créer le mapping inverse (de l'index mélangé vers l'index original)
    const mapping = {};
    shuffledIndices.forEach((originalIndex, newIndex) => {
      mapping[newIndex] = originalIndex;
    });
    
    // Shuffled indices calculated
    setShuffledAnswers(shuffled);
    setAnswerMapping(mapping);
    
    // Retourner le mapping pour usage immédiat
    return mapping;
    
    // Log final pour voir où est la bonne réponse
    const correctAnswerNewPosition = shuffledIndices.indexOf(question.correctAnswer);
    // Shuffle complete
  };

  const initializeGame = async () => {
    try {
      // Réinitialiser le cache des questions pour une nouvelle partie
      resetQuestionCache();
      
      const allQuestions = await loadQuestions();
      setQuestions(allQuestions);
      dispatch({ type: 'SET_QUESTIONS', payload: allQuestions });
      dispatch({ type: 'START_GAME' });
      loadNextQuestion(allQuestions);
      setLoading(false);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger les questions');
      console.error(error);
    }
  };

  const checkForCard = (playerLevel, questionType, question, mapping) => {
    // Si on est déjà en train de traiter une carte, ne pas en ajouter
    if (isProcessingCard || showCard || showShareCard) {
      return false;
    }

    // Vérifier si une carte de partage est sur le point de s'afficher (3 bonnes réponses consécutives)
    const currentPlayer = state.players[state.currentPlayerIndex];
    const consecutiveCorrect = state.consecutiveCorrectByPlayer[currentPlayer.id] || 0;
    
    // Si le joueur a 2 bonnes réponses consécutives et que la question actuelle pourrait être la 3ème,
    // ou s'il a déjà 3 bonnes réponses et que la carte de partage devrait s'afficher,
    // ne pas afficher d'autre carte
    if (consecutiveCorrect >= 2 || state.shouldShowShareCard) {
      return false;
    }

    const random = Math.random();
    let blessingChance, trialChance, revelationChance, reversalChance, miracleChance;

    // Définir les probabilités selon le niveau
    switch (playerLevel) {
      case 'facile':
        blessingChance = 0.10;    // 10%
        trialChance = 0.005;      // 0.5%
        revelationChance = 0.08;  // 8%
        reversalChance = 0.03;    // 3%
        miracleChance = 0.001;    // 0.1%
        break;
      case 'moyen':
        blessingChance = 0.01;    // 1%
        trialChance = 0.01;       // 1%
        revelationChance = 0.04;  // 4%
        reversalChance = 0.03;    // 3%
        miracleChance = 0.001;    // 0.1%
        break;
      case 'difficile':
        blessingChance = 0.005;   // 0.5%
        trialChance = 0.10;       // 10%
        revelationChance = 0;     // 0%
        reversalChance = 0.03;    // 3%
        miracleChance = 0.001;    // 0.1%
        break;
      default:
        return false;
    }

    // Système de priorité des cartes
    // Priorité 1: Carte Révélation (seulement pour QCM)
    if (questionType === 'QCM' && random < revelationChance) {
      setIsProcessingCard(true);
      setCardType('revelation');
      setShowCard(true);
      
      // Utiliser les valeurs passées en paramètres ou les valeurs actuelles
      const currentAnswerMapping = mapping || {...answerMapping};
      const correctAnswerIndex = question ? question.correctAnswer : currentQuestion?.correctAnswer;
      
      // Vérification de sécurité
      if (!currentAnswerMapping || Object.keys(currentAnswerMapping).length === 0) {
        console.error('Carte Révélation: answerMapping non disponible');
        setIsProcessingCard(false);
        return;
      }
      
      if (correctAnswerIndex === null || correctAnswerIndex === undefined) {
        console.error('Carte Révélation: correctAnswer non disponible');
        setIsProcessingCard(false);
        return;
      }
      
      // Appliquer l'effet après que la carte se soit fermée (3.5s)
      setTimeout(() => {
        
        // Éliminer 2 mauvaises réponses directement ici
        const wrongAnswerIndices = [];
        
        Object.keys(currentAnswerMapping).forEach(key => {
          const shuffledIndex = parseInt(key);
          const originalIndex = currentAnswerMapping[shuffledIndex];
          if (originalIndex !== correctAnswerIndex) {
            wrongAnswerIndices.push(shuffledIndex);
          }
        });
        
        // S'assurer qu'il y a au moins 2 mauvaises réponses
        if (wrongAnswerIndices.length < 2) {
          console.error('Pas assez de mauvaises réponses à éliminer!');
          setIsProcessingCard(false);
          return;
        }
        
        const toEliminate = wrongAnswerIndices
          .sort(() => Math.random() - 0.5)
          .slice(0, 2);
        
        // Vérification finale : s'assurer qu'on n'élimine pas la bonne réponse
        let correctAnswerShuffledIndex = -1;
        Object.keys(currentAnswerMapping).forEach(key => {
          if (currentAnswerMapping[key] === correctAnswerIndex) {
            correctAnswerShuffledIndex = parseInt(key);
          }
        });
        
        if (toEliminate.includes(correctAnswerShuffledIndex)) {
          console.error('ERREUR CRITIQUE: La bonne réponse allait être éliminée!');
          setIsProcessingCard(false);
          return;
        }
        
        setEliminatedAnswers(toEliminate);
        setIsProcessingCard(false);
      }, 3600);
      return true;
    }
    
    // Priorité 2: Carte Miracle (très rare mais prioritaire)
    if (random < miracleChance) {
      setIsProcessingCard(true);
      setCardType('miracle');
      setShowCard(true);
      dispatch({
        type: 'APPLY_MIRACLE',
        payload: {}
      });
      setTimeout(() => setIsProcessingCard(false), 4000);
      return true;
    }

    // Priorité 3: Carte Échange (seulement s'il y a plusieurs joueurs)
    if (state.players.length > 1 && random < reversalChance) {
      setIsProcessingCard(true);
      setCardType('reversal');
      setShowCard(true);
      dispatch({
        type: 'APPLY_REVERSAL',
        payload: {}
      });
      setTimeout(() => setIsProcessingCard(false), 4000);
      return true;
    }

    // Priorité 4: Carte Bénédiction
    if (random < blessingChance) {
      setIsProcessingCard(true);
      setCardType('blessing');
      setCardBonus(1);
      setShowCard(true);
      dispatch({
        type: 'APPLY_CARD_BONUS',
        payload: { bonus: 1 }
      });
      setTimeout(() => setIsProcessingCard(false), 4000);
      return true;
    }
    
    // Priorité 5: Carte Épreuve (la moins prioritaire)
    if (random < trialChance) {
      setIsProcessingCard(true);
      setCardType('trial');
      // En mode difficile, enlever 1 ou 2 points aléatoirement
      const trialPenalty = playerLevel === 'difficile' ? -(Math.floor(Math.random() * 2) + 1) : -1;
      setCardBonus(trialPenalty);
      setShowCard(true);
      dispatch({
        type: 'APPLY_CARD_BONUS',
        payload: { bonus: trialPenalty }
      });
      setTimeout(() => setIsProcessingCard(false), 4000);
      return true;
    }

    // Pas de carte
    setCardBonus(0);
    return false;
  };

  const loadNextQuestion = (allQuestions = questions) => {
    
    if (!state.players || state.players.length === 0) {
      return;
    }
    
    const currentPlayer = state.players[state.currentPlayerIndex];
    if (!currentPlayer) {
      return;
    }
    
    const playerQuestions = getQuestionsByLevel(allQuestions, currentPlayer.level);
    
    // Récupérer les questions déjà utilisées par ce joueur
    const usedQuestionIds = state.usedQuestionsByPlayer[currentPlayer.id] || [];
    const availableQuestions = playerQuestions.filter(q => !usedQuestionIds.includes(q.id));
    
    // Track questions for player: total, used, available
    
    if (availableQuestions.length === 0) {
      Alert.alert('Info', `Plus de questions disponibles pour ${currentPlayer.name} (niveau ${currentPlayer.level})!`);
      return;
    }

    const question = getRandomQuestion(availableQuestions);
    
    setCurrentQuestion(question);
    // loadNextQuestion - shuffling answers
    const newMapping = shuffleAnswers(question);
    dispatch({ type: 'SET_CURRENT_QUESTION', payload: question });
    
    // Vérifier si une carte doit apparaître avec le nouveau mapping
    // Ne pas vérifier si le joueur a 2+ bonnes réponses consécutives (carte de partage pourrait s'afficher)
    const consecutiveCorrect = state.consecutiveCorrectByPlayer[currentPlayer.id] || 0;
    if (consecutiveCorrect < 2 && !state.shouldShowShareCard) {
      setTimeout(() => {
        checkForCard(currentPlayer.level, question.type, question, newMapping);
      }, 100);
    }
    setSelectedAnswer(null);
    setShowResult(false);
    setEliminatedAnswers([]); // Réinitialiser les réponses éliminées
    // Ne pas réinitialiser revelationActive ici, il sera réinitialisé après l'application de l'effet
  };

  const handleAnswerSelect = (answerIndex) => {
    if (selectedAnswer !== null) return;
    
    setSelectedAnswer(answerIndex);
    setShowResult(true);
    
    // Utiliser le mapping pour obtenir l'index original
    const originalIndex = answerMapping[answerIndex];
    const isCorrect = originalIndex === currentQuestion.correctAnswer;
    
    // Les confettis se déclenchent automatiquement maintenant via la condition dans le rendu
    
    // Capturer le bonus actuel avant de le réinitialiser
    const currentBonus = cardBonus;
    
    // Attendre moins longtemps entre les questions
    const waitTime = isCorrect ? 2000 : 1500;
    
    setTimeout(() => {
      // Appliquer le score sans bonus (déjà appliqué quand la carte apparaît)
      dispatch({ 
        type: 'ANSWER_QUESTION', 
        payload: { isCorrect } 
      });
      
      // Vérifier si le jeu est terminé AVANT de charger la prochaine question
      // Note: Les bonus de cartes sont déjà appliqués au score du joueur
      const updatedPlayers = state.players.map((player, index) => {
        if (index === state.currentPlayerIndex) {
          return { ...player, score: player.score + (isCorrect ? 1 : 0) };
        }
        return player;
      });
      
      // Vérifier si un joueur a atteint le score cible
      const hasWinner = updatedPlayers.some(player => player.score >= state.targetScore);
      if (hasWinner) {
        // Le jeu est fini, ne pas charger la prochaine question
        return;
      }
      
      // Si le jeu n'est pas fini, charger la prochaine question
      const nextPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;
      const nextPlayer = state.players[nextPlayerIndex];
      const playerQuestions = getQuestionsByLevel(questions, nextPlayer.level);
      const usedQuestionIds = state.usedQuestionsByPlayer[nextPlayer.id] || [];
      const availableQuestions = playerQuestions.filter(q => !usedQuestionIds.includes(q.id));
      
      if (availableQuestions.length > 0) {
        const nextQuestion = getRandomQuestion(availableQuestions);
        
        // Maintenant, mettre à jour tout en même temps
        setCurrentQuestion(nextQuestion);
        // handleAnswerSelect - shuffling answers for next player
        const newMapping = shuffleAnswers(nextQuestion, nextPlayer);
        dispatch({ 
          type: 'SET_CURRENT_QUESTION', 
          payload: nextQuestion 
        });
        
        // Vérifier si une carte doit apparaître avec le nouveau mapping
        // Ne pas vérifier si le prochain joueur a 2+ bonnes réponses consécutives
        const nextPlayerConsecutive = state.consecutiveCorrectByPlayer[nextPlayer.id] || 0;
        if (nextPlayerConsecutive < 2) {
          setTimeout(() => {
            checkForCard(nextPlayer.level, nextQuestion.type, nextQuestion, newMapping);
          }, 100);
        }
        setSelectedAnswer(null);
        setShowResult(false);
        setEliminatedAnswers([]); // Réinitialiser pour le prochain joueur
      } else {
        // Pas de questions disponibles
        Alert.alert('Info', `Plus de questions disponibles pour ${nextPlayer.name} (niveau ${nextPlayer.level})!`);
      }
    }, waitTime);
  };

  const handleShareBonus = (targetPlayerId) => {
    
    // Vérifier que la carte est bien affichée pour éviter les doubles appels
    if (!showShareCard || !playerToReward) {
      return;
    }
    
    if (targetPlayerId) {
      dispatch({
        type: 'APPLY_SHARED_BONUS',
        payload: { targetPlayerId }
      });
    }
    
    // TOUJOURS réinitialiser le compteur de bonnes réponses consécutives du joueur actuel
    // que le bonus soit donné ou non
    const currentPlayer = state.players[state.currentPlayerIndex];
    if (currentPlayer) {
      dispatch({
        type: 'RESET_CONSECUTIVE_COUNT',
        payload: { playerId: currentPlayer.id }
      });
      // Consecutive count reset for current player
    }
    
    setShowShareCard(false);
    setPlayerToReward(null);
    setIsProcessingCard(false); // Réinitialiser le flag
    setHasProcessedCurrentShareCard(false); // Réinitialiser pour la prochaine fois
    shareCardLock.current = false; // Déverrouiller
    
    // Maintenant passer au joueur suivant et charger la prochaine question
    dispatch({ type: 'NEXT_PLAYER' });
    
    // Charger la question pour le prochain joueur
    const nextPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;
    const nextPlayer = state.players[nextPlayerIndex];
    const playerQuestions = getQuestionsByLevel(questions, nextPlayer.level);
    const usedQuestionIds = state.usedQuestionsByPlayer[nextPlayer.id] || [];
    const availableQuestions = playerQuestions.filter(q => !usedQuestionIds.includes(q.id));
    
    if (availableQuestions.length > 0) {
      const nextQuestion = getRandomQuestion(availableQuestions);
      
      setCurrentQuestion(nextQuestion);
      // handleShareBonus - shuffling answers for next player
      const newMapping = shuffleAnswers(nextQuestion, nextPlayer);
      dispatch({ 
        type: 'SET_CURRENT_QUESTION', 
        payload: nextQuestion 
      });
      
      // Vérifier si une carte doit apparaître avec le nouveau mapping
      setTimeout(() => {
        checkForCard(nextPlayer.level, nextQuestion.type, nextQuestion, newMapping);
      }, 100);
      setSelectedAnswer(null);
      setShowResult(false);
      setEliminatedAnswers([]); // Réinitialiser pour le prochain joueur
    } else {
      Alert.alert('Info', `Plus de questions disponibles pour ${nextPlayer.name} (niveau ${nextPlayer.level})!`);
    }
  };

  const handlePauseGame = () => {
    Alert.alert(
      'Pause',
      'Que voulez-vous faire ?',
      [
        { text: 'Continuer', style: 'cancel' },
        { 
          text: 'Redémarrer', 
          onPress: () => {
            Alert.alert(
              'Redémarrer',
              'Êtes-vous sûr de vouloir redémarrer la partie ? Les scores actuels seront perdus.',
              [
                { text: 'Annuler', style: 'cancel' },
                { 
                  text: 'Redémarrer', 
                  style: 'destructive',
                  onPress: () => {
                    dispatch({ type: 'RESTART_GAME' });
                    initializeGame();
                  }
                }
              ]
            );
          }
        },
        { 
          text: 'Quitter', 
          style: 'destructive',
          onPress: () => {
            dispatch({ type: 'RESET_GAME' });
            navigation.navigate('GameSetup');
          }
        }
      ]
    );
  };

  const getAnswerStyle = (index) => {
    // Si la réponse est éliminée par révélation
    if (eliminatedAnswers.includes(index)) {
      return [styles.answerButton, styles.eliminatedAnswer];
    }
    
    if (!showResult) {
      return [styles.answerButton, selectedAnswer === index && styles.selectedAnswer];
    }
    
    // Obtenir l'index original pour cette réponse mélangée
    const originalIndex = answerMapping[index];
    
    if (originalIndex === currentQuestion.correctAnswer) {
      return [styles.answerButton, styles.correctAnswer];
    }
    
    if (index === selectedAnswer && originalIndex !== currentQuestion.correctAnswer) {
      return [styles.answerButton, styles.wrongAnswer];
    }
    
    return [styles.answerButton, styles.disabledAnswer];
  };

  // Utiliser le joueur actuel de l'état pour l'affichage
  const currentPlayer = state.players[state.currentPlayerIndex];
  
  // Calculer les couleurs pour le joueur actuel
  const playerColor = getColorFromName(currentPlayer?.name || '');
  const gradientColors = getGradientColors(playerColor);

  // Vérifier si le jeu a été réinitialisé
  useEffect(() => {
    if (!state.players || state.players.length === 0) {
      navigation.replace('GameSetup');
    }
  }, [state.players, navigation]);
  
  if (!state.players || state.players.length === 0) {
    return null;
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <LinearGradient colors={['#667eea', '#764ba2']} style={styles.gradient}>
          <View style={styles.loadingContainer}>
            <View style={styles.loadingIconContainer}>
              {/* Cercle pointillé qui tourne */}
              <Animatable.View 
                animation={{
                  from: { rotate: '0deg' },
                  to: { rotate: '360deg' },
                }}
                duration={3000}
                iterationCount="infinite"
                easing="linear"
                style={styles.loadingCircle}
              >
                {[...Array(12)].map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.loadingDot,
                      {
                        transform: [
                          { rotate: `${index * 30}deg` },
                          { translateY: -70 },
                        ],
                      },
                    ]}
                  />
                ))}
              </Animatable.View>
              
              {/* Icône centrale avec animation */}
              <Animatable.View 
                animation="pulse" 
                iterationCount="infinite"
                duration={2000}
                style={styles.loadingIconInner}
              >
                <Ionicons name="book" size={70} color="#fff" />
              </Animatable.View>
            </View>
            
            {/* Texte animé */}
            <Animatable.Text 
              animation="fadeIn" 
              delay={500}
              style={styles.loadingText}
            >
              Chargement des questions
            </Animatable.Text>
            
            {/* Points de suspension animés */}
            <View style={styles.loadingDots}>
              <Animatable.Text
                animation={{
                  from: { opacity: 0 },
                  to: { opacity: 1 },
                }}
                duration={600}
                iterationCount="infinite"
                delay={0}
                style={styles.loadingDotText}
              >
                •
              </Animatable.Text>
              <Animatable.Text
                animation={{
                  from: { opacity: 0 },
                  to: { opacity: 1 },
                }}
                duration={600}
                iterationCount="infinite"
                delay={200}
                style={styles.loadingDotText}
              >
                •
              </Animatable.Text>
              <Animatable.Text
                animation={{
                  from: { opacity: 0 },
                  to: { opacity: 1 },
                }}
                duration={600}
                iterationCount="infinite"
                delay={400}
                style={styles.loadingDotText}
              >
                •
              </Animatable.Text>
            </View>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  if (!currentQuestion) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <LinearGradient colors={['#667eea', '#764ba2']} style={styles.gradient}>
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Aucune question disponible</Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <LinearGradient
        colors={gradientColors}
        style={styles.gradient}
      >
        {/* Icônes en arrière-plan global */}
        <View style={styles.backgroundIcons}>
          <Ionicons name="book-outline" size={200} style={styles.bgIconMain1} />
          <Ionicons name="school-outline" size={150} style={styles.bgIconMain2} />
          <Ionicons name="trophy-outline" size={180} style={styles.bgIconMain3} />
          <Ionicons name="star-outline" size={120} style={styles.bgIconMain4} />
          <Ionicons name="ribbon-outline" size={140} style={styles.bgIconMain5} />
        </View>
        <View style={styles.header}>
          <View style={styles.topRow}>
            <TouchableOpacity 
              style={styles.pauseButton} 
              onPress={handlePauseGame}
            >
              <Ionicons name="ellipsis-horizontal" size={20} color="rgba(255,255,255,0.8)" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.playerInfo}>
            <Avatar name={currentPlayer.name} size={50} textSize={18} />
            <View style={styles.playerDetails}>
              <Text style={styles.playerName}>{currentPlayer.name}</Text>
              <Text style={styles.playerLevel}>
                Niveau {currentPlayer.level} • {currentPlayer.score}/{state.targetScore} pts
              </Text>
            </View>
          </View>
          
          {state.players.length > 1 && (
            <View style={styles.scoreBoard}>
              {state.players.map((player, index) => (
                <View key={player.id} style={[
                  styles.scoreItem,
                  index !== state.currentPlayerIndex && styles.scoreItemInactive
                ]}>
                  <Avatar 
                    name={player.name} 
                    size={24} 
                    textSize={10} 
                    noShadow={index !== state.currentPlayerIndex}
                  />
                  <Text style={[
                    styles.scoreText,
                    index !== state.currentPlayerIndex && styles.scoreTextInactive
                  ]}>{player.score}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
        >
          <Animatable.View 
            animation="fadeInDown" 
            duration={800}
            style={styles.questionContainer}
          >
            {/* Icônes en arrière-plan */}
            <View style={styles.questionBackgroundIcons}>
              <Ionicons name="book" size={80} color="rgba(102, 126, 234, 0.1)" style={styles.bgIcon1} />
              <Ionicons name="help-circle" size={60} color="rgba(102, 126, 234, 0.1)" style={styles.bgIcon2} />
              <Ionicons name="bulb" size={70} color="rgba(102, 126, 234, 0.1)" style={styles.bgIcon3} />
            </View>
            <Text style={styles.questionText}>{currentQuestion.question}</Text>
          </Animatable.View>

          <View style={styles.answersContainer}>
          {/* Rendering answers with elimination state */}
          {shuffledAnswers.map((answer, index) => {
            // Pour les questions Vrai/Faux, ne montrer que les 2 premières réponses
            if (currentQuestion.type === 'VF' && index >= 2) {
              return null;
            }
            
            // Pour les QCM, ne pas montrer les réponses vides
            if (currentQuestion.type === 'QCM' && (!answer || answer.trim() === '')) {
              return null;
            }
            
            return (
              <Animatable.View
                key={index}
                animation="fadeInUp"
                delay={index * 200}
                duration={600}
              >
                <TouchableOpacity
                  style={getAnswerStyle(index)}
                  onPress={() => handleAnswerSelect(index)}
                  disabled={showResult || eliminatedAnswers.includes(index)}
                >
                  <Text style={styles.answerLetter}>
                    {currentQuestion.type === 'VF' 
                      ? (index === 0 ? 'V' : 'F')
                      : String.fromCharCode(65 + index)
                    }
                  </Text>
                  <Text style={[
                    styles.answerText, 
                    showResult && (answerMapping[index] === currentQuestion.correctAnswer || index === selectedAnswer) && styles.answerTextSelected,
                    eliminatedAnswers.includes(index) && styles.answerTextEliminated
                  ]}>{answer}</Text>
                  {eliminatedAnswers.includes(index) && (
                    <Ionicons name="close-circle-outline" size={24} color="#999" />
                  )}
                  {showResult && answerMapping[index] === currentQuestion.correctAnswer && (
                    <Ionicons name="checkmark-circle" size={24} color="#fff" />
                  )}
                  {showResult && index === selectedAnswer && answerMapping[index] !== currentQuestion.correctAnswer && (
                    <Ionicons name="close-circle" size={24} color="#fff" />
                  )}
                </TouchableOpacity>
              </Animatable.View>
            );
          }).filter(Boolean)}
        </View>

        </ScrollView>
        
        {/* Confettis uniquement si bonne réponse et résultat affiché */}
        {showResult && selectedAnswer !== null && answerMapping[selectedAnswer] === currentQuestion.correctAnswer && (
          <>
            {/* Confettis du centre bas */}
            <ConfettiCannon
              ref={confettiRef}
              count={60}
              origin={{x: width / 2, y: -10}}
              autoStart={true}
              fadeOut={true}
              duration={1800}
              fallSpeed={2000}
              explosionSpeed={350}
              colors={['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffa500', '#ff69b4']}
            />
            {/* Confettis côté gauche */}
            <ConfettiCannon
              count={40}
              origin={{x: -10, y: height / 3}}
              autoStart={true}
              fadeOut={true}
              duration={1800}
              fallSpeed={2000}
              explosionSpeed={300}
              colors={['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffa500', '#ff69b4']}
            />
            {/* Confettis côté droit */}
            <ConfettiCannon
              count={40}
              origin={{x: width + 10, y: height / 3}}
              autoStart={true}
              fadeOut={true}
              duration={1800}
              fallSpeed={2000}
              explosionSpeed={300}
              colors={['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffa500', '#ff69b4']}
            />
          </>
        )}
        
        <GameCard 
          type={cardType}
          visible={showCard && !showShareCard && !state.shouldShowShareCard && !state.isShowingShareCard}
          onClose={() => setShowCard(false)}
        />
        
        {showShareCard && playerToReward && (
          <ShareBlessingCard
            visible={true}
            players={state.players}
            currentPlayerId={playerToReward.id}
            onSelectPlayer={handleShareBonus}
            onClose={() => {
              setShowShareCard(false);
              setPlayerToReward(null);
            }}
          />
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
  bgIconMain1: {
    position: 'absolute',
    top: '2%',
    left: '-20%',
    color: 'rgba(255, 255, 255, 0.08)',
    transform: [{ rotate: '-25deg' }],
  },
  bgIconMain2: {
    position: 'absolute',
    bottom: '5%',
    right: '-15%',
    color: 'rgba(255, 255, 255, 0.08)',
    transform: [{ rotate: '30deg' }],
  },
  bgIconMain3: {
    position: 'absolute',
    top: '55%',
    left: '-15%',
    color: 'rgba(255, 255, 255, 0.08)',
    transform: [{ rotate: '-15deg' }],
  },
  bgIconMain4: {
    position: 'absolute',
    top: '25%',
    right: '-10%',
    color: 'rgba(255, 255, 255, 0.08)',
    transform: [{ rotate: '45deg' }],
  },
  bgIconMain5: {
    position: 'absolute',
    bottom: '30%',
    right: '-5%',
    color: 'rgba(255, 255, 255, 0.08)',
    transform: [{ rotate: '-35deg' }],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingIconContainer: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 50,
  },
  loadingCircle: {
    position: 'absolute',
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingDot: {
    position: 'absolute',
    width: 10,
    height: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 5,
  },
  loadingIconInner: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '600',
    marginTop: 30,
    letterSpacing: 0.5,
  },
  loadingDots: {
    flexDirection: 'row',
    marginTop: 15,
  },
  loadingDotText: {
    color: '#fff',
    fontSize: 24,
    marginHorizontal: 3,
    fontWeight: 'bold',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
  },
  header: {
    padding: 20,
    paddingTop: 10,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 10,
    paddingTop: 10,
  },
  pauseButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  playerDetails: {
    marginLeft: 15,
    flex: 1,
  },
  playerName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  playerLevel: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
    textTransform: 'capitalize',
  },
  scoreBoard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 15,
    paddingVertical: 10,
  },
  scoreItem: {
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'transparent',
  },
  scoreItemInactive: {
    opacity: 0.5,
  },
  scoreText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    marginTop: 4,
  },
  scoreTextInactive: {
    opacity: 0.8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  questionContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    margin: 20,
    padding: 25,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 10,
    position: 'relative',
    overflow: 'hidden',
  },
  questionBackgroundIcons: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  bgIcon1: {
    position: 'absolute',
    top: -20,
    right: -20,
    transform: [{ rotate: '15deg' }],
  },
  bgIcon2: {
    position: 'absolute',
    bottom: -15,
    left: -15,
    transform: [{ rotate: '-20deg' }],
  },
  bgIcon3: {
    position: 'absolute',
    top: '50%',
    right: '10%',
    transform: [{ rotate: '25deg' }],
  },
  questionHeader: {
    alignItems: 'center',
    marginBottom: 15,
  },
  questionType: {
    fontSize: 14,
    color: '#666',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    fontWeight: '600',
  },
  questionText: {
    fontSize: 18,
    lineHeight: 26,
    color: '#333',
    textAlign: 'center',
    fontWeight: '500',
  },
  answersContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  answerButton: {
    backgroundColor: '#FFFFFF',
    marginBottom: 15,
    padding: 20,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  selectedAnswer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#007bff',
    shadowColor: '#007bff',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  correctAnswer: {
    backgroundColor: '#28a745',
  },
  wrongAnswer: {
    backgroundColor: '#dc3545',
  },
  disabledAnswer: {
    opacity: 1,
  },
  eliminatedAnswer: {
    opacity: 0.5,
    backgroundColor: '#F5F5F5',
    borderColor: 'rgba(150, 150, 150, 0.5)',
  },
  answerTextEliminated: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  answerLetter: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    backgroundColor: '#fff',
    width: 40,
    height: 40,
    borderRadius: 20,
    textAlign: 'center',
    lineHeight: 40,
    marginRight: 15,
  },
  answerText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },
  answerTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  resultContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  resultText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  pointsText: {
    fontSize: 18,
    color: '#fff',
    marginTop: 5,
    opacity: 0.9,
  },
});

export default GameScreen;