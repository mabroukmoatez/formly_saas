@extends('organization.settings.layout')

@section('settings-content')
<div class="preview-settings">
    <h5 class="mb-4">{{__('Settings Preview')}}</h5>
    
    <div class="row">
        <!-- Preview Panel -->
        <div class="col-lg-8">
            <div class="card mb-4">
                <div class="card-header">
                    <h6 class="mb-0">{{__('Live Preview')}}</h6>
                </div>
                <div class="card-body">
                    <!-- Mock Organization Dashboard Preview -->
                    <div class="preview-container" style="border: 1px solid #dee2e6; border-radius: 8px; overflow: hidden;">
                        <!-- Header Preview -->
                        <div class="preview-header" style="background-color: {{ $organization->primary_color }}; padding: 20px; color: white;">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    @if($organization->organization_logo)
                                        <img src="{{ asset($organization->organization_logo) }}" alt="Logo" style="height: 40px; margin-right: 15px;">
                                    @endif
                                    <h4 class="mb-0">{{ $organization->organization_name ?: 'Your Organization' }}</h4>
                                    @if($organization->organization_tagline)
                                        <p class="mb-0 opacity-75">{{ $organization->organization_tagline }}</p>
                                    @endif
                                </div>
                                <div>
                                    <span class="badge" style="background-color: {{ $organization->accent_color }};">{{ ucfirst($organization->subscription_plan) }}</span>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Navigation Preview -->
                        <div class="preview-nav" style="background-color: {{ $organization->secondary_color }}; padding: 10px 20px;">
                            <nav class="navbar navbar-expand-lg">
                                <div class="navbar-nav">
                                    <a class="nav-link text-white" href="#">{{__('Dashboard')}}</a>
                                    <a class="nav-link text-white" href="#">{{__('Courses')}}</a>
                                    <a class="nav-link text-white" href="#">{{__('Users')}}</a>
                                    <a class="nav-link text-white" href="#">{{__('Certificates')}}</a>
                                    <a class="nav-link text-white" href="#">{{__('Settings')}}</a>
                                </div>
                            </nav>
                        </div>
                        
                        <!-- Content Preview -->
                        <div class="preview-content" style="padding: 30px;">
                            <h5>{{__('Welcome to Your Organization Dashboard')}}</h5>
                            <p>{{ $organization->organization_description ?: __('This is how your organization dashboard will look with your custom settings.') }}</p>
                            
                            <!-- Stats Cards Preview -->
                            <div class="row">
                                <div class="col-md-3">
                                    <div class="card text-center">
                                        <div class="card-body">
                                            <h3 style="color: {{ $organization->primary_color }};">{{ $organization->organizationUsers()->count() }}</h3>
                                            <p class="text-muted mb-0">{{__('Users')}}</p>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-3">
                                    <div class="card text-center">
                                        <div class="card-body">
                                            <h3 style="color: {{ $organization->accent_color }};">{{ $organization->courses()->count() }}</h3>
                                            <p class="text-muted mb-0">{{__('Courses')}}</p>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-3">
                                    <div class="card text-center">
                                        <div class="card-body">
                                            <h3 style="color: {{ $organization->secondary_color }};">{{ $organization->certificates()->count() }}</h3>
                                            <p class="text-muted mb-0">{{__('Certificates')}}</p>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-3">
                                    <div class="card text-center">
                                        <div class="card-body">
                                            <h3 style="color: {{ $organization->primary_color }};">{{ $organization->subscription_plan }}</h3>
                                            <p class="text-muted mb-0">{{__('Plan')}}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Footer Preview -->
                        @if($organization->footer_text)
                            <div class="preview-footer" style="background-color: {{ $organization->secondary_color }}; padding: 15px 20px; color: white; text-align: center;">
                                <p class="mb-0">{{ $organization->footer_text }}</p>
                            </div>
                        @endif
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Settings Summary -->
        <div class="col-lg-4">
            <div class="card mb-4">
                <div class="card-header">
                    <h6 class="mb-0">{{__('Current Settings')}}</h6>
                </div>
                <div class="card-body">
                    <h6>{{__('Organization Info')}}</h6>
                    <ul class="list-unstyled">
                        <li><strong>{{__('Name:')}}</strong> {{ $organization->organization_name ?: __('Not set') }}</li>
                        <li><strong>{{__('Tagline:')}}</strong> {{ $organization->organization_tagline ?: __('Not set') }}</li>
                        <li><strong>{{__('Domain:')}}</strong> {{ $organization->custom_domain ?: __('Not set') }}</li>
                    </ul>
                    
                    <h6 class="mt-3">{{__('Colors')}}</h6>
                    <div class="d-flex gap-2 mb-3">
                        <div class="color-swatch" style="background-color: {{ $organization->primary_color }}; width: 30px; height: 30px; border-radius: 4px;" title="Primary"></div>
                        <div class="color-swatch" style="background-color: {{ $organization->secondary_color }}; width: 30px; height: 30px; border-radius: 4px;" title="Secondary"></div>
                        <div class="color-swatch" style="background-color: {{ $organization->accent_color }}; width: 30px; height: 30px; border-radius: 4px;" title="Accent"></div>
                    </div>
                    
                    <h6 class="mt-3">{{__('Status')}}</h6>
                    <ul class="list-unstyled">
                        <li><strong>{{__('Whitelabel:')}}</strong> 
                            @if($organization->whitelabel_enabled)
                                <span class="badge bg-success">{{__('Enabled')}}</span>
                            @else
                                <span class="badge bg-secondary">{{__('Disabled')}}</span>
                            @endif
                        </li>
                        <li><strong>{{__('Plan:')}}</strong> {{ ucfirst($organization->subscription_plan) }}</li>
                    </ul>
                </div>
            </div>
            
            <!-- Quick Actions -->
            <div class="card">
                <div class="card-header">
                    <h6 class="mb-0">{{__('Quick Actions')}}</h6>
                </div>
                <div class="card-body">
                    <div class="d-grid gap-2">
                        <a href="{{ route('organization.settings.general') }}" class="btn btn-outline-primary">
                            <i class="mdi mdi-cog me-1"></i>{{__('General Settings')}}
                        </a>
                        <a href="{{ route('organization.settings.branding') }}" class="btn btn-outline-success">
                            <i class="mdi mdi-palette me-1"></i>{{__('Branding Settings')}}
                        </a>
                        <a href="{{ route('organization.settings.subscription') }}" class="btn btn-outline-info">
                            <i class="mdi mdi-account-star me-1"></i>{{__('Subscription Settings')}}
                        </a>
                        <a href="{{ route('organization.dashboard') }}" class="btn btn-outline-secondary">
                            <i class="mdi mdi-arrow-left me-1"></i>{{__('Back to Dashboard')}}
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Custom CSS Preview -->
    @if($organization->custom_css)
        <div class="row mt-4">
            <div class="col-12">
                <div class="card">
                    <div class="card-header">
                        <h6 class="mb-0">{{__('Custom CSS Applied')}}</h6>
                    </div>
                    <div class="card-body">
                        <pre><code>{{ $organization->custom_css }}</code></pre>
                    </div>
                </div>
            </div>
        </div>
    @endif
</div>

@push('style')
<style>
.preview-container {
    min-height: 400px;
}

.preview-header h4 {
    font-weight: 600;
}

.preview-nav .navbar-nav .nav-link {
    padding: 8px 16px;
    border-radius: 4px;
    margin-right: 8px;
}

.preview-nav .navbar-nav .nav-link:hover {
    background-color: rgba(255, 255, 255, 0.1);
}

.preview-content .card {
    border: 1px solid #dee2e6;
    transition: transform 0.2s ease;
}

.preview-content .card:hover {
    transform: translateY(-2px);
}

.color-swatch {
    border: 1px solid #dee2e6;
    cursor: pointer;
}

pre {
    background-color: #f8f9fa;
    padding: 15px;
    border-radius: 4px;
    font-size: 12px;
    max-height: 200px;
    overflow-y: auto;
}
</style>
@endpush
@endsection
