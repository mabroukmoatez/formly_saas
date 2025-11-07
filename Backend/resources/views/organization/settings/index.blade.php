@extends('organization.settings.layout')

@section('settings-content')
<div class="organization-settings-overview">
    <h5 class="mb-4">{{__('Organization Settings Overview')}}</h5>
    
    <div class="row">
        <!-- General Settings Card -->
        <div class="col-lg-4 col-md-6 mb-4">
            <div class="card h-100">
                <div class="card-body text-center">
                    <div class="mb-3">
                        <i class="mdi mdi-cog font-48 text-primary"></i>
                    </div>
                    <h5 class="card-title">{{__('General Settings')}}</h5>
                    <p class="card-text text-muted">{{__('Configure organization name, colors, and basic information')}}</p>
                    <a href="{{ route('organization.settings.general') }}" class="btn btn-primary">
                        {{__('Configure')}}
                    </a>
                </div>
            </div>
        </div>
        
        <!-- Branding Settings Card -->
        <div class="col-lg-4 col-md-6 mb-4">
            <div class="card h-100">
                <div class="card-body text-center">
                    <div class="mb-3">
                        <i class="mdi mdi-palette font-48 text-success"></i>
                    </div>
                    <h5 class="card-title">{{__('Branding Settings')}}</h5>
                    <p class="card-text text-muted">{{__('Upload logo, favicon, and customize domain')}}</p>
                    <a href="{{ route('organization.settings.branding') }}" class="btn btn-success">
                        {{__('Configure')}}
                    </a>
                </div>
            </div>
        </div>
        
        <!-- Subscription Settings Card -->
        <div class="col-lg-4 col-md-6 mb-4">
            <div class="card h-100">
                <div class="card-body text-center">
                    <div class="mb-3">
                        <i class="mdi mdi-account-star font-48 text-info"></i>
                    </div>
                    <h5 class="card-title">{{__('Subscription Settings')}}</h5>
                    <p class="card-text text-muted">{{__('Manage plan limits and subscription details')}}</p>
                    <a href="{{ route('organization.settings.subscription') }}" class="btn btn-info">
                        {{__('Configure')}}
                    </a>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Current Settings Summary -->
    <div class="row mt-4">
        <div class="col-12">
            <div class="card">
                <div class="card-header">
                    <h6 class="mb-0">{{__('Current Settings Summary')}}</h6>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-6">
                            <h6>{{__('Organization Information')}}</h6>
                            <ul class="list-unstyled">
                                <li><strong>{{__('Name:')}}</strong> {{ $organization->organization_name ?: __('Not set') }}</li>
                                <li><strong>{{__('Tagline:')}}</strong> {{ $organization->organization_tagline ?: __('Not set') }}</li>
                                <li><strong>{{__('Domain:')}}</strong> {{ $organization->custom_domain ?: __('Not set') }}</li>
                                <li><strong>{{__('Whitelabel:')}}</strong> 
                                    @if($organization->whitelabel_enabled)
                                        <span class="badge bg-success">{{__('Enabled')}}</span>
                                    @else
                                        <span class="badge bg-secondary">{{__('Disabled')}}</span>
                                    @endif
                                </li>
                            </ul>
                        </div>
                        <div class="col-md-6">
                            <h6>{{__('Subscription Limits')}}</h6>
                            <ul class="list-unstyled">
                                <li><strong>{{__('Plan:')}}</strong> {{ ucfirst($organization->subscription_plan) }}</li>
                                <li><strong>{{__('Max Users:')}}</strong> {{ $organization->max_users }}</li>
                                <li><strong>{{__('Max Courses:')}}</strong> {{ $organization->max_courses }}</li>
                                <li><strong>{{__('Max Certificates:')}}</strong> {{ $organization->max_certificates }}</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Quick Actions -->
    <div class="row mt-4">
        <div class="col-12">
            <div class="card">
                <div class="card-header">
                    <h6 class="mb-0">{{__('Quick Actions')}}</h6>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-3">
                            <a href="{{ route('organization.settings.preview') }}" class="btn btn-outline-info w-100 mb-2">
                                <i class="mdi mdi-eye me-1"></i>{{__('Preview Settings')}}
                            </a>
                        </div>
                        <div class="col-md-3">
                            <form method="POST" action="{{ route('organization.settings.reset') }}" class="d-inline w-100">
                                @csrf
                                <button type="submit" class="btn btn-outline-warning w-100 mb-2" 
                                        onclick="return confirm('{{__('Are you sure you want to reset all settings to default?')}}')">
                                    <i class="mdi mdi-refresh me-1"></i>{{__('Reset Settings')}}
                                </button>
                            </form>
                        </div>
                        <div class="col-md-3">
                            <a href="{{ route('organization.dashboard') }}" class="btn btn-outline-secondary w-100 mb-2">
                                <i class="mdi mdi-arrow-left me-1"></i>{{__('Back to Dashboard')}}
                            </a>
                        </div>
                        <div class="col-md-3">
                            <a href="{{ route('organization.user-management.index') }}" class="btn btn-outline-primary w-100 mb-2">
                                <i class="mdi mdi-account-group me-1"></i>{{__('Manage Users')}}
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
@endsection
