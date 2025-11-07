<?php

namespace App\Http\Controllers\Organization;

use App\Http\Controllers\Controller;
use App\Models\Currency;
use App\Models\Language;
use App\Models\Setting;
use App\Traits\General;
use App\Traits\ImageSaveTrait;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class OrganizationSettingsController extends Controller
{
    use General, ImageSaveTrait;

    public function index()
    {
        if (!Auth::user()->can('organization_manage_settings')) {
            abort('403');
        } // end permission checking

        $data['title'] = 'Organization Settings';
        $data['navOrganizationManagementActiveClass'] = 'active';
        $data['subNavSettingsActiveClass'] = 'active';
        // Get organization - either user owns it or belongs to it
        $data['organization'] = Auth::user()->organization ?? Auth::user()->organizationBelongsTo;
        
        return view('organization.settings.index', $data);
    }

    public function generalSettings()
    {
        $data['title'] = 'General Settings';
        $data['navOrganizationManagementActiveClass'] = 'active';
        $data['subNavGeneralSettingsActiveClass'] = 'active';
        // Get organization - either user owns it or belongs to it
        $data['organization'] = Auth::user()->organization ?? Auth::user()->organizationBelongsTo;
        $data['currencies'] = Currency::all();
        $data['current_currency'] = Currency::where('current_currency', 'on')->first();
        $data['languages'] = Language::all();
        $data['default_language'] = Language::where('default_language', 'on')->first();
        
        return view('organization.settings.general', $data);
    }

    public function updateGeneralSettings(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'organization_name' => 'nullable|string|max:255',
            'organization_tagline' => 'nullable|string|max:255',
            'organization_description' => 'nullable|string|max:1000',
            'footer_text' => 'nullable|string|max:500',
            'primary_color' => 'required|regex:/^#[a-fA-F0-9]{6}$/',
            'secondary_color' => 'required|regex:/^#[a-fA-F0-9]{6}$/',
            'accent_color' => 'required|regex:/^#[a-fA-F0-9]{6}$/',
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
            $organization->organization_logo = $this->saveImage('organization_logos', $request->file('organization_logo'), 300, 300);
        }

        // Handle favicon upload
        if ($request->hasFile('organization_favicon')) {
            $organization->organization_favicon = $this->saveImage('organization_favicons', $request->file('organization_favicon'), 32, 32);
        }

        // Update organization data
        $organization->update([
            'organization_name' => $request->organization_name,
            'organization_tagline' => $request->organization_tagline,
            'organization_description' => $request->organization_description,
            'footer_text' => $request->footer_text,
            'primary_color' => $request->primary_color,
            'secondary_color' => $request->secondary_color,
            'accent_color' => $request->accent_color,
            'whitelabel_enabled' => $request->has('whitelabel_enabled') ? 1 : 0,
        ]);

        $this->showToastrMessage('success', 'General settings updated successfully');
        return redirect()->back();
    }

    public function brandingSettings()
    {
        $data['title'] = 'Branding Settings';
        $data['navOrganizationManagementActiveClass'] = 'active';
        $data['subNavBrandingSettingsActiveClass'] = 'active';
        // Get organization - either user owns it or belongs to it
        $data['organization'] = Auth::user()->organization ?? Auth::user()->organizationBelongsTo;
        
        return view('organization.settings.branding', $data);
    }

    public function updateBrandingSettings(Request $request)
    {
        if (!Auth::user()->can('organization_manage_branding')) {
            abort('403');
        } // end permission checking

        $validator = Validator::make($request->all(), [
            'custom_domain' => 'nullable|string|max:255',
            'custom_css' => 'nullable|string',
            'organization_logo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'organization_favicon' => 'nullable|image|mimes:ico,png|max:512',
            'login_background_image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:5120',
            'organization_name' => 'nullable|string|max:255',
            'organization_tagline' => 'nullable|string|max:255',
            'organization_description' => 'nullable|string|max:1000',
            'primary_color' => 'required|regex:/^#[a-fA-F0-9]{6}$/',
            'secondary_color' => 'required|regex:/^#[a-fA-F0-9]{6}$/',
            'accent_color' => 'required|regex:/^#[a-fA-F0-9]{6}$/',
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
            $organization->organization_logo = $this->saveImage('organization_logos', $request->file('organization_logo'), 300, 300);
        }

        // Handle favicon upload
        if ($request->hasFile('organization_favicon')) {
            $organization->organization_favicon = $this->saveImage('organization_favicons', $request->file('organization_favicon'), 32, 32);
        }

        // Handle login background image upload
        if ($request->hasFile('login_background_image')) {
            $organization->login_background_image = $this->saveImage('organization_backgrounds', $request->file('login_background_image'), 1920, 1080);
        }

        // Update organization data
        $organization->update([
            'custom_domain' => $request->custom_domain,
            'custom_css' => $request->custom_css,
            'organization_name' => $request->organization_name,
            'organization_tagline' => $request->organization_tagline,
            'organization_description' => $request->organization_description,
            'primary_color' => $request->primary_color,
            'secondary_color' => $request->secondary_color,
            'accent_color' => $request->accent_color,
        ]);

        $this->showToastrMessage('success', 'Branding settings updated successfully');
        return redirect()->back();
    }

    public function subscriptionSettings()
    {
        $data['title'] = 'Subscription Settings';
        $data['navOrganizationManagementActiveClass'] = 'active';
        $data['subNavSubscriptionSettingsActiveClass'] = 'active';
        // Get organization - either user owns it or belongs to it
        $data['organization'] = Auth::user()->organization ?? Auth::user()->organizationBelongsTo;
        
        return view('organization.settings.subscription', $data);
    }

    public function updateSubscriptionSettings(Request $request)
    {
        if (!Auth::user()->can('organization_manage_subscription')) {
            abort('403');
        } // end permission checking

        $validator = Validator::make($request->all(), [
            'subscription_plan' => 'required|string|in:basic,professional,enterprise',
            'max_users' => 'required|integer|min:1|max:1000',
            'max_courses' => 'required|integer|min:1|max:10000',
            'max_certificates' => 'required|integer|min:1|max:1000',
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

        // Update subscription settings
        $organization->update([
            'subscription_plan' => $request->subscription_plan,
            'max_users' => $request->max_users,
            'max_courses' => $request->max_courses,
            'max_certificates' => $request->max_certificates,
        ]);

        $this->showToastrMessage('success', 'Subscription settings updated successfully');
        return redirect()->back();
    }

    public function previewSettings()
    {
        $data['title'] = 'Settings Preview';
        $data['navOrganizationManagementActiveClass'] = 'active';
        $data['subNavPreviewActiveClass'] = 'active';
        // Get organization - either user owns it or belongs to it
        $data['organization'] = Auth::user()->organization ?? Auth::user()->organizationBelongsTo;
        
        return view('organization.settings.preview', $data);
    }

    public function resetSettings()
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
            'custom_domain' => null,
            'whitelabel_enabled' => false,
        ]);

        $this->showToastrMessage('success', 'Settings reset to default');
        return redirect()->back();
    }
}
