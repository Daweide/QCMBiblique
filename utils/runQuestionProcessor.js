#!/usr/bin/env node

const { processAllQuestions } = require('./processQuestionsWithAI');

console.log('=== Processeur de Questions Bibliques avec IA ===\n');
console.log('Ce script va:');
console.log('1. Analyser chaque question avec GPT-4o-mini');
console.log('2. Corriger les questions VRAI/FAUX');
console.log('3. Remplacer les réponses génériques');
console.log('4. Vérifier l\'unicité des bonnes réponses');
console.log('5. Créer des versions simplifiées pour enfants\n');
console.log('Fichier source: data/questions.json');
console.log('Fichier de sortie: data/questions_new.json');
console.log('Progression sauvegardée dans: data/processing_progress.json\n');
console.log('📊 Les modifications seront affichées en temps réel pour chaque question');

// Vérifier la clé API
if (!process.env.OPENAI_API_KEY) {
  console.log('❌ ERREUR: Aucune clé API OpenAI détectée!');
  console.log('Pour définir votre clé: export OPENAI_API_KEY=votre_clé\n');
  console.log('Obtenez une clé API sur: https://platform.openai.com/api-keys\n');
  process.exit(1);
}

console.log('Appuyez sur Ctrl+C pour interrompre (la progression sera sauvegardée)\n');
console.log('Démarrage dans 3 secondes...\n');

setTimeout(() => {
  processAllQuestions()
    .then(() => {
      console.log('\n✅ Traitement terminé avec succès!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Erreur lors du traitement:', error);
      process.exit(1);
    });
}, 3000);