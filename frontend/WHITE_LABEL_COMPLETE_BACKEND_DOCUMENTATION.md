# Documentation Complète Backend - White Label Management

## Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture des données](#architecture-des-données)
3. [API Endpoints](#api-endpoints)
4. [Gestion des modèles d'email](#gestion-des-modèles-demail)
5. [Gestion des bannières promotionnelles](#gestion-des-bannières-promotionnelles)
6. [Gestion des plans d'abonnement](#gestion-des-plans-dabonnement)
7. [Intégration Stripe](#intégration-stripe)
8. [Variables dynamiques](#variables-dynamiques)
9. [Sécurité et validation](#sécurité-et-validation)
10. [Exemples d'implémentation](#exemples-dimplémentation)

---

## Vue d'ensemble

Cette documentation décrit l'implémentation complète du système de White Label pour la plateforme LMS. Le système permet aux organisations de personnaliser leur identité visuelle, gérer leurs modèles de documents/questionnaires/emails, créer des bannières promotionnelles, et gérer leurs abonnements.

### Fonctionnalités principales

- **Identité visuelle** : Couleurs, logos, favicon, domaine personnalisé
- **Bibliothèque** : Documents, questionnaires, modèles d'email
- **Bannières promotionnelles** : Affichage dans le dashboard des apprenants
- **Gestion des plans** : Abonnements avec intégration Stripe
- **Modèles d'email** : Création et utilisation d'emails préfaits avec variables dynamiques

---

## Architecture des données

### Tables de base de données

#### Table: `white_label_settings`
```sql
CREATE TABLE white_label_settings (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    organization_id BIGINT NOT NULL UNIQUE,
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    INDEX idx_organization_id (organization_id),
    INDEX idx_custom_domain (custom_domain)
);
```

#### Table: `promotional_banners`
```sql
CREATE TABLE promotional_banners (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    organization_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    image_path VARCHAR(255),
    link_url VARCHAR(255),
    status ENUM('active', 'inactive') DEFAULT 'active',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    INDEX idx_organization_id (organization_id),
    INDEX idx_status (status),
    INDEX idx_dates (start_date, end_date),
    INDEX idx_active_banners (organization_id, status, start_date, end_date)
);
```

#### Table: `library_templates`
```sql
CREATE TABLE library_templates (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    organization_id BIGINT NULL, -- NULL = template Formly (système)
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type ENUM('document', 'questionnaire', 'email') NOT NULL,
    category VARCHAR(50),
    
    -- Pour les documents/questionnaires
    content LONGTEXT, -- HTML content
    fields JSON, -- Champs de fusion
    variables JSON, -- Variables disponibles
    
    -- Pour les modèles d'email
    subject VARCHAR(500), -- Objet de l'email
    from_email VARCHAR(255), -- Email expéditeur
    from_name VARCHAR(255), -- Nom expéditeur
    cc VARCHAR(255), -- Copie carbone
    bcc VARCHAR(255), -- Copie cachée
    body LONGTEXT, -- Corps HTML de l'email
    
    preview_image VARCHAR(255),
    source ENUM('organization', 'formly') DEFAULT 'organization',
    is_active BOOLEAN DEFAULT true,
    usage_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    INDEX idx_organization_id (organization_id),
    INDEX idx_type (type),
    INDEX idx_source (source),
    INDEX idx_active (is_active)
);
```

#### Table: `subscription_plans`
```sql
CREATE TABLE subscription_plans (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'EUR',
    billing_period ENUM('monthly', 'yearly') DEFAULT 'monthly',
    features JSON, -- Liste des fonctionnalités
    limits JSON, -- {max_users: int, max_courses: int, max_certificates: int}
    popular BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_slug (slug),
    INDEX idx_active (is_active)
);
```

#### Table: `organization_subscriptions`
```sql
CREATE TABLE organization_subscriptions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    organization_id BIGINT NOT NULL UNIQUE,
    plan_id BIGINT NOT NULL,
    stripe_subscription_id VARCHAR(255),
    stripe_customer_id VARCHAR(255),
    status ENUM('active', 'canceled', 'past_due', 'trialing') DEFAULT 'active',
    started_at TIMESTAMP NOT NULL,
    expires_at TIMESTAMP,
    auto_renew BOOLEAN DEFAULT true,
    current_usage JSON, -- {users_count: int, courses_count: int, certificates_count: int}
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (plan_id) REFERENCES subscription_plans(id),
    INDEX idx_organization_id (organization_id),
    INDEX idx_status (status),
    INDEX idx_expires_at (expires_at)
);
```

---

## API Endpoints

### Base URL
Tous les endpoints sont préfixés par `/api/organization/white-label/` ou `/api/organization/subscription/`

### Authentification
Tous les endpoints nécessitent un token Bearer dans le header `Authorization`.

---

## Gestion des modèles d'email

### 1. Créer un modèle d'email

**Endpoint:** `POST /api/organization/white-label/library/templates`

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Body:**
```json
{
  "name": "Confirmation d'inscription",
  "description": "Email envoyé lors de l'inscription à une formation",
  "type": "email",
  "subject": "Confirmation de votre inscription à {intitule_session}",
  "from_email": "noreply@monorganisation.com",
  "from_name": "Mon Organisation",
  "cc": null,
  "bcc": "archive@monorganisation.com",
  "body": "<html><body><h1>Bonjour {prenom_destinataire} {nom_destinataire},</h1><p>Votre inscription à la formation {intitule_session} a été confirmée.</p><p>Date de début: {date_debut}</p><p>Cordialement,<br>{nom_organisation}</p></body></html>",
  "variables": [
    "prenom_destinataire",
    "nom_destinataire",
    "intitule_session",
    "date_debut",
    "nom_organisation"
  ]
}
```

**Réponse (201 Created):**
```json
{
  "success": true,
  "message": "Modèle d'email créé avec succès",
  "data": {
    "id": 1,
    "name": "Confirmation d'inscription",
    "type": "email",
    "subject": "Confirmation de votre inscription à {intitule_session}",
    "from_email": "noreply@monorganisation.com",
    "from_name": "Mon Organisation",
    "body": "<html>...",
    "variables": ["prenom_destinataire", "nom_destinataire", ...],
    "created_at": "2025-01-15T10:30:00Z",
    "updated_at": "2025-01-15T10:30:00Z"
  }
}
```

**Validation:**
- `name`: Requis, max 255 caractères
- `type`: Doit être "email"
- `subject`: Requis, max 500 caractères
- `from_email`: Requis, format email valide
- `from_name`: Requis, max 255 caractères
- `body`: Requis, HTML valide
- `variables`: Array de strings, optionnel

### 2. Lister les modèles d'email

**Endpoint:** `GET /api/organization/white-label/library/templates?type=email`

**Query Parameters:**
- `type`: "email" (requis pour filtrer les emails)
- `page`: Numéro de page (défaut: 1)
- `per_page`: Éléments par page (défaut: 20, max: 100)
- `search`: Recherche par nom/description/subject

**Réponse (200 OK):**
```json
{
  "success": true,
  "data": {
    "templates": [
      {
        "id": 1,
        "name": "Confirmation d'inscription",
        "description": "Email envoyé lors de l'inscription",
        "type": "email",
        "subject": "Confirmation de votre inscription à {intitule_session}",
        "from_email": "noreply@monorganisation.com",
        "from_name": "Mon Organisation",
        "created_at": "2025-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "current_page": 1,
      "per_page": 20,
      "total": 1,
      "total_pages": 1
    }
  }
}
```

### 3. Récupérer un modèle d'email

**Endpoint:** `GET /api/organization/white-label/library/templates/{id}`

**Réponse (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Confirmation d'inscription",
    "description": "Email envoyé lors de l'inscription à une formation",
    "type": "email",
    "subject": "Confirmation de votre inscription à {intitule_session}",
    "from_email": "noreply@monorganisation.com",
    "from_name": "Mon Organisation",
    "cc": null,
    "bcc": "archive@monorganisation.com",
    "body": "<html><body>...</body></html>",
    "variables": ["prenom_destinataire", "nom_destinataire", ...],
    "created_at": "2025-01-15T10:30:00Z",
    "updated_at": "2025-01-15T10:30:00Z"
  }
}
```

### 4. Mettre à jour un modèle d'email

**Endpoint:** `PUT /api/organization/white-label/library/templates/{id}`

**Body:** Identique à la création

**Réponse (200 OK):**
```json
{
  "success": true,
  "message": "Modèle d'email mis à jour avec succès",
  "data": {
    "id": 1,
    ...
  }
}
```

### 5. Supprimer un modèle d'email

**Endpoint:** `DELETE /api/organization/white-label/library/templates/{id}`

**Réponse (200 OK):**
```json
{
  "success": true,
  "message": "Modèle d'email supprimé avec succès"
}
```

### 6. Utiliser un modèle d'email (envoyer un email)

**Endpoint:** `POST /api/organization/white-label/library/templates/{id}/send`

**Body:**
```json
{
  "to": "apprenant@example.com",
  "to_name": "Jean Dupont",
  "variables": {
    "prenom_destinataire": "Jean",
    "nom_destinataire": "Dupont",
    "intitule_session": "Formation Excel Avancé",
    "date_debut": "15 janvier 2025",
    "nom_organisation": "Mon Organisation"
  },
  "attachments": [] // Optionnel: array de fichiers
}
```

**Réponse (200 OK):**
```json
{
  "success": true,
  "message": "Email envoyé avec succès",
  "data": {
    "email_id": "msg_123456",
    "sent_at": "2025-01-15T10:35:00Z"
  }
}
```

---

## Gestion des bannières promotionnelles

### 1. Créer une bannière

**Endpoint:** `POST /api/organization/white-label/banners`

**Headers:**
```
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Body (FormData):**
```
title: Promotion Été 2025
description: Réduction de 20% sur toutes les formations
start_date: 2025-06-01
end_date: 2025-08-31
status: active
link_url: /promotions/ete-2025
image: [file]
```

**Réponse (201 Created):**
```json
{
  "success": true,
  "message": "Bannière créée avec succès",
  "data": {
    "id": 1,
    "title": "Promotion Été 2025",
    "description": "Réduction de 20% sur toutes les formations",
    "image_path": "uploads/banners/1234567890-banner.jpg",
    "image_url": "https://example.com/uploads/banners/1234567890-banner.jpg",
    "link_url": "/promotions/ete-2025",
    "status": "active",
    "start_date": "2025-06-01",
    "end_date": "2025-08-31",
    "created_at": "2025-01-15T10:30:00Z"
  }
}
```

**Validation:**
- `title`: Requis, max 255 caractères
- `start_date`: Requis, format date (YYYY-MM-DD)
- `end_date`: Requis, format date (YYYY-MM-DD), doit être après start_date
- `status`: "active" ou "inactive"
- `image`: Optionnel, formats: jpg, png, webp, max 5MB

### 2. Lister les bannières actives (pour dashboard apprenants)

**Endpoint:** `GET /api/organization/white-label/banners/active`

**Query Parameters:**
- `organization_id`: ID de l'organisation (pour les apprenants, récupéré automatiquement)

**Réponse (200 OK):**
```json
{
  "success": true,
  "data": {
    "banners": [
      {
        "id": 1,
        "title": "Promotion Été 2025",
        "description": "Réduction de 20% sur toutes les formations",
        "image_url": "https://example.com/uploads/banners/1234567890-banner.jpg",
        "link_url": "/promotions/ete-2025",
        "start_date": "2025-06-01",
        "end_date": "2025-08-31"
      }
    ]
  }
}
```

**Logique backend:**
- Filtrer par `organization_id`
- Filtrer par `status = 'active'`
- Filtrer par date: `start_date <= NOW() AND end_date >= NOW()`
- Trier par `created_at DESC`

### 3. Lister toutes les bannières (admin)

**Endpoint:** `GET /api/organization/white-label/banners`

**Query Parameters:**
- `page`: Numéro de page
- `per_page`: Éléments par page
- `status`: Filtrer par statut

**Réponse (200 OK):**
```json
{
  "success": true,
  "data": {
    "banners": [...],
    "pagination": {...}
  }
}
```

### 4. Mettre à jour une bannière

**Endpoint:** `PUT /api/organization/white-label/banners/{id}`

**Body:** Identique à la création (FormData)

**Réponse (200 OK):**
```json
{
  "success": true,
  "message": "Bannière mise à jour avec succès",
  "data": {...}
}
```

### 5. Supprimer une bannière

**Endpoint:** `DELETE /api/organization/white-label/banners/{id}`

**Réponse (200 OK):**
```json
{
  "success": true,
  "message": "Bannière supprimée avec succès"
}
```

### 6. Toggle le statut d'une bannière

**Endpoint:** `PATCH /api/organization/white-label/banners/{id}/toggle-status`

**Réponse (200 OK):**
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

## Gestion des plans d'abonnement

### 1. Récupérer le plan actuel

**Endpoint:** `GET /api/organization/subscription/current-plan`

**Réponse (200 OK):**
```json
{
  "success": true,
  "data": {
    "plan_id": 2,
    "plan_name": "Plan Pro",
    "plan_slug": "pro",
    "price": 99.00,
    "currency": "EUR",
    "billing_period": "monthly",
    "features": [
      "Formations illimitées",
      "Jusqu'à 50 utilisateurs",
      "Support prioritaire",
      "Certificats personnalisés"
    ],
    "limits": {
      "max_users": 50,
      "max_courses": -1,
      "max_certificates": -1
    },
    "current_usage": {
      "users_count": 23,
      "courses_count": 45,
      "certificates_count": 120
    },
    "started_at": "2025-01-01T00:00:00Z",
    "expires_at": "2026-01-01T00:00:00Z",
    "auto_renew": true,
    "status": "active"
  }
}
```

### 2. Lister les plans disponibles

**Endpoint:** `GET /api/organization/subscription/available-plans`

**Réponse (200 OK):**
```json
{
  "success": true,
  "data": {
    "plans": [
      {
        "id": 1,
        "name": "Plan Basic",
        "slug": "basic",
        "description": "Parfait pour débuter",
        "price": 29.00,
        "currency": "EUR",
        "billing_period": "monthly",
        "features": [
          "Jusqu'à 10 utilisateurs",
          "Jusqu'à 20 formations",
          "Support email"
        ],
        "limits": {
          "max_users": 10,
          "max_courses": 20,
          "max_certificates": 50
        },
        "popular": false
      },
      {
        "id": 2,
        "name": "Plan Pro",
        "slug": "pro",
        "description": "Pour les organisations en croissance",
        "price": 99.00,
        "currency": "EUR",
        "billing_period": "monthly",
        "features": [
          "Jusqu'à 50 utilisateurs",
          "Formations illimitées",
          "Support prioritaire",
          "Certificats personnalisés"
        ],
        "limits": {
          "max_users": 50,
          "max_courses": -1,
          "max_certificates": -1
        },
        "popular": true
      },
      {
        "id": 3,
        "name": "Plan Enterprise",
        "slug": "enterprise",
        "description": "Solution complète pour grandes organisations",
        "price": 299.00,
        "currency": "EUR",
        "billing_period": "monthly",
        "features": [
          "Utilisateurs illimités",
          "Formations illimitées",
          "Support 24/7",
          "API personnalisée",
          "White label complet"
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

### 3. Upgrader vers un plan

**Endpoint:** `POST /api/organization/subscription/upgrade`

**Body:**
```json
{
  "plan_id": 3,
  "billing_period": "monthly"
}
```

**Réponse (200 OK):**
```json
{
  "success": true,
  "message": "Redirection vers le paiement",
  "data": {
    "checkout_url": "https://checkout.stripe.com/pay/cs_test_..."
  }
}
```

**Logique backend:**
1. Vérifier que le plan existe et est actif
2. Vérifier que l'organisation peut upgrader (pas de downgrade immédiat)
3. Créer une session Stripe Checkout
4. Retourner l'URL de checkout

### 4. Webhook Stripe (gestion des paiements)

**Endpoint:** `POST /api/webhooks/stripe`

**Headers:**
```
Stripe-Signature: {signature}
```

**Body:** Événement Stripe (JSON)

**Événements à gérer:**
- `checkout.session.completed`: Mettre à jour l'abonnement
- `customer.subscription.updated`: Mettre à jour l'abonnement
- `customer.subscription.deleted`: Annuler l'abonnement
- `invoice.payment_succeeded`: Confirmer le paiement
- `invoice.payment_failed`: Marquer comme "past_due"

---

## Intégration Stripe

### Configuration

**Variables d'environnement:**
```env
STRIPE_KEY=pk_test_...
STRIPE_SECRET=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Créer une session de checkout

**Exemple PHP (Laravel):**
```php
use Stripe\Stripe;
use Stripe\Checkout\Session;

Stripe::setApiKey(config('services.stripe.secret'));

$session = Session::create([
    'customer_email' => $organization->email,
    'payment_method_types' => ['card'],
    'line_items' => [[
        'price_data' => [
            'currency' => $plan->currency,
            'product_data' => [
                'name' => $plan->name,
            ],
            'unit_amount' => $plan->price * 100, // Convertir en centimes
            'recurring' => [
                'interval' => $billingPeriod === 'monthly' ? 'month' : 'year',
            ],
        ],
        'quantity' => 1,
    ]],
    'mode' => 'subscription',
    'success_url' => url('/white-label/formules?success=true'),
    'cancel_url' => url('/white-label/formules?canceled=true'),
    'metadata' => [
        'organization_id' => $organization->id,
        'plan_id' => $plan->id,
    ],
]);

return response()->json([
    'success' => true,
    'data' => [
        'checkout_url' => $session->url,
    ],
]);
```

### Gérer le webhook Stripe

**Exemple PHP (Laravel):**
```php
use Stripe\Webhook;
use Stripe\Exception\SignatureVerificationException;

$payload = @file_get_contents('php://input');
$sig_header = $_SERVER['HTTP_STRIPE_SIGNATURE'];

try {
    $event = Webhook::constructEvent(
        $payload,
        $sig_header,
        config('services.stripe.webhook_secret')
    );
} catch (SignatureVerificationException $e) {
    return response()->json(['error' => 'Invalid signature'], 400);
}

switch ($event->type) {
    case 'checkout.session.completed':
        $session = $event->data->object;
        // Mettre à jour l'abonnement de l'organisation
        $this->updateSubscription($session->metadata->organization_id, $session->metadata->plan_id);
        break;
    
    case 'customer.subscription.updated':
        $subscription = $event->data->object;
        // Mettre à jour le statut de l'abonnement
        $this->syncSubscription($subscription);
        break;
    
    // ... autres événements
}

return response()->json(['received' => true]);
```

---

## Variables dynamiques

### Variables disponibles pour les modèles d'email

#### Organisation
- `{nom_organisation}`: Nom de l'organisation
- `{email_organisation}`: Email de l'organisation
- `{telephone_organisation}`: Téléphone de l'organisation
- `{adresse_organisation}`: Adresse complète de l'organisation

#### Apprenant/Destinataire
- `{prenom_destinataire}`: Prénom du destinataire
- `{nom_destinataire}`: Nom du destinataire
- `{email_destinataire}`: Email du destinataire
- `{telephone_destinataire}`: Téléphone du destinataire

#### Formation/Session
- `{intitule_session}`: Intitulé de la session
- `{nom_formation}`: Nom de la formation
- `{description_formation}`: Description de la formation

#### Dates
- `{date_debut}`: Date de début (format: "15 janvier 2025")
- `{date_fin}`: Date de fin
- `{date_inscription}`: Date d'inscription

### Remplacement des variables

**Exemple PHP:**
```php
function replaceEmailVariables($template, $variables) {
    $subject = $template->subject;
    $body = $template->body;
    
    foreach ($variables as $key => $value) {
        $placeholder = '{' . $key . '}';
        $subject = str_replace($placeholder, $value, $subject);
        $body = str_replace($placeholder, $value, $body);
        
        // Remplacer aussi dans les badges HTML
        $body = preg_replace(
            '/<span[^>]*data-variable="' . preg_quote($key, '/') . '"[^>]*>.*?<\/span>/',
            htmlspecialchars($value),
            $body
        );
    }
    
    return [
        'subject' => $subject,
        'body' => $body,
    ];
}
```

---

## Sécurité et validation

### Validation des données

**Règles de validation Laravel:**
```php
// Modèle d'email
[
    'name' => 'required|string|max:255',
    'type' => 'required|in:email',
    'subject' => 'required|string|max:500',
    'from_email' => 'required|email|max:255',
    'from_name' => 'required|string|max:255',
    'cc' => 'nullable|email|max:255',
    'bcc' => 'nullable|email|max:255',
    'body' => 'required|string',
    'variables' => 'nullable|array',
    'variables.*' => 'string|max:100',
]

// Bannière
[
    'title' => 'required|string|max:255',
    'description' => 'nullable|string',
    'start_date' => 'required|date|after_or_equal:today',
    'end_date' => 'required|date|after:start_date',
    'status' => 'required|in:active,inactive',
    'link_url' => 'nullable|string|max:255',
    'image' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:5120',
]

// Upgrade plan
[
    'plan_id' => 'required|exists:subscription_plans,id',
    'billing_period' => 'required|in:monthly,yearly',
]
```

### Autorisations

- Seuls les administrateurs de l'organisation peuvent gérer les modèles d'email
- Seuls les administrateurs peuvent créer/modifier/supprimer des bannières
- Les apprenants peuvent uniquement voir les bannières actives
- Seuls les administrateurs peuvent upgrader les plans

### Protection CSRF

Tous les endpoints POST/PUT/DELETE nécessitent un token CSRF valide.

---

## Exemples d'implémentation

### Exemple complet: Créer et envoyer un email

```php
// 1. Créer le modèle
$template = LibraryTemplate::create([
    'organization_id' => auth()->user()->organization_id,
    'name' => 'Confirmation d\'inscription',
    'type' => 'email',
    'subject' => 'Confirmation de votre inscription à {intitule_session}',
    'from_email' => 'noreply@monorganisation.com',
    'from_name' => 'Mon Organisation',
    'body' => '<html><body>...</body></html>',
    'variables' => json_encode(['prenom_destinataire', 'nom_destinataire', 'intitule_session']),
]);

// 2. Utiliser le modèle pour envoyer un email
$variables = [
    'prenom_destinataire' => 'Jean',
    'nom_destinataire' => 'Dupont',
    'intitule_session' => 'Formation Excel Avancé',
];

$replaced = replaceEmailVariables($template, $variables);

Mail::send([], [], function ($message) use ($template, $replaced, $student) {
    $message->to($student->email, $student->name)
        ->subject($replaced['subject'])
        ->from($template->from_email, $template->from_name)
        ->html($replaced['body']);
    
    if ($template->cc) {
        $message->cc($template->cc);
    }
    if ($template->bcc) {
        $message->bcc($template->bcc);
    }
});
```

### Exemple: Récupérer les bannières actives pour le dashboard

```php
public function getActiveBanners($organizationId) {
    return PromotionalBanner::where('organization_id', $organizationId)
        ->where('status', 'active')
        ->where('start_date', '<=', now())
        ->where('end_date', '>=', now())
        ->orderBy('created_at', 'desc')
        ->get()
        ->map(function ($banner) {
            return [
                'id' => $banner->id,
                'title' => $banner->title,
                'description' => $banner->description,
                'image_url' => asset('storage/' . $banner->image_path),
                'link_url' => $banner->link_url,
                'start_date' => $banner->start_date,
                'end_date' => $banner->end_date,
            ];
        });
}
```

---

## Notes importantes

1. **Stockage des fichiers**: Utiliser Laravel Storage avec lien symbolique pour les images
2. **Cache**: Mettre en cache les bannières actives (TTL: 5 minutes)
3. **Rate limiting**: Limiter les appels API (ex: 100 requêtes/minute)
4. **Logs**: Logger toutes les actions importantes (création, modification, suppression)
5. **Backup**: Sauvegarder régulièrement les modèles et bannières

---

## Support

Pour toute question ou problème, contacter l'équipe backend.

