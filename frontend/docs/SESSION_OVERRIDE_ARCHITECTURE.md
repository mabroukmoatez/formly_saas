# 🏗️ Architecture Session Override - Héritage Cours → Session

> **Document OBLIGATOIRE pour l'équipe Backend**  
> Date: 04/12/2025  
> Priorité: **CRITIQUE**  
> Le frontend sera développé selon cette spécification.

---

## 📋 Table des Matières

1. [Concept](#concept)
2. [Schéma de Base de Données](#schéma-de-base-de-données)
3. [Logique d'Override](#logique-doverride)
4. [Endpoints API](#endpoints-api)
5. [Exemples de Réponses](#exemples-de-réponses)
6. [Règles Métier](#règles-métier)

---

## 🎯 Concept

### Principe Fondamental

```
COURS (Template)          SESSION (Instance)
================          ==================
- Contenu pédagogique     - Hérite du cours
- Chapitres               - PEUT OVERRIDE n'importe quelle donnée
- Documents               - Modifications stockées dans la SESSION
- Informations générales  - Template JAMAIS modifié
```

### Exemple Concret

```
┌──────────────────────────────────────────────────────────────────────┐
│ COURS TEMPLATE: "Formation React Avancé"                             │
│ ─────────────────────────────────────────                            │
│ • Titre: "Formation React Avancé"                                    │
│ • Durée: 35h                                                         │
│ • Prix: 2500€                                                        │
│ • Chapitres: [Ch1, Ch2, Ch3, Ch4, Ch5]                              │
│ • Documents: [Programme.pdf, Support.pdf]                            │
│ • Formateurs disponibles: [Alice, Bob, Charlie]                      │
└──────────────────────────────────────────────────────────────────────┘
                              │
            ┌─────────────────┼─────────────────┐
            ▼                 ▼                 ▼
┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐
│ SESSION: Mars 2025  │ │ SESSION: Avril 2025 │ │ SESSION: Mai 2025   │
│ ─────────────────── │ │ ─────────────────── │ │ ─────────────────── │
│                     │ │                     │ │                     │
│ title_override:     │ │ title_override:     │ │ title_override:     │
│ "React - Intensif"  │ │ null (hérite)       │ │ "React pour Devs"   │
│                     │ │                     │ │                     │
│ price_override:     │ │ price_override:     │ │ price_override:     │
│ 2000€ (promo)       │ │ null (hérite)       │ │ 3000€ (premium)     │
│                     │ │                     │ │                     │
│ chapters_override:  │ │ chapters_override:  │ │ chapters_override:  │
│ null (hérite)       │ │ [Ch1, Ch2] (réduit) │ │ null (hérite)       │
│                     │ │                     │ │                     │
│ trainers:           │ │ trainers:           │ │ trainers:           │
│ [Alice]             │ │ [Bob]               │ │ [Alice, Charlie]    │
└─────────────────────┘ └─────────────────────┘ └─────────────────────┘

RÉSULTAT AFFICHÉ:
─────────────────
Session Mars:     Session Avril:    Session Mai:
• "React-Intensif"• "Formation..."  • "React pour Devs"
• 2000€           • 2500€           • 3000€
• 5 chapitres     • 2 chapitres     • 5 chapitres
```

---

## 💾 Schéma de Base de Données

### Table `course_sessions` (À MODIFIER)

```sql
-- Colonnes EXISTANTES (ne pas toucher)
ALTER TABLE course_sessions ADD COLUMN IF NOT EXISTS course_uuid UUID REFERENCES courses(uuid);
ALTER TABLE course_sessions ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE course_sessions ADD COLUMN IF NOT EXISTS end_date DATE;
-- ... autres colonnes existantes ...

-- NOUVELLES COLONNES D'OVERRIDE (à ajouter)
ALTER TABLE course_sessions ADD COLUMN title_override VARCHAR(255) DEFAULT NULL;
ALTER TABLE course_sessions ADD COLUMN subtitle_override VARCHAR(500) DEFAULT NULL;
ALTER TABLE course_sessions ADD COLUMN description_override TEXT DEFAULT NULL;
ALTER TABLE course_sessions ADD COLUMN duration_override INTEGER DEFAULT NULL;
ALTER TABLE course_sessions ADD COLUMN duration_unit_override VARCHAR(20) DEFAULT NULL;
ALTER TABLE course_sessions ADD COLUMN price_ht_override DECIMAL(10,2) DEFAULT NULL;
ALTER TABLE course_sessions ADD COLUMN vat_rate_override DECIMAL(5,2) DEFAULT NULL;
ALTER TABLE course_sessions ADD COLUMN image_url_override VARCHAR(500) DEFAULT NULL;
ALTER TABLE course_sessions ADD COLUMN intro_video_override VARCHAR(500) DEFAULT NULL;
ALTER TABLE course_sessions ADD COLUMN objectives_override JSONB DEFAULT NULL;
ALTER TABLE course_sessions ADD COLUMN prerequisites_override JSONB DEFAULT NULL;
ALTER TABLE course_sessions ADD COLUMN target_audience_override JSONB DEFAULT NULL;
ALTER TABLE course_sessions ADD COLUMN certification_override JSONB DEFAULT NULL;

-- Flag pour indiquer si les chapitres sont overridés
ALTER TABLE course_sessions ADD COLUMN has_chapters_override BOOLEAN DEFAULT FALSE;
-- Flag pour indiquer si les documents sont overridés  
ALTER TABLE course_sessions ADD COLUMN has_documents_override BOOLEAN DEFAULT FALSE;
-- Flag pour indiquer si le workflow est overridé
ALTER TABLE course_sessions ADD COLUMN has_workflow_override BOOLEAN DEFAULT FALSE;

-- Index pour performance
CREATE INDEX idx_course_sessions_course_uuid ON course_sessions(course_uuid);
```

### Table `session_chapters` (NOUVELLE)

```sql
CREATE TABLE session_chapters (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    session_uuid UUID NOT NULL REFERENCES course_sessions(uuid) ON DELETE CASCADE,
    
    -- Référence au chapitre original (null si nouveau chapitre)
    original_chapter_uuid UUID REFERENCES chapters(uuid) ON DELETE SET NULL,
    
    -- Données du chapitre (override ou nouveau)
    title VARCHAR(255) NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    duration INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Métadonnées
    is_new BOOLEAN DEFAULT FALSE, -- true si chapitre ajouté pour cette session
    is_removed BOOLEAN DEFAULT FALSE, -- true si chapitre du template supprimé pour cette session
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_session_chapters_session ON session_chapters(session_uuid);
```

### Table `session_sub_chapters` (NOUVELLE)

```sql
CREATE TABLE session_sub_chapters (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    session_chapter_uuid UUID NOT NULL REFERENCES session_chapters(uuid) ON DELETE CASCADE,
    
    -- Référence au sous-chapitre original
    original_sub_chapter_uuid UUID REFERENCES sub_chapters(uuid) ON DELETE SET NULL,
    
    -- Données
    title VARCHAR(255) NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    duration INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    
    is_new BOOLEAN DEFAULT FALSE,
    is_removed BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Table `session_documents` (NOUVELLE)

```sql
CREATE TABLE session_documents (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    session_uuid UUID NOT NULL REFERENCES course_sessions(uuid) ON DELETE CASCADE,
    
    -- Référence au document original
    original_document_uuid UUID REFERENCES course_documents(uuid) ON DELETE SET NULL,
    
    -- Données
    title VARCHAR(255) NOT NULL,
    description TEXT,
    file_url VARCHAR(500),
    file_type VARCHAR(50),
    file_size INTEGER,
    document_type VARCHAR(50), -- 'support', 'exercise', 'resource', etc.
    visibility VARCHAR(50) DEFAULT 'all', -- 'all', 'trainers_only', 'participants_only'
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    
    is_new BOOLEAN DEFAULT FALSE,
    is_removed BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_session_documents_session ON session_documents(session_uuid);
```

### Table `session_workflow_actions` (NOUVELLE)

```sql
CREATE TABLE session_workflow_actions (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    session_uuid UUID NOT NULL REFERENCES course_sessions(uuid) ON DELETE CASCADE,
    
    -- Référence à l'action workflow originale
    original_action_uuid UUID DEFAULT NULL,
    
    -- Données
    action_type VARCHAR(50) NOT NULL, -- 'send_email', 'send_document', 'send_questionnaire', etc.
    trigger_type VARCHAR(50) NOT NULL, -- 'before_session', 'after_session', 'before_slot', 'after_slot'
    trigger_days INTEGER DEFAULT 0, -- Nombre de jours avant/après
    target_type VARCHAR(50) NOT NULL, -- 'participants', 'trainers', 'all'
    
    -- Configuration
    email_template_uuid UUID,
    document_uuids JSONB DEFAULT '[]',
    questionnaire_uuids JSONB DEFAULT '[]',
    custom_message TEXT,
    
    is_active BOOLEAN DEFAULT TRUE,
    is_new BOOLEAN DEFAULT FALSE,
    is_removed BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🔄 Logique d'Override

### Règle Principale

```
VALEUR_AFFICHÉE = session.field_override ?? course.field
```

En PHP/Laravel:

```php
class CourseSession extends Model
{
    /**
     * Get effective title (override or inherited)
     */
    public function getEffectiveTitleAttribute(): string
    {
        return $this->title_override ?? $this->course->title;
    }

    /**
     * Get effective description
     */
    public function getEffectiveDescriptionAttribute(): ?string
    {
        return $this->description_override ?? $this->course->description;
    }

    /**
     * Get effective price
     */
    public function getEffectivePriceAttribute(): ?float
    {
        return $this->price_ht_override ?? $this->course->price_ht;
    }

    /**
     * Get effective chapters
     */
    public function getEffectiveChaptersAttribute(): Collection
    {
        if ($this->has_chapters_override) {
            return $this->sessionChapters()
                ->where('is_removed', false)
                ->orderBy('order_index')
                ->get();
        }
        
        return $this->course->chapters()
            ->where('is_active', true)
            ->orderBy('order_index')
            ->get();
    }

    /**
     * Get effective documents
     */
    public function getEffectiveDocumentsAttribute(): Collection
    {
        if ($this->has_documents_override) {
            return $this->sessionDocuments()
                ->where('is_removed', false)
                ->orderBy('order_index')
                ->get();
        }
        
        return $this->course->documents()
            ->where('is_active', true)
            ->get();
    }
}
```

### Initialisation des Overrides

Quand on veut modifier les chapitres d'une session pour la première fois :

```php
class SessionOverrideService
{
    /**
     * Initialize chapter overrides by copying from course template
     */
    public function initializeChaptersOverride(CourseSession $session): void
    {
        if ($session->has_chapters_override) {
            return; // Already initialized
        }

        DB::transaction(function () use ($session) {
            // Copy all chapters from course to session
            foreach ($session->course->chapters as $chapter) {
                $sessionChapter = SessionChapter::create([
                    'session_uuid' => $session->uuid,
                    'original_chapter_uuid' => $chapter->uuid,
                    'title' => $chapter->title,
                    'description' => $chapter->description,
                    'order_index' => $chapter->order_index,
                    'duration' => $chapter->duration,
                    'is_active' => $chapter->is_active,
                    'is_new' => false,
                ]);

                // Copy sub-chapters
                foreach ($chapter->subChapters as $subChapter) {
                    SessionSubChapter::create([
                        'session_chapter_uuid' => $sessionChapter->uuid,
                        'original_sub_chapter_uuid' => $subChapter->uuid,
                        'title' => $subChapter->title,
                        'description' => $subChapter->description,
                        'order_index' => $subChapter->order_index,
                        'duration' => $subChapter->duration,
                        'is_active' => $subChapter->is_active,
                        'is_new' => false,
                    ]);
                }
            }

            $session->update(['has_chapters_override' => true]);
        });
    }

    /**
     * Initialize documents override
     */
    public function initializeDocumentsOverride(CourseSession $session): void
    {
        if ($session->has_documents_override) {
            return;
        }

        DB::transaction(function () use ($session) {
            foreach ($session->course->documents as $doc) {
                SessionDocument::create([
                    'session_uuid' => $session->uuid,
                    'original_document_uuid' => $doc->uuid,
                    'title' => $doc->title,
                    'description' => $doc->description,
                    'file_url' => $doc->file_url,
                    'file_type' => $doc->file_type,
                    'file_size' => $doc->file_size,
                    'document_type' => $doc->document_type,
                    'order_index' => $doc->order_index,
                    'is_new' => false,
                ]);
            }

            $session->update(['has_documents_override' => true]);
        });
    }
}
```

---

## 🔌 Endpoints API

### 1. GET Session avec données effectives

```http
GET /api/admin/organization/course-sessions/{uuid}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "uuid": "session-uuid-123",
    "course_uuid": "course-uuid-456",
    
    "title": "Formation React - Intensif Mars",
    "title_override": "Formation React - Intensif Mars",
    "title_inherited": false,
    
    "description": "Description personnalisée...",
    "description_override": "Description personnalisée...",
    "description_inherited": false,
    
    "price_ht": 2000.00,
    "price_ht_override": 2000.00,
    "price_inherited": false,
    
    "duration": 35,
    "duration_override": null,
    "duration_inherited": true,
    
    "has_chapters_override": true,
    "has_documents_override": false,
    "has_workflow_override": false,
    
    "course": {
      "uuid": "course-uuid-456",
      "title": "Formation React Avancé",
      "description": "Description originale...",
      "price_ht": 2500.00,
      "duration": 35
    },
    
    "effective_chapters": [...],
    "effective_documents": [...],
    "effective_workflow_actions": [...],
    
    "start_date": "2025-03-01",
    "end_date": "2025-03-05",
    "trainers": [...],
    "participants": [...],
    "slots": [...]
  }
}
```

### 2. PUT Update Session Override

```http
PUT /api/admin/organization/course-sessions/{uuid}
```

**Request Body:**

```json
{
  "title_override": "Nouveau titre pour cette session",
  "description_override": "Nouvelle description",
  "price_ht_override": 1999.99,
  "duration_override": null,
  
  "start_date": "2025-03-01",
  "end_date": "2025-03-05",
  "trainer_uuids": ["trainer-uuid-1"]
}
```

**Règles:**
- `field_override: "value"` → Définit un override
- `field_override: null` → Supprime l'override, revient à la valeur du cours

### 3. Gestion des Chapitres Override

#### 3.1 Initialiser l'override des chapitres

```http
POST /api/admin/organization/course-sessions/{uuid}/initialize-chapters-override
```

**Description:** Copie les chapitres du cours template vers la session pour permettre les modifications.

**Response:**

```json
{
  "success": true,
  "message": "Chapters override initialized",
  "data": {
    "chapters_count": 5,
    "sub_chapters_count": 12
  }
}
```

#### 3.2 Liste des chapitres effectifs

```http
GET /api/admin/organization/course-sessions/{uuid}/effective-chapters
```

**Response:**

```json
{
  "success": true,
  "data": {
    "has_override": true,
    "chapters": [
      {
        "uuid": "session-chapter-uuid-1",
        "original_chapter_uuid": "course-chapter-uuid-1",
        "title": "Introduction modifiée",
        "description": "...",
        "order_index": 0,
        "is_new": false,
        "is_modified": true,
        "sub_chapters": [...]
      },
      {
        "uuid": "session-chapter-uuid-new",
        "original_chapter_uuid": null,
        "title": "Nouveau chapitre spécifique",
        "description": "Ajouté pour cette session",
        "order_index": 5,
        "is_new": true,
        "is_modified": false,
        "sub_chapters": []
      }
    ]
  }
}
```

#### 3.3 Modifier un chapitre de session

```http
PUT /api/admin/organization/course-sessions/{session_uuid}/chapters/{chapter_uuid}
```

**Request:**

```json
{
  "title": "Nouveau titre du chapitre",
  "description": "Nouvelle description",
  "order_index": 2
}
```

#### 3.4 Ajouter un chapitre spécifique à la session

```http
POST /api/admin/organization/course-sessions/{uuid}/chapters
```

**Request:**

```json
{
  "title": "Chapitre bonus",
  "description": "Contenu spécifique à cette session",
  "order_index": 10
}
```

#### 3.5 Supprimer un chapitre de la session

```http
DELETE /api/admin/organization/course-sessions/{session_uuid}/chapters/{chapter_uuid}
```

**Note:** Ne supprime pas vraiment, met `is_removed = true`

#### 3.6 Restaurer un chapitre supprimé

```http
POST /api/admin/organization/course-sessions/{session_uuid}/chapters/{chapter_uuid}/restore
```

#### 3.7 Réinitialiser les chapitres (revenir au template)

```http
DELETE /api/admin/organization/course-sessions/{uuid}/chapters-override
```

**Description:** Supprime tous les overrides de chapitres et revient aux chapitres du cours template.

### 4. Gestion des Documents Override

#### 4.1 Initialiser l'override des documents

```http
POST /api/admin/organization/course-sessions/{uuid}/initialize-documents-override
```

#### 4.2 Liste des documents effectifs

```http
GET /api/admin/organization/course-sessions/{uuid}/effective-documents
```

#### 4.3 Ajouter un document spécifique

```http
POST /api/admin/organization/course-sessions/{uuid}/documents
```

**Request (multipart/form-data):**

```
title: "Document spécifique session"
description: "..."
document_type: "support"
file: [binary]
```

#### 4.4 Modifier un document

```http
PUT /api/admin/organization/course-sessions/{session_uuid}/documents/{document_uuid}
```

#### 4.5 Supprimer un document

```http
DELETE /api/admin/organization/course-sessions/{session_uuid}/documents/{document_uuid}
```

#### 4.6 Réinitialiser les documents

```http
DELETE /api/admin/organization/course-sessions/{uuid}/documents-override
```

### 5. Gestion du Workflow Override

#### 5.1 Initialiser l'override du workflow

```http
POST /api/admin/organization/course-sessions/{uuid}/initialize-workflow-override
```

#### 5.2 Liste des actions workflow effectives

```http
GET /api/admin/organization/course-sessions/{uuid}/effective-workflow-actions
```

#### 5.3 CRUD sur les actions

```http
POST /api/admin/organization/course-sessions/{uuid}/workflow-actions
PUT /api/admin/organization/course-sessions/{session_uuid}/workflow-actions/{action_uuid}
DELETE /api/admin/organization/course-sessions/{session_uuid}/workflow-actions/{action_uuid}
```

---

## 📦 Exemples de Réponses Complètes

### Session SANS Override (hérite tout du cours)

```json
{
  "success": true,
  "data": {
    "uuid": "session-123",
    "course_uuid": "course-456",
    
    "title": "Formation React Avancé",
    "title_override": null,
    "title_inherited": true,
    
    "description": "Apprenez React en profondeur",
    "description_override": null,
    "description_inherited": true,
    
    "price_ht": 2500.00,
    "price_ht_override": null,
    "price_inherited": true,
    
    "has_chapters_override": false,
    "has_documents_override": false,
    "has_workflow_override": false,
    
    "effective_chapters": [
      {
        "uuid": "course-chapter-1",
        "title": "Introduction à React",
        "is_from_course": true,
        "sub_chapters": [...]
      }
    ],
    
    "effective_documents": [
      {
        "uuid": "course-doc-1",
        "title": "Support de cours.pdf",
        "is_from_course": true
      }
    ]
  }
}
```

### Session AVEC Overrides

```json
{
  "success": true,
  "data": {
    "uuid": "session-789",
    "course_uuid": "course-456",
    
    "title": "React Intensif - Édition Mars",
    "title_override": "React Intensif - Édition Mars",
    "title_inherited": false,
    
    "description": "Version intensive sur 3 jours",
    "description_override": "Version intensive sur 3 jours",
    "description_inherited": false,
    
    "price_ht": 1999.00,
    "price_ht_override": 1999.00,
    "price_inherited": false,
    
    "has_chapters_override": true,
    "has_documents_override": true,
    "has_workflow_override": false,
    
    "effective_chapters": [
      {
        "uuid": "session-chapter-1",
        "original_chapter_uuid": "course-chapter-1",
        "title": "Introduction à React (modifié)",
        "is_from_course": false,
        "is_modified": true,
        "sub_chapters": [...]
      },
      {
        "uuid": "session-chapter-new",
        "original_chapter_uuid": null,
        "title": "Chapitre Bonus: Hooks avancés",
        "is_from_course": false,
        "is_new": true,
        "sub_chapters": []
      }
    ],
    
    "effective_documents": [
      {
        "uuid": "session-doc-1",
        "original_document_uuid": "course-doc-1",
        "title": "Support de cours v2.pdf",
        "is_from_course": false,
        "is_modified": true
      },
      {
        "uuid": "session-doc-new",
        "original_document_uuid": null,
        "title": "Exercices supplémentaires.pdf",
        "is_from_course": false,
        "is_new": true
      }
    ],
    
    "course": {
      "uuid": "course-456",
      "title": "Formation React Avancé",
      "description": "Apprenez React en profondeur",
      "price_ht": 2500.00
    }
  }
}
```

---

## 📜 Règles Métier

### 1. Règles d'Override

| Règle | Description |
|-------|-------------|
| **Override Lazy** | Les chapitres/documents ne sont copiés que quand on veut les modifier |
| **Null = Hérite** | Un champ `_override` à `null` signifie utiliser la valeur du cours |
| **Jamais modifier le template** | Les modifications de session NE DOIVENT JAMAIS affecter le cours |
| **Indicateurs clairs** | Toujours indiquer si une valeur est héritée ou overridée |

### 2. Comportements attendus

```
┌─────────────────────────────────────────────────────────────────────┐
│ SCÉNARIO 1: Créer une session                                       │
├─────────────────────────────────────────────────────────────────────┤
│ 1. User sélectionne un cours                                        │
│ 2. Session créée avec course_uuid, tous les _override sont null     │
│ 3. La session hérite TOUT du cours                                  │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ SCÉNARIO 2: Modifier le titre de la session                         │
├─────────────────────────────────────────────────────────────────────┤
│ 1. User change le titre                                             │
│ 2. PUT /sessions/{uuid} avec title_override: "Nouveau titre"        │
│ 3. Le cours garde son titre original                                │
│ 4. La session affiche "Nouveau titre"                               │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ SCÉNARIO 3: Modifier les chapitres                                  │
├─────────────────────────────────────────────────────────────────────┤
│ 1. User veut modifier un chapitre                                   │
│ 2. Frontend appelle POST /sessions/{uuid}/initialize-chapters-override │
│ 3. Backend copie tous les chapitres du cours vers session_chapters  │
│ 4. User peut maintenant modifier/ajouter/supprimer des chapitres    │
│ 5. Les chapitres du cours template restent intacts                  │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ SCÉNARIO 4: Revenir aux chapitres du template                       │
├─────────────────────────────────────────────────────────────────────┤
│ 1. User clique "Réinitialiser depuis le template"                   │
│ 2. DELETE /sessions/{uuid}/chapters-override                        │
│ 3. Tous les session_chapters sont supprimés                         │
│ 4. has_chapters_override = false                                    │
│ 5. La session affiche à nouveau les chapitres du cours              │
└─────────────────────────────────────────────────────────────────────┘
```

### 3. Validation

```php
// Lors de la mise à jour d'une session
$rules = [
    'title_override' => 'nullable|string|max:255',
    'description_override' => 'nullable|string',
    'price_ht_override' => 'nullable|numeric|min:0',
    'duration_override' => 'nullable|integer|min:1',
    // ... autres champs override
    
    // Champs propres à la session (pas des overrides)
    'start_date' => 'required|date',
    'end_date' => 'required|date|after_or_equal:start_date',
    'trainer_uuids' => 'array',
    'trainer_uuids.*' => 'uuid|exists:users,uuid',
];
```

---

## ✅ Checklist Backend

- [ ] Ajouter les colonnes `_override` à `course_sessions`
- [ ] Créer la table `session_chapters`
- [ ] Créer la table `session_sub_chapters`
- [ ] Créer la table `session_documents`
- [ ] Créer la table `session_workflow_actions`
- [ ] Implémenter les accesseurs `getEffective*Attribute` dans le Model
- [ ] Créer `SessionOverrideService`
- [ ] Implémenter endpoint `initialize-chapters-override`
- [ ] Implémenter endpoint `initialize-documents-override`
- [ ] Implémenter endpoint `initialize-workflow-override`
- [ ] Implémenter endpoints CRUD pour session_chapters
- [ ] Implémenter endpoints CRUD pour session_documents
- [ ] Implémenter endpoints CRUD pour session_workflow_actions
- [ ] Modifier le GET session pour retourner les données effectives
- [ ] Modifier le PUT session pour gérer les overrides
- [ ] Tests unitaires
- [ ] Tests d'intégration

---

## 📞 Contact

Pour toute question sur cette spécification :
- Frontend: [Votre équipe frontend]
- Date de livraison attendue: [À définir]

**Le frontend sera développé en parallèle selon cette spécification. Toute déviation doit être communiquée immédiatement.**

