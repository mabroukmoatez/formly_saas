# Backend Requirements - Pré-sélection des Formateurs dans le Modal

## Contexte

Lors de la création/modification d'un cours (étape 5/6 - Formateurs), le modal de sélection des formateurs doit pré-sélectionner (cocher) les formateurs déjà assignés au cours.

## Endpoints Concernés

### 1. `GET /api/organization/courses/{courseUuid}/trainers`

**Objectif** : Récupérer les formateurs déjà assignés au cours.

**Structure de réponse attendue** :
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "trainer_id": 45,
      "course_uuid": "uuid-du-cours",
      "permissions": { ... },
      "assigned_at": "2025-01-15T10:00:00Z",
      "trainer": {
        "id": 45,              // ⚠️ REQUIS pour la correspondance
        "uuid": "uuid-formateur",  // ⚠️ REQUIS pour la correspondance
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "+33123456789",
        "specialization": "Data Science",
        "avatar_url": "https://...",
        "is_active": true
      }
    }
  ]
}
```

**Points critiques** :
- Chaque objet dans `data` doit avoir un objet `trainer` imbriqué
- L'objet `trainer` doit contenir **à la fois** `id` (number) **ET** `uuid` (string)
- Ces deux identifiants sont utilisés pour faire la correspondance avec les formateurs disponibles

### 2. `GET /api/organization/trainers?is_active=true`

**Objectif** : Récupérer tous les formateurs disponibles de l'organisation pour la sélection.

**Structure de réponse attendue** :
```json
{
  "success": true,
  "data": [
    {
      "id": 45,              // ⚠️ REQUIS pour la correspondance
      "uuid": "uuid-formateur",  // ⚠️ REQUIS pour la correspondance
      "name": "John Doe",
      "email": "john@example.com",
      "avatar_url": "https://...",
      "specialization": "Data Science"
    }
  ]
}
```

**Points critiques** :
- Chaque formateur doit avoir **à la fois** `id` (number) **ET** `uuid` (string)
- Ces identifiants doivent correspondre exactement à ceux retournés par l'endpoint `/courses/{courseUuid}/trainers`

## Logique de Correspondance

Le frontend compare les formateurs assignés avec les formateurs disponibles en utilisant cette logique :

```typescript
// IDs des formateurs assignés
const assignedTrainerIds = courseTrainers
  .map(ct => ct.trainer?.id || ct.trainer?.uuid)
  .filter(Boolean);

// Dans le modal, comparaison avec :
const trainerId = trainer.id || trainer.uuid;
const isSelected = assignedTrainerIds.includes(trainerId);
```

**Important** : Pour que la pré-sélection fonctionne correctement, il faut que :
- Si un formateur a `id: 45` dans `/courses/{courseUuid}/trainers`, il doit aussi avoir `id: 45` dans `/trainers`
- Si un formateur a `uuid: "abc-123"` dans `/courses/{courseUuid}/trainers`, il doit aussi avoir `uuid: "abc-123"` dans `/trainers`

## Vérifications Backend

### ✅ Checklist

- [ ] L'endpoint `GET /api/organization/courses/{courseUuid}/trainers` retourne bien un objet `trainer` imbriqué pour chaque formateur assigné
- [ ] L'objet `trainer` contient bien les champs `id` (number) et `uuid` (string)
- [ ] L'endpoint `GET /api/organization/trainers` retourne bien les champs `id` (number) et `uuid` (string) pour chaque formateur
- [ ] Les identifiants (`id` et `uuid`) sont cohérents entre les deux endpoints (même formateur = mêmes identifiants)
- [ ] Les formateurs inactifs ne sont pas retournés si `is_active=true` est passé en paramètre

## Cas d'Erreur à Gérer

1. **Formateur assigné mais introuvable dans la liste disponible** :
   - Le formateur peut être inactif → Ne pas l'afficher dans la liste, mais le garder dans les formateurs assignés au cours
   - Solution : Le frontend filtre déjà avec `is_active: true`, donc les formateurs inactifs ne seront pas dans `availableTrainers`, mais resteront dans `courseTrainers`

2. **Identifiants manquants** :
   - Si `trainer.id` est `null` ou `undefined` → Utiliser `trainer.uuid`
   - Si les deux sont manquants → Le formateur ne sera pas pré-sélectionné (mais devrait être un cas d'erreur backend)

## Exemple de Test

**Scénario** : Un cours a 2 formateurs assignés (IDs: 45 et 67)

1. Appel `GET /api/organization/courses/{uuid}/trainers` :
   ```json
   {
     "data": [
       { "trainer": { "id": 45, "uuid": "uuid-45", ... } },
       { "trainer": { "id": 67, "uuid": "uuid-67", ... } }
     ]
   }
   ```

2. Appel `GET /api/organization/trainers?is_active=true` :
   ```json
   {
     "data": [
       { "id": 45, "uuid": "uuid-45", ... },
       { "id": 67, "uuid": "uuid-67", ... },
       { "id": 89, "uuid": "uuid-89", ... }  // Autre formateur non assigné
     ]
   }
   ```

3. **Résultat attendu** : Les formateurs avec `id: 45` et `id: 67` doivent être pré-cochés dans le modal.

## Notes Techniques

- Le frontend utilise `trainer.id || trainer.uuid` pour gérer les cas où un seul identifiant est disponible
- La correspondance se fait par priorité : `id` d'abord, puis `uuid` si `id` n'est pas disponible
- Les deux identifiants doivent être présents pour une correspondance fiable

## Aucun Changement Backend Nécessaire Si...

✅ Les endpoints retournent déjà :
- `trainer.id` et `trainer.uuid` dans `/courses/{courseUuid}/trainers`
- `id` et `uuid` dans `/trainers`
- Les identifiants sont cohérents entre les deux endpoints

Dans ce cas, **aucune modification backend n'est requise** - le frontend gère déjà la logique de correspondance.

