<?php

namespace App\Http\Controllers\Api\SuperAdmin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class MarginSimulatorController extends Controller
{
    public function calculate(Request $request)
    {
        return response()->json([
            'success' => false,
            'message' => 'Not implemented yet'
        ], 501);
    }
}
