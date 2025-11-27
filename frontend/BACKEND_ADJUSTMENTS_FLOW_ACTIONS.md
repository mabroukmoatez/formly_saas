# Ajustements Backend pour Flow Actions

## Endpoint
```
POST /api/organization/courses/{courseUuid}/flow-actions
```

## Données envoyées depuis le Frontend

### Format
- **Content-Type**: `multipart/form-data` (FormData)
- Tous les champs sont envoyés via FormData

### Champs Requis

| Champ | Type | Description | Validation |
|-------|------|-------------|------------|
| `title` | string | Titre de l'action | Requis, non vide, max 255 caractères |
| `type` | string | Type d'action | Enum: `'email'`, `'document'`, `'notification'`, `'assignment'`, `'reminder'`, `'certificate'`, `'payment'`, `'enrollment'`, `'completion'`, `'feedback'`, `'meeting'`, `'resource'` |
| `recipient` | string | Destinataire | Enum: `'formateur'`, `'apprenant'`, `'entreprise'`, `'admin'` |
| `dest_type` | string | Type de destination | Enum: `'email'`, `'notification'`, `'webhook'` |
| `ref_date` | string | Date de référence | Enum: `'enrollment'`, `'completion'`, `'start'`, `'custom'` |
| `time_type` | string | Type de timing | Enum: `'before'`, `'after'`, `'on'` |
| `n_days` | string (converti en int) | Nombre de jours | Requis, integer >= 0. Si `time_type === 'on'`, doit être 0 |

### Champs Optionnels

| Champ | Type | Description | Validation |
|-------|------|-------------|------------|
| `custom_time` | string | Heure personnalisée | Format: `"HH:MM:00"` ou `"HH:MM"`. Envoyé uniquement si une heure spécifique est sélectionnée |
| `email_id` | string (converti en int) | ID du template d'email | Requis si `type === 'email'` ou `type === 'document'`. Doit exister dans la table email_templates |
| `dest` | string | Destination personnalisée | Utilisé pour les documents (contient le titre du document) |
| `files[]` | File[] | Fichiers joints (upload) | Array de fichiers uploadés. Format: `files[]` pour chaque fichier |
| `document_ids[]` | string[] (converti en int[]) | IDs des documents depuis la bibliothèque | Array d'IDs de documents existants. Format: `document_ids[]` pour chaque ID. **Important**: Utiliser les IDs des documents de l'organisation, pas télécharger les fichiers |
| `questionnaire_ids[]` | string[] (converti en int[]) | IDs des questionnaires | Array d'IDs. Format: `questionnaire_ids[]` pour chaque ID |

## Règles de Validation Backend

### 1. Validation de base
```php
// Exemple Laravel
$request->validate([
    'title' => 'required|string|max:255',
    'type' => 'required|string|in:email,document,notification,assignment,reminder,certificate,payment,enrollment,completion,feedback,meeting,resource',
    'recipient' => 'required|string|in:formateur,apprenant,entreprise,admin',
    'dest_type' => 'required|string|in:email,notification,webhook',
    'ref_date' => 'required|string|in:enrollment,completion,start,custom',
    'time_type' => 'required|string|in:before,after,on',
    'n_days' => 'required|integer|min:0',
    'custom_time' => 'nullable|string|regex:/^([0-1][0-9]|2[0-3]):[0-5][0-9](:00)?$/',
    'email_id' => 'nullable|integer|exists:email_templates,id',
    'dest' => 'nullable|string|max:255',
    'files' => 'nullable|array',
    'files.*' => 'file|max:10240', // 10MB max par fichier
    'document_ids' => 'nullable|array',
    'document_ids.*' => 'integer|exists:documents,id', // IDs des documents depuis la bibliothèque
    'questionnaire_ids' => 'nullable|array',
    'questionnaire_ids.*' => 'integer|exists:questionnaires,id',
]);
```

### 2. Validation conditionnelle

#### Si `type === 'email'` ou `type === 'document'`
- `email_id` est **requis**
- Vérifier que l'email_template existe et appartient à l'organisation

#### Si `time_type === 'on'`
- `n_days` doit être **0**
- `custom_time` peut être présent ou non

#### Si `time_type === 'before'` ou `'after'`
- `n_days` doit être **> 0**
- `custom_time` peut être présent ou non

#### Si `dest_type === 'webhook'`
- `dest` est **requis** (contient l'URL du webhook)
- `email_id` n'est pas requis

### 3. Format de `custom_time`
- Le frontend envoie `"HH:MM:00"` ou `"HH:MM"`
- Le backend doit accepter les deux formats
- Normaliser en `"HH:MM:00"` pour stockage en base de données

### 4. Gestion des fichiers
- Les fichiers sont envoyés via `files[]` (array)
- Chaque fichier doit être traité et stocké
- Retourner les IDs des fichiers créés dans la réponse

### 5. Gestion des questionnaires
- Les IDs sont envoyés via `questionnaire_ids[]` (array)
- Vérifier que chaque questionnaire existe et appartient au cours/organisation
- Créer les relations flow_action_questionnaires

## Structure de la Table Backend

### Table: `flow_actions`

```sql
CREATE TABLE flow_actions (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    course_id BIGINT UNSIGNED NOT NULL,
    title VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    recipient VARCHAR(50) NOT NULL,
    dest_type VARCHAR(50) NOT NULL,
    ref_date VARCHAR(50) NOT NULL,
    time_type VARCHAR(50) NOT NULL,
    n_days INT NOT NULL DEFAULT 0,
    custom_time TIME NULL,
    email_id BIGINT UNSIGNED NULL,
    dest VARCHAR(255) NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (email_id) REFERENCES email_templates(id) ON DELETE SET NULL,
    
    INDEX idx_course_id (course_id),
    INDEX idx_type (type),
    INDEX idx_recipient (recipient),
    INDEX idx_ref_date (ref_date)
);
```

### Table: `flow_action_files`

```sql
CREATE TABLE flow_action_files (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    flow_action_id BIGINT UNSIGNED NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT UNSIGNED,
    mime_type VARCHAR(100),
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    
    FOREIGN KEY (flow_action_id) REFERENCES flow_actions(id) ON DELETE CASCADE,
    INDEX idx_flow_action_id (flow_action_id)
);
```

### Table: `flow_action_questionnaires`

```sql
CREATE TABLE flow_action_questionnaires (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    flow_action_id BIGINT UNSIGNED NOT NULL,
    questionnaire_id BIGINT UNSIGNED NOT NULL,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    
    FOREIGN KEY (flow_action_id) REFERENCES flow_actions(id) ON DELETE CASCADE,
    FOREIGN KEY (questionnaire_id) REFERENCES questionnaires(id) ON DELETE CASCADE,
    UNIQUE KEY unique_flow_questionnaire (flow_action_id, questionnaire_id),
    INDEX idx_flow_action_id (flow_action_id),
    INDEX idx_questionnaire_id (questionnaire_id)
);
```

## Logique de Traitement Backend

### 1. Création de l'action

```php
// Exemple Laravel
public function store(Request $request, $courseUuid)
{
    // Validation
    $validated = $request->validate([...]);
    
    // Normaliser custom_time
    if ($request->has('custom_time')) {
        $customTime = $request->custom_time;
        if (strlen($customTime) === 5) { // Format "HH:MM"
            $customTime .= ':00';
        }
        $validated['custom_time'] = $customTime;
    }
    
    // Vérifier n_days selon time_type
    if ($validated['time_type'] === 'on') {
        $validated['n_days'] = 0;
    } elseif ($validated['n_days'] <= 0) {
        return response()->json([
            'success' => false,
            'message' => 'n_days doit être > 0 si time_type est "before" ou "after"'
        ], 422);
    }
    
    // Vérifier email_id si requis
    if (in_array($validated['type'], ['email', 'document']) && !$request->has('email_id')) {
        return response()->json([
            'success' => false,
            'message' => 'email_id est requis pour les types email et document'
        ], 422);
    }
    
    // Récupérer le cours
    $course = Course::where('uuid', $courseUuid)->firstOrFail();
    
    // Créer l'action
    $flowAction = FlowAction::create([
        'course_id' => $course->id,
        'title' => $validated['title'],
        'type' => $validated['type'],
        'recipient' => $validated['recipient'],
        'dest_type' => $validated['dest_type'],
        'ref_date' => $validated['ref_date'],
        'time_type' => $validated['time_type'],
        'n_days' => $validated['n_days'],
        'custom_time' => $validated['custom_time'] ?? null,
        'email_id' => $validated['email_id'] ?? null,
        'dest' => $validated['dest'] ?? null,
    ]);
    
    // Traiter les fichiers uploadés
    if ($request->hasFile('files')) {
        foreach ($request->file('files') as $file) {
            $path = $file->store('flow-actions/' . $flowAction->id, 'public');
            FlowActionFile::create([
                'flow_action_id' => $flowAction->id,
                'file_name' => $file->getClientOriginalName(),
                'file_path' => $path,
                'file_size' => $file->getSize(),
                'mime_type' => $file->getMimeType(),
            ]);
        }
    }
    
    // Traiter les documents depuis la bibliothèque (par UUID/ID)
    if ($request->has('document_ids')) {
        foreach ($request->document_ids as $documentId) {
            // Vérifier que le document existe et appartient à l'organisation
            $document = Document::where('id', $documentId)
                ->where('organization_id', $organization->id)
                ->first();
            
            if ($document) {
                // Créer une relation flow_action_documents (ou utiliser flow_action_files avec document_id)
                FlowActionFile::create([
                    'flow_action_id' => $flowAction->id,
                    'document_id' => $documentId, // Référence au document existant
                    'file_name' => $document->name,
                    'file_path' => $document->file_path, // Utiliser le chemin du document existant
                    'file_size' => $document->file_size,
                    'mime_type' => $document->mime_type,
                ]);
            }
        }
    }
    
    // Traiter les questionnaires
    if ($request->has('questionnaire_ids')) {
        foreach ($request->questionnaire_ids as $questionnaireId) {
            // Vérifier que le questionnaire appartient au cours
            $questionnaire = Questionnaire::where('id', $questionnaireId)
                ->where('course_id', $course->id)
                ->first();
            
            if ($questionnaire) {
                FlowActionQuestionnaire::create([
                    'flow_action_id' => $flowAction->id,
                    'questionnaire_id' => $questionnaireId,
                ]);
            }
        }
    }
    
    // Retourner la réponse avec les relations
    $flowAction->load(['email', 'files', 'questionnaires']);
    
    return response()->json([
        'success' => true,
        'data' => $flowAction,
        'message' => 'Action automatique créée avec succès'
    ], 201);
}
```

## Réponse Backend Attendue

### Succès (201 Created)
```json
{
    "success": true,
    "data": {
        "id": 1,
        "course_id": 123,
        "title": "Envoi des questionnaires",
        "type": "email",
        "recipient": "apprenant",
        "dest_type": "email",
        "ref_date": "start",
        "time_type": "on",
        "n_days": 0,
        "custom_time": "10:00:00",
        "email_id": 5,
        "dest": null,
        "is_active": true,
        "created_at": "2024-01-15T10:30:00Z",
        "updated_at": "2024-01-15T10:30:00Z",
        "email": {
            "id": 5,
            "name": "Template de bienvenue",
            "subject": "Bienvenue dans la formation"
        },
        "files": [
            {
                "id": 1,
                "file_name": "document.pdf",
                "file_path": "flow-actions/1/document.pdf",
                "file_size": 1024000,
                "mime_type": "application/pdf"
            }
        ],
        "questionnaires": [
            {
                "id": 3,
                "name": "Questionnaire d'évaluation"
            }
        ]
    },
    "message": "Action automatique créée avec succès"
}
```

### Erreur de Validation (422 Unprocessable Entity)
```json
{
    "success": false,
    "message": "Erreur de validation",
    "errors": {
        "title": ["Le champ titre est requis."],
        "email_id": ["email_id est requis pour les types email et document."],
        "n_days": ["n_days doit être > 0 si time_type est 'before' ou 'after'."]
    }
}
```

## Points d'Attention

1. **Format FormData** : Le backend doit gérer `files[]` et `questionnaire_ids[]` comme des arrays
2. **Normalisation de custom_time** : Accepter "HH:MM" et "HH:MM:00", normaliser en "HH:MM:00"
3. **Validation conditionnelle** : `email_id` requis pour email/document, `n_days` = 0 si `time_type === 'on'`
4. **Stockage des fichiers** : Stocker les fichiers et retourner les métadonnées dans la réponse
5. **Relations** : Créer les relations avec questionnaires et fichiers
6. **Permissions** : Vérifier que l'utilisateur a le droit de créer des actions pour ce cours

## Endpoints Supplémentaires

### GET /api/organization/courses/{courseUuid}/flow-actions
Retourner toutes les actions avec leurs relations :
```json
{
    "success": true,
    "data": [
        {
            "id": 1,
            "title": "...",
            "email": {...},
            "files": [...],
            "questionnaires": [...]
        }
    ]
}
```

### PUT /api/organization/courses/{courseUuid}/flow-actions/{actionId}
Même structure que POST pour la mise à jour

### DELETE /api/organization/courses/{courseUuid}/flow-actions/{actionId}
Supprimer l'action et ses relations (cascade)

