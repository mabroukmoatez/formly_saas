# Ajustements Backend - Page de Création de Documents (Design Qualiopi)

## Contexte
La page de création de documents permet de générer des **Certificats de Réalisation** conformes aux exigences Qualiopi avec un système de champs modulaires. Cette nouvelle implémentation remplace l'ancienne logique basée sur des templates prédéfinis par un système de **builder personnalisé** où l'utilisateur construit son document champ par champ.

## Changements Majeurs par Rapport à l'Ancienne Logique

### Ancienne Logique (À Remplacer)
- Utilisation de templates prédéfinis (`document_type: 'template'`)
- Variables définies dans un objet séparé (`templateVariables`, `dynamicVariables`)
- Structure fixe avec peu de flexibilité
- Pas de système de champs modulaires

### Nouvelle Logique (Actuelle)
- **Builder personnalisé** : L'utilisateur construit le document champ par champ
- **Champs modulaires** : 4 types de champs (texte, titre+tableau, signature, mentions légales)
- **Variables intégrées** : Les variables sont insérées directement dans le contenu HTML comme badges orange
- **Structure flexible** : Ordre des champs personnalisable par drag & drop
- **Design Qualiopi** : Respect strict du design avec logo, titre centré, informations réglementaires

## Structure de Données Backend

### 1. Endpoint de Création de Document
**POST** `/api/organization/courses/{courseUuid}/documents`

### 2. Format de la Requête (FormData)

```javascript
FormData {
  name: "Titre de document",                    // Titre du document (required) - Saisi par l'utilisateur
  document_type: "custom_builder",             // Type fixe pour le nouveau système
  audience_type: "students",                    // students | instructors | organization
  is_certificate: "1" | "0",                   // "1" si checkbox "Certificat" coché, "0" sinon
  certificate_background: "data:image/...",    // Image de fond en base64 (optionnel, uniquement si is_certificate = "1")
  custom_template: JSON.stringify({            // Structure complète du document
    pages: [
      {
        page: 1,
        content: "<div>HTML généré...</div>"   // HTML final avec variables
      }
    ],
    total_pages: 1,
    fields: [                                   // Array de tous les champs modulaires
      {
        id: "field-1234567890",
        type: "text | title_with_table | signature | legal",
        label: "string",
        content: "HTML string avec variables",
        tableData: { ... },                     // Uniquement pour type "title_with_table"
        signatureFields: [ ... ],                // Uniquement pour type "signature"
        organizationSignature: "base64..."      // Uniquement pour type "signature"
      }
    ],
    certificate_background: "data:image/..." | null  // Image de fond du certificat (si is_certificate = true)
  })
}
```

**Note importante** : 
- Le champ `name` est maintenant un **champ éditable** saisi par l'utilisateur (placeholder: "Titre de document")
- Le champ `is_certificate` dépend d'un **checkbox "Certificat"** dans l'interface
- Si `is_certificate = "1"`, l'utilisateur peut optionnellement ajouter une **image de fond** (`certificate_background`)
- L'image de fond est envoyée à la fois dans `FormData.certificate_background` (pour upload) et dans `custom_template.certificate_background` (pour référence)

### 3. Structure Détaillée des Champs

#### Type: `text` ou `legal`
```json
{
  "id": "field-1234567890",
  "type": "text",
  "label": "Champ texte",
  "content": "<p>Texte avec <span class=\"variable-badge\" data-variable=\"{{student_name}}\" style=\"background-color: #FFE0B2; color: #E65100; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 500; margin: 0 4px; display: inline-block;\">Nom de l'étudiant</span> sera remplacé.</p>"
}
```

**Note** : Le contenu HTML contient des badges orange (`variable-badge`) avec l'attribut `data-variable` qui contient la clé de la variable (ex: `{{student_name}}`).

#### Type: `title_with_table`
```json
{
  "id": "field-4567890123",
  "type": "title_with_table",
  "label": "Titre de la section",
  "content": "",
  "tableData": {
    "columns": ["En présentiel", "En présentiel", "À l'écrit"],
    "rows": [
      ["Stagiaire", "Stagiaire", "Optionnel"],
      ["", "", "Durée totale"]
    ]
  }
}
```

#### Type: `signature`
```json
{
  "id": "field-7890123456",
  "type": "signature",
  "label": "Espace signature",
  "content": "",
  "signatureFields": [
    "Pour _________",
    "Pour _________"
  ],
  "organizationSignature": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..." // ou null
}
```

#### Type: `legal`
```json
{
  "id": "field-0123456789",
  "type": "legal",
  "label": "Mentions légales",
  "content": "<p>Mentions légales avec <span class=\"variable-badge\" data-variable=\"{{organization_name}}\">Nom de l'organisation</span></p>"
}
```

### 4. Variables Dynamiques

Les variables sont insérées dans le HTML comme des **badges orange** avec cette structure :

```html
<span 
  class="variable-badge" 
  data-variable="{{variable_key}}"
  style="background-color: #FFE0B2; color: #E65100; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 500; margin: 0 4px; display: inline-block;"
>
  Label de la variable
</span>
```

**Variables disponibles** :
- **Apprenant** : `{{student_name}}`, `{{student_first_name}}`, `{{student_last_name}}`, `{{student_email}}`, `{{student_phone}}`
- **Formation** : `{{course_name}}`, `{{course_description}}`, `{{course_duration}}`, `{{course_start_date}}`, `{{course_end_date}}`
- **Organisation** : `{{organization_name}}`, `{{organization_address}}`, `{{organization_email}}`, `{{organization_phone}}`
- **Entreprise** : `{{entreprise_name}}`, `{{entreprise_siret}}`, `{{entreprise_address}}`
- **Dates** : `{{current_date}}`, `{{current_date_short}}`, `{{current_year}}`

### 5. Génération du HTML Final

Le frontend génère un HTML structuré qui doit être traité par le backend :

```html
<!-- En-tête du document -->
<div style="text-align: center; margin-bottom: 30px;">
  <h1 style="font-size: 20px; color: #424242; font-weight: 600; letter-spacing: 0.5px; margin: 30px 0 15px 0;">
    Certificat De Réalisation
  </h1>
  <div style="font-size: 9px; color: #9E9E9E; line-height: 1.6;">
    Informations réglementaires (numéro de déclaration, adresse, dates de formation)
  </div>
</div>

<!-- Champs modulaires -->
<div style="margin-bottom: 24px;">
  <p>Texte avec <span class="variable-badge" data-variable="{{student_name}}" style="...">Nom de l'étudiant</span></p>
</div>

<!-- Tableaux -->
<div style="margin-bottom: 24px;">
  <h2 style="margin-bottom: 12px;">Titre de la section</h2>
  <table border="1" style="width: 100%; border-collapse: collapse; margin-bottom: 12px;">
    <thead>
      <tr>
        <th style="background-color: #F5F5F5; border: 1px solid #E0E0E0; padding: 12px; font-size: 13px; color: #616161; font-weight: 500;">Colonne 1</th>
        <th style="...">Colonne 2</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="border: 1px solid #E8E8E8; padding: 12px; font-size: 13px; color: #212121;">Cellule 1</td>
        <td style="...">Cellule 2</td>
      </tr>
    </tbody>
  </table>
</div>

<!-- Signatures -->
<div style="background-color: #FAFAFA; border: 1px dashed #BDBDBD; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
  <div style="font-size: 12px; color: #616161; line-height: 1.5; margin-bottom: 16px;">
    Document réalisé et signé en double exemplaire
  </div>
  <span style="background-color: #FFE0B2; color: #E65100; padding: 6px 12px; border-radius: 6px; font-size: 12px; margin-right: 8px;">
    Pour _________
  </span>
  <div style="font-size: 11px; color: #9E9E9E; font-style: italic; margin-top: 8px;">Signature</div>
  <img src="data:image/png;base64,..." style="max-width: 200px; height: auto;" />
</div>
```

## Traitement Backend

### 1. Validation

```php
// Validation des champs requis
- name : string, required, non vide (titre du document saisi par l'utilisateur)
- document_type : doit être "custom_builder"
- is_certificate : "0" ou "1" (string)
- certificate_background : string (base64) ou null, optionnel
  - Si is_certificate = "1", l'image peut être fournie
  - Format accepté : data:image/png;base64,... ou data:image/jpeg;base64,...
  - Taille max recommandée : 5MB
- custom_template : JSON valide
- custom_template.fields : array, au moins 1 champ
- custom_template.certificate_background : string (base64) ou null
  - Doit correspondre à certificate_background dans FormData si fourni
- Pour chaque field :
  - id : string, required
  - type : enum('text', 'title_with_table', 'signature', 'legal'), required
  - label : string, required
  - content : string (peut être vide pour certains types)
  - Si type = 'title_with_table' : tableData.columns et tableData.rows doivent exister
  - Si type = 'signature' : signatureFields doit être un array
```

### 2. Remplacement des Variables

**Algorithme de remplacement** :

```php
function replaceVariables($htmlContent, $courseUuid, $studentUuid = null) {
    // 1. Extraire toutes les variables depuis les badges
    preg_match_all(
        '/<span[^>]*class="variable-badge"[^>]*data-variable="([^"]+)"[^>]*>([^<]*)<\/span>/',
        $htmlContent,
        $matches,
        PREG_SET_ORDER
    );
    
    // 2. Récupérer les valeurs depuis la base de données
    $variables = [];
    
    foreach ($matches as $match) {
        $variableKey = $match[1]; // ex: "{{student_name}}"
        
        // Récupérer la valeur selon le type de variable
        if (strpos($variableKey, 'student_') !== false && $studentUuid) {
            $student = User::where('uuid', $studentUuid)->first();
            $variables[$variableKey] = $this->getStudentVariable($variableKey, $student);
        } elseif (strpos($variableKey, 'course_') !== false) {
            $course = Course::where('uuid', $courseUuid)->first();
            $variables[$variableKey] = $this->getCourseVariable($variableKey, $course);
        } elseif (strpos($variableKey, 'organization_') !== false || strpos($variableKey, 'entreprise_') !== false) {
            $organization = auth()->user()->organization;
            $variables[$variableKey] = $this->getOrganizationVariable($variableKey, $organization);
        } elseif (strpos($variableKey, 'current_') !== false || strpos($variableKey, 'current_year') !== false) {
            $variables[$variableKey] = $this->getDateVariable($variableKey);
        }
    }
    
    // 3. Remplacer les badges par les valeurs réelles
    foreach ($variables as $key => $value) {
        $htmlContent = preg_replace(
            '/<span[^>]*class="variable-badge"[^>]*data-variable="' . preg_quote($key, '/') . '"[^>]*>([^<]*)<\/span>/',
            '<span style="background-color: #FFE0B2; color: #E65100; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 500; margin: 0 4px; display: inline-block;">' . htmlspecialchars($value) . '</span>',
            $htmlContent
        );
    }
    
    return $htmlContent;
}
```

**Méthodes de récupération des variables** :

```php
private function getStudentVariable($key, $student) {
    $map = [
        '{{student_name}}' => $student->name ?? '',
        '{{student_first_name}}' => $student->first_name ?? '',
        '{{student_last_name}}' => $student->last_name ?? '',
        '{{student_email}}' => $student->email ?? '',
        '{{student_phone}}' => $student->phone_number ?? '',
    ];
    return $map[$key] ?? '';
}

private function getCourseVariable($key, $course) {
    $map = [
        '{{course_name}}' => $course->title ?? '',
        '{{course_description}}' => $course->description ?? '',
        '{{course_duration}}' => $course->duration ?? '',
        '{{course_start_date}}' => $course->start_date ? date('d/m/Y', strtotime($course->start_date)) : '',
        '{{course_end_date}}' => $course->end_date ? date('d/m/Y', strtotime($course->end_date)) : '',
    ];
    return $map[$key] ?? '';
}

private function getOrganizationVariable($key, $organization) {
    $map = [
        '{{organization_name}}' => $organization->organization_name ?? '',
        '{{organization_address}}' => $organization->address ?? '',
        '{{organization_email}}' => $organization->email ?? '',
        '{{organization_phone}}' => $organization->phone_number ?? '',
        '{{entreprise_name}}' => $organization->company_name ?? '',
        '{{entreprise_siret}}' => $organization->siret ?? '',
        '{{entreprise_address}}' => $organization->address ?? '',
    ];
    return $map[$key] ?? '';
}

private function getDateVariable($key) {
    $map = [
        '{{current_date}}' => date('d F Y'), // ex: "15 janvier 2024"
        '{{current_date_short}}' => date('d/m/Y'), // ex: "15/01/2024"
        '{{current_year}}' => date('Y'), // ex: "2024"
    ];
    return $map[$key] ?? '';
}
```

### 3. Génération de PDF

**Bibliothèque recommandée** : **Puppeteer** (Node.js) ou **dompdf** (PHP)

#### Avec Puppeteer (Recommandé)

```javascript
const puppeteer = require('puppeteer');

async function generatePDF(htmlContent, isCertificate, organizationLogo, organizationName, certificateBackground) {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    
    // Ajouter le logo de l'organisation en haut à gauche si disponible
    // Si certificat avec background, utiliser l'image comme fond
    let fullHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body {
                    font-family: 'Arial', sans-serif;
                    margin: 0;
                    padding: 20px;
                    ${isCertificate && certificateBackground ? `
                        background-image: url('${certificateBackground}');
                        background-size: cover;
                        background-position: center;
                        background-repeat: no-repeat;
                    ` : ''}
                }
                .organization-header {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 30px;
                }
                .organization-logo {
                    width: 48px;
                    height: 48px;
                    object-fit: contain;
                }
                .organization-name {
                    font-size: 12px;
                    color: #6B7280;
                }
                .content-wrapper {
                    ${isCertificate && certificateBackground ? 'background-color: rgba(255, 255, 255, 0.95); padding: 20px; border-radius: 8px;' : ''}
                }
            </style>
        </head>
        <body>
            <div class="content-wrapper">
                ${organizationLogo ? `
                    <div class="organization-header">
                        <img src="${organizationLogo}" class="organization-logo" />
                        <div class="organization-name">${organizationName}</div>
                    </div>
                ` : ''}
                ${htmlContent}
            </div>
        </body>
        </html>
    `;
    
    await page.setContent(fullHtml, { waitUntil: 'networkidle0' });
    
    const pdf = await page.pdf({
        format: 'A4',
        landscape: isCertificate, // Landscape pour les certificats
        printBackground: true, // Important pour afficher le background
        margin: {
            top: '20mm',
            right: '15mm',
            bottom: '20mm',
            left: '15mm'
        }
    });
    
    await browser.close();
    return pdf;
}
```

#### Avec dompdf (PHP)

```php
use Dompdf\Dompdf;
use Dompdf\Options;

function generatePDF($htmlContent, $isCertificate, $organizationLogo, $organizationName, $certificateBackground = null) {
    $options = new Options();
    $options->set('isHtml5ParserEnabled', true);
    $options->set('isRemoteEnabled', true);
    $options->set('isPhpEnabled', true);
    
    $dompdf = new Dompdf($options);
    
    // Ajouter le logo et le nom de l'organisation
    // Si certificat avec background, utiliser l'image comme fond
    $bodyStyle = 'font-family: Arial, sans-serif; margin: 0; padding: 20px;';
    if ($isCertificate && $certificateBackground) {
        $bodyStyle .= " background-image: url('" . $certificateBackground . "'); background-size: cover; background-position: center; background-repeat: no-repeat;";
    }
    
    $contentWrapperStyle = '';
    if ($isCertificate && $certificateBackground) {
        $contentWrapperStyle = 'background-color: rgba(255, 255, 255, 0.95); padding: 20px; border-radius: 8px;';
    }
    
    $fullHtml = '
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { ' . $bodyStyle . ' }
                .organization-header { display: flex; align-items: center; gap: 12px; margin-bottom: 30px; }
                .organization-logo { width: 48px; height: 48px; object-fit: contain; }
                .organization-name { font-size: 12px; color: #6B7280; }
                .content-wrapper { ' . $contentWrapperStyle . ' }
            </style>
        </head>
        <body>
            <div class="content-wrapper">
                ' . ($organizationLogo ? '
                    <div class="organization-header">
                        <img src="' . $organizationLogo . '" class="organization-logo" />
                        <div class="organization-name">' . htmlspecialchars($organizationName) . '</div>
                    </div>
                ' : '') . '
                ' . $htmlContent . '
            </div>
        </body>
        </html>
    ';
    
    $dompdf->loadHtml($fullHtml);
    $dompdf->setPaper($isCertificate ? 'A4-landscape' : 'A4', 'portrait');
    $dompdf->render();
    
    return $dompdf->output();
}
```

### 4. Stockage

```php
// 1. Traiter l'image de background si fournie
$certificateBackgroundPath = null;
if ($request->is_certificate === '1' && $request->has('certificate_background')) {
    // Option 1: Sauvegarder l'image base64 comme fichier séparé
    $backgroundData = $request->certificate_background;
    if (strpos($backgroundData, 'data:image') === 0) {
        // Extraire les données base64
        list($type, $data) = explode(';', $backgroundData);
        list(, $data) = explode(',', $data);
        $imageData = base64_decode($data);
        
        // Déterminer l'extension
        $extension = 'png';
        if (strpos($type, 'jpeg') !== false || strpos($type, 'jpg') !== false) {
            $extension = 'jpg';
        }
        
        // Sauvegarder l'image
        $backgroundFilename = 'certificate-bg-' . time() . '-' . uniqid() . '.' . $extension;
        $backgroundPath = 'certificate-backgrounds/' . $backgroundFilename;
        Storage::disk('public')->put($backgroundPath, $imageData);
        $certificateBackgroundPath = $backgroundPath;
    }
    
    // Option 2: Garder en base64 dans le JSON (moins recommandé pour grandes images)
    // $certificateBackgroundPath = $request->certificate_background;
}

// 2. Générer le PDF
$customTemplate = json_decode($request->custom_template, true);
$certificateBackground = $certificateBackgroundPath ?? $customTemplate['certificate_background'] ?? null;

$pdfContent = generatePDF(
    $customTemplate['pages'][0]['content'], 
    $request->is_certificate === '1',
    $organizationLogo,
    $organizationName,
    $certificateBackground
);

// 3. Sauvegarder le PDF
$filename = ($request->is_certificate === '1' ? 'certificate-' : 'document-') . time() . '-' . uniqid() . '.pdf';
$path = 'documents/' . $filename;
Storage::disk('public')->put($path, $pdfContent);

// 4. Mettre à jour custom_template avec le chemin de l'image de background
if ($certificateBackgroundPath) {
    $customTemplate['certificate_background'] = $certificateBackgroundPath;
}

// 5. Créer l'entrée en base de données
$document = CourseDocument::create([
    'uuid' => Str::uuid(),
    'course_uuid' => $courseUuid,
    'name' => $request->name, // Titre saisi par l'utilisateur
    'document_type' => 'custom_builder',
    'audience_type' => $request->audience_type,
    'is_certificate' => $request->is_certificate === '1',
    'file_url' => $path,
    'certificate_background' => $certificateBackgroundPath, // Nouveau champ pour stocker le chemin de l'image
    'custom_template' => $customTemplate,
    'created_by' => auth()->id(),
    'created_at' => now(),
    'updated_at' => now()
]);
```

### 5. Réponse API

```json
{
  "success": true,
  "message": "Document créé avec succès",
  "data": {
    "id": 123,
    "uuid": "doc-uuid-123",
    "course_uuid": "course-uuid",
    "name": "Titre de document",
    "document_type": "custom_builder",
    "audience_type": "students",
    "is_certificate": true,
    "certificate_background": "/storage/certificate-backgrounds/certificate-bg-123.jpg",
    "file_url": "/storage/documents/certificate-123.pdf",
    "custom_template": {
      "pages": [...],
      "total_pages": 1,
      "fields": [...],
      "certificate_background": "/storage/certificate-backgrounds/certificate-bg-123.jpg"
    },
    "created_at": "2025-11-15T10:30:00.000000Z",
    "updated_at": "2025-11-15T10:30:00.000000Z"
  }
}
```

**Note** : Le champ `name` contient maintenant le titre saisi par l'utilisateur (peut être "Certificat De Réalisation" ou tout autre titre personnalisé).

## Points d'Attention Importants

### 1. Sécurité
- ✅ **Sanitize le HTML** : Utiliser `htmlspecialchars()` ou une bibliothèque de sanitization pour éviter XSS
- ✅ **Valider les variables** : Vérifier que les clés de variables sont dans la liste autorisée
- ✅ **Permissions** : Vérifier que l'utilisateur est admin/instructor du cours
- ✅ **Taille des images** : Limiter la taille des signatures (max 2MB recommandé)

### 2. Performance
- ✅ **Cache des variables** : Mettre en cache les valeurs d'organisation pour éviter les requêtes répétées
- ✅ **Génération asynchrone** : Pour les gros documents, considérer une génération asynchrone avec queue
- ✅ **Optimisation PDF** : Compresser les images avant génération PDF

### 3. Design Qualiopi
- ✅ **Format Landscape** : Les certificats (`is_certificate = true`) doivent être en format A4 landscape
- ✅ **Logo et nom** : Toujours afficher le logo et le nom de l'organisme en haut
- ✅ **Titre centré** : Le titre du document (saisi par l'utilisateur dans le champ "Titre de document") doit être centré
- ✅ **Image de fond** : Si `is_certificate = true` et `certificate_background` fourni, utiliser l'image comme fond du PDF
  - L'image doit couvrir toute la page (background-size: cover)
  - Le contenu doit être lisible (ajouter un fond semi-transparent si nécessaire)
  - Format recommandé : A4 landscape (297mm x 210mm)
- ✅ **Badges orange** : Les variables doivent rester visibles avec le style orange dans le PDF
- ✅ **Tableaux** : Rendre les tableaux avec bordures et espacements professionnels

## Endpoints Supplémentaires Recommandés

### 1. Prévisualisation PDF
**POST** `/api/organization/courses/{courseUuid}/documents/preview`

Génère un aperçu du PDF sans le sauvegarder. Utile pour la modal d'aperçu frontend.

**Request** : Même structure que la création
**Response** : PDF en base64 ou URL temporaire (valide 1h)

### 2. Régénération avec Nouvelles Variables
**POST** `/api/organization/courses/{courseUuid}/documents/{documentUuid}/regenerate`

Régénère le PDF avec les nouvelles valeurs de variables (si les données du cours/étudiant ont changé).

### 3. Duplication de Document
**POST** `/api/organization/courses/{courseUuid}/documents/{documentUuid}/duplicate`

Duplique un document existant vers un autre cours. Utile pour réutiliser des templates.

## Migration depuis l'Ancienne Logique

Si vous avez des documents créés avec l'ancienne logique (`document_type: 'template'`), vous pouvez :

1. **Les laisser tels quels** : L'ancienne logique continue de fonctionner
2. **Les migrer** : Créer un script de migration qui convertit les anciens documents en nouveau format
3. **Support hybride** : Maintenir les deux systèmes en parallèle

## Exemple de Flux Complet

1. **Frontend** : Utilisateur crée un document avec champs modulaires (texte, tableau, signature)
2. **Frontend** : Insère des variables dynamiques dans les champs texte
3. **Frontend** : Clique sur "Valider" → Envoie FormData avec `custom_template` (JSON stringifié)
4. **Backend** : Valide les données (structure, permissions)
5. **Backend** : Parse le HTML et extrait toutes les variables depuis les badges
6. **Backend** : Récupère les valeurs des variables depuis la base de données (student, course, organization)
7. **Backend** : Remplace les badges par les valeurs réelles (en gardant le style orange)
8. **Backend** : Génère le PDF avec Puppeteer/dompdf (format A4 landscape si certificat)
9. **Backend** : Sauvegarde le PDF dans `/storage/documents/`
10. **Backend** : Crée l'entrée en base de données avec métadonnées (`custom_template`, `fields`)
11. **Backend** : Retourne le document avec `file_url`
12. **Frontend** : Affiche succès et ferme la page (ou retourne à la liste)

## Technologies Recommandées

### Pour la Génération PDF :
- **Puppeteer** (Node.js) : ✅ Le plus puissant, supporte CSS moderne, fonts custom, images base64
- **dompdf** (PHP) : ✅ Simple, PHP natif, mais limites CSS
- **wkhtmltopdf** : ✅ Bon compromis, performant

### Pour les Variables :
- Créer une classe `VariableReplacer` pour centraliser la logique
- Utiliser un système de template engine (Blade, Twig) si disponible
- Cache les valeurs de variables pour performance

## Statut Actuel

✅ **Frontend** : Complètement implémenté avec design Qualiopi exact, builder modulaire, variables intégrées
❓ **Backend** : À implémenter/ajuster selon cette documentation

## Notes Importantes

- Le **titre du document** est maintenant **éditable** par l'utilisateur (champ "Titre de document")
- Le **checkbox "Certificat"** détermine si `is_certificate = "1"` ou `"0"`
- Si **certificat** (`is_certificate = "1"`), l'utilisateur peut optionnellement ajouter une **image de fond**
- L'**image de fond** doit être traitée et sauvegardée séparément (recommandé) ou stockée en base64 dans le JSON
- Les **badges orange** de variables doivent rester visibles dans le PDF final
- Le **design Qualiopi** doit être respecté (logo, titre centré, informations réglementaires)
- Les **tableaux** doivent être rendus professionnellement avec bordures et espacements
- Les **signatures** doivent avoir suffisamment d'espace pour être manuscrites
- Le format **landscape** est obligatoire pour les certificats (`is_certificate = true`)
- Si une **image de fond** est fournie, elle doit être appliquée comme background du PDF avec le contenu par-dessus
- La nouvelle logique **remplace complètement** l'ancienne pour les nouveaux documents créés via le builder

## Structure de la Table `course_documents` (Recommandée)

Ajouter une colonne pour stocker le chemin de l'image de background :

```sql
ALTER TABLE course_documents 
ADD COLUMN certificate_background VARCHAR(255) NULL 
COMMENT 'Chemin vers l\'image de fond du certificat';
```

Ou stocker dans le JSON `custom_template` :

```json
{
  "pages": [...],
  "total_pages": 1,
  "fields": [...],
  "certificate_background": "/storage/certificate-backgrounds/bg-123.jpg"
}
```
