const fs = require('fs');
const path = require('path');

// Configuration de l'API Claude
// IMPORTANT: Définir la clé API dans une variable d'environnement CLAUDE_API_KEY
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || '';
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';

if (!CLAUDE_API_KEY) {
  console.error('⚠️  ERREUR: La clé API Claude n\'est pas définie.');
  console.error('   Définissez la variable d\'environnement CLAUDE_API_KEY');
  console.error('   Exemple: export CLAUDE_API_KEY="votre-clé-api"');
  process.exit(1);
}

// Fonction pour appeler l'API Claude
async function callClaudeAPI(prompt) {
  try {
    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    return data.content[0].text;
  } catch (error) {
    console.error('Erreur lors de l\'appel à Claude:', error);
    return null;
  }
}

// Fonction pour vérifier et corriger une question
async function verifyAndCorrectQuestion(question) {
  const prompt = `Tu es un expert biblique et théologien. Vérifie et corrige cette question de QCM biblique.

QUESTION: ${question.question}
RÉPONSES: 
${question.answers.map((ans, idx) => `${idx + 1}. ${ans}`).join('\n')}
RÉPONSE CORRECTE: ${question.answers[question.correctAnswer]} (index ${question.correctAnswer})

VÉRIFIE ET CORRIGE:
1. Les termes théologiques inappropriés (ex: "gentil" pour Dieu → "bon", "miséricordieux", "fidèle")
2. Les termes enfantins ou non-bibliques (ex: "grosse inondation" → "déluge")
3. L'exactitude biblique de la réponse correcte
4. Pour Joseph: s'il a été vendu, précise "aux Ismaélites/Madianites" puis "vendu à Potiphar"

Réponds en JSON avec ce format exact:
{
  "corrections_needed": true/false,
  "corrected_question": "question corrigée ou originale si pas de correction",
  "corrected_answers": ["réponse 1 corrigée", "réponse 2", "réponse 3", "réponse 4"],
  "correct_answer_index": index_de_la_bonne_réponse,
  "explanation": "explication des corrections effectuées"
}

IMPORTANT: Réponds UNIQUEMENT avec le JSON, sans texte avant ou après.`;

  const response = await callClaudeAPI(prompt);
  
  if (!response) {
    return null;
  }

  try {
    // Nettoyer la réponse pour extraire uniquement le JSON
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('Pas de JSON trouvé dans la réponse');
      return null;
    }
    
    const result = JSON.parse(jsonMatch[0]);
    
    if (result.corrections_needed) {
      return {
        ...question,
        question: result.corrected_question,
        answers: result.corrected_answers,
        correctAnswer: result.correct_answer_index,
        correction_explanation: result.explanation
      };
    }
    
    return question;
  } catch (error) {
    console.error('Erreur lors du parsing JSON:', error);
    console.error('Réponse reçue:', response);
    return null;
  }
}

// Fonction pour charger/sauvegarder la progression
function loadProgress() {
  const progressPath = path.join(__dirname, '..', 'data', 'verification_progress.json');
  if (fs.existsSync(progressPath)) {
    return JSON.parse(fs.readFileSync(progressPath, 'utf8'));
  }
  return {
    lastProcessedIndex: 0,
    processedQuestions: [],
    corrections: [],
    startTime: new Date().toISOString()
  };
}

function saveProgress(progress) {
  const progressPath = path.join(__dirname, '..', 'data', 'verification_progress.json');
  fs.writeFileSync(progressPath, JSON.stringify(progress, null, 2), 'utf8');
}

// Fonction principale
async function processAllQuestions() {
  console.log('Chargement des questions...');
  
  // Charger le fichier de questions
  const questionsPath = path.join(__dirname, '..', 'data', 'questions.json');
  const questions = JSON.parse(fs.readFileSync(questionsPath, 'utf8'));
  
  // Charger la progression sauvegardée
  let progress = loadProgress();
  
  // Demander si on veut reprendre ou recommencer
  if (progress.lastProcessedIndex > 0) {
    console.log(`\n📌 Progression trouvée: ${progress.lastProcessedIndex}/${questions.length} questions déjà traitées.`);
    console.log(`Reprendre à partir de la question ${progress.lastProcessedIndex + 1}? (Sinon, recommencer depuis le début)`);
    
    // Pour automatiser, on reprend toujours où on s'est arrêté
    console.log('Reprise automatique de la progression...\n');
  } else {
    console.log(`${questions.length} questions trouvées. Début de la vérification...`);
    progress = {
      lastProcessedIndex: 0,
      processedQuestions: [],
      corrections: [],
      startTime: new Date().toISOString()
    };
  }
  
  const startIndex = progress.lastProcessedIndex;
  const correctedQuestions = [...progress.processedQuestions];
  const corrections = [...progress.corrections];
  
  // Traiter les questions par batch pour éviter de surcharger l'API
  const batchSize = 5;
  const delay = 1000; // 1 seconde entre chaque batch
  
  for (let i = startIndex; i < questions.length; i += batchSize) {
    const batch = questions.slice(i, Math.min(i + batchSize, questions.length));
    
    console.log(`\nTraitement des questions ${i + 1} à ${Math.min(i + batchSize, questions.length)}...`);
    
    const batchPromises = batch.map(async (question, idx) => {
      const questionNum = i + idx + 1;
      console.log(`  Vérification question ${questionNum}/${questions.length}: ${question.question.substring(0, 50)}...`);
      
      const corrected = await verifyAndCorrectQuestion(question);
      
      if (corrected && corrected.correction_explanation) {
        corrections.push({
          id: question.id,
          original_question: question.question,
          corrected_question: corrected.question,
          explanation: corrected.correction_explanation
        });
        console.log(`    ✓ Correction appliquée: ${corrected.correction_explanation.substring(0, 100)}...`);
      } else if (corrected) {
        console.log(`    - Pas de correction nécessaire`);
      } else {
        console.log(`    ✗ Erreur lors de la vérification`);
      }
      
      return corrected || question;
    });
    
    const batchResults = await Promise.all(batchPromises);
    correctedQuestions.push(...batchResults);
    
    // Sauvegarder la progression après chaque batch
    progress.lastProcessedIndex = Math.min(i + batchSize, questions.length);
    progress.processedQuestions = correctedQuestions;
    progress.corrections = corrections;
    progress.lastSaveTime = new Date().toISOString();
    saveProgress(progress);
    
    // Sauvegarder aussi les questions corrigées après chaque batch
    const outputPath = path.join(__dirname, '..', 'data', 'questions_corrected.json');
    fs.writeFileSync(outputPath, JSON.stringify(correctedQuestions, null, 2), 'utf8');
    
    // Sauvegarder le rapport de corrections après chaque batch
    if (corrections.length > 0) {
      const reportPath = path.join(__dirname, '..', 'data', 'corrections_report.json');
      fs.writeFileSync(reportPath, JSON.stringify(corrections, null, 2), 'utf8');
    }
    
    console.log(`  💾 Progression sauvegardée (${progress.lastProcessedIndex}/${questions.length}) - ${corrections.length} corrections`);
    
    // Attendre entre les batches pour respecter les limites de l'API
    if (i + batchSize < questions.length) {
      console.log(`  Pause de ${delay}ms avant le prochain batch...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // Message final
  const outputPath = path.join(__dirname, '..', 'data', 'questions_corrected.json');
  console.log(`\n✓ Traitement terminé ! Questions corrigées dans: ${outputPath}`);
  
  // Sauvegarder le rapport de corrections
  if (corrections.length > 0) {
    const reportPath = path.join(__dirname, '..', 'data', 'corrections_report.json');
    fs.writeFileSync(reportPath, JSON.stringify(corrections, null, 2), 'utf8');
    console.log(`✓ Rapport de corrections sauvegardé dans: ${reportPath}`);
    console.log(`\nTotal: ${corrections.length} questions corrigées sur ${questions.length}`);
  } else {
    console.log('\nAucune correction nécessaire !');
  }
  
  // Supprimer le fichier de progression une fois terminé
  const progressPath = path.join(__dirname, '..', 'data', 'verification_progress.json');
  if (fs.existsSync(progressPath)) {
    fs.unlinkSync(progressPath);
    console.log('✓ Fichier de progression supprimé (traitement terminé)');
  }
}

// Lancer le processus
console.log('=== Vérification et correction des questions bibliques ===\n');
processAllQuestions().catch(error => {
  console.error('Erreur fatale:', error);
  process.exit(1);
});