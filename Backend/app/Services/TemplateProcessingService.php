<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;

class TemplateProcessingService
{
    /**
     * Process template with variables
     *
     * @param string $template
     * @param array $variables
     * @return string
     */
    public function processTemplate($template, $variables)
    {
        try {
            $processedTemplate = $template;
            
            // Replace variables in templates
            foreach ($variables as $key => $value) {
                $placeholder = '{{' . $key . '}}';
                $processedTemplate = str_replace($placeholder, $value, $processedTemplate);
            }

            // Handle conditional logic
            $processedTemplate = $this->processConditionalLogic($processedTemplate, $variables);

            return $processedTemplate;

        } catch (\Exception $e) {
            Log::error('Template processing failed: ' . $e->getMessage());
            return $template;
        }
    }

    /**
     * Extract available placeholders
     *
     * @param string $template
     * @return array
     */
    public function extractPlaceholders($template)
    {
        preg_match_all('/\{\{([^}]+)\}\}/', $template, $matches);
        return array_unique($matches[1]);
    }

    /**
     * Process conditional logic in template
     *
     * @param string $template
     * @param array $variables
     * @return string
     */
    private function processConditionalLogic($template, $variables)
    {
        // Simple conditional logic processing
        // Example: {{#if variable_name}}content{{/if}}
        $pattern = '/\{\{#if\s+([^}]+)\}\}(.*?)\{\{\/if\}\}/s';
        
        return preg_replace_callback($pattern, function($matches) use ($variables) {
            $condition = trim($matches[1]);
            $content = $matches[2];
            
            // Check if condition is true
            if ($this->evaluateCondition($condition, $variables)) {
                return $content;
            }
            
            return '';
        }, $template);
    }

    /**
     * Evaluate condition
     *
     * @param string $condition
     * @param array $variables
     * @return bool
     */
    private function evaluateCondition($condition, $variables)
    {
        // Simple condition evaluation
        // This can be extended to support complex logic
        
        // Check if variable exists and is truthy
        if (isset($variables[$condition])) {
            return !empty($variables[$condition]);
        }
        
        return false;
    }

    /**
     * Validate template syntax
     *
     * @param string $template
     * @return array
     */
    public function validateTemplate($template)
    {
        $errors = [];
        
        // Check for unmatched conditionals
        $ifCount = preg_match_all('/\{\{#if\s+[^}]+\}\}/', $template);
        $endifCount = preg_match_all('/\{\{\/if\}\}/', $template);
        
        if ($ifCount !== $endifCount) {
            $errors[] = 'Unmatched conditional statements';
        }
        
        // Check for malformed placeholders
        $malformedPlaceholders = preg_match_all('/\{\{[^}]*$/', $template);
        if ($malformedPlaceholders > 0) {
            $errors[] = 'Malformed placeholders found';
        }
        
        return [
            'valid' => empty($errors),
            'errors' => $errors
        ];
    }

    /**
     * Get template preview with sample data
     *
     * @param string $template
     * @param array $sampleData
     * @return string
     */
    public function getTemplatePreview($template, $sampleData = [])
    {
        $defaultSampleData = [
            'student_name' => 'John Doe',
            'course_name' => 'Sample Course',
            'instructor_name' => 'Jane Smith',
            'organization_name' => 'Sample Organization',
            'date' => date('Y-m-d'),
            'time' => date('H:i:s')
        ];
        
        $sampleData = array_merge($defaultSampleData, $sampleData);
        
        return $this->processTemplate($template, $sampleData);
    }
}
