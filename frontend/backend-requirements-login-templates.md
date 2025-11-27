# Modifications Backend Requises pour les Modèles de Connexion

## Vue d'ensemble

Le frontend affiche un modal de sélection de modèles de connexion avec une grille 2x2. Le backend doit fournir les templates avec leurs prévisualisations.

## 1. Endpoint GET `/api/organization/white-label/login-templates`

### Structure de réponse attendue

```json
{
  "success": true,
  "data": {
    "templates": [
      {
        "id": "minimal-1",
        "name": "Minimaliste",
        "description": "Design épuré et moderne",
        "type": "minimal",
        "preview_url": "http://localhost:8000/storage/templates/login/minimal-1.png"
      },
      {
        "id": "illustrated-1",
        "name": "Avec illustration",
        "description": "Design avec illustration artistique",
        "type": "illustrated",
        "preview_url": "http://localhost:8000/storage/templates/login/illustrated-1.png"
      },
      {
        "id": "line-art-1",
        "name": "Line Art",
        "description": "Design minimaliste avec dessin au trait",
        "type": "line_art",
        "preview_url": "http://localhost:8000/storage/templates/login/line-art-1.png"
      },
      {
        "id": "interior-1",
        "name": "Intérieur",
        "description": "Design avec photo d'intérieur",
        "type": "interior",
        "preview_url": "http://localhost:8000/storage/templates/login/interior-1.png"
      }
    ]
  }
}
```

### Champs requis pour chaque template

- **`id`** (string, requis) : Identifiant unique du template (ex: "minimal-1", "illustrated-1")
- **`name`** (string, requis) : Nom du template affiché dans l'interface
- **`description`** (string, optionnel) : Description du template
- **`type`** (string, requis) : Type de template (`minimal`, `illustrated`, `line_art`, `interior`, etc.)
- **`preview_url`** (string, requis) : URL complète de l'image de prévisualisation

## 2. Format des URLs de prévisualisation

### Options acceptables

1. **URL complète avec localhost:8000** (recommandé pour le développement)
   ```
   http://localhost:8000/storage/templates/login/minimal-1.png
   ```

2. **URL relative avec /storage**
   ```
   /storage/templates/login/minimal-1.png
   ```

3. **Chemin relatif sans slash initial**
   ```
   storage/templates/login/minimal-1.png
   ```

### Recommandation

Pour le développement, utilisez des URLs complètes :
```php
$baseUrl = 'http://localhost:8000';
$previewUrl = $baseUrl . '/storage/templates/login/' . $template->preview_filename;
```

Pour la production :
```php
$baseUrl = config('app.url');
$previewUrl = $baseUrl . '/storage/templates/login/' . $template->preview_filename;
```

## 3. Structure de la base de données

### Table suggérée (exemple pour Laravel)

```php
Schema::create('login_templates', function (Blueprint $table) {
    $table->id();
    $table->string('template_id')->unique(); // Ex: "minimal-1"
    $table->string('name'); // Ex: "Minimaliste"
    $table->text('description')->nullable();
    $table->string('type'); // Ex: "minimal", "illustrated", "line_art", "interior"
    $table->string('preview_filename')->nullable(); // Ex: "minimal-1.png"
    $table->string('preview_url')->nullable(); // URL complète
    $table->boolean('is_active')->default(true);
    $table->integer('sort_order')->default(0);
    $table->timestamps();
});
```

## 4. Exemple de code backend (Laravel)

### Controller

```php
public function getLoginTemplates()
{
    $templates = LoginTemplate::where('is_active', true)
        ->orderBy('sort_order')
        ->get()
        ->map(function ($template) {
            // Générer l'URL complète si elle n'existe pas
            if (!$template->preview_url && $template->preview_filename) {
                $baseUrl = config('app.url', 'http://localhost:8000');
                $template->preview_url = $baseUrl . '/storage/templates/login/' . $template->preview_filename;
            }
            
            return [
                'id' => $template->template_id,
                'name' => $template->name,
                'description' => $template->description,
                'type' => $template->type,
                'preview_url' => $template->preview_url,
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

### Seeder pour créer les templates par défaut

```php
public function run()
{
    $templates = [
        [
            'template_id' => 'minimal-1',
            'name' => 'Minimaliste',
            'description' => 'Design épuré et moderne',
            'type' => 'minimal',
            'preview_filename' => 'minimal-1.png',
            'sort_order' => 1,
        ],
        [
            'template_id' => 'illustrated-1',
            'name' => 'Avec illustration',
            'description' => 'Design avec illustration artistique',
            'type' => 'illustrated',
            'preview_filename' => 'illustrated-1.png',
            'sort_order' => 2,
        ],
        [
            'template_id' => 'line-art-1',
            'name' => 'Line Art',
            'description' => 'Design minimaliste avec dessin au trait',
            'type' => 'line_art',
            'preview_filename' => 'line-art-1.png',
            'sort_order' => 3,
        ],
        [
            'template_id' => 'interior-1',
            'name' => 'Intérieur',
            'description' => 'Design avec photo d\'intérieur',
            'type' => 'interior',
            'preview_filename' => 'interior-1.png',
            'sort_order' => 4,
        ],
    ];
    
    foreach ($templates as $template) {
        LoginTemplate::updateOrCreate(
            ['template_id' => $template['template_id']],
            $template
        );
    }
}
```

## 5. Stockage des images de prévisualisation

### Structure de dossiers recommandée

```
storage/
  app/
    public/
      templates/
        login/
          minimal-1.png
          illustrated-1.png
          line-art-1.png
          interior-1.png
```

### Lien symbolique (Laravel)

Assurez-vous que le lien symbolique est créé :
```bash
php artisan storage:link
```

Cela créera un lien de `storage/app/public` vers `public/storage`.

## 6. Endpoint pour sauvegarder le template sélectionné

### Endpoint PUT `/api/organization/whitelabel`

Le frontend envoie le template sélectionné via :
```json
{
  "login_template": "minimal-1"
}
```

### Exemple de code backend

```php
public function updateWhiteLabelSettings(Request $request)
{
    $organization = auth()->user()->organization;
    $settings = $organization->whiteLabelSettings;
    
    if ($request->has('login_template')) {
        $settings->login_template = $request->login_template;
    }
    
    // ... autres champs
    
    $settings->save();
    
    return response()->json([
        'success' => true,
        'data' => $settings,
        'message' => 'Paramètres mis à jour avec succès'
    ]);
}
```

## 7. Points importants

1. **Toujours retourner les URLs complètes** dans la réponse de `getLoginTemplates()`
2. **Générer les URLs** si elles ne sont pas stockées en base de données
3. **Vérifier que les images de prévisualisation sont accessibles** (pas de 404)
4. **Limiter à 4 templates** pour correspondre au design Figma (grille 2x2)
5. **Ordre de tri** : Utiliser `sort_order` pour contrôler l'ordre d'affichage

## 8. Images de prévisualisation requises

Le backend doit fournir 4 images de prévisualisation correspondant aux 4 modèles :

1. **minimal-1.png** : Design minimaliste (formulaire simple)
2. **illustrated-1.png** : Design avec illustration artistique (formulaire avec image abstraite)
3. **line-art-1.png** : Design avec dessin au trait (formulaire avec illustration line art)
4. **interior-1.png** : Design avec photo d'intérieur (formulaire avec photo d'intérieur)

### Dimensions recommandées

- **Ratio** : 16:9 (aspect-video)
- **Largeur minimale** : 800px
- **Format** : PNG ou JPG
- **Taille optimale** : 1200x675px

## 9. Tests recommandés

1. Vérifier que l'endpoint retourne exactement 4 templates
2. Vérifier que chaque template a une `preview_url` valide
3. Vérifier que les URLs d'images sont accessibles (pas de 404)
4. Vérifier que le template sélectionné est sauvegardé correctement
5. Vérifier que le template sélectionné est retourné dans `getWhiteLabelSettings()`

## 10. Migration de base de données

```php
Schema::create('login_templates', function (Blueprint $table) {
    $table->id();
    $table->string('template_id')->unique();
    $table->string('name');
    $table->text('description')->nullable();
    $table->string('type');
    $table->string('preview_filename')->nullable();
    $table->string('preview_url')->nullable();
    $table->boolean('is_active')->default(true);
    $table->integer('sort_order')->default(0);
    $table->timestamps();
});
```

## 11. Fallback si l'API échoue

Le frontend a un fallback qui retourne 3 templates par défaut si l'API échoue. Assurez-vous que l'API fonctionne correctement pour éviter d'utiliser ce fallback.

