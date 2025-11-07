<?php

namespace App\Services;

use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use PhpOffice\PhpWord\PhpWord;
use PhpOffice\PhpWord\IOFactory;
use PhpOffice\PhpWord\TemplateProcessor;

class FileProcessingService
{
    /**
     * Process document template
     *
     * @param string $templatePath
     * @param array $variables
     * @param string $outputPath
     * @return bool
     */
    public function processDocumentTemplate($templatePath, $variables, $outputPath)
    {
        try {
            // Process document templates
            $templateProcessor = new TemplateProcessor($templatePath);
            
            // Replace variables
            foreach ($variables as $key => $value) {
                $templateProcessor->setValue($key, $value);
            }

            // Generate output file
            $templateProcessor->saveAs($outputPath);

            return true;

        } catch (\Exception $e) {
            Log::error('Document template processing failed: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Process CSV imports
     *
     * @param string $filePath
     * @param array $settings
     * @return array
     */
    public function processCSVImport($filePath, $settings)
    {
        try {
            // Process CSV imports
            $csvData = $this->parseCSVFile($filePath);
            
            // Validate data
            $validation = $this->validateCSVData($csvData, $settings);
            
            if (!$validation['valid']) {
                throw new \Exception('CSV validation failed: ' . implode(', ', $validation['errors']));
            }

            // Import to database
            $importedData = $this->importDataToDatabase($csvData, $settings);

            return [
                'success' => true,
                'imported_count' => count($importedData),
                'data' => $importedData
            ];

        } catch (\Exception $e) {
            Log::error('CSV import processing failed: ' . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Parse CSV file
     *
     * @param string $filePath
     * @return array
     */
    private function parseCSVFile($filePath)
    {
        $csvData = [];
        
        if (($handle = fopen($filePath, 'r')) !== false) {
            $headers = fgetcsv($handle);
            
            while (($data = fgetcsv($handle)) !== false) {
                $csvData[] = array_combine($headers, $data);
            }
            
            fclose($handle);
        }

        return $csvData;
    }

    /**
     * Validate CSV data
     *
     * @param array $csvData
     * @param array $settings
     * @return array
     */
    private function validateCSVData($csvData, $settings)
    {
        $errors = [];
        $requiredColumns = $settings['required_columns'] ?? [];

        if (empty($csvData)) {
            $errors[] = 'CSV file is empty';
            return ['valid' => false, 'errors' => $errors];
        }

        // Check required columns
        $headers = array_keys($csvData[0]);
        foreach ($requiredColumns as $column) {
            if (!in_array($column, $headers)) {
                $errors[] = "Required column '{$column}' is missing";
            }
        }

        // Validate each row
        foreach ($csvData as $index => $row) {
            $rowNumber = $index + 1;
            
            foreach ($requiredColumns as $column) {
                if (empty($row[$column])) {
                    $errors[] = "Row {$rowNumber}: {$column} is required";
                }
            }
        }

        return [
            'valid' => empty($errors),
            'errors' => $errors
        ];
    }

    /**
     * Import data to database
     *
     * @param array $csvData
     * @param array $settings
     * @return array
     */
    private function importDataToDatabase($csvData, $settings)
    {
        $importedData = [];
        $modelClass = $settings['model_class'] ?? null;

        if (!$modelClass) {
            throw new \Exception('Model class not specified');
        }

        foreach ($csvData as $row) {
            try {
                $model = new $modelClass();
                $fillableFields = $model->getFillable();
                
                $data = array_intersect_key($row, array_flip($fillableFields));
                $importedItem = $model::create($data);
                $importedData[] = $importedItem;
                
            } catch (\Exception $e) {
                Log::error('Failed to import row: ' . $e->getMessage(), $row);
            }
        }

        return $importedData;
    }

    /**
     * Generate file from template
     *
     * @param string $templateType
     * @param array $data
     * @param string $outputPath
     * @return bool
     */
    public function generateFileFromTemplate($templateType, $data, $outputPath)
    {
        try {
            switch ($templateType) {
                case 'word':
                    return $this->generateWordDocument($data, $outputPath);
                case 'pdf':
                    return $this->generatePDFDocument($data, $outputPath);
                case 'excel':
                    return $this->generateExcelDocument($data, $outputPath);
                default:
                    throw new \Exception("Unsupported template type: {$templateType}");
            }
        } catch (\Exception $e) {
            Log::error('File generation failed: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Generate Word document
     *
     * @param array $data
     * @param string $outputPath
     * @return bool
     */
    private function generateWordDocument($data, $outputPath)
    {
        try {
            $phpWord = new PhpWord();
            $section = $phpWord->addSection();

            foreach ($data as $key => $value) {
                $section->addText($key . ': ' . $value);
            }

            $objWriter = IOFactory::createWriter($phpWord, 'Word2007');
            $objWriter->save($outputPath);

            return true;
        } catch (\Exception $e) {
            Log::error('Word document generation failed: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Generate PDF document
     *
     * @param array $data
     * @param string $outputPath
     * @return bool
     */
    private function generatePDFDocument($data, $outputPath)
    {
        // This would typically use a PDF library like TCPDF or DomPDF
        // For now, we'll create a simple text file
        try {
            $content = '';
            foreach ($data as $key => $value) {
                $content .= $key . ': ' . $value . "\n";
            }

            file_put_contents($outputPath, $content);
            return true;
        } catch (\Exception $e) {
            Log::error('PDF document generation failed: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Generate Excel document
     *
     * @param array $data
     * @param string $outputPath
     * @return bool
     */
    private function generateExcelDocument($data, $outputPath)
    {
        // This would typically use PhpSpreadsheet
        // For now, we'll create a simple CSV file
        try {
            $file = fopen($outputPath, 'w');
            
            // Write headers
            fputcsv($file, array_keys($data));
            
            // Write data
            fputcsv($file, array_values($data));
            
            fclose($file);
            return true;
        } catch (\Exception $e) {
            Log::error('Excel document generation failed: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Validate file upload
     *
     * @param \Illuminate\Http\UploadedFile $file
     * @param array $rules
     * @return array
     */
    public function validateFileUpload($file, $rules = [])
    {
        $errors = [];
        
        // Default rules
        $defaultRules = [
            'max_size' => 10240, // 10MB
            'allowed_types' => ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'txt'],
            'max_dimensions' => [1920, 1080] // For images
        ];
        
        $rules = array_merge($defaultRules, $rules);

        // Check file size
        if ($file->getSize() > $rules['max_size'] * 1024) {
            $errors[] = 'File size exceeds maximum allowed size';
        }

        // Check file type
        $extension = strtolower($file->getClientOriginalExtension());
        if (!in_array($extension, $rules['allowed_types'])) {
            $errors[] = 'File type not allowed';
        }

        // Check for malicious content (basic check)
        if ($this->containsMaliciousContent($file)) {
            $errors[] = 'File contains potentially malicious content';
        }

        return [
            'valid' => empty($errors),
            'errors' => $errors
        ];
    }

    /**
     * Check for malicious content
     *
     * @param \Illuminate\Http\UploadedFile $file
     * @return bool
     */
    private function containsMaliciousContent($file)
    {
        // Basic malicious content detection
        $content = file_get_contents($file->getPathname());
        
        $maliciousPatterns = [
            '/<script/i',
            '/javascript:/i',
            '/vbscript:/i',
            '/onload=/i',
            '/onerror=/i'
        ];

        foreach ($maliciousPatterns as $pattern) {
            if (preg_match($pattern, $content)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Clean filename
     *
     * @param string $filename
     * @return string
     */
    public function cleanFilename($filename)
    {
        // Remove special characters and spaces
        $filename = preg_replace('/[^a-zA-Z0-9._-]/', '_', $filename);
        
        // Remove multiple underscores
        $filename = preg_replace('/_+/', '_', $filename);
        
        // Remove leading/trailing underscores
        $filename = trim($filename, '_');
        
        return $filename;
    }
}
