<?php

namespace App\Http\Controllers\Api\Organization;

use App\Http\Controllers\Controller;
use App\Models\FormationPractice;
use Illuminate\Http\Request;

class FormationPracticeController extends Controller
{
    /**
     * Get all formation practices
     * GET /api/courses/formation-practices
     */
    public function index()
    {
        try {
            $practices = FormationPractice::where('is_active', true)
                ->orderBy('name', 'asc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $practices->map(function($practice) {
                    return [
                        'id' => $practice->id,
                        'code' => $practice->code,
                        'name' => $practice->name,
                        'description' => $practice->description,
                        'is_active' => $practice->is_active,
                    ];
                })
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching formation practices',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
