# Requirements Backend Complet - Step 1 Création de Cours

## 📋 Vue d'ensemble

Ce document décrit **TOUTES** les modifications et ajouts nécessaires au backend pour supporter complètement le Step 1 de création de cours, incluant :
- Création de catégories personnalisées
- Nouveaux champs pour les sections additionnelles
- Gestion des pratiques de formation (Actions de formation)

---

## 🔴 Phase 1 : Modifications critiques (À faire immédiatement)

### 1. Création de catégories personnalisées par l'utilisateur

#### 1.1 Migration de base de données

```sql
-- Migration: Add custom categories support
BEGIN;

-- Add columns
ALTER TABLE categories 
  ADD COLUMN IF NOT EXISTS is_custom BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS organization_id INTEGER NULL;

-- Add foreign key
ALTER TABLE categories
  ADD CONSTRAINT fk_categories_organization 
  FOREIGN KEY (organization_id) 
  REFERENCES organizations(id) 
  ON DELETE CASCADE;

-- Add constraint: custom categories must have organization_id
ALTER TABLE categories
  ADD CONSTRAINT chk_custom_has_organization 
  CHECK (
    (is_custom = FALSE AND organization_id IS NULL) OR
    (is_custom = TRUE AND organization_id IS NOT NULL)
  );

-- Add unique constraint for custom category names per organization
CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_org_name_unique 
  ON categories(organization_id, LOWER(name)) 
  WHERE is_custom = TRUE;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_categories_organization_custom 
  ON categories(organization_id, is_custom) 
  WHERE is_custom = TRUE;

COMMIT;
```

#### 1.2 Endpoint : Créer une catégorie personnalisée

**Route** : `POST /api/courses/categories/custom`

**Headers** :
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Body** :
```json
{
  "name": "Ma Catégorie Personnalisée",
  "description": "Description optionnelle",
  "organization_id": 123
}
```

**Validation** :
- `name` : Requis, string, min 2 caractères, max 100 caractères
- `description` : Optionnel, string, max 500 caractères
- `organization_id` : Requis, integer, doit correspondre à l'organisation de l'utilisateur

**Limites** :
- Un utilisateur/organisation peut créer **maximum 2 catégories personnalisées**
- Vérifier le nombre de catégories personnalisées existantes avant création
- Retourner erreur si limite atteinte

**Response Success (201)** :
```json
{
  "success": true,
  "message": "Catégorie créée avec succès",
  "data": {
    "id": 456,
    "name": "Ma Catégorie Personnalisée",
    "description": "Description optionnelle",
    "slug": "ma-categorie-personnalisee",
    "organization_id": 123,
    "is_custom": true,
    "created_at": "2025-01-15T10:30:00Z",
    "updated_at": "2025-01-15T10:30:00Z"
  }
}
```

**Response Error (400)** :
```json
{
  "success": false,
  "message": "Limite de catégories personnalisées atteinte",
  "error": {
    "code": "CATEGORY_LIMIT_REACHED",
    "details": "Vous avez atteint la limite de 2 catégories personnalisées. Veuillez supprimer une catégorie existante avant d'en créer une nouvelle."
  }
}
```

#### 1.3 Endpoint : Lister les catégories (incluant personnalisées)

**Route** : `GET /api/courses/categories`

**Query Parameters** :
- `include_custom` : boolean (default: true) - Inclure les catégories personnalisées
- `organization_id` : integer (optionnel) - Filtrer par organisation

**Response Success (200)** :
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Catégorie Standard",
      "slug": "categorie-standard",
      "is_custom": false,
      "parent_id": null,
      "created_at": "2024-01-01T00:00:00Z"
    },
    {
      "id": 456,
      "name": "Ma Catégorie Personnalisée",
      "slug": "ma-categorie-personnalisee",
      "is_custom": true,
      "organization_id": 123,
      "parent_id": null,
      "created_at": "2025-01-15T10:30:00Z"
    }
  ]
}
```

#### 1.4 Endpoint : Modifier une catégorie personnalisée

**Route** : `PUT /api/courses/categories/custom/{id}`

**Body** :
```json
{
  "name": "Nouveau nom",
  "description": "Nouvelle description"
}
```

**Response Success (200)** :
```json
{
  "success": true,
  "message": "Catégorie modifiée avec succès",
  "data": {
    "id": 456,
    "name": "Nouveau nom",
    "description": "Nouvelle description",
    "updated_at": "2025-01-15T11:00:00Z"
  }
}
```

#### 1.5 Endpoint : Supprimer une catégorie personnalisée

**Route** : `DELETE /api/courses/categories/custom/{id}`

**Validation** :
- Vérifier que la catégorie appartient à l'organisation de l'utilisateur
- Vérifier qu'aucun cours n'utilise cette catégorie
- Retourner erreur si des cours utilisent la catégorie

**Response Success (200)** :
```json
{
  "success": true,
  "message": "Catégorie supprimée avec succès"
}
```

**Response Error (400)** :
```json
{
  "success": false,
  "message": "Impossible de supprimer la catégorie",
  "error": {
    "code": "CATEGORY_IN_USE",
    "details": "Cette catégorie est utilisée par 5 cours. Veuillez modifier ces cours avant de supprimer la catégorie."
  }
}
```

---

### 2. Nouveaux champs dans la table `courses`

#### 2.1 Migration SQL

```sql
-- Migration: Add missing fields to courses table
BEGIN;

-- Add new text fields for course sections
ALTER TABLE courses 
  ADD COLUMN IF NOT EXISTS evaluation_modalities TEXT NULL,
  ADD COLUMN IF NOT EXISTS access_modalities TEXT NULL,
  ADD COLUMN IF NOT EXISTS accessibility TEXT NULL,
  ADD COLUMN IF NOT EXISTS contacts TEXT NULL,
  ADD COLUMN IF NOT EXISTS update_date TEXT NULL;

-- Add comments for documentation
COMMENT ON COLUMN courses.evaluation_modalities IS 'Modalités d''évaluation du cours (contenu riche HTML)';
COMMENT ON COLUMN courses.access_modalities IS 'Modalités et délais d''accès au cours (contenu riche HTML)';
COMMENT ON COLUMN courses.accessibility IS 'Accessibilité aux personnes handicapées (contenu riche HTML)';
COMMENT ON COLUMN courses.contacts IS 'Informations de contact (contenu riche HTML, format liste)';
COMMENT ON COLUMN courses.update_date IS 'Date de mise à jour du cours (texte formaté)';

COMMIT;
```

#### 2.2 Champs ajoutés

| Champ | Type | Nullable | Description |
|-------|------|----------|-------------|
| `evaluation_modalities` | TEXT | YES | Modalités D'évaluation (HTML) |
| `access_modalities` | TEXT | YES | Modalités Et Délais D'accès (HTML) |
| `accessibility` | TEXT | YES | Accessibilité Aux Personnes Handicapées (HTML) |
| `contacts` | TEXT | YES | Contacts (HTML, format liste) |
| `update_date` | TEXT | YES | Date De MAJ (texte formaté) |

---

### 3. Gestion des pratiques de formation (Actions de formation)

#### 3.1 Table `formation_practices` (nouvelle)

```sql
CREATE TABLE IF NOT EXISTS formation_practices (
  id SERIAL PRIMARY KEY,
  uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default practices
INSERT INTO formation_practices (code, name) VALUES
  ('actions', 'Actions De Formation'),
  ('bdc', 'Bilan De Compétences (BDC)'),
  ('vae', 'Validations Des Acquis De L''expériences (VAE)'),
  ('cfa', 'Centre De Formation D''apprentis (CFA)')
ON CONFLICT (code) DO NOTHING;

CREATE INDEX idx_formation_practices_code ON formation_practices(code);
CREATE INDEX idx_formation_practices_active ON formation_practices(is_active);
```

#### 3.2 Table de liaison `course_formation_practices`

```sql
CREATE TABLE IF NOT EXISTS course_formation_practices (
  id SERIAL PRIMARY KEY,
  course_uuid UUID NOT NULL,
  practice_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (course_uuid) REFERENCES courses(uuid) ON DELETE CASCADE,
  FOREIGN KEY (practice_id) REFERENCES formation_practices(id) ON DELETE CASCADE,
  UNIQUE(course_uuid, practice_id)
);

CREATE INDEX idx_course_practices_course ON course_formation_practices(course_uuid);
CREATE INDEX idx_course_practices_practice ON course_formation_practices(practice_id);
```

#### 3.3 Endpoint : Lister les pratiques de formation

**Route** : `GET /api/courses/formation-practices`

**Response Success (200)** :
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "code": "actions",
      "name": "Actions De Formation",
      "description": null,
      "is_active": true
    },
    {
      "id": 2,
      "code": "bdc",
      "name": "Bilan De Compétences (BDC)",
      "description": null,
      "is_active": true
    },
    {
      "id": 3,
      "code": "vae",
      "name": "Validations Des Acquis De L'expériences (VAE)",
      "description": null,
      "is_active": true
    },
    {
      "id": 4,
      "code": "cfa",
      "name": "Centre De Formation D'apprentis (CFA)",
      "description": null,
      "is_active": true
    }
  ]
}
```

#### 3.4 Endpoint : Associer des pratiques à un cours

**Route** : `PUT /api/organization/courses/{uuid}/formation-practices`

**Body** :
```json
{
  "practice_ids": [1, 2, 3]
}
```

**Response Success (200)** :
```json
{
  "success": true,
  "message": "Pratiques de formation mises à jour",
  "data": {
    "course_uuid": "...",
    "practices": [
      {
        "id": 1,
        "code": "actions",
        "name": "Actions De Formation"
      },
      {
        "id": 2,
        "code": "bdc",
        "name": "Bilan De Compétences (BDC)"
      }
    ]
  }
}
```

#### 3.5 Endpoint : Récupérer les pratiques d'un cours

**Route** : `GET /api/organization/courses/{uuid}/formation-practices`

**Response Success (200)** :
```json
{
  "success": true,
  "data": {
    "course_uuid": "...",
    "practices": [
      {
        "id": 1,
        "code": "actions",
        "name": "Actions De Formation"
      }
    ]
  }
}
```

---

## 🔌 Modifications API requises

### 4. Endpoint : Créer/Mettre à jour un cours

**Route existante** : `POST /api/organization/courses` ou `PUT /api/organization/courses/{uuid}`

**Champs à ajouter dans le body** :

```json
{
  "title": "Mon Cours",
  "description": "...",
  "category_id": 1,
  "subcategory_id": 2,
  // ... autres champs existants ...
  "evaluation_modalities": "<p>Modalités d'évaluation...</p>",
  "access_modalities": "<p>Modalités d'accès...</p>",
  "accessibility": "<p>Accessibilité...</p>",
  "contacts": "<ul><li>Contact 1</li></ul>",
  "update_date": "2025-01-15",
  "formation_practice_ids": [1, 2]
}
```

**Validation** :
- Tous les nouveaux champs sont optionnels
- Si fournis, doivent être des strings (sauf `formation_practice_ids` qui est un array d'entiers)
- Peuvent contenir du HTML (contenu riche)
- `formation_practice_ids` : array d'entiers, chaque ID doit exister dans `formation_practices`

**Response** : Inclure les nouveaux champs dans la réponse

```json
{
  "success": true,
  "data": {
    "uuid": "...",
    "title": "Mon Cours",
    // ... autres champs ...
    "evaluation_modalities": "<p>...</p>",
    "access_modalities": "<p>...</p>",
    "accessibility": "<p>...</p>",
    "contacts": "<ul>...</ul>",
    "update_date": "2025-01-15",
    "formation_practices": [
      {
        "id": 1,
        "code": "actions",
        "name": "Actions De Formation"
      }
    ]
  }
}
```

### 5. Endpoint : Récupérer les détails d'un cours

**Route existante** : `GET /api/organization/courses/{uuid}`

**Modification** : Inclure les nouveaux champs dans la réponse

```json
{
  "success": true,
  "data": {
    "course": {
      // ... champs existants ...
      "evaluation_modalities": "<p>...</p>",
      "access_modalities": "<p>...</p>",
      "accessibility": "<p>...</p>",
      "contacts": "<ul>...</ul>",
      "update_date": "2025-01-15",
      "formation_practices": [
        {
          "id": 1,
          "code": "actions",
          "name": "Actions De Formation"
        }
      ]
    }
  }
}
```

### 6. Endpoint : Mettre à jour des champs spécifiques

**Option 1** : Ajouter un endpoint dédié pour ces sections

**Route** : `PUT /api/organization/courses/{uuid}/additional-info`

**Body** :
```json
{
  "evaluation_modalities": "<p>...</p>",
  "access_modalities": "<p>...</p>",
  "accessibility": "<p>...</p>",
  "contacts": "<ul>...</ul>",
  "update_date": "2025-01-15"
}
```

**Option 2** : Inclure dans l'endpoint de mise à jour existant

---

## 🗄️ Modèle de données (Laravel/Backend)

### Migration Laravel - Catégories personnalisées

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddCustomCategoriesToCategoriesTable extends Migration
{
    public function up()
    {
        Schema::table('categories', function (Blueprint $table) {
            $table->boolean('is_custom')->default(false)->after('is_feature');
            $table->unsignedBigInteger('organization_id')->nullable()->after('is_custom');
            
            $table->foreign('organization_id')
                  ->references('id')
                  ->on('organizations')
                  ->onDelete('cascade');
        });
        
        // Add unique constraint
        DB::statement('CREATE UNIQUE INDEX idx_categories_org_name_unique 
                      ON categories(organization_id, LOWER(name)) 
                      WHERE is_custom = TRUE');
        
        // Add index
        Schema::table('categories', function (Blueprint $table) {
            $table->index(['organization_id', 'is_custom'], 'idx_categories_organization_custom');
        });
    }

    public function down()
    {
        Schema::table('categories', function (Blueprint $table) {
            $table->dropForeign(['organization_id']);
            $table->dropIndex('idx_categories_organization_custom');
            $table->dropColumn(['is_custom', 'organization_id']);
        });
        
        DB::statement('DROP INDEX IF EXISTS idx_categories_org_name_unique');
    }
}
```

### Migration Laravel - Nouveaux champs cours

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddAdditionalFieldsToCoursesTable extends Migration
{
    public function up()
    {
        Schema::table('courses', function (Blueprint $table) {
            $table->text('evaluation_modalities')->nullable()->after('specifics');
            $table->text('access_modalities')->nullable()->after('evaluation_modalities');
            $table->text('accessibility')->nullable()->after('access_modalities');
            $table->text('contacts')->nullable()->after('accessibility');
            $table->text('update_date')->nullable()->after('contacts');
        });
    }

    public function down()
    {
        Schema::table('courses', function (Blueprint $table) {
            $table->dropColumn([
                'evaluation_modalities',
                'access_modalities',
                'accessibility',
                'contacts',
                'update_date'
            ]);
        });
    }
}
```

### Migration Laravel - Pratiques de formation

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateFormationPracticesTables extends Migration
{
    public function up()
    {
        // Table des pratiques
        Schema::create('formation_practices', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->string('code', 50)->unique();
            $table->string('name', 255);
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
        
        // Table de liaison
        Schema::create('course_formation_practices', function (Blueprint $table) {
            $table->id();
            $table->uuid('course_uuid');
            $table->unsignedBigInteger('practice_id');
            $table->timestamps();
            
            $table->foreign('course_uuid')
                  ->references('uuid')
                  ->on('courses')
                  ->onDelete('cascade');
                  
            $table->foreign('practice_id')
                  ->references('id')
                  ->on('formation_practices')
                  ->onDelete('cascade');
                  
            $table->unique(['course_uuid', 'practice_id']);
        });
        
        // Insert default practices
        DB::table('formation_practices')->insert([
            ['uuid' => Str::uuid(), 'code' => 'actions', 'name' => 'Actions De Formation', 'created_at' => now(), 'updated_at' => now()],
            ['uuid' => Str::uuid(), 'code' => 'bdc', 'name' => 'Bilan De Compétences (BDC)', 'created_at' => now(), 'updated_at' => now()],
            ['uuid' => Str::uuid(), 'code' => 'vae', 'name' => 'Validations Des Acquis De L\'expériences (VAE)', 'created_at' => now(), 'updated_at' => now()],
            ['uuid' => Str::uuid(), 'code' => 'cfa', 'name' => 'Centre De Formation D\'apprentis (CFA)', 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    public function down()
    {
        Schema::dropIfExists('course_formation_practices');
        Schema::dropIfExists('formation_practices');
    }
}
```

### Modèle Category (Laravel)

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Category extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'description',
        'parent_id',
        'is_feature',
        'is_custom',
        'organization_id',
    ];

    protected $casts = [
        'is_custom' => 'boolean',
        'is_feature' => 'boolean',
        'organization_id' => 'integer',
    ];

    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }
    
    public function courses()
    {
        return $this->hasMany(Course::class);
    }
    
    /**
     * Scope pour limiter à 2 catégories personnalisées par organisation
     */
    public static function canCreateCustom($organizationId)
    {
        return self::where('organization_id', $organizationId)
                   ->where('is_custom', true)
                   ->count() < 2;
    }
}
```

### Modèle Course (Laravel)

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Course extends Model
{
    protected $fillable = [
        // ... champs existants ...
        'evaluation_modalities',
        'access_modalities',
        'accessibility',
        'contacts',
        'update_date',
    ];

    protected $casts = [
        // ... casts existants ...
        'evaluation_modalities' => 'string',
        'access_modalities' => 'string',
        'accessibility' => 'string',
        'contacts' => 'string',
        'update_date' => 'string',
    ];
    
    /**
     * Relation avec les pratiques de formation
     */
    public function formationPractices()
    {
        return $this->belongsToMany(
            FormationPractice::class,
            'course_formation_practices',
            'course_uuid',
            'practice_id',
            'uuid',
            'id'
        );
    }
}
```

### Modèle FormationPractice (Laravel)

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FormationPractice extends Model
{
    protected $fillable = [
        'code',
        'name',
        'description',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];
    
    public function courses()
    {
        return $this->belongsToMany(
            Course::class,
            'course_formation_practices',
            'practice_id',
            'course_uuid',
            'id',
            'uuid'
        );
    }
}
```

### Validation (Request Laravel)

```php
<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateCourseRequest extends FormRequest
{
    public function rules()
    {
        return [
            // ... règles existantes ...
            'evaluation_modalities' => 'nullable|string',
            'access_modalities' => 'nullable|string',
            'accessibility' => 'nullable|string',
            'contacts' => 'nullable|string',
            'update_date' => 'nullable|string|max:255',
            'formation_practice_ids' => 'nullable|array',
            'formation_practice_ids.*' => 'integer|exists:formation_practices,id',
        ];
    }
}

class CreateCustomCategoryRequest extends FormRequest
{
    public function rules()
    {
        return [
            'name' => 'required|string|min:2|max:100',
            'description' => 'nullable|string|max:500',
            'organization_id' => 'required|integer|exists:organizations,id',
        ];
    }
    
    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            $organizationId = $this->input('organization_id');
            $customCount = Category::where('organization_id', $organizationId)
                ->where('is_custom', true)
                ->count();
                
            if ($customCount >= 2) {
                $validator->errors()->add(
                    'organization_id',
                    'Limite de 2 catégories personnalisées atteinte'
                );
            }
        });
    }
}
```

---

## 📊 Schéma de base de données complet

### Table `categories` (modifiée)

```
id                  INTEGER PRIMARY KEY
name                VARCHAR(255) NOT NULL
slug                VARCHAR(255) UNIQUE NOT NULL
description         TEXT
parent_id           INTEGER NULL (FK vers categories.id)
is_custom           BOOLEAN DEFAULT FALSE
organization_id     INTEGER NULL (FK vers organizations.id)
is_feature          BOOLEAN DEFAULT FALSE
created_at          TIMESTAMP
updated_at          TIMESTAMP

Constraints:
- is_custom = TRUE → organization_id IS NOT NULL
- is_custom = FALSE → organization_id IS NULL
- UNIQUE(organization_id, name) WHERE is_custom = TRUE
- Maximum 2 catégories personnalisées par organisation
```

### Table `courses` (modifiée)

```
... champs existants ...
evaluation_modalities    TEXT NULL
access_modalities        TEXT NULL
accessibility            TEXT NULL
contacts                 TEXT NULL
update_date              TEXT NULL
```

### Table `formation_practices` (nouvelle)

```
id                  INTEGER PRIMARY KEY
uuid                UUID UNIQUE NOT NULL
code                VARCHAR(50) UNIQUE NOT NULL
name                VARCHAR(255) NOT NULL
description         TEXT NULL
is_active           BOOLEAN DEFAULT TRUE
created_at          TIMESTAMP
updated_at          TIMESTAMP
```

### Table `course_formation_practices` (nouvelle)

```
id                  INTEGER PRIMARY KEY
course_uuid         UUID NOT NULL (FK vers courses.uuid)
practice_id         INTEGER NOT NULL (FK vers formation_practices.id)
created_at          TIMESTAMP
updated_at          TIMESTAMP

UNIQUE(course_uuid, practice_id)
```

---

## 🔐 Sécurité et permissions

### Règles d'accès

1. **Création de catégorie personnalisée**
   - Seuls les utilisateurs authentifiés peuvent créer
   - Limite de 2 catégories par organisation
   - Vérifier que `organization_id` correspond à l'organisation de l'utilisateur

2. **Modification/Suppression**
   - Seul le propriétaire de l'organisation peut modifier/supprimer
   - Vérifier que la catégorie appartient à l'organisation

3. **Liste des catégories**
   - Retourner toutes les catégories standard
   - Retourner uniquement les catégories personnalisées de l'organisation de l'utilisateur

4. **Pratiques de formation**
   - Lecture publique (toutes les pratiques actives)
   - Modification uniquement pour les cours de l'organisation de l'utilisateur

---

## 🧪 Tests à implémenter

### Tests unitaires

1. **Création de catégorie personnalisée**
   - ✅ Création réussie avec données valides
   - ✅ Échec si nom manquant
   - ✅ Échec si limite de 2 catégories atteinte
   - ✅ Échec si organization_id invalide

2. **Liste des catégories**
   - ✅ Retourne catégories standard
   - ✅ Retourne catégories personnalisées de l'organisation
   - ✅ Ne retourne pas les catégories personnalisées d'autres organisations

3. **Suppression de catégorie**
   - ✅ Suppression réussie si non utilisée
   - ✅ Échec si catégorie utilisée par des cours
   - ✅ Échec si catégorie n'appartient pas à l'organisation

4. **Nouveaux champs cours**
   - ✅ Création avec nouveaux champs
   - ✅ Mise à jour avec nouveaux champs
   - ✅ Récupération inclut nouveaux champs

5. **Pratiques de formation**
   - ✅ Liste des pratiques
   - ✅ Association pratiques à un cours
   - ✅ Récupération pratiques d'un cours

### Tests d'intégration

1. **Workflow complet catégories**
   - Créer catégorie → Créer cours avec cette catégorie → Supprimer catégorie (doit échouer) → Modifier cours → Supprimer catégorie (doit réussir)

2. **Workflow complet pratiques**
   - Créer cours → Associer pratiques → Récupérer cours avec pratiques → Modifier pratiques

---

## 📝 Notes d'implémentation

### Points d'attention

1. **Contenu HTML** : Les champs peuvent contenir du HTML (contenu riche). Assurez-vous que :
   - Le backend accepte le HTML
   - Le HTML est échappé lors de l'affichage (protection XSS)
   - Le HTML est nettoyé si nécessaire (sanitization)

2. **Performance** : Les champs TEXT peuvent être volumineux. Vérifiez :
   - Les limites de taille
   - L'indexation si nécessaire
   - Les requêtes de récupération

3. **Compatibilité** : Assurez-vous que :
   - Les anciens cours sans ces champs fonctionnent toujours
   - Les valeurs NULL sont gérées correctement
   - La migration est réversible

4. **Limite de catégories** : La vérification doit être faite :
   - Avant la création
   - Dans une transaction pour éviter les race conditions

---

## 🚀 Priorités d'implémentation

### Phase 1 (Critique - À faire immédiatement)
1. ✅ Migration base de données (colonnes `is_custom`, `organization_id` dans categories)
2. ✅ Migration base de données (nouveaux champs dans courses)
3. ✅ Endpoint création catégorie personnalisée
4. ✅ Endpoint liste catégories (incluant personnalisées)
5. ✅ Validation limite de 2 catégories
6. ✅ Modification endpoints cours pour inclure nouveaux champs

### Phase 2 (Important - Dans la semaine)
7. ✅ Endpoint modification catégorie personnalisée
8. ✅ Endpoint suppression catégorie personnalisée
9. ✅ Validation utilisation de catégorie avant suppression
10. ✅ Migration et endpoints pour pratiques de formation
11. ✅ Tests unitaires de base

### Phase 3 (Optionnel - Selon besoins)
12. ⚠️ Section Catalogues (si nécessaire)
13. ⚠️ Optimisations de performance
14. ⚠️ Recherche full-text sur nouveaux champs

---

## 📞 Questions à clarifier

1. **Catalogues** : Cette fonctionnalité doit-elle être implémentée maintenant ou plus tard ?
2. **Limite de catégories** : La limite de 2 est-elle définitive ou peut-elle être configurable ?
3. **Catégories personnalisées** : Doivent-elles être visibles par d'autres organisations ou strictement privées ?
4. **Migration des données** : Y a-t-il des catégories existantes à migrer ?
5. **Pratiques de formation** : Les pratiques sont-elles fixes ou peuvent-elles être modifiées par les admins ?
6. **Sanitization HTML** : Faut-il nettoyer le HTML côté backend ou accepter tel quel ?

---

## 📚 Références

- Documentation frontend : `step1.md`
- Requirements backend existants : `step1-backend-requirements.md`
- Champs manquants : `step1-backend-missing-fields.md`
- Révision frontend : `step1-revision-frontend.md`

---

## ✅ Checklist d'implémentation complète

### Base de données
- [ ] Migration catégories personnalisées
- [ ] Migration nouveaux champs courses
- [ ] Migration pratiques de formation
- [ ] Migration table de liaison course_formation_practices
- [ ] Insertion données par défaut (pratiques)
- [ ] Tests de migration en rollback

### Modèles
- [ ] Modèle Category avec is_custom et organization_id
- [ ] Modèle Course avec nouveaux champs
- [ ] Modèle FormationPractice
- [ ] Relations entre modèles

### API - Catégories
- [ ] POST /api/courses/categories/custom
- [ ] GET /api/courses/categories (avec include_custom)
- [ ] PUT /api/courses/categories/custom/{id}
- [ ] DELETE /api/courses/categories/custom/{id}

### API - Cours
- [ ] Modification POST /api/organization/courses (nouveaux champs)
- [ ] Modification PUT /api/organization/courses/{uuid} (nouveaux champs)
- [ ] Modification GET /api/organization/courses/{uuid} (inclure nouveaux champs)

### API - Pratiques de formation
- [ ] GET /api/courses/formation-practices
- [ ] PUT /api/organization/courses/{uuid}/formation-practices
- [ ] GET /api/organization/courses/{uuid}/formation-practices

### Validation
- [ ] Validation création catégorie
- [ ] Validation limite 2 catégories
- [ ] Validation nouveaux champs cours
- [ ] Validation pratiques de formation

### Tests
- [ ] Tests unitaires catégories
- [ ] Tests unitaires nouveaux champs
- [ ] Tests unitaires pratiques
- [ ] Tests d'intégration

---

**Document créé le** : 2025-01-XX  
**Version** : 1.0  
**Statut** : Prêt pour implémentation


