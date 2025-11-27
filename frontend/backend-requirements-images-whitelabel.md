# Modifications Backend Requises pour l'Affichage des Images White Label

## Vue d'ensemble

Le frontend attend que le backend retourne des URLs complètes pour les images uploadées dans la réponse de l'API `getWhiteLabelSettings()`. Voici les modifications nécessaires.

## 1. Endpoint GET `/api/organization/whitelabel`

### Structure de réponse attendue

Le frontend attend que la réponse contienne les champs suivants dans `response.data` :

```json
{
  "success": true,
  "data": {
    "primary_color": "#007aff",
    "secondary_color": "#6a90b9",
    "accent_color": "#28a745",
    "login_template": "minimal-1",
    "login_banner": "nom_fichier.ico",
    "login_banner_url": "http://localhost:8000/uploads/organization/123/login_banner.ico",
    "logo_square": "nom_fichier.png",
    "logo_square_url": "http://localhost:8000/uploads/organization/123/logo_square.png",
    "logo_wide": "nom_fichier.png",
    "logo_wide_url": "http://localhost:8000/uploads/organization/123/logo_wide.png",
    "favicon": "nom_fichier.ico",
    "favicon_url": "http://localhost:8000/uploads/organization/123/favicon.ico",
    // ... autres champs
  }
}
```

### Champs requis pour l'affichage des images

- **`login_banner_url`** : URL complète de la bannière de connexion
- **`logo_square_url`** : URL complète du logo carré
- **`logo_wide_url`** : URL complète du logo large
- **`favicon_url`** : URL complète du favicon

## 2. Endpoint POST `/api/organization/white-label/upload-login-banner`

### Requête
- **Content-Type**: `multipart/form-data`
- **Champ**: `login_banner` (fichier)

### Réponse attendue
```json
{
  "success": true,
  "data": {
    "login_banner": "nom_fichier.ico",
    "login_banner_url": "http://localhost:8000/uploads/organization/123/login_banner.ico"
  },
  "message": "Bannière uploadée avec succès"
}
```

### Actions backend requises
1. Sauvegarder le fichier dans un dossier accessible (ex: `storage/uploads/organization/{organization_id}/`)
2. Générer l'URL complète de l'image
3. Mettre à jour la base de données avec le nom du fichier ET l'URL complète
4. Retourner l'URL complète dans la réponse

## 3. Endpoint POST `/api/organization/white-label/upload-logo`

### Requête
- **Content-Type**: `multipart/form-data`
- **Champ**: `logo` (fichier)

### Réponse attendue
```json
{
  "success": true,
  "data": {
    "logo_square": "nom_fichier.png",  // Si c'est un logo carré
    "logo_square_url": "http://localhost:8000/uploads/organization/123/logo_square.png",
    "logo_wide": "nom_fichier.png",    // Si c'est un logo large
    "logo_wide_url": "http://localhost:8000/uploads/organization/123/logo_wide.png"
  },
  "message": "Logo uploadé avec succès"
}
```

### Actions backend requises
1. Détecter si c'est un logo carré ou large (peut-être via un paramètre `type` ou via les dimensions)
2. Sauvegarder le fichier dans `storage/uploads/organization/{organization_id}/`
3. Générer l'URL complète
4. Mettre à jour la base de données avec le nom du fichier ET l'URL complète
5. Retourner l'URL complète dans la réponse

## 4. Endpoint POST `/api/organization/white-label/upload-favicon`

### Requête
- **Content-Type**: `multipart/form-data`
- **Champ**: `favicon` (fichier)

### Réponse attendue
```json
{
  "success": true,
  "data": {
    "favicon": "nom_fichier.ico",
    "favicon_url": "http://localhost:8000/uploads/organization/123/favicon.ico"
  },
  "message": "Favicon uploadé avec succès"
}
```

## 5. Format des URLs

### Options acceptables par le frontend

Le frontend utilise la fonction `fixImageUrl()` qui accepte plusieurs formats :

1. **URL complète avec localhost:8000** (recommandé pour le développement)
   ```
   http://localhost:8000/uploads/organization/123/image.png
   ```

2. **URL relative avec /uploads**
   ```
   /uploads/organization/123/image.png
   ```

3. **Chemin relatif sans slash initial**
   ```
   uploads/organization/123/image.png
   ```

4. **Nom de fichier seul** (sera préfixé avec `/uploads/`)
   ```
   image.png
   ```

### Recommandation

Pour le développement, utilisez des URLs complètes avec `http://localhost:8000` :
```php
$baseUrl = 'http://localhost:8000';
$imageUrl = $baseUrl . '/uploads/organization/' . $organizationId . '/' . $filename;
```

Pour la production, utilisez l'URL de votre domaine :
```php
$baseUrl = config('app.url'); // ou votre URL de base
$imageUrl = $baseUrl . '/uploads/organization/' . $organizationId . '/' . $filename;
```

## 6. Structure de la base de données

### Table suggérée (exemple pour Laravel)

```php
Schema::create('white_label_settings', function (Blueprint $table) {
    $table->id();
    $table->unsignedBigInteger('organization_id');
    
    // Couleurs
    $table->string('primary_color')->nullable();
    $table->string('secondary_color')->nullable();
    $table->string('accent_color')->nullable();
    
    // Modèle de connexion
    $table->string('login_template')->nullable();
    
    // Bannière de connexion
    $table->string('login_banner')->nullable(); // Nom du fichier
    $table->string('login_banner_url')->nullable(); // URL complète
    
    // Logos
    $table->string('logo_square')->nullable(); // Nom du fichier
    $table->string('logo_square_url')->nullable(); // URL complète
    $table->string('logo_wide')->nullable(); // Nom du fichier
    $table->string('logo_wide_url')->nullable(); // URL complète
    
    // Favicon
    $table->string('favicon')->nullable(); // Nom du fichier
    $table->string('favicon_url')->nullable(); // URL complète
    
    $table->timestamps();
    
    $table->foreign('organization_id')->references('id')->on('organizations');
});
```

## 7. Exemple de code backend (Laravel)

### Controller pour upload de bannière

```php
public function uploadLoginBanner(Request $request)
{
    $request->validate([
        'login_banner' => 'required|image|mimes:ico,png|max:2048',
    ]);
    
    $organization = auth()->user()->organization;
    
    // Supprimer l'ancienne bannière si elle existe
    if ($organization->whiteLabelSettings->login_banner) {
        Storage::delete('uploads/organization/' . $organization->id . '/' . $organization->whiteLabelSettings->login_banner);
    }
    
    // Sauvegarder le nouveau fichier
    $file = $request->file('login_banner');
    $filename = 'login_banner_' . time() . '.' . $file->getClientOriginalExtension();
    $path = $file->storeAs('uploads/organization/' . $organization->id, $filename, 'public');
    
    // Générer l'URL complète
    $baseUrl = config('app.url', 'http://localhost:8000');
    $imageUrl = $baseUrl . '/storage/' . $path;
    
    // Mettre à jour la base de données
    $settings = $organization->whiteLabelSettings;
    $settings->login_banner = $filename;
    $settings->login_banner_url = $imageUrl;
    $settings->save();
    
    return response()->json([
        'success' => true,
        'data' => [
            'login_banner' => $filename,
            'login_banner_url' => $imageUrl
        ],
        'message' => 'Bannière uploadée avec succès'
    ]);
}
```

### Méthode pour retourner les settings avec URLs

```php
public function getWhiteLabelSettings()
{
    $organization = auth()->user()->organization;
    $settings = $organization->whiteLabelSettings;
    
    // S'assurer que les URLs sont complètes
    $baseUrl = config('app.url', 'http://localhost:8000');
    
    if ($settings->login_banner && !$settings->login_banner_url) {
        $settings->login_banner_url = $baseUrl . '/storage/uploads/organization/' . $organization->id . '/' . $settings->login_banner;
    }
    
    if ($settings->logo_square && !$settings->logo_square_url) {
        $settings->logo_square_url = $baseUrl . '/storage/uploads/organization/' . $organization->id . '/' . $settings->logo_square;
    }
    
    if ($settings->logo_wide && !$settings->logo_wide_url) {
        $settings->logo_wide_url = $baseUrl . '/storage/uploads/organization/' . $organization->id . '/' . $settings->logo_wide;
    }
    
    if ($settings->favicon && !$settings->favicon_url) {
        $settings->favicon_url = $baseUrl . '/storage/uploads/organization/' . $organization->id . '/' . $settings->favicon;
    }
    
    return response()->json([
        'success' => true,
        'data' => $settings,
        'message' => 'Settings récupérés avec succès'
    ]);
}
```

## 8. Points importants

1. **Toujours retourner les URLs complètes** dans la réponse de `getWhiteLabelSettings()`
2. **Générer les URLs après l'upload** et les sauvegarder en base de données
3. **Gérer les migrations** pour ajouter les colonnes `*_url` si elles n'existent pas
4. **Vérifier les permissions** pour s'assurer que les fichiers sont accessibles publiquement ou via authentification
5. **Nettoyer les anciens fichiers** lors du remplacement d'une image

## 9. Tests recommandés

1. Uploader une bannière et vérifier que `login_banner_url` est retourné
2. Uploader un logo carré et vérifier que `logo_square_url` est retourné
3. Uploader un logo large et vérifier que `logo_wide_url` est retourné
4. Vérifier que les URLs sont accessibles (pas de 404)
5. Vérifier que les images s'affichent correctement dans le frontend


