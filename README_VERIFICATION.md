# Vérification et correction des questions bibliques

## Description

Le script `utils/verifyAndCorrectQuestions.js` permet de vérifier et corriger automatiquement toutes les questions du QCM biblique en utilisant l'API Claude d'Anthropic.

## Fonctionnalités

- ✅ Correction des termes théologiques inappropriés
- ✅ Vérification de l'exactitude biblique des réponses
- ✅ Sauvegarde automatique de la progression
- ✅ Reprise automatique en cas d'interruption
- ✅ Génération d'un rapport détaillé des corrections

## Configuration

1. Définir la clé API Claude dans une variable d'environnement :
   ```bash
   export CLAUDE_API_KEY="votre-clé-api"
   ```

2. Ou créer un fichier `.env` à la racine du projet :
   ```
   CLAUDE_API_KEY=votre-clé-api
   ```

## Utilisation

```bash
# Lancer la vérification
node utils/verifyAndCorrectQuestions.js
```

Le script :
- Traite les questions par batch de 5
- Sauvegarde la progression après chaque batch
- Génère `questions_corrected.json` avec les corrections
- Crée `corrections_report.json` avec le détail des modifications

## Reprise après interruption

Si le script est interrompu, il reprendra automatiquement où il s'était arrêté grâce au fichier `verification_progress.json`.

## Fichiers générés

- `data/questions_corrected.json` : Questions corrigées
- `data/corrections_report.json` : Rapport détaillé des corrections
- `data/verification_progress.json` : Fichier de progression (supprimé à la fin)