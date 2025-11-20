# Ajustements Backend - Page de Création de Questionnaires

## Contexte
La page de création de questionnaires permet de générer des **questionnaires personnalisés** avec différents types de questions. Cette nouvelle implémentation utilise un système de **builder personnalisé** où l'utilisateur construit son questionnaire question par question.

## Changements Majeurs par Rapport à l'Ancienne Logique

### Ancienne Logique (À Remplacer)
- Utilisation de templates prédéfinis (`document_type: 'template'`)
- Types de questions limités (text, multiple_choice, rating, yes_no)
- Structure fixe avec peu de flexibilité
- Pas de support pour tableaux, listes déroulantes, sections pédagogiques

### Nouvelle Logique (Actuelle)
- **Builder personnalisé** : L'utilisateur construit le questionnaire question par question
- **Types de questions multiples** : 8 types de questions (réponse simple, réponse multiple, réponse courte, paragraphe, liste déroulante, grille/tableau, question de recommandation, pédagogie)
- **Structure flexible** : Ordre des questions personnalisable par drag & drop
- **Options configurables** : Chaque question peut être marquée comme obligatoire
- **Design conforme** : Respect strict du design avec logo, titre, description

## Structure de Données Backend

### 1. Endpoint de Création de Questionnaire
**POST** `/api/organization/courses/{courseUuid}/questionnaires`

**Note** : Utiliser l'endpoint `/questionnaires` et non `/documents` pour les questionnaires.

### 2. Format de la Requête (JSON)

```json
{
  "title": "Titre du questionnaire",
  "description": "Description du questionnaire (optionnel)",
  "questionnaire_type": "custom",
  "questions": [
    {
      "order": 1,
      "type": "single_choice | multiple_choice | short_text | long_text | dropdown | table | recommendation | pedagogy",
      "question": "Texte de la question",
      "required": true | false,
      "options": ["Option 1", "Option 2"],  // Pour single_choice, multiple_choice, dropdown
      "table_columns": ["Colonne 1", "Colonne 2"],  // Pour table
      "table_rows": [["Cellule 1", "Cellule 2"]],  // Pour table
      "content": "<p>HTML content</p>"  // Pour pedagogy
    }
  ]
}
```

### 3. Structure Détaillée des Questions

#### Type: `single_choice` (Réponse simple - Radio)
```json
{
  "order": 1,
  "type": "single_choice",
  "question": "Quelle est votre satisfaction globale ?",
  "required": true,
  "options": [
    "Très satisfait",
    "Satisfait",
    "Neutre",
    "Insatisfait",
    "Très insatisfait"
  ]
}
```

#### Type: `multiple_choice` (Réponse multiple - Checkbox)
```json
{
  "order": 2,
  "type": "multiple_choice",
  "question": "Quels sujets souhaitez-vous approfondir ?",
  "required": false,
  "options": [
    "Théorie",
    "Pratique",
    "Cas d'usage",
    "Exercices"
  ]
}
```

#### Type: `short_text` (Réponse courte)
```json
{
  "order": 3,
  "type": "short_text",
  "question": "Quel est votre nom ?",
  "required": true
}
```

#### Type: `long_text` (Paragraphe)
```json
{
  "order": 4,
  "type": "long_text",
  "question": "Avez-vous des commentaires supplémentaires ?",
  "required": false
}
```

#### Type: `dropdown` (Liste déroulante)
```json
{
  "order": 5,
  "type": "dropdown",
  "question": "Quel est votre niveau d'expérience ?",
  "required": true,
  "options": [
    "Débutant",
    "Intermédiaire",
    "Avancé",
    "Expert"
  ]
}
```

#### Type: `table` (Grille/Tableau)
```json
{
  "order": 6,
  "type": "table",
  "question": "Évaluez les différents aspects de la formation",
  "required": true,
  "table_columns": [
    "En présentiel",
    "En présentiel",
    "À l'écrit"
  ],
  "table_rows": [
    ["Stagiaire", "Stagiaire", "Optionnel"],
    ["", "", "Durée totale"]
  ]
}
```

**Note** : Le champ `question` sert de **sous-question** pour les tableaux (texte affiché au-dessus du tableau).

#### Type: `recommendation` (Question de recommandation)
```json
{
  "order": 7,
  "type": "recommendation",
  "question": "Recommanderiez-vous cette formation à un collègue ?",
  "required": true,
  "options": [
    "Oui, absolument",
    "Oui, probablement",
    "Peut-être",
    "Non, probablement pas",
    "Non, absolument pas"
  ]
}
```

**Note** : Les questions de recommandation peuvent avoir des options comme les QCM, mais sont marquées spécialement pour le traitement backend.

#### Type: `pedagogy` (Pédagogie - Section d'information)
```json
{
  "order": 8,
  "type": "pedagogy",
  "question": "",  // Peut être vide ou servir de titre
  "required": false,
  "content": "<p>Cette section contient des informations pédagogiques avec <strong>formatage</strong> et des listes.</p><ul><li>Point 1</li><li>Point 2</li></ul>"
}
```

**Note** : Les sections pédagogiques ne sont pas des questions à répondre, mais des blocs d'information affichés dans le questionnaire.

## Traitement Backend

### 1. Validation

```php
// Validation des champs requis
- title : string, required, non vide
- description : string, optionnel
- questionnaire_type : string, default "custom"
- questions : array, required, au moins 1 question
- Pour chaque question :
  - order : integer, required, unique dans le questionnaire
  - type : enum('single_choice', 'multiple_choice', 'short_text', 'long_text', 'dropdown', 'table', 'recommendation', 'pedagogy'), required
  - question : string, required (peut être vide pour pedagogy)
  - required : boolean, default false
  - options : array of strings, optionnel
    - Requis si type = 'single_choice', 'multiple_choice', 'dropdown', 'recommendation'
    - Au moins 2 options requises
  - table_columns : array of strings, optionnel
    - Requis si type = 'table'
    - Au moins 1 colonne requise
  - table_rows : array of arrays of strings, optionnel
    - Requis si type = 'table'
    - Chaque ligne doit avoir le même nombre de cellules que le nombre de colonnes
  - content : string (HTML), optionnel
    - Requis si type = 'pedagogy'
```

### 2. Stockage

```php
// 1. Créer le questionnaire
$questionnaire = Questionnaire::create([
    'uuid' => Str::uuid(),
    'course_uuid' => $courseUuid,
    'title' => $request->title,
    'description' => $request->description,
    'questionnaire_type' => $request->questionnaire_type ?? 'custom',
    'created_by' => auth()->id(),
    'created_at' => now(),
    'updated_at' => now()
]);

// 2. Créer les questions
foreach ($request->questions as $questionData) {
    $question = Question::create([
        'uuid' => Str::uuid(),
        'questionnaire_id' => $questionnaire->id,
        'order' => $questionData['order'],
        'type' => $questionData['type'],
        'question' => $questionData['question'],
        'required' => $questionData['required'] ?? false,
        'options' => isset($questionData['options']) ? json_encode($questionData['options']) : null,
        'table_columns' => isset($questionData['table_columns']) ? json_encode($questionData['table_columns']) : null,
        'table_rows' => isset($questionData['table_rows']) ? json_encode($questionData['table_rows']) : null,
        'content' => $questionData['content'] ?? null,
        'created_at' => now(),
        'updated_at' => now()
    ]);
}
```

### 3. Structure de la Table `questionnaires`

```sql
CREATE TABLE questionnaires (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    uuid VARCHAR(36) UNIQUE NOT NULL,
    course_uuid VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    questionnaire_type VARCHAR(50) DEFAULT 'custom',
    created_by BIGINT UNSIGNED NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    FOREIGN KEY (course_uuid) REFERENCES courses(uuid) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_course_uuid (course_uuid),
    INDEX idx_questionnaire_type (questionnaire_type)
);
```

### 4. Structure de la Table `questions`

```sql
CREATE TABLE questions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    uuid VARCHAR(36) UNIQUE NOT NULL,
    questionnaire_id BIGINT UNSIGNED NOT NULL,
    order INTEGER NOT NULL,
    type VARCHAR(50) NOT NULL,
    question TEXT NOT NULL,
    required BOOLEAN DEFAULT FALSE,
    options JSON NULL,  -- Pour single_choice, multiple_choice, dropdown, recommendation
    table_columns JSON NULL,  -- Pour table
    table_rows JSON NULL,  -- Pour table
    content TEXT NULL,  -- Pour pedagogy (HTML)
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    FOREIGN KEY (questionnaire_id) REFERENCES questionnaires(id) ON DELETE CASCADE,
    INDEX idx_questionnaire_id (questionnaire_id),
    INDEX idx_order (order),
    INDEX idx_type (type)
);
```

### 5. Réponse API

```json
{
  "success": true,
  "message": "Questionnaire créé avec succès",
  "data": {
    "id": 123,
    "uuid": "questionnaire-uuid-123",
    "course_uuid": "course-uuid",
    "title": "Titre du questionnaire",
    "description": "Description du questionnaire",
    "questionnaire_type": "custom",
    "questions": [
      {
        "id": 456,
        "uuid": "question-uuid-456",
        "order": 1,
        "type": "single_choice",
        "question": "Quelle est votre satisfaction globale ?",
        "required": true,
        "options": ["Très satisfait", "Satisfait", "Neutre"],
        "created_at": "2025-11-15T10:30:00.000000Z",
        "updated_at": "2025-11-15T10:30:00.000000Z"
      }
    ],
    "created_at": "2025-11-15T10:30:00.000000Z",
    "updated_at": "2025-11-15T10:30:00.000000Z"
  }
}
```

## Points d'Attention Importants

### 1. Sécurité
- ✅ **Sanitize le HTML** : Pour les questions de type `pedagogy`, sanitizer le contenu HTML pour éviter XSS
- ✅ **Valider les types** : Vérifier que le type de question est dans la liste autorisée
- ✅ **Permissions** : Vérifier que l'utilisateur est admin/instructor du cours
- ✅ **Limiter les options** : Limiter le nombre d'options par question (recommandé : max 20)
- ✅ **Limiter les colonnes/lignes** : Pour les tableaux, limiter le nombre de colonnes (max 10) et lignes (max 50)

### 2. Validation des Données

#### Pour les questions avec options
```php
if (in_array($questionData['type'], ['single_choice', 'multiple_choice', 'dropdown', 'recommendation'])) {
    if (!isset($questionData['options']) || !is_array($questionData['options'])) {
        throw new ValidationException('Les options sont requises pour ce type de question');
    }
    if (count($questionData['options']) < 2) {
        throw new ValidationException('Au moins 2 options sont requises');
    }
    if (count($questionData['options']) > 20) {
        throw new ValidationException('Maximum 20 options autorisées');
    }
}
```

#### Pour les questions de type table
```php
if ($questionData['type'] === 'table') {
    if (!isset($questionData['table_columns']) || !is_array($questionData['table_columns'])) {
        throw new ValidationException('Les colonnes sont requises pour les tableaux');
    }
    if (count($questionData['table_columns']) < 1) {
        throw new ValidationException('Au moins 1 colonne est requise');
    }
    if (count($questionData['table_columns']) > 10) {
        throw new ValidationException('Maximum 10 colonnes autorisées');
    }
    
    if (!isset($questionData['table_rows']) || !is_array($questionData['table_rows'])) {
        throw new ValidationException('Les lignes sont requises pour les tableaux');
    }
    if (count($questionData['table_rows']) > 50) {
        throw new ValidationException('Maximum 50 lignes autorisées');
    }
    
    // Vérifier que chaque ligne a le bon nombre de cellules
    $columnCount = count($questionData['table_columns']);
    foreach ($questionData['table_rows'] as $rowIndex => $row) {
        if (!is_array($row) || count($row) !== $columnCount) {
            throw new ValidationException("La ligne " . ($rowIndex + 1) . " doit avoir " . $columnCount . " cellules");
        }
    }
}
```

#### Pour les questions de type pedagogy
```php
if ($questionData['type'] === 'pedagogy') {
    if (!isset($questionData['content']) || empty(trim($questionData['content']))) {
        throw new ValidationException('Le contenu est requis pour les sections pédagogiques');
    }
    // Sanitizer le HTML
    $questionData['content'] = Purifier::clean($questionData['content']);
}
```

### 3. Ordre des Questions

L'ordre des questions est déterminé par le champ `order` dans chaque question. Le backend doit :
- Vérifier que les ordres sont uniques
- Réorganiser automatiquement si des ordres sont dupliqués
- Permettre la réorganisation via drag & drop (mise à jour de l'ordre)

### 4. Types de Questions et Rendu

#### Frontend → Backend Mapping

| Type Frontend | Type Backend | Description |
|--------------|--------------|-------------|
| `single_choice` | `single_choice` | Radio buttons (une seule réponse) |
| `multiple_choice` | `multiple_choice` | Checkboxes (plusieurs réponses) |
| `short_text` | `short_text` | Input texte court |
| `long_text` | `long_text` | Textarea (paragraphe) |
| `dropdown` | `dropdown` | Select dropdown |
| `table` | `table` | Grille/Tableau avec colonnes et lignes |
| `recommendation` | `recommendation` | Question de recommandation (comme QCM) |
| `pedagogy` | `pedagogy` | Section d'information (pas de réponse) |

### 5. Génération de PDF (Optionnel)

Si le backend doit générer un PDF du questionnaire :

```php
function generateQuestionnairePDF($questionnaire, $questions) {
    $html = '<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body>';
    $html .= '<h1>' . htmlspecialchars($questionnaire->title) . '</h1>';
    if ($questionnaire->description) {
        $html .= '<p>' . htmlspecialchars($questionnaire->description) . '</p>';
    }
    
    foreach ($questions as $question) {
        $html .= '<div style="margin-bottom: 20px;">';
        $html .= '<p><strong>' . $question->order . '. ' . htmlspecialchars($question->question) . '</strong>';
        if ($question->required) {
            $html .= ' <span style="color: red;">*</span>';
        }
        $html .= '</p>';
        
        switch ($question->type) {
            case 'single_choice':
            case 'multiple_choice':
            case 'dropdown':
            case 'recommendation':
                $options = json_decode($question->options, true);
                foreach ($options as $opt) {
                    $symbol = $question->type === 'single_choice' ? '○' : '☐';
                    $html .= '<p style="margin-left: 20px;">' . $symbol . ' ' . htmlspecialchars($opt) . '</p>';
                }
                break;
            case 'short_text':
                $html .= '<p style="margin-left: 20px;">_____________________________</p>';
                break;
            case 'long_text':
                $html .= '<div style="margin-left: 20px; border: 1px dashed #ccc; min-height: 80px; padding: 10px;"></div>';
                break;
            case 'table':
                $columns = json_decode($question->table_columns, true);
                $rows = json_decode($question->table_rows, true);
                $html .= '<table border="1" style="width: 100%; border-collapse: collapse; margin-left: 20px;">';
                $html .= '<thead><tr>';
                foreach ($columns as $col) {
                    $html .= '<th style="padding: 8px; background-color: #f5f5f5;">' . htmlspecialchars($col) . '</th>';
                }
                $html .= '</tr></thead><tbody>';
                foreach ($rows as $row) {
                    $html .= '<tr>';
                    foreach ($row as $cell) {
                        $html .= '<td style="padding: 8px;">' . htmlspecialchars($cell) . '</td>';
                    }
                    $html .= '</tr>';
                }
                $html .= '</tbody></table>';
                break;
            case 'pedagogy':
                $html .= '<div style="margin-left: 20px; padding: 10px; background-color: #f9f9f9; border-left: 3px solid #2196F3;">';
                $html .= $question->content; // Déjà sanitized
                $html .= '</div>';
                break;
        }
        $html .= '</div>';
    }
    
    $html .= '</body></html>';
    
    // Générer le PDF avec Puppeteer ou dompdf
    return generatePDF($html);
}
```

## Endpoints Supplémentaires Recommandés

### 1. Récupération d'un Questionnaire
**GET** `/api/organization/courses/{courseUuid}/questionnaires/{questionnaireUuid}`

Retourne le questionnaire avec toutes ses questions dans l'ordre.

### 2. Mise à Jour d'un Questionnaire
**PUT** `/api/organization/courses/{courseUuid}/questionnaires/{questionnaireUuid}`

Même structure que la création, mais pour la mise à jour.

### 3. Suppression d'un Questionnaire
**DELETE** `/api/organization/courses/{courseUuid}/questionnaires/{questionnaireUuid}`

Supprime le questionnaire et toutes ses questions (cascade).

### 4. Duplication d'un Questionnaire
**POST** `/api/organization/courses/{courseUuid}/questionnaires/{questionnaireUuid}/duplicate`

Duplique un questionnaire existant vers le même cours ou un autre cours.

### 5. Réorganisation des Questions
**PUT** `/api/organization/courses/{courseUuid}/questionnaires/{questionnaireUuid}/reorder`

```json
{
  "question_orders": [
    { "question_uuid": "q-uuid-1", "order": 1 },
    { "question_uuid": "q-uuid-2", "order": 2 },
    { "question_uuid": "q-uuid-3", "order": 3 }
  ]
}
```

## Exemple de Flux Complet

1. **Frontend** : Utilisateur crée un questionnaire avec titre et description
2. **Frontend** : Ajoute des questions de différents types (QCM, texte, tableau, etc.)
3. **Frontend** : Configure chaque question (texte, options, obligatoire)
4. **Frontend** : Réorganise les questions par drag & drop
5. **Frontend** : Clique sur "Valider" → Envoie JSON avec toutes les questions
6. **Backend** : Valide les données (structure, types, options)
7. **Backend** : Crée l'entrée `questionnaires` en base de données
8. **Backend** : Crée toutes les entrées `questions` avec leurs options/tableaux/contenu
9. **Backend** : Retourne le questionnaire créé avec toutes ses questions
10. **Frontend** : Affiche succès et ferme la page (ou retourne à la liste)

## Migration depuis l'Ancienne Logique

Si vous avez des questionnaires créés avec l'ancienne logique, vous pouvez :

1. **Les laisser tels quels** : L'ancienne logique continue de fonctionner
2. **Les migrer** : Créer un script de migration qui convertit les anciens questionnaires en nouveau format
3. **Support hybride** : Maintenir les deux systèmes en parallèle

## Structure de Données Alternative (Si Utilisation de `documents` Table)

Si vous utilisez la table `documents` au lieu d'une table dédiée `questionnaires` :

```php
// Utiliser document_type = 'questionnaire' et is_questionnaire = true
$document = CourseDocument::create([
    'uuid' => Str::uuid(),
    'course_uuid' => $courseUuid,
    'name' => $request->title,
    'description' => $request->description,
    'document_type' => 'questionnaire',
    'is_questionnaire' => true,
    'questionnaire_type' => $request->questionnaire_type ?? 'custom',
    'custom_template' => json_encode([
        'questions' => $request->questions
    ]),
    'created_by' => auth()->id(),
    'created_at' => now(),
    'updated_at' => now()
]);
```

## Notes Importantes

- Les **questions pédagogiques** (`pedagogy`) ne sont pas des questions à répondre, mais des sections d'information affichées dans le questionnaire
- Les **questions de recommandation** (`recommendation`) sont traitées comme des QCM mais marquées spécialement pour l'analyse
- L'**ordre des questions** est crucial et doit être préservé lors de la récupération
- Les **options** pour les QCM peuvent être réorganisées par drag & drop (ordre important)
- Les **tableaux** doivent avoir un nombre cohérent de cellules par ligne (égal au nombre de colonnes)
- Le **contenu HTML** des sections pédagogiques doit être sanitized pour éviter XSS
- La nouvelle logique **remplace complètement** l'ancienne pour les nouveaux questionnaires créés via le builder

## Statut Actuel

✅ **Frontend** : Complètement implémenté avec design exact, builder modulaire, 8 types de questions, drag & drop
❓ **Backend** : À implémenter/ajuster selon cette documentation

