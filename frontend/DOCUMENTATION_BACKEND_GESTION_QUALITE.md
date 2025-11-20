# Documentation Backend - Gestion Qualité

## Vue d'ensemble

Cette documentation décrit tous les endpoints API nécessaires pour le module de gestion qualité. Le frontend s'attend à recevoir des réponses dans un format standardisé avec la structure suivante :

```json
{
  "success": true,
  "data": { ... },
  "message": "Message optionnel"
}
```

Pour les erreurs :
```json
{
  "success": false,
  "error": {
    "message": "Message d'erreur",
    "code": "ERROR_CODE"
  }
}
```

**IMPORTANT** : Pour les réponses HTTP 201 (Created), le frontend considère toujours `success: true` même si le backend ne retourne pas explicitement cette propriété.

---

## Table des matières

1. [Initialisation du système](#1-initialisation-du-système)
2. [Dashboard](#2-dashboard)
3. [Indicateurs Qualiopi](#3-indicateurs-qualiopi)
4. [Documents](#4-documents)
5. [Tâches (Système Trello)](#5-tâches-système-trello)
6. [Catégories de tâches](#6-catégories-de-tâches)
7. [Articles](#7-articles)
8. [Audits](#8-audits)
9. [BPF (Bilan Pédagogique et Financier)](#9-bpf-bilan-pédagogique-et-financier)
10. [Sessions et Participants](#10-sessions-et-participants)
11. [Statistiques](#11-statistiques)
12. [Recherche](#12-recherche)
13. [Notifications](#13-notifications)
14. [Rapports](#14-rapports)

---

## 1. Initialisation du système

### 1.1 Vérifier l'état d'initialisation

**GET** `/api/quality/initialize/status`

Vérifie si le système qualité est initialisé pour l'organisation.

**Réponse attendue :**
```json
{
  "success": true,
  "data": {
    "initialized": true,
    "indicators": {
      "count": 32,
      "expected": 32
    },
    "categories": {
      "count": 5,
      "expected": 5
    }
  }
}
```

**Codes d'erreur possibles :**
- `ALREADY_INITIALIZED` : Le système est déjà initialisé (considéré comme succès par le frontend)

---

### 1.2 Initialiser le système qualité

**POST** `/api/quality/initialize`

Initialise le système qualité pour l'organisation. Crée les 32 indicateurs Qualiopi et les 5 catégories de tâches par défaut.

**Body :**
```json
{}
```

**Réponse attendue :**
```json
{
  "success": true,
  "data": {
    "message": "Système qualité initialisé avec succès",
    "indicators": {
      "created": 32,
      "total": 32
    },
    "categories": {
      "created": 5,
      "total": 5
    }
  }
}
```

**Codes d'erreur possibles :**
- `ALREADY_INITIALIZED` : Le système est déjà initialisé (considéré comme succès par le frontend)

---

## 2. Dashboard

### 2.1 Obtenir les statistiques du dashboard

**GET** `/api/quality/dashboard/stats`

Retourne toutes les données nécessaires pour le dashboard qualité.

**Note importante** : Le frontend récupère également les tâches récentes via `GET /api/quality/tasks` pour afficher les 5 tâches les plus récentes dans le dashboard. Le champ `recentTasks` dans la réponse du dashboard est optionnel mais recommandé pour améliorer les performances.

**Réponse attendue :**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalDocuments": 45,
      "procedures": 15,
      "models": 20,
      "evidences": 10,
      "recentlyAdded": 5
    },
    "indicators": {
      "total": 32,
      "completed": 10,
      "inProgress": 15,
      "notStarted": 7,
      "completionRate": 31.25,
      "indicatorsList": [
        {
          "id": 1,
          "number": 1,
          "title": "Information au public sur les prestations",
          "status": "completed",
          "hasDocuments": true,
          "isApplicable": true,
          "documentCounts": {
            "procedures": 2,
            "models": 1,
            "evidences": 3,
            "total": 6
          },
          "completionRate": 100
        }
      ]
    },
    "actions": {
      "total": 25,
      "pending": 10,
      "inProgress": 8,
      "completed": 7,
      "overdue": 3,
      "recentActions": []
    },
    "tasks": {
      "total": 50,
      "todo": 20,
      "in_progress": 15,
      "done": 15,
      "overdue": 5
    },
    "taskCategories": [],
    "recentTasks": [
      {
        "id": 1,
        "title": "Réviser la procédure d'accueil",
        "description": "Description de la tâche",
        "status": "todo",
        "priority": "high",
        "category": {
          "id": 1,
          "name": "Veille réglementaire",
          "color": "#3f5ea9"
        },
        "due_date": "2025-12-31"
      }
    ],
    "auditCountdown": {
      "days": 45,
      "is_overdue": false,
      "date": "2025-12-15",
      "formatted_date": "15 décembre 2025",
      "auditor": "Auditeur Qualiopi"
    },
    "qualiopiNews": [],
    "recentDocuments": [],
    "nextAudit": null,
    "articles": [],
    "statistics": {
      "completion_percentage": 31.25,
      "total_documents": 45,
      "pending_tasks": 20,
      "completed_tasks": 15,
      "overdue_tasks": 5
    },
    "recentActivity": []
  }
}
```

---

## 3. Indicateurs Qualiopi

### 3.1 Lister les indicateurs

**GET** `/api/quality/indicators`

**Query Parameters :**
- `status` (string, optional) : Filtrer par statut (`completed`, `in-progress`, `not-started`)
- `hasDocuments` (boolean, optional) : Filtrer les indicateurs ayant des documents

**Réponse attendue :**
```json
{
  "success": true,
  "data": {
    "indicators": [
      {
        "id": 1,
        "number": 1,
        "title": "Information au public sur les prestations",
        "description": "Description de l'indicateur",
        "category": "Information",
        "status": "completed",
        "hasOverlay": false,
        "overlayColor": null,
        "overlay_color": null,
        "hasDocuments": true,
        "isApplicable": true,
        "documentCounts": {
          "procedures": 2,
          "models": 1,
          "evidences": 3,
          "total": 6
        },
        "completionRate": 100,
        "lastUpdated": "2025-01-15T10:30:00Z"
      }
    ]
  }
}
```

---

### 3.2 Obtenir un indicateur

**GET** `/api/quality/indicators/{id}`

**Réponse attendue :**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "number": 1,
    "title": "Information au public sur les prestations",
    "description": "Description complète",
    "category": "Information",
    "status": "completed",
    "hasOverlay": false,
    "overlayColor": null,
    "hasDocuments": true,
    "isApplicable": true,
    "documentCounts": {
      "procedures": 2,
      "models": 1,
      "evidences": 3,
      "total": 6
    },
    "completionRate": 100,
    "lastUpdated": "2025-01-15T10:30:00Z"
  }
}
```

---

### 3.3 Mettre à jour un indicateur

**PUT** `/api/quality/indicators/{id}`

**Body :**
```json
{
  "title": "Nouveau titre",
  "description": "Nouvelle description",
  "requirements": ["Requirement 1", "Requirement 2"],
  "status": "in-progress",
  "notes": "Notes additionnelles",
  "isApplicable": true
}
```

**Réponse attendue :**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "number": 1,
    "title": "Nouveau titre",
    "status": "in-progress",
    "isApplicable": true
  }
}
```

---

### 3.4 Obtenir les documents d'un indicateur

**GET** `/api/quality/indicators/{id}/documents`

**Query Parameters :**
- `type` (string, optional) : Filtrer par type (`procedure`, `model`, `evidence`)

**Réponse attendue :**
```json
{
  "success": true,
  "data": {
    "procedures": [],
    "models": [],
    "evidences": []
  }
}
```

---

## 4. Documents

### 4.1 Lister les documents

**GET** `/api/quality/documents`

**Query Parameters :**
- `type` (string, optional) : `procedure`, `model`, `evidence`
- `indicatorId` (number, optional) : Filtrer par indicateur
- `search` (string, optional) : Recherche textuelle
- `page` (number, optional) : Numéro de page
- `limit` (number, optional) : Nombre d'éléments par page

**Réponse attendue :**
```json
{
  "success": true,
  "data": {
    "documents": [
      {
        "id": 1,
        "name": "Procédure d'accueil",
        "type": "procedure",
        "fileType": "pdf",
        "size": "2.5 MB",
        "sizeBytes": 2621440,
        "url": "/storage/quality/documents/file.pdf",
        "indicatorIds": [1, 2, 3],
        "showIndicatorCount": true,
        "description": "Description du document",
        "createdAt": "2025-01-15T10:30:00Z",
        "updatedAt": "2025-01-15T10:30:00Z",
        "createdBy": {
          "id": "1",
          "name": "John Doe",
          "email": "john@example.com"
        }
      }
    ],
    "pagination": {
      "current_page": 1,
      "total": 45,
      "per_page": 10,
      "total_pages": 5
    }
  }
}
```

---

### 4.2 Télécharger un document

**GET** `/api/quality/documents/{id}/download`

**Réponse attendue :**
```json
{
  "success": true,
  "data": {
    "url": "http://localhost:8000/storage/quality/documents/a7b6aa5f-5b41-402f-8a7b-27e2b8f9c0b0.png",
    "expiresAt": "2025-11-07T15:02:50+00:00"
  }
}
```

**Note** : L'URL doit être accessible et valide jusqu'à `expiresAt`. Le frontend ouvre cette URL dans un nouvel onglet.

---

### 4.3 Uploader un document

**POST** `/api/quality/documents/upload`

**Content-Type :** `multipart/form-data`

**Form Data :**
- `file` (File) : Le fichier à uploader
- `name` (string) : Nom du document
- `type` (string) : `procedure`, `model`, ou `evidence`
- `description` (string, optional) : Description
- `indicator_ids` (array of numbers) : IDs des indicateurs associés
- `course_id` (string, optional) : UUID du cours (pour les preuves)
- `session_id` (string, optional) : UUID de la session (pour les preuves)
- `learner_id` (string, optional) : ID de l'apprenant (pour les preuves)

**Réponse attendue (HTTP 201) :**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Procédure d'accueil",
    "type": "procedure",
    "url": "/storage/quality/documents/file.pdf"
  },
  "message": "Document uploadé avec succès"
}
```

---

### 4.4 Mettre à jour un document

**PUT** `/api/quality/documents/{id}`

**Body :**
```json
{
  "name": "Nouveau nom",
  "type": "procedure",
  "description": "Nouvelle description",
  "indicatorIds": [1, 2, 3]
}
```

**Réponse attendue :**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Nouveau nom",
    "type": "procedure"
  }
}
```

---

### 4.5 Supprimer un document

**DELETE** `/api/quality/documents/{id}`

**Réponse attendue :**
```json
{
  "success": true,
  "message": "Document supprimé avec succès"
}
```

---

## 5. Tâches (Système Trello)

### 5.1 Lister les tâches

**GET** `/api/quality/tasks`

**Query Parameters :**
- `category_id` (number, optional) : Filtrer par catégorie
- `status` (string, optional) : `todo`, `in_progress`, `done`, `archived`
- `priority` (string, optional) : `low`, `medium`, `high`, `urgent`
- `assigned_to` (number, optional) : Filtrer par utilisateur assigné
- `overdue` (boolean, optional) : Filtrer les tâches en retard

**Réponse attendue :**
```json
{
  "success": true,
  "data": {
    "tasks": [
      {
        "id": 1,
        "title": "Réviser la procédure d'accueil",
        "description": "Description de la tâche",
        "status": "todo",
        "priority": "high",
        "due_date": "2025-12-31",
        "dueDate": "2025-12-31",
        "start_date": "2025-01-01",
        "end_date": "2025-12-31",
        "position": 1,
        "category_id": 1,
        "category": {
          "id": 1,
          "name": "Veille réglementaire",
          "type": "veille",
          "color": "#3f5ea9"
        },
        "assigned_members": [
          {
            "id": 1,
            "name": "John Doe",
            "email": "john@example.com",
            "avatar_url": "/uploads/users/avatar.png",
            "role": "Manager"
          }
        ],
        "checklist": [
          {
            "text": "Étape 1",
            "completed": true
          },
          {
            "text": "Étape 2",
            "completed": false
          }
        ],
        "comments": [
          {
            "id": 1,
            "content": "Commentaire sur la tâche",
            "author": {
              "id": 1,
              "name": "John Doe",
              "avatar_url": "/uploads/users/avatar.png"
            },
            "created_at": "2025-01-15T10:30:00Z"
          }
        ],
        "attachments": [
          {
            "id": 1,
            "name": "document.pdf",
            "url": "/storage/tasks/attachment.pdf",
            "size": 1024000,
            "type": "application/pdf",
            "uploaded_at": "2025-01-15T10:30:00Z"
          }
        ],
        "created_at": "2025-01-15T10:30:00Z",
        "updated_at": "2025-01-15T10:30:00Z"
      }
    ]
  }
}
```

---

### 5.2 Créer une tâche

**POST** `/api/quality/tasks`

**Body :**
```json
{
  "category_id": 1,
  "title": "Nouvelle tâche",
  "description": "Description de la tâche",
  "status": "todo",
  "priority": "medium",
  "due_date": "2025-12-31",
  "start_date": "2025-01-01",
  "end_date": "2025-12-31",
  "assigned_member_ids": [1, 2],
  "checklist": [
    {
      "text": "Étape 1",
      "completed": false
    }
  ],
  "notes": "Notes additionnelles"
}
```

**Réponse attendue (HTTP 201) :**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Nouvelle tâche",
    "status": "todo",
    "position": 1
  },
  "message": "Tâche créée avec succès"
}
```

---

### 5.3 Mettre à jour une tâche

**PUT** `/api/quality/tasks/{id}`

**Body :**
```json
{
  "title": "Titre modifié",
  "status": "in_progress",
  "priority": "high",
  "category_id": 2,
  "assigned_member_ids": [1],
  "checklist": [
    {
      "text": "Étape 1",
      "completed": true
    }
  ]
}
```

**Réponse attendue :**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Titre modifié",
    "status": "in_progress"
  }
}
```

---

### 5.4 Supprimer une tâche

**DELETE** `/api/quality/tasks/{id}`

**Réponse attendue :**
```json
{
  "success": true,
  "message": "Tâche supprimée avec succès"
}
```

---

### 5.5 Mettre à jour les positions des tâches

**POST** `/api/quality/tasks/positions`

**Body :**
```json
{
  "tasks": [
    {
      "id": 1,
      "position": 1
    },
    {
      "id": 2,
      "position": 2
    }
  ]
}
```

**Réponse attendue :**
```json
{
  "success": true,
  "message": "Positions mises à jour"
}
```

---

### 5.6 Uploader une pièce jointe

**POST** `/api/quality/tasks/{taskId}/attachments`

**Content-Type :** `multipart/form-data`

**Form Data :**
- `file` (File) : Le fichier à uploader

**Réponse attendue (HTTP 201) :**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "document.pdf",
    "url": "/storage/tasks/attachment.pdf",
    "size": 1024000,
    "type": "application/pdf"
  }
}
```

---

### 5.7 Supprimer une pièce jointe

**DELETE** `/api/quality/tasks/{taskId}/attachments/{attachmentId}`

**Réponse attendue :**
```json
{
  "success": true,
  "message": "Pièce jointe supprimée"
}
```

---

### 5.8 Ajouter un commentaire

**POST** `/api/quality/tasks/{taskId}/comments`

**Body :**
```json
{
  "content": "Nouveau commentaire"
}
```

**Réponse attendue (HTTP 201) :**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "content": "Nouveau commentaire",
    "author": {
      "id": 1,
      "name": "John Doe",
      "avatar_url": "/uploads/users/avatar.png"
    },
    "created_at": "2025-01-15T10:30:00Z"
  }
}
```

---

### 5.9 Obtenir les statistiques des tâches

**GET** `/api/quality/tasks/statistics`

**Réponse attendue :**
```json
{
  "success": true,
  "data": {
    "total": 50,
    "todo": 20,
    "in_progress": 15,
    "done": 15,
    "overdue": 5,
    "by_priority": {
      "low": 10,
      "medium": 20,
      "high": 15,
      "urgent": 5
    },
    "by_category": {
      "1": 10,
      "2": 15,
      "3": 25
    }
  }
}
```

---

## 6. Catégories de tâches

### 6.1 Lister les catégories

**GET** `/api/quality/task-categories`

**Query Parameters :**
- `type` (string, optional) : `veille`, `competence`, `dysfonctionnement`, `amelioration`, `handicap`, `custom`
- `system_only` (boolean, optional) : Uniquement les catégories système
- `custom_only` (boolean, optional) : Uniquement les catégories personnalisées

**Réponse attendue :**
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "id": 1,
        "name": "Veille réglementaire",
        "slug": "veille-reglementaire",
        "description": "Catégorie pour la veille réglementaire",
        "color": "#3f5ea9",
        "icon": "eye",
        "type": "veille",
        "is_system": true,
        "indicator_id": null,
        "tasks_count": 10
      }
    ]
  }
}
```

---

### 6.2 Créer une catégorie

**POST** `/api/quality/task-categories`

**Body :**
```json
{
  "name": "Ma catégorie",
  "description": "Description de la catégorie",
  "color": "#ff7700",
  "icon": "star",
  "type": "custom"
}
```

**Réponse attendue (HTTP 201) :**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Ma catégorie",
    "slug": "ma-categorie",
    "color": "#ff7700",
    "type": "custom",
    "is_system": false
  },
  "message": "Catégorie créée avec succès"
}
```

---

### 6.3 Mettre à jour une catégorie

**PUT** `/api/quality/task-categories/{id}`

**Body :**
```json
{
  "name": "Nouveau nom",
  "color": "#00ff00",
  "description": "Nouvelle description"
}
```

**Réponse attendue :**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Nouveau nom",
    "color": "#00ff00"
  }
}
```

---

### 6.4 Supprimer une catégorie

**DELETE** `/api/quality/task-categories/{id}`

**Réponse attendue :**
```json
{
  "success": true,
  "message": "Catégorie supprimée avec succès"
}
```

---

## 7. Articles

### 7.1 Lister les articles

**GET** `/api/quality/articles`

**Query Parameters :**
- `category` (string, optional) : Filtrer par catégorie
- `featured` (boolean, optional) : Uniquement les articles mis en avant
- `search` (string, optional) : Recherche textuelle
- `page` (number, optional) : Numéro de page
- `limit` (number, optional) : Nombre d'éléments par page

**Réponse attendue :**
```json
{
  "success": true,
  "data": {
    "articles": [
      {
        "id": 1,
        "image": "/uploads/articles/article.jpg",
        "category": "Qualiopi",
        "date": "2025-01-15",
        "title": "Titre de l'article",
        "description": "Description de l'article",
        "content": "<h2>Contenu HTML</h2>",
        "featured": true,
        "url": null,
        "author": {
          "id": 1,
          "name": "John Doe",
          "avatar": "/uploads/users/avatar.png"
        },
        "createdAt": "2025-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "current_page": 1,
      "total": 50,
      "per_page": 10,
      "total_pages": 5
    }
  }
}
```

---

### 7.2 Obtenir un article

**GET** `/api/quality/articles/{id}`

**Réponse attendue :**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "image": "/uploads/articles/article.jpg",
    "category": "Qualiopi",
    "date": "2025-01-15",
    "title": "Titre de l'article",
    "description": "Description de l'article",
    "content": "<h2>Contenu HTML</h2>",
    "featured": true,
    "url": null,
    "author": {
      "id": 1,
      "name": "John Doe",
      "avatar": "/uploads/users/avatar.png"
    },
    "createdAt": "2025-01-15T10:30:00Z"
  }
}
```

---

## 8. Audits

### 8.1 Obtenir le prochain audit

**GET** `/api/quality/audit/next`

**Réponse attendue :**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "type": "surveillance",
    "date": "2025-12-15",
    "daysRemaining": 45,
    "status": "scheduled",
    "auditor": {
      "name": "Auditeur Qualiopi",
      "contact": "contact@auditeur.com",
      "phone": "+33 1 23 45 67 89"
    },
    "location": "Siège social",
    "notes": "Notes sur l'audit"
  }
}
```

---

### 8.2 Créer un audit

**POST** `/api/quality/audit`

**Body :**
```json
{
  "type": "surveillance",
  "date": "2025-12-15",
  "auditor": {
    "name": "Auditeur Qualiopi",
    "contact": "contact@auditeur.com",
    "phone": "+33 1 23 45 67 89"
  },
  "location": "Siège social",
  "notes": "Notes sur l'audit"
}
```

**Réponse attendue (HTTP 201) :**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "type": "surveillance",
    "date": "2025-12-15",
    "status": "scheduled"
  },
  "message": "Audit créé avec succès"
}
```

---

### 8.3 Compléter un audit

**POST** `/api/quality/audit/{id}/complete`

**Body :**
```json
{
  "completionDate": "2025-12-15",
  "result": "passed",
  "score": 95,
  "reportUrl": "/storage/audits/report.pdf",
  "notes": "Notes de complétion",
  "observations": ["Observation 1", "Observation 2"],
  "recommendations": ["Recommandation 1"]
}
```

**Réponse attendue :**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "status": "completed",
    "result": "passed",
    "score": 95
  }
}
```

---

## 9. BPF (Bilan Pédagogique et Financier)

### 9.1 Lister les BPF

**GET** `/api/quality/bpf`

**Query Parameters :**
- `year` (number, optional) : Filtrer par année
- `status` (string, optional) : `draft`, `submitted`, `approved`

**Réponse attendue :**
```json
{
  "success": true,
  "data": {
    "bpfs": [
      {
        "id": 1,
        "year": 2025,
        "status": "draft",
        "submittedDate": null,
        "data": {
          "sectionA": {},
          "sectionB": {},
          "sectionC": {}
        },
        "createdAt": "2025-01-15T10:30:00Z",
        "updatedAt": "2025-01-15T10:30:00Z",
        "createdBy": {
          "id": "1",
          "name": "John Doe"
        }
      }
    ]
  }
}
```

---

### 9.2 Obtenir un BPF

**GET** `/api/quality/bpf/{id}`

**Réponse attendue :**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "year": 2025,
    "status": "draft",
    "data": {
      "sectionA": {},
      "sectionB": {},
      "sectionC": {}
    }
  }
}
```

---

### 9.3 Créer un BPF

**POST** `/api/quality/bpf`

**Body :**
```json
{
  "year": 2025,
  "data": {
    "sectionA": {},
    "sectionB": {},
    "sectionC": {}
  }
}
```

**Réponse attendue (HTTP 201) :**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "year": 2025,
    "status": "draft"
  },
  "message": "BPF créé avec succès"
}
```

---

### 9.4 Mettre à jour un BPF

**PUT** `/api/quality/bpf/{id}`

**Body :**
```json
{
  "data": {
    "sectionA": {},
    "sectionB": {},
    "sectionC": {}
  }
}
```

**Réponse attendue :**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "updatedAt": "2025-01-15T10:30:00Z"
  }
}
```

---

### 9.5 Soumettre un BPF

**POST** `/api/quality/bpf/{id}/submit`

**Body :**
```json
{
  "submittedTo": "DREETS",
  "submissionMethod": "online",
  "notes": "BPF soumis via l'application"
}
```

**Réponse attendue :**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "status": "submitted",
    "submittedDate": "2025-01-15T10:30:00Z"
  }
}
```

---

### 9.6 Obtenir l'historique d'un BPF

**GET** `/api/quality/bpf/{id}/history`

**Réponse attendue :**
```json
{
  "success": true,
  "data": {
    "history": [
      {
        "id": 1,
        "fieldName": "sectionC.c1",
        "oldValue": "100",
        "newValue": "150",
        "action": "update",
        "user": {
          "id": 1,
          "name": "John Doe",
          "email": "john@example.com"
        },
        "createdAt": "2025-01-15T10:30:00Z"
      }
    ]
  }
}
```

---

### 9.7 Obtenir les archives BPF

**GET** `/api/quality/bpf/archives`

**Query Parameters :**
- `fromYear` (number, optional)
- `toYear` (number, optional)

**Réponse attendue :**
```json
{
  "success": true,
  "data": {
    "archives": [
      {
        "id": 1,
        "year": 2024,
        "status": "approved",
        "submittedDate": "2024-12-31T10:30:00Z"
      }
    ]
  }
}
```

---

### 9.8 Exporter un BPF

**GET** `/api/quality/bpf/{id}/export`

**Query Parameters :**
- `format` (string, required) : `pdf` ou `excel`

**Réponse attendue :**
```json
{
  "success": true,
  "data": {
    "url": "/storage/bpf/exports/bpf-2025.pdf",
    "expiresAt": "2025-11-07T15:02:50+00:00"
  }
}
```

---

## 10. Sessions et Participants

### 10.1 Lister les sessions

**GET** `/api/quality/sessions`

**Query Parameters :**
- `search` (string, optional) : Recherche textuelle
- `page` (number, optional)
- `limit` (number, optional)
- `courseUuid` ou `course_uuid` (string, optional) : Filtrer par cours

**Réponse attendue :**
```json
{
  "success": true,
  "data": {
    "sessions": [
      {
        "id": 1,
        "uuid": "session-uuid",
        "title": "Session de formation",
        "course_uuid": "course-uuid",
        "courseId": "course-uuid",
        "courseUuid": "course-uuid"
      }
    ]
  }
}
```

---

### 10.2 Obtenir les participants d'une session

**GET** `/api/quality/sessions/{sessionId}/participants`

**Réponse attendue :**
```json
{
  "success": true,
  "data": {
    "participants": [
      {
        "id": 1,
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "+33 1 23 45 67 89",
        "registration_date": "2025-01-15"
      }
    ]
  }
}
```

---

## 11. Statistiques

### 11.1 Obtenir les statistiques actuelles

**GET** `/api/quality/statistics/current`

**Réponse attendue :**
```json
{
  "success": true,
  "data": {
    "completion_percentage": 31.25,
    "total_documents": 45,
    "pending_tasks": 20,
    "completed_tasks": 15,
    "overdue_tasks": 5
  }
}
```

---

### 11.2 Obtenir les statistiques par période

**GET** `/api/quality/statistics/period`

**Query Parameters :**
- `start_date` (string, optional) : Format ISO 8601
- `end_date` (string, optional) : Format ISO 8601

**Réponse attendue :**
```json
{
  "success": true,
  "data": {
    "period": {
      "start": "2025-01-01",
      "end": "2025-12-31"
    },
    "statistics": {}
  }
}
```

---

## 12. Recherche

### 12.1 Recherche globale

**GET** `/api/quality/search`

**Query Parameters :**
- `q` (string, required) : Terme de recherche
- `type` (string, optional) : `documents`, `actions`, `indicators`, `articles`, `all`
- `limit` (number, optional) : Nombre de résultats

**Réponse attendue :**
```json
{
  "success": true,
  "data": {
    "results": {
      "documents": [],
      "actions": [],
      "indicators": [],
      "articles": []
    },
    "total": 0
  }
}
```

---

## 13. Notifications

### 13.1 Lister les notifications

**GET** `/api/quality/notifications`

**Query Parameters :**
- `unreadOnly` (boolean, optional) : Uniquement les non lues
- `type` (string, optional) : Type de notification
- `limit` (number, optional) : Nombre de résultats

**Réponse attendue :**
```json
{
  "success": true,
  "data": {
    "notifications": []
  }
}
```

---

### 13.2 Marquer une notification comme lue

**PUT** `/api/quality/notifications/{id}/read`

**Réponse attendue :**
```json
{
  "success": true,
  "message": "Notification marquée comme lue"
}
```

---

## 14. Rapports

### 14.1 Exporter un rapport

**GET** `/api/quality/reports/export`

**Query Parameters :**
- `format` (string, required) : `pdf` ou `excel`
- `type` (string, required) : `full`, `indicators`, `documents`, `actions`
- `fromDate` (string, optional) : Format ISO 8601
- `toDate` (string, optional) : Format ISO 8601

**Réponse attendue :**
```json
{
  "success": true,
  "data": {
    "reportId": "report-uuid",
    "status": "processing",
    "estimatedCompletion": "2025-01-15T10:35:00Z"
  }
}
```

---

### 14.2 Obtenir le statut d'un rapport

**GET** `/api/quality/reports/{reportId}/status`

**Réponse attendue :**
```json
{
  "success": true,
  "data": {
    "status": "completed",
    "url": "/storage/reports/report.pdf",
    "expiresAt": "2025-11-07T15:02:50+00:00"
  }
}
```

---

## Notes importantes pour le backend

### Format des réponses

1. **Toutes les réponses doivent avoir la structure :**
   ```json
   {
     "success": true|false,
     "data": { ... },
     "message": "Message optionnel"
   }
   ```

2. **Pour les erreurs :**
   ```json
   {
     "success": false,
     "error": {
       "message": "Message d'erreur",
       "code": "ERROR_CODE"
     }
   }
   ```

3. **Pour les réponses HTTP 201 (Created) :**
   - Le frontend considère toujours `success: true` même si le backend ne retourne pas explicitement cette propriété
   - Il est recommandé de toujours retourner `success: true` pour la cohérence

### Gestion des fichiers

- Les URLs de fichiers doivent être accessibles publiquement ou via un système de tokens temporaires
- Pour les téléchargements, retourner une URL avec `expiresAt` pour la sécurité
- Les fichiers uploadés doivent être stockés dans `/storage/quality/` ou équivalent

### Pagination

Pour les endpoints avec pagination, utiliser cette structure :
```json
{
  "success": true,
  "data": {
    "items": [],
    "pagination": {
      "current_page": 1,
      "total": 100,
      "per_page": 10,
      "total_pages": 10,
      "from": 1,
      "to": 10
    }
  }
}
```

### Dates

- Utiliser le format ISO 8601 pour toutes les dates : `2025-01-15T10:30:00Z`
- Les dates peuvent aussi être au format `YYYY-MM-DD` pour les champs de date uniquement

### Authentification

- Tous les endpoints (sauf ceux marqués "Public") nécessitent une authentification Bearer Token
- Le token doit être envoyé dans le header : `Authorization: Bearer {token}`

### Codes d'erreur spéciaux

- `ALREADY_INITIALIZED` : Pour l'endpoint d'initialisation si le système est déjà initialisé (considéré comme succès par le frontend)

---

## Endpoints supplémentaires utilisés

Le frontend utilise également ces endpoints existants :

- `GET /api/organization/users` : Pour obtenir la liste des utilisateurs de l'organisation (utilisé pour assigner des tâches)
- `GET /api/courses` : Pour obtenir la liste des cours (utilisé pour les preuves)

Ces endpoints doivent retourner les données dans le format standard de l'application.

---

## Conclusion

Cette documentation couvre tous les endpoints nécessaires pour le module de gestion qualité. Le frontend est flexible et peut gérer différents formats de réponse, mais il est recommandé de suivre le format standardisé décrit ci-dessus pour une meilleure cohérence et maintenabilité.

Pour toute question ou clarification, contacter l'équipe frontend.

