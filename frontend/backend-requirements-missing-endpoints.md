# Endpoints Backend Manquants - White Label

## Vue d'ensemble

Le frontend appelle deux endpoints qui retournent actuellement des erreurs 404. Ces endpoints doivent être créés côté backend.

## 1. Endpoint GET `/api/organization/white-label/server-info`

### Erreur actuelle
```
GET http://localhost:8000/api/organization/white-label/server-info 404 (Not Found)
```

### Objectif
Cet endpoint retourne l'adresse IP du serveur, nécessaire pour la configuration DNS dans l'onglet "URL personnalisé".

### Structure de réponse attendue

```json
{
  "success": true,
  "data": {
    "server_ip": "192.168.1.100"
  }
}
```

### Exemple de code backend (Laravel)

```php
// routes/api.php
Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('/organization/white-label/server-info', [WhiteLabelController::class, 'getServerInfo']);
});

// app/Http/Controllers/WhiteLabelController.php
public function getServerInfo()
{
    try {
        // Option 1: Récupérer l'IP depuis la configuration
        $serverIp = config('app.server_ip');
        
        // Option 2: Récupérer l'IP depuis une variable d'environnement
        $serverIp = env('SERVER_IP');
        
        // Option 3: Détecter automatiquement l'IP du serveur
        // Note: Cette méthode peut ne pas fonctionner dans tous les environnements
        $serverIp = $_SERVER['SERVER_ADDR'] ?? request()->server('SERVER_ADDR');
        
        // Option 4: Utiliser l'IP publique si disponible
        // Vous pouvez utiliser un service externe ou stocker l'IP en base de données
        
        if (!$serverIp) {
            // Fallback: utiliser l'IP locale
            $serverIp = '127.0.0.1';
        }
        
        return response()->json([
            'success' => true,
            'data' => [
                'server_ip' => $serverIp
            ]
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'message' => 'Erreur lors de la récupération de l\'IP du serveur',
            'data' => null
        ], 500);
    }
}
```

### Configuration recommandée

Ajoutez dans votre fichier `.env` :
```env
SERVER_IP=192.168.1.100
```

Ou dans `config/app.php` :
```php
'server_ip' => env('SERVER_IP', '127.0.0.1'),
```

### Notes importantes

1. **Sécurité** : Cet endpoint doit être protégé par authentification
2. **IP publique vs privée** : Déterminez si vous avez besoin de l'IP publique ou privée
3. **Environnements multiples** : L'IP peut varier selon l'environnement (dev, staging, production)
4. **Dynamique** : L'IP peut changer, considérez une mise à jour automatique

## 2. Endpoint GET `/api/organization/white-label/login-templates`

### Erreur actuelle
```
GET http://localhost:8000/api/organization/white-label/login-templates 404 (Not Found)
```

### Objectif
Cet endpoint retourne la liste des modèles de connexion disponibles pour la sélection dans le modal.

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

### Exemple de code backend (Laravel)

```php
// routes/api.php
Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('/organization/white-label/login-templates', [WhiteLabelController::class, 'getLoginTemplates']);
});

// app/Http/Controllers/WhiteLabelController.php
public function getLoginTemplates()
{
    try {
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
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'message' => 'Erreur lors de la récupération des templates',
            'data' => [
                'templates' => []
            ]
        ], 500);
    }
}
```

### Migration de base de données

```php
// database/migrations/XXXX_XX_XX_create_login_templates_table.php
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

### Seeder pour créer les templates par défaut

```php
// database/seeders/LoginTemplateSeeder.php
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

### Stockage des images de prévisualisation

1. Créez le dossier : `storage/app/public/templates/login/`
2. Placez les 4 images de prévisualisation :
   - `minimal-1.png`
   - `illustrated-1.png`
   - `line-art-1.png`
   - `interior-1.png`
3. Créez le lien symbolique : `php artisan storage:link`

## 3. Résumé des actions requises

### Pour `/api/organization/white-label/server-info`

1. ✅ Créer la route dans `routes/api.php`
2. ✅ Créer la méthode `getServerInfo()` dans le controller
3. ✅ Ajouter `SERVER_IP` dans le fichier `.env`
4. ✅ Tester l'endpoint

### Pour `/api/organization/white-label/login-templates`

1. ✅ Créer la migration pour la table `login_templates`
2. ✅ Créer le modèle `LoginTemplate`
3. ✅ Créer le seeder avec les 4 templates par défaut
4. ✅ Créer la route dans `routes/api.php`
5. ✅ Créer la méthode `getLoginTemplates()` dans le controller
6. ✅ Ajouter les 4 images de prévisualisation dans `storage/app/public/templates/login/`
7. ✅ Créer le lien symbolique : `php artisan storage:link`
8. ✅ Exécuter les migrations et seeders : `php artisan migrate --seed`
9. ✅ Tester l'endpoint

## 4. Tests recommandés

### Test pour server-info

```bash
curl -X GET http://localhost:8000/api/organization/white-label/server-info \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Accept: application/json"
```

Réponse attendue :
```json
{
  "success": true,
  "data": {
    "server_ip": "192.168.1.100"
  }
}
```

### Test pour login-templates

```bash
curl -X GET http://localhost:8000/api/organization/white-label/login-templates \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Accept: application/json"
```

Réponse attendue :
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
      ...
    ]
  }
}
```

## 5. Gestion des erreurs côté frontend

Le frontend gère déjà ces erreurs avec des fallbacks :

1. **server-info** : Si l'endpoint échoue, l'IP n'est pas affichée (pas bloquant)
2. **login-templates** : Si l'endpoint échoue, le frontend utilise des templates par défaut (pas bloquant)

Cependant, pour une meilleure expérience utilisateur, il est recommandé d'implémenter ces endpoints.

## 6. Notes de sécurité

- Les deux endpoints doivent être protégés par authentification
- Vérifiez que l'utilisateur a les permissions nécessaires
- Pour `server-info`, considérez si l'IP doit être publique ou privée
- Pour `login-templates`, assurez-vous que seuls les templates actifs sont retournés

