# Backend - Modifications Session & Présence

> **Date : 4 Décembre 2025**  
> **Priorité : HAUTE**

---

## 🔐 Validation Code Présence (Apprenant)

### Endpoint
```
POST /api/admin/organization/course-sessions/{session_uuid}/slots/{slot_uuid}/validate-attendance-code
```

### Description
Permet à un apprenant de valider sa présence avec le code numérique ou QR code.

### Request
```json
{
  "code": "721222",
  "participant_uuid": "participant-123",
  "period": "morning"
}
```

**OU** pour QR code :
```json
{
  "qr_code": "https://formly.com/attendance/xxx/yyy?code=721222",
  "participant_uuid": "participant-123",
  "period": "morning"
}
```

### Response Success
```json
{
  "success": true,
  "data": {
    "validated": true,
    "signed_at": "2025-12-16T09:15:00Z",
    "participant_name": "Jean Dupont",
    "period": "morning",
    "slot_title": "Séance du 16/12/2025"
  }
}
```

### Response Error (Code invalide)
```json
{
  "success": false,
  "message": "Code de présence invalide ou expiré",
  "errors": {
    "code": ["Le code fourni n'est pas valide pour cette séance"]
  }
}
```

### Response Error (Code expiré)
```json
{
  "success": false,
  "message": "Code de présence expiré",
  "errors": {
    "code": ["Le code a expiré. Veuillez demander un nouveau code au formateur"]
  }
}
```

### Business Rules
- Le code est valide uniquement pour la séance spécifiée
- Le code expire après la fin de la séance (`end_time`)
- Un participant ne peut valider qu'une seule fois par période (morning/afternoon)
- Le code doit correspondre exactement (sans espaces)

---

## 📊 Statistiques Globales Session (Amélioration)

### Endpoint Existant
```
GET /api/admin/organization/course-sessions/{session_uuid}/statistics
```

### Response Améliorée Requise
```json
{
  "success": true,
  "data": {
    "session_uuid": "xxx",
    
    // Participants
    "total_participants": 25,
    "confirmed_participants": 23,
    "waitlist_count": 2,
    
    // KPIs Globaux
    "taux_recommandation_global": 78,
    "duree_moyenne_connexion_global": "165min",
    "taux_assiduite_global": 85,
    
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
    "nombre_evaluations_formateur": 15,
    
    // Historique pour graphique
    "presence_history": [
      { "date": "2025-01-10", "value": 95 },
      { "date": "2025-01-11", "value": 90 },
      { "date": "2025-01-12", "value": 85 }
    ],
    
    // Détails par période
    "presence_by_period": {
      "morning": { "present": 20, "total": 25, "percentage": 80 },
      "afternoon": { "present": 18, "total": 25, "percentage": 72 }
    }
  }
}
```

---

## 🔍 Filtres Dashboard

### Endpoint avec Filtres
```
GET /api/admin/organization/course-sessions/{session_uuid}/participants?search={query}&status={status}&sort={field}&order={asc|desc}
```

### Paramètres
| Param | Type | Description |
|-------|------|-------------|
| `search` | string | Recherche nom/email |
| `status` | string | `all`, `registered`, `confirmed`, `attended`, `completed`, `cancelled` |
| `sort` | string | `name`, `email`, `enrollment_date`, `status` |
| `order` | string | `asc` ou `desc` |
| `per_page` | number | Nombre de résultats (défaut: 50) |
| `page` | number | Page (défaut: 1) |

### Response
```json
{
  "success": true,
  "data": {
    "participants": [...],
    "pagination": {
      "current_page": 1,
      "per_page": 50,
      "total": 25,
      "last_page": 1
    },
    "filters_applied": {
      "search": "jean",
      "status": "confirmed"
    }
  }
}
```

---

## 📧 Emails Formateur

### Endpoint
```
GET /api/admin/organization/course-sessions/{session_uuid}/trainers/{trainer_uuid}/emails
```

### Description
Historique des emails envoyés à un formateur pour cette session.

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
        "name": "Jean Formateur",
        "email": "formateur@example.com"
      },
      "attachments": [
        { "uuid": "att-1", "name": "convocation.pdf", "type": "pdf" }
      ]
    }
  ]
}
```

---

## 📝 Informations Code Présence

### Endpoint
```
GET /api/admin/organization/course-sessions/{session_uuid}/slots/{slot_uuid}/attendance-code/info
```

### Description
Retourne les informations sur le code de présence (validité, expiration, etc.)

### Response
```json
{
  "success": true,
  "data": {
    "code": "721222",
    "valid_until": "2025-12-16T17:00:00Z",
    "period": "morning",
    "slot_title": "Séance du 16/12/2025",
    "instructions": "Entrez ce code dans l'application pour confirmer votre présence",
    "qr_code_url": "https://formly.com/attendance/xxx/yyy?code=721222",
    "can_regenerate": true
  }
}
```

---

## ✅ Checklist Backend

- [ ] `POST /slots/{slot}/validate-attendance-code` - Validation code présence
- [ ] `GET /statistics` - Améliorer avec tous les KPIs
- [ ] `GET /participants?search=&status=&sort=` - Filtres participants
- [ ] `GET /trainers/{uuid}/emails` - Emails formateur
- [ ] `GET /slots/{slot}/attendance-code/info` - Infos code présence

---

## 🔄 Frontend - Ce qui sera connecté

1. ✅ Validation code présence (QR + numérique)
2. ✅ Filtres recherche/statut participants
3. ✅ Statistiques globales complètes
4. ✅ Emails formateur
5. ✅ Modal "Plus d'infos" code présence

---

*Document créé le: 4 Décembre 2025*

