# Ajustements API Backend - Messagerie

## Vue d'ensemble

Ce document décrit les ajustements nécessaires pour l'API backend concernant les nouvelles fonctionnalités de la messagerie :
1. Suppression de conversation
2. Gestion de l'avatar/image des groupes de chat
3. Toggle pour permettre aux apprenants de répondre aux messages
4. Segmentation des participants lors de la création/modification de groupe (Formateurs vs Apprenants)

---

## 1. Suppression de Conversation

### Endpoint existant (à vérifier/améliorer)

**Endpoint**: `DELETE /api/organization/conversations/{conversation_id}`

**Méthode**: `DELETE`

**Authentification**: Requise (token JWT)

**Description**: Supprime une conversation (individuelle ou de groupe) pour l'utilisateur actuel.

**Paramètres**:
- `conversation_id` (path, requis): ID de la conversation à supprimer

**Réponse en cas de succès**:
```json
{
  "success": true,
  "message": "Conversation supprimée avec succès"
}
```

**Réponse en cas d'erreur**:
```json
{
  "success": false,
  "message": "Erreur lors de la suppression de la conversation",
  "error": "Détails de l'erreur"
}
```

**Codes de statut HTTP**:
- `200 OK`: Conversation supprimée avec succès
- `404 Not Found`: Conversation non trouvée
- `403 Forbidden`: L'utilisateur n'a pas le droit de supprimer cette conversation
- `500 Internal Server Error`: Erreur serveur

**Logique de suppression**:
- La suppression doit être "soft delete" (marquer comme supprimée) ou "hard delete" selon la logique métier
- Si c'est une conversation de groupe, vérifier les permissions (seul le créateur ou un admin peut supprimer)
- Si c'est une conversation individuelle, la supprimer pour l'utilisateur actuel uniquement
- Supprimer également tous les messages associés si nécessaire

---

## 2. Gestion de l'Avatar/Image des Groupes de Chat

### 2.1. Créer un groupe avec avatar

**Endpoint**: `POST /api/organization/conversations`

**Méthode**: `POST`

**Authentification**: Requise (token JWT)

**Description**: Crée une nouvelle conversation de groupe avec un avatar optionnel.

**Corps de la requête** (FormData):
```
type: "group"
group_name: "Nom du groupe" (requis)
participant_ids: [1, 2, 3] (requis, array d'IDs)
avatar: File (optionnel, image)
students_can_reply: true/false (optionnel, défaut: true)
instructor_ids: [1, 2] (optionnel, pour segmentation)
student_ids: [3, 4, 5] (optionnel, pour segmentation)
```

**Exemple de requête**:
```javascript
const formData = new FormData();
formData.append('type', 'group');
formData.append('group_name', 'Groupe de Formation');
formData.append('participant_ids', JSON.stringify([1, 2, 3, 4, 5]));
formData.append('avatar', fileObject); // File object
formData.append('students_can_reply', 'true');
formData.append('instructor_ids', JSON.stringify([1, 2]));
formData.append('student_ids', JSON.stringify([3, 4, 5]));
```

**Réponse en cas de succès**:
```json
{
  "success": true,
  "data": {
    "conversation": {
      "id": 123,
      "type": "group",
      "group": {
        "id": 45,
        "name": "Groupe de Formation",
        "avatar": "uploads/conversations/groups/123-avatar.jpg",
        "avatar_url": "http://localhost:8000/storage/uploads/conversations/groups/123-avatar.jpg",
        "participants_count": 5,
        "students_can_reply": true
      },
      "unread_count": 0,
      "updated_at": "2024-01-15T10:30:00Z"
    }
  }
}
```

**Validation**:
- `group_name`: Requis, min 1 caractère, max 255 caractères
- `participant_ids`: Requis, array non vide, min 1 participant
- `avatar`: Optionnel, format image (jpg, jpeg, png, gif, webp), max 5MB
- `students_can_reply`: Optionnel, boolean, défaut: true
- `instructor_ids` et `student_ids`: Optionnels, doivent être des sous-ensembles de `participant_ids`

### 2.2. Mettre à jour l'avatar d'un groupe

**Endpoint**: `PATCH /api/organization/conversations/{conversation_id}/group/avatar`

**Méthode**: `PATCH`

**Authentification**: Requise (token JWT)

**Description**: Met à jour l'avatar d'une conversation de groupe.

**Paramètres**:
- `conversation_id` (path, requis): ID de la conversation

**Corps de la requête** (FormData):
```
avatar: File (requis, image)
```

**Réponse en cas de succès**:
```json
{
  "success": true,
  "data": {
    "avatar": "uploads/conversations/groups/123-avatar.jpg",
    "avatar_url": "http://localhost:8000/storage/uploads/conversations/groups/123-avatar.jpg"
  },
  "message": "Avatar mis à jour avec succès"
}
```

**Validation**:
- `avatar`: Requis, format image (jpg, jpeg, png, gif, webp), max 5MB

**Permissions**:
- Seul le créateur du groupe ou un admin peut modifier l'avatar

### 2.3. Supprimer l'avatar d'un groupe

**Endpoint**: `DELETE /api/organization/conversations/{conversation_id}/group/avatar`

**Méthode**: `DELETE`

**Authentification**: Requise (token JWT)

**Description**: Supprime l'avatar d'une conversation de groupe.

**Paramètres**:
- `conversation_id` (path, requis): ID de la conversation

**Réponse en cas de succès**:
```json
{
  "success": true,
  "message": "Avatar supprimé avec succès"
}
```

---

## 3. Toggle "Les apprenants peuvent répondre aux messages"

### 3.1. Mettre à jour le paramètre `students_can_reply`

**Endpoint**: `PATCH /api/organization/conversations/{conversation_id}/group/settings`

**Méthode**: `PATCH`

**Authentification**: Requise (token JWT)

**Description**: Met à jour les paramètres d'une conversation de groupe, notamment si les apprenants peuvent répondre.

**Paramètres**:
- `conversation_id` (path, requis): ID de la conversation

**Corps de la requête** (JSON):
```json
{
  "students_can_reply": true
}
```

**Réponse en cas de succès**:
```json
{
  "success": true,
  "data": {
    "conversation": {
      "id": 123,
      "group": {
        "id": 45,
        "name": "Groupe de Formation",
        "students_can_reply": false,
        "participants_count": 5
      }
    }
  },
  "message": "Paramètres mis à jour avec succès"
}
```

**Validation**:
- `students_can_reply`: Requis, boolean

**Logique métier**:
- Si `students_can_reply` est `false`, seuls les formateurs et admins peuvent envoyer des messages
- Les apprenants peuvent toujours lire les messages
- Vérifier le rôle de l'utilisateur avant d'autoriser l'envoi de message

**Permissions**:
- Seul le créateur du groupe ou un admin peut modifier ce paramètre

### 3.2. Vérification lors de l'envoi de message

**Endpoint existant**: `POST /api/organization/conversations/{conversation_id}/messages`

**Modification nécessaire**: Ajouter une vérification avant d'autoriser l'envoi de message

**Logique à ajouter**:
```php
// Pseudo-code
if ($conversation->type === 'group' && !$conversation->group->students_can_reply) {
    $userRole = $currentUser->role;
    $allowedRoles = ['instructor', 'admin', 'formateur'];
    
    if (!in_array($userRole, $allowedRoles)) {
        return response()->json([
            'success' => false,
            'message' => 'Les apprenants ne peuvent pas répondre dans ce groupe'
        ], 403);
    }
}
```

---

## 4. Segmentation des Participants (Formateurs vs Apprenants)

### 4.1. Créer un groupe avec segmentation

**Endpoint**: `POST /api/organization/conversations`

**Méthode**: `POST`

**Description**: Crée un groupe avec distinction entre formateurs et apprenants.

**Corps de la requête** (FormData ou JSON):
```
type: "group" (requis)
group_name: "Nom du groupe" (requis)
instructor_ids: [1, 2] (optionnel, array d'IDs de formateurs)
student_ids: [3, 4, 5] (optionnel, array d'IDs d'apprenants)
participant_ids: [1, 2, 3, 4, 5] (optionnel, si instructor_ids et student_ids sont fournis, sera calculé automatiquement)
avatar: File (optionnel)
students_can_reply: true/false (optionnel, défaut: true)
```

**Logique**:
- Si `instructor_ids` et `student_ids` sont fournis, calculer automatiquement `participant_ids = instructor_ids + student_ids`
- Si seulement `participant_ids` est fourni, déterminer automatiquement les rôles en fonction des utilisateurs
- Si les deux sont fournis, `participant_ids` doit être l'union de `instructor_ids` et `student_ids`

**Réponse en cas de succès**:
```json
{
  "success": true,
  "data": {
    "conversation": {
      "id": 123,
      "type": "group",
      "group": {
        "id": 45,
        "name": "Groupe de Formation",
        "participants_count": 5,
        "instructors_count": 2,
        "students_count": 3,
        "students_can_reply": true
      }
    }
  }
}
```

### 4.2. Ajouter des participants avec segmentation

**Endpoint**: `POST /api/organization/conversations/{conversation_id}/participants/add`

**Méthode**: `POST`

**Authentification**: Requise (token JWT)

**Description**: Ajoute des participants à un groupe avec distinction formateurs/apprenants.

**Paramètres**:
- `conversation_id` (path, requis): ID de la conversation

**Corps de la requête** (JSON):
```json
{
  "instructor_ids": [6, 7],
  "student_ids": [8, 9, 10]
}
```

**Ou**:
```json
{
  "participant_ids": [6, 7, 8, 9, 10],
  "participant_types": {
    "6": "instructor",
    "7": "instructor",
    "8": "student",
    "9": "student",
    "10": "student"
  }
}
```

**Réponse en cas de succès**:
```json
{
  "success": true,
  "data": {
    "conversation": {
      "id": 123,
      "group": {
        "participants_count": 10,
        "instructors_count": 4,
        "students_count": 6
      }
    }
  },
  "message": "Participants ajoutés avec succès"
}
```

### 4.3. Obtenir les participants avec leurs rôles

**Endpoint**: `GET /api/organization/conversations/{conversation_id}/participants`

**Méthode**: `GET`

**Authentification**: Requise (token JWT)

**Description**: Récupère la liste des participants d'une conversation avec distinction formateurs/apprenants.

**Paramètres**:
- `conversation_id` (path, requis): ID de la conversation

**Réponse en cas de succès**:
```json
{
  "success": true,
  "data": {
    "participants": [
      {
        "id": 1,
        "name": "Jean Dupont",
        "email": "jean@example.com",
        "role": "instructor",
        "avatar": "uploads/users/1-avatar.jpg",
        "avatar_url": "http://localhost:8000/storage/uploads/users/1-avatar.jpg",
        "is_online": true
      },
      {
        "id": 3,
        "name": "Marie Martin",
        "email": "marie@example.com",
        "role": "student",
        "avatar": null,
        "avatar_url": null,
        "is_online": false
      }
    ],
    "instructors": [
      {
        "id": 1,
        "name": "Jean Dupont",
        "email": "jean@example.com",
        "role": "instructor",
        "avatar_url": "http://localhost:8000/storage/uploads/users/1-avatar.jpg",
        "is_online": true
      }
    ],
    "students": [
      {
        "id": 3,
        "name": "Marie Martin",
        "email": "marie@example.com",
        "role": "student",
        "avatar_url": null,
        "is_online": false
      }
    ],
    "counts": {
      "total": 5,
      "instructors": 2,
      "students": 3
    }
  }
}
```

---

## 5. Structure de données mise à jour

### 5.1. Interface Conversation (mise à jour)

```typescript
export interface Conversation {
  id: number;
  type: 'individual' | 'group';
  participant?: ChatUser;
  group?: {
    id: number;
    name: string;
    avatar?: string;
    avatar_url?: string;
    participants_count: number;
    instructors_count?: number;  // NOUVEAU
    students_count?: number;     // NOUVEAU
    students_can_reply: boolean; // NOUVEAU
    created_by_id?: number;      // NOUVEAU (pour vérifier les permissions)
  };
  last_message?: {
    id: number;
    content: string;
    sender?: ChatUser;
    created_at: string;
    is_read: boolean;
  };
  unread_count: number;
  total_messages: number;
  updated_at: string;
}
```

### 5.2. Table de base de données (suggestions)

**Table `conversations`**:
- `id` (primary key)
- `type` (enum: 'individual', 'group')
- `created_by_id` (foreign key vers users)
- `created_at`
- `updated_at`
- `deleted_at` (pour soft delete)

**Table `conversation_groups`** (nouvelle ou extension):
- `id` (primary key)
- `conversation_id` (foreign key vers conversations)
- `name` (string)
- `avatar` (string, nullable, chemin vers l'image)
- `students_can_reply` (boolean, défaut: true)
- `created_at`
- `updated_at`

**Table `conversation_participants`** (nouvelle ou extension):
- `id` (primary key)
- `conversation_id` (foreign key vers conversations)
- `user_id` (foreign key vers users)
- `role` (enum: 'instructor', 'student', 'admin') - NOUVEAU
- `joined_at` (timestamp)
- `left_at` (timestamp, nullable)

---

## 6. Règles de validation et logique métier

### 6.1. Suppression de conversation
- **Conversation individuelle**: Chaque utilisateur peut supprimer sa propre conversation
- **Conversation de groupe**: Seul le créateur ou un admin peut supprimer le groupe
- La suppression doit être "soft delete" pour permettre la récupération si nécessaire

### 6.2. Avatar de groupe
- Formats acceptés: jpg, jpeg, png, gif, webp
- Taille maximale: 5MB
- Dimensions recommandées: 512x512px (carré)
- Redimensionnement automatique si nécessaire
- Suppression de l'ancien avatar lors de la mise à jour

### 6.3. Toggle `students_can_reply`
- Par défaut: `true` (les apprenants peuvent répondre)
- Si `false`, seuls les formateurs et admins peuvent envoyer des messages
- Les apprenants peuvent toujours lire les messages
- Vérification du rôle lors de l'envoi de chaque message

### 6.4. Segmentation formateurs/apprenants
- Lors de la création, si `instructor_ids` et `student_ids` sont fournis, les utiliser directement
- Si seulement `participant_ids` est fourni, déterminer automatiquement les rôles en interrogeant la table `users`
- Lors de l'ajout de participants, maintenir la distinction formateurs/apprenants
- Permettre l'ajout séparé de formateurs et d'apprenants

---

## 7. Exemples de requêtes

### 7.1. Créer un groupe avec avatar et segmentation

```javascript
const formData = new FormData();
formData.append('type', 'group');
formData.append('group_name', 'Formation React Avancé');
formData.append('instructor_ids', JSON.stringify([1, 2]));
formData.append('student_ids', JSON.stringify([3, 4, 5, 6, 7]));
formData.append('students_can_reply', 'true');
formData.append('avatar', avatarFile);

const response = await fetch('/api/organization/conversations', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});
```

### 7.2. Mettre à jour l'avatar d'un groupe

```javascript
const formData = new FormData();
formData.append('avatar', newAvatarFile);

const response = await fetch(`/api/organization/conversations/${conversationId}/group/avatar`, {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});
```

### 7.3. Modifier le paramètre `students_can_reply`

```javascript
const response = await fetch(`/api/organization/conversations/${conversationId}/group/settings`, {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    students_can_reply: false
  })
});
```

### 7.4. Ajouter des formateurs et apprenants séparément

```javascript
// Ajouter des formateurs
const response1 = await fetch(`/api/organization/conversations/${conversationId}/participants/add`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    instructor_ids: [8, 9]
  })
});

// Ajouter des apprenants
const response2 = await fetch(`/api/organization/conversations/${conversationId}/participants/add`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    student_ids: [10, 11, 12]
  })
});
```

### 7.5. Supprimer une conversation

```javascript
const response = await fetch(`/api/organization/conversations/${conversationId}`, {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

---

## 8. Checklist d'implémentation

### Backend
- [ ] Vérifier/implémenter l'endpoint de suppression de conversation
- [ ] Ajouter le support de l'avatar lors de la création de groupe
- [ ] Créer l'endpoint pour mettre à jour l'avatar d'un groupe
- [ ] Créer l'endpoint pour supprimer l'avatar d'un groupe
- [ ] Ajouter le champ `students_can_reply` dans la table `conversation_groups`
- [ ] Créer l'endpoint pour mettre à jour `students_can_reply`
- [ ] Ajouter la vérification du rôle lors de l'envoi de message
- [ ] Ajouter le champ `role` dans la table `conversation_participants`
- [ ] Modifier l'endpoint de création de groupe pour accepter `instructor_ids` et `student_ids`
- [ ] Modifier l'endpoint d'ajout de participants pour supporter la segmentation
- [ ] Créer l'endpoint pour récupérer les participants avec leurs rôles
- [ ] Ajouter les migrations de base de données nécessaires
- [ ] Ajouter les validations et règles de permissions
- [ ] Ajouter les tests unitaires et d'intégration

### Frontend (déjà en cours)
- [ ] Ajouter le bouton de suppression avec modal de confirmation
- [ ] Améliorer l'affichage des avatars
- [ ] Ajouter l'upload d'image pour les groupes
- [ ] Ajouter le toggle switch pour `students_can_reply`
- [ ] Segmenter l'interface d'ajout d'utilisateurs (Formateurs vs Apprenants)

---

## 9. Notes importantes

1. **Sécurité**: Toujours vérifier les permissions avant d'autoriser les modifications
2. **Performance**: Optimiser les requêtes pour éviter les N+1 queries lors de la récupération des participants
3. **Compatibilité**: S'assurer que les nouvelles fonctionnalités sont rétrocompatibles avec les conversations existantes
4. **Notifications**: Envoyer des notifications Pusher lors des modifications importantes (suppression, changement d'avatar, etc.)
5. **Audit**: Logger toutes les actions importantes (suppression, modification de paramètres)

---

## 10. Tests suggérés

### Tests unitaires
- Test de suppression de conversation individuelle
- Test de suppression de conversation de groupe (avec/sans permissions)
- Test d'upload d'avatar (formats valides/invalides)
- Test de mise à jour de `students_can_reply`
- Test de création de groupe avec segmentation
- Test d'ajout de participants avec segmentation
- Test de vérification du rôle lors de l'envoi de message

### Tests d'intégration
- Test complet du flux de création de groupe avec avatar et segmentation
- Test du flux de modification d'un groupe existant
- Test de suppression et récupération de conversation
- Test des permissions et restrictions d'accès

---

**Date de création**: 2024-01-15  
**Version**: 1.0  
**Auteur**: Équipe de développement







