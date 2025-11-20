# DOCUMENTATION COMPLÈTE BACKEND - MODULE GESTION DE LA QUALITÉ

## 📋 Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Authentification et Base URL](#authentification-et-base-url)
3. [Architecture API](#architecture-api)
4. [Endpoints détaillés](#endpoints-détaillés)
5. [Structures de données](#structures-de-données)
6. [Gestion des erreurs](#gestion-des-erreurs)
7. [Exemples complets](#exemples-complets)
8. [Priorités de développement](#priorités-de-développement)

---

## Vue d'ensemble

Le module de Gestion de la Qualité permet aux organismes de formation (OF) de gérer leur certification Qualiopi. Il comprend :

- **Dashboard** : Statistiques et vue d'ensemble du système qualité
- **Indicateurs Qualiopi** : 32 indicateurs avec gestion de l'applicabilité
- **Documents** : Procédures, modèles et preuves avec contexte
- **BPF** : Bilan Pédagogique et Financier avec historique
- **Actions & Tâches** : Système Kanban de gestion des actions d'amélioration
- **Audits** : Planification et suivi des audits
- **Articles** : Veille réglementaire et actualités Qualiopi

---

## Authentification et Base URL

### Base URL
```
http://localhost:8000/api/quality
```

### Authentification
Tous les endpoints nécessitent une authentification via token Bearer dans le header :
```
Authorization: Bearer {token}
```

### Headers requis
```
Content-Type: application/json
Authorization: Bearer {token}
```

Pour les uploads de fichiers :
```
Content-Type: multipart/form-data
Authorization: Bearer {token}
```

---

## Architecture API

### Convention de réponse standard
Tous les endpoints doivent retourner une réponse dans ce format :

```json
{
  "success": true,
  "data": { ... },
  "message": "Message optionnel"
}
```

En cas d'erreur :
```json
{
  "success": false,
  "error": {
    "message": "Message d'erreur",
    "code": "ERROR_CODE"
  }
}
```

---

## Endpoints détaillés

### 1. Initialisation du Système

#### GET `/api/quality/check`
Vérifie si le système qualité est initialisé pour l'organisation.

**Réponse :**
```json
{
  "success": true,
  "data": {
    "initialized": true,
    "indicators_count": 32,
    "categories_count": 4
  }
}
```

#### POST `/api/quality/initialize`
Initialise le système qualité pour l'organisation (crée les 32 indicateurs Qualiopi et les catégories par défaut).

**Réponse :**
```json
{
  "success": true,
  "data": {
    "indicators_created": 32,
    "categories_created": 4
  },
  "message": "Système qualité initialisé avec succès"
}
```

---

### 2. Dashboard

#### GET `/api/quality/dashboard`
Récupère les statistiques du dashboard.

**Réponse :**
```json
{
  "success": true,
  "data": {
    "total_documents": 45,
    "procedures_count": 12,
    "models_count": 18,
    "evidences_count": 15,
    "indicators_completed": 8,
    "indicators_in_progress": 15,
    "indicators_not_started": 9,
    "next_audit": {
      "id": 1,
      "type": "surveillance",
      "date": "2025-02-15",
      "days_remaining": 45
    },
    "recent_formations": {
      "total": 25,
      "sessions": 180,
      "collaborators": 42
    }
  }
}
```

---

### 3. Indicateurs Qualiopi

#### GET `/api/quality/indicators`
Récupère la liste de tous les indicateurs Qualiopi.

**Réponse :**
```json
{
  "success": true,
  "data": {
    "indicators": [
      {
        "id": 1,
        "number": 1,
        "title": "Indicateur 1 - Information du public",
        "description": "Le prestataire diffuse des informations détaillées...",
        "category": "Information du public",
        "status": "in_progress",
        "isApplicable": true,
        "hasOverlay": false,
        "hasDocuments": true,
        "documentCounts": {
          "procedures": 2,
          "models": 3,
          "evidences": 5,
          "total": 10
        },
        "completionRate": 65,
        "lastUpdated": "2025-01-15T10:30:00Z"
      }
    ]
  }
}
```

#### GET `/api/quality/indicators/:id`
Récupère les détails d'un indicateur spécifique.

**Paramètres :**
- `id` (integer) : ID de l'indicateur

**Réponse :**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "number": 1,
    "title": "Indicateur 1 - Information du public",
    "description": "Le prestataire diffuse des informations détaillées...",
    "category": "Information du public",
    "status": "in_progress",
    "isApplicable": true,
    "hasOverlay": false,
    "hasDocuments": true,
    "documentCounts": {
      "procedures": 2,
      "models": 3,
      "evidences": 5,
      "total": 10
    },
    "completionRate": 65,
    "lastUpdated": "2025-01-15T10:30:00Z"
  }
}
```

#### PATCH `/api/quality/indicators/:id`
Met à jour un indicateur (notamment `isApplicable`).

**Body :**
```json
{
  "isApplicable": false,
  "status": "not_started"
}
```

**Réponse :**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "isApplicable": false,
    "status": "not_started"
  },
  "message": "Indicateur mis à jour avec succès"
}
```

---

### 4. Documents d'un Indicateur

#### GET `/api/quality/indicators/:id/documents`
Récupère tous les documents associés à un indicateur.

**Paramètres de requête :**
- `type` (optionnel) : `procedure`, `model`, `evidence`

**Réponse :**
```json
{
  "success": true,
  "data": {
    "procedures": [
      {
        "id": 1,
        "name": "Procédure d'accueil",
        "type": "procedure",
        "file_url": "/uploads/quality/procedures/proc_1.pdf",
        "file_size": 245678,
        "mime_type": "application/pdf",
        "created_at": "2025-01-10T08:00:00Z",
        "created_by": {
          "id": 5,
          "name": "Jean Dupont",
          "email": "jean.dupont@example.com"
        },
        "indicators": [1, 2]
      }
    ],
    "models": [
      {
        "id": 2,
        "name": "Modèle de fiche d'inscription",
        "type": "model",
        "file_url": "/uploads/quality/models/model_1.docx",
        "file_size": 156789,
        "mime_type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "created_at": "2025-01-12T10:00:00Z",
        "created_by": {
          "id": 5,
          "name": "Jean Dupont",
          "email": "jean.dupont@example.com"
        },
        "indicators": [1],
        "course": {
          "uuid": "course-uuid-123",
          "title": "Formation Excel Avancé"
        }
      }
    ],
    "evidences": [
      {
        "id": 3,
        "name": "Preuve de diffusion publique",
        "type": "evidence",
        "file_url": "/uploads/quality/evidences/evidence_1.jpg",
        "file_size": 456789,
        "mime_type": "image/jpeg",
        "created_at": "2025-01-15T14:00:00Z",
        "created_by": {
          "id": 5,
          "name": "Jean Dupont",
          "email": "jean.dupont@example.com"
        },
        "indicators": [1, 2],
        "course": {
          "uuid": "course-uuid-123",
          "title": "Formation Excel Avancé"
        },
        "session": {
          "uuid": "session-uuid-456",
          "title": "Session du 15 janvier 2025",
          "start_date": "2025-01-15",
          "end_date": "2025-01-20",
          "status": "completed"
        },
        "learner": {
          "uuid": "learner-uuid-789",
          "first_name": "Marie",
          "last_name": "Martin",
          "email": "marie.martin@example.com"
        }
      }
    ]
  }
}
```

---

### 5. Gestion Documentaire

#### POST `/api/quality/documents`
Upload un nouveau document (procédure, modèle ou preuve).

**Content-Type :** `multipart/form-data`

**Body (FormData) :**
- `file` (File) : Le fichier à uploader
- `name` (string) : Nom du document
- `type` (string) : `procedure`, `model`, ou `evidence`
- `description` (string, optionnel) : Description du document
- `indicatorIds` (string JSON) : Tableau d'IDs d'indicateurs `[1, 2, 3]`
- `courseId` (string, requis pour `model` et `evidence`) : UUID de la formation
- `sessionId` (string, requis pour `evidence`) : UUID de la session
- `learnerId` (string, optionnel pour `evidence`) : UUID de l'apprenant

**Réponse :**
```json
{
  "success": true,
  "data": {
    "id": 10,
    "name": "Procédure d'accueil",
    "type": "procedure",
    "file_url": "/uploads/quality/procedures/proc_10.pdf",
    "file_size": 245678,
    "mime_type": "application/pdf",
    "created_at": "2025-01-20T10:00:00Z"
  },
  "message": "Document uploadé avec succès"
}
```

#### GET `/api/quality/documents`
Récupère la liste de tous les documents avec pagination.

**Paramètres de requête :**
- `page` (integer, défaut: 1) : Numéro de page
- `limit` (integer, défaut: 20) : Nombre d'éléments par page
- `type` (string, optionnel) : Filtrer par type (`procedure`, `model`, `evidence`)
- `search` (string, optionnel) : Recherche par nom
- `indicator_id` (integer, optionnel) : Filtrer par indicateur

**Réponse :**
```json
{
  "success": true,
  "data": {
    "documents": [
      {
        "id": 1,
        "name": "Procédure d'accueil",
        "type": "procedure",
        "file_url": "/uploads/quality/procedures/proc_1.pdf",
        "file_size": 245678,
        "mime_type": "application/pdf",
        "created_at": "2025-01-10T08:00:00Z",
        "created_by": {
          "id": 5,
          "name": "Jean Dupont",
          "email": "jean.dupont@example.com"
        },
        "indicators": [1, 2]
      }
    ],
    "pagination": {
      "current_page": 1,
      "per_page": 20,
      "total": 45,
      "total_pages": 3
    }
  }
}
```

#### GET `/api/quality/documents/:id/download`
Télécharge un document.

**Réponse :** Fichier binaire avec headers appropriés

#### DELETE `/api/quality/documents/:id`
Supprime un document.

**Réponse :**
```json
{
  "success": true,
  "message": "Document supprimé avec succès"
}
```

---

### 6. Formations et Sessions

#### GET `/api/courses`
Récupère la liste des formations pour la sélection dans les modaux.

**Paramètres de requête :**
- `search` (string, optionnel) : Recherche par titre

**Réponse :**
```json
{
  "success": true,
  "data": [
    {
      "uuid": "course-uuid-123",
      "title": "Formation Excel Avancé",
      "code": "EXC-001"
    }
  ]
}
```

#### GET `/api/quality/sessions`
Récupère les sessions pour un cours spécifique.

**Paramètres de requête :**
- `courseUuid` (string) : UUID de la formation
- `course_uuid` (string) : Alias pour `courseUuid`

**Réponse :**
```json
{
  "success": true,
  "data": [
    {
      "uuid": "session-uuid-456",
      "title": "Session du 15 janvier 2025",
      "course_uuid": "course-uuid-123",
      "start_date": "2025-01-15",
      "end_date": "2025-01-20",
      "status": "completed",
      "learners_count": 12
    }
  ]
}
```

#### GET `/api/quality/sessions/:sessionUuid/participants`
Récupère les participants d'une session.

**Réponse :**
```json
{
  "success": true,
  "data": [
    {
      "uuid": "learner-uuid-789",
      "id": 123,
      "first_name": "Marie",
      "last_name": "Martin",
      "email": "marie.martin@example.com",
      "phone": "+33123456789",
      "registration_date": "2025-01-10"
    }
  ]
}
```

---

### 7. BPF (Bilan Pédagogique et Financier)

#### GET `/api/quality/bpf/current`
Récupère le BPF en cours.

**Réponse :**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "number": "BPF-2025-001",
    "siret": "12345678901234",
    "status": "draft",
    "sections": {
      "sectionA": {
        "formeJuridique": "SARL",
        "raisonSociale": "Formation Plus",
        "adresse": "123 Rue Example",
        "codePostal": "75001",
        "ville": "Paris"
      },
      "sectionB": {
        "hasRemoteTraining": true,
        "remoteTrainingPercentage": 30
      },
      "sectionC": {
        "c1": { "n": 100, "h": 150 },
        "c2": { "n": 200, "h": 300 },
        "c2Total": { "n": 300, "h": 450 }
      }
    },
    "created_at": "2025-01-01T00:00:00Z",
    "updated_at": "2025-01-20T10:00:00Z",
    "created_by": {
      "id": 5,
      "name": "Jean Dupont"
    }
  }
}
```

#### POST `/api/quality/bpf`
Crée un nouveau BPF.

**Body :**
```json
{
  "number": "BPF-2025-001",
  "siret": "12345678901234",
  "sections": {
    "sectionA": { ... },
    "sectionB": { ... },
    ...
  }
}
```

**Réponse :** Identique à GET `/api/quality/bpf/current`

#### PATCH `/api/quality/bpf/:id`
Met à jour un BPF existant.

**Body :** Même structure que POST

**Réponse :** BPF mis à jour

#### POST `/api/quality/bpf/:id/submit`
Soumet le BPF (change le statut en `submitted`).

**Réponse :**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "status": "submitted",
    "submitted_at": "2025-01-20T15:00:00Z"
  },
  "message": "BPF soumis avec succès"
}
```

#### GET `/api/quality/bpf/history`
Récupère l'historique des BPF.

**Réponse :**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "number": "BPF-2025-001",
      "status": "submitted",
      "created_at": "2025-01-01T00:00:00Z",
      "submitted_at": "2025-01-20T15:00:00Z"
    }
  ]
}
```

---

### 8. Actions et Tâches

#### GET `/api/quality/tasks/categories`
Récupère les catégories de tâches.

**Réponse :**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Formation professionnelle",
      "color": "#E3F2FF",
      "position": 0
    },
    {
      "id": 2,
      "name": "Métiers et emplois",
      "color": "#FFF4E6",
      "position": 1
    }
  ]
}
```

#### POST `/api/quality/tasks/categories`
Crée une nouvelle catégorie.

**Body :**
```json
{
  "name": "Nouvelle catégorie",
  "color": "#E3F2FF"
}
```

#### PATCH `/api/quality/tasks/categories/:id`
Renomme une catégorie.

**Body :**
```json
{
  "name": "Nouveau nom"
}
```

#### DELETE `/api/quality/tasks/categories/:id`
Supprime une catégorie.

#### GET `/api/quality/tasks`
Récupère toutes les tâches, optionnellement filtrées par catégorie.

**Paramètres de requête :**
- `category_id` (integer, optionnel) : Filtrer par catégorie
- `search` (string, optionnel) : Recherche globale

**Réponse :**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Mettre à jour la procédure d'accueil",
      "description": "Procédure à revoir selon nouvelles normes",
      "category": {
        "id": 1,
        "name": "Formation professionnelle",
        "color": "#E3F2FF"
      },
      "priority": "high",
      "status": "todo",
      "due_date": "2025-02-01",
      "start_date": "2025-01-15",
      "end_date": "2025-02-01",
      "position": 0,
      "assigned_members": [
        {
          "id": 5,
          "name": "Jean Dupont",
          "email": "jean.dupont@example.com",
          "avatar_url": null
        }
      ],
      "attachments": [
        {
          "id": 1,
          "name": "document.pdf",
          "file_url": "/uploads/tasks/att_1.pdf",
          "file_size": 123456,
          "uploaded_at": "2025-01-15T10:00:00Z"
        }
      ],
      "comments": [
        {
          "id": 1,
          "content": "Tâche en cours",
          "created_at": "2025-01-16T14:00:00Z",
          "created_by": {
            "id": 5,
            "name": "Jean Dupont"
          }
        }
      ],
      "created_at": "2025-01-15T08:00:00Z",
      "updated_at": "2025-01-16T14:00:00Z"
    }
  ]
}
```

#### POST `/api/quality/tasks`
Crée une nouvelle tâche.

**Body :**
```json
{
  "title": "Mettre à jour la procédure d'accueil",
  "description": "Procédure à revoir selon nouvelles normes",
  "category_id": 1,
  "priority": "high",
  "status": "todo",
  "due_date": "2025-02-01",
  "start_date": "2025-01-15",
  "end_date": "2025-02-01",
  "assigned_member_ids": [5, 7]
}
```

#### PATCH `/api/quality/tasks/:id`
Met à jour une tâche.

**Body :** Même structure que POST (tous les champs optionnels)

#### PATCH `/api/quality/tasks/:id/position`
Met à jour la position d'une tâche (drag & drop).

**Body :**
```json
{
  "position": 2,
  "category_id": 1
}
```

#### DELETE `/api/quality/tasks/:id`
Supprime une tâche.

#### POST `/api/quality/tasks/:id/attachments`
Ajoute une pièce jointe à une tâche.

**Content-Type :** `multipart/form-data`

**Body (FormData) :**
- `file` (File) : Le fichier à uploader

**Réponse :**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "name": "document.pdf",
    "file_url": "/uploads/tasks/att_2.pdf",
    "file_size": 123456,
    "uploaded_at": "2025-01-16T15:00:00Z"
  }
}
```

#### DELETE `/api/quality/tasks/:id/attachments/:attachmentId`
Supprime une pièce jointe.

#### POST `/api/quality/tasks/:id/comments`
Ajoute un commentaire à une tâche.

**Body :**
```json
{
  "content": "Commentaire sur la tâche"
}
```

**Réponse :**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "content": "Commentaire sur la tâche",
    "created_at": "2025-01-16T16:00:00Z",
    "created_by": {
      "id": 5,
      "name": "Jean Dupont"
    }
  }
}
```

#### GET `/api/quality/tasks/statistics`
Récupère les statistiques des tâches.

**Réponse :**
```json
{
  "success": true,
  "data": {
    "total": 45,
    "by_status": {
      "todo": 15,
      "in_progress": 20,
      "done": 10
    },
    "by_priority": {
      "low": 10,
      "medium": 20,
      "high": 15
    },
    "overdue": 5
  }
}
```

---

### 9. Audits

#### GET `/api/quality/audits/next`
Récupère le prochain audit programmé.

**Réponse :**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "type": "surveillance",
    "date": "2025-02-15",
    "auditor": {
      "name": "Audit Qualité SARL",
      "contact": "contact@audit-qualite.fr",
      "phone": "+33123456789"
    },
    "location": "Siège social",
    "notes": "Audit de surveillance annuel",
    "days_remaining": 45
  }
}
```

#### POST `/api/quality/audits`
Crée un nouvel audit.

**Body :**
```json
{
  "type": "surveillance",
  "date": "2025-02-15",
  "auditor": {
    "name": "Audit Qualité SARL",
    "contact": "contact@audit-qualite.fr",
    "phone": "+33123456789"
  },
  "location": "Siège social",
  "notes": "Audit de surveillance annuel"
}
```

**Types d'audit possibles :** `initial`, `surveillance`, `renouvellement`

**Réponse :** Audit créé

---

### 10. Articles / Actualités Qualiopi

#### GET `/api/quality/articles`
Récupère les articles et actualités Qualiopi.

**Paramètres de requête :**
- `category` (string, optionnel) : Filtrer par catégorie
- `search` (string, optionnel) : Recherche par titre/contenu
- `page` (integer, défaut: 1)
- `limit` (integer, défaut: 20)

**Catégories possibles :**
- `RNCP`
- `Accompagnement professionnel`
- `Veille`
- `Qualiopi`
- `Audit de surveillance`
- `Formation Professionnelle`
- `Validation des acquis de l'expérience`
- `Organismes de Formation`
- `Centre de formation d'apprentis`
- `Bilan de compétence`
- `Auto-écoles`
- `Technology`

**Réponse :**
```json
{
  "success": true,
  "data": {
    "articles": [
      {
        "id": 1,
        "title": "Nouvelles réglementations Qualiopi 2025",
        "content": "Contenu de l'article...",
        "category": "Qualiopi",
        "published_at": "2025-01-10T08:00:00Z",
        "author": "Équipe Qualiopi",
        "image_url": "/uploads/articles/article_1.jpg",
        "read_time": 5
      }
    ],
    "pagination": {
      "current_page": 1,
      "per_page": 20,
      "total": 150,
      "total_pages": 8
    }
  }
}
```

---

## Structures de données

### Indicateur Qualiopi
```typescript
interface QualityIndicator {
  id: number;
  number: number; // 1-32
  title: string;
  description: string;
  category: string;
  status: 'not_started' | 'in_progress' | 'completed';
  isApplicable: boolean;
  hasOverlay: boolean;
  overlayColor: string | null;
  hasDocuments: boolean;
  documentCounts: {
    procedures: number;
    models: number;
    evidences: number;
    total: number;
  };
  completionRate: number; // 0-100
  lastUpdated: string | null; // ISO 8601
}
```

### Document Qualité
```typescript
interface QualityDocument {
  id: number;
  name: string;
  type: 'procedure' | 'model' | 'evidence';
  file_url: string;
  file_size: number; // en octets
  mime_type: string;
  description?: string;
  created_at: string; // ISO 8601
  created_by: {
    id: number;
    name: string;
    email: string;
  };
  indicators: number[]; // IDs des indicateurs
  course?: {
    uuid: string;
    title: string;
  };
  session?: {
    uuid: string;
    title: string;
    start_date: string;
    end_date: string;
    status: 'upcoming' | 'ongoing' | 'completed' | 'private';
  };
  learner?: {
    uuid: string;
    first_name: string;
    last_name: string;
    email: string;
  };
}
```

### Tâche
```typescript
interface QualityTask {
  id: number;
  title: string;
  description?: string;
  category: {
    id: number;
    name: string;
    color: string;
  };
  priority: 'low' | 'medium' | 'high';
  status: 'todo' | 'in_progress' | 'done';
  due_date?: string; // ISO 8601 date
  start_date?: string; // ISO 8601 date
  end_date?: string; // ISO 8601 date
  position: number;
  assigned_members: Array<{
    id: number;
    name: string;
    email: string;
    avatar_url?: string;
  }>;
  attachments: Array<{
    id: number;
    name: string;
    file_url: string;
    file_size: number;
    uploaded_at: string;
  }>;
  comments: Array<{
    id: number;
    content: string;
    created_at: string;
    created_by: {
      id: number;
      name: string;
    };
  }>;
  created_at: string;
  updated_at: string;
}
```

### BPF
```typescript
interface BPF {
  id: number;
  number: string;
  siret: string;
  status: 'draft' | 'submitted' | 'validated';
  sections: {
    sectionA: {
      formeJuridique: string;
      raisonSociale: string;
      adresse: string;
      codePostal: string;
      ville: string;
      // ... autres champs section A
    };
    sectionB: {
      hasRemoteTraining: boolean;
      remoteTrainingPercentage?: number;
    };
    sectionC: {
      c1: { n: number; h: number };
      c2: { n: number; h: number };
      c2Total: { n: number; h: number };
      // ... autres champs section C
    };
    // ... sections D, E, F, G, H
  };
  created_at: string;
  updated_at: string;
  submitted_at?: string;
  created_by: {
    id: number;
    name: string;
  };
}
```

---

## Gestion des erreurs

### Codes d'erreur standards

- `UNAUTHORIZED` : Non authentifié
- `FORBIDDEN` : Accès interdit
- `NOT_FOUND` : Ressource non trouvée
- `VALIDATION_ERROR` : Erreur de validation
- `FILE_TOO_LARGE` : Fichier trop volumineux (> 10MB pour documents)
- `INVALID_FILE_TYPE` : Type de fichier non autorisé
- `SERVER_ERROR` : Erreur serveur

### Exemple de réponse d'erreur
```json
{
  "success": false,
  "error": {
    "message": "Le fichier dépasse la taille maximale autorisée (10MB)",
    "code": "FILE_TOO_LARGE",
    "details": {
      "max_size": 10485760,
      "provided_size": 15728640
    }
  }
}
```

---

## Exemples complets

### Exemple 1 : Upload d'une preuve avec contexte
```bash
POST /api/quality/documents
Content-Type: multipart/form-data
Authorization: Bearer {token}

FormData:
- file: [fichier image.jpg]
- name: "Photo de la session du 15 janvier"
- type: "evidence"
- description: "Photo montrant les apprenants pendant la formation"
- indicatorIds: "[1, 2, 3]"
- courseId: "course-uuid-123"
- sessionId: "session-uuid-456"
- learnerId: "learner-uuid-789"
```

### Exemple 2 : Création d'une tâche avec assignation
```bash
POST /api/quality/tasks
Content-Type: application/json
Authorization: Bearer {token}

{
  "title": "Réviser la procédure d'accueil",
  "description": "Mettre à jour selon nouvelles normes Qualiopi",
  "category_id": 1,
  "priority": "high",
  "status": "todo",
  "due_date": "2025-02-15",
  "start_date": "2025-02-01",
  "end_date": "2025-02-15",
  "assigned_member_ids": [5, 7, 12]
}
```

### Exemple 3 : Mise à jour de position de tâche (drag & drop)
```bash
PATCH /api/quality/tasks/15/position
Content-Type: application/json
Authorization: Bearer {token}

{
  "position": 3,
  "category_id": 2
}
```

---

## Priorités de développement

### Phase 1 - Critique (À faire en premier)
1. ✅ GET `/api/quality/check`
2. ✅ POST `/api/quality/initialize`
3. ✅ GET `/api/quality/dashboard`
4. ✅ GET `/api/quality/indicators`
5. ✅ GET `/api/quality/indicators/:id`
6. ✅ PATCH `/api/quality/indicators/:id`
7. ✅ GET `/api/quality/indicators/:id/documents`
8. ✅ POST `/api/quality/documents`
9. ✅ GET `/api/quality/documents`
10. ✅ GET `/api/courses`

### Phase 2 - Important
11. ✅ GET `/api/quality/sessions`
12. ✅ GET `/api/quality/sessions/:sessionUuid/participants`
13. ✅ GET `/api/quality/bpf/current`
14. ✅ POST `/api/quality/bpf`
15. ✅ PATCH `/api/quality/bpf/:id`
16. ✅ GET `/api/quality/tasks/categories`
17. ✅ GET `/api/quality/tasks`
18. ✅ POST `/api/quality/tasks`
19. ✅ PATCH `/api/quality/tasks/:id`

### Phase 3 - Souhaitable
20. ✅ PATCH `/api/quality/tasks/:id/position`
21. ✅ POST `/api/quality/tasks/:id/attachments`
22. ✅ POST `/api/quality/tasks/:id/comments`
23. ✅ GET `/api/quality/audits/next`
24. ✅ POST `/api/quality/audits`
25. ✅ GET `/api/quality/articles`
26. ✅ GET `/api/quality/bpf/history`
27. ✅ POST `/api/quality/bpf/:id/submit`

---

## Notes importantes

### Upload de fichiers
- **Taille maximale** : 10MB par fichier
- **Types autorisés** :
  - Documents : PDF, DOC, DOCX, XLS, XLSX
  - Images : JPG, JPEG, PNG, GIF
  - Autres : selon besoin métier
- Les fichiers doivent être stockés dans un répertoire accessible via URL publique
- Générer des noms de fichiers uniques pour éviter les collisions

### Performance
- Implémenter la pagination pour toutes les listes
- Utiliser des index sur les colonnes fréquemment recherchées
- Mettre en cache les données peu changeantes (indicateurs, catégories)

### Sécurité
- Vérifier les permissions pour chaque endpoint (accès à l'organisation)
- Valider tous les inputs
- Sanitizer les noms de fichiers uploadés
- Limiter la taille des uploads
- Vérifier les types MIME des fichiers

### Multitenancy
- Tous les endpoints doivent filtrer par `organization_id` basé sur l'utilisateur authentifié
- Ne jamais exposer les données d'une organisation à une autre

---

## Support

Pour toute question ou clarification, contacter l'équipe frontend avec une référence à cette documentation.

**Version :** 1.0  
**Date :** Janvier 2025  
**Auteur :** Équipe Frontend - Module Gestion Qualité

