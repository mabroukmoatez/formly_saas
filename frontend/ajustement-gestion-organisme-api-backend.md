# Ajustements API Backend - Gestion de l'Organisme

## Vue d'ensemble

Ce document décrit les ajustements nécessaires pour l'API backend concernant la gestion des documents d'organisation :
1. Upload de documents (CGV, Règlement intérieur, documents personnalisés)
2. Renommage de documents
3. Suppression de documents personnalisés
4. Visualisation et téléchargement de documents
5. Gestion des documents personnalisés

---

## 1. Structure de données actuelle

D'après la réponse de l'API `/api/admin/organization/settings`, les documents sont actuellement stockés avec les champs suivants :

```json
{
  "welcome_booklet_path": "organization/documents/OcYcxydpSr0wSLGckppPWSYczq5cbyINbBp0pXip.pdf",
  "welcome_booklet_url": "localhost:8000/storage/organization/documents/OcYcxydpSr0wSLGckppPWSYczq5cbyINbBp0pXip.pdf",
  "internal_regulations_path": "organization/documents/0N9DEXnIT2iCZ8YowSVDt8vR5OkRqkxMobwsqLzT.pdf",
  "internal_regulations_url": "localhost:8000/storage/organization/documents/0N9DEXnIT2iCZ8YowSVDt8vR5OkRqkxMobwsqLzT.pdf",
  "qualiopi_certificate_path": "organization/certificates/8xMsaEp4wnJ1xxMEK2yJcw6N1aiEvKbH6wbeRZUJ.pdf",
  "qualiopi_certificate_url": "localhost:8000/storage/organization/certificates/8xMsaEp4wnJ1xxMEK2yJcw6N1aiEvKbH6wbeRZUJ.pdf"
}
```

**Note**: Pour les besoins du frontend, nous avons besoin de :
- Un champ `cgv_path` et `cgv_url` pour les CGV (Conditions Générales de Vente)
- Les champs existants pour le Règlement intérieur (`internal_regulations_path` et `internal_regulations_url`)
- Un système pour gérer les documents personnalisés (table séparée ou JSON)

---

## 2. Upload de Documents

### 2.1. Endpoint existant (à améliorer)

**Endpoint**: `PUT /api/admin/organization/settings`

**Méthode**: `PUT` (via `POST` avec `_method=PUT`)

**Authentification**: Requise (token JWT)

**Description**: Met à jour les paramètres de l'organisation, y compris les documents.

**Corps de la requête** (FormData):
```
organization_name: "Edu360" (optionnel)
siret: "78467169500087" (optionnel)
naf_code: "60.0" (optionnel)
rcs: "FR666600000" (optionnel)
nda: "FR666600000" (optionnel)
declaration_region: "FR666600000" (optionnel)
nda_attribution_date: "2025-10-30" (optionnel)
uai_number: "FR666600000" (optionnel)
address: "5 rue de berri" (optionnel)
address_complement: "FR666600000" (optionnel)
postal_code: "7500" (optionnel)
city: "paris" (optionnel)
email: "email@example.com" (optionnel)
phone: "24734659" (optionnel)

// Documents
cgv_file: File (optionnel, pour CGV)
internal_regulations: File (optionnel, pour Règlement intérieur)
welcome_booklet: File (optionnel, pour Livret d'accueil)
qualiopi_certificate: File (optionnel, pour Certificat Qualiopi)

// Documents personnalisés (nouveau)
custom_documents[]: File[] (optionnel, array de fichiers)
```

**Exemple de requête**:
```javascript
const formData = new FormData();
formData.append('_method', 'PUT');
formData.append('cgv_file', fileObject); // File object pour CGV
formData.append('internal_regulations', fileObject); // File object pour Règlement intérieur
formData.append('custom_documents[]', fileObject1);
formData.append('custom_documents[]', fileObject2);
```

**Réponse en cas de succès**:
```json
{
  "success": true,
  "data": {
    "id": 6,
    "organization_name": "Edu360",
    "cgv_path": "organization/documents/cgv_123456.pdf",
    "cgv_url": "http://localhost:8000/storage/organization/documents/cgv_123456.pdf",
    "internal_regulations_path": "organization/documents/reglement_123456.pdf",
    "internal_regulations_url": "http://localhost:8000/storage/organization/documents/reglement_123456.pdf",
    "welcome_booklet_path": "organization/documents/welcome_123456.pdf",
    "welcome_booklet_url": "http://localhost:8000/storage/organization/documents/welcome_123456.pdf",
    "qualiopi_certificate_path": "organization/certificates/qualiopi_123456.pdf",
    "qualiopi_certificate_url": "http://localhost:8000/storage/organization/certificates/qualiopi_123456.pdf",
    "custom_documents": [
      {
        "id": 1,
        "name": "Document personnalisé 1",
        "path": "organization/documents/custom_123456.pdf",
        "url": "http://localhost:8000/storage/organization/documents/custom_123456.pdf",
        "size": 102400,
        "created_at": "2025-01-23T10:00:00.000000Z"
      }
    ]
  }
}
```

**Codes de statut HTTP**:
- `200 OK`: Paramètres mis à jour avec succès
- `400 Bad Request`: Données invalides
- `401 Unauthorized`: Non authentifié
- `403 Forbidden`: Pas les permissions nécessaires
- `422 Unprocessable Entity`: Erreur de validation
- `500 Internal Server Error`: Erreur serveur

**Validation**:
- Formats acceptés : PDF, DOC, DOCX
- Taille maximale : 5MB par fichier
- Vérifier que l'utilisateur a les permissions pour modifier l'organisation

---

## 3. Gestion des Documents Personnalisés

### 3.1. Nouvelle table (recommandée)

Créer une table `organization_custom_documents` :

```sql
CREATE TABLE organization_custom_documents (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    organization_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT UNSIGNED,
    mime_type VARCHAR(100),
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    INDEX idx_organization_id (organization_id)
);
```

### 3.2. Récupérer la liste des documents personnalisés

**Endpoint**: `GET /api/admin/organization/documents`

**Méthode**: `GET`

**Authentification**: Requise (token JWT)

**Description**: Récupère la liste de tous les documents de l'organisation (CGV, Règlement intérieur, et documents personnalisés).

**Réponse en cas de succès**:
```json
{
  "success": true,
  "data": {
    "cgv": {
      "name": "CGV",
      "path": "organization/documents/cgv_123456.pdf",
      "url": "http://localhost:8000/storage/organization/documents/cgv_123456.pdf",
      "size": 102400,
      "updated_at": "2025-01-23T10:00:00.000000Z"
    },
    "internal_regulations": {
      "name": "Règlement intérieur",
      "path": "organization/documents/reglement_123456.pdf",
      "url": "http://localhost:8000/storage/organization/documents/reglement_123456.pdf",
      "size": 204800,
      "updated_at": "2025-01-23T10:00:00.000000Z"
    },
    "custom_documents": [
      {
        "id": 1,
        "name": "Document personnalisé 1",
        "path": "organization/documents/custom_123456.pdf",
        "url": "http://localhost:8000/storage/organization/documents/custom_123456.pdf",
        "size": 102400,
        "mime_type": "application/pdf",
        "created_at": "2025-01-23T10:00:00.000000Z",
        "updated_at": "2025-01-23T10:00:00.000000Z"
      }
    ]
  }
}
```

---

## 4. Renommage de Document

### 4.1. Renommer un document personnalisé

**Endpoint**: `PATCH /api/admin/organization/documents/{document_id}/rename`

**Méthode**: `PATCH`

**Authentification**: Requise (token JWT)

**Description**: Renomme un document personnalisé.

**Paramètres**:
- `document_id` (path, requis): ID du document à renommer

**Corps de la requête** (JSON):
```json
{
  "name": "Nouveau nom du document"
}
```

**Exemple de requête**:
```javascript
PATCH /api/admin/organization/documents/1/rename
Content-Type: application/json

{
  "name": "Document renommé"
}
```

**Réponse en cas de succès**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Document renommé",
    "path": "organization/documents/custom_123456.pdf",
    "url": "http://localhost:8000/storage/organization/documents/custom_123456.pdf",
    "size": 102400,
    "updated_at": "2025-01-23T10:05:00.000000Z"
  }
}
```

**Codes de statut HTTP**:
- `200 OK`: Document renommé avec succès
- `400 Bad Request`: Nom invalide (vide, trop long, caractères spéciaux)
- `404 Not Found`: Document non trouvé
- `403 Forbidden`: L'utilisateur n'a pas le droit de modifier ce document
- `500 Internal Server Error`: Erreur serveur

**Validation**:
- Le nom ne doit pas être vide
- Le nom doit faire moins de 255 caractères
- Le document doit appartenir à l'organisation de l'utilisateur

---

## 5. Suppression de Document

### 5.1. Supprimer un document personnalisé

**Endpoint**: `DELETE /api/admin/organization/documents/{document_id}`

**Méthode**: `DELETE`

**Authentification**: Requise (token JWT)

**Description**: Supprime un document personnalisé (soft delete ou hard delete selon la logique métier).

**Paramètres**:
- `document_id` (path, requis): ID du document à supprimer

**Exemple de requête**:
```javascript
DELETE /api/admin/organization/documents/1
```

**Réponse en cas de succès**:
```json
{
  "success": true,
  "message": "Document supprimé avec succès"
}
```

**Codes de statut HTTP**:
- `200 OK`: Document supprimé avec succès
- `404 Not Found`: Document non trouvé
- `403 Forbidden`: L'utilisateur n'a pas le droit de supprimer ce document
- `500 Internal Server Error`: Erreur serveur

**Logique de suppression**:
- Supprimer le fichier physique du stockage
- Supprimer l'enregistrement de la base de données (ou marquer comme supprimé si soft delete)
- Les documents par défaut (CGV, Règlement intérieur) ne peuvent pas être supprimés, seulement remplacés

---

## 6. Visualisation et Téléchargement de Documents

### 6.1. Visualiser un document

**Endpoint**: `GET /api/admin/organization/documents/{document_id}/view`

**Méthode**: `GET`

**Authentification**: Requise (token JWT)

**Description**: Retourne l'URL complète pour visualiser un document dans le navigateur.

**Paramètres**:
- `document_id` (path, requis): ID du document à visualiser

**Réponse en cas de succès**:
```json
{
  "success": true,
  "data": {
    "url": "http://localhost:8000/storage/organization/documents/custom_123456.pdf",
    "mime_type": "application/pdf"
  }
}
```

**Codes de statut HTTP**:
- `200 OK`: URL retournée avec succès
- `404 Not Found`: Document non trouvé
- `403 Forbidden`: L'utilisateur n'a pas le droit d'accéder à ce document

### 6.2. Télécharger un document

**Endpoint**: `GET /api/admin/organization/documents/{document_id}/download`

**Méthode**: `GET`

**Authentification**: Requise (token JWT)

**Description**: Télécharge un document avec le nom de fichier approprié.

**Paramètres**:
- `document_id` (path, requis): ID du document à télécharger

**Headers de réponse**:
```
Content-Type: application/pdf (ou autre selon le type de fichier)
Content-Disposition: attachment; filename="nom_du_document.pdf"
```

**Réponse en cas de succès**:
- Fichier binaire (blob)

**Codes de statut HTTP**:
- `200 OK`: Fichier téléchargé avec succès
- `404 Not Found`: Document non trouvé
- `403 Forbidden`: L'utilisateur n'a pas le droit de télécharger ce document
- `500 Internal Server Error`: Erreur serveur

---

## 7. Mise à jour de l'endpoint GET /api/admin/organization/settings

### 7.1. Ajout des champs manquants

L'endpoint `GET /api/admin/organization/settings` doit retourner :

```json
{
  "success": true,
  "data": {
    "id": 6,
    "organization_name": "Edu360",
    "siret": "78467169500087",
    "naf_code": "60.0",
    "rcs": "FR666600000",
    "nda": "FR666600000",
    "declaration_region": "FR666600000",
    "nda_attribution_date": "2025-10-30",
    "uai_number": "FR666600000",
    "address": "5 rue de berri",
    "address_complement": "FR666600000",
    "postal_code": "7500",
    "city": "paris",
    "email": "email@example.com",
    "phone": "24734659",
    
    // Documents existants
    "welcome_booklet_path": "organization/documents/...",
    "welcome_booklet_url": "http://localhost:8000/storage/...",
    "internal_regulations_path": "organization/documents/...",
    "internal_regulations_url": "http://localhost:8000/storage/...",
    "qualiopi_certificate_path": "organization/certificates/...",
    "qualiopi_certificate_url": "http://localhost:8000/storage/...",
    
    // Nouveaux champs pour CGV
    "cgv_path": "organization/documents/cgv_123456.pdf",
    "cgv_url": "http://localhost:8000/storage/organization/documents/cgv_123456.pdf",
    
    // Documents personnalisés
    "custom_documents": [
      {
        "id": 1,
        "name": "Document personnalisé 1",
        "path": "organization/documents/custom_123456.pdf",
        "url": "http://localhost:8000/storage/organization/documents/custom_123456.pdf",
        "size": 102400,
        "mime_type": "application/pdf",
        "created_at": "2025-01-23T10:00:00.000000Z",
        "updated_at": "2025-01-23T10:00:00.000000Z"
      }
    ]
  }
}
```

---

## 8. Résumé des endpoints nécessaires

### Endpoints existants (à améliorer)
1. ✅ `PUT /api/admin/organization/settings` - Upload de documents (ajouter support `cgv_file` et `custom_documents[]`)
2. ✅ `GET /api/admin/organization/settings` - Récupérer les paramètres (ajouter `cgv_path`, `cgv_url`, et `custom_documents`)

### Nouveaux endpoints nécessaires
1. ❌ `GET /api/admin/organization/documents` - Liste tous les documents
2. ❌ `PATCH /api/admin/organization/documents/{document_id}/rename` - Renommer un document
3. ❌ `DELETE /api/admin/organization/documents/{document_id}` - Supprimer un document
4. ❌ `GET /api/admin/organization/documents/{document_id}/view` - URL de visualisation
5. ❌ `GET /api/admin/organization/documents/{document_id}/download` - Télécharger un document

---

## 9. Modifications de la base de données

### 9.1. Ajouter le champ CGV à la table organizations

```sql
ALTER TABLE organizations 
ADD COLUMN cgv_path VARCHAR(500) NULL AFTER internal_regulations_path,
ADD COLUMN cgv_url VARCHAR(500) NULL AFTER internal_regulations_url;
```

### 9.2. Créer la table pour les documents personnalisés

```sql
CREATE TABLE organization_custom_documents (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    organization_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT UNSIGNED,
    mime_type VARCHAR(100),
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    INDEX idx_organization_id (organization_id),
    INDEX idx_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 10. Notes importantes

1. **Sécurité**:
   - Vérifier que l'utilisateur a les permissions pour modifier l'organisation
   - Valider les types de fichiers (PDF, DOC, DOCX uniquement)
   - Limiter la taille des fichiers (5MB max)
   - Sanitizer les noms de fichiers

2. **Stockage**:
   - Stocker les fichiers dans `storage/organization/documents/`
   - Générer des noms de fichiers uniques pour éviter les collisions
   - Supprimer les anciens fichiers lors du remplacement

3. **URLs**:
   - Les URLs doivent être complètes (avec `http://` ou `https://`)
   - Utiliser `Storage::url()` de Laravel pour générer les URLs
   - Gérer les cas où le fichier n'existe pas

4. **Performance**:
   - Utiliser des index sur `organization_id` et `deleted_at`
   - Implémenter la pagination pour les documents personnalisés si nécessaire
   - Mettre en cache les URLs des documents si possible

---

## 11. Exemple d'implémentation Laravel

### 11.1. Modèle OrganizationCustomDocument

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class OrganizationCustomDocument extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'organization_id',
        'name',
        'file_path',
        'file_size',
        'mime_type',
    ];

    protected $dates = ['deleted_at'];

    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }

    public function getUrlAttribute()
    {
        return Storage::url($this->file_path);
    }
}
```

### 11.2. Controller OrganizationDocumentController

```php
<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Organization;
use App\Models\OrganizationCustomDocument;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class OrganizationDocumentController extends Controller
{
    public function index()
    {
        $organization = auth()->user()->organization;
        
        return response()->json([
            'success' => true,
            'data' => [
                'cgv' => $this->getDocumentData($organization, 'cgv'),
                'internal_regulations' => $this->getDocumentData($organization, 'internal_regulations'),
                'custom_documents' => $organization->customDocuments()->get()->map(function ($doc) {
                    return [
                        'id' => $doc->id,
                        'name' => $doc->name,
                        'path' => $doc->file_path,
                        'url' => $doc->url,
                        'size' => $doc->file_size,
                        'mime_type' => $doc->mime_type,
                        'created_at' => $doc->created_at,
                        'updated_at' => $doc->updated_at,
                    ];
                }),
            ],
        ]);
    }

    public function rename(Request $request, $documentId)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $document = OrganizationCustomDocument::findOrFail($documentId);
        
        // Vérifier les permissions
        if ($document->organization_id !== auth()->user()->organization_id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 403);
        }

        $document->name = $request->name;
        $document->save();

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $document->id,
                'name' => $document->name,
                'path' => $document->file_path,
                'url' => $document->url,
                'size' => $document->file_size,
                'updated_at' => $document->updated_at,
            ],
        ]);
    }

    public function destroy($documentId)
    {
        $document = OrganizationCustomDocument::findOrFail($documentId);
        
        // Vérifier les permissions
        if ($document->organization_id !== auth()->user()->organization_id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 403);
        }

        // Supprimer le fichier physique
        if (Storage::exists($document->file_path)) {
            Storage::delete($document->file_path);
        }

        // Supprimer l'enregistrement
        $document->delete();

        return response()->json([
            'success' => true,
            'message' => 'Document supprimé avec succès',
        ]);
    }

    public function view($documentId)
    {
        $document = OrganizationCustomDocument::findOrFail($documentId);
        
        // Vérifier les permissions
        if ($document->organization_id !== auth()->user()->organization_id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 403);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'url' => $document->url,
                'mime_type' => $document->mime_type,
            ],
        ]);
    }

    public function download($documentId)
    {
        $document = OrganizationCustomDocument::findOrFail($documentId);
        
        // Vérifier les permissions
        if ($document->organization_id !== auth()->user()->organization_id) {
            abort(403);
        }

        if (!Storage::exists($document->file_path)) {
            abort(404);
        }

        return Storage::download($document->file_path, $document->name);
    }

    private function getDocumentData($organization, $type)
    {
        $pathField = $type . '_path';
        $urlField = $type . '_url';

        if (!$organization->$pathField) {
            return null;
        }

        return [
            'name' => $this->getDocumentName($type),
            'path' => $organization->$pathField,
            'url' => $organization->$urlField,
            'size' => Storage::exists($organization->$pathField) 
                ? Storage::size($organization->$pathField) 
                : null,
            'updated_at' => $organization->updated_at,
        ];
    }

    private function getDocumentName($type)
    {
        $names = [
            'cgv' => 'CGV',
            'internal_regulations' => 'Règlement intérieur',
        ];

        return $names[$type] ?? $type;
    }
}
```

---

## 12. Routes Laravel

```php
// routes/api.php

Route::middleware(['auth:sanctum'])->prefix('admin/organization')->group(function () {
    // Documents
    Route::get('/documents', [OrganizationDocumentController::class, 'index']);
    Route::patch('/documents/{document_id}/rename', [OrganizationDocumentController::class, 'rename']);
    Route::delete('/documents/{document_id}', [OrganizationDocumentController::class, 'destroy']);
    Route::get('/documents/{document_id}/view', [OrganizationDocumentController::class, 'view']);
    Route::get('/documents/{document_id}/download', [OrganizationDocumentController::class, 'download']);
});
```

---

## Conclusion

Cette documentation décrit tous les ajustements nécessaires pour le backend afin de supporter les fonctionnalités de gestion des documents d'organisation dans le frontend. Les principales modifications incluent :

1. Ajout du support pour les CGV dans l'endpoint de mise à jour
2. Création d'une table pour les documents personnalisés
3. Implémentation des endpoints pour renommer, supprimer, visualiser et télécharger les documents
4. Mise à jour de l'endpoint de récupération des paramètres pour inclure tous les documents



