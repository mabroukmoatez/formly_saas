# Formly Project

Application web React pour la gestion de formations, sessions, formateurs et participants.

## Prérequis

Avant de commencer, assurez-vous d'avoir installé :

- **Node.js** (version 18 ou supérieure) - [Télécharger Node.js](https://nodejs.org/en/)
- **npm** (généralement inclus avec Node.js)
- **Backend API** en cours d'exécution sur `http://localhost:8000` (ou configurer l'URL via les variables d'environnement)

## Installation

1. **Cloner le projet** (si ce n'est pas déjà fait) :
   ```bash
   git clone <repository-url>
   cd "formly project"
   ```

2. **Installer les dépendances** :
   ```bash
   npm install
   ```

3. **Configurer les variables d'environnement** (optionnel) :
   
   Créez un fichier `.env` à la racine du projet si vous souhaitez personnaliser l'URL de l'API backend :
   ```env
   VITE_API_URL=http://localhost:8000
   ```
   
   Par défaut, l'application utilise `http://localhost:8000` comme URL de l'API.

## Exécution du projet

### Mode développement

Pour lancer l'application en mode développement :

```bash
npm run dev
```

L'application sera accessible à l'adresse : [http://localhost:5173/](http://localhost:5173/)

Le serveur de développement utilise Vite avec Hot Module Replacement (HMR) pour un rechargement automatique lors des modifications.

### Mode production

Pour construire l'application pour la production :

```bash
npm run build
```

Les fichiers de production seront générés dans le dossier `dist/`.

Pour servir les fichiers de production localement, vous pouvez utiliser un serveur HTTP statique comme :

```bash
# Avec serve (npm install -g serve)
serve dist

# Ou avec Python
cd dist
python -m http.server 8000
```

## Scripts disponibles

- `npm run dev` - Lance le serveur de développement
- `npm run build` - Construit l'application pour la production
- `npm run download-assets` - Télécharge les assets (si nécessaire)
- `npm run replace-urls` - Remplace les URLs (si nécessaire)

## Structure du projet

```
formly project/
├── src/
│   ├── components/     # Composants React réutilisables
│   ├── contexts/       # Contextes React (Auth, Theme, etc.)
│   ├── hooks/          # Hooks personnalisés
│   ├── pages/          # Pages de l'application
│   ├── router/         # Configuration du routage
│   ├── screens/        # Écrans principaux
│   ├── services/       # Services API
│   └── utils/          # Utilitaires
├── public/             # Fichiers statiques
├── package.json        # Dépendances et scripts
└── vite.config.ts      # Configuration Vite
```

## Configuration

### Proxy API

Le projet est configuré pour proxifier les requêtes API vers le backend via `vite.config.ts`. Les routes suivantes sont proxifiées :

- `/api` → `http://localhost:8000/api`
- `/organization/api` → `http://localhost:8000/api`
- `/uploads` → `http://localhost:8000/uploads`

### Port de développement

Le serveur de développement écoute sur le port **5173** par défaut. Vous pouvez le modifier dans `vite.config.ts` si nécessaire.

## Technologies utilisées

- **React 18** - Bibliothèque UI
- **TypeScript** - Typage statique
- **Vite** - Build tool et serveur de développement
- **React Router** - Routage
- **Tailwind CSS** - Framework CSS
- **Radix UI** - Composants UI accessibles
- **TipTap** - Éditeur de texte riche
- **Pusher** - WebSockets pour les mises à jour en temps réel

## Support

Pour toute question ou problème, veuillez contacter l'équipe de développement.
