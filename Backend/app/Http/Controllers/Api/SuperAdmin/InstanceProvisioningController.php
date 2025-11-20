<?php

namespace App\Http\Controllers\Api\SuperAdmin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class InstanceProvisioningController extends Controller
{
    public function provision(Request $request, $id)
    {
        return response()->json([
            'success' => false,
            'message' => 'Not implemented yet'
        ], 501);
    }
}
