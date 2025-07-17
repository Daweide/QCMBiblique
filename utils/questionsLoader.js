// Import direct du fichier JSON
let questionsData = [];

try {
  questionsData = require('../data/questions.json');
} catch (error) {
  console.warn('Impossible de charger le fichier principal, utilisation des questions de test');
  questionsData = require('../data/questions.json');
}

export const loadQuestions = async () => {
  try {
    // Simuler un délai async pour la cohérence
    await new Promise(resolve => setTimeout(resolve, 100));
    return questionsData;
  } catch (error) {
    console.error('Erreur lors du chargement des questions:', error);
    return [];
  }
};

export const getQuestionsByLevel = (questions, level) => {
  const normalizedLevel = level.toLowerCase().trim();
  
  // Mapping des niveaux français vers anglais
  const levelMapping = {
    'facile': 'easy',
    'moyen': 'medium',
    'difficile': 'hard'
  };
  
  const mappedLevel = levelMapping[normalizedLevel] || normalizedLevel;
  
  const filtered = questions.filter(q => {
    // Chercher dans le champ 'difficulty' (format actuel) ou 'level' (ancien format)
    const questionDifficulty = q.difficulty ? q.difficulty.toLowerCase().trim() : '';
    const questionLevel = q.level ? q.level.toLowerCase().trim() : '';
    
    return questionDifficulty === mappedLevel || questionLevel === normalizedLevel;
  });
  
  // Questions filtrées pour le niveau
  return filtered;
};

// Fonction de mélange Fisher-Yates pour une meilleure randomisation
const shuffleArray = (array) => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

// Cache pour stocker l'ordre mélangé des questions par niveau
let questionOrderCache = {};

export const getRandomQuestion = (questions) => {
  if (questions.length === 0) return null;
  
  // Créer une clé unique basée sur le niveau et le nombre de questions
  const cacheKey = `${questions.length}_${questions[0]?.difficulty || questions[0]?.level || 'unknown'}`;
  
  // Si on n'a pas de cache pour ce niveau ou si on a parcouru toutes les questions
  if (!questionOrderCache[cacheKey] || questionOrderCache[cacheKey].index >= questionOrderCache[cacheKey].order.length) {
    // Mélanger les questions et réinitialiser l'index
    questionOrderCache[cacheKey] = {
      order: shuffleArray(questions),
      index: 0
    };
  }
  
  // Prendre la prochaine question dans l'ordre mélangé
  const question = questionOrderCache[cacheKey].order[questionOrderCache[cacheKey].index];
  questionOrderCache[cacheKey].index++;
  
  return question;
};

// Fonction pour réinitialiser le cache (à appeler au début d'une nouvelle partie)
export const resetQuestionCache = () => {
  questionOrderCache = {};
};