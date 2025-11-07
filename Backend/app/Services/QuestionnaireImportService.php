<?php

namespace App\Services;

use App\Models\CourseQuestionnaire;
use App\Models\QuestionnaireQuestion;
use App\Models\QuestionnaireTemplate;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class QuestionnaireImportService
{
    /**
     * Import questionnaire from CSV file
     *
     * @param \Illuminate\Http\UploadedFile $file
     * @param string $questionnaireId
     * @param array $settings
     * @return array
     */
    public function importFromCSV($file, $questionnaireId, $settings = [])
    {
        try {
            // 1. Parse CSV file
            $csvData = $this->parseCSVFile($file);
            
            // 2. Validate CSV structure
            $validation = $this->validateCSVStructure($csvData);
            if (!$validation['valid']) {
                throw new \Exception('CSV validation failed: ' . implode(', ', $validation['errors']));
            }

            // 3. Create questions in database
            $questions = $this->createQuestionsFromCSV($csvData, $questionnaireId, $settings);

            // 4. Handle different question types
            $this->processQuestionTypes($questions);

            // 5. Return import results
            return [
                'success' => true,
                'questions_created' => count($questions),
                'questions' => $questions,
                'message' => 'Successfully imported ' . count($questions) . ' questions'
            ];

        } catch (\Exception $e) {
            Log::error('CSV import failed: ' . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Validate CSV structure
     *
     * @param array $csvData
     * @return array
     */
    public function validateCSVStructure($csvData)
    {
        $errors = [];
        $requiredColumns = ['question', 'type', 'order_index'];

        if (empty($csvData)) {
            $errors[] = 'CSV file is empty';
            return ['valid' => false, 'errors' => $errors];
        }

        // Check if required columns exist
        $headers = array_keys($csvData[0]);
        foreach ($requiredColumns as $column) {
            if (!in_array($column, $headers)) {
                $errors[] = "Required column '{$column}' is missing";
            }
        }

        // Validate each row
        foreach ($csvData as $index => $row) {
            $rowNumber = $index + 1;
            
            if (empty($row['question'])) {
                $errors[] = "Row {$rowNumber}: Question text is required";
            }

            if (empty($row['type'])) {
                $errors[] = "Row {$rowNumber}: Question type is required";
            }

            $validTypes = ['text', 'textarea', 'radio', 'checkbox', 'select', 'rating', 'date', 'file'];
            if (!in_array($row['type'], $validTypes)) {
                $errors[] = "Row {$rowNumber}: Invalid question type '{$row['type']}'";
            }

            // Validate options for choice-based questions
            if (in_array($row['type'], ['radio', 'checkbox', 'select']) && empty($row['options'])) {
                $errors[] = "Row {$rowNumber}: Options are required for {$row['type']} questions";
            }
        }

        return [
            'valid' => empty($errors),
            'errors' => $errors
        ];
    }

    /**
     * Generate CSV template for import
     *
     * @return string
     */
    public function generateImportTemplate()
    {
        $templateData = [
            [
                'question' => 'What is your name?',
                'type' => 'text',
                'order_index' => 1,
                'options' => '',
                'required' => 'true',
                'description' => 'Enter your full name'
            ],
            [
                'question' => 'How satisfied are you with the course?',
                'type' => 'radio',
                'order_index' => 2,
                'options' => 'Very Satisfied,Satisfied,Neutral,Dissatisfied,Very Dissatisfied',
                'required' => 'true',
                'description' => 'Rate your satisfaction level'
            ],
            [
                'question' => 'What topics would you like to learn more about?',
                'type' => 'checkbox',
                'order_index' => 3,
                'options' => 'Advanced Topics,Practical Examples,Case Studies,Additional Resources',
                'required' => 'false',
                'description' => 'Select all that apply'
            ],
            [
                'question' => 'Please provide additional feedback',
                'type' => 'textarea',
                'order_index' => 4,
                'options' => '',
                'required' => 'false',
                'description' => 'Any additional comments or suggestions'
            ]
        ];

        $filename = 'questionnaire_import_template_' . date('Y-m-d') . '.csv';
        $filePath = storage_path('app/public/templates/' . $filename);

        // Ensure directory exists
        if (!file_exists(dirname($filePath))) {
            mkdir(dirname($filePath), 0755, true);
        }

        $file = fopen($filePath, 'w');
        
        // Write headers
        fputcsv($file, array_keys($templateData[0]));
        
        // Write data
        foreach ($templateData as $row) {
            fputcsv($file, $row);
        }
        
        fclose($file);

        return $filePath;
    }

    /**
     * Parse CSV file
     *
     * @param \Illuminate\Http\UploadedFile $file
     * @return array
     */
    private function parseCSVFile($file)
    {
        $csvData = [];
        $handle = fopen($file->getPathname(), 'r');
        
        if ($handle !== false) {
            $headers = fgetcsv($handle);
            
            while (($data = fgetcsv($handle)) !== false) {
                $csvData[] = array_combine($headers, $data);
            }
            
            fclose($handle);
        }

        return $csvData;
    }

    /**
     * Create questions from CSV data
     *
     * @param array $csvData
     * @param string $questionnaireId
     * @param array $settings
     * @return array
     */
    private function createQuestionsFromCSV($csvData, $questionnaireId, $settings)
    {
        $questions = [];

        foreach ($csvData as $row) {
            $questionData = [
                'questionnaire_id' => $questionnaireId,
                'question' => $row['question'],
                'type' => $row['type'],
                'question_type' => $row['type'],
                'order_index' => (int) ($row['order_index'] ?? 1),
                'required' => filter_var($row['required'] ?? false, FILTER_VALIDATE_BOOLEAN),
                'is_required' => filter_var($row['required'] ?? false, FILTER_VALIDATE_BOOLEAN),
            ];

            // Handle options for choice-based questions
            if (in_array($row['type'], ['radio', 'checkbox', 'select']) && !empty($row['options'])) {
                $options = array_map('trim', explode(',', $row['options']));
                $questionData['options'] = $options;
            }

            // Handle validation rules
            if (!empty($row['validation_rules'])) {
                $questionData['validation_rules'] = json_decode($row['validation_rules'], true);
            }

            // Handle conditional logic
            if (!empty($row['conditional_logic'])) {
                $questionData['conditional_logic'] = json_decode($row['conditional_logic'], true);
            }

            $question = QuestionnaireQuestion::create($questionData);
            $questions[] = $question;
        }

        return $questions;
    }

    /**
     * Process different question types
     *
     * @param array $questions
     * @return void
     */
    private function processQuestionTypes($questions)
    {
        foreach ($questions as $question) {
            switch ($question->question_type) {
                case 'rating':
                    if (empty($question->options)) {
                        $question->update(['options' => ['1', '2', '3', '4', '5']]);
                    }
                    break;
                
                case 'date':
                    $question->update(['validation_rules' => ['date']]);
                    break;
                
                case 'file':
                    $question->update(['validation_rules' => ['file']]);
                    break;
            }
        }
    }

    /**
     * Export questionnaire to CSV
     *
     * @param string $questionnaireId
     * @return string
     */
    public function exportToCSV($questionnaireId)
    {
        try {
            $questionnaire = CourseQuestionnaire::where('uuid', $questionnaireId)->firstOrFail();
            $questions = $questionnaire->questions;

            $filename = 'questionnaire_export_' . $questionnaire->title . '_' . date('Y-m-d') . '.csv';
            $filePath = storage_path('app/public/exports/' . $filename);

            // Ensure directory exists
            if (!file_exists(dirname($filePath))) {
                mkdir(dirname($filePath), 0755, true);
            }

            $file = fopen($filePath, 'w');
            
            // Write headers
            fputcsv($file, [
                'question', 'type', 'order_index', 'options', 'required', 'description'
            ]);
            
            // Write data
            foreach ($questions as $question) {
                fputcsv($file, [
                    $question->question,
                    $question->question_type,
                    $question->order_index,
                    is_array($question->options) ? implode(',', $question->options) : '',
                    $question->is_required ? 'true' : 'false',
                    ''
                ]);
            }
            
            fclose($file);

            return $filePath;

        } catch (\Exception $e) {
            Log::error('CSV export failed: ' . $e->getMessage());
            throw new \Exception('Failed to export questionnaire: ' . $e->getMessage());
        }
    }

    /**
     * Create questionnaire from template
     *
     * @param int $templateId
     * @param string $courseUuid
     * @param array $customizations
     * @return array
     */
    public function createFromTemplate($templateId, $courseUuid, $customizations = [])
    {
        try {
            $template = QuestionnaireTemplate::findOrFail($templateId);
            
            if (!$template->is_active) {
                throw new \Exception('Template is not active');
            }

            // Create questionnaire
            $questionnaire = CourseQuestionnaire::create([
                'course_uuid' => $courseUuid,
                'title' => $customizations['title'] ?? $template->name,
                'description' => $customizations['description'] ?? $template->description,
                'category' => $template->category,
                'questionnaire_type' => $template->category,
                'target_audience' => $template->target_audience,
                'is_template' => false,
                'template_category' => $template->category,
                'import_source' => 'template',
                'is_active' => true
            ]);

            // Create questions from template
            $questions = [];
            foreach ($template->questions as $index => $questionData) {
                $question = QuestionnaireQuestion::create([
                    'questionnaire_id' => $questionnaire->uuid,
                    'question' => $questionData['question'],
                    'type' => $questionData['type'],
                    'question_type' => $questionData['type'],
                    'options' => $questionData['options'] ?? null,
                    'required' => $questionData['required'] ?? false,
                    'is_required' => $questionData['required'] ?? false,
                    'order_index' => $questionData['order_index'] ?? $index + 1,
                    'validation_rules' => $questionData['validation_rules'] ?? null,
                    'conditional_logic' => $questionData['conditional_logic'] ?? null
                ]);
                $questions[] = $question;
            }

            return [
                'success' => true,
                'questionnaire' => $questionnaire,
                'questions' => $questions,
                'message' => 'Successfully created questionnaire from template'
            ];

        } catch (\Exception $e) {
            Log::error('Template creation failed: ' . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }
}
