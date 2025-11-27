# Spécifications Backend - Gestion Qualité - Indicateurs Qualiopi

## Vue d'ensemble

Ce document décrit les spécifications backend nécessaires pour que la sélection des indicateurs dans "Définir les indicateurs qui vous concernent" soit correctement liée au dashboard et affiche le pourcentage d'achèvement réel de chaque indicateur.

## Problème actuel

Le frontend utilise actuellement `isApplicable ? 100 : 0` pour calculer le pourcentage d'affichage dans le dashboard, ce qui ne reflète pas le vrai pourcentage d'achèvement de l'indicateur. Le frontend attend un champ `completionRate` (0-100) qui doit être calculé par le backend.

## Spécifications Backend

### 1. Champ `completionRate` dans l'API des Indicateurs

**Endpoint:** `GET /api/quality/indicators` et `GET /api/quality/indicators/{id}`

**Champ requis dans la réponse:**

```json
{
  "id": 1,
  "number": 1,
  "title": "Titre de l'indicateur",
  "status": "completed" | "in_progress" | "not_started",
  "isApplicable": true,
  "completionRate": 75,  // ← NOUVEAU CHAMP REQUIS (0-100)
  "documentCounts": {
    "procedures": 2,
    "models": 1,
    "evidences": 3,
    "total": 6
  }
}
```

### 2. Calcul du `completionRate`

Le `completionRate` doit être calculé en fonction de plusieurs critères:

#### Critères de calcul:

1. **Documents requis par indicateur:**
   - Chaque indicateur doit avoir au minimum:
     - **1 Procédure** (obligatoire)
     - **1 Modèle** (obligatoire)
     - **1 Preuve** (obligatoire)

2. **Formule de calcul:**

```python
def calculate_completion_rate(indicator):
    """
    Calcule le pourcentage d'achèvement d'un indicateur (0-100)
    """
    # Si l'indicateur n'est pas applicable, retourner 0
    if not indicator.is_applicable:
        return 0
    
    # Compter les documents associés
    procedures_count = indicator.documents.filter(type='procedure').count()
    models_count = indicator.documents.filter(type='model').count()
    evidences_count = indicator.documents.filter(type='evidence').count()
    
    # Documents requis minimum
    REQUIRED_PROCEDURES = 1
    REQUIRED_MODELS = 1
    REQUIRED_EVIDENCES = 1
    
    # Calculer le pourcentage pour chaque type de document
    procedure_percentage = min(100, (procedures_count / REQUIRED_PROCEDURES) * 100)
    model_percentage = min(100, (models_count / REQUIRED_MODELS) * 100)
    evidence_percentage = min(100, (evidences_count / REQUIRED_EVIDENCES) * 100)
    
    # Moyenne pondérée (tous les types sont obligatoires)
    # Si un type manque, le pourcentage global est réduit
    completion_rate = (procedure_percentage + model_percentage + evidence_percentage) / 3
    
    # Arrondir à l'entier
    return round(completion_rate)
```

#### Exemples de calcul:

- **Indicateur avec 1 procédure, 1 modèle, 1 preuve:** `completionRate = 100%`
- **Indicateur avec 1 procédure, 0 modèle, 1 preuve:** `completionRate = 66%` (manque le modèle)
- **Indicateur avec 0 procédure, 0 modèle, 0 preuve:** `completionRate = 0%`
- **Indicateur avec 2 procédures, 1 modèle, 1 preuve:** `completionRate = 100%` (les documents supplémentaires n'augmentent pas le pourcentage)

### 3. Mise à jour automatique du `completionRate`

Le `completionRate` doit être recalculé automatiquement lorsque:

1. **Un document est ajouté** à un indicateur
2. **Un document est supprimé** d'un indicateur
3. **Le statut `isApplicable` change** (via l'API de mise à jour)

**Endpoints concernés:**
- `POST /api/quality/documents` (création de document)
- `DELETE /api/quality/documents/{id}` (suppression de document)
- `PUT /api/quality/indicators/{id}` (mise à jour de l'indicateur, notamment `isApplicable`)

### 4. Endpoint de mise à jour de l'indicateur

**Endpoint:** `PUT /api/quality/indicators/{id}`

**Corps de la requête:**

```json
{
  "isApplicable": true,  // Mise à jour de l'applicabilité
  "title": "...",
  "description": "...",
  "status": "in_progress",
  // ... autres champs
}
```

**Comportement attendu:**

1. Si `isApplicable` est mis à `false`, le `completionRate` doit être mis à `0`
2. Si `isApplicable` est mis à `true`, recalculer le `completionRate` basé sur les documents existants
3. Retourner l'indicateur mis à jour avec le nouveau `completionRate`

### 5. Structure de la base de données

#### Table `quality_indicators`

```sql
CREATE TABLE quality_indicators (
    id SERIAL PRIMARY KEY,
    number INTEGER NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'not_started',
    is_applicable BOOLEAN DEFAULT TRUE,
    completion_rate INTEGER DEFAULT 0,  -- ← NOUVEAU CHAMP (0-100)
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Migration SQL

```sql
-- Ajouter la colonne completion_rate si elle n'existe pas
ALTER TABLE quality_indicators 
ADD COLUMN IF NOT EXISTS completion_rate INTEGER DEFAULT 0;

-- Créer un index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_quality_indicators_completion_rate 
ON quality_indicators(completion_rate);

-- Créer un trigger pour recalculer automatiquement le completion_rate
-- (à adapter selon votre ORM/framework)
```

### 6. Logique de recalcul automatique

#### Option 1: Trigger SQL (PostgreSQL)

```sql
CREATE OR REPLACE FUNCTION calculate_indicator_completion_rate(indicator_id INTEGER)
RETURNS INTEGER AS $$
DECLARE
    proc_count INTEGER;
    model_count INTEGER;
    evidence_count INTEGER;
    completion INTEGER;
BEGIN
    -- Si l'indicateur n'est pas applicable, retourner 0
    IF NOT (SELECT is_applicable FROM quality_indicators WHERE id = indicator_id) THEN
        RETURN 0;
    END IF;
    
    -- Compter les documents
    SELECT COUNT(*) INTO proc_count
    FROM quality_documents
    WHERE indicator_id = indicator_id AND type = 'procedure';
    
    SELECT COUNT(*) INTO model_count
    FROM quality_documents
    WHERE indicator_id = indicator_id AND type = 'model';
    
    SELECT COUNT(*) INTO evidence_count
    FROM quality_documents
    WHERE indicator_id = indicator_id AND type = 'evidence';
    
    -- Calculer le pourcentage (moyenne des 3 types)
    completion := ROUND(
        (LEAST(100, (proc_count::FLOAT / 1) * 100) +
         LEAST(100, (model_count::FLOAT / 1) * 100) +
         LEAST(100, (evidence_count::FLOAT / 1) * 100)) / 3
    );
    
    RETURN completion;
END;
$$ LANGUAGE plpgsql;

-- Trigger après insertion/suppression de document
CREATE OR REPLACE FUNCTION update_indicator_completion_rate()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE quality_indicators
    SET completion_rate = calculate_indicator_completion_rate(
        COALESCE(NEW.indicator_id, OLD.indicator_id)
    ),
    updated_at = NOW()
    WHERE id = COALESCE(NEW.indicator_id, OLD.indicator_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_completion_rate_after_document_change
AFTER INSERT OR DELETE OR UPDATE ON quality_documents
FOR EACH ROW
EXECUTE FUNCTION update_indicator_completion_rate();
```

#### Option 2: Logique applicative (Python/Django)

```python
# Dans models.py
class QualityIndicator(models.Model):
    # ... autres champs
    completion_rate = models.IntegerField(default=0)
    
    def calculate_completion_rate(self):
        """Calcule et met à jour le completion_rate"""
        if not self.is_applicable:
            self.completion_rate = 0
            return
        
        # Compter les documents
        procedures = self.documents.filter(type='procedure').count()
        models = self.documents.filter(type='model').count()
        evidences = self.documents.filter(type='evidence').count()
        
        # Calculer le pourcentage
        proc_pct = min(100, (procedures / 1) * 100)
        model_pct = min(100, (models / 1) * 100)
        evidence_pct = min(100, (evidences / 1) * 100)
        
        self.completion_rate = round((proc_pct + model_pct + evidence_pct) / 3)
    
    def save(self, *args, **kwargs):
        self.calculate_completion_rate()
        super().save(*args, **kwargs)

# Dans signals.py (pour recalculer après changement de document)
@receiver(post_save, sender=QualityDocument)
@receiver(post_delete, sender=QualityDocument)
def update_indicator_completion_rate(sender, instance, **kwargs):
    if instance.indicator:
        instance.indicator.calculate_completion_rate()
        instance.indicator.save(update_fields=['completion_rate', 'updated_at'])
```

### 7. Endpoint de récupération des indicateurs

**Endpoint:** `GET /api/quality/indicators`

**Réponse attendue:**

```json
{
  "success": true,
  "data": {
    "indicators": [
      {
        "id": 1,
        "number": 1,
        "title": "Titre indicateur 1",
        "status": "in_progress",
        "isApplicable": true,
        "completionRate": 66,  // ← OBLIGATOIRE
        "documentCounts": {
          "procedures": 1,
          "models": 0,
          "evidences": 1,
          "total": 2
        }
      },
      {
        "id": 2,
        "number": 2,
        "title": "Titre indicateur 2",
        "status": "completed",
        "isApplicable": true,
        "completionRate": 100,  // ← OBLIGATOIRE
        "documentCounts": {
          "procedures": 1,
          "models": 1,
          "evidences": 1,
          "total": 3
        }
      },
      {
        "id": 3,
        "number": 3,
        "title": "Titre indicateur 3",
        "status": "not_started",
        "isApplicable": false,
        "completionRate": 0,  // ← Toujours 0 si non applicable
        "documentCounts": {
          "procedures": 0,
          "models": 0,
          "evidences": 0,
          "total": 0
        }
      }
    ]
  }
}
```

### 8. Synchronisation avec le Dashboard

Le dashboard affiche les indicateurs avec:
- **Cercle turquoise avec arc de progression** si `isApplicable = true` et `completionRate > 0`
- **Cercle gris** si `isApplicable = false` ou `completionRate = 0`
- **Pourcentage affiché dans le tooltip** au survol

## Résumé des actions backend requises

1. ✅ Ajouter le champ `completion_rate` (INTEGER, 0-100) à la table `quality_indicators`
2. ✅ Implémenter la fonction de calcul du `completionRate` basée sur les documents
3. ✅ Créer un trigger/logique pour recalculer automatiquement le `completionRate` lors des changements de documents
4. ✅ Inclure `completionRate` dans toutes les réponses API des indicateurs
5. ✅ Mettre à jour le `completionRate` lorsque `isApplicable` change
6. ✅ S'assurer que le `completionRate` est toujours à 0 si `isApplicable = false`

## Tests à effectuer

1. **Test 1:** Créer un indicateur applicable → `completionRate` doit être 0
2. **Test 2:** Ajouter 1 procédure → `completionRate` doit être ~33%
3. **Test 3:** Ajouter 1 modèle → `completionRate` doit être ~66%
4. **Test 4:** Ajouter 1 preuve → `completionRate` doit être 100%
5. **Test 5:** Mettre `isApplicable = false` → `completionRate` doit être 0
6. **Test 6:** Mettre `isApplicable = true` avec documents existants → `completionRate` doit être recalculé

## Notes importantes

- Le `completionRate` doit toujours être un entier entre 0 et 100
- Si un indicateur n'est pas applicable, le `completionRate` doit toujours être 0, même s'il a des documents
- Le recalcul doit être automatique et en temps réel (pas de délai)
- Le `completionRate` peut dépasser 100% si l'utilisateur ajoute plus de documents que requis, mais il sera plafonné à 100% dans le calcul

## ⚠️ IMPORTANT : Endpoint de mise à jour en batch

### Problème identifié

Lors de la mise à jour de plusieurs indicateurs en parallèle, une boucle infinie peut se produire si chaque mise à jour déclenche un recalcul automatique du `completionRate`. Cela cause l'erreur : "Xdebug has detected a possible infinite loop".

### Solution : Endpoint de mise à jour en batch

**Endpoint:** `POST /api/quality/indicators/batch-update`

**Corps de la requête:**

```json
{
  "indicators": [
    {
      "id": 1,
      "isApplicable": true
    },
    {
      "id": 2,
      "isApplicable": false
    },
    {
      "id": 3,
      "isApplicable": true
    }
    // ... autres indicateurs
  ]
}
```

**Note:** Le champ doit s'appeler `indicators` (pas `updates`).

**Comportement attendu:**

1. **Désactiver le recalcul automatique** pendant le traitement du batch
2. Mettre à jour tous les indicateurs en une seule transaction
3. **Recalculer le `completionRate` une seule fois** après toutes les mises à jour
4. Retourner la liste des indicateurs mis à jour

**Exemple d'implémentation (Python/Django):**

```python
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def batch_update_indicators(request):
    """
    Mise à jour en batch des indicateurs pour éviter les boucles infinies
    """
    updates = request.data.get('indicators', [])  # Backend attend 'indicators', pas 'updates'
    
    if not updates:
        return Response(
            {'success': False, 'error': 'Aucune mise à jour fournie'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    updated_indicators = []
    
    # Désactiver temporairement les triggers/signals pour éviter les boucles
    with transaction.atomic():
        # Mettre à jour tous les indicateurs sans recalculer
        for update_data in updates:
            indicator_id = update_data.get('id')
            if not indicator_id:
                continue
            
            try:
                indicator = QualityIndicator.objects.get(id=indicator_id)
                
                # Mettre à jour uniquement les champs fournis
                if 'isApplicable' in update_data:
                    indicator.is_applicable = update_data['isApplicable']
                    # Si désactivé, mettre completion_rate à 0
                    if not update_data['isApplicable']:
                        indicator.completion_rate = 0
                
                if 'status' in update_data:
                    indicator.status = update_data['status']
                
                if 'title' in update_data:
                    indicator.title = update_data['title']
                
                if 'description' in update_data:
                    indicator.description = update_data['description']
                
                # Sauvegarder sans déclencher les signals
                indicator.save(update_fields=[
                    'is_applicable', 'completion_rate', 'status', 
                    'title', 'description', 'updated_at'
                ])
                
                updated_indicators.append(indicator)
                
            except QualityIndicator.DoesNotExist:
                continue
        
        # Recalculer le completion_rate pour tous les indicateurs mis à jour
        # UNE SEULE FOIS après toutes les mises à jour
        for indicator in updated_indicators:
            if indicator.is_applicable:
                indicator.calculate_completion_rate()
                indicator.save(update_fields=['completion_rate', 'updated_at'])
    
    # Retourner les indicateurs mis à jour
    return Response({
        'success': True,
        'data': {
            'updated_count': len(updated_indicators),
            'indicators': [
                {
                    'id': ind.id,
                    'number': ind.number,
                    'isApplicable': ind.is_applicable,
                    'completionRate': ind.completion_rate,
                    'status': ind.status
                }
                for ind in updated_indicators
            ]
        }
    })
```

**Exemple d'implémentation (Laravel/PHP):**

```php
public function batchUpdate(Request $request)
{
    $updates = $request->input('indicators', []);  // Backend attend 'indicators', pas 'updates'
    
    if (empty($updates)) {
        return response()->json([
            'success' => false,
            'error' => 'Aucune mise à jour fournie'
        ], 400);
    }
    
    DB::beginTransaction();
    
    try {
        $updatedIndicators = [];
        
        // Désactiver les événements pour éviter les boucles
        QualityIndicator::withoutEvents(function () use ($updates, &$updatedIndicators) {
            foreach ($updates as $update) {
                $indicator = QualityIndicator::find($update['id']);
                
                if (!$indicator) {
                    continue;
                }
                
                if (isset($update['isApplicable'])) {
                    $indicator->is_applicable = $update['isApplicable'];
                    if (!$update['isApplicable']) {
                        $indicator->completion_rate = 0;
                    }
                }
                
                if (isset($update['status'])) {
                    $indicator->status = $update['status'];
                }
                
                $indicator->save();
                $updatedIndicators[] = $indicator;
            }
        });
        
        // Recalculer le completion_rate une seule fois après toutes les mises à jour
        foreach ($updatedIndicators as $indicator) {
            if ($indicator->is_applicable) {
                $indicator->calculateCompletionRate();
                $indicator->save(['completion_rate', 'updated_at']);
            }
        }
        
        DB::commit();
        
        return response()->json([
            'success' => true,
            'data' => [
                'updated_count' => count($updatedIndicators),
                'indicators' => $updatedIndicators->map(function ($ind) {
                    return [
                        'id' => $ind->id,
                        'number' => $ind->number,
                        'isApplicable' => $ind->is_applicable,
                        'completionRate' => $ind->completion_rate,
                        'status' => $ind->status
                    ];
                })
            ]
        ]);
        
    } catch (\Exception $e) {
        DB::rollBack();
        return response()->json([
            'success' => false,
            'error' => $e->getMessage()
        ], 500);
    }
}
```

**Points clés à implémenter:**

1. ✅ **Désactiver les triggers/signals** pendant le traitement du batch
2. ✅ **Mettre à jour tous les indicateurs** en une seule transaction
3. ✅ **Recalculer le `completionRate` une seule fois** après toutes les mises à jour
4. ✅ **Gérer les erreurs** gracieusement (continuer même si un indicateur échoue)
5. ✅ **Retourner les indicateurs mis à jour** avec leurs nouvelles valeurs

**Route à ajouter:**

```python
# Django
path('api/quality/indicators/batch-update', views.batch_update_indicators, name='batch_update_indicators'),
```

```php
// Laravel
Route::post('/api/quality/indicators/batch-update', [QualityIndicatorController::class, 'batchUpdate']);
```

