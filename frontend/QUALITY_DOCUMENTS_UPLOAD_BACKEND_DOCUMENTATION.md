# Documentation Backend - Upload Documents Qualité

## Problème Actuel

L'endpoint `/api/quality/documents/upload` exige toujours un champ `file`, même lorsque l'utilisateur sélectionne un document existant depuis la bibliothèque de l'organisation. Cela cause une erreur de validation :

```json
{
    "success": false,
    "error": {
        "code": "INVALID_INPUT",
        "message": "Validation failed",
        "details": {
            "file": [
                "This field is required."
            ]
        }
    }
}
```

## Solution Requise

L'endpoint doit accepter **deux modes d'ajout** :

1. **Mode Upload** : Upload d'un nouveau fichier depuis l'ordinateur
2. **Mode Bibliothèque** : Référence à un document existant dans la bibliothèque de l'organisation

## Spécifications de l'API

### Endpoint
```
POST /api/quality/documents/upload
```

### Headers
```
Content-Type: multipart/form-data
Authorization: Bearer {token}
```

### Paramètres FormData

#### Paramètres Requis (tous les cas)
- `name` (string, requis) : Nom/titre du document qualité
- `type` (string, requis) : Type de document (`procedure`, `model`, ou `evidence`)
- `indicatorIds` (string JSON, requis) : Tableau JSON des IDs des indicateurs Qualiopi associés
  - Exemple : `"[1, 2, 3]"`

#### Paramètres Optionnels
- `description` (string, optionnel) : Description du document
- `courseId` (string, requis si `type === 'model'`) : UUID de la formation concernée (pour les modèles)

#### Paramètres pour les Preuves (Evidence)
- `courseId` (string, optionnel) : UUID de la formation
- `sessionId` (string, optionnel) : UUID de la session
- `learnerId` (string, optionnel) : UUID de l'apprenant

#### Mode Upload (Option 1)
- `file` (File, requis si pas de `documentUuid`) : Fichier à uploader
  - Types acceptés : `.pdf`, `.doc`, `.docx`, `.xls`, `.xlsx`, `.png`, `.jpg`, `.jpeg`

#### Mode Bibliothèque (Option 2)
- `documentUuid` (string, requis si pas de `file`) : UUID du document existant dans la bibliothèque de l'organisation
  - Le document doit exister dans la bibliothèque de l'organisation
  - Le document ne doit pas être un questionnaire (seulement les documents)

### Règles de Validation

1. **Uniquement un des deux** : Soit `file` soit `documentUuid` doit être fourni, mais pas les deux
2. **Vérification du document** : Si `documentUuid` est fourni, vérifier que :
   - Le document existe
   - Le document appartient à l'organisation de l'utilisateur
   - Le document n'est pas un questionnaire (`is_questionnaire === false` et `questionnaire_type === null`)
3. **Type Model** : Si `type === 'model'`, `courseId` est requis
4. **Indicateurs** : Au moins un indicateur doit être fourni dans `indicatorIds`

### Exemple de Requête - Mode Upload

```javascript
const formData = new FormData();
formData.append('file', fileObject);
formData.append('name', 'Procédure d\'accueil');
formData.append('type', 'procedure');
formData.append('description', 'Procédure pour accueillir les nouveaux apprenants');
formData.append('indicatorIds', JSON.stringify([1, 5, 8]));

fetch('/api/quality/documents/upload', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer {token}'
  },
  body: formData
});
```

### Exemple de Requête - Mode Bibliothèque

```javascript
const formData = new FormData();
formData.append('documentUuid', '123e4567-e89b-12d3-a456-426614174000');
formData.append('name', 'Modèle de contrat');
formData.append('type', 'model');
formData.append('description', 'Modèle de contrat de formation');
formData.append('courseId', 'course-uuid-123');
formData.append('indicatorIds', JSON.stringify([2, 3]));

fetch('/api/quality/documents/upload', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer {token}'
  },
  body: formData
});
```

### Réponse Succès

```json
{
    "success": true,
    "message": "Document qualité ajouté avec succès",
    "data": {
        "id": 123,
        "uuid": "123e4567-e89b-12d3-a456-426614174000",
        "name": "Procédure d'accueil",
        "type": "procedure",
        "description": "Procédure pour accueillir les nouveaux apprenants",
        "file_url": "https://example.com/uploads/quality/procedure-123.pdf",
        "file_type": "pdf",
        "size": 1024000,
        "indicator_ids": [1, 5, 8],
        "created_at": "2025-01-16T10:30:00Z",
        "updated_at": "2025-01-16T10:30:00Z",
        "created_by": {
            "id": 1,
            "name": "John Doe",
            "email": "john@example.com"
        }
    }
}
```

### Réponses d'Erreur

#### Erreur : Aucun fichier ni documentUuid fourni
```json
{
    "success": false,
    "error": {
        "code": "INVALID_INPUT",
        "message": "Validation failed",
        "details": {
            "file_or_document": [
                "Either 'file' or 'documentUuid' must be provided"
            ]
        }
    }
}
```

#### Erreur : Les deux sont fournis
```json
{
    "success": false,
    "error": {
        "code": "INVALID_INPUT",
        "message": "Validation failed",
        "details": {
            "file_or_document": [
                "Only one of 'file' or 'documentUuid' should be provided, not both"
            ]
        }
    }
}
```

#### Erreur : DocumentUuid introuvable ou invalide
```json
{
    "success": false,
    "error": {
        "code": "DOCUMENT_NOT_FOUND",
        "message": "Le document spécifié n'existe pas ou n'appartient pas à votre organisation",
        "details": {
            "documentUuid": [
                "Document not found or access denied"
            ]
        }
    }
}
```

#### Erreur : DocumentUuid est un questionnaire
```json
{
    "success": false,
    "error": {
        "code": "INVALID_DOCUMENT_TYPE",
        "message": "Les questionnaires ne peuvent pas être utilisés comme documents qualité",
        "details": {
            "documentUuid": [
                "Questionnaires cannot be used as quality documents"
            ]
        }
    }
}
```

## Implémentation Backend (Laravel/PHP)

### Exemple de Validation

```php
public function upload(Request $request)
{
    $validator = Validator::make($request->all(), [
        'name' => 'required|string|max:255',
        'type' => 'required|in:procedure,model,evidence',
        'description' => 'nullable|string',
        'indicatorIds' => 'required|string', // JSON string
        'courseId' => 'required_if:type,model|string|exists:courses,uuid',
        'file' => 'required_without:documentUuid|file|mimes:pdf,doc,docx,xls,xlsx,png,jpg,jpeg|max:10240',
        'documentUuid' => 'required_without:file|string|exists:organization_documents,uuid',
        // Pour les preuves
        'sessionId' => 'nullable|string|exists:sessions,uuid',
        'learnerId' => 'nullable|string|exists:users,uuid',
    ], [
        'file.required_without' => 'Either a file or documentUuid must be provided',
        'documentUuid.required_without' => 'Either a file or documentUuid must be provided',
    ]);

    // Vérification exclusive : un seul des deux
    if ($request->hasFile('file') && $request->has('documentUuid')) {
        return response()->json([
            'success' => false,
            'error' => [
                'code' => 'INVALID_INPUT',
                'message' => 'Only one of file or documentUuid should be provided',
            ]
        ], 400);
    }

    // Si documentUuid est fourni, vérifier qu'il existe et appartient à l'organisation
    if ($request->has('documentUuid')) {
        $document = OrganizationDocument::where('uuid', $request->documentUuid)
            ->where('organization_id', auth()->user()->organization_id)
            ->first();

        if (!$document) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'DOCUMENT_NOT_FOUND',
                    'message' => 'Le document spécifié n\'existe pas ou n\'appartient pas à votre organisation',
                ]
            ], 404);
        }

        // Vérifier que ce n'est pas un questionnaire
        if ($document->is_questionnaire || $document->questionnaire_type) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'INVALID_DOCUMENT_TYPE',
                    'message' => 'Les questionnaires ne peuvent pas être utilisés comme documents qualité',
                ]
            ], 400);
        }

        // Utiliser le fichier du document existant
        $filePath = $document->file_url;
        $fileName = $document->file_name;
        $fileType = $document->file_type;
        $fileSize = $document->file_size;
    } else {
        // Upload du nouveau fichier
        $file = $request->file('file');
        $fileName = $file->getClientOriginalName();
        $fileType = $file->getClientOriginalExtension();
        $fileSize = $file->getSize();
        
        // Sauvegarder le fichier
        $filePath = $file->store('quality/documents', 'public');
    }

    // Parser les indicateurs
    $indicatorIds = json_decode($request->indicatorIds, true);
    if (!is_array($indicatorIds) || empty($indicatorIds)) {
        return response()->json([
            'success' => false,
            'error' => [
                'code' => 'INVALID_INPUT',
                'message' => 'At least one indicator must be provided',
            ]
        ], 400);
    }

    // Créer le document qualité
    $qualityDocument = QualityDocument::create([
        'organization_id' => auth()->user()->organization_id,
        'name' => $request->name,
        'type' => $request->type,
        'description' => $request->description,
        'file_url' => $filePath,
        'file_name' => $fileName,
        'file_type' => $fileType,
        'file_size' => $fileSize,
        'course_id' => $request->courseId ? Course::where('uuid', $request->courseId)->value('id') : null,
        'session_id' => $request->sessionId ? Session::where('uuid', $request->sessionId)->value('id') : null,
        'learner_id' => $request->learnerId ? User::where('uuid', $request->learnerId)->value('id') : null,
        'created_by' => auth()->id(),
    ]);

    // Associer les indicateurs
    $qualityDocument->indicators()->sync($indicatorIds);

    return response()->json([
        'success' => true,
        'message' => 'Document qualité ajouté avec succès',
        'data' => $qualityDocument->load(['indicators', 'createdBy']),
    ], 201);
}
```

## Notes Importantes

1. **Sécurité** : Vérifier que le document de la bibliothèque appartient bien à l'organisation de l'utilisateur
2. **Performance** : Si on utilise un document existant, on peut soit copier le fichier, soit créer une référence (selon les besoins métier)
3. **Cohérence** : S'assurer que les documents qualité créés depuis la bibliothèque apparaissent bien dans les listes après création
4. **Refresh** : Après création réussie, le frontend doit rafraîchir la liste des documents pour afficher le nouveau document

## Endpoint de Récupération des Documents

Pour que les documents apparaissent dans la liste après création, vérifier que l'endpoint de récupération fonctionne correctement :

```
GET /api/quality/documents
```

Paramètres de requête :
- `type` (optionnel) : `procedure`, `model`, ou `evidence`
- `indicatorId` (optionnel) : Filtrer par indicateur
- `search` (optionnel) : Recherche par nom/description
- `page` (optionnel) : Numéro de page
- `limit` (optionnel) : Nombre d'éléments par page

