# Instructions Backend - Module Gestion de la Qualité

Ce document détaille toutes les exigences backend pour le module de Gestion de la Qualité selon les spécifications fonctionnelles et de design.

---

## Table des Matières

1. [Authentification et Base URL](#authentification-et-base-url)
2. [Initialisation du Système](#initialisation-du-système)
3. [Dashboard](#dashboard)
4. [Indicateurs Qualiopi](#indicateurs-qualiopi)
5. [Gestion Documentaire](#gestion-documentaire)
6. [Preuves avec Contexte Formation/Session/Apprenant](#preuves-avec-contexte)
7. [BPF (Bilan Pédagogique et Financier)](#bpf)
8. [Actions et Tâches (Trello-like)](#actions-et-tâches)
9. [Audits](#audits)
10. [Articles/Actualités Qualiopi](#articles-actualités)

---

## Authentification et Base URL

**Base URL :** `/api/quality`

**Toutes les routes nécessitent :**
- Authentification Bearer Token
- Headers `Content-Type: application/json` (sauf upload de fichiers)
- Headers `Accept: application/json`

---

## Initialisation du Système

### 1. Vérifier l'initialisation

**GET** `/api/quality/initialize/check`

**Réponse attendue :**
```json
{
  "success": true,
  "initialized": true,
  "indicators": {
    "count": 32
  },
  "categories": {
    "count": 5
  }
}
```

### 2. Initialiser le système

**POST** `/api/quality/initialize`

**Réponse attendue :**
```json
{
  "success": true,
  "message": "Système qualité initialisé avec succès",
  "data": {
    "indicatorsCreated": 32,
    "categoriesCreated": 5
  }
}
```

**Ce que cette route doit créer :**
- 32 indicateurs Qualiopi (numérotés de 1 à 32)
- 5 catégories d'actions par défaut :
  - Veille
  - Amélioration Continue
  - Plan développement de compétences
  - Questions Handicap
  - Gestion Des Disfonctionnements

---

## Dashboard

### Obtenir les statistiques du Dashboard

**GET** `/api/quality/dashboard/stats`

**Réponse attendue :**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalDocuments": 45,
      "procedures": 12,
      "models": 8,
      "evidences": 25,
      "recentlyAdded": 5
    },
    "indicators": {
      "total": 32,
      "completed": 15,
      "inProgress": 10,
      "notStarted": 7,
      "completionRate": 46.875,
      "indicatorsList": [
        {
          "id": 1,
          "number": 1,
          "title": "Indicateur 1 - ...",
          "status": "completed",
          "hasOverlay": true,
          "overlayColor": "#25c9b5"
        }
      ]
    },
    "nextAudit": {
      "id": 1,
      "type": "Audit initial",
      "date": "2025-12-15T00:00:00Z",
      "daysRemaining": 200,
      "status": "scheduled",
      "auditor": {
        "name": "Jean Dupont",
        "contact": "jean.dupont@audit.fr",
        "phone": "+33 1 23 45 67 89"
      }
    },
    "auditCountdown": {
      "days": 200,
      "is_overdue": false,
      "date": "2025-12-15",
      "formatted_date": "15/12/2025",
      "auditor": "Jean Dupont"
    },
    "recentDocuments": [
      {
        "id": 1,
        "name": "Procédure Qualité.pdf",
        "type": "procedure",
        "fileType": "pdf",
        "size": "2.5mb",
        "sizeBytes": 2621440,
        "indicatorIds": [1, 2, 3],
        "showIndicatorCount": false,
        "createdAt": "2025-01-10T10:30:00Z",
        "createdBy": {
          "id": "user-123",
          "name": "Marie Martin",
          "email": "marie@example.com"
        }
      }
    ],
    "actions": {
      "total": 18,
      "pending": 5,
      "inProgress": 8,
      "completed": 5,
      "overdue": 2,
      "recentActions": [
        {
          "id": 1,
          "title": "Brainstorming session",
          "description": "Organiser une session de brainstorming",
          "category": "Amélioration Continue",
          "subcategory": "Innovation",
          "priority": "High",
          "status": "in-progress",
          "createdAt": "2025-01-08T14:20:00Z"
        }
      ]
    },
    "qualiopiNews": [
      {
        "id": 1,
        "title": "Nouvelles réglementations Qualiopi 2025",
        "description": "Découvrez les changements...",
        "category": "Réglementaire",
        "date": "2025-01-05",
        "image": "https://example.com/image.jpg",
        "featured": true,
        "url": "https://example.com/article"
      }
    ],
    "articles": [] // Alternative à qualiopiNews
  }
}
```

**Notes importantes :**
- `auditCountdown` ou `nextAudit` : au moins un des deux doit être présent
- `qualiopiNews` ou `articles` : le frontend accepte les deux formats
- `daysRemaining` : nombre de jours jusqu'à l'audit (J - 200)

---

## Indicateurs Qualiopi

### 1. Lister tous les indicateurs

**GET** `/api/quality/indicators`

**Réponse attendue :**
```json
{
  "success": true,
  "data": {
    "indicators": [
      {
        "id": 1,
        "number": 1,
        "title": "Indicateur 1 - Information préalable",
        "description": "L'information préalable du bénéficiaire est complète et accessible",
        "status": "completed",
        "hasOverlay": true,
        "overlayColor": "#25c9b5",
        "overlay_color": "#25c9b5",
        "isApplicable": true,
        "documentCounts": {
          "procedures": 2,
          "models": 1,
          "evidences": 5,
          "total": 8
        }
      }
    ]
  }
}
```

**OU réponse directe :**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "number": 1,
      "title": "...",
      "status": "completed",
      "isApplicable": true,
      "documentCounts": {
        "procedures": 2,
        "models": 1,
        "evidences": 5,
        "total": 8
      }
    }
  ]
}
```

**Champs requis :**
- `id` : Identifiant unique
- `number` : Numéro de l'indicateur (1-32)
- `title` : Titre de l'indicateur
- `status` : `"completed"` | `"in-progress"` | `"not-started"` | `"in_progress"` | `"not_started"`
- `isApplicable` : `true` | `false` (pour la page Paramètres)
- `documentCounts` : Objet avec `procedures`, `models`, `evidences`, `total`

### 2. Obtenir les détails d'un indicateur

**GET** `/api/quality/indicators/{id}`

**Réponse attendue :**
```json
{
  "success": true,
  "data": {
    "id": 4,
    "number": 4,
    "title": "Indicateur 4 - Objectifs opérationnels",
    "description": "Les objectifs opérationnels et évaluables de la prestation sont définis",
    "status": "completed",
    "expectedLevel": "Les objectifs doivent être SMART (Spécifiques, Mesurables, Atteignables, Réalistes, Temporels)",
    "nonConformityCases": "Objectifs vagues, non mesurables, absence de critères d'évaluation",
    "evidenceExamples": [
      "Fiche de positionnement",
      "Contrat de formation",
      "Programme détaillé"
    ],
    "specificObligations": ["VAE", "CBC"],
    "subcontractingInfo": "Applicable même en cas de sous-traitance",
    "isApplicable": true,
    "documentCounts": {
      "procedures": 2,
      "models": 1,
      "evidences": 5,
      "total": 8
    },
    "documents": []
  }
}
```

**Champs optionnels mais recommandés :**
- `expectedLevel` : Niveau attendu pour la conformité
- `nonConformityCases` : Cas de non-conformité
- `evidenceExamples` : Array d'exemples de preuves
- `specificObligations` : Array d'obligations spécifiques (VAE, CBC, etc.)
- `subcontractingInfo` : Information sur la sous-traitance

### 3. Mettre à jour un indicateur

**PUT** `/api/quality/indicators/{id}`

**Body :**
```json
{
  "isApplicable": true,
  "status": "completed",
  "title": "Nouveau titre",
  "description": "Nouvelle description",
  "expectedLevel": "...",
  "nonConformityCases": "...",
  "evidenceExamples": ["...", "..."],
  "specificObligations": ["VAE"],
  "notes": "Notes additionnelles"
}
```

**Réponse attendue :**
```json
{
  "success": true,
  "message": "Indicateur mis à jour avec succès",
  "data": {
    "id": 4,
    "isApplicable": true,
    ...
  }
}
```

**⚠️ IMPORTANT :** Le champ `isApplicable` est utilisé par la page Paramètres des Indicateurs. Il doit être persisté en base de données.

### 4. Obtenir les documents d'un indicateur

**GET** `/api/quality/indicators/{id}/documents?type={type}`

**Query Parameters :**
- `type` (optionnel) : `"procedure"` | `"model"` | `"evidence"`

**Réponse attendue :**
```json
{
  "success": true,
  "data": {
    "documents": [
      {
        "id": 1,
        "name": "Procédure Qualité.pdf",
        "filename": "procedure_qualite.pdf",
        "type": "procedure",
        "fileType": "pdf",
        "size": "2.5mb",
        "sizeBytes": 2621440,
        "url": "/api/quality/documents/1/download",
        "indicatorIds": [1, 2, 3],
        "description": "Description du document",
        "createdAt": "2025-01-10T10:30:00Z",
        "createdBy": {
          "id": "user-123",
          "name": "Marie Martin",
          "email": "marie@example.com"
        }
      }
    ]
  }
}
```

**OU réponse directe :**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "...",
      "type": "procedure",
      ...
    }
  ]
}
```

---

## Gestion Documentaire

### 1. Uploader un document (Procédure ou Modèle)

**POST** `/api/quality/documents/upload`

**Content-Type :** `multipart/form-data`

**FormData :**
```
file: File (PDF, DOCX, etc.)
name: string (Titre du document)
type: "procedure" | "model"
description: string (optionnel)
indicatorIds: string (JSON array : [1, 2, 3])
```

**Exemple JavaScript :**
```javascript
const formData = new FormData();
formData.append('file', file);
formData.append('name', 'Ma Procédure');
formData.append('type', 'procedure');
formData.append('description', 'Description optionnelle');
formData.append('indicatorIds', JSON.stringify([1, 2, 3]));

const response = await fetch('/api/quality/documents/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});
```

**Réponse attendue :**
```json
{
  "success": true,
  "message": "Document uploadé avec succès",
  "data": {
    "id": 1,
    "name": "Ma Procédure",
    "type": "procedure",
    "filename": "ma_procedure_123456.pdf",
    "sizeBytes": 2621440,
    "url": "/api/quality/documents/1/download",
    "indicatorIds": [1, 2, 3],
    "createdAt": "2025-01-10T10:30:00Z"
  }
}
```

### 2. Uploader une preuve avec contexte

**POST** `/api/quality/documents/upload`

**Content-Type :** `multipart/form-data`

**FormData :**
```
file: File
name: string (Titre de la preuve)
type: "evidence"
description: string (optionnel)
indicatorIds: string (JSON array : [1, 2, 3])
courseId: string (UUID de la formation) - REQUIS
sessionId: string (UUID de la session) - REQUIS
learnerId: string (UUID de l'apprenant) - OPTIONNEL
```

**⚠️ IMPORTANT :**
- `courseId` et `sessionId` sont **REQUIS** pour les preuves
- `learnerId` est **OPTIONNEL** (preuve individuelle vs collective)
- La validation backend doit vérifier que :
  - La session appartient bien à la formation (`courseId`)
  - L'apprenant appartient bien à la session (`sessionId`) si `learnerId` est fourni

**Réponse attendue :**
```json
{
  "success": true,
  "message": "Preuve uploadée avec succès",
  "data": {
    "id": 2,
    "name": "Feuille d'émargement Session X",
    "type": "evidence",
    "filename": "feuille_emargement_123456.pdf",
    "courseId": "course-uuid-123",
    "sessionId": "session-uuid-456",
    "learnerId": "learner-uuid-789",
    "indicatorIds": [4, 5],
    "createdAt": "2025-01-10T10:30:00Z"
  }
}
```

### 3. Lister les documents

**GET** `/api/quality/documents?type={type}&indicatorId={id}`

**Query Parameters :**
- `type` (optionnel) : `"procedure"` | `"model"` | `"evidence"`
- `indicatorId` (optionnel) : Filtrer par indicateur

**Réponse attendue :**
```json
{
  "success": true,
  "data": {
    "documents": [
      {
        "id": 1,
        "name": "Procédure Qualité.pdf",
        "filename": "procedure_qualite.pdf",
        "type": "procedure",
        "fileType": "pdf",
        "size": "2.5mb",
        "sizeBytes": 2621440,
        "url": "/api/quality/documents/1/download",
        "indicatorIds": [1, 2, 3],
        "createdAt": "2025-01-10T10:30:00Z",
        "createdBy": {
          "id": "user-123",
          "name": "Marie Martin"
        }
      }
    ]
  }
}
```

### 4. Télécharger un document

**GET** `/api/quality/documents/{id}/download`

**Réponse :** Fichier binaire avec headers appropriés :
```
Content-Type: application/pdf (ou selon le type de fichier)
Content-Disposition: attachment; filename="document.pdf"
```

### 5. Supprimer un document

**DELETE** `/api/quality/documents/{id}`

**Réponse attendue :**
```json
{
  "success": true,
  "message": "Document supprimé avec succès"
}
```

### 6. Dissocier un document d'un indicateur

**PUT** `/api/quality/documents/{id}`

**Body :**
```json
{
  "indicatorIds": [1, 2] // Nouvelle liste (sans l'indicateur à dissocier)
}
```

---

## Preuves avec Contexte

### 1. Obtenir les formations disponibles

**GET** `/api/courses?per_page=100`

**⚠️ NOTE :** Le frontend utilise actuellement l'endpoint existant `/api/courses`. Si cet endpoint n'existe pas, vous pouvez créer un endpoint dédié :

**GET** `/api/quality/courses` (alternative)

**Réponse attendue :**
```json
{
  "success": true,
  "data": {
    "courses": {
      "data": [
        {
          "uuid": "course-uuid-123",
          "title": "Formation React Avancé",
          "code": "REACT-001"
        }
      ]
    }
  }
}
```

**OU réponse directe :**
```json
{
  "success": true,
  "data": [
    {
      "uuid": "course-uuid-123",
      "title": "Formation React Avancé",
      "code": "REACT-001"
    }
  ]
}
```

**Champs requis :**
- `uuid` ou `id` : Identifiant unique de la formation
- `title` : Titre de la formation

### 2. Obtenir les sessions d'une formation

**GET** `/api/quality/sessions?courseUuid={courseUuid}`

**OU**

**GET** `/api/courses/{courseUuid}/sessions` (si existe déjà)

**Réponse attendue :**
```json
{
  "success": true,
  "data": {
    "sessions": [
      {
        "uuid": "session-uuid-456",
        "title": "Session 1 - React Avancé",
        "courseUuid": "course-uuid-123",
        "startDate": "2025-02-01",
        "endDate": "2025-02-15",
        "status": "planned"
      }
    ]
  }
}
```

**Champs requis :**
- `uuid` ou `id` : Identifiant unique de la session
- `title` : Titre de la session
- `courseUuid` ou `courseId` : UUID de la formation parente

### 3. Obtenir les apprenants d'une session

**GET** `/api/quality/sessions/{sessionUuid}/participants`

**OU**

**GET** `/api/sessions/{sessionUuid}/participants` (si existe déjà)

**Réponse attendue :**
```json
{
  "success": true,
  "data": {
    "participants": [
      {
        "uuid": "learner-uuid-789",
        "firstName": "Jean",
        "lastName": "Dupont",
        "email": "jean.dupont@example.com",
        "fullName": "Jean Dupont"
      }
    ]
  }
}
```

**Champs requis :**
- `uuid` ou `id` : Identifiant unique de l'apprenant
- `firstName`, `lastName` ou `fullName` : Nom de l'apprenant
- `email` : Email de l'apprenant

---

## BPF

### 1. Obtenir le BPF actuel (draft)

**GET** `/api/quality/bpf?year={year}&status=draft`

**Query Parameters :**
- `year` (optionnel) : Année du BPF (défaut : année actuelle)
- `status` (optionnel) : `"draft"` | `"submitted"` | `"approved"`

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
        "data": {
          "sectionA": {
            "nomOrganisme": "...",
            "siret": "...",
            ...
          },
          "sectionB": {
            "nombreFormations": 10,
            ...
          },
          "sectionC": {
            "chiffreAffaires": 50000,
            ...
          }
        },
        "createdAt": "2025-01-01T00:00:00Z",
        "updatedAt": "2025-01-10T10:30:00Z",
        "createdBy": {
          "id": "user-123",
          "name": "Marie Martin"
        }
      }
    ]
  }
}
```

**OU réponse directe :**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "year": 2025,
      "status": "draft",
      "data": {...}
    }
  ]
}
```

### 2. Créer un nouveau BPF

**POST** `/api/quality/bpf`

**Body :**
```json
{
  "year": 2025,
  "data": {
    "sectionA": {...},
    "sectionB": {...},
    "sectionC": {...}
  }
}
```

**Réponse attendue :**
```json
{
  "success": true,
  "message": "BPF créé avec succès",
  "data": {
    "id": 1,
    "year": 2025,
    "status": "draft",
    "data": {...},
    "createdAt": "2025-01-10T10:30:00Z"
  }
}
```

### 3. Mettre à jour un BPF

**PUT** `/api/quality/bpf/{id}`

**Body :**
```json
{
  "data": {
    "sectionA": {...},
    "sectionB": {...}
  }
}
```

**Réponse attendue :**
```json
{
  "success": true,
  "message": "BPF mis à jour avec succès",
  "data": {
    "id": 1,
    "updatedAt": "2025-01-10T11:00:00Z"
  }
}
```

**⚠️ IMPORTANT :** Chaque modification doit créer une entrée dans l'historique.

### 4. Soumettre un BPF

**POST** `/api/quality/bpf/{id}/submit`

**Réponse attendue :**
```json
{
  "success": true,
  "message": "BPF soumis avec succès",
  "data": {
    "id": 1,
    "status": "submitted",
    "submittedDate": "2025-01-10T11:00:00Z"
  }
}
```

**⚠️ IMPORTANT :** Après soumission, le BPF ne peut plus être modifié. Un nouveau BPF doit être créé pour l'année suivante.

### 5. Obtenir l'historique d'un BPF

**GET** `/api/quality/bpf/{id}/history`

**Réponse attendue :**
```json
{
  "success": true,
  "data": {
    "history": [
      {
        "id": 1,
        "action": "create",
        "field": null,
        "oldValue": null,
        "newValue": null,
        "createdAt": "2025-01-01T00:00:00Z",
        "user": {
          "id": "user-123",
          "name": "Marie Martin"
        }
      },
      {
        "id": 2,
        "action": "update",
        "field": "sectionB.nombreFormations",
        "oldValue": "5",
        "newValue": "10",
        "createdAt": "2025-01-05T14:20:00Z",
        "user": {
          "id": "user-123",
          "name": "Marie Martin"
        }
      }
    ]
  }
}
```

**Champs requis :**
- `action` : `"create"` | `"update"` | `"submit"`
- `field` : Chemin du champ modifié (ex: `"sectionB.nombreFormations"`) ou `null` pour création/soumission
- `oldValue` : Ancienne valeur (string) ou `null`
- `newValue` : Nouvelle valeur (string) ou `null`
- `createdAt` : Date de la modification
- `user` : Utilisateur ayant effectué l'action

### 6. Obtenir les archives (BPF soumis)

**GET** `/api/quality/bpf/archives`

**Réponse attendue :**
```json
{
  "success": true,
  "data": {
    "archives": [
      {
        "id": 1,
        "year": 2024,
        "status": "submitted",
        "submittedDate": "2024-12-31T23:59:59Z",
        "data": {...}
      }
    ]
  }
}
```

### 7. Exporter un BPF en PDF

**GET** `/api/quality/bpf/{id}/export`

**Réponse :** Fichier PDF avec headers :
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="BPF_2025.pdf"
```

### 8. Supprimer un BPF

**DELETE** `/api/quality/bpf/{id}`

**⚠️ VALIDATION :** Ne permettre la suppression que si le BPF est en statut `"draft"`.

---

## Actions et Tâches

### 1. Obtenir les catégories de tâches

**GET** `/api/quality/task-categories`

**Réponse attendue :**
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "id": 1,
        "name": "Veille",
        "slug": "veille",
        "description": "Actions de veille réglementaire",
        "color": "#3f5ea9",
        "type": "veille",
        "is_system": true,
        "tasks_count": 5
      },
      {
        "id": 2,
        "name": "Amélioration Continue",
        "slug": "amelioration-continue",
        "color": "#ff7700",
        "type": "amelioration",
        "is_system": true,
        "tasks_count": 3
      }
    ]
  }
}
```

**OU réponse directe :**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Veille",
      "color": "#3f5ea9",
      ...
    }
  ]
}
```

### 2. Créer une catégorie de tâches

**POST** `/api/quality/task-categories`

**Body :**
```json
{
  "name": "Ma Nouvelle Famille",
  "color": "#ff7700",
  "description": "Description optionnelle"
}
```

**Réponse attendue :**
```json
{
  "success": true,
  "message": "Catégorie créée avec succès",
  "data": {
    "id": 3,
    "name": "Ma Nouvelle Famille",
    "slug": "ma-nouvelle-famille",
    "color": "#ff7700",
    "type": "custom",
    "is_system": false
  }
}
```

### 3. Renommer une catégorie

**PUT** `/api/quality/task-categories/{id}`

**Body :**
```json
{
  "name": "Nouveau Nom"
}
```

### 4. Supprimer une catégorie

**DELETE** `/api/quality/task-categories/{id}`

**⚠️ VALIDATION :** 
- Ne pas permettre la suppression des catégories système (`is_system: true`)
- Supprimer toutes les tâches associées OU retourner une erreur si des tâches existent

### 5. Obtenir les tâches

**GET** `/api/quality/tasks?categoryId={id}`

**Query Parameters :**
- `categoryId` (optionnel) : Filtrer par catégorie

**Réponse attendue :**
```json
{
  "success": true,
  "data": {
    "tasks": [
      {
        "id": 1,
        "title": "Réviser la procédure qualité",
        "description": "Mettre à jour la procédure selon les nouvelles normes",
        "status": "todo",
        "priority": "high",
        "dueDate": "2025-02-15",
        "due_date": "2025-02-15",
        "position": 0,
        "category_id": 1,
        "category": {
          "id": 1,
          "name": "Veille",
          "color": "#3f5ea9"
        },
        "createdAt": "2025-01-10T10:30:00Z",
        "updatedAt": "2025-01-10T10:30:00Z"
      }
    ]
  }
}
```

**Champs requis :**
- `id` : Identifiant unique
- `title` : Titre de la tâche
- `status` : `"todo"` | `"in_progress"` | `"done"` | `"archived"`
- `priority` : `"low"` | `"medium"` | `"high"` | `"urgent"`
- `category_id` : ID de la catégorie
- `position` : Position dans la colonne (pour drag & drop)
- `dueDate` ou `due_date` : Date d'échéance (format ISO ou YYYY-MM-DD)

**Note :** Le frontend accepte les deux formats de date (`dueDate` et `due_date`).

### 6. Créer une tâche

**POST** `/api/quality/tasks`

**Body :**
```json
{
  "category_id": 1,
  "title": "Réviser la procédure qualité",
  "description": "Description optionnelle",
  "status": "todo",
  "priority": "high",
  "due_date": "2025-02-15"
}
```

**Réponse attendue :**
```json
{
  "success": true,
  "message": "Tâche créée avec succès",
  "data": {
    "id": 1,
    "title": "Réviser la procédure qualité",
    "status": "todo",
    "priority": "high",
    "category_id": 1,
    "position": 0,
    "createdAt": "2025-01-10T10:30:00Z"
  }
}
```

### 7. Mettre à jour une tâche

**PUT** `/api/quality/tasks/{id}`

**Body :**
```json
{
  "title": "Nouveau titre",
  "status": "in_progress",
  "priority": "urgent",
  "category_id": 2,
  "due_date": "2025-02-20"
}
```

**⚠️ IMPORTANT :** Si `category_id` change, la tâche doit être déplacée vers la nouvelle catégorie.

### 8. Mettre à jour les positions des tâches (drag & drop)

**PUT** `/api/quality/tasks/positions`

**Body :**
```json
{
  "tasks": [
    {
      "id": 1,
      "position": 0
    },
    {
      "id": 2,
      "position": 1
    },
    {
      "id": 3,
      "position": 2
    }
  ]
}
```

**Réponse attendue :**
```json
{
  "success": true,
  "message": "Positions mises à jour avec succès"
}
```

**⚠️ IMPORTANT :** Cette route est appelée lors du drag & drop dans l'interface Trello. Les positions doivent être persistées pour maintenir l'ordre.

### 9. Supprimer une tâche

**DELETE** `/api/quality/tasks/{id}`

**Réponse attendue :**
```json
{
  "success": true,
  "message": "Tâche supprimée avec succès"
}
```

### 10. Obtenir les statistiques des tâches

**GET** `/api/quality/tasks/statistics`

**Réponse attendue :**
```json
{
  "success": true,
  "data": {
    "total": 25,
    "byStatus": {
      "todo": 10,
      "in_progress": 8,
      "done": 7
    },
    "byPriority": {
      "low": 5,
      "medium": 10,
      "high": 7,
      "urgent": 3
    },
    "byCategory": {
      "1": 5,
      "2": 8,
      "3": 12
    }
  }
}
```

---

## Audits

### 1. Obtenir le prochain audit

**GET** `/api/quality/audit/next`

**Réponse attendue :**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "type": "Audit initial",
    "date": "2025-12-15T00:00:00Z",
    "daysRemaining": 200,
    "status": "scheduled",
    "auditor": {
      "name": "Jean Dupont",
      "contact": "jean.dupont@audit.fr",
      "phone": "+33 1 23 45 67 89"
    },
    "location": "Siège social",
    "reference": "AUD-2025-001",
    "createdAt": "2025-01-01T00:00:00Z"
  }
}
```

**OU avec compte à rebours :**
```json
{
  "success": true,
  "data": {
    "auditCountdown": {
      "days": 200,
      "is_overdue": false,
      "date": "2025-12-15",
      "formatted_date": "15/12/2025",
      "auditor": "Jean Dupont"
    }
  }
}
```

### 2. Créer un audit

**POST** `/api/quality/audit`

**Body :**
```json
{
  "type": "initial",
  "date": "2025-12-15",
  "reference": "AUD-2025-001",
  "auditor": {
    "name": "Jean Dupont",
    "contact": "jean.dupont@audit.fr",
    "phone": "+33 1 23 45 67 89"
  },
  "location": "Siège social"
}
```

**Valeurs possibles pour `type` :**
- `"initial"` : Audit initial
- `"surveillance"` : Audit de surveillance
- `"renouvellement"` : Audit de renouvellement

**Réponse attendue :**
```json
{
  "success": true,
  "message": "Audit créé avec succès",
  "data": {
    "id": 1,
    "type": "initial",
    "date": "2025-12-15T00:00:00Z",
    "daysRemaining": 200,
    "status": "scheduled",
    "createdAt": "2025-01-10T10:30:00Z"
  }
}
```

### 3. Mettre à jour un audit

**PUT** `/api/quality/audit/{id}`

**Body :**
```json
{
  "date": "2025-12-20",
  "type": "surveillance",
  "reference": "AUD-2025-002"
}
```

### 4. Marquer un audit comme terminé

**POST** `/api/quality/audit/{id}/complete`

**Body :**
```json
{
  "result": "passed",
  "score": 95,
  "reportUrl": "/reports/audit-2025.pdf",
  "notes": "Audit réussi avec quelques recommandations mineures"
}
```

**Valeurs possibles pour `result` :**
- `"passed"` : Réussi
- `"failed"` : Échoué
- `"conditional"` : Conditionnel

### 5. Obtenir l'historique des audits

**GET** `/api/quality/audit/history`

**Réponse attendue :**
```json
{
  "success": true,
  "data": {
    "audits": [
      {
        "id": 1,
        "type": "initial",
        "date": "2024-12-15T00:00:00Z",
        "status": "completed",
        "result": "passed",
        "score": 95,
        "completedAt": "2024-12-15T16:30:00Z"
      }
    ]
  }
}
```

### 6. Supprimer un audit

**DELETE** `/api/quality/audit/{id}`

**⚠️ VALIDATION :** Ne permettre la suppression que si l'audit est en statut `"scheduled"` (pas encore effectué).

---

## Articles/Actualités

### 1. Obtenir les articles Qualiopi

**GET** `/api/quality/news` ou `/api/quality/articles`

**Réponse attendue :**
```json
{
  "success": true,
  "data": {
    "articles": [
      {
        "id": 1,
        "title": "Nouvelles réglementations Qualiopi 2025",
        "description": "Découvrez les changements dans la certification Qualiopi pour 2025",
        "content": "Contenu complet de l'article...",
        "category": "Réglementaire",
        "date": "2025-01-05",
        "image": "https://example.com/image.jpg",
        "featured": true,
        "external_url": "https://example.com/article",
        "type": "qualiopi",
        "published_at": "2025-01-05T10:00:00Z",
        "views_count": 1250
      }
    ]
  }
}
```

**Champs requis :**
- `id` : Identifiant unique
- `title` : Titre de l'article
- `category` : Catégorie (Réglementaire, Actualités, etc.)
- `date` : Date de publication (format YYYY-MM-DD)
- `featured` : `true` | `false` (pour mettre en avant)

**Champs optionnels :**
- `description` : Description courte
- `content` : Contenu complet
- `image` : URL de l'image
- `external_url` : Lien externe si l'article est hébergé ailleurs
- `type` : `"qualiopi"` | `"regulatory"` | `"tips"` | `"update"`
- `published_at` : Date de publication complète (ISO)
- `views_count` : Nombre de vues

---

## Format de Réponse Standard

Toutes les réponses API doivent suivre ce format :

### Succès
```json
{
  "success": true,
  "message": "Message optionnel",
  "data": {
    // Données de la réponse
  }
}
```

### Erreur
```json
{
  "success": false,
  "error": {
    "message": "Message d'erreur descriptif",
    "code": "ERROR_CODE",
    "details": {
      // Détails additionnels optionnels
    }
  }
}
```

---

## Codes d'Erreur Recommandés

- `VALIDATION_ERROR` : Erreur de validation des données
- `NOT_FOUND` : Ressource non trouvée
- `UNAUTHORIZED` : Non autorisé
- `FORBIDDEN` : Accès interdit
- `INTERNAL_ERROR` : Erreur serveur

---

## Notes Importantes

1. **Format de Date :** 
   - Utiliser le format ISO 8601 (`YYYY-MM-DDTHH:mm:ssZ`) pour les dates complètes
   - Utiliser `YYYY-MM-DD` pour les dates simples
   - Le frontend convertit automatiquement selon le besoin

2. **Flexibilité des Réponses :**
   - Le frontend accepte plusieurs formats de réponse :
     - `{ success: true, data: { items: [...] } }`
     - `{ success: true, data: [...] }`
     - `{ success: true, data: { documents: [...] } }`
   - Toujours inclure `success: true/false`

3. **Gestion des Fichiers :**
   - Taille maximale recommandée : 50MB
   - Formats acceptés : PDF, DOCX, XLSX, PNG, JPG, JPEG
   - Stocker les fichiers de manière sécurisée avec accès contrôlé

4. **Permissions :**
   - Tous les utilisateurs authentifiés peuvent accéder au module Qualité
   - Certaines actions peuvent nécessiter des rôles spécifiques (à définir selon votre système)

5. **Performance :**
   - Paginer les listes longues (documents, tâches, etc.)
   - Utiliser des index en base de données pour les recherches fréquentes
   - Mettre en cache les données statiques (indicateurs, catégories système)

---

## Endpoints Prioritaires

Si vous devez implémenter progressivement, voici l'ordre de priorité :

1. **Phase 1 (Critique) :**
   - Initialisation du système
   - Dashboard stats
   - Liste des indicateurs avec `isApplicable` et `documentCounts`
   - Upload de documents (procédures, modèles, preuves)
   - Création/mise à jour d'indicateurs (`isApplicable`)

2. **Phase 2 (Important) :**
   - Gestion des tâches (CRUD complet)
   - Gestion des catégories de tâches
   - Mise à jour des positions (drag & drop)
   - BPF (CRUD, historique, soumission)

3. **Phase 3 (Complémentaire) :**
   - Audits
   - Articles/Actualités
   - Statistiques avancées

---

## Questions / Support

Pour toute question sur les spécifications, référez-vous au document :
- `Spécifications Complètes (Fonctionnel & Design) - Module Gestion de la Qualité.md`
- `QUALITY_API_GUIDE.md` (guide existant)

---

**Dernière mise à jour :** Janvier 2025

