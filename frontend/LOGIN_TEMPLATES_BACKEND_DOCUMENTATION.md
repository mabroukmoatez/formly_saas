# Documentation Backend - Modèles de Connexion et Bannière de Login

## Vue d'ensemble

Cette documentation décrit l'implémentation backend pour la gestion des modèles de connexion et de la bannière de login dans le système White Label. Les modèles de connexion permettent de personnaliser l'apparence de la page de login, et la bannière de connexion est l'image de fond affichée sur cette page.

---

## Structure de la Base de Données

### Table: `white_label_settings` (Extension)

Les colonnes suivantes doivent exister dans la table `white_label_settings` :

```sql
ALTER TABLE white_label_settings
ADD COLUMN login_template VARCHAR(255) NULL AFTER accent_color,
ADD COLUMN login_banner VARCHAR(255) NULL AFTER login_template;
```

**Note** : `login_banner` stocke le chemin relatif vers l'image de bannière uploadée.

---

### Table: `login_templates` (Nouvelle)

Créez une nouvelle table pour stocker les modèles de connexion disponibles :

```sql
CREATE TABLE login_templates (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    type ENUM('minimal', 'illustrated', 'background') NOT NULL DEFAULT 'minimal',
    preview_url VARCHAR(500) NULL,
    preview_path VARCHAR(500) NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_type (type),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Données initiales** :

```sql
INSERT INTO login_templates (id, name, description, type, preview_path) VALUES
('minimal-1', 'Minimaliste', 'Design épuré et moderne avec un formulaire centré', 'minimal', '/templates/login/minimal-1.png'),
('illustrated-1', 'Avec illustration', 'Design avec illustrations et éléments graphiques', 'illustrated', '/templates/login/illustrated-1.png'),
('background-1', 'Avec arrière-plan', 'Design avec image de fond personnalisée', 'background', '/templates/login/background-1.png');
```

---

## Endpoints API

### 1. Récupérer les Modèles de Connexion Disponibles

**Endpoint:** `GET /api/organization/white-label/login-templates`

**Headers:**
```
Authorization: Bearer {token}
```

**Réponse:**

```json
{
  "success": true,
  "data": {
    "templates": [
      {
        "id": "minimal-1",
        "name": "Minimaliste",
        "description": "Design épuré et moderne avec un formulaire centré",
        "type": "minimal",
        "preview_url": "https://domain.com/storage/templates/login/minimal-1.png",
        "preview_path": "/templates/login/minimal-1.png"
      },
      {
        "id": "illustrated-1",
        "name": "Avec illustration",
        "description": "Design avec illustrations et éléments graphiques",
        "type": "illustrated",
        "preview_url": "https://domain.com/storage/templates/login/illustrated-1.png",
        "preview_path": "/templates/login/illustrated-1.png"
      },
      {
        "id": "background-1",
        "name": "Avec arrière-plan",
        "description": "Design avec image de fond personnalisée",
        "type": "background",
        "preview_url": "https://domain.com/storage/templates/login/background-1.png",
        "preview_path": "/templates/login/background-1.png"
      }
    ]
  }
}
```

**Implémentation PHP (Laravel):**

```php
public function getLoginTemplates()
{
    $templates = DB::table('login_templates')
        ->where('is_active', true)
        ->orderBy('name')
        ->get()
        ->map(function ($template) {
            return [
                'id' => $template->id,
                'name' => $template->name,
                'description' => $template->description,
                'type' => $template->type,
                'preview_url' => $template->preview_path 
                    ? asset('storage' . $template->preview_path) 
                    : null,
                'preview_path' => $template->preview_path,
            ];
        });

    return response()->json([
        'success' => true,
        'data' => [
            'templates' => $templates
        ]
    ]);
}
```

---

### 2. Mettre à Jour le Modèle de Connexion

**Endpoint:** `PUT /api/organization/white-label/settings`

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Body:**

```json
{
  "login_template": "minimal-1",
  "login_banner": "uploads/login_banners/banner.jpg"
}
```

**Note:** Le modèle de connexion est mis à jour via l'endpoint général des paramètres White Label. Voir la documentation principale pour plus de détails.

---

### 3. Uploader une Bannière de Connexion

**Endpoint:** `POST /api/organization/white-label/upload-login-banner`

**Headers:**
```
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Body (FormData):**

```
login_banner: [file]
```

**Réponse:**

```json
{
  "success": true,
  "message": "Bannière uploadée avec succès",
  "data": {
    "banner_path": "uploads/login_banners/1234567890_banner.jpg",
    "banner_url": "https://domain.com/storage/uploads/login_banners/1234567890_banner.jpg"
  }
}
```

**Erreurs possibles:**

```json
{
  "success": false,
  "message": "Erreur lors de l'upload",
  "error": "Format de fichier non supporté. Formats acceptés: JPG, PNG, WEBP"
}
```

**Implémentation PHP (Laravel):**

```php
public function uploadLoginBanner(Request $request)
{
    $validator = Validator::make($request->all(), [
        'login_banner' => 'required|image|mimes:jpeg,jpg,png,webp|max:5120', // 5MB max
    ]);

    if ($validator->fails()) {
        return response()->json([
            'success' => false,
            'message' => 'Validation failed',
            'errors' => $validator->errors()
        ], 422);
    }

    try {
        $organization = $request->user()->organization;
        
        if (!$organization) {
            return response()->json([
                'success' => false,
                'message' => 'Organization not found'
            ], 404);
        }

        $file = $request->file('login_banner');
        $filename = time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
        $path = $file->storeAs('login_banners', $filename, 'public');

        // Mettre à jour les paramètres White Label
        $settings = $organization->whiteLabelSettings;
        $settings->login_banner = $path;
        $settings->save();

        return response()->json([
            'success' => true,
            'message' => 'Bannière uploadée avec succès',
            'data' => [
                'banner_path' => $path,
                'banner_url' => asset('storage/' . $path)
            ]
        ]);

    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'message' => 'Erreur lors de l\'upload',
            'error' => $e->getMessage()
        ], 500);
    }
}
```

---

### 4. Récupérer les Paramètres de Login (pour la page de login)

**Endpoint:** `GET /api/organization/login-settings`

**Note:** Cet endpoint est public et peut être appelé sans authentification pour la page de login.

**Query Parameters:**
- `subdomain` (optionnel): Le sous-domaine de l'organisation

**Réponse:**

```json
{
  "success": true,
  "data": {
    "organization_name": "Mon Organisation",
    "organization_tagline": "Votre slogan ici",
    "organization_logo_url": "https://domain.com/storage/uploads/logos/logo.png",
    "login_template": "minimal-1",
    "login_banner_url": "https://domain.com/storage/uploads/login_banners/banner.jpg",
    "primary_color": "#007aff",
    "secondary_color": "#6a90b9",
    "accent_color": "#28a745"
  }
}
```

**Implémentation PHP (Laravel):**

```php
public function getLoginSettings(Request $request)
{
    $subdomain = $request->query('subdomain');
    
    $organization = null;
    if ($subdomain) {
        $organization = Organization::where('custom_domain', $subdomain)
            ->orWhere('subdomain', $subdomain)
            ->first();
    }

    if (!$organization) {
        // Retourner les valeurs par défaut
        return response()->json([
            'success' => true,
            'data' => [
                'organization_name' => 'Formly',
                'organization_tagline' => 'An LMS solution for your school',
                'organization_logo_url' => asset('assets/logos/login-logo.svg'),
                'login_template' => 'minimal-1',
                'login_banner_url' => asset('assets/images/login-background.png'),
                'primary_color' => '#007aff',
                'secondary_color' => '#6a90b9',
                'accent_color' => '#28a745'
            ]
        ]);
    }

    $settings = $organization->whiteLabelSettings;

    return response()->json([
        'success' => true,
        'data' => [
            'organization_name' => $organization->organization_name,
            'organization_tagline' => $organization->organization_tagline ?? 'An LMS solution for your school',
            'organization_logo_url' => $organization->organization_logo_url 
                ? asset('storage/' . $organization->organization_logo_url)
                : asset('assets/logos/login-logo.svg'),
            'login_template' => $settings->login_template ?? 'minimal-1',
            'login_banner_url' => $settings->login_banner 
                ? asset('storage/' . $settings->login_banner)
                : asset('assets/images/login-background.png'),
            'primary_color' => $settings->primary_color ?? '#007aff',
            'secondary_color' => $settings->secondary_color ?? '#6a90b9',
            'accent_color' => $settings->accent_color ?? '#28a745'
        ]
    ]);
}
```

**Note importante:** L'endpoint `GET /api/organization/by-subdomain/{subdomain}` utilisé par le frontend pour charger l'organisation doit également retourner `login_template` et `login_banner_url` dans la réponse. Assurez-vous que ces champs sont inclus dans la réponse de l'API.

**Exemple de réponse pour `/api/organization/by-subdomain/{subdomain}`:**

```json
{
  "success": true,
  "data": {
    "organization": {
      "id": 1,
      "organization_name": "Mon Organisation",
      "organization_tagline": "Votre slogan",
      "organization_logo_url": "https://domain.com/storage/uploads/logos/logo.png",
      "custom_domain": "monorganisation",
      "subdomain": "monorganisation",
      "primary_color": "#007aff",
      "secondary_color": "#6a90b9",
      "accent_color": "#28a745",
      "login_template": "minimal-1",
      "login_banner_url": "https://domain.com/storage/uploads/login_banners/banner.jpg"
    }
  }
}
```

**Implémentation PHP pour inclure les données White Label dans la réponse:**

```php
public function getOrganizationBySubdomain($subdomain)
{
    $organization = Organization::where('custom_domain', $subdomain)
        ->orWhere('subdomain', $subdomain)
        ->with('whiteLabelSettings')
        ->first();

    if (!$organization) {
        return response()->json([
            'success' => false,
            'message' => 'Organization not found'
        ], 404);
    }

    $settings = $organization->whiteLabelSettings;

    return response()->json([
        'success' => true,
        'data' => [
            'organization' => [
                'id' => $organization->id,
                'uuid' => $organization->uuid,
                'organization_name' => $organization->organization_name,
                'organization_tagline' => $organization->organization_tagline,
                'organization_description' => $organization->organization_description,
                'custom_domain' => $organization->custom_domain,
                'subdomain' => $organization->subdomain,
                'slug' => $organization->slug,
                'primary_color' => $settings->primary_color ?? '#007aff',
                'secondary_color' => $settings->secondary_color ?? '#6a90b9',
                'accent_color' => $settings->accent_color ?? '#28a745',
                'organization_logo_url' => $organization->organization_logo_url 
                    ? asset('storage/' . $organization->organization_logo_url)
                    : null,
                'organization_favicon_url' => $settings->favicon 
                    ? asset('storage/' . $settings->favicon)
                    : null,
                'login_template' => $settings->login_template ?? 'minimal-1',
                'login_banner_url' => $settings->login_banner 
                    ? asset('storage/' . $settings->login_banner)
                    : null,
                'whitelabel_enabled' => $settings->whitelabel_enabled ?? false,
                'subscription_plan' => $organization->subscription_plan ?? 'basic',
                'max_users' => $organization->max_users ?? -1,
                'max_courses' => $organization->max_courses ?? -1,
                'max_certificates' => $organization->max_certificates ?? -1,
                'status' => $organization->status,
                'created_at' => $organization->created_at,
                'updated_at' => $organization->updated_at,
            ]
        ]
    ]);
}
```

---

## Application des Modèles de Connexion dans le Frontend

Le frontend doit appliquer le modèle de connexion sélectionné lors de l'affichage de la page de login. Voici comment les différents modèles doivent être appliqués :

### Modèle "minimal-1" (Minimaliste)

- Formulaire centré sur la page
- Fond uni ou dégradé subtil
- Pas d'image de fond
- Design épuré et moderne

### Modèle "illustrated-1" (Avec illustration)

- Formulaire avec illustrations décoratives
- Éléments graphiques autour du formulaire
- Couleurs vives et modernes
- Design engageant

### Modèle "background-1" (Avec arrière-plan)

- Utilise `login_banner_url` comme image de fond
- Overlay sombre pour la lisibilité du texte
- Formulaire superposé sur l'image
- Design immersif

---

## Routes

```php
// Routes publiques (pour la page de login)
Route::get('/api/organization/login-settings', [WhiteLabelController::class, 'getLoginSettings']);

// Routes protégées
Route::middleware(['auth:sanctum'])->group(function () {
    Route::prefix('organization/white-label')->group(function () {
        Route::get('/login-templates', [WhiteLabelController::class, 'getLoginTemplates']);
        Route::post('/upload-login-banner', [WhiteLabelController::class, 'uploadLoginBanner']);
    });
});
```

---

## Validation

### Upload de Bannière

- **Format:** JPG, JPEG, PNG, WEBP uniquement
- **Taille maximale:** 5MB
- **Dimensions recommandées:** 1920x1080px (16:9) ou 1920x1200px
- **Ratio:** 16:9 recommandé pour une meilleure compatibilité

### Modèle de Connexion

- **Valeurs acceptées:** ID d'un modèle existant dans la table `login_templates`
- **Vérification:** S'assurer que le modèle existe et est actif avant de le sauvegarder

---

## Notes Importantes

1. **Bannière de connexion** : L'image uploadée remplace l'image de fond par défaut sur la page de login. Si aucun modèle n'est sélectionné ou si le modèle est "background-1", cette bannière sera utilisée.

2. **Modèle de connexion** : Le modèle sélectionné détermine le layout et le style de la page de login. Le frontend doit appliquer les styles CSS appropriés selon le modèle.

3. **Fallback** : Si aucun modèle n'est configuré, utiliser "minimal-1" par défaut.

4. **Performance** : Les images de bannière doivent être optimisées (compression, formats modernes) pour un chargement rapide.

5. **Sécurité** : Valider et sanitizer tous les uploads d'images pour éviter les vulnérabilités.

---

## Exemple d'Utilisation Frontend

```typescript
// Dans la page de login
const { organization } = useOrganization();
const loginTemplate = organization?.login_template || 'minimal-1';
const loginBanner = organization?.login_banner_url;

// Appliquer le modèle
<div className={`login-page login-template-${loginTemplate}`}>
  {loginTemplate === 'background-1' && loginBanner && (
    <img src={loginBanner} alt="Login background" className="login-background" />
  )}
  {/* Reste du formulaire */}
</div>
```

---

## Migration

Pour ajouter les colonnes nécessaires :

```php
// Migration: add_login_settings_to_white_label_settings
Schema::table('white_label_settings', function (Blueprint $table) {
    $table->string('login_template', 255)->nullable()->after('accent_color');
    $table->string('login_banner', 255)->nullable()->after('login_template');
});
```

Pour créer la table des modèles :

```php
// Migration: create_login_templates_table
Schema::create('login_templates', function (Blueprint $table) {
    $table->string('id', 255)->primary();
    $table->string('name', 255);
    $table->text('description')->nullable();
    $table->enum('type', ['minimal', 'illustrated', 'background'])->default('minimal');
    $table->string('preview_url', 500)->nullable();
    $table->string('preview_path', 500)->nullable();
    $table->boolean('is_active')->default(true);
    $table->timestamps();
    
    $table->index('type');
    $table->index('is_active');
});
```

