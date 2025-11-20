<?php

namespace App\Http\Controllers\Api\SuperAdmin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class InvoiceController extends Controller
{
    public function index(Request $request)
    {
        return response()->json([
            'success' => false,
            'message' => 'Not implemented yet'
        ], 501);
    }

    public function show($id)
    {
        return response()->json([
            'success' => false,
            'message' => 'Not implemented yet'
        ], 501);
    }

    public function generate(Request $request)
    {
        return response()->json([
            'success' => false,
            'message' => 'Not implemented yet'
        ], 501);
    }

    public function send(Request $request, $id)
    {
        return response()->json([
            'success' => false,
            'message' => 'Not implemented yet'
        ], 501);
    }
}
