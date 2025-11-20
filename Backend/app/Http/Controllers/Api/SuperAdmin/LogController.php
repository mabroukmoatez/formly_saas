<?php

namespace App\Http\Controllers\Api\SuperAdmin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class LogController extends Controller
{
    public function instance(Request $request, $instanceId)
    {
        return response()->json([
            'success' => false,
            'message' => 'Not implemented yet'
        ], 501);
    }

    public function search(Request $request)
    {
        return response()->json([
            'success' => false,
            'message' => 'Not implemented yet'
        ], 501);
    }
}
