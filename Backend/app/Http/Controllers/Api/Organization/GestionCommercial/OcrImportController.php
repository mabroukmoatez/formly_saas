<?php

namespace App\Http\Controllers\Api\Organization\GestionCommercial;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\Invoice;
use App\Models\Item;
use App\Models\Quote;
use App\Models\OcrDocument;
use App\Services\OcrService;
use App\Traits\ApiStatusTrait;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class OcrImportController extends Controller
{
    use ApiStatusTrait;

    protected $ocrService;
    protected $maxFileSize = 10485760; // 10MB in bytes

    public function __construct(OcrService $ocrService)
    {
        $this->ocrService = $ocrService;
    }

    private function getOrganizationId()
    {
        $user = Auth::user();
        // Use direct organization_id field, not relation
        if ($user->role == USER_ROLE_ORGANIZATION) return $user->organization_id ?? null;
        if ($user->role == USER_ROLE_INSTRUCTOR) return $user->instructor->organization_id ?? null;
        return null;
    }

    /**
     * Import and process invoice with OCR
     * POST /api/commercial/invoices/import-ocr
     */
    public function importInvoiceOcr(Request $request)
    {
        try {
            // Validate request
            $validator = Validator::make($request->all(), [
                'document' => 'required|file|mimes:pdf,png,jpg,jpeg|max:10240', // 10MB max
                'organization_id' => 'nullable|exists:organizations,id',
            ]);

            if ($validator->fails()) {
                return $this->failed(['errors' => $validator->errors()], 'Validation échouée: ' . $validator->errors()->first());
            }

            // Get organization ID
            $organization_id = $request->organization_id ?? $this->getOrganizationId();
            
            if (!$organization_id) {
                return $this->failed([], 'Organization ID requis');
            }

            // Verify organization belongs to user
            if (!$this->verifyOrganizationAccess($organization_id)) {
                return $this->failed([], 'Accès non autorisé à cette organisation');
            }

            // Check file size
            if ($request->file('document')->getSize() > $this->maxFileSize) {
                return $this->failed(['errors' => ['document' => ['Le fichier est trop volumineux (max 10MB)']]], 'OCR_003: Document trop volumineux');
            }

            // Store uploaded file temporarily
            $file = $request->file('document');
            $fileName = Str::uuid() . '.' . $file->getClientOriginalExtension();
            $filePath = $file->storeAs('ocr_uploads', $fileName, 'local');

            // Save document metadata
            $documentId = Str::uuid();
            $ocrDocument = OcrDocument::create([
                'id' => $documentId,
                'organization_id' => $organization_id,
                'original_filename' => $file->getClientOriginalName(),
                'file_path' => $filePath,
                'file_type' => $file->getMimeType(),
                'file_size' => $file->getSize(),
                'document_type' => 'invoice',
                'ocr_engine' => config('app.ocr_engine', 'tesseract'),
                'status' => 'processing',
            ]);

            // Process with OCR
            try {
                $result = $this->ocrService->processDocument($filePath, 'invoice');
                
                // Update document status
                $ocrDocument->update([
                    'status' => 'completed',
                    'extracted_data' => json_encode($result['extracted_data']),
                    'confidence_scores' => json_encode($result['confidence_scores']),
                ]);

                return $this->success([
                    'document_id' => $documentId,
                    'extracted_data' => $result['extracted_data'],
                    'confidence_scores' => $result['confidence_scores'],
                    'warnings' => $result['warnings'],
                ], 'Document traité avec succès');

            } catch (\Exception $e) {
                // Update document with error
                $ocrDocument->update([
                    'status' => 'failed',
                    'error_message' => $e->getMessage(),
                ]);

                Log::error('OCR processing failed: ' . $e->getMessage());
                
                return $this->failed([
                    'errors' => ['ocr' => [$e->getMessage()]]
                ], 'Erreur lors du traitement OCR: ' . $e->getMessage());
            }

        } catch (\Exception $e) {
            Log::error('Invoice OCR import failed: ' . $e->getMessage());
            return $this->failed([], 'Erreur lors de l\'import: ' . $e->getMessage());
        }
    }

    /**
     * Import and process quote with OCR
     * POST /api/commercial/quotes/import-ocr
     */
    public function importQuoteOcr(Request $request)
    {
        try {
            // Validate request
            $validator = Validator::make($request->all(), [
                'document' => 'required|file|mimes:pdf,png,jpg,jpeg|max:10240', // 10MB max
                'organization_id' => 'nullable|exists:organizations,id',
            ]);

            if ($validator->fails()) {
                return $this->failed(['errors' => $validator->errors()], 'Validation échouée: ' . $validator->errors()->first());
            }

            // Get organization ID
            $organization_id = $request->organization_id ?? $this->getOrganizationId();
            
            if (!$organization_id) {
                return $this->failed([], 'Organization ID requis');
            }

            // Verify organization belongs to user
            if (!$this->verifyOrganizationAccess($organization_id)) {
                return $this->failed([], 'Accès non autorisé à cette organisation');
            }

            // Check file size
            if ($request->file('document')->getSize() > $this->maxFileSize) {
                return $this->failed(['errors' => ['document' => ['Le fichier est trop volumineux (max 10MB)']]], 'OCR_003: Document trop volumineux');
            }

            // Store uploaded file temporarily
            $file = $request->file('document');
            $fileName = Str::uuid() . '.' . $file->getClientOriginalExtension();
            $filePath = $file->storeAs('ocr_uploads', $fileName, 'local');

            // Save document metadata
            $documentId = Str::uuid();
            $ocrDocument = OcrDocument::create([
                'id' => $documentId,
                'organization_id' => $organization_id,
                'original_filename' => $file->getClientOriginalName(),
                'file_path' => $filePath,
                'file_type' => $file->getMimeType(),
                'file_size' => $file->getSize(),
                'document_type' => 'quote',
                'ocr_engine' => config('app.ocr_engine', 'tesseract'),
                'status' => 'processing',
            ]);

            // Process with OCR
            try {
                $result = $this->ocrService->processDocument($filePath, 'quote');
                
                // Update document status
                $ocrDocument->update([
                    'status' => 'completed',
                    'extracted_data' => json_encode($result['extracted_data']),
                    'confidence_scores' => json_encode($result['confidence_scores']),
                ]);

                return $this->success([
                    'document_id' => $documentId,
                    'extracted_data' => $result['extracted_data'],
                    'confidence_scores' => $result['confidence_scores'],
                    'warnings' => $result['warnings'],
                ], 'Document traité avec succès');

            } catch (\Exception $e) {
                // Update document with error
                $ocrDocument->update([
                    'status' => 'failed',
                    'error_message' => $e->getMessage(),
                ]);

                Log::error('OCR processing failed: ' . $e->getMessage());
                
                return $this->failed([
                    'errors' => ['ocr' => [$e->getMessage()]]
                ], 'Erreur lors du traitement OCR: ' . $e->getMessage());
            }

        } catch (\Exception $e) {
            Log::error('Quote OCR import failed: ' . $e->getMessage());
            return $this->failed([], 'Erreur lors de l\'import: ' . $e->getMessage());
        }
    }

    /**
     * Match or create client from OCR data
     * POST /api/commercial/clients/match-or-create
     */
    public function matchOrCreateClient(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'organization_id' => 'required|exists:organizations,id',
                'client_data' => 'required|array',
                'client_data.name' => 'required|string',
            ]);

            if ($validator->fails()) {
                return $this->failed(['errors' => $validator->errors()], 'Validation échouée: ' . $validator->errors()->first());
            }

            $organization_id = $request->organization_id;
            $clientData = $request->client_data;

            // Verify organization access
            if (!$this->verifyOrganizationAccess($organization_id)) {
                return $this->failed([], 'Accès non autorisé à cette organisation');
            }

            // Try to find existing client
            $existingClient = null;

            // Priority 1: Match by SIRET (unique identifier)
            if (!empty($clientData['siret'])) {
                $existingClient = Client::where('organization_id', $organization_id)
                    ->where('siret', $clientData['siret'])
                    ->first();
            }

            // Priority 2: Match by email
            if (!$existingClient && !empty($clientData['email'])) {
                $existingClient = Client::where('organization_id', $organization_id)
                    ->where('email', $clientData['email'])
                    ->first();
            }

            // Priority 3: Fuzzy match by name + address
            if (!$existingClient && !empty($clientData['name']) && !empty($clientData['address'])) {
                $existingClient = $this->fuzzyMatchClient($organization_id, $clientData);
            }

            // If client found, return it
            if ($existingClient) {
                return $this->success([
                    'client_id' => $existingClient->id,
                    'existing' => true,
                    'client' => $existingClient,
                ], 'Client existant trouvé');
            }

            // Create new client
            $newClient = $this->createClientFromOcrData($organization_id, $clientData);

            return $this->success([
                'client_id' => $newClient->id,
                'existing' => false,
                'client' => $newClient,
            ], 'Nouveau client créé');

        } catch (\Exception $e) {
            Log::error('CLIENT_001: ' . $e->getMessage());
            return $this->failed([], 'CLIENT_001: Impossible de matcher ou créer le client: ' . $e->getMessage());
        }
    }

    /**
     * Match or create articles from OCR data
     * POST /api/commercial/articles/match-or-create
     */
    public function matchOrCreateArticles(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'organization_id' => 'required|exists:organizations,id',
                'articles' => 'required|array|min:1',
                'articles.*.description' => 'required|string',
                'articles.*.unit_price' => 'required|numeric|min:0',
                'articles.*.tax_rate' => 'required|numeric|min:0',
            ]);

            if ($validator->fails()) {
                return $this->failed(['errors' => $validator->errors()], 'Validation échouée: ' . $validator->errors()->first());
            }

            $organization_id = $request->organization_id;
            $articlesData = $request->articles;

            // Verify organization access
            if (!$this->verifyOrganizationAccess($organization_id)) {
                return $this->failed([], 'Accès non autorisé à cette organisation');
            }

            $result = [];

            foreach ($articlesData as $articleData) {
                // Try to find existing article by description (fuzzy matching)
                $existingArticle = $this->fuzzyMatchArticle($organization_id, $articleData);

                if ($existingArticle) {
                    $result[] = [
                        'article_id' => $existingArticle->id,
                        'existing' => true,
                        'article' => [
                            'id' => $existingArticle->id,
                            'name' => $existingArticle->designation,
                            'description' => $existingArticle->designation,
                            'unit_price' => $existingArticle->price_ht,
                            'tax_rate' => $existingArticle->tva,
                        ],
                    ];
                } else {
                    // Create new article
                    $newArticle = $this->createArticleFromOcrData($organization_id, $articleData);
                    
                    $result[] = [
                        'article_id' => $newArticle->id,
                        'existing' => false,
                        'article' => [
                            'id' => $newArticle->id,
                            'name' => $newArticle->designation,
                            'description' => $newArticle->designation,
                            'unit_price' => $newArticle->price_ht,
                            'tax_rate' => $newArticle->tva,
                        ],
                    ];
                }
            }

            return $this->success([
                'articles' => $result,
            ], 'Articles traités avec succès');

        } catch (\Exception $e) {
            Log::error('ARTICLE_001: ' . $e->getMessage());
            return $this->failed([], 'ARTICLE_001: Impossible de créer l\'article: ' . $e->getMessage());
        }
    }

    /**
     * Fuzzy match client by name and address
     */
    protected function fuzzyMatchClient($organization_id, $clientData)
    {
        $clients = Client::where('organization_id', $organization_id)->get();

        foreach ($clients as $client) {
            $nameMatch = $this->calculateSimilarity($clientData['name'] ?? '', $client->company_name ?? $client->getFullNameAttribute());
            $addressMatch = $this->calculateSimilarity($clientData['address'] ?? '', $client->address ?? '');

            // If both name and address match > 85%, consider it a match
            if ($nameMatch > 0.85 && $addressMatch > 0.75) {
                return $client;
            }
        }

        return null;
    }

    /**
     * Fuzzy match article by description
     */
    protected function fuzzyMatchArticle($organization_id, $articleData)
    {
        $items = Item::where('organization_id', $organization_id)->get();

        $bestMatch = null;
        $bestScore = 0;

        foreach ($items as $item) {
            $similarity = $this->calculateSimilarity($articleData['description'], $item->designation);

            // If similarity > 80%, consider it a potential match
            if ($similarity > 0.80) {
                // Check if price is also similar (within 20% range)
                $priceDiff = abs($item->price_ht - $articleData['unit_price']) / max($item->price_ht, $articleData['unit_price']);
                
                if ($priceDiff < 0.20) {
                    $combinedScore = $similarity * 0.7 + (1 - $priceDiff) * 0.3;
                    
                    if ($combinedScore > $bestScore) {
                        $bestScore = $combinedScore;
                        $bestMatch = $item;
                    }
                }
            }
        }

        return $bestScore > 0.75 ? $bestMatch : null;
    }

    /**
     * Calculate similarity between two strings
     */
    protected function calculateSimilarity($str1, $str2)
    {
        $str1 = strtolower(trim($str1));
        $str2 = strtolower(trim($str2));

        if (empty($str1) || empty($str2)) {
            return 0;
        }

        similar_text($str1, $str2, $percent);
        return $percent / 100;
    }

    /**
     * Create client from OCR data
     */
    protected function createClientFromOcrData($organization_id, $clientData)
    {
        // Parse name to determine if it's a company or individual
        $isCompany = !empty($clientData['siret']) || 
                     !empty($clientData['tva_number']) || 
                     $this->looksLikeCompanyName($clientData['name']);

        $data = [
            'organization_id' => $organization_id,
            'type' => $isCompany ? 'professional' : 'private',
            'email' => $clientData['email'] ?? null,
            'phone' => $clientData['phone'] ?? null,
            'address' => $clientData['address'] ?? null,
            'zip_code' => $clientData['postal_code'] ?? null,
            'city' => $clientData['city'] ?? null,
            'siret' => $clientData['siret'] ?? null,
        ];

        if ($isCompany) {
            $data['company_name'] = $clientData['name'];
        } else {
            // Try to split name into first and last name
            $nameParts = explode(' ', $clientData['name'], 2);
            $data['first_name'] = $nameParts[0] ?? $clientData['name'];
            $data['last_name'] = $nameParts[1] ?? '';
        }

        return Client::create($data);
    }

    /**
     * Check if name looks like a company name
     */
    protected function looksLikeCompanyName($name)
    {
        $companyIndicators = ['SARL', 'SAS', 'SA', 'EURL', 'SNC', 'Ltd', 'Inc', 'Corp', 'GmbH', 'AG'];
        
        foreach ($companyIndicators as $indicator) {
            if (stripos($name, $indicator) !== false) {
                return true;
            }
        }

        return false;
    }

    /**
     * Create article from OCR data
     */
    protected function createArticleFromOcrData($organization_id, $articleData)
    {
        $price_ht = $articleData['unit_price'];
        $tva = $articleData['tax_rate'];
        $price_ttc = $price_ht * (1 + $tva / 100);

        return Item::create([
            'organization_id' => $organization_id,
            'designation' => $articleData['description'],
            'category' => 'Service', // Default category
            'price_ht' => $price_ht,
            'tva' => $tva,
            'price_ttc' => $price_ttc,
            'reference' => 'ART-' . strtoupper(Str::random(8)),
        ]);
    }

    /**
     * Verify if user has access to organization
     */
    protected function verifyOrganizationAccess($organization_id)
    {
        $user = Auth::user();
        
        if ($user->role == USER_ROLE_ORGANIZATION) {
            return $user->organization->id == $organization_id;
        }
        
        if ($user->role == USER_ROLE_INSTRUCTOR) {
            return $user->instructor->organization_id == $organization_id;
        }

        return false;
    }
}

