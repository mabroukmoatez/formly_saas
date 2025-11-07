<?php

namespace App\Services;

use App\Models\CourseDocumentTemplate;
use App\Models\CourseDocument;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class DocumentService
{
    /**
     * Generate PDF from template with variables
     * 
     * @param CourseDocumentTemplate $template
     * @param array $variables
     * @param array $options
     * @return array ['success' => bool, 'path' => string, 'url' => string]
     */
    public function generatePdfFromTemplate(CourseDocumentTemplate $template, array $variables = [], array $options = [])
    {
        try {
            // Render HTML with variables
            $html = $this->renderTemplate($template, $variables);
            
            // Generate PDF
            $pdf = Pdf::loadHTML($html);
            
            // Set PDF options
            $pdf->setPaper($options['paper'] ?? 'a4', $options['orientation'] ?? 'portrait');
            
            // Generate unique filename
            $fileName = $this->generateFileName($template, $options);
            $filePath = 'documents/' . $fileName;
            
            // Save PDF to storage
            $pdfContent = $pdf->output();
            Storage::disk('public')->put($filePath, $pdfContent);
            
            return [
                'success' => true,
                'path' => $filePath,
                'url' => asset('storage/' . $filePath),
                'size' => strlen($pdfContent),
                'name' => $fileName
            ];
            
        } catch (\Exception $e) {
            \Log::error('PDF Generation Error: ' . $e->getMessage(), [
                'template_id' => $template->id,
                'variables' => $variables
            ]);
            
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }
    
    /**
     * Render template HTML with variables and styling
     */
    private function renderTemplate(CourseDocumentTemplate $template, array $variables = []): string
    {
        $html = $template->content;
        
        // Replace variables
        foreach ($variables as $key => $value) {
            $placeholder = '{{' . $key . '}}';
            $html = str_replace($placeholder, $value, $html);
        }
        
        // Add logo if exists
        if ($template->logo_path) {
            $logoPath = Storage::disk('local')->path($template->logo_path);
            if (file_exists($logoPath)) {
                $logoData = base64_encode(file_get_contents($logoPath));
                $logoMime = mime_content_type($logoPath);
                $logoBase64 = "data:{$logoMime};base64,{$logoData}";
                
                // Replace logo placeholder
                $html = str_replace('{{logo}}', $logoBase64, $html);
            }
        }
        
        // Wrap in full HTML structure if not already
        if (!str_contains($html, '<html')) {
            $html = $this->wrapInHtmlStructure($html, $template);
        }
        
        return $html;
    }
    
    /**
     * Wrap content in full HTML structure
     */
    private function wrapInHtmlStructure(string $content, CourseDocumentTemplate $template): string
    {
        return "
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset='UTF-8'>
            <title>{$template->name}</title>
            <style>
                @page {
                    margin: 2cm;
                }
                body {
                    font-family: 'DejaVu Sans', Arial, sans-serif;
                    font-size: 12pt;
                    line-height: 1.6;
                    color: #333;
                }
                h1 {
                    color: #2c3e50;
                    text-align: center;
                    margin-bottom: 30px;
                    font-size: 24pt;
                }
                h2 {
                    color: #34495e;
                    margin-top: 20px;
                    font-size: 18pt;
                }
                .logo {
                    text-align: center;
                    margin-bottom: 30px;
                }
                .logo img {
                    max-width: 200px;
                    height: auto;
                }
                .certificate-border {
                    border: 3px solid #2c3e50;
                    padding: 40px;
                    margin: 20px;
                }
                .signature-line {
                    border-top: 2px solid #333;
                    width: 200px;
                    margin: 40px auto 5px;
                }
                .text-center {
                    text-align: center;
                }
                .text-right {
                    text-align: right;
                }
                .mt-4 {
                    margin-top: 40px;
                }
                .mb-4 {
                    margin-bottom: 40px;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 20px 0;
                }
                table th, table td {
                    border: 1px solid #ddd;
                    padding: 10px;
                    text-align: left;
                }
                table th {
                    background-color: #f8f9fa;
                    font-weight: bold;
                }
            </style>
        </head>
        <body>
            {$content}
        </body>
        </html>
        ";
    }
    
    /**
     * Generate unique filename for PDF
     */
    private function generateFileName(CourseDocumentTemplate $template, array $options = []): string
    {
        $prefix = $options['prefix'] ?? Str::slug($template->name);
        $timestamp = now()->format('Y-m-d_His');
        $random = Str::random(8);
        
        return "{$prefix}_{$timestamp}_{$random}.pdf";
    }
    
    /**
     * Create document from template for a course
     */
    public function createDocumentFromTemplate(
        string $entityUuid, 
        CourseDocumentTemplate $template, 
        array $variables, 
        array $documentData = [],
        string $modelClass = \App\Models\CourseDocument::class
    ) {
        // Generate PDF
        $pdfResult = $this->generatePdfFromTemplate($template, $variables);
        
        if (!$pdfResult['success']) {
            throw new \Exception('Failed to generate PDF: ' . $pdfResult['error']);
        }
        
        // Determine UUID field name based on model
        $isSessionDocument = $modelClass === \App\Models\SessionDocument::class;
        $uuidField = $isSessionDocument ? 'session_uuid' : 'course_uuid';
        $documentType = $isSessionDocument ? 
            \App\Models\SessionDocument::TYPE_TEMPLATE : 
            \App\Models\CourseDocument::TYPE_TEMPLATE;
        $audienceDefault = $isSessionDocument ?
            \App\Models\SessionDocument::AUDIENCE_STUDENTS :
            \App\Models\CourseDocument::AUDIENCE_STUDENTS;
        
        // Create document record
        $document = $modelClass::create([
            'uuid' => Str::uuid()->toString(),
            $uuidField => $entityUuid,
            'name' => $documentData['name'] ?? $template->name,
            'description' => $documentData['description'] ?? $template->description,
            'document_type' => $documentType,
            'template_id' => $template->id,
            'file_url' => $pdfResult['path'],
            'file_name' => $pdfResult['name'],
            'file_size' => $pdfResult['size'],
            'template_variables' => $variables,
            'is_generated' => true,
            'generated_at' => now(),
            'audience_type' => $documentData['audience_type'] ?? $audienceDefault,
            'is_certificate' => $documentData['is_certificate'] ?? false,
            'created_by' => auth()->id()
        ]);
        
        return $document;
    }
    
    /**
     * Regenerate document from template (update variables)
     */
    public function regenerateDocument(CourseDocument $document, array $newVariables = []): bool
    {
        if (!$document->isTemplateBased()) {
            throw new \Exception('Cannot regenerate non-template document');
        }
        
        $template = $document->template;
        if (!$template) {
            throw new \Exception('Template not found');
        }
        
        // Merge with existing variables if not replacing all
        $variables = empty($newVariables) ? $document->template_variables : array_merge($document->template_variables ?? [], $newVariables);
        
        // Delete old PDF file
        if ($document->file_url && Storage::disk('public')->exists($document->file_url)) {
            Storage::disk('public')->delete($document->file_url);
        }
        
        // Generate new PDF
        $pdfResult = $this->generatePdfFromTemplate($template, $variables);
        
        if (!$pdfResult['success']) {
            throw new \Exception('Failed to regenerate PDF: ' . $pdfResult['error']);
        }
        
        // Update document
        $document->update([
            'file_url' => $pdfResult['path'],
            'file_name' => $pdfResult['name'],
            'file_size' => $pdfResult['size'],
            'template_variables' => $variables,
            'generated_at' => now()
        ]);
        
        return true;
    }
    
    /**
     * Preview template HTML (without generating PDF)
     */
    public function previewTemplate(CourseDocumentTemplate $template, array $variables = []): string
    {
        return $this->renderTemplate($template, $variables);
    }
    
    /**
     * Validate template variables
     */
    public function validateVariables(CourseDocumentTemplate $template, array $variables): array
    {
        $errors = [];
        $templateFields = $template->fields ?? [];
        
        foreach ($templateFields as $field => $type) {
            if (!isset($variables[$field])) {
                $errors[$field] = "Variable '{$field}' is required";
            } else {
                // Type validation
                switch ($type) {
                    case 'email':
                        if (!filter_var($variables[$field], FILTER_VALIDATE_EMAIL)) {
                            $errors[$field] = "Invalid email format";
                        }
                        break;
                    case 'date':
                        if (!strtotime($variables[$field])) {
                            $errors[$field] = "Invalid date format";
                        }
                        break;
                    case 'number':
                        if (!is_numeric($variables[$field])) {
                            $errors[$field] = "Must be a number";
                        }
                        break;
                }
            }
        }
        
        return $errors;
    }
    
    /**
     * Get available variables from template content
     */
    public function extractTemplateVariables(string $content): array
    {
        preg_match_all('/\{\{([^}]+)\}\}/', $content, $matches);
        return array_unique($matches[1]);
    }
    
    /**
     * Clone template for customization
     */
    public function cloneTemplate(CourseDocumentTemplate $template, array $modifications = []): CourseDocumentTemplate
    {
        $newTemplate = $template->replicate();
        $newTemplate->name = $modifications['name'] ?? ($template->name . ' (Copy)');
        $newTemplate->created_by = auth()->id();
        
        if (isset($modifications['content'])) {
            $newTemplate->content = $modifications['content'];
        }
        
        if (isset($modifications['fields'])) {
            $newTemplate->fields = $modifications['fields'];
        }
        
        $newTemplate->save();
        
        return $newTemplate;
    }
    
    /**
     * Generate PDF from custom builder pages
     * 
     * @param array $customTemplate - Structure: ['pages' => [...], 'total_pages' => int]
     * @param array $options
     * @return array ['success' => bool, 'path' => string, 'url' => string]
     */
    public function generatePdfFromCustomBuilder(array $customTemplate, array $options = [])
    {
        try {
            // Get variables from options
            $variables = $options['variables'] ?? [];
            
            // Combine all pages into single HTML with variable replacement
            $html = $this->buildHtmlFromPages($customTemplate['pages'] ?? [], $variables);
            
            // Apply certificate background if provided
            if (isset($options['background_url']) && !empty($options['background_url'])) {
                $html = $this->wrapHtmlWithBackground($html, $options['background_url']);
            }
            
            // Generate PDF
            $pdf = Pdf::loadHTML($html);
            
            // Set PDF options (orientation: landscape for certificates, portrait by default)
            $pdf->setPaper($options['paper'] ?? 'a4', $options['orientation'] ?? 'portrait');
            $pdf->setOption('enable_remote', true);
            $pdf->setOption('isHtml5ParserEnabled', true);
            
            // Generate unique filename
            $fileName = $this->generateCustomBuilderFileName($options);
            $filePath = 'documents/' . $fileName;
            
            // Save PDF to storage
            $pdfContent = $pdf->output();
            Storage::disk('public')->put($filePath, $pdfContent);
            
            return [
                'success' => true,
                'path' => $filePath,
                'url' => asset('storage/' . $filePath),
                'size' => strlen($pdfContent),
                'name' => $fileName
            ];
            
        } catch (\Exception $e) {
            \Log::error('Custom Builder PDF Generation Error: ' . $e->getMessage(), [
                'custom_template' => $customTemplate,
                'options' => $options
            ]);
            
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }
    
    /**
     * Wrap HTML content with background image for certificates
     */
    private function wrapHtmlWithBackground(string $html, string $backgroundUrl): string
    {
        // Get full path to background image
        $backgroundImagePath = Storage::disk('public')->path($backgroundUrl);
        
        if (!file_exists($backgroundImagePath)) {
            \Log::warning('Certificate background image not found', ['path' => $backgroundImagePath]);
            return $html;
        }
        
        // Convert background image to base64
        $imageData = base64_encode(file_get_contents($backgroundImagePath));
        $imageMime = mime_content_type($backgroundImagePath);
        $base64Background = "data:{$imageMime};base64,{$imageData}";
        
        // Wrap HTML with background
        return "
            <div style='
                position: relative;
                width: 100%;
                min-height: 100vh;
                background-image: url({$base64Background});
                background-size: cover;
                background-position: center;
                background-repeat: no-repeat;
            '>
                <div style='position: relative; z-index: 1; padding: 40px;'>
                    {$html}
                </div>
            </div>
        ";
    }
    
    /**
     * Build HTML from custom builder pages with variable replacement
     */
    private function buildHtmlFromPages(array $pages, array $variables = []): string
    {
        $pagesHtml = '';
        
        foreach ($pages as $index => $page) {
            $pageNumber = $index + 1;
            $pageContent = $page['content'] ?? $page['html'] ?? '';
            
            // Replace variables in page content
            $pageContent = $this->replaceVariables($pageContent, $variables);
            
            // Add page break after each page except the last
            $pageBreak = ($index < count($pages) - 1) ? '<div style="page-break-after: always;"></div>' : '';
            
            $pagesHtml .= "
                <div class='custom-page' data-page='{$pageNumber}'>
                    {$pageContent}
                </div>
                {$pageBreak}
            ";
        }
        
        // Wrap in full HTML structure
        return "
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset='UTF-8'>
            <title>Custom Document</title>
            <style>
                @page {
                    margin: 2cm;
                }
                body {
                    font-family: 'DejaVu Sans', Arial, sans-serif;
                    font-size: 12pt;
                    line-height: 1.6;
                    color: #333;
                }
                h1, h2, h3, h4, h5, h6 {
                    color: #2c3e50;
                    margin-top: 20px;
                    margin-bottom: 10px;
                }
                h1 { font-size: 24pt; }
                h2 { font-size: 20pt; }
                h3 { font-size: 16pt; }
                p {
                    margin: 10px 0;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 20px 0;
                }
                table th, table td {
                    border: 1px solid #ddd;
                    padding: 10px;
                    text-align: left;
                }
                table th {
                    background-color: #f8f9fa;
                    font-weight: bold;
                }
                .text-center { text-align: center; }
                .text-right { text-align: right; }
                .custom-page {
                    min-height: 100%;
                }
            </style>
        </head>
        <body>
            {$pagesHtml}
        </body>
        </html>
        ";
    }
    
    /**
     * Generate filename for custom builder PDF
     */
    private function generateCustomBuilderFileName(array $options = []): string
    {
        $prefix = $options['prefix'] ?? 'custom-document';
        $timestamp = now()->format('Y-m-d_His');
        $random = Str::random(8);
        
        return "{$prefix}_{$timestamp}_{$random}.pdf";
    }
    
    /**
     * Create custom builder document with PDF generation
     */
    public function createCustomBuilderDocument(
        string $entityUuid,
        array $customTemplate,
        array $documentData = [],
        string $modelClass = \App\Models\CourseDocument::class
    ) {
        // Get variables
        $variables = $documentData['variables'] ?? [];
        
        // Prepare PDF generation options
        $pdfOptions = [
            'prefix' => Str::slug($documentData['name'] ?? 'document'),
            'variables' => $variables,
            'paper' => 'a4',
            'orientation' => $documentData['certificate_orientation'] ?? 'portrait'
        ];
        
        // Add background URL if certificate with background
        if (!empty($documentData['certificate_background_url'])) {
            $pdfOptions['background_url'] = $documentData['certificate_background_url'];
        }
        
        // Generate PDF from custom builder pages with variables
        $pdfResult = $this->generatePdfFromCustomBuilder($customTemplate, $pdfOptions);
        
        if (!$pdfResult['success']) {
            throw new \Exception('Failed to generate PDF: ' . $pdfResult['error']);
        }
        
        // Determine UUID field name based on model
        $isSessionDocument = $modelClass === \App\Models\SessionDocument::class;
        $uuidField = $isSessionDocument ? 'session_uuid' : 'course_uuid';
        $documentType = $isSessionDocument ? 
            \App\Models\SessionDocument::TYPE_CUSTOM_BUILDER : 
            \App\Models\CourseDocument::TYPE_CUSTOM_BUILDER;
        $audienceDefault = $isSessionDocument ?
            \App\Models\SessionDocument::AUDIENCE_STUDENTS :
            \App\Models\CourseDocument::AUDIENCE_STUDENTS;
        
        // Create document record
        $document = $modelClass::create([
            'uuid' => Str::uuid()->toString(),
            $uuidField => $entityUuid,
            'name' => $documentData['name'] ?? 'Custom Document',
            'description' => $documentData['description'] ?? null,
            'document_type' => $documentType,
            'custom_template' => $customTemplate,
            'questions' => $documentData['questions'] ?? null,
            'questionnaire_type' => $documentData['questionnaire_type'] ?? null,
            'template_variables' => $variables, // Save variables for regeneration
            'file_url' => $pdfResult['path'],
            'file_name' => $pdfResult['name'],
            'file_size' => $pdfResult['size'],
            'is_generated' => true,
            'generated_at' => now(),
            'audience_type' => $documentData['audience_type'] ?? $audienceDefault,
            'is_certificate' => $documentData['is_certificate'] ?? false,
            'certificate_background_url' => $documentData['certificate_background_url'] ?? null,
            'certificate_orientation' => $documentData['certificate_orientation'] ?? 'landscape',
            'is_questionnaire' => $documentData['is_questionnaire'] ?? !empty($documentData['questions']),
            'created_by' => auth()->id()
        ]);
        
        return $document;
    }
    
    /**
     * Replace variables in HTML content
     */
    private function replaceVariables(string $html, array $variables): string
    {
        foreach ($variables as $key => $value) {
            $placeholder = '{{' . $key . '}}';
            $html = str_replace($placeholder, $value ?? '', $html);
        }
        
        return $html;
    }
    
    /**
     * Extract default variables from course and organization
     */
    public function extractDefaultVariables(string $courseUuid): array
    {
        $variables = [];
        
        try {
            $course = \App\Models\Course::where('uuid', $courseUuid)->first();
            
            if ($course) {
                // Course variables
                $variables['course_name'] = $course->title ?? '';
                $variables['course_description'] = $course->description ?? '';
                $variables['course_duration'] = $course->duration ?? '';
                
                // Course dates (if available)
                if (isset($course->start_date) && $course->start_date) {
                    $variables['course_start_date'] = is_string($course->start_date) 
                        ? date('d/m/Y', strtotime($course->start_date))
                        : $course->start_date->format('d/m/Y');
                }
                if (isset($course->end_date) && $course->end_date) {
                    $variables['course_end_date'] = is_string($course->end_date)
                        ? date('d/m/Y', strtotime($course->end_date))
                        : $course->end_date->format('d/m/Y');
                }
                
                // Organization variables
                if ($course->organization_id) {
                    $organization = \App\Models\Organization::find($course->organization_id);
                    
                    if ($organization) {
                        $variables['organization_name'] = $organization->organization_name ?? 
                                                          $organization->company_name ?? 
                                                          ($organization->first_name . ' ' . $organization->last_name) ?? '';
                        $variables['entreprise_name'] = $organization->company_name ?? 
                                                        $organization->organization_name ?? '';
                        $variables['entreprise_siret'] = $organization->siret ?? '';
                        $variables['entreprise_address'] = $organization->address ?? '';
                    }
                }
            }
            
            // Date variables
            $now = now();
            $variables['current_date'] = $now->format('d/m/Y');
            $variables['current_date_short'] = $now->format('d/m/Y');
            $variables['current_year'] = $now->format('Y');
            
        } catch (\Exception $e) {
            \Log::warning('Failed to extract default variables: ' . $e->getMessage());
        }
        
        return $variables;
    }
}


