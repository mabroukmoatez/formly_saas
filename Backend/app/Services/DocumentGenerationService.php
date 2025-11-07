<?php

namespace App\Services;

use App\Models\DocumentTemplate;
use App\Models\CourseDocument;
use App\Models\Course;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use PhpOffice\PhpWord\PhpWord;
use PhpOffice\PhpWord\IOFactory;
use PhpOffice\PhpWord\TemplateProcessor;

class DocumentGenerationService
{
    /**
     * Generate document from template with variables
     *
     * @param int $templateId
     * @param array $variables
     * @param string $courseUuid
     * @return array
     */
    public function generateDocumentFromTemplate($templateId, $variables, $courseUuid)
    {
        try {
            // 1. Get template file
            $template = DocumentTemplate::findOrFail($templateId);
            
            if (!$template->is_active) {
                throw new \Exception('Template is not active');
            }

            // 2. Validate variables
            $this->validateVariables($template->variables, $variables);

            // 3. Generate new document file
            $generatedFilePath = $this->processDocumentTemplate($template->file_path, $variables);

            // 4. Save to course documents
            $courseDocument = CourseDocument::create([
                'course_uuid' => $courseUuid,
                'name' => $template->name . ' - Generated',
                'description' => 'Generated from template: ' . $template->name,
                'category' => $template->category,
                'file_url' => $generatedFilePath,
                'file_name' => basename($generatedFilePath),
                'file_size' => Storage::size($generatedFilePath),
                'is_required' => false,
                'template_id' => $templateId,
                'template_variables' => $variables,
                'is_generated' => true,
                'generated_at' => now()
            ]);

            // 5. Return document info
            return [
                'success' => true,
                'document' => $courseDocument,
                'file_path' => $generatedFilePath,
                'download_url' => asset('storage/' . $generatedFilePath)
            ];

        } catch (\Exception $e) {
            Log::error('Document generation failed: ' . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Extract template variables from document
     *
     * @param string $templatePath
     * @return array
     */
    public function extractTemplateVariables($templatePath)
    {
        try {
            $templateProcessor = new TemplateProcessor($templatePath);
            $variables = $templateProcessor->getVariables();
            
            return array_map(function($var) {
                return [
                    'name' => $var,
                    'placeholder' => '{{' . $var . '}}',
                    'required' => true,
                    'description' => 'Variable: ' . $var
                ];
            }, $variables);

        } catch (\Exception $e) {
            Log::error('Template variable extraction failed: ' . $e->getMessage());
            return [];
        }
    }

    /**
     * Validate all required variables are provided
     *
     * @param array $templateVariables
     * @param array $providedVariables
     * @return bool
     */
    public function validateVariables($templateVariables, $providedVariables)
    {
        if (empty($templateVariables)) {
            return true;
        }

        $requiredVars = array_filter($templateVariables, function($var) {
            return isset($var['required']) && $var['required'];
        });

        foreach ($requiredVars as $var) {
            $varName = $var['name'] ?? $var;
            if (!isset($providedVariables[$varName]) || empty($providedVariables[$varName])) {
                throw new \Exception("Required variable '{$varName}' is missing or empty");
            }
        }

        return true;
    }

    /**
     * Process document template with variables
     *
     * @param string $templatePath
     * @param array $variables
     * @return string
     */
    private function processDocumentTemplate($templatePath, $variables)
    {
        try {
            $templateProcessor = new TemplateProcessor($templatePath);
            
            // Replace variables
            foreach ($variables as $key => $value) {
                $templateProcessor->setValue($key, $value);
            }

            // Generate unique filename
            $filename = 'generated_' . time() . '_' . uniqid() . '.docx';
            $outputPath = 'documents/generated/' . $filename;

            // Save processed document
            $templateProcessor->saveAs(storage_path('app/public/' . $outputPath));

            return $outputPath;

        } catch (\Exception $e) {
            Log::error('Document processing failed: ' . $e->getMessage());
            throw new \Exception('Failed to process document template: ' . $e->getMessage());
        }
    }

    /**
     * Regenerate document with new variables
     *
     * @param int $documentId
     * @param array $newVariables
     * @return array
     */
    public function regenerateDocument($documentId, $newVariables)
    {
        try {
            $document = CourseDocument::findOrFail($documentId);
            
            if (!$document->template_id) {
                throw new \Exception('Document is not generated from template');
            }

            // Generate new document with updated variables
            $result = $this->generateDocumentFromTemplate(
                $document->template_id,
                $newVariables,
                $document->course_uuid
            );

            if ($result['success']) {
                // Update existing document
                $document->update([
                    'template_variables' => $newVariables,
                    'file_url' => $result['file_path'],
                    'file_name' => basename($result['file_path']),
                    'file_size' => Storage::size($result['file_path']),
                    'generated_at' => now()
                ]);

                $result['document'] = $document;
            }

            return $result;

        } catch (\Exception $e) {
            Log::error('Document regeneration failed: ' . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Get available templates for course
     *
     * @param string $courseUuid
     * @param string $category
     * @return array
     */
    public function getAvailableTemplates($courseUuid, $category = null)
    {
        $query = DocumentTemplate::where('is_active', true);
        
        if ($category) {
            $query->where('category', $category);
        }

        $templates = $query->get();

        return $templates->map(function($template) {
            return [
                'id' => $template->id,
                'uuid' => $template->uuid,
                'name' => $template->name,
                'description' => $template->description,
                'category' => $template->category,
                'template_type' => $template->template_type,
                'variables' => $template->variables,
                'file_url' => $template->file_url
            ];
        });
    }
}
