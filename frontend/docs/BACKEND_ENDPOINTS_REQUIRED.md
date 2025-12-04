# 📋 Endpoints Backend Requis - Gestion des Sessions

> **Document technique pour l'équipe Backend**  
> Date: 03/12/2025  
> Frontend: Sessions Management Module

---

## 🎯 Contexte

Le module de gestion des sessions côté frontend est maintenant connecté à l'API `/api/admin/organization/course-sessions`. Cependant, certaines fonctionnalités nécessitent des **endpoints supplémentaires** qui n'existent pas encore.

---

## ✅ Endpoints Existants (Fonctionnels)

| Endpoint | Méthode | Description | Status |
|----------|---------|-------------|--------|
| `/course-sessions` | GET | Liste des sessions | ✅ OK |
| `/course-sessions/{uuid}` | GET | Détails session | ✅ OK |
| `/course-sessions` | POST | Créer session | ✅ OK |
| `/course-sessions/{uuid}` | PUT | Modifier session | ✅ OK |
| `/course-sessions/{uuid}` | DELETE | Supprimer session | ✅ OK |
| `/course-sessions/{uuid}/slots` | GET | Liste des séances | ✅ OK |
| `/course-sessions/{uuid}/slots` | POST | Créer séance | ✅ OK |
| `/course-sessions/{uuid}/generate-slots` | POST | Générer séances récurrentes | ✅ OK |
| `/course-sessions/{uuid}/participants` | GET | Liste participants | ✅ OK |
| `/course-sessions/{uuid}/participants` | POST | Ajouter participant | ✅ OK |
| `/course-sessions/{uuid}/enroll-multiple` | POST | Inscription multiple | ✅ OK |

---

## ❌ Endpoints Manquants (À Créer)

### 1. 📊 Émargement par Séance (Attendance)

#### 1.1 Récupérer les données d'émargement d'une séance

```http
GET /api/admin/organization/course-sessions/{session_uuid}/slots/{slot_uuid}/attendance
```

**Description:** Retourne les statistiques d'émargement et la liste des présences pour une séance spécifique.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "slot_uuid": "slot-uuid-123",
    "slot_date": "2026-01-15",
    "morning": {
      "present": 8,
      "absent": 2,
      "total": 10,
      "percentage": 80
    },
    "afternoon": {
      "present": 7,
      "absent": 3,
      "total": 10,
      "percentage": 70
    },
    "trainer_signed": true,
    "trainer_signed_at": "2026-01-15T12:35:00Z",
    "trainer_signature_url": "https://storage.../signature.png",
    "participants": [
      {
        "uuid": "participant-uuid-1",
        "user_uuid": "user-uuid-1",
        "name": "Jean Dupont",
        "email": "jean.dupont@email.com",
        "morning_present": true,
        "morning_signed_at": "2026-01-15T09:05:00Z",
        "morning_signature_method": "qr_code",
        "afternoon_present": true,
        "afternoon_signed_at": "2026-01-15T14:02:00Z",
        "afternoon_signature_method": "manual",
        "absence_reason": null
      },
      {
        "uuid": "participant-uuid-2",
        "user_uuid": "user-uuid-2",
        "name": "Marie Martin",
        "email": "marie.martin@email.com",
        "morning_present": false,
        "morning_signed_at": null,
        "morning_signature_method": null,
        "afternoon_present": false,
        "afternoon_signed_at": null,
        "afternoon_signature_method": null,
        "absence_reason": "Maladie"
      }
    ]
  }
}
```

---

#### 1.2 Marquer la présence d'un participant

```http
POST /api/admin/organization/course-sessions/{session_uuid}/slots/{slot_uuid}/attendance
```

**Description:** Permet à l'admin de marquer manuellement la présence/absence d'un participant.

**Request Body:**
```json
{
  "participant_uuid": "participant-uuid-123",
  "period": "morning",  // "morning" | "afternoon"
  "present": true,
  "signature_method": "manual",  // "manual" | "qr_code" | "numeric_code"
  "absence_reason": null  // Requis si present=false
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Présence enregistrée avec succès",
  "data": {
    "participant_uuid": "participant-uuid-123",
    "period": "morning",
    "present": true,
    "signed_at": "2026-01-15T09:30:00Z"
  }
}
```

---

#### 1.3 Signature du formateur

```http
POST /api/admin/organization/course-sessions/{session_uuid}/slots/{slot_uuid}/trainer-signature
```

**Description:** Enregistre la signature du formateur pour une séance.

**Request Body:**
```json
{
  "trainer_uuid": "trainer-uuid-123",
  "signature_data": "data:image/png;base64,iVBORw0KGgo...",  // Signature dessinée (optionnel)
  "confirm": true  // Simple confirmation sans dessin
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Signature du formateur enregistrée",
  "data": {
    "trainer_signed": true,
    "trainer_signed_at": "2026-01-15T17:30:00Z"
  }
}
```

---

### 2. 📱 QR Code & Code de Présence

#### 2.1 Générer/Récupérer le code de présence

```http
GET /api/admin/organization/course-sessions/{session_uuid}/slots/{slot_uuid}/attendance-code
```

**Description:** Génère ou récupère le QR code et le code numérique pour l'émargement automatique des participants.

**Query Parameters:**
- `period`: `morning` | `afternoon` (optionnel, par défaut selon l'heure actuelle)
- `regenerate`: `true` | `false` (pour forcer la régénération)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "slot_uuid": "slot-uuid-123",
    "period": "morning",
    "qr_code_url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "qr_code_content": "https://app.formly.fr/attendance/verify?code=ABC123XYZ",
    "numeric_code": "457-875",
    "valid_from": "2026-01-15T08:30:00Z",
    "expires_at": "2026-01-15T12:30:00Z",
    "is_active": true
  }
}
```

---

#### 2.2 Valider un code de présence (côté apprenant)

```http
POST /api/attendance/verify
```

**Description:** Endpoint public pour que l'apprenant valide sa présence via QR code ou code numérique.

**Request Body:**
```json
{
  "code": "457-875",  // ou le contenu du QR code
  "user_uuid": "user-uuid-123",  // ou récupéré du token JWT
  "geolocation": {  // Optionnel - pour vérification de localisation
    "latitude": 48.8566,
    "longitude": 2.3522
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Présence enregistrée avec succès",
  "data": {
    "session_title": "React Masterclass",
    "slot_date": "2026-01-15",
    "period": "morning",
    "signed_at": "2026-01-15T09:05:32Z"
  }
}
```

**Response (400) - Code expiré:**
```json
{
  "success": false,
  "message": "Code de présence expiré",
  "error_code": "ATTENDANCE_CODE_EXPIRED"
}
```

---

### 3. 📋 Workflow / Déroulement de Session

#### 3.1 Récupérer les actions du workflow

```http
GET /api/admin/organization/course-sessions/{session_uuid}/workflow-actions
```

**Description:** Retourne la liste des actions automatisées configurées pour la session (envoi de questionnaires, attestations, etc.).

**Response (200):**
```json
{
  "success": true,
  "data": {
    "session_uuid": "session-uuid-123",
    "actions": [
      {
        "uuid": "action-uuid-1",
        "title": "Envoi des questionnaires pré-formation",
        "type": "send_questionnaire",
        "target_type": "apprenant",
        "trigger": "before_session",
        "trigger_days": 7,
        "status": "executed",
        "executed_at": "2026-01-08T10:15:00Z",
        "questionnaires": [
          {
            "uuid": "quest-uuid-1",
            "title": "Questionnaire de positionnement",
            "responses_count": 8,
            "total_recipients": 10
          }
        ],
        "attachments": []
      },
      {
        "uuid": "action-uuid-2",
        "title": "Envoi convocation formateur",
        "type": "send_convocation",
        "target_type": "formateur",
        "trigger": "before_session",
        "trigger_days": 3,
        "status": "executed",
        "executed_at": "2026-01-12T09:00:00Z",
        "questionnaires": [],
        "attachments": [
          {
            "uuid": "attach-uuid-1",
            "name": "Convocation_Formation.pdf",
            "url": "https://storage.../convocation.pdf"
          }
        ]
      },
      {
        "uuid": "action-uuid-3",
        "title": "Questionnaire de satisfaction",
        "type": "send_questionnaire",
        "target_type": "apprenant",
        "trigger": "after_session",
        "trigger_days": 1,
        "status": "pending",
        "scheduled_for": "2026-01-20T09:00:00Z",
        "executed_at": null,
        "questionnaires": [
          {
            "uuid": "quest-uuid-2",
            "title": "Évaluation à chaud"
          }
        ],
        "attachments": []
      },
      {
        "uuid": "action-uuid-4",
        "title": "Génération des attestations",
        "type": "generate_certificate",
        "target_type": "apprenant",
        "trigger": "after_session",
        "trigger_days": 0,
        "status": "not_executed",
        "executed_at": null,
        "questionnaires": [],
        "attachments": []
      }
    ]
  }
}
```

**Types d'actions (`type`):**
- `send_questionnaire` - Envoi de questionnaire
- `send_convocation` - Envoi de convocation
- `send_reminder` - Envoi de rappel
- `generate_certificate` - Génération d'attestation
- `send_certificate` - Envoi d'attestation
- `send_evaluation` - Envoi d'évaluation

**Cibles (`target_type`):**
- `apprenant` - Participants/Apprenants
- `formateur` - Formateur(s)
- `entreprise` - Entreprise/Financeur

**Statuts (`status`):**
- `pending` - Planifié, en attente d'exécution
- `executed` - Exécuté avec succès
- `not_executed` - Non exécuté (erreur ou annulé)
- `skipped` - Ignoré (conditions non remplies)

---

#### 3.2 Exécuter manuellement une action

```http
POST /api/admin/organization/course-sessions/{session_uuid}/workflow-actions/{action_uuid}/execute
```

**Description:** Force l'exécution manuelle d'une action du workflow.

**Response (200):**
```json
{
  "success": true,
  "message": "Action exécutée avec succès",
  "data": {
    "action_uuid": "action-uuid-3",
    "status": "executed",
    "executed_at": "2026-01-15T14:30:00Z",
    "recipients_count": 10,
    "success_count": 10,
    "failed_count": 0
  }
}
```

---

### 4. 📈 Statistiques de Session (KPIs)

#### 4.1 Récupérer les KPIs d'une session

```http
GET /api/admin/organization/course-sessions/{session_uuid}/statistics
```

**Description:** Retourne les indicateurs clés de performance pour une session.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "session_uuid": "session-uuid-123",
    "participants": {
      "total": 12,
      "confirmed": 10,
      "pending": 2,
      "cancelled": 0
    },
    "attendance": {
      "average_rate": 85.5,
      "slots_completed": 3,
      "slots_total": 5
    },
    "satisfaction": {
      "response_rate": 80,
      "average_score": 4.2,
      "recommendation_rate": 92
    },
    "completion": {
      "rate": 75,
      "passed": 9,
      "failed": 1,
      "pending": 2
    },
    "financials": {
      "total_revenue": 32499.89,
      "average_price": 3249.99,
      "currency": "EUR"
    },
    "connection": {
      "average_duration_minutes": 342,
      "total_duration_minutes": 4104
    }
  }
}
```

---

### 5. 📄 Export Feuille d'Émargement

#### 5.1 Télécharger la feuille d'émargement PDF

```http
GET /api/admin/organization/course-sessions/{session_uuid}/slots/{slot_uuid}/attendance/export
```

**Query Parameters:**
- `format`: `pdf` | `excel` (défaut: `pdf`)

**Response (200):**
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="emargement_session_2026-01-15.pdf"

[Binary PDF data]
```

---

#### 5.2 Télécharger toutes les feuilles d'émargement

```http
GET /api/admin/organization/course-sessions/{session_uuid}/attendance/export-all
```

**Query Parameters:**
- `format`: `pdf` | `excel` | `zip` (défaut: `zip` contenant tous les PDFs)

---

## 📊 Schéma de Base de Données Suggéré

```sql
-- Table des présences par séance
CREATE TABLE session_slot_attendance (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    uuid VARCHAR(36) UNIQUE NOT NULL,
    session_slot_id BIGINT NOT NULL,
    participant_id BIGINT NOT NULL,
    
    -- Matin
    morning_present BOOLEAN DEFAULT NULL,
    morning_signed_at TIMESTAMP NULL,
    morning_signature_method ENUM('manual', 'qr_code', 'numeric_code') NULL,
    morning_signature_data TEXT NULL,  -- Base64 si signature dessinée
    
    -- Après-midi
    afternoon_present BOOLEAN DEFAULT NULL,
    afternoon_signed_at TIMESTAMP NULL,
    afternoon_signature_method ENUM('manual', 'qr_code', 'numeric_code') NULL,
    afternoon_signature_data TEXT NULL,
    
    absence_reason VARCHAR(500) NULL,
    notes TEXT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (session_slot_id) REFERENCES session_slots(id) ON DELETE CASCADE,
    FOREIGN KEY (participant_id) REFERENCES session_participants(id) ON DELETE CASCADE,
    UNIQUE KEY unique_attendance (session_slot_id, participant_id)
);

-- Table des codes de présence
CREATE TABLE attendance_codes (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    uuid VARCHAR(36) UNIQUE NOT NULL,
    session_slot_id BIGINT NOT NULL,
    period ENUM('morning', 'afternoon') NOT NULL,
    numeric_code VARCHAR(10) NOT NULL,
    qr_code_content VARCHAR(500) NOT NULL,
    valid_from TIMESTAMP NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (session_slot_id) REFERENCES session_slots(id) ON DELETE CASCADE,
    INDEX idx_code (numeric_code),
    INDEX idx_active_period (session_slot_id, period, is_active)
);

-- Table des signatures formateur
CREATE TABLE trainer_signatures (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    uuid VARCHAR(36) UNIQUE NOT NULL,
    session_slot_id BIGINT NOT NULL,
    trainer_id BIGINT NOT NULL,
    signature_data TEXT NULL,  -- Base64 de la signature dessinée
    signed_at TIMESTAMP NOT NULL,
    ip_address VARCHAR(45) NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (session_slot_id) REFERENCES session_slots(id) ON DELETE CASCADE,
    FOREIGN KEY (trainer_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Table des actions workflow
CREATE TABLE session_workflow_actions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    uuid VARCHAR(36) UNIQUE NOT NULL,
    course_session_id BIGINT NOT NULL,
    
    title VARCHAR(255) NOT NULL,
    type ENUM('send_questionnaire', 'send_convocation', 'send_reminder', 
              'generate_certificate', 'send_certificate', 'send_evaluation') NOT NULL,
    target_type ENUM('apprenant', 'formateur', 'entreprise') NOT NULL,
    
    -- Configuration du déclencheur
    trigger_type ENUM('before_session', 'after_session', 'before_slot', 'after_slot', 'manual') NOT NULL,
    trigger_days INT DEFAULT 0,  -- Jours avant/après
    trigger_time TIME NULL,  -- Heure d'exécution
    
    -- Statut
    status ENUM('pending', 'executed', 'not_executed', 'skipped') DEFAULT 'pending',
    scheduled_for TIMESTAMP NULL,
    executed_at TIMESTAMP NULL,
    execution_result JSON NULL,  -- Détails de l'exécution
    
    -- Relations
    questionnaire_ids JSON NULL,  -- Array des UUIDs des questionnaires liés
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (course_session_id) REFERENCES course_sessions(id) ON DELETE CASCADE,
    INDEX idx_session_status (course_session_id, status),
    INDEX idx_scheduled (scheduled_for, status)
);
```

---

## 🔄 Priorité d'Implémentation

| Priorité | Endpoint | Raison |
|----------|----------|--------|
| 🔴 **HAUTE** | GET `/slots/{uuid}/attendance` | Affichage émargement dans le modal |
| 🔴 **HAUTE** | POST `/slots/{uuid}/attendance` | Modification présence par admin |
| 🟠 **MOYENNE** | GET `/slots/{uuid}/attendance-code` | QR Code pour émargement auto |
| 🟠 **MOYENNE** | GET `/{uuid}/workflow-actions` | Timeline déroulement session |
| 🟡 **BASSE** | GET `/{uuid}/statistics` | KPIs du dashboard |
| 🟡 **BASSE** | GET `/attendance/export` | Export PDF émargement |

---

## 📞 Contact

Pour toute question sur les spécifications frontend:
- **Module**: Session Management
- **Fichiers concernés**:
  - `src/components/SessionManagement/SessionDetailsModal.tsx`
  - `src/pages/SessionViewPage.tsx`
  - `src/services/courseSession.ts`

---

*Document généré automatiquement - Frontend Team*

