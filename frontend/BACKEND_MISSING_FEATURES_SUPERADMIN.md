# Fonctionnalités Backend Manquantes - Super Admin Dashboard

Ce document liste toutes les fonctionnalités implémentées dans le frontend Super Admin qui nécessitent des endpoints backend ou des améliorations.

## 📋 Table des matières

1. [Organizations](#organizations)
2. [Plans](#plans)
3. [Subscriptions](#subscriptions)
4. [Instances](#instances)
5. [Coupons](#coupons)
6. [Audit Logs](#audit-logs)
7. [Roles & Permissions](#roles--permissions)
8. [Payment Gateways](#payment-gateways)
9. [SMTP Settings](#smtp-settings)
10. [Subdomain Management](#subdomain-management)

---

## Organizations

### ✅ Endpoints Implémentés (Frontend)
- `GET /api/superadmin/organizations` - Liste des organisations
- `GET /api/superadmin/organizations/{id}` - Détails d'une organisation
- `POST /api/superadmin/organizations` - Créer une organisation
- `PUT /api/superadmin/organizations/{id}` - Mettre à jour une organisation
- `DELETE /api/superadmin/organizations/{id}` - Supprimer une organisation
- `POST /api/superadmin/organizations/{id}/suspend` - Suspendre une organisation
- `POST /api/superadmin/organizations/{id}/activate` - Activer une organisation

### ⚠️ Fonctionnalités Manquantes ou à Vérifier

1. **Gestion des sous-domaines**
   - Endpoint pour lister les sous-domaines d'une organisation
   - Endpoint pour ajouter/modifier/supprimer un sous-domaine
   - Endpoint pour tester la configuration DNS d'un sous-domaine
   - Endpoint pour gérer les domaines personnalisés (custom domains)

2. **Champs manquants dans le formulaire**
   - Le formulaire frontend inclut des champs qui doivent être supportés par le backend :
     - `address`, `city`, `zip_code`, `country` (adresse complète)
     - `plan_id` (assignation de plan lors de la création)
     - `user_id` (assignation d'un utilisateur administrateur)

3. **Filtres avancés**
   - Filtrage par plan (`plan_id`)
   - Tri par différents champs (`sort_by`, `sort_order`)
   - Recherche textuelle (`search`)

---

## Plans

### ✅ Endpoints Implémentés (Frontend)
- `GET /api/superadmin/plans` - Liste des plans
- `GET /api/superadmin/plans/{id}` - Détails d'un plan
- `POST /api/superadmin/plans` - Créer un plan
- `PUT /api/superadmin/plans/{id}` - Mettre à jour un plan
- `DELETE /api/superadmin/plans/{id}` - Supprimer un plan
- `POST /api/superadmin/plans/{id}/clone` - Cloner un plan

### ⚠️ Fonctionnalités Manquantes ou à Vérifier

1. **Champs du plan**
   - Tous les champs du formulaire doivent être supportés :
     - `slug` (génération automatique si non fourni)
     - `description`
     - `max_video_minutes`, `max_compute_hours`, `max_bandwidth_gb`
     - `sla_level` (enum: basic, standard, premium, enterprise)
     - `backup_retention_days`
     - `ssl_included`, `support_included` (booleans)
     - `support_level` (enum: email, chat, phone, priority)
     - `is_active`, `is_featured` (booleans)

2. **Validation**
   - Validation que `slug` est unique
   - Validation que les prix sont positifs
   - Validation que les limites sont cohérentes

---

## Subscriptions

### ✅ Endpoints Implémentés (Frontend)
- `GET /api/superadmin/subscriptions` - Liste des abonnements
- `GET /api/superadmin/subscriptions/{id}` - Détails d'un abonnement
- `POST /api/superadmin/subscriptions` - Créer un abonnement
- `PUT /api/superadmin/subscriptions/{id}` - Mettre à jour un abonnement
- `POST /api/superadmin/subscriptions/{id}/upgrade` - Upgrader un abonnement
- `POST /api/superadmin/subscriptions/{id}/downgrade` - Downgrader un abonnement
- `POST /api/superadmin/subscriptions/{id}/cancel` - Annuler un abonnement

### ⚠️ Fonctionnalités Manquantes ou à Vérifier

1. **Modal de création/édition**
   - Le frontend nécessite un modal complet pour créer/éditer les abonnements
   - Champs requis :
     - `organization_id` (sélection d'organisation)
     - `plan_id` (sélection de plan)
     - `billing_cycle` (monthly, yearly)
     - `status` (active, cancelled, expired, etc.)
     - `current_period_start`, `current_period_end` (dates)
     - `cancel_at_period_end` (boolean)

2. **Logique métier**
   - Calcul automatique des dates de période selon le billing cycle
   - Gestion des transitions de statut
   - Calcul automatique du prix selon le plan et le billing cycle

---

## Instances

### ✅ Endpoints Implémentés (Frontend)
- `GET /api/superadmin/instances` - Liste des instances
- `GET /api/superadmin/instances/{id}` - Détails d'une instance
- `POST /api/superadmin/instances` - Créer une instance
- `PUT /api/superadmin/instances/{id}` - Mettre à jour une instance
- `DELETE /api/superadmin/instances/{id}` - Supprimer une instance
- `POST /api/superadmin/instances/{id}/provision` - Provisionner une instance
- `POST /api/superadmin/instances/{id}/snapshot` - Créer un snapshot
- `POST /api/superadmin/instances/{id}/restore` - Restaurer depuis un snapshot
- `POST /api/superadmin/instances/{id}/restart` - Redémarrer une instance
- `POST /api/superadmin/instances/{id}/suspend` - Suspendre une instance
- `POST /api/superadmin/instances/{id}/resume` - Reprendre une instance

### ⚠️ Fonctionnalités Manquantes ou à Vérifier

1. **Modal de création/édition**
   - Le frontend nécessite un modal complet pour créer/éditer les instances
   - Champs requis :
     - `organization_id` (sélection d'organisation)
     - `region` (sélection de région AWS/Cloud)
     - `instance_type` (t2.micro, t2.small, etc.)
     - `status` (provisioning, active, suspended, error)
     - `health_status` (healthy, warning, critical)

2. **Intégration Cloud**
   - Les endpoints de provision/snapshot/restart doivent intégrer avec AWS/Cloud provider
   - Gestion des erreurs de provisionnement
   - Monitoring de la santé des instances

---

## Coupons

### ✅ Endpoints Implémentés (Frontend)
- `GET /api/superadmin/coupons` - Liste des coupons
- `GET /api/superadmin/coupons/{id}` - Détails d'un coupon
- `POST /api/superadmin/coupons` - Créer un coupon
- `PUT /api/superadmin/coupons/{id}` - Mettre à jour un coupon
- `DELETE /api/superadmin/coupons/{id}` - Supprimer un coupon
- `GET /api/superadmin/coupons/{id}/usages` - Historique d'utilisation
- `POST /api/superadmin/coupons/{id}/activate` - Activer un coupon
- `POST /api/superadmin/coupons/{id}/deactivate` - Désactiver un coupon

### ⚠️ Fonctionnalités Manquantes ou à Vérifier

1. **Champs du coupon**
   - Tous les champs du formulaire doivent être supportés :
     - `code` (unique, uppercase)
     - `name`, `description`
     - `type` (percentage, fixed)
     - `value` (montant ou pourcentage)
     - `currency` (EUR, USD, GBP)
     - `starts_at`, `ends_at` (dates de validité)
     - `max_uses`, `max_uses_per_user` (limites d'utilisation)
     - `minimum_amount` (montant minimum pour appliquer le coupon)
     - `target_plans` (array de plan IDs - coupons applicables à certains plans uniquement)
     - `notes` (notes internes)
     - `is_active` (boolean)

2. **Validation**
   - Validation que `code` est unique
   - Validation que `ends_at` > `starts_at`
   - Validation que `value` est positif
   - Validation que `max_uses` >= `max_uses_per_user` si les deux sont définis

3. **Logique métier**
   - Vérification automatique de la validité (dates, limites d'utilisation)
   - Compteur d'utilisations
   - Historique des utilisations

---

## Audit Logs

### ✅ Endpoints Implémentés (Frontend)
- `GET /api/superadmin/audit-logs` - Liste des logs d'audit
- `GET /api/superadmin/audit-logs/{id}` - Détails d'un log
- `GET /api/superadmin/audit-logs/export` - Exporter les logs (CSV/Excel)

### ⚠️ Fonctionnalités Manquantes ou à Vérifier

1. **Filtres avancés**
   - Filtrage par `module`, `action`, `user_id`, `severity`
   - Filtrage par date (`start_date`, `end_date`)
   - Pagination

2. **Export**
   - Format CSV avec tous les champs
   - Format Excel avec mise en forme
   - Filtres appliqués lors de l'export

---

## Roles & Permissions

### ✅ Endpoints Implémentés (Frontend)
- `GET /api/superadmin/roles` - Liste des rôles
- `GET /api/superadmin/roles/{id}` - Détails d'un rôle
- `POST /api/superadmin/roles` - Créer un rôle
- `PUT /api/superadmin/roles/{id}` - Mettre à jour un rôle
- `DELETE /api/superadmin/roles/{id}` - Supprimer un rôle
- `POST /api/superadmin/roles/{roleId}/assign-permission` - Assigner une permission
- `POST /api/superadmin/roles/{roleId}/revoke-permission` - Révoquer une permission

### ⚠️ Fonctionnalités Manquantes ou à Vérifier

1. **Gestion des permissions**
   - Endpoint pour lister toutes les permissions disponibles : `GET /api/superadmin/permissions`
   - Le modal frontend nécessite une liste complète des permissions pour permettre la sélection
   - Structure de permission :
     - `id`, `name`, `slug`, `module`, `description`

2. **Champs du rôle**
   - Tous les champs du formulaire doivent être supportés :
     - `name`, `slug`, `description`
     - `type` (custom, system)
     - `level` (1-10)
     - `is_active` (boolean)

3. **Assignation de permissions**
   - Lors de la création d'un rôle, possibilité d'assigner plusieurs permissions en une seule requête
   - Endpoint batch : `POST /api/superadmin/roles/{roleId}/assign-permissions` (array de permission IDs)

---

## Payment Gateways

### ✅ Endpoints Implémentés (Frontend)
- `GET /api/superadmin/organizations/{organizationId}/payment-gateways` - Liste des gateways
- `POST /api/superadmin/organizations/{organizationId}/payment-gateways` - Créer un gateway
- `PUT /api/superadmin/organizations/{organizationId}/payment-gateways/{gatewayId}` - Mettre à jour
- `DELETE /api/superadmin/organizations/{organizationId}/payment-gateways/{gatewayId}` - Supprimer
- `POST /api/superadmin/organizations/{organizationId}/payment-gateways/{gatewayId}/test` - Tester la connexion
- `POST /api/superadmin/organizations/{organizationId}/payment-gateways/{gatewayId}/set-default` - Définir par défaut

### ⚠️ Fonctionnalités Manquantes ou à Vérifier

1. **Gateways supportés**
   - Le frontend supporte ces gateways (vérifier que le backend les supporte aussi) :
     - stripe, paypal, mollie, paystack, razorpay, instamojo
     - mercadopago, flutterwave, coinbase, zitopay, iyzipay
     - bitpay, braintree, binance, alipay, xendit, paddle
     - paytm, maxicash, payhere, cinetpay, voguepay, toyyibpay
     - paymob, authorize, bank

2. **Champs du gateway**
   - Structure de données complète :
     ```json
     {
       "gateway_name": "stripe",
       "gateway_type": "payment|subscription",
       "credentials": {
         "api_key": "string",
         "secret_key": "string"
       },
       "is_active": boolean,
       "is_default": boolean,
       "priority": number,
       "supported_currencies": ["EUR", "USD"],
       "min_amount": number,
       "max_amount": number,
       "allowed_countries": ["FR", "US"],
       "blocked_countries": ["XX"],
       "notes": "string"
     }
     ```

3. **Test de connexion**
   - Le endpoint `/test` doit effectuer une vraie connexion au gateway
   - Retourner des détails sur le succès/échec
   - Ne pas exposer les credentials dans la réponse

4. **Sécurité**
   - Chiffrement des credentials (api_key, secret_key)
   - Ne jamais retourner les credentials dans les réponses GET
   - Validation des credentials avant sauvegarde

---

## SMTP Settings

### ✅ Endpoints Implémentés (Frontend)
- `GET /api/superadmin/organizations/{organizationId}/smtp-settings` - Liste des SMTP
- `POST /api/superadmin/organizations/{organizationId}/smtp-settings` - Créer un SMTP
- `PUT /api/superadmin/organizations/{organizationId}/smtp-settings/{smtpId}` - Mettre à jour
- `DELETE /api/superadmin/organizations/{organizationId}/smtp-settings/{smtpId}` - Supprimer
- `POST /api/superadmin/organizations/{organizationId}/smtp-settings/{smtpId}/test` - Tester l'envoi
- `POST /api/superadmin/organizations/{organizationId}/smtp-settings/{smtpId}/set-default` - Définir par défaut

### ⚠️ Fonctionnalités Manquantes ou à Vérifier

1. **Drivers supportés**
   - Le frontend supporte ces drivers (vérifier que le backend les supporte aussi) :
     - smtp, sendmail, mailgun, ses, postmark, log

2. **Champs SMTP**
   - Structure de données complète :
     ```json
     {
       "name": "string",
       "driver": "smtp|sendmail|mailgun|ses|postmark|log",
       "host": "smtp.gmail.com",
       "port": 587,
       "encryption": "tls|ssl|",
       "username": "string",
       "password": "string",
       "from_address": "noreply@example.com",
       "from_name": "Formly",
       "is_active": boolean,
       "is_default": boolean,
       "daily_limit": number,
       "hourly_limit": number,
       "notes": "string"
     }
     ```

3. **Test d'envoi**
   - Le endpoint `/test` doit envoyer un vrai email de test
   - Paramètre `test_email` dans le body
   - Retourner le statut d'envoi (succès/échec)

4. **Sécurité**
   - Chiffrement du mot de passe SMTP
   - Ne jamais retourner le mot de passe dans les réponses GET
   - Validation des paramètres SMTP avant sauvegarde

5. **Limites**
   - Respecter `daily_limit` et `hourly_limit` lors de l'envoi d'emails
   - Compteur d'emails envoyés par jour/heure
   - Retourner une erreur si la limite est atteinte

---

## Subdomain Management

### ⚠️ Fonctionnalités Manquantes

1. **Endpoints nécessaires**
   - `GET /api/superadmin/organizations/{organizationId}/subdomains` - Liste des sous-domaines
   - `POST /api/superadmin/organizations/{organizationId}/subdomains` - Créer un sous-domaine
   - `PUT /api/superadmin/organizations/{organizationId}/subdomains/{subdomainId}` - Mettre à jour
   - `DELETE /api/superadmin/organizations/{organizationId}/subdomains/{subdomainId}` - Supprimer
   - `POST /api/superadmin/organizations/{organizationId}/subdomains/{subdomainId}/test` - Tester la configuration DNS
   - `POST /api/superadmin/organizations/{organizationId}/subdomains/{subdomainId}/verify` - Vérifier la propriété du domaine

2. **Gestion des domaines personnalisés**
   - `GET /api/superadmin/organizations/{organizationId}/custom-domains` - Liste des domaines personnalisés
   - `POST /api/superadmin/organizations/{organizationId}/custom-domains` - Ajouter un domaine personnalisé
   - `DELETE /api/superadmin/organizations/{organizationId}/custom-domains/{domainId}` - Supprimer
   - `POST /api/superadmin/organizations/{organizationId}/custom-domains/{domainId}/verify` - Vérifier la configuration DNS

3. **Structure de données**
   ```json
   {
     "subdomain": "example",
     "domain": "form.fr",
     "full_domain": "example.form.fr",
     "is_active": boolean,
     "is_verified": boolean,
     "dns_records": [
       {
         "type": "CNAME|A|TXT",
         "name": "string",
         "value": "string",
         "verified": boolean
       }
     ],
     "ssl_certificate": {
       "status": "pending|active|expired",
       "expires_at": "2025-12-31"
     }
   }
   ```

---

## Dashboard

### ✅ Endpoints Implémentés (Frontend)
- `GET /api/superadmin/dashboard?period={30d|7d|1m|3m|1y}` - Données du dashboard

### ⚠️ Fonctionnalités Manquantes ou à Vérifier

1. **KPIs**
   - Vérifier que tous les KPIs sont calculés correctement :
     - MRR (Monthly Recurring Revenue) avec trend
     - ARR (Annual Recurring Revenue)
     - Churn rate avec count et period
     - ARPU (Average Revenue Per User) avec trend

2. **Données supplémentaires**
   - `new_clients` (count + liste des nouveaux clients)
   - `aws_consumption` (total + breakdown par service)
   - `top_clients` (liste des meilleurs clients)
   - `instances` (total, active, in_error, over_quota, suspended)

---

## Notes Générales

### Format de Réponse Standard
Tous les endpoints doivent retourner :
```json
{
  "success": true|false,
  "data": {...},
  "message": "Message optionnel",
  "pagination": {
    "current_page": 1,
    "last_page": 10,
    "per_page": 15,
    "total": 150
  }
}
```

### Gestion des Erreurs
```json
{
  "success": false,
  "error": {
    "message": "Message d'erreur",
    "code": "ERROR_CODE",
    "data": {
      "field": ["Erreur de validation"]
    }
  }
}
```

### Authentification
- Tous les endpoints nécessitent un token Bearer
- Vérifier que l'utilisateur a le rôle "Super Admin"
- Middleware d'authentification et d'autorisation requis

### Pagination
- Tous les endpoints de liste doivent supporter la pagination
- Paramètres : `page`, `per_page`
- Réponse inclut `pagination` dans la réponse

### Validation
- Valider tous les inputs
- Retourner des messages d'erreur clairs
- Validation côté backend même si validé côté frontend

---

**Version :** 1.0  
**Date :** Janvier 2025  
**Dernière mise à jour :** Après implémentation complète du frontend Super Admin

