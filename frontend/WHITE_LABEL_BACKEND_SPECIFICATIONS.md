# Spécifications Backend - Marque Blanche (White Label)

Ce document décrit toutes les APIs nécessaires pour la fonctionnalité de Marque Blanche dans le LMS.

## Table des matières

1. [Identité](#identité)
2. [Bibliothèque](#bibliothèque)
3. [Gestion Des Identifiants](#gestion-des-identifiants)
4. [Formules](#formules)

---

## Identité

### 1.1 Identité Visuelle

#### GET `/api/organization/white-label/settings`
Récupère tous les paramètres de marque blanche de l'organisation.

**Réponse:**
```json
{
  "success": true,
  "data": {
    "organization_id": 1,
    "primary_color": "#007aff",
    "secondary_color": "#6a90b9",
    "accent_color": "#28a745",
    "login_template": "minimal-1",
    "login_banner": "uploads/login_banners/banner.jpg",
    "login_banner_url": "https://domain.com/storage/uploads/login_banners/banner.jpg",
    "logo_square": "uploads/logos/square.png",
    "logo_square_url": "https://domain.com/storage/uploads/logos/square.png",
    "logo_wide": "uploads/logos/wide.png",
    "logo_wide_url": "https://domain.com/storage/uploads/logos/wide.png",
    "custom_domain": "votreorganisation",
    "dns_config": "CNAME: votreorganisation.form.fr -> form.fr",
    "favicon": "uploads/favicons/favicon.ico",
    "favicon_url": "https://domain.com/storage/uploads/favicons/favicon.ico",
    "email_sender": "noreply@votreorganisation.com",
    "email_bcc": "archive@votreorganisation.com",
    "email_api_key": "encrypted_api_key",
    "whitelabel_enabled": true,
    "subscription_plan": "professional"
  }
}
```

#### PUT `/api/organization/white-label/settings`
Met à jour les paramètres de marque blanche.

**Body (JSON):**
```json
{
  "primary_color": "#007aff",
  "secondary_color": "#6a90b9",
  "accent_color": "#28a745",
  "login_template": "minimal-1",
  "custom_domain": "votreorganisation",
  "dns_config": "CNAME: votreorganisation.form.fr -> form.fr",
  "email_sender": "noreply@votreorganisation.com",
  "email_bcc": "archive@votreorganisation.com",
  "email_api_key": "your_api_key_here"
}
```

**Réponse:**
```json
{
  "success": true,
  "message": "Paramètres mis à jour avec succès",
  "data": {
    // Même structure que GET
  }
}
```

#### POST `/api/organization/white-label/upload-asset`
Télécharge un asset (bannière, logo, favicon).

**Body (FormData):**
- `banner` | `logo_square` | `logo_wide` | `favicon`: File
- `type`: string (banner | logo_square | logo_wide | favicon)

**Réponse:**
```json
{
  "success": true,
  "message": "Fichier téléchargé avec succès",
  "data": {
    "file_path": "uploads/login_banners/banner.jpg",
    "file_url": "https://domain.com/storage/uploads/login_banners/banner.jpg"
  }
}
```

**Validations:**
- `banner`: max 5MB, formats: jpg, png, webp
- `logo_square`: max 2MB, formats: png, svg, dimensions recommandées: 64x64px
- `logo_wide`: max 2MB, formats: png, svg, dimensions recommandées: 64x128px
- `favicon`: max 1MB, formats: ico, png, dimensions: 32x32px

#### GET `/api/organization/white-label/login-templates`
Récupère la liste des modèles de connexion disponibles.

**Réponse:**
```json
{
  "success": true,
  "data": [
    {
      "id": "minimal-1",
      "name": "Minimaliste",
      "preview": "/templates/login/minimal-1.png",
      "type": "minimal",
      "description": "Design épuré et moderne"
    },
    {
      "id": "illustrated-1",
      "name": "Avec illustration",
      "preview": "/templates/login/illustrated-1.png",
      "type": "illustrated",
      "description": "Design avec illustrations"
    },
    {
      "id": "background-1",
      "name": "Avec arrière-plan",
      "preview": "/templates/login/background-1.png",
      "type": "background",
      "description": "Design avec image de fond"
    }
  ]
}
```

### 1.2 URL personnalisé

Les endpoints sont les mêmes que dans 1.1, mais avec focus sur:
- `custom_domain`: Sous-domaine personnalisé
- `dns_config`: Configuration DNS nécessaire
- `favicon`: Favicon du site

**Validation DNS:**
- Vérifier que le sous-domaine n'est pas déjà utilisé
- Valider le format du sous-domaine (alphanumérique et tirets uniquement)
- Fournir les instructions DNS si nécessaire

### 1.3 Configuration E-mail

#### POST `/api/organization/white-label/test-email`
Teste la configuration email.

**Body (JSON):**
```json
{
  "email_sender": "noreply@votreorganisation.com",
  "email_api_key": "your_api_key",
  "test_email": "test@example.com"
}
```

**Réponse:**
```json
{
  "success": true,
  "message": "Email de test envoyé avec succès"
}
```

**Intégrations supportées:**
- SendGrid
- Mailgun
- AWS SES
- SMTP standard

### 1.4 Bannières et promotions

#### GET `/api/organization/white-label/banners`
Récupère toutes les bannières promotionnelles.

**Query Parameters:**
- `status`: string (active | inactive | all) - Filtre par statut
- `page`: integer - Numéro de page
- `per_page`: integer - Nombre d'éléments par page

**Réponse:**
```json
{
  "success": true,
  "data": {
    "banners": [
      {
        "id": 1,
        "title": "Promotion Été 2025",
        "description": "Réduction de 20% sur toutes les formations",
        "status": "active",
        "start_date": "2025-06-01",
        "end_date": "2025-08-31",
        "image_url": "https://domain.com/storage/banners/summer.jpg",
        "link_url": "/promotions/ete-2025",
        "created_at": "2025-01-15T10:00:00Z",
        "updated_at": "2025-01-15T10:00:00Z"
      }
    ],
    "pagination": {
      "current_page": 1,
      "per_page": 10,
      "total": 1,
      "last_page": 1
    }
  }
}
```

#### POST `/api/organization/white-label/banners`
Crée une nouvelle bannière.

**Body (FormData ou JSON):**
```json
{
  "title": "Promotion Été 2025",
  "description": "Réduction de 20% sur toutes les formations",
  "start_date": "2025-06-01",
  "end_date": "2025-08-31",
  "image": File, // Optionnel
  "link_url": "/promotions/ete-2025", // Optionnel
  "status": "active"
}
```

**Réponse:**
```json
{
  "success": true,
  "message": "Bannière créée avec succès",
  "data": {
    "id": 1,
    // Même structure que GET
  }
}
```

#### PUT `/api/organization/white-label/banners/{id}`
Met à jour une bannière.

**Body:** Même structure que POST

#### DELETE `/api/organization/white-label/banners/{id}`
Supprime une bannière.

**Réponse:**
```json
{
  "success": true,
  "message": "Bannière supprimée avec succès"
}
```

#### PATCH `/api/organization/white-label/banners/{id}/toggle-status`
Active/désactive une bannière.

**Réponse:**
```json
{
  "success": true,
  "message": "Statut de la bannière mis à jour",
  "data": {
    "id": 1,
    "status": "inactive"
  }
}
```

---

## Bibliothèque

### 2.1 Modèles de Documents

#### GET `/api/organization/white-label/library/templates`
Récupère tous les modèles de la bibliothèque.

**Query Parameters:**
- `type`: string (document | questionnaire | email | all)
- `source`: string (organization | formly | all) - Partie Qualité
- `search`: string - Recherche par titre/description
- `page`: integer
- `per_page`: integer

**Réponse:**
```json
{
  "success": true,
  "data": {
    "templates": [
      {
        "id": 1,
        "name": "Certificat de Réalisation",
        "description": "Modèle de certificat standard",
        "type": "document",
        "source": "formly",
        "category": "certificate",
        "preview_url": "https://domain.com/templates/preview/certificate.jpg",
        "created_at": "2025-01-01T00:00:00Z",
        "updated_at": "2025-01-01T00:00:00Z",
        "is_active": true,
        "usage_count": 45
      }
    ],
    "pagination": {
      "current_page": 1,
      "per_page": 25,
      "total": 25,
      "last_page": 1
    },
    "stats": {
      "documents": 15,
      "questionnaires": 8,
      "emails": 2
    }
  }
}
```

#### GET `/api/organization/white-label/library/templates/{id}`
Récupère les détails d'un modèle.

**Réponse:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Certificat de Réalisation",
    "description": "Modèle de certificat standard",
    "type": "document",
    "source": "formly",
    "content": "<html>...</html>", // HTML du modèle
    "fields": {
      "nom_apprenant": "Nom de l'apprenant",
      "date_formation": "Date de formation",
      // Autres champs de fusion
    },
    "variables": [
      {
        "key": "nom_apprenant",
        "label": "Nom de l'apprenant",
        "type": "text",
        "required": true
      }
    ],
    "preview_url": "https://domain.com/templates/preview/certificate.jpg",
    "created_at": "2025-01-01T00:00:00Z",
    "updated_at": "2025-01-01T00:00:00Z"
  }
}
```

#### POST `/api/organization/white-label/library/templates`
Crée un nouveau modèle.

**Body (FormData ou JSON):**
```json
{
  "name": "Mon Modèle Personnalisé",
  "description": "Description du modèle",
  "type": "document", // document | questionnaire | email
  "category": "certificate", // certificate | contract | questionnaire | evaluation | custom
  "content": "<html>...</html>", // HTML du modèle
  "fields": {
    "nom_apprenant": "Nom de l'apprenant"
  },
  "variables": [
    {
      "key": "nom_apprenant",
      "label": "Nom de l'apprenant",
      "type": "text",
      "required": true
    }
  ],
  "preview_image": File // Optionnel
}
```

**Réponse:**
```json
{
  "success": true,
  "message": "Modèle créé avec succès",
  "data": {
    "id": 1,
    // Même structure que GET
  }
}
```

#### PUT `/api/organization/white-label/library/templates/{id}`
Met à jour un modèle.

**Body:** Même structure que POST

#### DELETE `/api/organization/white-label/library/templates/{id}`
Supprime un modèle (seulement les modèles de l'organisation).

**Réponse:**
```json
{
  "success": true,
  "message": "Modèle supprimé avec succès"
}
```

#### POST `/api/organization/white-label/library/templates/{id}/duplicate`
Duplique un modèle pour modification.

**Réponse:**
```json
{
  "success": true,
  "message": "Modèle dupliqué avec succès",
  "data": {
    "id": 2,
    "name": "Mon Modèle Personnalisé (copie)",
    // Même structure que GET
  }
}
```

#### POST `/api/organization/white-label/library/templates/{id}/preview`
Génère un aperçu du modèle avec des données de test.

**Body (JSON):**
```json
{
  "variables": {
    "nom_apprenant": "Jean Dupont",
    "date_formation": "15 janvier 2025"
  }
}
```

**Réponse:**
```json
{
  "success": true,
  "data": {
    "preview_html": "<html>...</html>",
    "preview_pdf_url": "https://domain.com/templates/preview/123.pdf" // Optionnel
  }
}
```

---

## Gestion Des Identifiants

### 3.1 Formateurs

#### GET `/api/organization/users/trainers`
Récupère la liste des formateurs.

**Query Parameters:**
- `search`: string - Recherche par nom/email
- `status`: string (active | inactive | all)
- `page`: integer
- `per_page`: integer

**Réponse:**
```json
{
  "success": true,
  "data": {
    "trainers": [
      {
        "id": 1,
        "uuid": "uuid-here",
        "name": "Jean Dupont",
        "first_name": "Jean",
        "last_name": "Dupont",
        "email": "jean.dupont@example.com",
        "phone_number": "+33123456789",
        "role": "trainer",
        "status": "active",
        "courses_count": 5,
        "sessions_count": 12,
        "created_at": "2025-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "current_page": 1,
      "per_page": 20,
      "total": 120,
      "last_page": 6
    },
    "stats": {
      "total": 120,
      "active": 115,
      "inactive": 5
    }
  }
}
```

#### POST `/api/organization/users/trainers`
Ajoute un nouveau formateur.

**Body (JSON):**
```json
{
  "first_name": "Jean",
  "last_name": "Dupont",
  "email": "jean.dupont@example.com",
  "phone_number": "+33123456789",
  "password": "secure_password",
  "send_invitation": true // Envoyer un email d'invitation
}
```

**Réponse:**
```json
{
  "success": true,
  "message": "Formateur ajouté avec succès",
  "data": {
    "id": 1,
    // Même structure que GET
  }
}
```

#### PUT `/api/organization/users/trainers/{id}`
Met à jour un formateur.

#### DELETE `/api/organization/users/trainers/{id}`
Supprime un formateur.

#### POST `/api/organization/users/trainers/export`
Exporte la liste des formateurs.

**Query Parameters:**
- `format`: string (csv | excel)
- `filters`: JSON stringifié avec les filtres

**Réponse:** Fichier CSV/Excel

### 3.2 Admin

#### GET `/api/organization/users/admins`
Même structure que Formateurs, mais avec:
- `role`: string (admin | referent_handicap | commercial | etc.)
- `permissions`: object - Permissions spécifiques

### 3.3 Apprenants

#### GET `/api/organization/users/students`
Même structure que Formateurs, mais avec:
- `company_affiliated`: object - Entreprise affiliée
- `courses_enrolled`: array - Formations suivies

### 3.4 Entreprises

#### GET `/api/organization/companies`
Récupère la liste des entreprises.

**Réponse:**
```json
{
  "success": true,
  "data": {
    "companies": [
      {
        "id": 1,
        "uuid": "uuid-here",
        "name": "Entreprise ABC",
        "siret": "12345678901234",
        "siren": "123456789",
        "address": "123 Rue Example",
        "phone_number": "+33123456789",
        "email": "contact@entreprise-abc.com",
        "students_count": 25,
        "courses_count": 8,
        "created_at": "2025-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "current_page": 1,
      "per_page": 20,
      "total": 50,
      "last_page": 3
    }
  }
}
```

### 3.5 Financeurs

#### GET `/api/organization/funders`
Même structure que Entreprises, mais avec des champs spécifiques aux financeurs.

---

## Formules

### 4.1 Plans d'abonnement

#### GET `/api/organization/subscription/current-plan`
Récupère le plan actuel de l'organisation.

**Réponse:**
```json
{
  "success": true,
  "data": {
    "plan_id": 2,
    "plan_name": "Professional",
    "plan_slug": "professional",
    "price": 99.00,
    "currency": "EUR",
    "billing_period": "monthly", // monthly | yearly
    "features": [
      "white_label",
      "custom_domain",
      "unlimited_courses",
      "unlimited_users",
      "advanced_analytics"
    ],
    "limits": {
      "max_users": -1, // -1 = illimité
      "max_courses": -1,
      "max_certificates": -1
    },
    "current_usage": {
      "users_count": 45,
      "courses_count": 12,
      "certificates_count": 8
    },
    "started_at": "2025-01-01T00:00:00Z",
    "expires_at": "2025-02-01T00:00:00Z",
    "auto_renew": true
  }
}
```

#### GET `/api/organization/subscription/available-plans`
Récupère tous les plans disponibles.

**Réponse:**
```json
{
  "success": true,
  "data": {
    "plans": [
      {
        "id": 1,
        "name": "Essentiel",
        "slug": "basic",
        "price": 29.00,
        "currency": "EUR",
        "billing_period": "monthly",
        "features": [
          "basic_features",
          "limited_courses"
        ],
        "limits": {
          "max_users": 10,
          "max_courses": 5,
          "max_certificates": 10
        },
        "popular": false
      },
      {
        "id": 2,
        "name": "Professionnel",
        "slug": "professional",
        "price": 99.00,
        "currency": "EUR",
        "billing_period": "monthly",
        "features": [
          "white_label",
          "custom_domain",
          "unlimited_courses",
          "unlimited_users",
          "advanced_analytics"
        ],
        "limits": {
          "max_users": -1,
          "max_courses": -1,
          "max_certificates": -1
        },
        "popular": true
      },
      {
        "id": 3,
        "name": "Entreprise",
        "slug": "enterprise",
        "price": 299.00,
        "currency": "EUR",
        "billing_period": "monthly",
        "features": [
          "white_label",
          "custom_domain",
          "unlimited_courses",
          "unlimited_users",
          "advanced_analytics",
          "dedicated_support",
          "sla_guarantee"
        ],
        "limits": {
          "max_users": -1,
          "max_courses": -1,
          "max_certificates": -1
        },
        "popular": false
      }
    ]
  }
}
```

#### POST `/api/organization/subscription/upgrade`
Met à niveau le plan d'abonnement.

**Body (JSON):**
```json
{
  "plan_id": 2,
  "billing_period": "monthly", // monthly | yearly
  "payment_method": "card", // card | bank_transfer
  "card_token": "token_here" // Si payment_method = card
}
```

**Réponse:**
```json
{
  "success": true,
  "message": "Plan mis à niveau avec succès",
  "data": {
    "subscription_id": 123,
    "plan": {
      // Même structure que current-plan
    },
    "next_billing_date": "2025-02-01T00:00:00Z"
  }
}
```

#### POST `/api/organization/subscription/cancel`
Annule l'abonnement (continue jusqu'à la fin de la période payée).

**Réponse:**
```json
{
  "success": true,
  "message": "Abonnement annulé. Il restera actif jusqu'au 2025-02-01",
  "data": {
    "expires_at": "2025-02-01T00:00:00Z",
    "auto_renew": false
  }
}
```

#### GET `/api/organization/subscription/invoices`
Récupère l'historique des factures.

**Query Parameters:**
- `page`: integer
- `per_page`: integer

**Réponse:**
```json
{
  "success": true,
  "data": {
    "invoices": [
      {
        "id": 1,
        "invoice_number": "INV-2025-001",
        "plan_name": "Professional",
        "amount": 99.00,
        "currency": "EUR",
        "status": "paid", // paid | pending | failed
        "issued_at": "2025-01-01T00:00:00Z",
        "paid_at": "2025-01-01T00:00:00Z",
        "pdf_url": "https://domain.com/invoices/INV-2025-001.pdf"
      }
    ],
    "pagination": {
      "current_page": 1,
      "per_page": 10,
      "total": 5,
      "last_page": 1
    }
  }
}
```

---

## Notes importantes

### Authentification
Toutes les routes nécessitent une authentification via Bearer Token:
```
Authorization: Bearer {token}
```

### Gestion des erreurs
Toutes les erreurs suivent ce format:
```json
{
  "success": false,
  "message": "Message d'erreur",
  "errors": {
    "field_name": ["Message de validation"]
  }
}
```

### Codes HTTP
- `200`: Succès
- `201`: Créé avec succès
- `400`: Erreur de validation
- `401`: Non authentifié
- `403`: Non autorisé
- `404`: Non trouvé
- `422`: Erreur de validation (données)
- `500`: Erreur serveur

### Pagination
Toutes les listes paginées utilisent:
- `page`: Numéro de page (commence à 1)
- `per_page`: Nombre d'éléments par page (défaut: 20, max: 100)

### Fichiers
- Tous les uploads de fichiers doivent être validés côté serveur
- Formats acceptés: jpg, png, webp, svg, ico, pdf
- Taille maximale: 10MB par défaut (peut varier selon le type)
- Stockage: Utiliser Laravel Storage avec lien symbolique

### Variables de fusion
Les modèles de documents/questionnaires/emails supportent des variables de fusion:
- `{nom_apprenant}`: Nom de l'apprenant
- `{prenom_apprenant}`: Prénom de l'apprenant
- `{nom_formation}`: Nom de la formation
- `{date_formation}`: Date de formation
- `{nom_organisation}`: Nom de l'organisation
- Etc.

Le backend doit remplacer ces variables lors de la génération des documents.

---

## Exemples d'utilisation

### Créer un modèle de document
```bash
POST /api/organization/white-label/library/templates
Content-Type: application/json

{
  "name": "Certificat Personnalisé",
  "type": "document",
  "category": "certificate",
  "content": "<html><body><h1>Certificat pour {nom_apprenant}</h1></body></html>",
  "variables": [
    {
      "key": "nom_apprenant",
      "label": "Nom de l'apprenant",
      "type": "text",
      "required": true
    }
  ]
}
```

### Mettre à jour les couleurs
```bash
PUT /api/organization/white-label/settings
Content-Type: application/json

{
  "primary_color": "#FF5733",
  "secondary_color": "#33C3F0",
  "accent_color": "#33FF57"
}
```

### Créer une bannière promotionnelle
```bash
POST /api/organization/white-label/banners
Content-Type: multipart/form-data

title: Promotion Été 2025
description: Réduction de 20%
start_date: 2025-06-01
end_date: 2025-08-31
status: active
image: [file]
```

---

## Base de données

### Table: `white_label_settings`
```sql
CREATE TABLE white_label_settings (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    organization_id BIGINT NOT NULL,
    primary_color VARCHAR(7) DEFAULT '#007aff',
    secondary_color VARCHAR(7) DEFAULT '#6a90b9',
    accent_color VARCHAR(7) DEFAULT '#28a745',
    login_template VARCHAR(50),
    login_banner VARCHAR(255),
    logo_square VARCHAR(255),
    logo_wide VARCHAR(255),
    custom_domain VARCHAR(100),
    dns_config TEXT,
    favicon VARCHAR(255),
    email_sender VARCHAR(255),
    email_bcc VARCHAR(255),
    email_api_key TEXT,
    whitelabel_enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
);
```

### Table: `promotional_banners`
```sql
CREATE TABLE promotional_banners (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    organization_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    image_path VARCHAR(255),
    link_url VARCHAR(255),
    status ENUM('active', 'inactive') DEFAULT 'active',
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
);
```

### Table: `library_templates`
```sql
CREATE TABLE library_templates (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    organization_id BIGINT NULL, -- NULL = template Formly
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type ENUM('document', 'questionnaire', 'email') NOT NULL,
    category VARCHAR(50),
    content LONGTEXT, -- HTML content
    fields JSON, -- Champs de fusion
    variables JSON, -- Variables disponibles
    preview_image VARCHAR(255),
    source ENUM('organization', 'formly') DEFAULT 'organization',
    is_active BOOLEAN DEFAULT true,
    usage_count INT DEFAULT 0,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
);
```

---

## Sécurité

1. **Validation stricte** de tous les inputs
2. **Sanitization** du HTML dans les modèles
3. **Chiffrement** des clés API email
4. **Rate limiting** sur les endpoints sensibles
5. **Vérification des permissions** pour chaque action
6. **Validation des fichiers** uploadés (type, taille, contenu)

---

## Tests recommandés

1. Tests unitaires pour chaque endpoint
2. Tests d'intégration pour les flux complets
3. Tests de validation des fichiers uploadés
4. Tests de sécurité (XSS, CSRF, injection SQL)
5. Tests de performance pour les listes paginées

