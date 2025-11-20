# PLAN D'ALIGNEMENT COMPLET - Documentation Gestion Qualité

## ✅ POINTS À VÉRIFIER ET CORRIGER

### 1. ARCHITECTURE DE NAVIGATION

#### 1.1 Menu principal (Sidebar gauche)
- ✅ **Accueil** : Fond orange (#FFE5CC) quand actif - **FAIT**
- ✅ **Indicateurs** : Icône coche dans un cercle - **FAIT**
- ✅ **Documents** : Icône document - **FAIT**
- ✅ **Articles** : Icône journal - **FAIT**
- ✅ **BPF** : Icône document avec graphique - **FAIT**

#### 1.2 Section "LES ACTIONS & Tâches"
- ✅ Recherche globale (placeholder "Recherche") - **FAIT**
- ✅ Listes prédéfinies : Veille, Amélioration Continue, Plan développement de compétences, Questions Handicap, Gestion Des Distanciionnements, Text - **FAIT**
- ✅ Bouton "+ Ajouter Une Famille" orange (#FF9F43) - **FAIT**

---

### 2. MODULE : TABLEAU DE BORD

#### 2.1 Vue calendrier mensuelle
- ✅ Grille de 32 jours - **FAIT**
- ⚠️ **À VÉRIFIER** : Indicateur actif jour 4 (cercle bleu) - Actuellement utilise le jour actuel

#### 2.2 Section "DERNIERS ÉLÉMENTS"
- ✅ Nombre de formations (bouton "Voir" bleu) - **FAIT**
- ✅ Nombre de Sessions (bouton "Voir" bleu) - **FAIT**
- ✅ Nombre de collaborateurs (bouton "Voir" bleu) - **FAIT**

#### 2.3 Section "Notification du nouveau BPF"
- ✅ Message "Nouveau BPF" - **FAIT**
- ✅ Zone de modifications du BPF avec sections V et IV - **CORRIGÉ** (ajout de la duplication)

**Structure exacte selon doc :**
- Section V :
  - Modification du champ "V" section C (ligne 1)
  - Modification du champ "V" section C (ligne 2 - duplicate)
  - Modification du champ "V" section F
- Section IV :
  - Modification du champ "IV" section F

#### 2.4 Kanban Board
- ✅ Sélecteur de vue dropdown "Veille" - **FAIT**
- ✅ Bouton "+ Créer une famille" bleu (#4A8AFF) - **FAIT**
- ⚠️ **À VÉRIFIER** : Colonnes avec couleurs spécifiques :
  - Formation professionnelle : Bleu clair #E3F2FF
  - Métiers et emplois : Orange #FFF4E6
  - Innovations pédagogiques : Vert clair #E7F9F0
  - Handicap en formation : Violet clair #F3F0FF
- ⚠️ **À VÉRIFIER** : Boutons "+ Ajouter Une Carte" avec couleur correspondant à la colonne
- ⚠️ **À VÉRIFIER** : Badges de priorité "Low" (orange) et "High" (rouge)

---

### 3. MODULE : INDICATEURS

#### 3.1 Vue générale
- ✅ En-tête "Mes Indicateurs" avec icône favoris - **À VÉRIFIER**
- ✅ Grille de cartes indicateurs - **FAIT**

#### 3.2 Page détaillée d'un indicateur
- ✅ Fil d'Ariane : Critère X > Indicateur Y - **FAIT**
- ✅ Onglets : Formation | Quiz | Partie pratique - **FAIT**
- ✅ Panneau latéral droit avec navigation rapide (grille 3 colonnes, indicateurs 1-32) - **FAIT**
- ✅ Bouton "Ce former sur cette indicateur" - **FAIT**
- ✅ Section vidéo de formation avec player - **FAIT**
- ✅ Avertissement sous la vidéo - **FAIT**
- ✅ Sections : Description, Informations complémentaires - **FAIT**

#### 3.3 Onglets de l'indicateur
- ✅ Procédures - **FAIT**
- ✅ Modèles de document - **FAIT**
- ✅ Preuves - **FAIT**

---

### 4. MODULE : DOCUMENTS

#### 4.1 Bibliothèque de documents
- ✅ Recherche - **FAIT**
- ✅ Filtres avancés - **FAIT**
- ✅ Types : Procédures, Modèles, Preuves - **FAIT**

---

### 5. MODULE : BILAN PÉDAGOGIQUE ET FINANCIER (BPF)

#### 5.1 Structure du BPF
- ✅ En-tête officiel avec drapeau français - **FAIT**
- ✅ Titre "BILAN PÉDAGOGIQUE ET FINANCIER" - **FAIT**
- ✅ Sous-titre "RETRACANT L'ACTIVITÉ DU DISPENSATEUR DE FORMATION PROFESSIONNELLE" - **FAIT**
- ✅ Champs N° de déclaration (11 caractères) - **FAIT**
- ✅ Champs Numéro SIRET (14 caractères) - **FAIT**
- ✅ Sections A à H avec structure exacte - **FAIT**

#### 5.2 Sections du BPF (selon documentation lignes 540-671)

**Section A : IDENTIFICATION DE L'ORGANISME DE FORMATION**
- ✅ Numéro de déclaration - **FAIT**
- ✅ Numéro SIRET (2 champs) - **FAIT**
- ✅ Forme juridique - **FAIT**

**Section B : INFORMATIONS GÉNÉRALES**
- ✅ Exercice comptable (du/au) - **FAIT**
- ✅ Formation à distance (Oui/Non) - **FAIT**

**Section C : BILAN FINANCIER HORS TAXES - ORIGINE DES PRODUITS**
- ✅ Structure avec lignes 1 à 11 - **FAIT**
- ✅ Sous-lignes pour ligne 2 (a à h) - **FAIT**
- ✅ Total L (lignes 1 à 11) - **FAIT**
- ✅ Pourcentage du CA global - **FAIT**

**Section D : BILAN FINANCIER HORS TAXES - CHARGES**
- ✅ Total des charges - **FAIT**
- ✅ Dont salaires formateurs - **FAIT**
- ✅ Dont achats prestations - **FAIT**

**Section E : PERSONNES DISPENSANT DES HEURES DE FORMATION**
- ✅ Tableau avec colonnes : Nombre de formateurs | Nombre d'heures - **FAIT**
- ✅ Lignes : Personnel organisme, Formateurs externes, TOTAL - **FAIT**

**Section F : BILAN PÉDAGOGIQUE - STAGIAIRES**
- ✅ F-1 : TYPE DE STAGIAIRES (tableau avec catégories a-e) - **FAIT**
- ✅ F-2 : ACTIVITÉ SOUS-TRAITÉE - **FAIT**
- ✅ F-3 : OBJECTIF GÉNÉRAL DES PRESTATIONS (avec sous-niveaux pour F-3a) - **FAIT**
- ✅ F-4 : SPÉCIALITÉS DE FORMATION (5 principales + autres) - **FAIT**

**Section G : BILAN PÉDAGOGIQUE - STAGIAIRES CONFIÉS**
- ✅ Tableau simple avec TOTAL - **FAIT**

**Section H : PERSONNE AYANT LA QUALITÉ DE DIRIGEANT**
- ✅ Champs : Nom, Fonction - **FAIT**

#### 5.3 Notifications BPF dans le sidebar
- ✅ Affichage des modifications récentes avec nom utilisateur - **FAIT**
- ✅ Une seule notification par champ (avec debounce) - **CORRIGÉ**

---

### 6. MODALS ET FORMULAIRES

#### 6.1 Modal "Ajouter un Modèle"
- ✅ Titre "Ajouter un Modèle" - **FAIT**
- ✅ Champ "Quel nom lui donner ?" avec info tooltip - **FAIT**
- ✅ Upload document avec bouton "Sélectionner Le Fichier" - **FAIT**
- ✅ Sélection formation avec recherche - **FAIT**
- ✅ Sélection indicateurs avec liste scrollable - **FAIT**
- ✅ Bouton "Ajouter" bleu (#4A8AFF) - **FAIT**

#### 6.2 Modal "Ajouter une preuve"
- ✅ Titre "Ajouter une preuve" - **FAIT**
- ✅ Champ "Quel nom lui donner ?" - **FAIT**
- ✅ Sélection formation avec recherche - **FAIT**
- ✅ Sélection session avec recherche - **FAIT**
- ✅ Sélection apprenant avec recherche - **FAIT**
- ✅ Upload document - **FAIT**
- ✅ Sélection indicateurs - **FAIT**
- ✅ Bouton "Ajouter la Preuve" - **FAIT**

#### 6.3 Modal "Définir les indicateurs qui vous concernent"
- ✅ Section "Catégorie d'action de formation" avec 4 cartes sélectionnables - **FAIT**
- ✅ Section "Questions de personnalisation" avec 7 questions - **FAIT**
- ✅ Affichage des indicateurs affectés avec badges colorés - **FAIT**
- ✅ Bouton "Valider" bleu - **FAIT**

---

### 7. CODES COULEUR ET DESIGN SYSTEM

#### 7.1 Palette de couleurs
- ✅ Bleu primaire #4A8AFF - **FAIT**
- ✅ Orange #FF9F43 - **FAIT**
- ✅ Rouge #FF4757 - **FAIT**
- ✅ Vert #26DE81 - **FAIT**
- ✅ Violet #7B68EE - **FAIT**
- ✅ Orange très clair #FFE5CC (menu actif) - **FAIT**

#### 7.2 Couleurs de fond Kanban
- ⚠️ **À VÉRIFIER** : 
  - Formation professionnelle : #E3F2FF
  - Métiers et emplois : #FFF4E6
  - Innovations pédagogiques : #E7F9F0
  - Handicap en formation : #F3F0FF

---

## 🔄 ACTIONS PRIORITAIRES

1. **Vérifier les couleurs des colonnes Kanban** selon documentation
2. **Vérifier le calendrier** : Jour 4 actif par défaut (selon doc ligne 120)
3. **Vérifier les badges de priorité** : "Low" (orange) et "High" (rouge)
4. **Vérifier les boutons "+ Ajouter Une Carte"** avec couleur correspondant à la colonne
5. **Vérifier toutes les structures de modals** pour correspondance exacte

---

## 📝 NOTES IMPORTANTES

- Le système doit respecter **EXACTEMENT** la structure décrite dans la documentation
- Les couleurs doivent correspondre aux codes hexadécimaux spécifiés
- Les libellés doivent être identiques à ceux de la documentation
- Les sections BPF doivent suivre la structure exacte des lignes 540-671

