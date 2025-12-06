# Session Dashboard - Backend API Requirements

## 📋 Résumé

Ce document décrit les endpoints API nécessaires pour le bon fonctionnement des dashboards de session côté frontend. Certains endpoints existent déjà, d'autres doivent être créés.

---

## ✅ Endpoints Existants (Fonctionnels)

| Endpoint | Status | Utilisation |
|----------|--------|-------------|
| `GET /course-sessions/{uuid}` | ✅ OK | Détails session |
| `GET /course-sessions/{uuid}/slots` | ✅ OK | Liste des séances |
| `GET /course-sessions/{uuid}/participants` | ✅ OK | Liste participants |
| `GET /course-sessions/{uuid}/slots/{slot}/attendance` | ✅ OK | Émargement séance |
| `POST /course-sessions/{uuid}/slots/{slot}/attendance` | ✅ OK | Marquer présence |
| `GET /course-sessions/{uuid}/slots/{slot}/attendance-code` | ✅ OK | Code présence |
| `GET /course-sessions/{uuid}/workflow-actions` | ✅ OK | Actions workflow |
| `GET /course-sessions/{uuid}/statistics` | ✅ OK | Stats globales |

---

## 🔴 Endpoints Requis (À Créer)

### 1. Statistiques Individuelles Participant

**GET** `/api/admin/organization/course-sessions/{session_uuid}/participants/{participant_uuid}/statistics`

Retourne les statistiques individuelles d'un participant pour une session.

**Response:**
```json
{
  "success": true,
  "data": {
    "participant_uuid": "xxx",
    "session_uuid": "xxx",
    // KPIs Apprenant
    "evaluations_repondus": 5,
    "taux_recommandation": 80,
    "taux_reponse_question": 75,
    "taux_reussite": 85,
    "taux_satisfaction": 90,
    "duree_moyenne_connexion": "178min",
    "taux_assiduite": 95,
    // Historique présence pour le graphique
    "presence_history": [
      { "date": "2025-01-10", "value": 100 },
      { "date": "2025-01-11", "value": 100 },
      { "date": "2025-01-12", "value": 50 },
      { "date": "2025-01-13", "value": 100 }
    ]
  }
}
```

---

### 2. Statistiques Individuelles Formateur

**GET** `/api/admin/organization/course-sessions/{session_uuid}/trainers/{trainer_uuid}/statistics`

Retourne les statistiques d'évaluation d'un formateur pour une session.

**Response:**
```json
{
  "success": true,
  "data": {
    "trainer_uuid": "xxx",
    "session_uuid": "xxx",
    // KPIs Formateur (basés sur les évaluations des apprenants)
    "clarte_explications": 70,
    "maitrise_sujet": 85,
    "pedagogie": 75,
    "rythme_adaptation": 80,
    "disponibilite_ecoute": 90,
    "qualite_supports": 65,
    "mise_en_pratique": 70,
    // Moyenne globale
    "note_globale": 76.4,
    "nombre_evaluations": 15
  }
}
```

---

### 3. Quiz Participant

**GET** `/api/admin/organization/course-sessions/{session_uuid}/participants/{participant_uuid}/quizzes`

Liste tous les quiz et leurs résultats pour un participant.

**Response:**
```json
{
  "success": true,
  "data": {
    "chapters": [
      {
        "chapter_uuid": "xxx",
        "chapter_title": "Chapitre 1 | Design Basics",
        "slot_info": "Séance 2/12 - 2025-05-28",
        "average_score": 8,
        "max_score": 17,
        "quizzes": [
          {
            "uuid": "quiz-xxx",
            "title": "La Différence Entre Adobe Et Canva",
            "answered_at": "2025-04-08",
            "score": 4,
            "max_score": 13,
            "questions": [
              {
                "uuid": "q1",
                "text": "What is the software used for vector?",
                "type": "multiple",
                "points": 0,
                "max_points": 1,
                "is_correct": false,
                "options": [
                  { "uuid": "o1", "text": "Adobe Photoshop", "is_correct": false, "is_selected": true },
                  { "uuid": "o2", "text": "Adobe Illustrator", "is_correct": true, "is_selected": false },
                  { "uuid": "o3", "text": "Adobe Indesign", "is_correct": false, "is_selected": false }
                ]
              }
            ]
          }
        ]
      }
    ]
  }
}
```

---

### 4. Évaluations Participant

**GET** `/api/admin/organization/course-sessions/{session_uuid}/participants/{participant_uuid}/evaluations`

Liste toutes les évaluations (devoirs, examens) d'un participant.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "uuid": "eval-xxx",
      "title": "Titre De L'évaluation 1",
      "type": "devoir",
      "chapter_title": "Titre de Chapitre",
      "sub_chapter_title": "Titre de sous Chapitre",
      "due_date": "2025-05-28",
      "status": "corrigé",
      "student_submission": {
        "submitted_at": "2025-05-25",
        "file_url": "https://...",
        "is_late": false
      },
      "correction": {
        "corrected_at": "2025-05-27",
        "corrected_by": "Nom De Formateur",
        "file_url": "https://...",
        "grade": 85,
        "comments": "Bon travail"
      }
    },
    {
      "uuid": "eval-yyy",
      "title": "Titre De L'évaluation 2",
      "type": "examen",
      "status": "pas_envoyé"
    }
  ]
}
```

---

### 5. Historique E-Mails Participant

**GET** `/api/admin/organization/course-sessions/{session_uuid}/participants/{participant_uuid}/emails`

Historique des emails envoyés à un participant.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "uuid": "email-xxx",
      "date": "2025-09-24",
      "time": "10:12",
      "type": "Convocation Lien D'émargement",
      "subject": "Convocation À La Formation...",
      "status": "reçu_et_ouvert",
      "opened_at": "2025-10-17 03:19",
      "recipient": {
        "name": "Jean Dupont",
        "email": "contact@example.com"
      },
      "attachments": [
        { "uuid": "att-1", "name": "facture.pdf", "type": "pdf" },
        { "uuid": "att-2", "name": "convocation.pdf", "type": "pdf" }
      ]
    }
  ]
}
```

---

### 6. Questionnaires Session

**GET** `/api/admin/organization/course-sessions/{session_uuid}/questionnaires`

Liste des questionnaires associés à la session.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "uuid": "quest-xxx",
      "title": "Évaluation Des Attentes De L'apprenant",
      "type": "pre-formation",
      "status": "remplis",
      "filled_at": "2025-12-13",
      "thumbnail_url": "https://...",
      "questions_count": 10
    },
    {
      "uuid": "quest-yyy",
      "title": "Questionnaire de satisfaction",
      "type": "satisfaction",
      "status": "pas_remplis"
    }
  ]
}
```

**Avec filtres optionnels:**
- `?participant_uuid=xxx` - Questionnaires d'un participant spécifique
- `?status=remplis|pas_remplis` - Filtrer par statut
- `?type=satisfaction|evaluation|pre-formation|post-formation` - Filtrer par type

---

### 7. Validation Code Présence (Apprenant)

**POST** `/api/admin/organization/course-sessions/{session_uuid}/slots/{slot_uuid}/validate-attendance-code`

Permet à un apprenant de valider sa présence avec le code numérique.

**Request:**
```json
{
  "code": "457875",
  "participant_uuid": "xxx",
  "period": "morning"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "validated": true,
    "signed_at": "2025-01-10T09:15:00Z",
    "participant_name": "Jean Dupont"
  }
}
```

---

### 8. Relancer un Questionnaire

**POST** `/api/admin/organization/course-sessions/{session_uuid}/questionnaires/{questionnaire_uuid}/remind`

Envoie un rappel pour remplir un questionnaire.

**Request:**
```json
{
  "participant_uuids": ["xxx", "yyy"],
  "message": "Rappel personnalisé (optionnel)"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sent_count": 2,
    "sent_at": "2025-01-10T10:00:00Z"
  }
}
```

---

## 📊 Endpoints pour les Statistiques Globales (Session)

L'endpoint existant `GET /course-sessions/{uuid}/statistics` devrait retourner :

```json
{
  "success": true,
  "data": {
    "session_uuid": "xxx",
    // Participants
    "total_participants": 25,
    "confirmed_participants": 23,
    "waitlist_count": 2,
    // Présence globale
    "taux_assiduite_global": 85,
    "taux_recommandation_global": 78,
    "duree_moyenne_connexion_global": "165min",
    // Questionnaires
    "questionnaires_total": 10,
    "questionnaires_remplis": 7,
    "taux_reponse_questionnaires": 70,
    // Évaluations
    "evaluations_total": 5,
    "evaluations_corrigees": 3,
    "taux_reussite_global": 82,
    // Formateur
    "note_formateur_globale": 4.2,
    // Graphique historique
    "presence_history": [
      { "date": "2025-01-10", "value": 95 },
      { "date": "2025-01-11", "value": 90 }
    ]
  }
}
```

---

## 🔧 Modifications Requises

### Dans `GET /course-sessions/{uuid}/slots/{slot}/attendance-code`

Assurez-vous que la réponse inclut :

```json
{
  "success": true,
  "data": {
    "numeric_code": "457875",
    "qr_code_url": "https://formly.com/attendance/xxx/yyy?code=457875",
    "qr_code_base64": "data:image/png;base64,...",
    "valid_until": "2025-01-10T12:00:00Z",
    "period": "morning",
    "slot_uuid": "yyy",
    "session_uuid": "xxx"
  }
}
```

---

## 📝 Priorités

| Priorité | Endpoint | Raison |
|----------|----------|--------|
| 🔴 Haute | Statistiques individuelles participant | Dashboard apprenant |
| 🔴 Haute | Statistiques individuelles formateur | Dashboard formateur |
| 🟡 Moyenne | Quiz participant | Onglet Quiz |
| 🟡 Moyenne | Évaluations participant | Onglet Évaluation |
| 🟡 Moyenne | Historique emails | Onglet Suivi E-Mail |
| 🟢 Basse | Validation code présence | Self-check-in apprenant |
| 🟢 Basse | Relancer questionnaire | Bouton "Relancer" |

---

## 🔄 Frontend - Ce qui a été connecté

1. ✅ Chargement session depuis API
2. ✅ Chargement participants depuis API
3. ✅ Chargement formateurs depuis API (avec fallback sur cours)
4. ✅ Chargement séances depuis API
5. ✅ Émargement (lecture + marquage présence)
6. ✅ Actions workflow
7. ✅ Export feuille d'émargement PDF
8. ⏳ Statistiques globales (endpoint existe, à connecter)
9. ❌ Statistiques individuelles (endpoint manquant)
10. ❌ Quiz/Évaluations/Emails (endpoints manquants)

---

## 📞 Contact

Pour toute question sur ces spécifications, contactez l'équipe frontend.

*Document créé le: 4 Décembre 2025*

