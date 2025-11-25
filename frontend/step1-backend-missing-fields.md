# Requirements Backend - Champs Manquants Step 1

## 📋 Vue d'ensemble

Ce document liste les champs et fonctionnalités manquants au backend pour supporter toutes les sections du Step 1 de création de cours.

---

## 🔴 Champs manquants dans la table `courses`

### Nouveaux champs à ajouter

Les sections suivantes ont été ajoutées au frontend mais n'existent pas encore dans la base de données :

#### 1. Modalités D'évaluation
- **Nom du champ** : `evaluation_modalities`
- **Type** : `TEXT` ou `LONGTEXT`
- **Nullable** : `YES`
- **Description** : Contenu riche (HTML) des modalités d'évaluation du cours

#### 2. Modalités Et Délais D'accès
- **Nom du champ** : `access_modalities`
- **Type** : `TEXT` ou `LONGTEXT`
- **Nullable** : `YES`
- **Description** : Contenu riche (HTML) des modalités et délais d'accès au cours

#### 3. Accessibilité Aux Personnes Handicapées
- **Nom du champ** : `accessibility`
- **Type** : `TEXT` ou `LONGTEXT`
- **Nullable** : `YES`
- **Description** : Contenu riche (HTML) sur l'accessibilité du cours pour les personnes handicapées

#### 4. Contacts
- **Nom du champ** : `contacts`
- **Type** : `TEXT` ou `LONGTEXT`
- **Nullable** : `YES`
- **Description** : Contenu riche (HTML) avec les informations de contact (format liste à puces)

#### 5. Date De MAJ
- **Nom du champ** : `update_date`
- **Type** : `TEXT` ou `LONGTEXT`
- **Nullable** : `YES`
- **Description** : Date de mise à jour du cours (peut être formatée en texte)

---

## 📝 Migration SQL

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

---

## 🔌 Modifications API requises

### 1. Endpoint : Créer/Mettre à jour un cours

**Route existante** : `POST /api/organization/courses` ou `PUT /api/organization/courses/{uuid}`

**Champs à ajouter dans le body** :

```json
{
  "title": "Mon Cours",
  "description": "...",
  // ... autres champs existants ...
  "evaluation_modalities": "<p>Modalités d'évaluation...</p>",
  "access_modalities": "<p>Modalités d'accès...</p>",
  "accessibility": "<p>Accessibilité...</p>",
  "contacts": "<ul><li>Contact 1</li></ul>",
  "update_date": "2025-01-15"
}
```

**Validation** :
- Tous les champs sont optionnels
- Si fournis, doivent être des strings
- Peuvent contenir du HTML (contenu riche)

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
    "update_date": "2025-01-15"
  }
}
```

### 2. Endpoint : Récupérer les détails d'un cours

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
      "update_date": "2025-01-15"
    }
  }
}
```

### 3. Endpoint : Mettre à jour des champs spécifiques

**Route existante** : `PUT /api/organization/courses/{uuid}/overview` ou similaire

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

### Migration Laravel

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
        ];
    }
}
```

---

## 🔄 Mise à jour du contexte frontend

Le frontend utilise déjà ces champs dans :
- `src/components/CourseCreation/CollapsibleSections.tsx`
- `src/components/CourseCreation/SectionContent.tsx`
- `src/screens/CourseCreation/CourseCreation.tsx`

**Action requise** : Aucune modification frontend nécessaire, seulement backend.

---

## 📊 Récapitulatif des champs

| Champ | Type | Nullable | Description |
|-------|------|----------|-------------|
| `evaluation_modalities` | TEXT | YES | Modalités D'évaluation (HTML) |
| `access_modalities` | TEXT | YES | Modalités Et Délais D'accès (HTML) |
| `accessibility` | TEXT | YES | Accessibilité Aux Personnes Handicapées (HTML) |
| `contacts` | TEXT | YES | Contacts (HTML, format liste) |
| `update_date` | TEXT | YES | Date De MAJ (texte formaté) |

---

## ✅ Checklist d'implémentation

### Phase 1 : Base de données
- [ ] Créer la migration SQL
- [ ] Exécuter la migration en développement
- [ ] Vérifier les colonnes ajoutées
- [ ] Tester la migration en rollback

### Phase 2 : Modèle et validation
- [ ] Ajouter les champs au modèle Course
- [ ] Ajouter les règles de validation
- [ ] Ajouter les champs dans `$fillable` ou `$guarded`

### Phase 3 : API
- [ ] Modifier l'endpoint de création de cours
- [ ] Modifier l'endpoint de mise à jour de cours
- [ ] Modifier l'endpoint de récupération de cours
- [ ] Tester les endpoints avec Postman/Insomnia

### Phase 4 : Tests
- [ ] Tests unitaires pour la validation
- [ ] Tests d'intégration pour les endpoints
- [ ] Tests de migration

---

## 🚨 Points d'attention

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

---

## 📞 Questions à clarifier

1. **Taille des champs** : TEXT suffit-il ou faut-il LONGTEXT ?
2. **Sanitization HTML** : Faut-il nettoyer le HTML côté backend ?
3. **Validation** : Faut-il valider la structure HTML ou accepter n'importe quel HTML ?
4. **Indexation** : Faut-il créer des index pour ces champs (recherche full-text) ?
5. **Migration des données** : Y a-t-il des données existantes à migrer ?

---

## 📚 Références

- Documentation frontend : `step1.md`
- Requirements backend existants : `step1-backend-requirements.md`
- Révision frontend : `step1-revision-frontend.md`

---

## 🎯 Priorités

### 🔴 Critique (À faire immédiatement)
1. Migration base de données
2. Ajout des champs au modèle
3. Modification des endpoints de création/mise à jour

### 🟡 Important (Dans la semaine)
4. Tests unitaires
5. Tests d'intégration
6. Documentation API

### 🟢 Optionnel (Selon besoins)
7. Recherche full-text sur ces champs
8. Sanitization HTML avancée
9. Validation HTML structurelle


