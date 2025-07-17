# QCM Biblique 📖

Une application mobile de quiz biblique familial avec React Native et Expo.

## 🎯 Fonctionnalités

- **Configuration personnalisable** : Choisissez le nombre de participants (1-8) et le score cible (5-50 points)
- **Profils de joueurs** : Chaque joueur a un nom, un avatar et un niveau de difficulté (Facile, Moyen, Difficile)
- **Questions par niveau** : Les questions sont adaptées au niveau choisi par chaque joueur
- **Tour par tour** : Les joueurs répondent chacun leur tour
- **Système de points** : +1 point pour chaque bonne réponse
- **Podium des gagnants** : Affichage des 3 premiers avec badges et animations
- **Interface moderne** : Design attractif avec dégradés, animations et effets visuels

## 🚀 Installation et lancement

1. **Installer les dépendances** :
```bash
cd QCMBiblique
npm install
```

2. **Lancer l'application** :
```bash
npm start
```

3. **Ouvrir sur votre appareil** :
   - Installer l'app Expo Go sur votre téléphone
   - Scanner le QR code affiché dans le terminal

## 📱 Écrans de l'application

1. **Configuration du jeu** : Définir le nombre de joueurs et le score cible
2. **Profils des joueurs** : Saisir nom, avatar et niveau pour chaque joueur
3. **Jeu** : Questions QCM avec 4 choix de réponses
4. **Résultats** : Podium des gagnants avec possibilité de rejouer

## 🎮 Règles du jeu

- Chaque joueur répond à tour de rôle à une question de son niveau
- Les questions sont tirées aléatoirement du niveau choisi
- Chaque bonne réponse rapporte 1 point
- Le premier joueur à atteindre le score cible gagne
- Le jeu s'arrête quand on a les 3 premiers (ou moins selon le nombre de joueurs)

## 📚 Base de données

L'application utilise un fichier CSV contenant plus de 1000 questions bibliques réparties en 3 niveaux :
- **Facile** : Questions sur les livres bibliques et personnages principaux
- **Moyen** : Questions sur les événements et enseignements
- **Difficile** : Questions approfondies sur la théologie et les détails

## 🛠 Technologies utilisées

- **React Native** avec Expo
- **React Navigation** pour la navigation
- **React Native Animatable** pour les animations
- **Expo Linear Gradient** pour les effets visuels
- **Context API** pour la gestion d'état
- **Expo Vector Icons** pour les icônes

## 🎨 Design

L'application utilise un design moderne avec :
- Dégradés colorés selon les niveaux de difficulté
- Animations fluides et engageantes
- Interface intuitive adaptée aux familles
- Badges et récompenses visuelles
- Design responsive pour tous les écrans

## 👨‍👩‍👧‍👦 Public cible

Cette application est conçue pour les familles chrétiennes souhaitant s'amuser tout en apprenant la Bible. Elle convient à tous les âges grâce aux différents niveaux de difficulté.

---

*Développé avec ❤️ pour enrichir la connaissance biblique en famille*