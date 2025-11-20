# Ajustements Backend pour le Modal d'Ajout de Dépense

## Vue d'ensemble

Ce document décrit les ajustements nécessaires au backend pour supporter le nouveau modal d'ajout de dépense avec les fonctionnalités suivantes :
- Catégories : "Moyens Humains" et "Moyens Environnementaux"
- Champs conditionnels pour "Moyens Humains" : Poste/Rôle et Type de Contrat
- Multi-upload de pièces jointes
- Liaison avec les formations

## 1. Modèle de Données (Database Schema)

### Table `charges` ou `expenses`

#### Champs existants à conserver :
- `id` (primary key)
- `organization_id` (foreign key)
- `label` (string) - Libellé de la dépense
- `amount` (decimal) - Montant
- `category` (string) - Catégorie
- `date` (date) - Date de la dépense
- `created_at` (timestamp)
- `updated_at` (timestamp)

#### Nouveaux champs à ajouter/modifier :

```sql
-- Modifier le champ category pour accepter les nouvelles valeurs
ALTER TABLE charges MODIFY COLUMN category ENUM('Moyens Humains', 'Moyens Environnementaux', 'Dépenses RH') 
  DEFAULT NULL;

-- Ajouter les nouveaux champs conditionnels
ALTER TABLE charges 
  ADD COLUMN role VARCHAR(255) NULL COMMENT 'Poste/Rôle (requis pour Moyens Humains)',
  ADD COLUMN contract_type VARCHAR(255) NULL COMMENT 'Type de contrat (requis pour Moyens Humains)',
  ADD COLUMN course_id INT NULL COMMENT 'ID de la formation liée (optionnel)',
  ADD FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL;

-- Index pour améliorer les performances
CREATE INDEX idx_charges_category ON charges(category);
CREATE INDEX idx_charges_course_id ON charges(course_id);
CREATE INDEX idx_charges_role ON charges(role);
```

### Table `charge_documents` ou `expense_documents`

Cette table doit supporter le multi-upload :

```sql
CREATE TABLE IF NOT EXISTS charge_documents (
  id INT PRIMARY KEY AUTO_INCREMENT,
  charge_id INT NOT NULL,
  file_path VARCHAR(500) NOT NULL COMMENT 'Chemin du fichier dans le storage',
  original_name VARCHAR(255) NOT NULL COMMENT 'Nom original du fichier',
  file_size INT NOT NULL COMMENT 'Taille du fichier en bytes',
  mime_type VARCHAR(100) NOT NULL COMMENT 'Type MIME du fichier',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (charge_id) REFERENCES charges(id) ON DELETE CASCADE,
  INDEX idx_charge_documents_charge_id (charge_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## 2. API Endpoints

### 2.1 Créer une Dépense

**Endpoint:** `POST /api/organization/commercial/charges`

**Request Body (FormData):**
```json
{
  "label": "string (requis)",
  "amount": "decimal (requis)",
  "category": "string (requis) - 'Moyens Humains' ou 'Moyens Environnementaux'",
  "role": "string (optionnel, requis si category = 'Moyens Humains')",
  "contract_type": "string (optionnel, requis si category = 'Moyens Humains')",
  "course_id": "integer (optionnel)",
  "documents[]": "file[] (optionnel, multiple fichiers)"
}
```

**Validation:**
- `label`: requis, string, max 255 caractères
- `amount`: requis, decimal, > 0
- `category`: requis, doit être 'Moyens Humains' ou 'Moyens Environnementaux'
- `role`: requis si `category` = 'Moyens Humains', optionnel sinon
- `contract_type`: requis si `category` = 'Moyens Humains', optionnel sinon
- `course_id`: optionnel, doit exister dans la table `courses` si fourni
- `documents[]`: optionnel, chaque fichier max 10MB, types acceptés: PDF, Images

**Response Success (201):**
```json
{
  "success": true,
  "message": "Dépense créée avec succès",
  "data": {
    "charge": {
      "id": 1,
      "organization_id": 1,
      "label": "Paiement Formateur",
      "amount": "750.00",
      "category": "Moyens Humains",
      "role": "Formateur",
      "contract_type": "Freelance",
      "course_id": 5,
      "date": "2025-05-01",
      "created_at": "2025-05-01T10:00:00Z",
      "updated_at": "2025-05-01T10:00:00Z",
      "documents": [
        {
          "id": 1,
          "charge_id": 1,
          "file_path": "charges/1/facture.pdf",
          "original_name": "facture.pdf",
          "file_size": 245678,
          "mime_type": "application/pdf",
          "created_at": "2025-05-01T10:00:00Z"
        }
      ],
      "course": {
        "id": 5,
        "title": "Excel Pro – Session 1"
      }
    }
  }
}
```

**Response Error (422):**
```json
{
  "success": false,
  "message": "Erreur de validation",
  "errors": {
    "category": ["La catégorie est requise"],
    "role": ["Le champ 'Poste / Rôle' est requis pour la catégorie 'Moyens Humains'"],
    "contract_type": ["Le champ 'Type De Contrat' est requis pour la catégorie 'Moyens Humains'"]
  }
}
```

### 2.2 Mettre à jour une Dépense

**Endpoint:** `PUT /api/organization/commercial/charges/{id}`

**Request Body (FormData ou JSON):**
```json
{
  "label": "string (optionnel)",
  "amount": "decimal (optionnel)",
  "category": "string (optionnel)",
  "role": "string (optionnel)",
  "contract_type": "string (optionnel)",
  "course_id": "integer (optionnel, null pour supprimer la liaison)",
  "documents[]": "file[] (optionnel, pour ajouter de nouveaux documents)"
}
```

**Note:** Pour supprimer des documents existants, créer un endpoint séparé :
`DELETE /api/organization/commercial/charges/{id}/documents/{document_id}`

### 2.3 Récupérer les Formations (pour le dropdown)

**Endpoint:** `GET /api/organization/courses`

**Query Parameters:**
- `search` (optionnel): Recherche par titre
- `page` (optionnel): Numéro de page
- `per_page` (optionnel): Nombre d'éléments par page

**Response:**
```json
{
  "success": true,
  "data": {
    "courses": [
      {
        "id": 1,
        "uuid": "uuid-string",
        "title": "Excel Pro – Session 1",
        "status": "published"
      },
      {
        "id": 2,
        "uuid": "uuid-string",
        "title": "Photoshop Basics",
        "status": "published"
      }
    ],
    "pagination": {
      "total": 10,
      "per_page": 15,
      "current_page": 1,
      "last_page": 1
    }
  }
}
```

## 3. Logique Métier

### 3.1 Validation Conditionnelle

```php
// Exemple en PHP/Laravel
public function validateChargeRequest(Request $request)
{
    $rules = [
        'label' => 'required|string|max:255',
        'amount' => 'required|numeric|min:0.01',
        'category' => 'required|in:Moyens Humains,Moyens Environnementaux',
        'course_id' => 'nullable|exists:courses,id',
        'documents.*' => 'nullable|file|max:10240|mimes:pdf,jpg,jpeg,png',
    ];

    // Validation conditionnelle pour Moyens Humains
    if ($request->category === 'Moyens Humains') {
        $rules['role'] = 'required|string|max:255';
        $rules['contract_type'] = 'required|string|max:255';
    }

    return Validator::make($request->all(), $rules);
}
```

### 3.2 Gestion des Fichiers

```php
// Exemple de traitement des fichiers
public function storeCharge(Request $request)
{
    $charge = Charge::create([
        'organization_id' => auth()->user()->organization_id,
        'label' => $request->label,
        'amount' => $request->amount,
        'category' => $request->category,
        'role' => $request->role,
        'contract_type' => $request->contract_type,
        'course_id' => $request->course_id,
        'date' => $request->date ?? now(),
    ]);

    // Traitement des fichiers multiples
    if ($request->hasFile('documents')) {
        foreach ($request->file('documents') as $file) {
            $path = $file->store("charges/{$charge->id}", 'public');
            
            ChargeDocument::create([
                'charge_id' => $charge->id,
                'file_path' => $path,
                'original_name' => $file->getClientOriginalName(),
                'file_size' => $file->getSize(),
                'mime_type' => $file->getMimeType(),
            ]);
        }
    }

    return response()->json([
        'success' => true,
        'message' => 'Dépense créée avec succès',
        'data' => [
            'charge' => $charge->load('documents', 'course')
        ]
    ], 201);
}
```

## 4. Options de Rôles et Contrats

### 4.1 Rôles Disponibles

Les options suivantes doivent être disponibles dans le dropdown :
- Formateur
- Responsable Pédagogique
- Assistant Administratif
- Commercial
- Technicien Support
- Nouveau Rôle (option pour créer un nouveau rôle à la volée)

**Recommandation:** Créer une table `roles` pour gérer les rôles de manière dynamique :

```sql
CREATE TABLE IF NOT EXISTS roles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  organization_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  UNIQUE KEY unique_role_per_org (organization_id, name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 4.2 Types de Contrat Disponibles

Les options suivantes doivent être disponibles :
- Contrat CDI
- Contrat CDD
- Freelance
- Stagiaire
- Alternant
- Intérimaire
- Nouveau Contrat (option pour créer un nouveau type à la volée)

**Recommandation:** Créer une table `contract_types` :

```sql
CREATE TABLE IF NOT EXISTS contract_types (
  id INT PRIMARY KEY AUTO_INCREMENT,
  organization_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  UNIQUE KEY unique_contract_type_per_org (organization_id, name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## 5. Endpoints Supplémentaires (Optionnels mais Recommandés)

### 5.1 Récupérer les Rôles

**Endpoint:** `GET /api/organization/commercial/roles`

**Response:**
```json
{
  "success": true,
  "data": {
    "roles": [
      "Formateur",
      "Responsable Pédagogique",
      "Assistant Administratif",
      "Commercial",
      "Technicien Support"
    ]
  }
}
```

### 5.2 Créer un Nouveau Rôle

**Endpoint:** `POST /api/organization/commercial/roles`

**Request:**
```json
{
  "name": "Nouveau Rôle"
}
```

### 5.3 Récupérer les Types de Contrat

**Endpoint:** `GET /api/organization/commercial/contract-types`

**Response:**
```json
{
  "success": true,
  "data": {
    "contract_types": [
      "Contrat CDI",
      "Contrat CDD",
      "Freelance",
      "Stagiaire",
      "Alternant",
      "Intérimaire"
    ]
  }
}
```

### 5.4 Créer un Nouveau Type de Contrat

**Endpoint:** `POST /api/organization/commercial/contract-types`

**Request:**
```json
{
  "name": "Nouveau Contrat"
}
```

## 6. Stockage des Fichiers

### 6.1 Structure de Dossiers

```
storage/
  app/
    public/
      charges/
        {charge_id}/
          {timestamp}_{original_filename}.pdf
          {timestamp}_{original_filename}.jpg
```

### 6.2 Configuration

- Taille maximale par fichier : 10MB
- Types acceptés : PDF, JPG, JPEG, PNG
- Compression automatique recommandée pour les images

## 7. Migration de Données (si nécessaire)

Si des données existent avec l'ancienne structure :

```sql
-- Migration pour ajouter les nouveaux champs
ALTER TABLE charges 
  ADD COLUMN role VARCHAR(255) NULL,
  ADD COLUMN contract_type VARCHAR(255) NULL,
  ADD COLUMN course_id INT NULL;

-- Migration pour mettre à jour les catégories existantes
UPDATE charges 
SET category = 'Moyens Humains' 
WHERE category IN ('salary', 'human_resources');

UPDATE charges 
SET category = 'Moyens Environnementaux' 
WHERE category IN ('office', 'travel', 'marketing', 'utilities', 'other');
```

## 8. Tests Recommandés

1. **Test de création avec catégorie "Moyens Humains"**
   - Vérifier que `role` et `contract_type` sont requis
   - Vérifier la validation

2. **Test de création avec catégorie "Moyens Environnementaux"**
   - Vérifier que `role` et `contract_type` ne sont pas requis

3. **Test de multi-upload**
   - Upload de plusieurs fichiers
   - Vérifier la taille maximale
   - Vérifier les types de fichiers acceptés

4. **Test de liaison avec formation**
   - Créer une dépense liée à une formation
   - Vérifier que la formation existe
   - Vérifier la suppression de la liaison

5. **Test de validation des montants**
   - Montant négatif doit être rejeté
   - Montant zéro doit être rejeté
   - Montant décimal doit être accepté

## 9. Notes Importantes

- Les champs `role` et `contract_type` sont **requis uniquement** pour la catégorie "Moyens Humains"
- Pour les autres catégories, ces champs doivent être `NULL`
- Le champ `course_id` est optionnel pour toutes les catégories
- Les fichiers doivent être stockés de manière sécurisée avec validation des types MIME
- Implémenter une politique de rétention pour les fichiers (ex: suppression après X années)

## 10. Sécurité

- Validation stricte des types de fichiers (ne pas se fier uniquement à l'extension)
- Scan antivirus recommandé pour les fichiers uploadés
- Limitation du taux de requêtes pour éviter les abus
- Vérification des permissions : seul l'utilisateur de l'organisation peut créer/modifier les dépenses de son organisation

