<?php

namespace App\Http\Controllers\Organization;

use App\Http\Controllers\Controller;
use App\Models\BankAccount;
use App\Models\Organization;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class BankAccountController extends Controller
{
    /**
     * Get all bank accounts for the organization
     */
    public function index(Request $request)
    {
        try {
            $user = auth()->user();
            $organization = Organization::where('user_id', $user->id)->first();

            if (!$organization) {
                return response()->json([
                    'success' => false,
                    'message' => 'Organization not found'
                ], 404);
            }

            $bankAccounts = $organization->bankAccounts()->orderBy('is_default', 'desc')->get();

            return response()->json([
                'success' => true,
                'data' => $bankAccounts
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching bank accounts',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get a specific bank account
     */
    public function show($id)
    {
        try {
            $user = auth()->user();
            $organization = Organization::where('user_id', $user->id)->first();

            if (!$organization) {
                return response()->json([
                    'success' => false,
                    'message' => 'Organization not found'
                ], 404);
            }

            $bankAccount = BankAccount::where('id', $id)
                ->where('organization_id', $organization->id)
                ->first();

            if (!$bankAccount) {
                return response()->json([
                    'success' => false,
                    'message' => 'Bank account not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $bankAccount
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching bank account',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create a new bank account
     */
    public function store(Request $request)
    {
        try {
            $user = auth()->user();
            $organization = Organization::where('user_id', $user->id)->first();

            if (!$organization) {
                return response()->json([
                    'success' => false,
                    'message' => 'Organization not found'
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'bank_name' => 'required|string|max:255',
                'iban' => 'required|string|max:34',
                'bic_swift' => 'required|string|max:11',
                'account_holder' => 'required|string|max:255',
                'is_default' => 'boolean'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }

            $bankAccount = new BankAccount();
            $bankAccount->organization_id = $organization->id;
            $bankAccount->bank_name = $request->bank_name;
            $bankAccount->iban = $request->iban;
            $bankAccount->bic_swift = $request->bic_swift;
            $bankAccount->account_holder = $request->account_holder;
            $bankAccount->is_default = $request->is_default ?? false;
            $bankAccount->save();

            // If this is set as default, unset others
            if ($bankAccount->is_default) {
                $bankAccount->setAsDefault();
            }

            return response()->json([
                'success' => true,
                'message' => 'Bank account created successfully',
                'data' => $bankAccount
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error creating bank account',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update a bank account
     */
    public function update(Request $request, $id)
    {
        try {
            $user = auth()->user();
            $organization = Organization::where('user_id', $user->id)->first();

            if (!$organization) {
                return response()->json([
                    'success' => false,
                    'message' => 'Organization not found'
                ], 404);
            }

            $bankAccount = BankAccount::where('id', $id)
                ->where('organization_id', $organization->id)
                ->first();

            if (!$bankAccount) {
                return response()->json([
                    'success' => false,
                    'message' => 'Bank account not found'
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'bank_name' => 'sometimes|required|string|max:255',
                'iban' => 'sometimes|required|string|max:34',
                'bic_swift' => 'sometimes|required|string|max:11',
                'account_holder' => 'sometimes|required|string|max:255',
                'is_default' => 'boolean'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }

            $bankAccount->update($request->only([
                'bank_name',
                'iban',
                'bic_swift',
                'account_holder',
                'is_default'
            ]));

            // If this is set as default, unset others
            if ($request->has('is_default') && $request->is_default) {
                $bankAccount->setAsDefault();
            }

            return response()->json([
                'success' => true,
                'message' => 'Bank account updated successfully',
                'data' => $bankAccount
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error updating bank account',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a bank account
     */
    public function destroy($id)
    {
        try {
            $user = auth()->user();
            $organization = Organization::where('user_id', $user->id)->first();

            if (!$organization) {
                return response()->json([
                    'success' => false,
                    'message' => 'Organization not found'
                ], 404);
            }

            $bankAccount = BankAccount::where('id', $id)
                ->where('organization_id', $organization->id)
                ->first();

            if (!$bankAccount) {
                return response()->json([
                    'success' => false,
                    'message' => 'Bank account not found'
                ], 404);
            }

            // Check if this bank account is being used in any payment schedules
            $usageCount = $bankAccount->paymentSchedules()->count();
            
            if ($usageCount > 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot delete bank account. It is being used in ' . $usageCount . ' payment schedule(s).'
                ], 422);
            }

            $wasDefault = $bankAccount->is_default;
            $bankAccount->delete();

            // If the deleted account was default, set the first remaining account as default
            if ($wasDefault) {
                $firstAccount = $organization->bankAccounts()->first();
                if ($firstAccount) {
                    $firstAccount->setAsDefault();
                }
            }

            return response()->json([
                'success' => true,
                'message' => 'Bank account deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error deleting bank account',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}

