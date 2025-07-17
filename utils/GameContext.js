import React, { createContext, useContext, useReducer } from 'react';

const GameContext = createContext();

const initialState = {
  players: [],
  currentPlayerIndex: 0,
  targetScore: 10,
  questions: [],
  gameStarted: false,
  gameFinished: false,
  winners: [],
  currentQuestion: null,
  usedQuestionsByPlayer: {}, // {playerId: [questionIds]}
  consecutiveCorrectByPlayer: {} // {playerId: number}
};

const gameReducer = (state, action) => {
  switch (action.type) {
    case 'SET_PLAYERS':
      return { ...state, players: action.payload };
    
    case 'SET_TARGET_SCORE':
      return { ...state, targetScore: action.payload };
    
    case 'SET_QUESTIONS':
      return { ...state, questions: action.payload };
    
    case 'START_GAME':
      // Initialiser le compteur de bonnes réponses consécutives pour chaque joueur
      const consecutiveCorrect = {};
      state.players.forEach(player => {
        consecutiveCorrect[player.id] = 0;
      });
      return { ...state, gameStarted: true, consecutiveCorrectByPlayer: consecutiveCorrect };
    
    case 'SET_CURRENT_QUESTION':
      const currentPlayerId = state.players[state.currentPlayerIndex]?.id;
      const updatedUsedQuestions = { ...state.usedQuestionsByPlayer };
      
      if (currentPlayerId) {
        if (!updatedUsedQuestions[currentPlayerId]) {
          updatedUsedQuestions[currentPlayerId] = [];
        }
        updatedUsedQuestions[currentPlayerId].push(action.payload.id);
      }
      
      return { 
        ...state, 
        currentQuestion: action.payload,
        usedQuestionsByPlayer: updatedUsedQuestions
      };
    
    case 'ANSWER_QUESTION':
      const { isCorrect, bonus = 0 } = action.payload;
      const updatedPlayers = [...state.players];
      const currentPlayer = state.players[state.currentPlayerIndex];
      const updatedConsecutive = { ...state.consecutiveCorrectByPlayer };
      
      let scoreChange = 0;
      if (isCorrect) {
        scoreChange += 1;
        // Incrémenter le compteur de bonnes réponses consécutives
        updatedConsecutive[currentPlayer.id] = (updatedConsecutive[currentPlayer.id] || 0) + 1;
        // Player consecutive correct count incremented
      } else {
        // Réinitialiser le compteur si la réponse est incorrecte
        updatedConsecutive[currentPlayer.id] = 0;
        // Player consecutive count reset to 0
      }
      scoreChange += bonus; // Ajouter le bonus (peut être positif ou négatif)
      
      // S'assurer que le score ne devient pas négatif
      const currentScore = updatedPlayers[state.currentPlayerIndex].score;
      updatedPlayers[state.currentPlayerIndex].score = Math.max(0, currentScore + scoreChange);
      
      // Vérifier si le joueur a atteint 3 bonnes réponses consécutives
      const shouldShowShareCard = updatedConsecutive[currentPlayer.id] === 3;
      // Check if share card should be shown
      
      const nextPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;
      
      // Vérifier s'il y a des gagnants
      const playersAtTarget = updatedPlayers.filter(p => p.score >= state.targetScore);
      
      // Logique de fin de jeu selon le nombre de joueurs
      let gameFinished = false;
      if (state.players.length === 1) {
        // 1 joueur : finir dès qu'il atteint le score
        gameFinished = playersAtTarget.length >= 1;
      } else if (state.players.length === 2) {
        // 2 joueurs : finir dès qu'un joueur atteint le score
        gameFinished = playersAtTarget.length >= 1;
      } else {
        // 3+ joueurs : finir quand on a les 3 premiers
        gameFinished = playersAtTarget.length >= 3;
      }
      
      let winners = [];
      if (gameFinished) {
        // Trier par score décroissant et déterminer les gagnants
        const sorted = [...updatedPlayers].sort((a, b) => b.score - a.score);
        
        if (state.players.length <= 2) {
          // Pour 1-2 joueurs, tous sont "gagnants" dans l'ordre du classement
          winners = sorted;
        } else {
          // Pour 3+ joueurs, prendre les 3 premiers
          winners = sorted.slice(0, 3);
        }
      }
      
      return {
        ...state,
        players: updatedPlayers,
        currentPlayerIndex: shouldShowShareCard ? state.currentPlayerIndex : nextPlayerIndex, // Ne pas changer de joueur si la carte doit s'afficher
        gameFinished,
        winners,
        consecutiveCorrectByPlayer: updatedConsecutive,
        shouldShowShareCard
      };
    
    case 'APPLY_CARD_BONUS': {
      const { bonus } = action.payload;
      const playersWithBonus = [...state.players];
      const currentPlayerScore = playersWithBonus[state.currentPlayerIndex].score;
      const newScore = Math.max(0, currentPlayerScore + bonus);
      playersWithBonus[state.currentPlayerIndex].score = newScore;
      
      // Card bonus applied to player score
      
      // Vérifier si le joueur a atteint le score cible après le bonus
      const playersAtTarget = playersWithBonus.filter(p => p.score >= state.targetScore);
      
      // Logique de fin de jeu selon le nombre de joueurs
      let gameFinished = false;
      let winners = [];
      
      if (state.players.length === 1) {
        // 1 joueur : finir dès qu'il atteint le score
        gameFinished = playersAtTarget.length >= 1;
      } else if (state.players.length === 2) {
        // 2 joueurs : finir dès qu'un joueur atteint le score
        gameFinished = playersAtTarget.length >= 1;
      } else {
        // 3+ joueurs : finir quand on a les 3 premiers
        gameFinished = playersAtTarget.length >= 3;
      }
      
      if (gameFinished) {
        // Trier par score décroissant et déterminer les gagnants
        const sorted = [...playersWithBonus].sort((a, b) => b.score - a.score);
        
        if (state.players.length <= 2) {
          winners = sorted;
        } else {
          winners = sorted.slice(0, 3);
        }
      }
      
      return {
        ...state,
        players: playersWithBonus,
        gameFinished,
        winners
      };
    }
    
    case 'SHARE_CARD_SHOWING': {
      return {
        ...state,
        shouldShowShareCard: false,
        isShowingShareCard: true
      };
    }
    
    case 'RESET_CONSECUTIVE_COUNT': {
      const { playerId } = action.payload;
      const updatedConsecutive = { ...state.consecutiveCorrectByPlayer };
      updatedConsecutive[playerId] = 0;
      
      return {
        ...state,
        consecutiveCorrectByPlayer: updatedConsecutive,
        shouldShowShareCard: false,
        isShowingShareCard: false
      };
    }
    
    case 'APPLY_SHARED_BONUS': {
      const { targetPlayerId } = action.payload;
      if (!targetPlayerId) {
        // Le joueur a choisi de ne donner le bonus à personne
        return state;
      }
      
      const playersWithSharedBonus = [...state.players];
      const targetPlayerIndex = playersWithSharedBonus.findIndex(p => p.id === targetPlayerId);
      
      if (targetPlayerIndex !== -1) {
        playersWithSharedBonus[targetPlayerIndex].score += 1;
      }
      
      // Vérifier si le jeu est terminé après le bonus partagé
      const playersAtTarget = playersWithSharedBonus.filter(p => p.score >= state.targetScore);
      
      let gameFinished = false;
      let winners = [];
      
      if (state.players.length === 1) {
        gameFinished = playersAtTarget.length >= 1;
      } else if (state.players.length === 2) {
        gameFinished = playersAtTarget.length >= 1;
      } else {
        gameFinished = playersAtTarget.length >= 3;
      }
      
      if (gameFinished) {
        const sorted = [...playersWithSharedBonus].sort((a, b) => b.score - a.score);
        winners = state.players.length <= 2 ? sorted : sorted.slice(0, 3);
      }
      
      return {
        ...state,
        players: playersWithSharedBonus,
        gameFinished,
        winners
      };
    }
    
    case 'APPLY_MIRACLE': {
      const miraclePlayers = [...state.players];
      const currentPlayerIdx = state.currentPlayerIndex;
      // Mettre le joueur à 1 point du score cible
      miraclePlayers[currentPlayerIdx].score = Math.max(
        miraclePlayers[currentPlayerIdx].score, 
        state.targetScore - 1
      );
      
      // La carte miracle ne peut pas terminer le jeu directement
      // car elle met à targetScore - 1
      
      return {
        ...state,
        players: miraclePlayers
      };
    }
    
    case 'APPLY_REVERSAL': {
      if (state.players.length < 2) return state;
      
      const reversalPlayers = [...state.players];
      // Trier pour trouver le premier et le dernier
      const sortedIndices = reversalPlayers
        .map((player, index) => ({ player, index }))
        .sort((a, b) => b.player.score - a.player.score);
      
      const firstPlace = sortedIndices[0];
      const lastPlace = sortedIndices[sortedIndices.length - 1];
      
      // Échanger les scores seulement s'ils sont différents
      if (firstPlace.index !== lastPlace.index) {
        const tempScore = reversalPlayers[firstPlace.index].score;
        reversalPlayers[firstPlace.index].score = reversalPlayers[lastPlace.index].score;
        reversalPlayers[lastPlace.index].score = tempScore;
      }
      
      return {
        ...state,
        players: reversalPlayers
      };
    }
    
    case 'NEXT_PLAYER':
      return {
        ...state,
        currentPlayerIndex: (state.currentPlayerIndex + 1) % state.players.length
      };
    
    case 'RESTART_GAME': {
      // Garder les joueurs mais réinitialiser leurs scores et l'état du jeu
      const resetPlayers = state.players.map(player => ({
        ...player,
        score: 0
      }));
      
      const consecutiveCorrect = {};
      resetPlayers.forEach(player => {
        consecutiveCorrect[player.id] = 0;
      });
      
      return {
        ...state,
        players: resetPlayers,
        currentPlayerIndex: 0,
        gameStarted: true,
        gameFinished: false,
        winners: [],
        currentQuestion: null,
        usedQuestionsByPlayer: {},
        consecutiveCorrectByPlayer: consecutiveCorrect,
        shouldShowShareCard: false
      };
    }
    
    case 'RESET_GAME':
      return initialState;
    
    default:
      return state;
  }
};

export const GameProvider = ({ children }) => {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  
  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};