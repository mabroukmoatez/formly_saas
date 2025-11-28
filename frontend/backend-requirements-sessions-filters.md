# Modifications Backend Requises - Filtres et Affichage Sessions

## Vue d'ensemble

Ce document décrit toutes les modifications backend nécessaires pour supporter le nouveau système de filtres et l'affichage en tableau des sessions selon le design Figma.

## 1. Endpoint: Liste des Sessions avec Filtres Avancés

### Endpoint Actuel
```
GET /api/organization/sessions
```

### Modifications Requises

#### Paramètres de Requête à Ajouter/Améliorer

```typescript
{
  // Existants
  status?: number;              // Statut de publication (0=brouillon, 1=publié)
  search?: string;              // Recherche textuelle
  category_id?: number;         // ID de la catégorie
  trainer_id?: string;          // UUID du formateur
  per_page?: number;            // Nombre d'éléments par page
  page?: number;                // Numéro de page
  
  // NOUVEAUX - À Ajouter
  session_type?: 'presentiel' | 'distanciel' | 'e-learning' | 'hybride';
  status_filter?: 'à venir' | 'en cours' | 'terminée';  // Basé sur les dates
  start_date?: string;          // Format: YYYY-MM-DD (filtre date de début)
  end_date?: string;            // Format: YYYY-MM-DD (filtre date de fin)
  date_range_start?: string;    // Date de début pour le filtre de plage
  date_range_end?: string;      // Date de fin pour le filtre de plage
}
```

#### Réponse Attendue

```json
{
  "success": true,
  "data": {
    "current_page": 1,
    "data": [
      {
        "uuid": "string",
        "title": "string",
        "subtitle": "string",
        "description": "string",
        "price": "number",
        "price_ht": "number",
        "duration": "string",
        "duration_days": "number",
        "session_start_date": "YYYY-MM-DD",
        "session_end_date": "YYYY-MM-DD",
        "session_start_time": "HH:mm",
        "session_end_time": "HH:mm",
        "max_participants": "number",
        "current_participants": "number",
        "participants_count": "number",
        "status": "number",
        "category": {
          "id": "number",
          "name": "string"
        },
        "trainers": [
          {
            "uuid": "string",
            "name": "string",
            "email": "string",
            "specialization": "string"
          }
        ],
        "session_instances": [
          {
            "uuid": "string",
            "instance_type": "presentiel" | "distanciel" | "e-learning" | "hybride",
            "start_date": "YYYY-MM-DD",
            "end_date": "YYYY-MM-DD",
            "status": "scheduled" | "in_progress" | "completed" | "cancelled"
          }
        ],
        "image_url": "string",
        "video_url": "string",
        "currency": "string",
        "created_at": "datetime",
        "updated_at": "datetime"
      }
    ],
    "total": "number",
    "per_page": "number",
    "last_page": "number"
  }
}
```

### Logique de Filtrage à Implémenter

#### 1. Filtre par Type de Session
```php
// Si session_type est fourni, filtrer les sessions qui ont au moins une instance de ce type
if ($request->has('session_type')) {
    $query->whereHas('session_instances', function($q) use ($request) {
        $q->where('instance_type', $request->session_type);
    });
}
```

#### 2. Filtre par Statut Basé sur les Dates
```php
// Calculer le statut basé sur les dates de session
if ($request->has('status_filter')) {
    $now = now();
    $query->where(function($q) use ($request, $now) {
        switch($request->status_filter) {
            case 'à venir':
                $q->where('session_start_date', '>', $now->toDateString());
                break;
            case 'en cours':
                $q->where('session_start_date', '<=', $now->toDateString())
                  ->where('session_end_date', '>=', $now->toDateString());
                break;
            case 'terminée':
                $q->where('session_end_date', '<', $now->toDateString());
                break;
        }
    });
}
```

#### 3. Filtre par Plage de Dates
```php
// Filtrer par plage de dates (date_range_start et date_range_end)
if ($request->has('date_range_start')) {
    $query->where('session_start_date', '>=', $request->date_range_start);
}
if ($request->has('date_range_end')) {
    $query->where('session_end_date', '<=', $request->date_range_end);
}
```

## 2. Calcul du Type de Session

### Logique à Implémenter

Le type de session doit être calculé à partir des instances :

```php
// Dans le modèle Session ou dans le contrôleur
public function getSessionTypeAttribute() {
    $instances = $this->session_instances;
    
    if ($instances->isEmpty()) {
        return null;
    }
    
    $types = $instances->pluck('instance_type')->unique();
    
    // Si plusieurs types différents, c'est hybride
    if ($types->count() > 1) {
        return 'hybride';
    }
    
    return $types->first();
}
```

### Ajout dans la Réponse

Ajouter un champ `session_type` calculé dans la réponse :

```json
{
  "session_type": "presentiel" | "distanciel" | "e-learning" | "hybride" | null
}
```

## 3. Calcul du Statut Basé sur les Dates

### Logique à Implémenter

```php
// Dans le modèle Session
public function getDateBasedStatusAttribute() {
    if (!$this->session_start_date || !$this->session_end_date) {
        return 'à venir';
    }
    
    $now = now();
    $startDate = Carbon::parse($this->session_start_date);
    $endDate = Carbon::parse($this->session_end_date);
    
    if ($now->lt($startDate)) {
        return 'à venir';
    } elseif ($now->gte($startDate) && $now->lte($endDate)) {
        return 'en cours';
    } else {
        return 'terminée';
    }
}
```

### Ajout dans la Réponse

```json
{
  "date_based_status": "à venir" | "en cours" | "terminée"
}
```

## 4. Endpoint: Export Excel

### Nouveau Endpoint Requis

```
GET /api/organization/sessions/export
```

### Paramètres

Mêmes paramètres de filtrage que l'endpoint de liste, plus :
- `format`: 'xlsx' | 'csv' (par défaut: 'xlsx')

### Réponse

Fichier Excel/CSV téléchargeable avec toutes les colonnes du tableau :
- intitulé de la Formation
- Type de session
- Status
- Durée
- Date de début
- Date de fin
- Nombre De Participants
- Formateur(s)

## 5. Endpoint: Vue Calendrier

### Nouveau Endpoint Requis

```
GET /api/organization/sessions/calendar
```

### Paramètres

```typescript
{
  start_date: string;        // Date de début de la période (requis) - Format: YYYY-MM-DD
  end_date: string;          // Date de fin de la période (requis) - Format: YYYY-MM-DD
  view?: 'month' | 'week';   // Vue demandée (par défaut: 'month')
  trainer_id?: string;       // Filtrer par formateur (UUID)
  category_id?: number;     // Filtrer par catégorie
  session_type?: 'presentiel' | 'distanciel' | 'e-learning' | 'hybride';
  search?: string;           // Recherche textuelle
}
```

### Réponse Attendue

```json
{
  "success": true,
  "data": [
    {
      "uuid": "string",
      "title": "string",
      "session_start_date": "YYYY-MM-DD",
      "session_end_date": "YYYY-MM-DD",
      "session_start_time": "HH:mm",
      "session_end_time": "HH:mm",
      "session_type": "presentiel" | "distanciel" | "e-learning" | "hybride",
      "category": {
        "id": "number",
        "name": "string"
      },
      "trainers": [
        {
          "uuid": "string",
          "name": "string"
        }
      ],
      "max_participants": "number",
      "current_participants": "number",
      "participants_count": "number",
      "status": "number",
      "date_based_status": "à venir" | "en cours" | "terminée"
    }
  ]
}
```

### Logique de Filtrage

L'endpoint doit retourner toutes les sessions qui **chevauchent** la période demandée, pas seulement celles qui commencent dans cette période.

```php
// Exemple de logique Laravel
$query->where(function($q) use ($startDate, $endDate) {
    $q->where(function($subQ) use ($startDate, $endDate) {
        // Session commence dans la période
        $subQ->whereBetween('session_start_date', [$startDate, $endDate]);
    })->orWhere(function($subQ) use ($startDate, $endDate) {
        // Session se termine dans la période
        $subQ->whereBetween('session_end_date', [$startDate, $endDate]);
    })->orWhere(function($subQ) use ($startDate, $endDate) {
        // Session englobe toute la période
        $subQ->where('session_start_date', '<=', $startDate)
             ->where('session_end_date', '>=', $endDate);
    });
});
```

### Optimisations

1. **Eager Loading**: Toujours inclure les relations nécessaires :
   ```php
   $sessions = Session::with(['category', 'trainers', 'session_instances'])
       ->where(...)
       ->get();
   ```

2. **Index de Base de Données**: Assurez-vous que les index suivants existent :
   ```sql
   CREATE INDEX idx_sessions_dates ON sessions(session_start_date, session_end_date);
   ```

3. **Format de Date**: Les dates doivent être retournées au format ISO (YYYY-MM-DD) pour faciliter le traitement côté frontend.

## 6. Améliorations des Relations

### Relations à Eager Load

Pour optimiser les performances, toujours inclure :

```php
$sessions = Session::with([
    'category',
    'trainers',
    'session_instances' => function($query) {
        $query->select('uuid', 'session_uuid', 'instance_type', 'start_date', 'end_date', 'status');
    }
])->paginate($perPage);
```

## 7. Validation des Paramètres

### Règles de Validation

```php
$rules = [
    'status' => 'nullable|integer|in:0,1',
    'search' => 'nullable|string|max:255',
    'category_id' => 'nullable|integer|exists:categories,id',
    'trainer_id' => 'nullable|string|exists:trainers,uuid',
    'session_type' => 'nullable|string|in:presentiel,distanciel,e-learning,hybride',
    'status_filter' => 'nullable|string|in:à venir,en cours,terminée',
    'date_range_start' => 'nullable|date',
    'date_range_end' => 'nullable|date|after_or_equal:date_range_start',
    'per_page' => 'nullable|integer|min:1|max:100',
    'page' => 'nullable|integer|min:1',
];
```

## 8. Index de Base de Données

### Index Recommandés

Pour optimiser les performances des filtres :

```sql
-- Index sur les dates pour le filtrage par statut
CREATE INDEX idx_sessions_dates ON sessions(session_start_date, session_end_date);

-- Index sur category_id
CREATE INDEX idx_sessions_category ON sessions(category_id);

-- Index composite pour les recherches
CREATE INDEX idx_sessions_search ON sessions(title, subtitle);
```

## 9. Tests à Implémenter

### Tests Unitaires

1. Test du filtrage par type de session
2. Test du filtrage par statut basé sur les dates
3. Test du filtrage par plage de dates
4. Test du calcul du type de session (hybride vs simple)
5. Test du calcul du statut basé sur les dates

### Tests d'Intégration

1. Test de l'endpoint avec tous les filtres combinés
2. Test de la pagination avec filtres
3. Test de l'export Excel
4. Test de la vue calendrier

## 10. Notes Importantes

1. **Performance**: Les filtres doivent être optimisés avec des index appropriés
2. **Compatibilité**: Maintenir la compatibilité avec l'API existante
3. **Sécurité**: Valider tous les paramètres d'entrée
4. **Documentation**: Mettre à jour la documentation API (Swagger/OpenAPI)

## 11. Ordre d'Implémentation Recommandé

1. ✅ Ajouter les nouveaux paramètres de filtrage à l'endpoint existant
2. ✅ Implémenter la logique de calcul du type de session
3. ✅ Implémenter la logique de calcul du statut basé sur les dates
4. ✅ Ajouter les champs calculés dans la réponse
5. ✅ Implémenter l'endpoint d'export Excel
6. ✅ **IMPLÉMENTER L'ENDPOINT DE VUE CALENDRIER** (Requis pour la fonctionnalité)
7. ✅ Ajouter les index de base de données
8. ✅ Écrire les tests
9. ✅ Mettre à jour la documentation

## 12. Exemple de Code Backend pour Vue Calendrier (Laravel)

```php
// Dans SessionController.php

public function calendar(Request $request)
{
    $request->validate([
        'start_date' => 'required|date',
        'end_date' => 'required|date|after_or_equal:start_date',
        'view' => 'nullable|in:month,week',
        'trainer_id' => 'nullable|string|exists:trainers,uuid',
        'category_id' => 'nullable|integer|exists:categories,id',
        'session_type' => 'nullable|string|in:presentiel,distanciel,e-learning,hybride',
        'search' => 'nullable|string|max:255',
    ]);

    $startDate = Carbon::parse($request->start_date)->startOfDay();
    $endDate = Carbon::parse($request->end_date)->endOfDay();

    $query = Session::with(['category', 'trainers', 'session_instances'])
        ->where(function($q) use ($startDate, $endDate) {
            // Sessions qui chevauchent la période demandée
            $q->where(function($subQ) use ($startDate, $endDate) {
                // Session commence dans la période
                $subQ->whereBetween('session_start_date', [
                    $startDate->toDateString(), 
                    $endDate->toDateString()
                ]);
            })->orWhere(function($subQ) use ($startDate, $endDate) {
                // Session se termine dans la période
                $subQ->whereBetween('session_end_date', [
                    $startDate->toDateString(), 
                    $endDate->toDateString()
                ]);
            })->orWhere(function($subQ) use ($startDate, $endDate) {
                // Session englobe toute la période
                $subQ->where('session_start_date', '<=', $startDate->toDateString())
                     ->where('session_end_date', '>=', $endDate->toDateString());
            });
        });

    // Filtre par formateur
    if ($request->has('trainer_id')) {
        $query->whereHas('trainers', function($q) use ($request) {
            $q->where('trainers.uuid', $request->trainer_id);
        });
    }

    // Filtre par catégorie
    if ($request->has('category_id')) {
        $query->where('category_id', $request->category_id);
    }

    // Filtre par type de session
    if ($request->has('session_type')) {
        $query->whereHas('session_instances', function($q) use ($request) {
            $q->where('instance_type', $request->session_type);
        });
    }

    // Filtre par recherche
    if ($request->has('search')) {
        $query->where(function($q) use ($request) {
            $q->where('title', 'like', '%' . $request->search . '%')
              ->orWhere('subtitle', 'like', '%' . $request->search . '%')
              ->orWhere('description', 'like', '%' . $request->search . '%');
        });
    }

    $sessions = $query->get();

    // Ajouter les champs calculés
    $sessions->transform(function($session) {
        $session->session_type = $session->getSessionTypeAttribute();
        $session->date_based_status = $session->getDateBasedStatusAttribute();
        return $session;
    });

    return response()->json([
        'success' => true,
        'data' => $sessions
    ]);
}
```

## 13. Exemple de Code Backend - Liste avec Filtres (Laravel)

```php
// Dans SessionController.php

public function index(Request $request)
{
    $query = Session::with(['category', 'trainers', 'session_instances']);
    
    // Filtre par recherche textuelle
    if ($request->has('search')) {
        $query->where(function($q) use ($request) {
            $q->where('title', 'like', '%' . $request->search . '%')
              ->orWhere('subtitle', 'like', '%' . $request->search . '%')
              ->orWhere('description', 'like', '%' . $request->search . '%');
        });
    }
    
    // Filtre par catégorie
    if ($request->has('category_id')) {
        $query->where('category_id', $request->category_id);
    }
    
    // Filtre par formateur
    if ($request->has('trainer_id')) {
        $query->whereHas('trainers', function($q) use ($request) {
            $q->where('trainers.uuid', $request->trainer_id);
        });
    }
    
    // Filtre par type de session
    if ($request->has('session_type')) {
        $query->whereHas('session_instances', function($q) use ($request) {
            $q->where('instance_type', $request->session_type);
        });
    }
    
    // Filtre par statut basé sur les dates
    if ($request->has('status_filter')) {
        $now = now();
        switch($request->status_filter) {
            case 'à venir':
                $query->where('session_start_date', '>', $now->toDateString());
                break;
            case 'en cours':
                $query->where('session_start_date', '<=', $now->toDateString())
                      ->where('session_end_date', '>=', $now->toDateString());
                break;
            case 'terminée':
                $query->where('session_end_date', '<', $now->toDateString());
                break;
        }
    }
    
    // Filtre par plage de dates
    if ($request->has('date_range_start')) {
        $query->where('session_start_date', '>=', $request->date_range_start);
    }
    if ($request->has('date_range_end')) {
        $query->where('session_end_date', '<=', $request->date_range_end);
    }
    
    $perPage = $request->get('per_page', 12);
    $sessions = $query->paginate($perPage);
    
    // Ajouter les champs calculés
    $sessions->getCollection()->transform(function($session) {
        $session->session_type = $session->getSessionTypeAttribute();
        $session->date_based_status = $session->getDateBasedStatusAttribute();
        return $session;
    });
    
    return response()->json([
        'success' => true,
        'data' => $sessions
    ]);
}
```

---

**Date de création**: 2024
**Version**: 1.0
**Auteur**: Frontend Development Team

