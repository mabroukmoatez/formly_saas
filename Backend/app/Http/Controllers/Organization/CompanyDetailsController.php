<?php

namespace App\Http\Controllers\Organization;

use App\Http\Controllers\Controller;
use App\Models\Organization;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class CompanyDetailsController extends Controller
{
    /**
     * Get organization company details
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

            $data = [
                'company_name' => $organization->company_name ?? $organization->organization_name,
                'legal_name' => $organization->legal_name,
                'address' => $organization->address,
                'address_complement' => $organization->address_complement,
                'zip_code' => $organization->zip_code ?? $organization->postal_code,
                'city' => $organization->city,
                'country' => $organization->country,
                'phone_fixed' => $organization->phone_fixed ?? $organization->phone,
                'phone_mobile' => $organization->phone_mobile ?? $organization->phone_number,
                'email' => $organization->email,
                'website' => $organization->website,
                'fax' => $organization->fax,
                'vat_number' => $organization->vat_number ?? $organization->tva_number,
                'siret' => $organization->siret,
                'siren' => $organization->siren,
                'rcs' => $organization->rcs,
                'naf_code' => $organization->naf_code,
                'ape_code' => $organization->ape_code,
                'capital' => $organization->capital,
                'legal_form' => $organization->legal_form,
                'director_name' => $organization->director_name,
                'logo_url' => $organization->logo_url,
                'banks' => $organization->bankAccounts()->get()->map(function($bank) {
                    return [
                        'id' => $bank->id,
                        'bank_name' => $bank->bank_name,
                        'iban' => $bank->iban,
                        'bic_swift' => $bank->bic_swift,
                        'account_holder' => $bank->account_holder,
                        'is_default' => $bank->is_default
                    ];
                })
            ];

            return response()->json([
                'success' => true,
                'data' => $data
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching company details',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update organization company details
     */
    public function update(Request $request)
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
                'company_name' => 'nullable|string|max:255',
                'legal_name' => 'nullable|string|max:255',
                'address' => 'nullable|string|max:255',
                'address_complement' => 'nullable|string|max:255',
                'zip_code' => 'nullable|string|max:20',
                'city' => 'nullable|string|max:255',
                'country' => 'nullable|string|max:255',
                'phone_fixed' => 'nullable|string|max:20',
                'phone_mobile' => 'nullable|string|max:20',
                'email' => 'nullable|email|max:255',
                'website' => 'nullable|url|max:255',
                'fax' => 'nullable|string|max:20',
                'vat_number' => 'nullable|string|max:50',
                'siret' => 'nullable|string|max:50',
                'siren' => 'nullable|string|max:50',
                'rcs' => 'nullable|string|max:255',
                'naf_code' => 'nullable|string|max:10',
                'ape_code' => 'nullable|string|max:10',
                'capital' => 'nullable|numeric',
                'legal_form' => 'nullable|string|max:100',
                'director_name' => 'nullable|string|max:255',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }

            $organization->update($request->only([
                'company_name',
                'legal_name',
                'address',
                'address_complement',
                'zip_code',
                'city',
                'country',
                'phone_fixed',
                'phone_mobile',
                'email',
                'website',
                'fax',
                'vat_number',
                'siret',
                'siren',
                'rcs',
                'naf_code',
                'ape_code',
                'capital',
                'legal_form',
                'director_name'
            ]));

            return response()->json([
                'success' => true,
                'message' => 'Company details updated successfully',
                'data' => $organization
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error updating company details',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Upload company logo
     */
    public function uploadLogo(Request $request)
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
                'logo' => 'required|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Delete old logo if exists
            if ($organization->organization_logo && Storage::disk('public')->exists($organization->organization_logo)) {
                Storage::disk('public')->delete($organization->organization_logo);
            }

            // Upload new logo
            $logo = $request->file('logo');
            $logoName = 'organization_' . $organization->id . '_' . time() . '.' . $logo->getClientOriginalExtension();
            $logoPath = $logo->storeAs('uploads/organizations', $logoName, 'public');

            $organization->organization_logo = $logoPath;
            $organization->save();

            return response()->json([
                'success' => true,
                'message' => 'Logo uploaded successfully',
                'data' => [
                    'logo_url' => asset('storage/' . $logoPath)
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error uploading logo',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}

