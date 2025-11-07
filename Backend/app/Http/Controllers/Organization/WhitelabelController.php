<?php

namespace App\Http\Controllers\Organization;

use App\Http\Controllers\Controller;
use App\Models\Organization;
use App\Traits\General;
use App\Traits\ImageSaveTrait;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class WhitelabelController extends Controller
{
    use General, ImageSaveTrait;

    public function index()
    {
        $data['title'] = 'Whitelabel Settings';
        $data['navWhitelabelActiveClass'] = 'active';
        // Get organization - either user owns it or belongs to it
        $data['organization'] = Auth::user()->organization ?? Auth::user()->organizationBelongsTo;
        
        return view('organization.whitelabel.index', $data);
    }

    public function update(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'organization_name' => 'required|string|max:255',
            'organization_tagline' => 'nullable|string|max:255',
            'organization_description' => 'nullable|string|max:1000',
            'primary_color' => 'required|regex:/^#[a-fA-F0-9]{6}$/',
            'secondary_color' => 'required|regex:/^#[a-fA-F0-9]{6}$/',
            'accent_color' => 'required|regex:/^#[a-fA-F0-9]{6}$/',
            'footer_text' => 'nullable|string|max:500',
            'custom_css' => 'nullable|string',
            'organization_logo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'organization_favicon' => 'nullable|image|mimes:ico,png|max:512',
        ]);

        if ($validator->fails()) {
            return redirect()->back()
                ->withErrors($validator)
                ->withInput();
        }

        // Get organization - either user owns it or belongs to it
        $organization = Auth::user()->organization ?? Auth::user()->organizationBelongsTo;
        
        if (!$organization) {
            $this->showToastrMessage('error', 'Organization not found');
            return redirect()->back();
        }

        // Handle logo upload
        if ($request->hasFile('organization_logo')) {
            $organization->organization_logo = $this->saveImage('organization_logo', 'uploads/organization/logos/', 300, 300);
        }

        // Handle favicon upload
        if ($request->hasFile('organization_favicon')) {
            $organization->organization_favicon = $this->saveImage('organization_favicon', 'uploads/organization/favicons/', 32, 32);
        }

        // Update organization data
        $organization->update([
            'organization_name' => $request->organization_name,
            'organization_tagline' => $request->organization_tagline,
            'organization_description' => $request->organization_description,
            'primary_color' => $request->primary_color,
            'secondary_color' => $request->secondary_color,
            'accent_color' => $request->accent_color,
            'footer_text' => $request->footer_text,
            'custom_css' => $request->custom_css,
            'whitelabel_enabled' => $request->has('whitelabel_enabled') ? 1 : 0,
        ]);

        $this->showToastrMessage('success', 'Whitelabel settings updated successfully');
        return redirect()->back();
    }

    public function preview()
    {
        $data['title'] = 'Whitelabel Preview';
        // Get organization - either user owns it or belongs to it
        $data['organization'] = Auth::user()->organization ?? Auth::user()->organizationBelongsTo;
        
        return view('organization.whitelabel.preview', $data);
    }

    public function reset()
    {
        // Get organization - either user owns it or belongs to it
        $organization = Auth::user()->organization ?? Auth::user()->organizationBelongsTo;
        
        if (!$organization) {
            $this->showToastrMessage('error', 'Organization not found');
            return redirect()->back();
        }

        // Reset to default values
        $organization->update([
            'organization_name' => null,
            'organization_tagline' => null,
            'organization_description' => null,
            'primary_color' => '#007bff',
            'secondary_color' => '#6c757d',
            'accent_color' => '#28a745',
            'footer_text' => null,
            'custom_css' => null,
            'whitelabel_enabled' => false,
        ]);

        $this->showToastrMessage('success', 'Whitelabel settings reset to default');
        return redirect()->back();
    }
}
