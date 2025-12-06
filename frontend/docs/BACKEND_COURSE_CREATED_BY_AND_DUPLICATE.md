# Backend Requirements: Course "Créé par" and Duplicate Functionality

## Vue d'ensemble

Ce document décrit les modifications backend nécessaires pour :
1. **Afficher l'information "Créé par"** sur les cartes de formation
2. **Implémenter la fonctionnalité de duplication** d'une formation

---

## 1. Information "Créé par" (Created By)

### 1.1 Endpoint existant à modifier

**GET** `/api/admin/organization/courses` ou l'endpoint équivalent qui retourne la liste des formations

### 1.2 Modifications requises

L'endpoint doit retourner, pour chaque formation, les informations suivantes :

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "uuid": "xxx-xxx-xxx",
      "title": "Formation Example",
      // ... autres champs existants ...
      "created_by": 123,  // ID de l'utilisateur créateur
      "created_by_user": {  // Objet utilisateur complet (optionnel mais recommandé)
        "id": 123,
        "name": "John Doe",
        "email": "john.doe@example.com",
        "avatar_url": "https://..."
      }
    }
  ]
}
```

### 1.3 Structure de données

**Champ `created_by`** (requis) :
- Type : `integer` (nullable)
- Description : ID de l'utilisateur qui a créé la formation
- Valeur par défaut : `null` si la formation a été créée avant l'ajout de ce champ

**Champ `created_by_user`** (optionnel mais recommandé) :
- Type : `object` (relation)
- Description : Objet utilisateur complet avec les informations nécessaires pour l'affichage
- Champs requis dans l'objet :
  - `id` : integer
  - `name` : string
  - `email` : string (optionnel)
  - `avatar_url` : string (optionnel)

### 1.4 Migration de base de données

Si le champ `created_by` n'existe pas déjà dans la table `courses` :

```sql
ALTER TABLE courses 
ADD COLUMN created_by INTEGER NULL,
ADD FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;
```

**Note** : Pour les formations existantes, `created_by` sera `null`. C'est acceptable.

### 1.5 Logique backend

- Lors de la création d'une formation, enregistrer automatiquement `created_by` avec l'ID de l'utilisateur authentifié
- Lors de la récupération des formations, inclure la relation `created_by_user` si disponible

---

## 2. Fonctionnalité de Duplication

### 2.1 Nouvel endpoint requis

**POST** `/api/admin/organization/courses/{courseUuid}/duplicate`

### 2.2 Description

Cet endpoint crée une copie complète d'une formation existante avec toutes ses données associées.

### 2.3 Paramètres

**URL Parameters** :
- `courseUuid` (string, requis) : UUID de la formation à dupliquer

**Body Parameters** (optionnel) :
```json
{
  "title_suffix": " (Copie)",  // Suffixe à ajouter au titre (optionnel, défaut: " (Copie)")
  "copy_participants": false,   // Copier les participants (optionnel, défaut: false)
  "copy_sessions": false,       // Copier les sessions (optionnel, défaut: false)
  "status": "draft"             // Statut de la nouvelle formation (optionnel, défaut: "draft")
}
```

### 2.4 Réponse en cas de succès

**Status Code** : `201 Created`

```json
{
  "success": true,
  "message": "Formation dupliquée avec succès",
  "data": {
    "id": 456,
    "uuid": "yyy-yyy-yyy",
    "title": "Formation Example (Copie)",
    "status": 0,
    "created_at": "2025-01-15T10:30:00Z",
    // ... tous les autres champs de la formation dupliquée ...
  }
}
```

### 2.5 Réponse en cas d'erreur

**Status Code** : `404 Not Found` (si la formation n'existe pas)

```json
{
  "success": false,
  "message": "Formation non trouvée",
  "error": "Course not found"
}
```

**Status Code** : `403 Forbidden` (si l'utilisateur n'a pas les permissions)

```json
{
  "success": false,
  "message": "Vous n'avez pas la permission de dupliquer cette formation",
  "error": "Insufficient permissions"
}
```

### 2.6 Données à dupliquer

Lors de la duplication, les éléments suivants doivent être copiés :

#### 2.6.1 Données de base de la formation
- ✅ Informations générales (titre, description, prix, durée, etc.)
- ✅ Image de couverture
- ✅ Catégorie
- ✅ Statut (par défaut : "draft" / brouillon)

#### 2.6.2 Contenu de la formation
- ✅ Chapitres et sous-chapitres
- ✅ Documents associés
- ✅ Questionnaires
- ✅ Objectifs pédagogiques
- ✅ Modules

#### 2.6.3 Configuration
- ✅ Formateurs assignés
- ✅ Workflow actions (actions automatisées)
- ✅ Paramètres de publication

#### 2.6.4 Données à NE PAS copier
- ❌ Sessions (sauf si `copy_sessions: true`)
- ❌ Participants (sauf si `copy_participants: true`)
- ❌ Historique des inscriptions
- ❌ Statistiques et résultats
- ❌ Certificats générés
- ❌ UUID (nouveau UUID généré)

### 2.7 Logique de duplication

```php
// Pseudo-code de la logique
function duplicateCourse($courseUuid, $options = []) {
    // 1. Récupérer la formation originale
    $originalCourse = Course::where('uuid', $courseUuid)->first();
    
    if (!$originalCourse) {
        throw new NotFoundException();
    }
    
    // 2. Créer une nouvelle formation avec les données de base
    $newCourse = $originalCourse->replicate();
    $newCourse->title = $originalCourse->title . ($options['title_suffix'] ?? ' (Copie)');
    $newCourse->status = $options['status'] ?? 0; // 0 = draft
    $newCourse->created_by = auth()->id();
    $newCourse->uuid = Str::uuid();
    $newCourse->save();
    
    // 3. Dupliquer les chapitres
    foreach ($originalCourse->chapters as $chapter) {
        $newChapter = $chapter->replicate();
        $newChapter->course_uuid = $newCourse->uuid;
        $newChapter->uuid = Str::uuid();
        $newChapter->save();
        
        // Dupliquer les sous-chapitres
        foreach ($chapter->subChapters as $subChapter) {
            $newSubChapter = $subChapter->replicate();
            $newSubChapter->chapter_uuid = $newChapter->uuid;
            $newSubChapter->uuid = Str::uuid();
            $newSubChapter->save();
        }
    }
    
    // 4. Dupliquer les documents
    foreach ($originalCourse->documents as $document) {
        $newDocument = $document->replicate();
        $newDocument->course_uuid = $newCourse->uuid;
        $newDocument->uuid = Str::uuid();
        $newDocument->save();
    }
    
    // 5. Dupliquer les questionnaires
    foreach ($originalCourse->questionnaires as $questionnaire) {
        $newQuestionnaire = $questionnaire->replicate();
        $newQuestionnaire->course_uuid = $newCourse->uuid;
        $newQuestionnaire->uuid = Str::uuid();
        $newQuestionnaire->save();
    }
    
    // 6. Dupliquer les formateurs
    foreach ($originalCourse->trainers as $trainer) {
        $newCourse->trainers()->attach($trainer->id, [
            'permissions' => $trainer->pivot->permissions,
            'assigned_at' => now()
        ]);
    }
    
    // 7. Dupliquer les workflow actions
    foreach ($originalCourse->workflowActions as $action) {
        $newAction = $action->replicate();
        $newAction->course_uuid = $newCourse->uuid;
        $newAction->uuid = Str::uuid();
        $newAction->save();
    }
    
    // 8. Dupliquer les sessions (si demandé)
    if ($options['copy_sessions'] ?? false) {
        foreach ($originalCourse->sessions as $session) {
            // Logique de duplication des sessions
        }
    }
    
    return $newCourse;
}
```

### 2.8 Permissions

- L'utilisateur doit avoir la permission de créer des formations
- L'utilisateur doit avoir accès à la formation originale (selon les règles d'organisation)

### 2.9 Gestion des fichiers

**Important** : Pour les fichiers (images, documents PDF, etc.) :

1. **Option 1 (Recommandé)** : Créer de nouvelles copies physiques des fichiers
   - Avantage : Les modifications sur la formation originale n'affectent pas la copie
   - Inconvénient : Consommation d'espace disque

2. **Option 2** : Référencer les mêmes fichiers
   - Avantage : Économie d'espace
   - Inconvénient : Si un fichier est supprimé, les deux formations sont affectées

**Recommandation** : Utiliser l'Option 1 pour les fichiers critiques (images de couverture, documents), et l'Option 2 pour les fichiers partagés (templates).

---

## 3. Exemples d'utilisation

### 3.1 Récupérer les formations avec "Créé par"

```http
GET /api/admin/organization/courses?per_page=12&page=1
Authorization: Bearer {token}
```

**Réponse** :
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "uuid": "abc-123",
      "title": "Formation AI",
      "created_by": 5,
      "created_by_user": {
        "id": 5,
        "name": "Marie Dupont",
        "email": "marie.dupont@example.com",
        "avatar_url": "https://example.com/avatars/5.jpg"
      }
    }
  ]
}
```

### 3.2 Dupliquer une formation

```http
POST /api/admin/organization/courses/abc-123/duplicate
Authorization: Bearer {token}
Content-Type: application/json

{
  "title_suffix": " (Copie)",
  "status": "draft"
}
```

**Réponse** :
```json
{
  "success": true,
  "message": "Formation dupliquée avec succès",
  "data": {
    "id": 2,
    "uuid": "def-456",
    "title": "Formation AI (Copie)",
    "status": 0,
    "created_by": 3,
    "created_at": "2025-01-15T10:30:00Z"
  }
}
```

---

## 4. Checklist de mise en œuvre

### Pour "Créé par" :
- [ ] Ajouter la colonne `created_by` à la table `courses` (si elle n'existe pas)
- [ ] Modifier le modèle Course pour inclure la relation `createdByUser`
- [ ] Mettre à jour l'endpoint de création pour enregistrer `created_by`
- [ ] Modifier l'endpoint de liste pour inclure `created_by_user` dans la réponse
- [ ] Tester avec des formations existantes (doivent retourner `null` si pas de créateur)

### Pour la duplication :
- [ ] Créer l'endpoint `POST /courses/{uuid}/duplicate`
- [ ] Implémenter la logique de duplication des chapitres
- [ ] Implémenter la logique de duplication des documents
- [ ] Implémenter la logique de duplication des questionnaires
- [ ] Implémenter la logique de duplication des formateurs
- [ ] Implémenter la logique de duplication des workflow actions
- [ ] Gérer la duplication des fichiers (images, PDFs)
- [ ] Ajouter les validations et gestion d'erreurs
- [ ] Tester avec une formation complète
- [ ] Vérifier les permissions

---

## 5. Notes importantes

1. **Performance** : La duplication peut être une opération lourde pour les formations complexes. Considérer l'utilisation de queues/jobs pour les grandes formations.

2. **Transactions** : Utiliser des transactions de base de données pour garantir la cohérence en cas d'erreur pendant la duplication.

3. **Validation** : Vérifier que l'utilisateur a les permissions nécessaires avant de permettre la duplication.

4. **Logging** : Logger les opérations de duplication pour le suivi et le debugging.

5. **Limites** : Considérer l'ajout de limites (ex: nombre maximum de duplications par jour) pour éviter les abus.

---

## 6. Questions / Points à clarifier

- [ ] Les formations dupliquées doivent-elles hériter des mêmes permissions d'accès que l'originale ?
- [ ] Faut-il limiter le nombre de duplications par utilisateur/organisation ?
- [ ] Les formations dupliquées doivent-elles être liées à l'originale (relation parent/enfant) ?
- [ ] Comment gérer les références externes (liens vers d'autres ressources) dans les formations dupliquées ?

---

**Date de création** : 2025-01-15  
**Dernière mise à jour** : 2025-01-15  
**Auteur** : Équipe Frontend

