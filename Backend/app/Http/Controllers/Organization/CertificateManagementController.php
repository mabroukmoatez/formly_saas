<?php

namespace App\Http\Controllers\Organization;

use App\Http\Controllers\Controller;
use App\Models\Certificate;
use App\Models\Organization;
use App\Traits\General;
use App\Traits\ImageGenerateFromHTML;
use App\Traits\ImageSaveTrait;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class CertificateManagementController extends Controller
{
    use General, ImageSaveTrait, ImageGenerateFromHTML;

    public function index()
    {
        if (!Auth::user()->can('organization_manage_certificate')) {
            abort('403');
        } // end permission checking

        $data['title'] = 'Certificate Management';
        $data['navCertificateManagementActiveClass'] = 'active';
        $data['subNavCertificateManagementIndexActiveClass'] = 'active';
        
        // Get organization - either user owns it or belongs to it
        $organization = Auth::user()->organization ?? Auth::user()->organizationBelongsTo;
        $data['certificates'] = Certificate::where('organization_id', $organization->id)
            ->paginate(25);
        
        return view('organization.certificate-management.index', $data);
    }

    public function create()
    {
        if (!Auth::user()->can('organization_create_certificate')) {
            abort('403');
        } // end permission checking

        $data['title'] = 'Create Certificate Template';
        $data['navCertificateManagementActiveClass'] = 'active';
        $data['subNavCertificateManagementCreateActiveClass'] = 'active';
        
        return view('organization.certificate-management.create', $data);
    }

    public function store(Request $request)
    {
        if (!Auth::user()->can('organization_create_certificate')) {
            abort('403');
        } // end permission checking

        // Get organization - either user owns it or belongs to it
        $organization = Auth::user()->organization ?? Auth::user()->organizationBelongsTo;
        
        // Check if organization can create more certificates
        if (!$organization->canCreateCertificates()) {
            $this->showToastrMessage('error', 'You have reached the maximum number of certificates for your plan');
            return redirect()->back();
        }

        $request->validate([
            'background_image' => 'nullable|mimes:jpg,png|file|dimensions:min_width=1030,min_height=734,max_width=1030,max_height=734',
            'role_1_signature' => 'nullable|mimes:png|file|dimensions:min_width=120,min_height=60,max_width=120,max_height=60',
        ]);

        $certificate = Certificate::where('status', CERTIFICATE_DRAFT)->where('organization_id', $organization->id)->first();
        if (is_null($certificate)) {
            $certificate = new Certificate();
            $certificate->uuid = Str::uuid()->toString();
            $certificate->certificate_number = rand(1000000, 9999999);
            $certificate->organization_id = $organization->id;
        }

        $certificate->fill($request->all());

        if ($request->hasFile('background_image')) {
            $certificate->image = $request->background_image ? $this->saveImage('certificate', $request->background_image, null, null) : null;
        }
        
        if ($request->hasFile('role_1_signature')) {
            $certificate->role_1_signature = $request->role_1_signature ? $this->saveImage('certificate', $request->role_1_signature, null, null) : null;
        }

        if (!$request->final_submit) {
            $certificate->status = CERTIFICATE_DRAFT;
        } else {
            $certificate->status = CERTIFICATE_VALID;
        }

        $certificate->save();

        if (!$request->final_submit) {
            $certificate = view('organization.certificate-management.view')->with(['certificate' => $certificate])->render();
            return response()->json(array('success' => true, 'certificate' => $certificate));
        }
        else{
            return response()->json(array('success' => true, 'view' => route('organization.certificate-management.edit', $certificate->uuid)));
        }
    }

    public function edit($uuid)
    {
        if (!Auth::user()->can('organization_manage_certificate')) {
            abort('403');
        } // end permission checking

        $data['title'] = 'Edit Certificate Template';
        $data['navCertificateManagementActiveClass'] = 'active';
        $data['subNavCertificateManagementCreateActiveClass'] = 'active';
        
        // Get organization - either user owns it or belongs to it
        $organization = Auth::user()->organization ?? Auth::user()->organizationBelongsTo;
        $data['certificate'] = Certificate::whereUuid($uuid)->where('organization_id', $organization->id)->first();
        
        if (!$data['certificate']) {
            $this->showToastrMessage('error', 'Certificate not found');
            return redirect()->route('organization.certificate-management.index');
        }
        
        return view('organization.certificate-management.edit', $data);
    }

    public function update(Request $request, $uuid)
    {
        if (!Auth::user()->can('organization_manage_certificate')) {
            abort('403');
        } // end permission checking

        // Get organization - either user owns it or belongs to it
        $organization = Auth::user()->organization ?? Auth::user()->organizationBelongsTo;
        $certificate = Certificate::whereUuid($uuid)->where('organization_id', $organization->id)->first();
        
        if (!$certificate) {
            $this->showToastrMessage('error', 'Certificate not found');
            return redirect()->route('organization.certificate-management.index');
        }

        $request->validate([
            'background_image' => 'nullable|mimes:jpg,png|file|dimensions:min_width=1030,min_height=734,max_width=1030,max_height=734',
            'role_1_signature' => 'nullable|mimes:png|file|dimensions:min_width=120,min_height=60,max_width=120,max_height=60',
        ]);

        $certificate->fill($request->all());

        if ($request->hasFile('background_image')) {
            $certificate->image = $request->background_image ? $this->saveImage('certificate', $request->background_image, null, null) : null;
        }
        
        if ($request->hasFile('role_1_signature')) {
            $certificate->role_1_signature = $request->role_1_signature ? $this->saveImage('certificate', $request->role_1_signature, null, null) : null;
        }

        if (!$request->final_submit) {
            $certificate->status = CERTIFICATE_DRAFT;
        } else {
            $certificate->status = CERTIFICATE_VALID;
        }

        $certificate->save();

        if (!$request->final_submit) {
            $certificate = view('organization.certificate-management.view')->with(['certificate' => $certificate])->render();
            return response()->json(array('success' => true, 'certificate' => $certificate));
        }
        else{
            return response()->json(array('success' => true, 'view' => route('organization.certificate-management.edit', $certificate->uuid)));
        }
    }

    public function destroy($id)
    {
        if (!Auth::user()->can('organization_delete_certificate')) {
            abort('403');
        } // end permission checking

        // Get organization - either user owns it or belongs to it
        $organization = Auth::user()->organization ?? Auth::user()->organizationBelongsTo;
        $certificate = Certificate::where('id', $id)->where('organization_id', $organization->id)->first();
        
        if (!$certificate) {
            $this->showToastrMessage('error', 'Certificate not found');
            return redirect()->back();
        }

        $certificate->delete();
        $this->showToastrMessage('success', 'Certificate deleted successfully');
        return redirect()->back();
    }

    public function preview($id)
    {
        if (!Auth::user()->can('organization_manage_certificate')) {
            abort('403');
        } // end permission checking

        // Get organization - either user owns it or belongs to it
        $organization = Auth::user()->organization ?? Auth::user()->organizationBelongsTo;
        $certificate = Certificate::where('id', $id)->where('organization_id', $organization->id)->first();
        
        if (!$certificate) {
            abort(404);
        }

        return view('organization.certificate-management.preview', compact('certificate'));
    }

    public function duplicate($id)
    {
        if (!Auth::user()->can('organization_create_certificate')) {
            abort('403');
        } // end permission checking

        // Get organization - either user owns it or belongs to it
        $organization = Auth::user()->organization ?? Auth::user()->organizationBelongsTo;
        $originalCertificate = Certificate::where('id', $id)->where('organization_id', $organization->id)->first();
        
        if (!$originalCertificate) {
            $this->showToastrMessage('error', 'Certificate not found');
            return redirect()->back();
        }

        if (!$organization->canCreateCertificates()) {
            $this->showToastrMessage('error', 'You have reached the maximum number of certificates for your plan');
            return redirect()->back();
        }

        $newCertificate = $originalCertificate->replicate();
        $newCertificate->uuid = Str::uuid()->toString();
        $newCertificate->certificate_number = rand(1000000, 9999999);
        $newCertificate->status = CERTIFICATE_DRAFT;
        $newCertificate->save();

        $this->showToastrMessage('success', 'Certificate duplicated successfully');
        return redirect()->route('organization.certificate-management.edit', $newCertificate->uuid);
    }
}