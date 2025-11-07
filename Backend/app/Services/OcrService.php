<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class OcrService
{
    protected $engine;
    protected $maxRetries = 3;
    protected $timeout = 30;

    public function __construct()
    {
        $this->engine = config('app.ocr_engine', 'tesseract');
    }

    /**
     * Process document with OCR and extract data
     * 
     * @param string $filePath Path to the uploaded file
     * @param string $documentType Type of document ('invoice' or 'quote')
     * @return array Extracted data with confidence scores
     */
    public function processDocument($filePath, $documentType = 'invoice')
    {
        $attempts = 0;
        $lastException = null;

        while ($attempts < $this->maxRetries) {
            try {
                $attempts++;
                
                // Extract text from document
                $extractedText = $this->extractText($filePath);
                
                if (empty($extractedText)) {
                    throw new \Exception('OCR_001: Document illisible ou qualité insuffisante');
                }

                // Parse the extracted text based on document type
                if ($documentType === 'invoice') {
                    $data = $this->parseInvoice($extractedText);
                } else {
                    $data = $this->parseQuote($extractedText);
                }

                return $data;

            } catch (\Exception $e) {
                $lastException = $e;
                Log::warning("OCR attempt {$attempts} failed: " . $e->getMessage());
                
                if ($attempts >= $this->maxRetries) {
                    throw new \Exception('OCR_005: Service OCR indisponible après ' . $this->maxRetries . ' tentatives');
                }
                
                sleep(2); // Wait before retry
            }
        }

        throw $lastException ?? new \Exception('OCR_004: Impossible d\'extraire les données essentielles');
    }

    /**
     * Extract text from document using configured OCR engine
     */
    protected function extractText($filePath)
    {
        $fullPath = Storage::path($filePath);
        
        switch ($this->engine) {
            case 'aws-textract':
                return $this->extractWithAwsTextract($fullPath);
            
            case 'google-vision':
                return $this->extractWithGoogleVision($fullPath);
            
            case 'tesseract':
            default:
                return $this->extractWithTesseract($fullPath);
        }
    }

    /**
     * Extract text using Tesseract OCR (free, open-source)
     */
    protected function extractWithTesseract($filePath)
    {
        // Check if file is PDF
        $fileExtension = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));
        
        if ($fileExtension === 'pdf') {
            // Convert PDF to images first
            $imagePath = $this->convertPdfToImage($filePath);
            $filePath = $imagePath;
        }

        // Tesseract command with French language support
        $command = "tesseract " . escapeshellarg($filePath) . " stdout -l fra 2>&1";
        $output = shell_exec($command);
        
        return $output ?? '';
    }

    /**
     * Extract text using AWS Textract (recommended for production)
     */
    protected function extractWithAwsTextract($filePath)
    {
        // This would require AWS SDK integration
        // For now, placeholder implementation
        throw new \Exception('AWS Textract integration not yet implemented. Please configure OCR_ENGINE=tesseract in .env');
    }

    /**
     * Extract text using Google Cloud Vision API
     */
    protected function extractWithGoogleVision($filePath)
    {
        // This would require Google Cloud SDK integration
        // For now, placeholder implementation
        throw new \Exception('Google Vision API integration not yet implemented. Please configure OCR_ENGINE=tesseract in .env');
    }

    /**
     * Convert PDF to image for OCR processing
     */
    protected function convertPdfToImage($pdfPath)
    {
        $outputPath = storage_path('app/temp/') . uniqid() . '.png';
        
        // Using ImageMagick or Ghostscript
        $command = "convert -density 300 " . escapeshellarg($pdfPath) . "[0] -quality 100 " . escapeshellarg($outputPath) . " 2>&1";
        shell_exec($command);
        
        if (!file_exists($outputPath)) {
            // Fallback: try with gs (Ghostscript)
            $command = "gs -sDEVICE=png16m -r300 -o " . escapeshellarg($outputPath) . " " . escapeshellarg($pdfPath) . " 2>&1";
            shell_exec($command);
        }
        
        if (!file_exists($outputPath)) {
            throw new \Exception('OCR_002: Impossible de convertir le PDF');
        }
        
        return $outputPath;
    }

    /**
     * Parse extracted text as an invoice
     */
    protected function parseInvoice($text)
    {
        $data = [
            'invoice_number' => $this->extractInvoiceNumber($text),
            'invoice_date' => $this->extractDate($text, 'invoice'),
            'due_date' => $this->extractDueDate($text),
            'client' => $this->extractClientInfo($text),
            'items' => $this->extractItems($text),
            'subtotal_ht' => 0,
            'total_tva' => 0,
            'total_ttc' => 0,
            'payment_terms' => $this->extractPaymentTerms($text),
            'notes' => $this->extractNotes($text),
        ];

        // Calculate totals
        $data = $this->calculateTotals($data);

        // Generate confidence scores
        $confidenceScores = [
            'overall' => $this->calculateOverallConfidence($data),
            'invoice_number' => empty($data['invoice_number']) ? 0.0 : 0.95,
            'client_info' => $this->calculateClientConfidence($data['client']),
            'items' => count($data['items']) > 0 ? 0.90 : 0.0,
            'totals' => $data['total_ttc'] > 0 ? 0.95 : 0.0,
        ];

        // Generate warnings
        $warnings = $this->generateWarnings($data, 'invoice');

        return [
            'extracted_data' => $data,
            'confidence_scores' => $confidenceScores,
            'warnings' => $warnings,
        ];
    }

    /**
     * Parse extracted text as a quote
     */
    protected function parseQuote($text)
    {
        $data = [
            'quote_number' => $this->extractQuoteNumber($text),
            'quote_date' => $this->extractDate($text, 'quote'),
            'valid_until' => $this->extractValidUntil($text),
            'client' => $this->extractClientInfo($text),
            'items' => $this->extractItems($text),
            'subtotal_ht' => 0,
            'total_tva' => 0,
            'total_ttc' => 0,
            'payment_terms' => $this->extractPaymentTerms($text),
            'validity_days' => 30,
            'notes' => $this->extractNotes($text),
        ];

        // Calculate totals
        $data = $this->calculateTotals($data);

        // Generate confidence scores
        $confidenceScores = [
            'overall' => $this->calculateOverallConfidence($data),
            'quote_number' => empty($data['quote_number']) ? 0.0 : 0.95,
            'client_info' => $this->calculateClientConfidence($data['client']),
            'items' => count($data['items']) > 0 ? 0.90 : 0.0,
            'totals' => $data['total_ttc'] > 0 ? 0.95 : 0.0,
        ];

        // Generate warnings
        $warnings = $this->generateWarnings($data, 'quote');

        return [
            'extracted_data' => $data,
            'confidence_scores' => $confidenceScores,
            'warnings' => $warnings,
        ];
    }

    /**
     * Extract invoice number from text
     */
    protected function extractInvoiceNumber($text)
    {
        $patterns = [
            '/(?:facture|invoice|n°|numéro|number)[\s:]*([A-Z0-9\-\/]+)/i',
            '/FAC[:\-\s]*([0-9\-\/]+)/i',
        ];

        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $text, $matches)) {
                return trim($matches[1]);
            }
        }

        return null;
    }

    /**
     * Extract quote number from text
     */
    protected function extractQuoteNumber($text)
    {
        $patterns = [
            '/(?:devis|quote|n°|numéro|number)[\s:]*([A-Z0-9\-\/]+)/i',
            '/DEV[:\-\s]*([0-9\-\/]+)/i',
        ];

        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $text, $matches)) {
                return trim($matches[1]);
            }
        }

        return null;
    }

    /**
     * Extract date from text
     */
    protected function extractDate($text, $type = 'invoice')
    {
        $patterns = [
            '/(?:date|du)[\s:]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i',
            '/(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i',
        ];

        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $text, $matches)) {
                return $this->normalizeDate($matches[1]);
            }
        }

        return date('Y-m-d');
    }

    /**
     * Extract due date from text
     */
    protected function extractDueDate($text)
    {
        $patterns = [
            '/(?:échéance|due date)[\s:]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i',
            '/(?:paiement avant|pay before)[\s:]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i',
        ];

        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $text, $matches)) {
                return $this->normalizeDate($matches[1]);
            }
        }

        // Default to 30 days from now
        return date('Y-m-d', strtotime('+30 days'));
    }

    /**
     * Extract valid until date for quotes
     */
    protected function extractValidUntil($text)
    {
        $patterns = [
            '/(?:valable jusqu\'au|valid until)[\s:]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i',
            '/(?:validité|validity)[\s:]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i',
        ];

        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $text, $matches)) {
                return $this->normalizeDate($matches[1]);
            }
        }

        // Default to 30 days from now
        return date('Y-m-d', strtotime('+30 days'));
    }

    /**
     * Normalize date format to Y-m-d
     */
    protected function normalizeDate($dateString)
    {
        // Try different date formats
        $formats = ['d/m/Y', 'd-m-Y', 'd.m.Y', 'Y-m-d', 'Y/m/d', 'd/m/y', 'd-m-y'];
        
        foreach ($formats as $format) {
            $date = \DateTime::createFromFormat($format, $dateString);
            if ($date !== false) {
                return $date->format('Y-m-d');
            }
        }

        return date('Y-m-d');
    }

    /**
     * Extract client information from text
     */
    protected function extractClientInfo($text)
    {
        $client = [
            'name' => null,
            'address' => null,
            'postal_code' => null,
            'city' => null,
            'email' => null,
            'phone' => null,
            'siret' => null,
            'tva_number' => null,
        ];

        // Extract email
        if (preg_match('/[\w\.\-]+@[\w\.\-]+\.\w+/', $text, $matches)) {
            $client['email'] = $matches[0];
        }

        // Extract phone
        if (preg_match('/(?:\+33|0)[1-9](?:[\s\.\-]?\d{2}){4}/', $text, $matches)) {
            $client['phone'] = preg_replace('/\s+/', '', $matches[0]);
        }

        // Extract SIRET
        if (preg_match('/(?:SIRET|Siret)[\s:]*(\d{14})/', $text, $matches)) {
            $client['siret'] = $matches[1];
        }

        // Extract TVA number
        if (preg_match('/(?:TVA|tva)[\s:]*([A-Z]{2}\d{11})/', $text, $matches)) {
            $client['tva_number'] = $matches[1];
        }

        // Extract postal code and city
        if (preg_match('/(\d{5})[\s]+([A-Z][a-zàâäéèêëïîôùûüÿæœç\s\-]+)/i', $text, $matches)) {
            $client['postal_code'] = $matches[1];
            $client['city'] = trim($matches[2]);
        }

        // Extract name (this is tricky, using heuristics)
        $lines = explode("\n", $text);
        foreach ($lines as $line) {
            $line = trim($line);
            // Look for lines that might be company/client names
            if (strlen($line) > 3 && strlen($line) < 100 && 
                !preg_match('/facture|invoice|devis|quote|date|total|tva/i', $line)) {
                if (empty($client['name']) && preg_match('/^[A-Z][a-zA-Z\s\.\-]+/', $line)) {
                    $client['name'] = $line;
                    break;
                }
            }
        }

        return $client;
    }

    /**
     * Extract line items from text
     */
    protected function extractItems($text)
    {
        $items = [];
        
        // This is a simplified parser - in production, use more sophisticated pattern matching
        $lines = explode("\n", $text);
        
        foreach ($lines as $line) {
            // Look for lines with quantities and prices
            if (preg_match('/(.+?)\s+(\d+)\s+(\d+[,\.]\d{2})\s+(\d+)%?\s+(\d+[,\.]\d{2})/', $line, $matches)) {
                $items[] = [
                    'description' => trim($matches[1]),
                    'quantity' => (int)$matches[2],
                    'unit_price' => (float)str_replace(',', '.', $matches[3]),
                    'tax_rate' => (float)$matches[4],
                    'total_ht' => (float)str_replace(',', '.', $matches[3]) * (int)$matches[2],
                    'total_ttc' => (float)str_replace(',', '.', $matches[5]),
                ];
            }
        }

        // If no items found, create a default item
        if (empty($items)) {
            $items[] = [
                'description' => 'Prestation de service',
                'quantity' => 1,
                'unit_price' => 0.00,
                'tax_rate' => 20.0,
                'total_ht' => 0.00,
                'total_ttc' => 0.00,
            ];
        }

        return $items;
    }

    /**
     * Extract payment terms from text
     */
    protected function extractPaymentTerms($text)
    {
        $patterns = [
            '/(?:paiement|payment)[\s:]*([^\n]+)/i',
            '/(?:conditions|terms)[\s:]*([^\n]+)/i',
        ];

        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $text, $matches)) {
                return trim($matches[1]);
            }
        }

        return 'Net 30 jours';
    }

    /**
     * Extract notes from text
     */
    protected function extractNotes($text)
    {
        $patterns = [
            '/(?:notes?|remarques?)[\s:]*([^\n]+)/i',
            '/(?:commentaires?)[\s:]*([^\n]+)/i',
        ];

        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $text, $matches)) {
                return trim($matches[1]);
            }
        }

        return null;
    }

    /**
     * Calculate totals for items
     */
    protected function calculateTotals($data)
    {
        $subtotal_ht = 0;
        $total_tva = 0;
        $total_ttc = 0;

        foreach ($data['items'] as $item) {
            $item_total_ht = $item['quantity'] * $item['unit_price'];
            $item_total_tva = $item_total_ht * ($item['tax_rate'] / 100);
            
            $subtotal_ht += $item_total_ht;
            $total_tva += $item_total_tva;
        }

        $total_ttc = $subtotal_ht + $total_tva;

        $data['subtotal_ht'] = round($subtotal_ht, 2);
        $data['total_tva'] = round($total_tva, 2);
        $data['total_ttc'] = round($total_ttc, 2);

        return $data;
    }

    /**
     * Calculate overall confidence score
     */
    protected function calculateOverallConfidence($data)
    {
        $scores = [];
        
        if (!empty($data['invoice_number'] ?? $data['quote_number'])) $scores[] = 0.95;
        if (!empty($data['client']['name'])) $scores[] = 0.90;
        if (!empty($data['client']['email']) || !empty($data['client']['phone'])) $scores[] = 0.85;
        if (count($data['items']) > 0) $scores[] = 0.90;
        if ($data['total_ttc'] > 0) $scores[] = 0.95;

        return count($scores) > 0 ? round(array_sum($scores) / count($scores), 2) : 0.5;
    }

    /**
     * Calculate client information confidence
     */
    protected function calculateClientConfidence($client)
    {
        $score = 0;
        $maxScore = 7;

        if (!empty($client['name'])) $score++;
        if (!empty($client['email'])) $score++;
        if (!empty($client['phone'])) $score++;
        if (!empty($client['address'])) $score++;
        if (!empty($client['postal_code'])) $score++;
        if (!empty($client['city'])) $score++;
        if (!empty($client['siret'])) $score++;

        return round($score / $maxScore, 2);
    }

    /**
     * Generate warnings based on extracted data
     */
    protected function generateWarnings($data, $type)
    {
        $warnings = [];

        $numberField = $type === 'invoice' ? 'invoice_number' : 'quote_number';
        if (empty($data[$numberField])) {
            $warnings[] = "Numéro de " . ($type === 'invoice' ? 'facture' : 'devis') . " non détecté";
        }

        if (empty($data['client']['name'])) {
            $warnings[] = "Nom du client non détecté";
        }

        if (empty($data['client']['email']) && empty($data['client']['phone'])) {
            $warnings[] = "Aucun contact client détecté (email ou téléphone)";
        }

        if (empty($data['client']['address']) || empty($data['client']['city'])) {
            $warnings[] = "Adresse client partiellement illisible";
        }

        if (count($data['items']) === 0) {
            $warnings[] = "Aucun article détecté dans le document";
        }

        foreach ($data['items'] as $index => $item) {
            if ($item['tax_rate'] <= 0) {
                $warnings[] = "Article " . ($index + 1) . ": TVA non détectée (valeur par défaut utilisée)";
            }
        }

        if ($data['total_ttc'] <= 0) {
            $warnings[] = "Total non détecté ou invalide";
        }

        return $warnings;
    }
}

