# System Settings - Backend Documentation

## 📋 Table des matières
1. [Vue d'ensemble](#vue-densemble)
2. [Structure de la base de données](#structure-de-la-base-de-données)
3. [Groupes de paramètres](#groupes-de-paramètres)
4. [Endpoints API](#endpoints-api)
5. [Exemples d'implémentation](#exemples-dimplémentation)
6. [Validation et règles métier](#validation-et-règles-métier)

---

## Vue d'ensemble

Le système de paramètres permet de gérer toutes les configurations système de manière centralisée. Les paramètres sont organisés en groupes logiques et peuvent être récupérés, mis à jour individuellement ou en masse.

### Caractéristiques principales
- ✅ Gestion centralisée des paramètres système
- ✅ Organisation par groupes logiques
- ✅ Support de différents types de données (string, integer, boolean, json)
- ✅ Validation des valeurs
- ✅ Historique des modifications (optionnel)
- ✅ Cache des paramètres pour performance

---

## Structure de la base de données

### Table: `system_settings`

```sql
CREATE TABLE `system_settings` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `key` VARCHAR(255) NOT NULL UNIQUE,
  `value` TEXT NULL,
  `type` ENUM('string', 'integer', 'boolean', 'json', 'array') DEFAULT 'string',
  `group` VARCHAR(100) NOT NULL,
  `label` VARCHAR(255) NULL,
  `description` TEXT NULL,
  `is_public` BOOLEAN DEFAULT FALSE,
  `is_encrypted` BOOLEAN DEFAULT FALSE,
  `validation_rules` JSON NULL,
  `default_value` TEXT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_group` (`group`),
  INDEX `idx_key` (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Champs expliqués

- **key**: Clé unique du paramètre (ex: `app_name`, `smtp_host`)
- **value**: Valeur du paramètre (peut être NULL pour utiliser la valeur par défaut)
- **type**: Type de données (`string`, `integer`, `boolean`, `json`, `array`)
- **group**: Groupe auquel appartient le paramètre (`general`, `email`, `payment`, etc.)
- **label**: Libellé affiché dans l'interface
- **description**: Description du paramètre
- **is_public**: Si TRUE, accessible sans authentification (pour les paramètres publics)
- **is_encrypted**: Si TRUE, la valeur est chiffrée en base de données
- **validation_rules**: Règles de validation JSON (ex: `{"min": 0, "max": 100}`)
- **default_value**: Valeur par défaut si `value` est NULL

---

## Groupes de paramètres

### 1. General Settings (`general`)

Paramètres généraux de l'application.

| Key | Type | Description | Default |
|-----|------|-------------|---------|
| `app_name` | string | Nom de l'application | "Formly" |
| `app_url` | string | URL de base de l'application | "http://localhost:8000" |
| `app_timezone` | string | Fuseau horaire | "Europe/Paris" |
| `app_locale` | string | Langue par défaut | "fr" |
| `app_currency` | string | Devise par défaut | "EUR" |
| `maintenance_mode` | boolean | Mode maintenance activé | false |
| `maintenance_message` | string | Message de maintenance | "Maintenance en cours" |
| `max_upload_size` | integer | Taille max upload (MB) | 50 |
| `session_lifetime` | integer | Durée de session (minutes) | 120 |
| `password_min_length` | integer | Longueur min mot de passe | 8 |

### 2. Email Configuration (`email`)

Configuration des emails système.

| Key | Type | Description | Default |
|-----|------|-------------|---------|
| `email_driver` | string | Driver email (smtp, mailgun, ses) | "smtp" |
| `email_from_address` | string | Adresse expéditeur | "noreply@example.com" |
| `email_from_name` | string | Nom expéditeur | "Formly" |
| `smtp_host` | string | Serveur SMTP | "" |
| `smtp_port` | integer | Port SMTP | 587 |
| `smtp_username` | string | Utilisateur SMTP | "" |
| `smtp_password` | string | Mot de passe SMTP (encrypted) | "" |
| `smtp_encryption` | string | Chiffrement (tls, ssl) | "tls" |
| `mailgun_domain` | string | Domaine Mailgun | "" |
| `mailgun_secret` | string | Clé secrète Mailgun (encrypted) | "" |
| `ses_key` | string | Clé AWS SES | "" |
| `ses_secret` | string | Secret AWS SES (encrypted) | "" |
| `ses_region` | string | Région AWS SES | "us-east-1" |

### 3. Payment Gateways (`payment`)

Configuration des passerelles de paiement.

| Key | Type | Description | Default |
|-----|------|-------------|---------|
| `stripe_enabled` | boolean | Stripe activé | false |
| `stripe_public_key` | string | Clé publique Stripe | "" |
| `stripe_secret_key` | string | Clé secrète Stripe (encrypted) | "" |
| `stripe_webhook_secret` | string | Secret webhook Stripe (encrypted) | "" |
| `paypal_enabled` | boolean | PayPal activé | false |
| `paypal_client_id` | string | Client ID PayPal | "" |
| `paypal_secret` | string | Secret PayPal (encrypted) | "" |
| `paypal_mode` | string | Mode (sandbox, live) | "sandbox" |
| `default_currency` | string | Devise par défaut | "EUR" |
| `tax_rate` | decimal | Taux de TVA (%) | 20.00 |

### 4. Storage Settings (`storage`)

Configuration du stockage des fichiers.

| Key | Type | Description | Default |
|-----|------|-------------|---------|
| `storage_driver` | string | Driver (local, s3, azure) | "local" |
| `storage_path` | string | Chemin local | "storage/app" |
| `s3_bucket` | string | Nom du bucket S3 | "" |
| `s3_region` | string | Région S3 | "eu-west-1" |
| `s3_key` | string | Clé AWS S3 | "" |
| `s3_secret` | string | Secret AWS S3 (encrypted) | "" |
| `s3_endpoint` | string | Endpoint S3 personnalisé | "" |
| `max_file_size` | integer | Taille max fichier (MB) | 50 |
| `allowed_file_types` | json | Types de fichiers autorisés | `["jpg","png","pdf","docx"]` |

### 5. Feature Modules (`features`)

Activation/désactivation des modules fonctionnels.

| Key | Type | Description | Default |
|-----|------|-------------|---------|
| `feature_courses` | boolean | Module Cours | true |
| `feature_certificates` | boolean | Module Certificats | true |
| `feature_quizzes` | boolean | Module Quiz | true |
| `feature_forum` | boolean | Module Forum | false |
| `feature_chat` | boolean | Module Chat | false |
| `feature_webinars` | boolean | Module Webinaires | false |
| `feature_assignments` | boolean | Module Devoirs | true |
| `feature_gamification` | boolean | Gamification | false |
| `feature_analytics` | boolean | Analytics | true |
| `feature_api` | boolean | API REST | true |

### 6. Security (`security`)

Paramètres de sécurité.

| Key | Type | Description | Default |
|-----|------|-------------|---------|
| `password_reset_expiry` | integer | Expiration reset (minutes) | 60 |
| `max_login_attempts` | integer | Tentatives max connexion | 5 |
| `lockout_duration` | integer | Durée verrouillage (minutes) | 15 |
| `two_factor_enabled` | boolean | 2FA activé | false |
| `session_secure` | boolean | Cookies sécurisés (HTTPS) | false |
| `session_same_site` | string | SameSite (strict, lax, none) | "lax" |
| `cors_enabled` | boolean | CORS activé | false |
| `cors_allowed_origins` | json | Origines autorisées | `["*"]` |
| `rate_limiting_enabled` | boolean | Rate limiting | true |
| `rate_limit_per_minute` | integer | Requêtes par minute | 60 |

### 7. Appearance (`appearance`)

Paramètres d'apparence et branding.

| Key | Type | Description | Default |
|-----|------|-------------|---------|
| `logo_url` | string | URL du logo | "" |
| `favicon_url` | string | URL du favicon | "" |
| `primary_color` | string | Couleur primaire (hex) | "#3B82F6" |
| `secondary_color` | string | Couleur secondaire (hex) | "#8B5CF6" |
| `theme_mode` | string | Mode thème (light, dark, auto) | "auto" |
| `custom_css` | text | CSS personnalisé | "" |
| `footer_text` | string | Texte du footer | "© 2025 Formly" |
| `login_background` | string | Image de fond login | "" |

---

## Endpoints API

### Base URL
```
http://localhost:8000/api/superadmin/system/settings
```

### Authentification
Tous les endpoints nécessitent un token Bearer :
```
Authorization: Bearer {token}
```

---

### 1. Récupérer tous les paramètres

**Endpoint:** `GET /api/superadmin/system/settings`

**Response Success (200):**
```json
{
  "success": true,
  "message": "Settings retrieved successfully",
  "data": {
    "app_name": "Formly",
    "app_url": "http://localhost:8000",
    "smtp_host": "smtp.mailtrap.io",
    "stripe_enabled": true,
    ...
  }
}
```

---

### 2. Récupérer les groupes disponibles

**Endpoint:** `GET /api/superadmin/system/settings/groups`

**Response Success (200):**
```json
{
  "success": true,
  "data": [
    "general",
    "email",
    "payment",
    "storage",
    "features",
    "security",
    "appearance"
  ]
}
```

---

### 3. Récupérer les paramètres d'un groupe

**Endpoint:** `GET /api/superadmin/system/settings/groups/{group}`

**Path Parameters:**
- `group` (required): Nom du groupe (`general`, `email`, `payment`, etc.)

**Response Success (200):**
```json
{
  "success": true,
  "message": "Settings retrieved successfully",
  "data": {
    "app_name": "Formly",
    "app_url": "http://localhost:8000",
    "app_timezone": "Europe/Paris",
    "app_locale": "fr",
    "app_currency": "EUR",
    "maintenance_mode": false,
    "maintenance_message": "Maintenance en cours",
    "max_upload_size": 50,
    "session_lifetime": 120,
    "password_min_length": 8
  }
}
```

**Response Error (404):**
```json
{
  "success": false,
  "message": "Settings group not found"
}
```

---

### 4. Récupérer un paramètre spécifique

**Endpoint:** `GET /api/superadmin/system/settings/{key}`

**Path Parameters:**
- `key` (required): Clé du paramètre (ex: `app_name`)

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "key": "app_name",
    "value": "Formly",
    "type": "string",
    "group": "general",
    "label": "Application Name",
    "description": "Nom de l'application affiché dans l'interface",
    "default_value": "Formly"
  }
}
```

---

### 5. Mettre à jour un paramètre

**Endpoint:** `PUT /api/superadmin/system/settings/{key}`

**Path Parameters:**
- `key` (required): Clé du paramètre

**Body (JSON):**
```json
{
  "value": "Nouveau nom"
}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Setting updated successfully",
  "data": {
    "key": "app_name",
    "value": "Nouveau nom",
    "updated_at": "2025-11-16T12:00:00+00:00"
  }
}
```

**Response Error (400) - Validation:**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "value": ["The value must be a string with max 255 characters"]
  }
}
```

---

### 6. Mettre à jour plusieurs paramètres (Bulk Update)

**Endpoint:** `POST /api/superadmin/system/settings/bulk`

**Body (JSON):**
```json
{
  "settings": {
    "app_name": "Formly Pro",
    "app_url": "https://formly.pro",
    "maintenance_mode": false,
    "smtp_host": "smtp.mailtrap.io",
    "smtp_port": 587
  }
}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Settings updated successfully",
  "data": {
    "updated": 5,
    "failed": 0
  }
}
```

**Response Error (400) - Partial Success:**
```json
{
  "success": true,
  "message": "Some settings failed to update",
  "data": {
    "updated": 3,
    "failed": 2,
    "errors": {
      "invalid_key": "Setting key not found",
      "invalid_value": "Validation failed"
    }
  }
}
```

---

### 7. Réinitialiser un paramètre à sa valeur par défaut

**Endpoint:** `DELETE /api/superadmin/system/settings/{key}`

**Path Parameters:**
- `key` (required): Clé du paramètre

**Response Success (200):**
```json
{
  "success": true,
  "message": "Setting reset to default value",
  "data": {
    "key": "app_name",
    "value": "Formly",
    "default_value": "Formly"
  }
}
```

---

## Exemples d'implémentation

### Modèle Laravel: `SystemSetting.php`

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Crypt;

class SystemSetting extends Model
{
    protected $table = 'system_settings';

    protected $fillable = [
        'key',
        'value',
        'type',
        'group',
        'label',
        'description',
        'is_public',
        'is_encrypted',
        'validation_rules',
        'default_value',
    ];

    protected $casts = [
        'is_public' => 'boolean',
        'is_encrypted' => 'boolean',
        'validation_rules' => 'array',
    ];

    /**
     * Get the decrypted value
     */
    public function getValueAttribute($value)
    {
        if ($this->is_encrypted && $value) {
            try {
                return Crypt::decryptString($value);
            } catch (\Exception $e) {
                return $value;
            }
        }
        return $value ?? $this->default_value;
    }

    /**
     * Set the encrypted value
     */
    public function setValueAttribute($value)
    {
        if ($this->is_encrypted && $value) {
            $this->attributes['value'] = Crypt::encryptString($value);
        } else {
            $this->attributes['value'] = $value;
        }
    }

    /**
     * Get setting by key with caching
     */
    public static function getByKey($key, $default = null)
    {
        return cache()->remember(
            "setting.{$key}",
            now()->addHours(24),
            function () use ($key, $default) {
                $setting = self::where('key', $key)->first();
                return $setting ? $setting->value : $default;
            }
        );
    }

    /**
     * Get all settings by group
     */
    public static function getByGroup($group)
    {
        return cache()->remember(
            "settings.group.{$group}",
            now()->addHours(24),
            function () use ($group) {
                return self::where('group', $group)
                    ->get()
                    ->pluck('value', 'key')
                    ->toArray();
            }
        );
    }

    /**
     * Clear settings cache
     */
    public static function clearCache($key = null)
    {
        if ($key) {
            cache()->forget("setting.{$key}");
            $setting = self::where('key', $key)->first();
            if ($setting) {
                cache()->forget("settings.group.{$setting->group}");
            }
        } else {
            cache()->flush();
        }
    }
}
```

---

### Contrôleur Laravel: `SystemSettingsController.php`

```php
<?php

namespace App\Http\Controllers\Api\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\SystemSetting;
use App\Traits\ApiStatusTrait;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Cache;

class SystemSettingsController extends Controller
{
    use ApiStatusTrait;

    /**
     * Get all settings
     * GET /api/superadmin/system/settings
     */
    public function index()
    {
        try {
            $settings = SystemSetting::all()
                ->pluck('value', 'key')
                ->toArray();

            return $this->success($settings, 'Settings retrieved successfully');
        } catch (\Exception $e) {
            return $this->failed([], 'Error fetching settings: ' . $e->getMessage());
        }
    }

    /**
     * Get available groups
     * GET /api/superadmin/system/settings/groups
     */
    public function getGroups()
    {
        try {
            $groups = SystemSetting::distinct()
                ->pluck('group')
                ->toArray();

            return $this->success($groups);
        } catch (\Exception $e) {
            return $this->failed([], 'Error fetching groups: ' . $e->getMessage());
        }
    }

    /**
     * Get settings by group
     * GET /api/superadmin/system/settings/groups/{group}
     */
    public function getByGroup($group)
    {
        try {
            $settings = SystemSetting::getByGroup($group);

            if (empty($settings)) {
                return $this->failed([], 'Settings group not found', 404);
            }

            return $this->success($settings, 'Settings retrieved successfully');
        } catch (\Exception $e) {
            return $this->failed([], 'Error fetching settings: ' . $e->getMessage());
        }
    }

    /**
     * Get single setting
     * GET /api/superadmin/system/settings/{key}
     */
    public function show($key)
    {
        try {
            $setting = SystemSetting::where('key', $key)->first();

            if (!$setting) {
                return $this->failed([], 'Setting not found', 404);
            }

            return $this->success([
                'key' => $setting->key,
                'value' => $setting->value,
                'type' => $setting->type,
                'group' => $setting->group,
                'label' => $setting->label,
                'description' => $setting->description,
                'default_value' => $setting->default_value,
            ]);
        } catch (\Exception $e) {
            return $this->failed([], 'Error fetching setting: ' . $e->getMessage());
        }
    }

    /**
     * Update single setting
     * PUT /api/superadmin/system/settings/{key}
     */
    public function update(Request $request, $key)
    {
        try {
            $setting = SystemSetting::where('key', $key)->first();

            if (!$setting) {
                return $this->failed([], 'Setting not found', 404);
            }

            $validator = Validator::make($request->all(), [
                'value' => $this->getValidationRules($setting),
            ]);

            if ($validator->fails()) {
                return $this->validationError($validator->errors(), 'Validation failed');
            }

            $setting->value = $request->value;
            $setting->save();

            // Clear cache
            SystemSetting::clearCache($key);

            return $this->success([
                'key' => $setting->key,
                'value' => $setting->value,
                'updated_at' => $setting->updated_at->toIso8601String(),
            ], 'Setting updated successfully');
        } catch (\Exception $e) {
            return $this->failed([], 'Error updating setting: ' . $e->getMessage());
        }
    }

    /**
     * Bulk update settings
     * POST /api/superadmin/system/settings/bulk
     */
    public function bulkUpdate(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'settings' => 'required|array',
            ]);

            if ($validator->fails()) {
                return $this->validationError($validator->errors(), 'Validation failed');
            }

            $updated = 0;
            $failed = 0;
            $errors = [];

            foreach ($request->settings as $key => $value) {
                try {
                    $setting = SystemSetting::where('key', $key)->first();

                    if (!$setting) {
                        $failed++;
                        $errors[$key] = 'Setting key not found';
                        continue;
                    }

                    $validator = Validator::make(
                        ['value' => $value],
                        ['value' => $this->getValidationRules($setting)]
                    );

                    if ($validator->fails()) {
                        $failed++;
                        $errors[$key] = $validator->errors()->first('value');
                        continue;
                    }

                    $setting->value = $value;
                    $setting->save();
                    SystemSetting::clearCache($key);
                    $updated++;
                } catch (\Exception $e) {
                    $failed++;
                    $errors[$key] = $e->getMessage();
                }
            }

            $response = [
                'updated' => $updated,
                'failed' => $failed,
            ];

            if ($failed > 0) {
                $response['errors'] = $errors;
            }

            return $this->success(
                $response,
                $failed > 0 ? 'Some settings failed to update' : 'Settings updated successfully'
            );
        } catch (\Exception $e) {
            return $this->failed([], 'Error updating settings: ' . $e->getMessage());
        }
    }

    /**
     * Reset setting to default
     * DELETE /api/superadmin/system/settings/{key}
     */
    public function destroy($key)
    {
        try {
            $setting = SystemSetting::where('key', $key)->first();

            if (!$setting) {
                return $this->failed([], 'Setting not found', 404);
            }

            $setting->value = null; // Use default value
            $setting->save();

            SystemSetting::clearCache($key);

            return $this->success([
                'key' => $setting->key,
                'value' => $setting->value,
                'default_value' => $setting->default_value,
            ], 'Setting reset to default value');
        } catch (\Exception $e) {
            return $this->failed([], 'Error resetting setting: ' . $e->getMessage());
        }
    }

    /**
     * Get validation rules for a setting
     */
    private function getValidationRules($setting)
    {
        $rules = [];

        switch ($setting->type) {
            case 'integer':
                $rules[] = 'integer';
                break;
            case 'boolean':
                $rules[] = 'boolean';
                break;
            case 'json':
            case 'array':
                $rules[] = 'json';
                break;
            default:
                $rules[] = 'string';
        }

        // Add custom validation rules from JSON
        if ($setting->validation_rules) {
            foreach ($setting->validation_rules as $rule => $value) {
                switch ($rule) {
                    case 'min':
                        $rules[] = "min:{$value}";
                        break;
                    case 'max':
                        $rules[] = "max:{$value}";
                        break;
                    case 'required':
                        if ($value) {
                            $rules[] = 'required';
                        }
                        break;
                    case 'regex':
                        $rules[] = "regex:{$value}";
                        break;
                }
            }
        }

        return implode('|', $rules);
    }
}
```

---

### Routes Laravel: `routes/api.php`

```php
Route::prefix('superadmin/system/settings')->middleware(['auth:sanctum', 'permission:settings.manage'])->group(function () {
    Route::get('/', [SystemSettingsController::class, 'index']);
    Route::get('/groups', [SystemSettingsController::class, 'getGroups']);
    Route::get('/groups/{group}', [SystemSettingsController::class, 'getByGroup']);
    Route::get('/{key}', [SystemSettingsController::class, 'show']);
    Route::put('/{key}', [SystemSettingsController::class, 'update']);
    Route::post('/bulk', [SystemSettingsController::class, 'bulkUpdate']);
    Route::delete('/{key}', [SystemSettingsController::class, 'destroy']);
});
```

---

### Seeder pour initialiser les paramètres: `SystemSettingsSeeder.php`

```php
<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\SystemSetting;

class SystemSettingsSeeder extends Seeder
{
    public function run()
    {
        $settings = [
            // General Settings
            ['key' => 'app_name', 'value' => 'Formly', 'type' => 'string', 'group' => 'general', 'label' => 'Application Name', 'default_value' => 'Formly'],
            ['key' => 'app_url', 'value' => 'http://localhost:8000', 'type' => 'string', 'group' => 'general', 'label' => 'Application URL', 'default_value' => 'http://localhost:8000'],
            ['key' => 'app_timezone', 'value' => 'Europe/Paris', 'type' => 'string', 'group' => 'general', 'label' => 'Timezone', 'default_value' => 'Europe/Paris'],
            ['key' => 'app_locale', 'value' => 'fr', 'type' => 'string', 'group' => 'general', 'label' => 'Default Locale', 'default_value' => 'fr'],
            ['key' => 'app_currency', 'value' => 'EUR', 'type' => 'string', 'group' => 'general', 'label' => 'Default Currency', 'default_value' => 'EUR'],
            ['key' => 'maintenance_mode', 'value' => 'false', 'type' => 'boolean', 'group' => 'general', 'label' => 'Maintenance Mode', 'default_value' => 'false'],
            ['key' => 'maintenance_message', 'value' => 'Maintenance en cours', 'type' => 'string', 'group' => 'general', 'label' => 'Maintenance Message', 'default_value' => 'Maintenance en cours'],
            ['key' => 'max_upload_size', 'value' => '50', 'type' => 'integer', 'group' => 'general', 'label' => 'Max Upload Size (MB)', 'default_value' => '50', 'validation_rules' => json_encode(['min' => 1, 'max' => 1000])],
            ['key' => 'session_lifetime', 'value' => '120', 'type' => 'integer', 'group' => 'general', 'label' => 'Session Lifetime (minutes)', 'default_value' => '120'],
            ['key' => 'password_min_length', 'value' => '8', 'type' => 'integer', 'group' => 'general', 'label' => 'Password Min Length', 'default_value' => '8', 'validation_rules' => json_encode(['min' => 6, 'max' => 32])],

            // Email Settings
            ['key' => 'email_driver', 'value' => 'smtp', 'type' => 'string', 'group' => 'email', 'label' => 'Email Driver', 'default_value' => 'smtp'],
            ['key' => 'email_from_address', 'value' => 'noreply@example.com', 'type' => 'string', 'group' => 'email', 'label' => 'From Address', 'default_value' => 'noreply@example.com'],
            ['key' => 'email_from_name', 'value' => 'Formly', 'type' => 'string', 'group' => 'email', 'label' => 'From Name', 'default_value' => 'Formly'],
            ['key' => 'smtp_host', 'value' => '', 'type' => 'string', 'group' => 'email', 'label' => 'SMTP Host', 'default_value' => ''],
            ['key' => 'smtp_port', 'value' => '587', 'type' => 'integer', 'group' => 'email', 'label' => 'SMTP Port', 'default_value' => '587'],
            ['key' => 'smtp_username', 'value' => '', 'type' => 'string', 'group' => 'email', 'label' => 'SMTP Username', 'default_value' => ''],
            ['key' => 'smtp_password', 'value' => '', 'type' => 'string', 'group' => 'email', 'label' => 'SMTP Password', 'is_encrypted' => true, 'default_value' => ''],
            ['key' => 'smtp_encryption', 'value' => 'tls', 'type' => 'string', 'group' => 'email', 'label' => 'SMTP Encryption', 'default_value' => 'tls'],

            // Payment Settings
            ['key' => 'stripe_enabled', 'value' => 'false', 'type' => 'boolean', 'group' => 'payment', 'label' => 'Stripe Enabled', 'default_value' => 'false'],
            ['key' => 'stripe_public_key', 'value' => '', 'type' => 'string', 'group' => 'payment', 'label' => 'Stripe Public Key', 'default_value' => ''],
            ['key' => 'stripe_secret_key', 'value' => '', 'type' => 'string', 'group' => 'payment', 'label' => 'Stripe Secret Key', 'is_encrypted' => true, 'default_value' => ''],
            ['key' => 'default_currency', 'value' => 'EUR', 'type' => 'string', 'group' => 'payment', 'label' => 'Default Currency', 'default_value' => 'EUR'],
            ['key' => 'tax_rate', 'value' => '20.00', 'type' => 'string', 'group' => 'payment', 'label' => 'Tax Rate (%)', 'default_value' => '20.00'],

            // Storage Settings
            ['key' => 'storage_driver', 'value' => 'local', 'type' => 'string', 'group' => 'storage', 'label' => 'Storage Driver', 'default_value' => 'local'],
            ['key' => 'max_file_size', 'value' => '50', 'type' => 'integer', 'group' => 'storage', 'label' => 'Max File Size (MB)', 'default_value' => '50'],
            ['key' => 'allowed_file_types', 'value' => json_encode(['jpg', 'png', 'pdf', 'docx']), 'type' => 'json', 'group' => 'storage', 'label' => 'Allowed File Types', 'default_value' => json_encode(['jpg', 'png', 'pdf', 'docx'])],

            // Feature Modules
            ['key' => 'feature_courses', 'value' => 'true', 'type' => 'boolean', 'group' => 'features', 'label' => 'Courses Module', 'default_value' => 'true'],
            ['key' => 'feature_certificates', 'value' => 'true', 'type' => 'boolean', 'group' => 'features', 'label' => 'Certificates Module', 'default_value' => 'true'],
            ['key' => 'feature_quizzes', 'value' => 'true', 'type' => 'boolean', 'group' => 'features', 'label' => 'Quizzes Module', 'default_value' => 'true'],
            ['key' => 'feature_forum', 'value' => 'false', 'type' => 'boolean', 'group' => 'features', 'label' => 'Forum Module', 'default_value' => 'false'],
            ['key' => 'feature_chat', 'value' => 'false', 'type' => 'boolean', 'group' => 'features', 'label' => 'Chat Module', 'default_value' => 'false'],

            // Security Settings
            ['key' => 'password_reset_expiry', 'value' => '60', 'type' => 'integer', 'group' => 'security', 'label' => 'Password Reset Expiry (minutes)', 'default_value' => '60'],
            ['key' => 'max_login_attempts', 'value' => '5', 'type' => 'integer', 'group' => 'security', 'label' => 'Max Login Attempts', 'default_value' => '5'],
            ['key' => 'lockout_duration', 'value' => '15', 'type' => 'integer', 'group' => 'security', 'label' => 'Lockout Duration (minutes)', 'default_value' => '15'],
            ['key' => 'two_factor_enabled', 'value' => 'false', 'type' => 'boolean', 'group' => 'security', 'label' => 'Two Factor Authentication', 'default_value' => 'false'],
            ['key' => 'rate_limiting_enabled', 'value' => 'true', 'type' => 'boolean', 'group' => 'security', 'label' => 'Rate Limiting', 'default_value' => 'true'],
            ['key' => 'rate_limit_per_minute', 'value' => '60', 'type' => 'integer', 'group' => 'security', 'label' => 'Rate Limit Per Minute', 'default_value' => '60'],

            // Appearance Settings
            ['key' => 'primary_color', 'value' => '#3B82F6', 'type' => 'string', 'group' => 'appearance', 'label' => 'Primary Color', 'default_value' => '#3B82F6'],
            ['key' => 'secondary_color', 'value' => '#8B5CF6', 'type' => 'string', 'group' => 'appearance', 'label' => 'Secondary Color', 'default_value' => '#8B5CF6'],
            ['key' => 'theme_mode', 'value' => 'auto', 'type' => 'string', 'group' => 'appearance', 'label' => 'Theme Mode', 'default_value' => 'auto'],
            ['key' => 'footer_text', 'value' => '© 2025 Formly', 'type' => 'string', 'group' => 'appearance', 'label' => 'Footer Text', 'default_value' => '© 2025 Formly'],
        ];

        foreach ($settings as $setting) {
            SystemSetting::updateOrCreate(
                ['key' => $setting['key']],
                $setting
            );
        }
    }
}
```

---

## Validation et règles métier

### Règles de validation par type

1. **String**: 
   - Max 255 caractères par défaut
   - Peut avoir des règles personnalisées (min, max, regex)

2. **Integer**: 
   - Doit être un nombre entier
   - Peut avoir des règles min/max

3. **Boolean**: 
   - Doit être `true` ou `false` (ou `"true"`/`"false"` en string)

4. **JSON/Array**: 
   - Doit être un JSON valide
   - Pour les arrays, format: `["value1", "value2"]`

### Paramètres chiffrés

Les paramètres sensibles (mots de passe, clés API) doivent avoir `is_encrypted = true`. Le modèle chiffre automatiquement la valeur avant stockage.

### Cache

Les paramètres sont mis en cache pour améliorer les performances. Le cache est automatiquement invalidé lors d'une mise à jour.

---

## Notes importantes

1. **Sécurité**: Tous les endpoints nécessitent l'authentification SuperAdmin et la permission `settings.manage`
2. **Performance**: Utiliser le cache pour les paramètres fréquemment accédés
3. **Validation**: Toujours valider les valeurs selon le type et les règles définies
4. **Chiffrement**: Les valeurs sensibles doivent être chiffrées en base de données
5. **Valeurs par défaut**: Si `value` est NULL, utiliser `default_value`

---

## Exemple d'utilisation frontend

```typescript
// Récupérer les paramètres d'un groupe
const response = await superAdminService.getSettingsByGroup('general');
// Response: { app_name: "Formly", app_url: "http://localhost:8000", ... }

// Mettre à jour un paramètre
await superAdminService.updateSetting('app_name', 'Formly Pro');

// Mise à jour en masse
await superAdminService.bulkUpdateSettings({
  app_name: 'Formly Pro',
  app_url: 'https://formly.pro',
  maintenance_mode: false
});
```

---

**Version:** 1.0.0  
**Dernière mise à jour:** 2025-11-16

