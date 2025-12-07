<?php

namespace App\Http\Controllers\Api\Organization\GestionCommercial;

use App\Http\Controllers\Controller;
use App\Models\Expense;
use App\Models\ExpenseDocument;
use App\Traits\ApiStatusTrait;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class ExpensesChargesController extends Controller
{
    use ApiStatusTrait;

    private function getOrganizationId()
    {
        $user = Auth::user();
        // Use direct organization_id field, not relation
        if ($user->role == USER_ROLE_ORGANIZATION) return $user->organization_id ?? null;
        if ($user->role == USER_ROLE_INSTRUCTOR) return $user->instructor->organization_id ?? null;
        return null;
    }

    public function index(Request $request)
    {
        $organization_id = $this->getOrganizationId();
        $query = Expense::where('organization_id', $organization_id)->with('course', 'session', 'documents');

        if ($request->filled('search')) $query->where('label', 'LIKE', '%' . $request->search . '%');
        if ($request->filled('date_from')) $query->whereDate('expense_date', '>=', $request->date_from);
        if ($request->filled('date_to')) $query->whereDate('expense_date', '<=', $request->date_to);
        if ($request->filled('category')) $query->where('category', $request->category);
        if ($request->filled('amount_min')) $query->where('amount', '>=', $request->amount_min);
        if ($request->filled('amount_max')) $query->where('amount', '<=', $request->amount_max);
        if ($request->filled('role')) $query->where('role', $request->role);
        if ($request->filled('contract_type')) $query->where('contract_type', $request->contract_type);

        $expenses = $query->latest('expense_date')->paginate(15);
        return $this->success($expenses);
    }

    public function statistics()
    {
        $organization_id = $this->getOrganizationId();
        $baseQuery = Expense::where('organization_id', $organization_id);

        $total_all = (clone $baseQuery)->sum('amount');
        $total_rh = (clone $baseQuery)->where('category', 'Moyens Humains')->sum('amount');
        $total_env = (clone $baseQuery)->where('category', 'Moyens Environnementaux')->sum('amount');

        return $this->success([
            'total' => (float) $total_all,
            'human_resources' => (float) $total_rh,
            'environmental' => (float) $total_env,
        ]);
    }
    
    public function store(Request $request)
    {
        $organization_id = $this->getOrganizationId();
        if (!$organization_id) {
            return $this->failed([], 'User is not associated with an organization.');
        }

        // Support flexible field names
        $label = $request->label ?? $request->description ?? $request->expense_type ?? 'Expense';
        $category = $request->category;
        $amount = $request->amount ?? 0;
        
        // Support date fields
        $expense_date = $request->payment_date ?? $request->expense_date ?? $request->date ?? now()->format('Y-m-d');

        // Build validation rules
        $rules = [
            'category' => 'required|in:Moyens Humains,Moyens Environnementaux',
            'label' => 'required|string|max:255',
            'amount' => 'required|numeric|min:0.01',
            'course_id' => 'nullable|exists:courses,id',
            'documents' => 'nullable|array',
            'documents.*' => 'file|mimes:pdf,jpg,jpeg,png|max:10240',
            'vendor' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
            'date' => 'nullable|date',
            'expense_date' => 'nullable|date',
            'payment_date' => 'nullable|date',
        ];

        // Conditional validation: role and contract_type are required for "Moyens Humains"
        if ($category === 'Moyens Humains') {
            $rules['role'] = 'required|string|max:255';
            $rules['contract_type'] = 'required|string|max:255';
        } else {
            $rules['role'] = 'nullable|string|max:255';
            $rules['contract_type'] = 'nullable|string|max:255';
        }

        // Validate with normalized data
        $validator = Validator::make([
            'category' => $category,
            'label' => $label,
            'amount' => $amount,
            'course_id' => $request->course_id,
            'role' => $request->role,
            'contract_type' => $request->contract_type,
            'documents' => $request->hasFile('documents') ? $request->file('documents') : null,
            'vendor' => $request->vendor,
            'notes' => $request->notes,
            'date' => $request->date,
            'expense_date' => $request->expense_date,
            'payment_date' => $request->payment_date,
        ], $rules, [
            'category.required' => 'La catégorie est requise',
            'category.in' => 'La catégorie doit être "Moyens Humains" ou "Moyens Environnementaux"',
            'label.required' => 'Le libellé est requis',
            'amount.required' => 'Le montant est requis',
            'amount.min' => 'Le montant doit être supérieur à 0',
            'role.required' => 'Le champ "Poste / Rôle" est requis pour la catégorie "Moyens Humains"',
            'contract_type.required' => 'Le champ "Type De Contrat" est requis pour la catégorie "Moyens Humains"',
            'course_id.exists' => 'La formation sélectionnée n\'existe pas',
            'documents.*.file' => 'Les documents doivent être des fichiers valides',
            'documents.*.mimes' => 'Les documents doivent être de type PDF, JPG, JPEG ou PNG',
            'documents.*.max' => 'Chaque document ne doit pas dépasser 10MB',
        ]);

        if ($validator->fails()) {
            $response = [
                'success' => false,
                'message' => 'Erreur de validation',
                'errors' => $validator->errors()
            ];
            return response()->json($response, 422);
        }

        DB::beginTransaction();
        try {
            $expense = Expense::create([
                'organization_id' => $organization_id,
                'category' => $category,
                'label' => $label,
                'amount' => $amount,
                'course_id' => $request->course_id,
                'role' => $category === 'Moyens Humains' ? $request->role : null,
                'contract_type' => $category === 'Moyens Humains' ? $request->contract_type : null,
                'expense_date' => $expense_date,
                'notes' => $request->notes,
                'vendor' => $request->vendor,
            ]);
            
            // Handle multi-upload of documents
            if ($request->hasFile('documents')) {
                foreach ($request->file('documents') as $file) {
                    // Store in charges/{expense_id}/ directory structure
                    $path = $file->store("charges/{$expense->id}", 'public');
                    $expense->documents()->create([
                        'file_path' => $path,
                        'original_name' => $file->getClientOriginalName(),
                        'file_size' => $file->getSize(),
                        'mime_type' => $file->getMimeType()
                    ]);
                }
            }
            
            DB::commit();
            
            // Load relationships for response
            $expense->load('documents', 'course');
            
            // Format response according to specification
            $response = [
                'charge' => [
                    'id' => $expense->id,
                    'organization_id' => $expense->organization_id,
                    'label' => $expense->label,
                    'amount' => (string) number_format($expense->amount, 2, '.', ''),
                    'category' => $expense->category,
                    'role' => $expense->role,
                    'contract_type' => $expense->contract_type,
                    'course_id' => $expense->course_id,
                    'date' => $expense->expense_date ? $expense->expense_date->format('Y-m-d') : null,
                    'expense_date' => $expense->expense_date ? $expense->expense_date->format('Y-m-d') : null,
                    'created_at' => $expense->created_at->toIso8601String(),
                    'updated_at' => $expense->updated_at->toIso8601String(),
                    'documents' => $expense->documents->map(function ($doc) {
                        return [
                            'id' => $doc->id,
                            'charge_id' => $doc->expense_id,
                            'file_path' => $doc->file_path,
                            'original_name' => $doc->original_name,
                            'file_size' => $doc->file_size,
                            'mime_type' => $doc->mime_type,
                            'created_at' => $doc->created_at->toIso8601String(),
                        ];
                    })->toArray(),
                    'course' => $expense->course ? [
                        'id' => $expense->course->id,
                        'title' => $expense->course->title,
                    ] : null,
                ]
            ];
            
            // Broadcast event
            event(new \App\Events\OrganizationEvent(
                'expense.created',
                'New Expense Created',
                'Dépense créée avec succès',
                $response,
                $organization_id
            ));
            
            return response()->json([
                'success' => true,
                'message' => 'Dépense créée avec succès',
                'data' => $response
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->error([], 'Failed to create expense: ' . $e->getMessage(), 500);
        }
    }

    public function show($id)
    {
        $organization_id = $this->getOrganizationId();
        $expense = Expense::where('id', $id)->where('organization_id', $organization_id)->with('course', 'session', 'documents')->first();
        if (!$expense) {
            return $this->failed([], 'Expense not found.');
        }
        return $this->success($expense);
    }

    public function update(Request $request, $id)
    {
        $organization_id = $this->getOrganizationId();
        $expense = Expense::where('id', $id)->where('organization_id', $organization_id)->first();
        if (!$expense) {
            return $this->failed([], 'Expense not found.');
        }
        
        // Build validation rules
        $rules = [
            'category' => 'sometimes|required|in:Moyens Humains,Moyens Environnementaux',
            'label' => 'sometimes|required|string|max:255',
            'amount' => 'sometimes|required|numeric|min:0.01',
            'course_id' => 'nullable|exists:courses,id',
            'documents_to_add.*' => 'sometimes|file|mimes:pdf,jpg,jpeg,png|max:10240',
            'documents_to_delete' => 'sometimes|array',
            'documents_to_delete.*' => 'integer|exists:expense_documents,id',
            'expense_date' => 'nullable|date',
            'payment_date' => 'nullable|date',
            'date' => 'nullable|date',
            'notes' => 'nullable|string',
            'vendor' => 'nullable|string|max:255',
        ];

        // Conditional validation: role and contract_type are required for "Moyens Humains"
        $category = $request->category ?? $expense->category;
        if ($category === 'Moyens Humains') {
            $rules['role'] = 'sometimes|required|string|max:255';
            $rules['contract_type'] = 'sometimes|required|string|max:255';
        } else {
            $rules['role'] = 'nullable|string|max:255';
            $rules['contract_type'] = 'nullable|string|max:255';
        }

        $validator = Validator::make($request->all(), $rules, [
            'category.required' => 'La catégorie est requise',
            'category.in' => 'La catégorie doit être "Moyens Humains" ou "Moyens Environnementaux"',
            'label.required' => 'Le libellé est requis',
            'amount.required' => 'Le montant est requis',
            'amount.min' => 'Le montant doit être supérieur à 0',
            'role.required' => 'Le champ "Poste / Rôle" est requis pour la catégorie "Moyens Humains"',
            'contract_type.required' => 'Le champ "Type De Contrat" est requis pour la catégorie "Moyens Humains"',
            'course_id.exists' => 'La formation sélectionnée n\'existe pas',
            'documents_to_add.*.file' => 'Les documents doivent être des fichiers valides',
            'documents_to_add.*.mimes' => 'Les documents doivent être de type PDF, JPG, JPEG ou PNG',
            'documents_to_add.*.max' => 'Chaque document ne doit pas dépasser 10MB',
        ]);

        if ($validator->fails()) {
            $response = [
                'success' => false,
                'message' => 'Erreur de validation',
                'errors' => $validator->errors()
            ];
            return response()->json($response, 422);
        }

        DB::beginTransaction();
        try {
            $updateData = $request->except(['documents_to_add', 'documents_to_delete', 'documents']);
            
            // Handle date fields
            if ($request->has('expense_date') || $request->has('payment_date') || $request->has('date')) {
                $updateData['expense_date'] = $request->expense_date ?? $request->payment_date ?? $request->date ?? $expense->expense_date;
            }
            
            // Ensure role and contract_type are null for "Moyens Environnementaux"
            if (isset($updateData['category']) && $updateData['category'] === 'Moyens Environnementaux') {
                $updateData['role'] = null;
                $updateData['contract_type'] = null;
            }
            
            $expense->update($updateData);
            
            if ($request->filled('documents_to_delete')) {
                $docsToDelete = ExpenseDocument::where('expense_id', $expense->id)->whereIn('id', $request->documents_to_delete)->get();
                foreach ($docsToDelete as $doc) {
                    Storage::disk('public')->delete($doc->file_path);
                    $doc->delete();
                }
            }
            
            if ($request->hasFile('documents_to_add')) {
                foreach ($request->file('documents_to_add') as $file) {
                    // Store in charges/{expense_id}/ directory structure
                    $path = $file->store("charges/{$expense->id}", 'public');
                    $expense->documents()->create([
                        'file_path' => $path,
                        'original_name' => $file->getClientOriginalName(),
                        'file_size' => $file->getSize(),
                        'mime_type' => $file->getMimeType()
                    ]);
                }
            }
            
            DB::commit();
            return $this->success($expense->fresh()->load('documents', 'course'), 'Dépense mise à jour avec succès.');
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->error([], 'Failed to update expense: ' . $e->getMessage(), 500);
        }
    }

    public function destroy($id)
    {
        $organization_id = $this->getOrganizationId();
        $expense = Expense::where('id', $id)->where('organization_id', $organization_id)->with('documents')->first();
        if (!$expense) {
            return $this->failed([], 'Expense not found.');
        }
        
        foreach ($expense->documents as $document) {
            Storage::disk('public')->delete($document->file_path);
        }
        $expense->delete();
        return $this->success([], 'Expense deleted successfully.');
    }

    public function bulkDestroy(Request $request)
    {
        $validator = Validator::make($request->all(), ['ids' => 'required|array', 'ids.*' => 'integer']);
        if ($validator->fails()) return $this->failed([], 'An array of IDs is required.');

        $organization_id = $this->getOrganizationId();
        $expenses = Expense::where('organization_id', $organization_id)->whereIn('id', $request->ids)->with('documents')->get();
        foreach ($expenses as $expense) {
            foreach ($expense->documents as $document) {
                Storage::disk('public')->delete($document->file_path);
            }
            $expense->delete();
        }
        return $this->success([], count($expenses) . ' expenses deleted successfully.');
    }

    /**
     * Create expense with document uploads
     */
    public function storeWithDocuments(Request $request)
    {
        $organization_id = $this->getOrganizationId();
        if (!$organization_id) {
            return $this->failed([], 'User is not associated with an organization.');
        }

        // Support flexible field names
        $label = $request->label ?? $request->description ?? $request->expense_type ?? 'Expense';
        $category = $request->category ?? 'Other';
        $amount = $request->amount ?? 0;

        // Validate with normalized data
        $validator = Validator::make([
            'category' => $category,
            'label' => $label,
            'amount' => $amount,
            'course_id' => $request->course_id,
            'documents' => $request->hasFile('file') ? [$request->file('file')] : $request->documents,
        ], [
            'category' => 'required|string|max:255',
            'label' => 'required|string|max:255',
            'amount' => 'required|numeric|min:0',
            'course_id' => 'nullable|exists:courses,id',
            'documents' => 'required|array',
            'documents.*' => 'file|mimes:pdf,jpg,jpeg,png,doc,docx,xlsx|max:10240',
        ]);

        if ($validator->fails()) {
            return $this->failed([], 'Validation failed: ' . $validator->errors()->first());
        }

        DB::beginTransaction();
        try {
            $expense_date = $request->payment_date ?? $request->expense_date ?? now()->format('Y-m-d');
            
            $expense = Expense::create([
                'organization_id' => $organization_id,
                'category' => $category,
                'label' => $label,
                'amount' => $amount,
                'course_id' => $request->course_id,
                'session_uuid' => $request->session_uuid,
                'role' => $request->role,
                'contract_type' => $request->contract_type,
                'expense_date' => $expense_date,
                'notes' => $request->notes,
                'vendor' => $request->vendor,
            ]);
            
            // Handle single file upload (from 'file' field) or multiple files (from 'documents' array)
            $files = $request->hasFile('file') ? [$request->file('file')] : $request->file('documents', []);
            
            $uploaded = [];
            foreach ($files as $file) {
                $path = $file->store('expense_documents', 'public');
                $document = $expense->documents()->create([
                    'file_path' => $path,
                    'original_name' => $file->getClientOriginalName(),
                    'file_size' => $file->getSize(),
                    'mime_type' => $file->getMimeType()
                ]);
                $uploaded[] = $document;
            }
            
            DB::commit();
            $response = $expense->load('documents', 'course')->toArray();
            if ($request->vendor) {
                $response['vendor'] = $request->vendor;
            }
            if ($request->notes) {
                $response['notes'] = $request->notes;
            }
            
            return $this->success($response, 'Expense created with documents successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->error([], 'Failed to create expense: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Upload documents for an existing expense
     */
    public function uploadDocuments(Request $request, $id)
    {
        $organization_id = $this->getOrganizationId();
        if (!$organization_id) {
            return $this->failed([], 'User is not associated with an organization.');
        }

        $expense = Expense::where('id', $id)
            ->where('organization_id', $organization_id)
            ->first();

        if (!$expense) {
            return $this->failed([], 'Expense not found.');
        }

        $validator = Validator::make($request->all(), [
            'documents' => 'required|array',
            'documents.*' => 'file|mimes:pdf,jpg,jpeg,png,doc,docx,xlsx|max:10240',
        ]);

        if ($validator->fails()) {
            return $this->failed([], 'Validation failed: ' . $validator->errors()->first());
        }

        try {
            $uploaded = [];
            
            foreach ($request->file('documents') as $file) {
                $path = $file->store('expense_documents', 'public');
                $document = $expense->documents()->create([
                    'file_path' => $path,
                    'original_name' => $file->getClientOriginalName(),
                    'file_size' => $file->getSize(),
                    'mime_type' => $file->getMimeType()
                ]);
                $uploaded[] = $document;
            }
            
            return $this->success([
                'uploaded' => $uploaded,
                'total' => count($uploaded)
            ], 'Documents uploaded successfully.');
        } catch (\Exception $e) {
            return $this->failed([], 'Failed to upload documents: ' . $e->getMessage());
        }
    }

    /**
     * Generate PDF for an expense
     */
    public function generatePDF($id)
    {
        $organization_id = $this->getOrganizationId();
        $expense = Expense::where('id', $id)
            ->where('organization_id', $organization_id)
            ->with('documents', 'course', 'organization')
            ->first();

        if (!$expense) {
            return $this->failed([], 'Expense not found.');
        }

        try {
            $pdf = Pdf::loadView('commercial.expense', [
                'expense' => $expense,
                'organization' => $expense->organization
            ]);

            return $pdf->download('expense_' . $expense->id . '_' . date('Y-m-d') . '.pdf');
        } catch (\Exception $e) {
            return $this->failed([], 'Failed to generate PDF: ' . $e->getMessage());
        }
    }

    /**
     * Get dashboard data with 3 main charts
     * GET /api/organization/expenses/dashboard
     */
    public function dashboard(Request $request)
    {
        $organization_id = $this->getOrganizationId();
        $baseQuery = Expense::where('organization_id', $organization_id);

        // Apply filters
        if ($request->filled('date_from')) {
            $baseQuery->whereDate('expense_date', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $baseQuery->whereDate('expense_date', '<=', $request->date_to);
        }
        if ($request->filled('category')) {
            $baseQuery->where('category', $request->category);
        }
        if ($request->filled('role')) {
            $baseQuery->where('role', $request->role);
        }
        if ($request->filled('contract_type')) {
            $baseQuery->where('contract_type', $request->contract_type);
        }

        // Chart 1: Expenses by Category (Pie/Donut Chart)
        $expensesByCategory = (clone $baseQuery)
            ->select('category', DB::raw('SUM(amount) as total'))
            ->groupBy('category')
            ->get()
            ->map(function ($item) {
                return [
                    'name' => $item->category,
                    'value' => (float) $item->total
                ];
            });

        // Chart 2: Monthly Evolution (Line Chart)
        $monthlyExpenses = (clone $baseQuery)
            ->select(
                DB::raw('YEAR(expense_date) as year'),
                DB::raw('MONTH(expense_date) as month'),
                DB::raw('SUM(amount) as total')
            )
            ->whereNotNull('expense_date')
            ->groupBy('year', 'month')
            ->orderBy('year')
            ->orderBy('month')
            ->get()
            ->map(function ($item) {
                return [
                    'month' => $item->year . '-' . str_pad($item->month, 2, '0', STR_PAD_LEFT),
                    'value' => (float) $item->total
                ];
            });

        // Chart 3: Expenses by Contract Type (Bar Chart)
        $expensesByContractType = (clone $baseQuery)
            ->whereNotNull('contract_type')
            ->select('contract_type', DB::raw('SUM(amount) as total'))
            ->groupBy('contract_type')
            ->get()
            ->map(function ($item) {
                return [
                    'name' => $item->contract_type,
                    'value' => (float) $item->total
                ];
            });

        // Summary Stats
        $totalExpenses = (clone $baseQuery)->sum('amount');
        $totalCount = (clone $baseQuery)->count();
        $averageExpense = $totalCount > 0 ? $totalExpenses / $totalCount : 0;

        // Top 5 Expenses
        $topExpenses = (clone $baseQuery)
            ->with('course', 'session')
            ->orderBy('amount', 'desc')
            ->limit(5)
            ->get();

        // Recent Expenses
        $recentExpenses = (clone $baseQuery)
            ->with('course', 'session', 'documents')
            ->orderBy('expense_date', 'desc')
            ->limit(10)
            ->get();

        return $this->success([
            'charts' => [
                'by_category' => $expensesByCategory,
                'monthly_evolution' => $monthlyExpenses,
                'by_contract_type' => $expensesByContractType,
            ],
            'summary' => [
                'total_expenses' => (float) $totalExpenses,
                'total_count' => $totalCount,
                'average_expense' => (float) $averageExpense,
            ],
            'top_expenses' => $topExpenses,
            'recent_expenses' => $recentExpenses,
        ]);
    }

    /**
     * Export expenses to Excel
     * GET /api/organization/expenses/export/excel
     */
    public function exportExcel(Request $request)
    {
        $organization_id = $this->getOrganizationId();
        $query = Expense::where('organization_id', $organization_id)
            ->with('course', 'session', 'documents');

        // Apply same filters as index
        if ($request->filled('search')) $query->where('label', 'LIKE', '%' . $request->search . '%');
        if ($request->filled('date_from')) $query->whereDate('expense_date', '>=', $request->date_from);
        if ($request->filled('date_to')) $query->whereDate('expense_date', '<=', $request->date_to);
        if ($request->filled('category')) $query->where('category', $request->category);
        if ($request->filled('role')) $query->where('role', $request->role);
        if ($request->filled('contract_type')) $query->where('contract_type', $request->contract_type);

        $expenses = $query->latest('expense_date')->get();

        try {
            return \Excel::download(
                new \App\Exports\ExpensesExport($expenses), 
                'expenses_' . date('Y-m-d_His') . '.xlsx'
            );
        } catch (\Exception $e) {
            return $this->failed([], 'Failed to export Excel: ' . $e->getMessage());
        }
    }

    /**
     * Export dashboard to PDF
     * GET /api/organization/expenses/export/dashboard-pdf
     */
    public function exportDashboardPDF(Request $request)
    {
        $organization_id = $this->getOrganizationId();
        
        // Get dashboard data
        $dashboardData = $this->dashboard($request)->getData()->data;
        
        // Get organization info
        $organization = \App\Models\Organization::find($organization_id);

        try {
            $pdf = Pdf::loadView('commercial.expense-dashboard', [
                'dashboard' => $dashboardData,
                'organization' => $organization,
                'filters' => $request->all(),
                'generated_at' => now()
            ]);

            $pdf->setPaper('a4', 'landscape');
            
            return $pdf->download('expense_dashboard_' . date('Y-m-d') . '.pdf');
        } catch (\Exception $e) {
            return $this->failed([], 'Failed to generate dashboard PDF: ' . $e->getMessage());
        }
    }
}

