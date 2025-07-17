const fs = require('fs').promises;
const path = require('path');
const OpenAI = require('openai');

// Configuration OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Log de la clé API (masquée pour la sécurité)
console.log('Clé API utilisée:', process.env.OPENAI_API_KEY ? `${process.env.OPENAI_API_KEY.substring(0, 10)}...` : 'Aucune clé définie');

// Fichiers de configuration
const QUESTIONS_FILE = path.join(__dirname, '../data/questions.json');
const OUTPUT_FILE = path.join(__dirname, '../data/questions_new.json');
const PROGRESS_FILE = path.join(__dirname, '../data/processing_progress.json');

// Charger la progression
async function loadProgress() {
  try {
    const data = await fs.readFile(PROGRESS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return {
      processedIds: [],
      lastProcessedId: 0,
      nextEasyId: 5001,
      startTime: new Date().toISOString()
    };
  }
}

// Sauvegarder la progression
async function saveProgress(progress) {
  await fs.writeFile(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

// Créer une version facile d'une question
function createEasyVersion(question, nextId) {
  const easyInstructions = `
  Créer une version simplifiée de cette question pour des enfants de 10 ans:
  - Utiliser des mots simples et courants
  - Éviter les concepts théologiques complexes
  - Garder le contexte biblique
  - Les mauvaises réponses doivent être plausibles mais clairement fausses pour un enfant
  
  Règles pour les mauvaises réponses:
  - Si la bonne réponse est un personnage de l'Ancien Testament → proposer des personnages du Nouveau Testament
  - Si la bonne réponse est un personnage du Nouveau Testament → proposer des personnages de l'Ancien Testament
  - Si c'est un livre de la Bible → proposer d'autres livres d'une autre section
  - Si c'est un chiffre → proposer des chiffres raisonnables (ex: 7, 10, 15 si la réponse est 12)
  - Si c'est un lieu → proposer d'autres lieux bibliques éloignés
  - Si c'est un événement → proposer des événements d'époques différentes
  `;
  
  return {
    ...question,
    id: nextId,
    difficulty: 'easy',
    originalId: question.id,
    instructions: easyInstructions
  };
}

// Afficher les détails d'une modification
function logModification(original, modified, isEasyVersion = false) {
  console.log('\n' + '='.repeat(80));
  if (isEasyVersion) {
    console.log(`📚 NOUVELLE QUESTION ENFANT (ID: ${modified.id})`);
    console.log(`   Dérivée de la question ID: ${original.id}`);
  } else {
    console.log(`✏️  QUESTION MODIFIÉE (ID: ${original.id})`);
  }
  console.log('='.repeat(80));
  
  if (!isEasyVersion) {
    console.log('\n🔄 AVANT:');
    console.log(`Question: ${original.question}`);
    console.log(`Réponses:`);
    original.answers.forEach((answer, idx) => {
      const marker = idx === original.correctAnswer ? '✓' : ' ';
      console.log(`  ${marker} ${idx + 1}. ${answer}`);
    });
    console.log(`Difficulté: ${original.difficulty}`);
  }
  
  console.log('\n✨ APRÈS:');
  console.log(`Question: ${modified.question}`);
  console.log(`Réponses:`);
  modified.answers.forEach((answer, idx) => {
    const marker = idx === modified.correctAnswer ? '✓' : ' ';
    console.log(`  ${marker} ${idx + 1}. ${answer}`);
  });
  console.log(`Difficulté: ${modified.difficulty}`);
  
  if (modified.aiExplanation) {
    console.log(`\n💡 Explication: ${modified.aiExplanation}`);
  }
  console.log('='.repeat(80));
}

// Traiter une question avec l'IA
async function processQuestionWithAI(question, progress) {
  const prompt = `
  Analyser et améliorer cette question de quiz biblique:
  
  Question: ${question.question}
  Type: ${question.type}
  Réponses: ${JSON.stringify(question.answers)}
  Réponse correcte: ${question.answers[question.correctAnswer]}
  Difficulté: ${question.difficulty}
  
  Instructions:
  1. Si c'est une question VRAI/FAUX ou OUI/NON, garder uniquement OUI/NON ou VRAI/FAUX comme réponses.
  
  2. Remplacer les réponses du type "toutes les réponses", "aucune de ces réponses", etc. par des réponses bibliques concrètes.
  
  3. Vérifier qu'une seule réponse soit correcte et que les autres ne puissent pas être considérées comme bonnes (éviter les synonymes ou reformulations).
  
  4. Si la question est de difficulté "easy":
     - La passer en "medium"
     - Créer une version simplifiée pour enfants de 10 ans (sera créée séparément)
  
  Retourner un JSON avec:
  {
    "modified": true/false,
    "question": "question améliorée",
    "answers": ["réponse1", "réponse2", "réponse3", "réponse4"],
    "correctAnswer": index_de_la_bonne_réponse,
    "difficulty": "easy/medium/hard",
    "needsEasyVersion": true/false,
    "explanation": "explication des changements"
  }
  `;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Tu es un expert en questions bibliques. Tu dois améliorer les questions selon les instructions données.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content);
    
    // Créer la question modifiée
    const modifiedQuestion = {
      ...question,
      question: result.question || question.question,
      answers: result.answers || question.answers,
      correctAnswer: result.correctAnswer !== undefined ? result.correctAnswer : question.correctAnswer,
      difficulty: result.difficulty || question.difficulty,
      aiModified: true,
      aiExplanation: result.explanation
    };

    // Afficher les modifications si la question a été modifiée
    if (result.modified) {
      logModification(question, modifiedQuestion);
    } else {
      console.log(`\n⏭️  Question ID ${question.id} - Aucune modification nécessaire`);
    }

    const processedQuestions = [modifiedQuestion];

    // Si c'était une question easy, créer aussi la version enfant
    if (result.needsEasyVersion && question.difficulty === 'easy') {
      const easyVersion = createEasyVersion(question, progress.nextEasyId);
      
      // Traiter la version easy avec l'IA
      const easyPrompt = `
      Simplifier cette question pour des enfants de 10 ans:
      
      Question originale: ${question.question}
      Réponses originales: ${JSON.stringify(question.answers)}
      Bonne réponse: ${question.answers[question.correctAnswer]}
      
      Instructions:
      - Utiliser un vocabulaire simple et adapté aux enfants
      - Garder le contexte biblique
      - Les mauvaises réponses doivent suivre ces règles:
        * Si la bonne réponse est de l'AT → proposer des éléments du NT
        * Si la bonne réponse est du NT → proposer des éléments de l'AT
        * Pour les chiffres → proposer des chiffres plausibles mais faux
        * Pour les lieux → proposer d'autres lieux bibliques
      - NE JAMAIS utiliser de références non bibliques
      
      Retourner un JSON avec:
      {
        "question": "question simplifiée",
        "answers": ["réponse1", "réponse2", "réponse3", "réponse4"],
        "correctAnswer": index_de_la_bonne_réponse
      }
      `;

      const easyResponse = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Tu es un expert en pédagogie biblique pour enfants.'
          },
          {
            role: 'user',
            content: easyPrompt
          }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" }
      });

      const easyResult = JSON.parse(easyResponse.choices[0].message.content);
      
      const easyQuestion = {
        ...easyVersion,
        question: easyResult.question,
        answers: easyResult.answers,
        correctAnswer: easyResult.correctAnswer,
        difficulty: 'easy',
        aiModified: true,
        derivedFrom: question.id
      };
      
      // Afficher la nouvelle question pour enfants
      logModification(question, easyQuestion, true);
      
      processedQuestions.push(easyQuestion);

      progress.nextEasyId++;
    }

    return processedQuestions;
  } catch (error) {
    console.error(`Erreur lors du traitement de la question ${question.id}:`, error);
    
    // Afficher plus de détails sur l'erreur
    if (error.response) {
      console.error('Réponse d\'erreur:', error.response);
    }
    if (error.message) {
      console.error('Message d\'erreur:', error.message);
    }
    if (error.status === 404) {
      console.error('\n⚠️  Erreur 404: L\'endpoint ou le modèle spécifié n\'existe pas.');
      console.error('Vérifiez que votre clé API a accès au modèle demandé.');
    }
    
    return [question]; // Retourner la question originale en cas d'erreur
  }
}

// Fonction principale
async function processAllQuestions() {
  console.log('Démarrage du traitement des questions...');
  
  // Charger la progression
  const progress = await loadProgress();
  
  // Charger les questions
  const questionsData = await fs.readFile(QUESTIONS_FILE, 'utf8');
  const questions = JSON.parse(questionsData);
  
  // Charger les questions déjà traitées si elles existent
  let processedQuestions = [];
  try {
    const existingData = await fs.readFile(OUTPUT_FILE, 'utf8');
    processedQuestions = JSON.parse(existingData);
  } catch (error) {
    // Le fichier n'existe pas encore
  }

  // Traiter les questions non encore traitées
  const questionsToProcess = questions.filter(q => !progress.processedIds.includes(q.id));
  
  console.log(`${questionsToProcess.length} questions à traiter...`);
  console.log(`Reprise depuis l'ID: ${progress.lastProcessedId}`);

  for (let i = 0; i < questionsToProcess.length; i++) {
    const question = questionsToProcess[i];
    
    console.log(`\nTraitement de la question ${i + 1}/${questionsToProcess.length} (ID: ${question.id})...`);
    
    try {
      const results = await processQuestionWithAI(question, progress);
      processedQuestions.push(...results);
      
      // Mettre à jour la progression
      progress.processedIds.push(question.id);
      progress.lastProcessedId = question.id;
      
      // Sauvegarder après chaque question
      await fs.writeFile(OUTPUT_FILE, JSON.stringify(processedQuestions, null, 2));
      await saveProgress(progress);
      
      // Pause pour éviter les limites de taux
      if (i < questionsToProcess.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1 seconde entre chaque question
      }
    } catch (error) {
      console.error(`Erreur critique lors du traitement de la question ${question.id}:`, error);
      console.log('Sauvegarde de la progression et arrêt...');
      await saveProgress(progress);
      break;
    }
  }

  console.log('\nTraitement terminé!');
  console.log(`Questions traitées: ${progress.processedIds.length}`);
  console.log(`Nouvelles questions easy créées: ${progress.nextEasyId - 5001}`);
  
  // Nettoyer le fichier de progression si tout est terminé
  if (progress.processedIds.length === questions.length) {
    try {
      await fs.unlink(PROGRESS_FILE);
      console.log('Fichier de progression supprimé (traitement complet).');
    } catch (error) {
      // Ignorer si le fichier n'existe pas
    }
  }
}

// Lancer le traitement
if (require.main === module) {
  processAllQuestions().catch(console.error);
}

module.exports = { processAllQuestions };