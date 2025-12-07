# Backend Requirements - Documents et Questionnaires (Étape 3/6 et 4/6)

## 📋 Résumé Exécutif

Cette documentation détaille les besoins backend pour les fonctionnalités avancées des **Documents** (étape 3/6) et **Questionnaires** (étape 4/6) lors de la création d'un cours.

### 🎯 Fonctionnalités Principales

**Documents :**
- ✅ Drag & drop pour réorganiser les documents
- ✅ Modification/suppression du logo
- ✅ Ajout de sous-titre
- ✅ Sections avancées (texte, tableau, liste séances, signature)
- ✅ Mentions légales (masquables mais non supprimables)

**Questionnaires :**
- ✅ Drag & drop pour réorganiser les questions
- ✅ 6 nouveaux types de questions (single, multiple, ordered, date, file, linear scale)
- ✅ Templates de questions (satisfaction, recommendation, statistiques pédagogiques)
- ✅ Alimentation automatique des statistiques de session

### ⚠️ Priorité

**Haute priorité** : Toutes les fonctionnalités sont nécessaires pour compléter l'étape 3/6 et 4/6 selon les spécifications Figma.

---

## Contexte

Lors de la création d'un cours, les étapes 3/6 (Documents) et 4/6 (Questionnaires) nécessitent des fonctionnalités avancées qui requièrent des ajustements backend.

---

## 📄 PARTIE 1 : DOCUMENTS (Étape 3/6)

### 1.1 Drag & Drop pour Réorganiser les Documents

**Besoin** : Permettre de réorganiser l'ordre d'affichage des documents par drag & drop.

**Endpoint requis** :
```
PUT /api/organization/courses/{courseUuid}/documents/reorder
```

**Body** :
```json
{
  "document_orders": [
    { "document_id": 1, "position": 0 },
    { "document_id": 2, "position": 1 },
    { "document_id": 3, "position": 2 }
  ]
}
```

**Réponse** :
```json
{
  "success": true,
  "message": "Ordre des documents mis à jour"
}
```

**Notes** :
- Mettre à jour le champ `position` (ou `order_index`) de chaque document
- Valider que tous les documents appartiennent au cours
- Transaction pour garantir la cohérence

---

### 1.2 Modification du Document Builder (Logo, Sous-titre, Sections)

**Besoin** : Permettre de modifier les éléments du document builder :
- Logo (upload/modification/suppression)
- Sous-titre
- Sections (texte avec/sans tableau, liste des séances, espace signature)
- Mentions légales (masquables mais non supprimables)

**Endpoint existant** :
```
PUT /api/organization/courses/{courseUuid}/documents-enhanced/{documentId}
```

**Structure de données attendue** :

```json
{
  "name": "Nom du document",
  "subtitle": "Sous-titre du document",  // ⚠️ NOUVEAU
  "logo_url": "https://...",              // ⚠️ MODIFIABLE
  "logo_file": null,                      // ⚠️ Pour upload nouveau logo
  "remove_logo": false,                   // ⚠️ NOUVEAU - Pour supprimer le logo
  "sections": [                           // ⚠️ NOUVEAU - Structure des sections
    {
      "id": 1,
      "type": "text",                     // "text" | "text_with_table" | "session_list" | "signature_space"
      "content": "Contenu texte...",
      "order": 0,
      "table_data": null                  // Si type = "text_with_table"
    },
    {
      "id": 2,
      "type": "text_with_table",
      "content": "Tableau des résultats",
      "order": 1,
      "table_data": {
        "headers": ["Colonne 1", "Colonne 2"],
        "rows": [
          ["Valeur 1", "Valeur 2"],
          ["Valeur 3", "Valeur 4"]
        ]
      }
    },
    {
      "id": 3,
      "type": "session_list",
      "content": "Liste des séances",
      "order": 2,
      "session_filter": "all"             // "all" | "completed" | "upcoming"
    },
    {
      "id": 4,
      "type": "signature_space",
      "content": "Espace signature",
      "order": 3,
      "signature_fields": [
        { "label": "Formateur", "required": true },
        { "label": "Participant", "required": true }
      ]
    }
  ],
  "legal_mentions": {                     // ⚠️ NOUVEAU
    "content": "Mentions légales...",
    "is_visible": true                    // Peut être masqué mais jamais supprimé
  }
}
```

**Structure de base de données suggérée** :

```sql
-- Table pour les sections de document
CREATE TABLE document_sections (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    document_id BIGINT NOT NULL,
    type ENUM('text', 'text_with_table', 'session_list', 'signature_space') NOT NULL,
    content TEXT,
    order_index INT NOT NULL DEFAULT 0,
    table_data JSON,                      -- Pour les tableaux
    session_filter VARCHAR(50),            -- Pour session_list
    signature_fields JSON,                 -- Pour signature_space
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (document_id) REFERENCES course_documents(id) ON DELETE CASCADE,
    INDEX idx_document_order (document_id, order_index)
);

-- Ajout de colonnes à course_documents
ALTER TABLE course_documents
    ADD COLUMN subtitle VARCHAR(255) NULL,
    ADD COLUMN logo_url VARCHAR(500) NULL,
    ADD COLUMN legal_mentions_content TEXT NULL,
    ADD COLUMN legal_mentions_visible BOOLEAN DEFAULT TRUE;
```

**Endpoints supplémentaires** :

1. **Supprimer le logo** :
```
DELETE /api/organization/courses/{courseUuid}/documents-enhanced/{documentId}/logo
```

2. **Upload nouveau logo** :
```
POST /api/organization/courses/{courseUuid}/documents-enhanced/{documentId}/logo
Content-Type: multipart/form-data

logo: [file]
```

---

### 1.3 Drag & Drop des Sections dans le Document

**Besoin** : Permettre de réorganiser l'ordre des sections dans un document.

**Endpoint requis** :
```
PUT /api/organization/courses/{courseUuid}/documents-enhanced/{documentId}/sections/reorder
```

**Body** :
```json
{
  "section_orders": [
    { "section_id": 1, "order": 0 },
    { "section_id": 2, "order": 1 },
    { "section_id": 3, "order": 2 }
  ]
}
```

---

## 📝 PARTIE 2 : QUESTIONNAIRES (Étape 4/6)

### 2.1 Drag & Drop pour Réorganiser les Questions

**Besoin** : Permettre de réorganiser l'ordre des questions dans un questionnaire.

**Endpoint requis** :
```
PUT /api/organization/course-creation/courses/{courseUuid}/questionnaires/{questionnaireId}/questions/reorder
```

**Body** :
```json
{
  "question_orders": [
    { "question_id": 1, "order": 0 },
    { "question_id": 2, "order": 1 },
    { "question_id": 3, "order": 2 }
  ]
}
```

---

### 2.2 Types de Questions Avancés

**Besoin** : Ajouter de nouveaux types de questions avec leurs configurations spécifiques.

**Endpoint existant** :
```
POST /api/organization/course-creation/courses/{courseUuid}/questionnaires/{questionnaireId}/questions
PUT /api/organization/course-creation/courses/{courseUuid}/questionnaires/{questionnaireId}/questions/{questionId}
```

**Types de questions à supporter** :

#### 2.2.1 Réponse Unique (Single Choice)
```json
{
  "type": "single_choice",
  "title": "Question à choix unique",
  "description": "Description optionnelle",
  "required": true,
  "options": [
    { "id": 1, "text": "Option 1", "order": 0 },
    { "id": 2, "text": "Option 2", "order": 1 }
  ]
}
```

#### 2.2.2 Réponse Multiple (Multiple Choice)
```json
{
  "type": "multiple_choice",
  "title": "Question à choix multiples",
  "description": "Description optionnelle",
  "required": true,
  "options": [
    { "id": 1, "text": "Option 1", "order": 0 },
    { "id": 2, "text": "Option 2", "order": 1 }
  ],
  "min_selections": 1,        // ⚠️ NOUVEAU
  "max_selections": 3         // ⚠️ NOUVEAU
}
```

#### 2.2.3 Réponse Ordonnée (Ordered Choice)
```json
{
  "type": "ordered_choice",
  "title": "Classez par ordre de préférence",
  "description": "Description optionnelle",
  "required": true,
  "options": [
    { "id": 1, "text": "Option 1", "order": 0 },
    { "id": 2, "text": "Option 2", "order": 1 }
  ]
}
```

#### 2.2.4 Date
```json
{
  "type": "date",
  "title": "Date de naissance",
  "description": "Description optionnelle",
  "required": true,
  "date_format": "YYYY-MM-DD",    // ⚠️ NOUVEAU
  "min_date": "1900-01-01",        // ⚠️ NOUVEAU (optionnel)
  "max_date": "2025-12-31"         // ⚠️ NOUVEAU (optionnel)
}
```

#### 2.2.5 Réponse par Fichier (File Answer)
```json
{
  "type": "file_upload",
  "title": "Joindre un fichier",
  "description": "Description optionnelle",
  "required": true,
  "file_count": {                 // ⚠️ NOUVEAU
    "min": 1,
    "max": 5
  },
  "file_size": {                  // ⚠️ NOUVEAU (en MB)
    "max": 10
  },
  "allowed_extensions": [         // ⚠️ NOUVEAU
    "pdf", "doc", "docx", "jpg", "png"
  ]
}
```

#### 2.2.6 Échelle Linéaire (Linear Scale)
```json
{
  "type": "linear_scale",
  "title": "Évaluez votre satisfaction",
  "description": "Description optionnelle",
  "required": true,
  "scale": {                      // ⚠️ NOUVEAU
    "min": 1,
    "max": 10,
    "min_label": "Très insatisfait",    // ⚠️ NOUVEAU
    "max_label": "Très satisfait"       // ⚠️ NOUVEAU
  },
  "hover_labels": {               // ⚠️ NOUVEAU - Texte au survol
    "1": "Très insatisfait",
    "2": "Insatisfait",
    "3": "Peu satisfait",
    "4": "Neutre",
    "5": "Assez satisfait",
    "6": "Satisfait",
    "7": "Très satisfait",
    "8": "Excellent",
    "9": "Parfait",
    "10": "Exceptionnel"
  }
}
```

**Structure de base de données suggérée** :

```sql
-- Table pour les questions
CREATE TABLE questionnaire_questions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    questionnaire_id BIGINT NOT NULL,
    type ENUM('single_choice', 'multiple_choice', 'ordered_choice', 'date', 'file_upload', 'linear_scale', 'text', 'textarea') NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    required BOOLEAN DEFAULT FALSE,
    order_index INT NOT NULL DEFAULT 0,
    
    -- Configuration spécifique par type (JSON)
    config JSON,
    /*
    Exemple de config pour chaque type :
    - single_choice/multiple_choice/ordered_choice: { "options": [...], "min_selections": 1, "max_selections": 3 }
    - date: { "date_format": "YYYY-MM-DD", "min_date": "1900-01-01", "max_date": "2025-12-31" }
    - file_upload: { "file_count": { "min": 1, "max": 5 }, "file_size": { "max": 10 }, "allowed_extensions": [...] }
    - linear_scale: { "scale": { "min": 1, "max": 10, "min_label": "...", "max_label": "..." }, "hover_labels": {...} }
    */
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (questionnaire_id) REFERENCES questionnaires(id) ON DELETE CASCADE,
    INDEX idx_questionnaire_order (questionnaire_id, order_index)
);

-- Table pour les options de questions (si nécessaire)
CREATE TABLE question_options (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    question_id BIGINT NOT NULL,
    text VARCHAR(500) NOT NULL,
    order_index INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (question_id) REFERENCES questionnaire_questions(id) ON DELETE CASCADE,
    INDEX idx_question_order (question_id, order_index)
);
```

---

### 2.3 Templates de Questions

**Besoin** : Permettre d'ajouter des templates de questions pré-configurées qui alimentent les statistiques.

**Templates à créer** :

#### 2.3.1 Question de Satisfaction
```json
{
  "template_name": "satisfaction",
  "template_label": "Question de satisfaction",
  "question": {
    "type": "linear_scale",
    "title": "Dans quelle mesure êtes-vous satisfait de cette formation ?",
    "scale": {
      "min": 1,
      "max": 10,
      "min_label": "Très insatisfait",
      "max_label": "Très satisfait"
    },
    "hover_labels": {
      "1": "Très insatisfait",
      "5": "Neutre",
      "10": "Très satisfait"
    },
    "feeds_statistics": true,        // ⚠️ NOUVEAU
    "statistics_key": "satisfaction"  // ⚠️ NOUVEAU - Clé pour les stats
  }
}
```

#### 2.3.2 Question de Recommandation
```json
{
  "template_name": "recommendation",
  "template_label": "Question de recommandation",
  "question": {
    "type": "single_choice",
    "title": "Recommanderiez-vous cette formation à un collègue ?",
    "options": [
      { "text": "Oui", "order": 0 },
      { "text": "Non", "order": 1 }
    ],
    "feeds_statistics": true,
    "statistics_key": "recommendation"
  }
}
```

#### 2.3.3 Statistiques Pédagogiques (6 questions)
```json
{
  "template_name": "pedagogical_stats",
  "template_label": "Statistiques pédagogiques",
  "questions": [
    {
      "type": "linear_scale",
      "title": "Clarté des explications",
      "scale": { "min": 1, "max": 10, "min_label": "Très flou", "max_label": "Très clair" },
      "feeds_statistics": true,
      "statistics_key": "pedagogical_clarity"
    },
    {
      "type": "linear_scale",
      "title": "Pertinence du contenu",
      "scale": { "min": 1, "max": 10, "min_label": "Pas pertinent", "max_label": "Très pertinent" },
      "feeds_statistics": true,
      "statistics_key": "pedagogical_relevance"
    },
    {
      "type": "linear_scale",
      "title": "Qualité des supports",
      "scale": { "min": 1, "max": 10, "min_label": "Médiocre", "max_label": "Excellent" },
      "feeds_statistics": true,
      "statistics_key": "pedagogical_supports"
    },
    {
      "type": "linear_scale",
      "title": "Rythme de la formation",
      "scale": { "min": 1, "max": 10, "min_label": "Trop lent", "max_label": "Trop rapide" },
      "feeds_statistics": true,
      "statistics_key": "pedagogical_pace"
    },
    {
      "type": "linear_scale",
      "title": "Interactivité",
      "scale": { "min": 1, "max": 10, "min_label": "Pas interactif", "max_label": "Très interactif" },
      "feeds_statistics": true,
      "statistics_key": "pedagogical_interactivity"
    },
    {
      "type": "linear_scale",
      "title": "Application pratique",
      "scale": { "min": 1, "max": 10, "min_label": "Pas pratique", "max_label": "Très pratique" },
      "feeds_statistics": true,
      "statistics_key": "pedagogical_practical"
    }
  ]
}
```

**Endpoint pour ajouter un template** :
```
POST /api/organization/course-creation/courses/{courseUuid}/questionnaires/{questionnaireId}/questions/from-template
```

**Body** :
```json
{
  "template_name": "satisfaction" | "recommendation" | "pedagogical_stats",
  "customizations": {
    "title": "Titre personnalisé (optionnel)"
  }
}
```

**Réponse** :
```json
{
  "success": true,
  "data": {
    "questions": [
      { "id": 1, "type": "linear_scale", ... }
    ]
  }
}
```

---

### 2.4 Alimentation des Statistiques

**Besoin** : Les questions avec `feeds_statistics: true` doivent alimenter les statistiques de session.

**Structure de données pour les statistiques** :

```sql
-- Table pour les réponses aux questions de statistiques
CREATE TABLE questionnaire_statistics_responses (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    session_id BIGINT NOT NULL,
    question_id BIGINT NOT NULL,
    participant_id BIGINT,
    statistics_key VARCHAR(100) NOT NULL,  -- "satisfaction", "recommendation", etc.
    value DECIMAL(10,2),                    -- Pour linear_scale
    text_value VARCHAR(500),                 -- Pour single_choice, multiple_choice
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES course_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES questionnaire_questions(id) ON DELETE CASCADE,
    INDEX idx_session_statistics (session_id, statistics_key)
);
```

**Endpoint pour récupérer les statistiques** :
```
GET /api/admin/organization/course-sessions/{sessionUuid}/statistics/questionnaire
```

**Réponse** :
```json
{
  "success": true,
  "data": {
    "satisfaction": {
      "average": 8.5,
      "count": 25,
      "distribution": {
        "1": 0, "2": 0, "3": 1, "4": 2, "5": 3,
        "6": 4, "7": 5, "8": 6, "9": 3, "10": 1
      }
    },
    "recommendation": {
      "yes": 20,
      "no": 5,
      "percentage_yes": 80
    },
    "pedagogical_stats": {
      "clarity": { "average": 8.2, "count": 25 },
      "relevance": { "average": 8.7, "count": 25 },
      "supports": { "average": 7.9, "count": 25 },
      "pace": { "average": 8.1, "count": 25 },
      "interactivity": { "average": 7.5, "count": 25 },
      "practical": { "average": 8.4, "count": 25 }
    }
  }
}
```

---

## ✅ Checklist de Mise en Œuvre

### Documents
- [ ] Endpoint `PUT /documents/reorder` pour réorganiser les documents
- [ ] Ajout du champ `subtitle` dans la table `course_documents`
- [ ] Support de `logo_url` et `remove_logo` dans l'endpoint de mise à jour
- [ ] Endpoint `POST /documents-enhanced/{id}/logo` pour upload logo
- [ ] Endpoint `DELETE /documents-enhanced/{id}/logo` pour supprimer logo
- [ ] Table `document_sections` avec support des 4 types de sections
- [ ] Endpoint `PUT /documents-enhanced/{id}/sections/reorder` pour réorganiser les sections
- [ ] Support des mentions légales (non supprimables, masquables)

### Questionnaires
- [ ] Endpoint `PUT /questionnaires/{id}/questions/reorder` pour réorganiser les questions
- [ ] Support de tous les types de questions (single, multiple, ordered, date, file, linear_scale)
- [ ] Configuration JSON pour chaque type de question (min/max, labels, hover text, etc.)
- [ ] Templates de questions (satisfaction, recommendation, pedagogical_stats)
- [ ] Endpoint `POST /questionnaires/{id}/questions/from-template`
- [ ] Table `questionnaire_statistics_responses` pour stocker les réponses
- [ ] Endpoint `GET /course-sessions/{uuid}/statistics/questionnaire` pour récupérer les stats
- [ ] Logique d'alimentation automatique des statistiques lors de la soumission

---

## 📝 Notes Importantes

1. **Performance** : Les opérations de réorganisation (drag & drop) doivent être optimisées avec des transactions
2. **Validation** : Valider les contraintes (min/max selections, file size, date ranges, etc.)
3. **Sécurité** : Vérifier les permissions (seul le créateur du cours peut modifier)
4. **Compatibilité** : S'assurer que les anciens documents/questionnaires continuent de fonctionner
5. **Logging** : Logger les modifications importantes (upload logo, ajout sections, etc.)

---

## 🔗 Endpoints Existants à Vérifier

- `GET /api/organization/courses/{courseUuid}/documents-enhanced` - Doit retourner les nouvelles données (sections, subtitle, logo)
- `GET /api/organization/course-creation/courses/{courseUuid}/questionnaires/{id}` - Doit retourner les questions avec leurs configurations
- `POST /api/organization/course-creation/courses/{courseUuid}/questionnaires/{id}/questions` - Doit accepter les nouveaux types

