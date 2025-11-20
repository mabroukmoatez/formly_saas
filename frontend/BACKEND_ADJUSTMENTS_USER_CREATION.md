# Ajustements Backend pour la Création d'Utilisateur avec Invitation par Email

## Vue d'ensemble

Ce document décrit les ajustements nécessaires au backend pour supporter la création d'utilisateurs **sans mot de passe**, avec envoi automatique d'un email d'invitation contenant un lien pour créer le mot de passe et se connecter.

## Objectifs

1. **Assigner automatiquement l'organisation** lors de la création d'utilisateur
2. **Rendre le mot de passe optionnel** lors de la création
3. **Envoyer un email d'invitation** avec un lien sécurisé pour créer le mot de passe
4. **Créer un endpoint** pour définir le mot de passe via le lien d'invitation

## 1. Modifications de l'API de Création d'Utilisateur

### 1.1 Endpoint : Créer un Utilisateur

**Endpoint:** `POST /api/organization/users`

**Request Body (JSON):**
```json
{
  "name": "string (requis)",
  "email": "string (requis, unique)",
  "password": "string (optionnel - si non fourni, envoi d'email d'invitation)",
  "role_id": "integer (requis)",
  "organization_id": "integer (requis - toujours assigné automatiquement)",
  "status": "integer (requis, 1 = actif, 0 = inactif)",
  "phone": "string (optionnel)",
  "address": "string (optionnel)"
}
```

**Changements requis :**
- Le champ `password` devient **optionnel**
- Le champ `organization_id` doit être **toujours assigné** (ne peut pas être NULL)
- Si `password` n'est pas fourni, générer un **token d'invitation** et envoyer un email

**Validation:**
```php
// Exemple en PHP/Laravel
$rules = [
    'name' => 'required|string|max:255',
    'email' => 'required|email|unique:users,email',
    'password' => 'nullable|string|min:8', // Optionnel maintenant
    'role_id' => 'required|exists:organization_roles,id',
    'organization_id' => 'required|exists:organizations,id', // Toujours requis
    'status' => 'required|integer|in:0,1',
    'phone' => 'nullable|string|max:20',
    'address' => 'nullable|string|max:500',
];
```

### 1.2 Logique de Création

```php
// Exemple en PHP/Laravel
public function createUser(Request $request)
{
    $validated = $request->validate($rules);
    
    // Toujours assigner l'organisation depuis le contexte de l'utilisateur authentifié
    // ou depuis le token/organization_id fourni
    $organizationId = $validated['organization_id'] ?? auth()->user()->organization_id;
    
    if (!$organizationId) {
        return response()->json([
            'success' => false,
            'message' => 'Organisation non trouvée'
        ], 400);
    }
    
    // Créer l'utilisateur
    $user = User::create([
        'name' => $validated['name'],
        'email' => $validated['email'],
        'password' => $validated['password'] 
            ? Hash::make($validated['password']) 
            : null, // Pas de mot de passe si non fourni
        'organization_id' => $organizationId, // Toujours assigné
        'status' => $validated['status'],
        'phone_number' => $validated['phone'] ?? null,
        'address' => $validated['address'] ?? null,
        'email_verified_at' => $validated['password'] ? now() : null, // Vérifié seulement si mot de passe fourni
    ]);
    
    // Assigner le rôle
    $user->organization_roles()->attach($validated['role_id'], [
        'organization_id' => $organizationId
    ]);
    
    // Si pas de mot de passe, générer token d'invitation et envoyer email
    if (!$validated['password']) {
        $token = Str::random(64);
        $expiresAt = now()->addDays(7); // Lien valide 7 jours
        
        // Sauvegarder le token d'invitation
        PasswordResetToken::create([
            'email' => $user->email,
            'token' => Hash::make($token),
            'type' => 'password_setup', // Type spécial pour création de mot de passe
            'created_at' => now(),
            'expires_at' => $expiresAt,
        ]);
        
        // Envoyer l'email d'invitation
        $this->sendPasswordSetupEmail($user, $token);
    }
    
    return response()->json([
        'success' => true,
        'message' => $validated['password'] 
            ? 'Utilisateur créé avec succès' 
            : 'Utilisateur créé avec succès. Un email d\'invitation a été envoyé.',
        'data' => [
            'user' => $user->load('organization_roles')
        ]
    ], 201);
}
```

## 2. Table pour les Tokens d'Invitation

### 2.1 Structure de la Table

```sql
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) NOT NULL,
  token VARCHAR(255) NOT NULL COMMENT 'Token hashé',
  type ENUM('password_reset', 'password_setup') DEFAULT 'password_reset' COMMENT 'Type de token',
  expires_at TIMESTAMP NOT NULL COMMENT 'Date d\'expiration du token',
  used_at TIMESTAMP NULL COMMENT 'Date d\'utilisation du token',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_token (token(64)),
  INDEX idx_type (type),
  INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Note:** Si vous avez déjà une table `password_resets`, ajoutez simplement le champ `type` :

```sql
ALTER TABLE password_resets 
  ADD COLUMN type ENUM('password_reset', 'password_setup') DEFAULT 'password_reset' AFTER token,
  ADD INDEX idx_type (type);
```

## 3. Endpoint pour Définir le Mot de Passe

### 3.1 Vérifier le Token d'Invitation

**Endpoint:** `GET /api/auth/verify-invitation/{token}`

**Response Success (200):**
```json
{
  "success": true,
  "message": "Token valide",
  "data": {
    "email": "user@example.com",
    "name": "Jean Dupont",
    "organization": {
      "id": 1,
      "name": "Mon Organisation"
    },
    "expires_at": "2025-05-08T10:00:00Z"
  }
}
```

**Response Error (400/404):**
```json
{
  "success": false,
  "message": "Token invalide ou expiré"
}
```

### 3.2 Définir le Mot de Passe

**Endpoint:** `POST /api/auth/setup-password`

**Request Body:**
```json
{
  "token": "string (requis)",
  "password": "string (requis, min 8 caractères)",
  "password_confirmation": "string (requis, doit correspondre à password)"
}
```

**Validation:**
- `token`: requis, doit exister et ne pas être expiré
- `password`: requis, minimum 8 caractères
- `password_confirmation`: requis, doit correspondre à `password`

**Logique:**
```php
public function setupPassword(Request $request)
{
    $validated = $request->validate([
        'token' => 'required|string',
        'password' => 'required|string|min:8|confirmed',
    ]);
    
    // Trouver le token
    $tokenRecord = PasswordResetToken::where('type', 'password_setup')
        ->where('expires_at', '>', now())
        ->whereNull('used_at')
        ->get()
        ->first(function ($record) use ($validated) {
            return Hash::check($validated['token'], $record->token);
        });
    
    if (!$tokenRecord) {
        return response()->json([
            'success' => false,
            'message' => 'Token invalide ou expiré'
        ], 400);
    }
    
    // Trouver l'utilisateur
    $user = User::where('email', $tokenRecord->email)->first();
    
    if (!$user) {
        return response()->json([
            'success' => false,
            'message' => 'Utilisateur non trouvé'
        ], 404);
    }
    
    // Définir le mot de passe
    $user->password = Hash::make($validated['password']);
    $user->email_verified_at = now(); // Marquer l'email comme vérifié
    $user->save();
    
    // Marquer le token comme utilisé
    $tokenRecord->used_at = now();
    $tokenRecord->save();
    
    // Optionnel : Supprimer tous les autres tokens d'invitation pour cet utilisateur
    PasswordResetToken::where('email', $user->email)
        ->where('type', 'password_setup')
        ->whereNull('used_at')
        ->delete();
    
    return response()->json([
        'success' => true,
        'message' => 'Mot de passe défini avec succès. Vous pouvez maintenant vous connecter.',
        'data' => [
            'user' => [
                'id' => $user->id,
                'email' => $user->email,
                'name' => $user->name
            ]
        ]
    ], 200);
}
```

## 4. Email d'Invitation

### 4.1 Template d'Email

**Sujet:** `Invitation à rejoindre {Nom de l'organisation}`

**Contenu (HTML):**
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #007aff; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px; background-color: #f9f9f9; }
        .button { display: inline-block; padding: 12px 30px; background-color: #007aff; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Invitation à rejoindre {Nom de l'organisation}</h1>
        </div>
        <div class="content">
            <p>Bonjour {Nom de l'utilisateur},</p>
            
            <p>Vous avez été invité(e) à rejoindre <strong>{Nom de l'organisation}</strong> sur notre plateforme.</p>
            
            <p>Pour activer votre compte et créer votre mot de passe, cliquez sur le bouton ci-dessous :</p>
            
            <div style="text-align: center;">
                <a href="{URL_FRONTEND}/setup-password?token={TOKEN}" class="button">
                    Créer mon mot de passe
                </a>
            </div>
            
            <p>Ou copiez-collez ce lien dans votre navigateur :</p>
            <p style="word-break: break-all; color: #007aff;">
                {URL_FRONTEND}/setup-password?token={TOKEN}
            </p>
            
            <p><strong>Ce lien est valide pendant 7 jours.</strong></p>
            
            <p>Si vous n'avez pas demandé cette invitation, vous pouvez ignorer cet email.</p>
        </div>
        <div class="footer">
            <p>Cet email a été envoyé par {Nom de l'organisation}</p>
            <p>&copy; {Année} Tous droits réservés</p>
        </div>
    </div>
</body>
</html>
```

### 4.2 Fonction d'Envoi d'Email

```php
// Exemple en PHP/Laravel
private function sendPasswordSetupEmail(User $user, string $token)
{
    $organization = $user->organization;
    $frontendUrl = env('FRONTEND_URL', 'http://localhost:5173');
    $setupUrl = "{$frontendUrl}/setup-password?token={$token}";
    
    Mail::send('emails.password-setup', [
        'user' => $user,
        'organization' => $organization,
        'setupUrl' => $setupUrl,
        'token' => $token,
    ], function ($message) use ($user, $organization) {
        $message->to($user->email, $user->name)
            ->subject("Invitation à rejoindre {$organization->organization_name}");
    });
}
```

## 5. Page Frontend pour Définir le Mot de Passe

### 5.1 Route Frontend

**Route:** `/setup-password?token={token}`

**Fonctionnalités:**
1. Vérifier le token via `GET /api/auth/verify-invitation/{token}`
2. Afficher un formulaire pour définir le mot de passe
3. Soumettre le mot de passe via `POST /api/auth/setup-password`
4. Rediriger vers la page de connexion après succès

**Note:** Cette page doit être créée dans le frontend. Voir les spécifications ci-dessous.

## 6. Modifications de la Base de Données

### 6.1 Table `users`

**Vérifier que :**
- Le champ `password` peut être `NULL`
- Le champ `organization_id` est **requis** (NOT NULL)
- Le champ `email_verified_at` peut être `NULL` (sera défini lors de la création du mot de passe)

```sql
-- Vérifier/Modifier la structure
ALTER TABLE users 
  MODIFY COLUMN password VARCHAR(255) NULL COMMENT 'NULL si utilisateur invité (pas encore de mot de passe)',
  MODIFY COLUMN organization_id INT NOT NULL COMMENT 'Toujours requis',
  MODIFY COLUMN email_verified_at TIMESTAMP NULL COMMENT 'Défini lors de la création du mot de passe';
```

### 6.2 Table `password_reset_tokens` ou `password_resets`

**Ajouter le champ `type` si nécessaire :**

```sql
ALTER TABLE password_resets 
  ADD COLUMN type ENUM('password_reset', 'password_setup') DEFAULT 'password_reset' AFTER token,
  ADD COLUMN expires_at TIMESTAMP NULL AFTER type,
  ADD COLUMN used_at TIMESTAMP NULL AFTER expires_at,
  ADD INDEX idx_type (type),
  ADD INDEX idx_expires_at (expires_at);
```

## 7. Sécurité

### 7.1 Génération du Token

- Utiliser une fonction cryptographique sécurisée (ex: `random_bytes()` en PHP)
- Longueur minimale : 64 caractères
- Stocker le hash du token dans la base de données (pas le token en clair)

### 7.2 Expiration du Token

- Durée de validité : **7 jours** (recommandé)
- Vérifier l'expiration à chaque utilisation
- Supprimer les tokens expirés périodiquement (cron job)

### 7.3 Utilisation Unique

- Marquer le token comme utilisé (`used_at`) après utilisation réussie
- Empêcher la réutilisation du même token
- Supprimer les autres tokens d'invitation non utilisés pour le même utilisateur

### 7.4 Rate Limiting

- Limiter le nombre de tentatives de vérification de token (ex: 5 par heure)
- Limiter le nombre d'emails d'invitation envoyés (ex: 3 par jour par utilisateur)

## 8. Gestion des Erreurs

### 8.1 Cas d'Erreur à Gérer

1. **Token invalide**
   - Token n'existe pas
   - Token déjà utilisé
   - Token expiré

2. **Email déjà utilisé**
   - Vérifier l'unicité de l'email avant création

3. **Organisation non trouvée**
   - Vérifier que l'organisation existe
   - Vérifier les permissions de l'utilisateur créateur

4. **Échec d'envoi d'email**
   - Logger l'erreur
   - Retourner une erreur appropriée
   - Optionnel : Permettre la ré-envoi de l'invitation

## 9. Endpoint pour Ré-envoyer l'Invitation

### 9.1 Ré-envoyer l'Email d'Invitation

**Endpoint:** `POST /api/organization/users/{id}/resend-invitation`

**Logique:**
```php
public function resendInvitation($userId)
{
    $user = User::findOrFail($userId);
    
    // Vérifier que l'utilisateur n'a pas encore de mot de passe
    if ($user->password) {
        return response()->json([
            'success' => false,
            'message' => 'Cet utilisateur a déjà un mot de passe'
        ], 400);
    }
    
    // Générer un nouveau token
    $token = Str::random(64);
    $expiresAt = now()->addDays(7);
    
    // Supprimer les anciens tokens non utilisés
    PasswordResetToken::where('email', $user->email)
        ->where('type', 'password_setup')
        ->whereNull('used_at')
        ->delete();
    
    // Créer le nouveau token
    PasswordResetToken::create([
        'email' => $user->email,
        'token' => Hash::make($token),
        'type' => 'password_setup',
        'expires_at' => $expiresAt,
    ]);
    
    // Envoyer l'email
    $this->sendPasswordSetupEmail($user, $token);
    
    return response()->json([
        'success' => true,
        'message' => 'Email d\'invitation renvoyé avec succès'
    ], 200);
}
```

## 10. Tests Recommandés

1. **Test de création sans mot de passe**
   - Créer un utilisateur sans mot de passe
   - Vérifier que le token est généré
   - Vérifier que l'email est envoyé

2. **Test de création avec mot de passe**
   - Créer un utilisateur avec mot de passe
   - Vérifier que l'utilisateur peut se connecter immédiatement
   - Vérifier qu'aucun email n'est envoyé

3. **Test de vérification de token**
   - Vérifier un token valide
   - Vérifier un token expiré
   - Vérifier un token déjà utilisé
   - Vérifier un token invalide

4. **Test de définition de mot de passe**
   - Définir le mot de passe avec un token valide
   - Vérifier que l'utilisateur peut se connecter
   - Vérifier que le token est marqué comme utilisé

5. **Test d'assignation d'organisation**
   - Vérifier que l'organisation est toujours assignée
   - Vérifier que l'utilisateur appartient bien à l'organisation

6. **Test de ré-envoi d'invitation**
   - Ré-envoyer l'invitation pour un utilisateur sans mot de passe
   - Vérifier qu'un nouveau token est généré
   - Vérifier que l'email est envoyé

## 11. Variables d'Environnement

Ajouter les variables suivantes dans votre fichier `.env` :

```env
# URL du frontend (pour les liens dans les emails)
FRONTEND_URL=http://localhost:5173

# Configuration email (déjà existante normalement)
MAIL_MAILER=smtp
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USERNAME=your_username
MAIL_PASSWORD=your_password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@example.com
MAIL_FROM_NAME="${APP_NAME}"
```

## 12. Migration de Données (si nécessaire)

Si des utilisateurs existent sans organisation :

```sql
-- Assigner une organisation par défaut aux utilisateurs sans organisation
-- ATTENTION : Ajustez selon votre logique métier
UPDATE users 
SET organization_id = (
    SELECT id FROM organizations LIMIT 1
)
WHERE organization_id IS NULL;
```

## 13. Notes Importantes

- **Le mot de passe est optionnel** uniquement lors de la création
- **L'organisation doit toujours être assignée** - ne jamais créer un utilisateur sans organisation
- **Le token d'invitation expire après 7 jours** - l'utilisateur doit créer son mot de passe avant expiration
- **Un seul token actif** par utilisateur à la fois (les anciens sont supprimés lors de la génération d'un nouveau)
- **L'email est vérifié** (`email_verified_at`) uniquement après la création du mot de passe
- **Sécurité** : Toujours hasher les tokens avant stockage en base de données

## 14. Workflow Complet

1. **Admin crée un utilisateur** (sans mot de passe)
   - Frontend envoie : `POST /api/organization/users` (sans `password`)
   - Backend crée l'utilisateur avec `password = NULL`
   - Backend génère un token d'invitation
   - Backend envoie un email avec le lien

2. **Utilisateur reçoit l'email**
   - Clique sur le lien : `{FRONTEND_URL}/setup-password?token={TOKEN}`

3. **Page frontend vérifie le token**
   - Frontend appelle : `GET /api/auth/verify-invitation/{token}`
   - Backend vérifie le token et retourne les infos utilisateur

4. **Utilisateur définit son mot de passe**
   - Frontend envoie : `POST /api/auth/setup-password` avec `token` et `password`
   - Backend définit le mot de passe
   - Backend marque le token comme utilisé
   - Backend marque l'email comme vérifié

5. **Utilisateur se connecte**
   - Utilise son email et le mot de passe qu'il vient de créer

