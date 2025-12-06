# 🔴 Backend TODO - Session Statistics API

> **Priorité : HAUTE**  
> **Date : 4 Décembre 2025**  
> **Frontend : En attente de ces endpoints**

---

## 📌 Contexte

Le dashboard de session côté frontend est prêt mais attend ces endpoints pour afficher les données réelles au lieu de valeurs par défaut (0, "-").

**Base URL:** `/api/admin/organization/course-sessions`

---

## 1️⃣ Statistiques Individuelles Participant

### Endpoint
```
GET /course-sessions/{session_uuid}/participants/{participant_uuid}/statistics
```

### Description
Retourne toutes les statistiques d'un apprenant pour une session spécifique.

### Response
```json
{
  "success": true,
  "data": {
    "participant_uuid": "abc-123",
    "session_uuid": "xyz-789",
    
    "evaluations_repondus": 5,
    "taux_recommandation": 80,
    "taux_reponse_question": 75,
    "taux_reussite": 85,
    "taux_satisfaction": 90,
    "duree_moyenne_connexion": "178min",
    "taux_assiduite": 95,
    
    "presence_history": [
      { "date": "2025-01-10", "value": 100 },
      { "date": "2025-01-11", "value": 100 },
      { "date": "2025-01-12", "value": 50 },
      { "date": "2025-01-13", "value": 100 }
    ]
  }
}
```

### Calculs
| Champ | Source |
|-------|--------|
| `evaluations_repondus` | COUNT questionnaires remplis |
| `taux_recommandation` | Question "Recommanderiez-vous?" |
| `taux_reponse_question` | % questionnaires remplis / total |
| `taux_reussite` | % quiz réussis |
| `taux_satisfaction` | Moyenne notes satisfaction |
| `duree_moyenne_connexion` | Tracking connexion plateforme |
| `taux_assiduite` | % présences / séances |
| `presence_history` | Présence par séance (pour graphique) |

---

## 2️⃣ Statistiques Individuelles Formateur

### Endpoint
```
GET /course-sessions/{session_uuid}/trainers/{trainer_uuid}/statistics
```

### Description
Retourne les évaluations du formateur basées sur les questionnaires des apprenants.

### Response
```json
{
  "success": true,
  "data": {
    "trainer_uuid": "trainer-123",
    "session_uuid": "xyz-789",
    
    "clarte_explications": 70,
    "maitrise_sujet": 85,
    "pedagogie": 75,
    "rythme_adaptation": 80,
    "disponibilite_ecoute": 90,
    "qualite_supports": 65,
    "mise_en_pratique": 70,
    
    "note_globale": 76.4,
    "nombre_evaluations": 15
  }
}
```

### Calculs
Basés sur les questions du questionnaire de satisfaction formateur (moyennes).

---

## 3️⃣ Quiz Participant

### Endpoint
```
GET /course-sessions/{session_uuid}/participants/{participant_uuid}/quizzes
```

### Response
```json
{
  "success": true,
  "data": {
    "chapters": [
      {
        "chapter_uuid": "chap-1",
        "chapter_title": "Chapitre 1 | Design Basics",
        "slot_info": "Séance 2/12 - 2025-05-28",
        "average_score": 8,
        "max_score": 17,
        "quizzes": [
          {
            "uuid": "quiz-1",
            "title": "Quiz Adobe vs Canva",
            "answered_at": "2025-04-08",
            "score": 4,
            "max_score": 13,
            "questions": [
              {
                "uuid": "q1",
                "text": "What software is used for vector?",
                "type": "multiple",
                "points": 0,
                "max_points": 1,
                "is_correct": false,
                "options": [
                  { "uuid": "o1", "text": "Photoshop", "is_correct": false, "is_selected": true },
                  { "uuid": "o2", "text": "Illustrator", "is_correct": true, "is_selected": false }
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

## 4️⃣ Évaluations Participant

### Endpoint
```
GET /course-sessions/{session_uuid}/participants/{participant_uuid}/evaluations
```

### Response
```json
{
  "success": true,
  "data": [
    {
      "uuid": "eval-1",
      "title": "Évaluation Module 1",
      "type": "devoir",
      "chapter_title": "Chapitre 1",
      "sub_chapter_title": "Sous-chapitre A",
      "due_date": "2025-05-28",
      "status": "corrigé",
      "student_submission": {
        "submitted_at": "2025-05-25",
        "file_url": "https://...",
        "is_late": false
      },
      "correction": {
        "corrected_at": "2025-05-27",
        "corrected_by": "Jean Formateur",
        "file_url": "https://...",
        "grade": 85
      }
    }
  ]
}
```

### Status possibles
- `pas_envoyé` - Étudiant n'a pas soumis
- `envoyé` - Soumis, en attente correction
- `corrigé` - Corrigé par formateur

---

## 5️⃣ Historique E-Mails Participant

### Endpoint
```
GET /course-sessions/{session_uuid}/participants/{participant_uuid}/emails
```

### Response
```json
{
  "success": true,
  "data": [
    {
      "uuid": "email-1",
      "date": "2025-09-24",
      "time": "10:12",
      "type": "Convocation",
      "subject": "Convocation à la formation",
      "status": "reçu_et_ouvert",
      "opened_at": "2025-09-24 14:30",
      "recipient": {
        "name": "Jean Dupont",
        "email": "jean@example.com"
      },
      "attachments": [
        { "uuid": "att-1", "name": "convocation.pdf", "type": "pdf" }
      ]
    }
  ]
}
```

### Status possibles
- `planifié` - Email programmé
- `envoyé` - Email envoyé
- `reçu_et_ouvert` - Email ouvert par destinataire
- `échec` - Erreur d'envoi

---

## 6️⃣ Questionnaires Session (avec filtre participant)

### Endpoint
```
GET /course-sessions/{session_uuid}/questionnaires?participant_uuid={uuid}
```

### Paramètres optionnels
| Param | Description |
|-------|-------------|
| `participant_uuid` | Filtrer par participant |
| `status` | `remplis` ou `pas_remplis` |
| `type` | `satisfaction`, `evaluation`, `pre-formation`, `post-formation` |

### Response
```json
{
  "success": true,
  "data": [
    {
      "uuid": "quest-1",
      "title": "Évaluation des attentes",
      "type": "pre-formation",
      "status": "remplis",
      "filled_at": "2025-12-13",
      "thumbnail_url": "https://...",
      "questions_count": 10
    }
  ]
}
```

---

## 7️⃣ Relancer Questionnaire

### Endpoint
```
POST /course-sessions/{session_uuid}/questionnaires/{questionnaire_uuid}/remind
```

### Request
```json
{
  "participant_uuids": ["p1", "p2"],
  "message": "Rappel: merci de compléter le questionnaire"
}
```

### Response
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

## ✅ Checklist Backend

- [ ] `GET /participants/{uuid}/statistics` - Stats apprenant
- [ ] `GET /trainers/{uuid}/statistics` - Stats formateur  
- [ ] `GET /participants/{uuid}/quizzes` - Quiz apprenant
- [ ] `GET /participants/{uuid}/evaluations` - Évaluations apprenant
- [ ] `GET /participants/{uuid}/emails` - Emails apprenant
- [ ] `GET /questionnaires?participant_uuid=` - Filtrer questionnaires
- [ ] `POST /questionnaires/{uuid}/remind` - Relancer questionnaire

---

## 📞 Contact

Questions ? Contactez l'équipe frontend.

*Dernière mise à jour : 4 Décembre 2025*

