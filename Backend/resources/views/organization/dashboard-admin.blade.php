@extends('layouts.organization-admin')

@section('content')
    <div class="page-content">
        <div class="container-fluid">
            <!-- Breadcrumb -->
            <div class="row">
                <div class="col-md-12">
                    <div class="breadcrumb__content">
                        <div class="breadcrumb__content__left">
                            <div class="breadcrumb__title">
                                <h2>{{ __('Dashboard') }}</h2>
                            </div>
                        </div>
                        <div class="breadcrumb__content__right">
                            <nav aria-label="breadcrumb">
                                <ul class="breadcrumb">
                                    <li class="breadcrumb-item">
                                        <a href="#">
                                            @if($current_organization ?? false)
                                                {{ $current_organization->organization_name }}
                                            @else
                                                {{ get_option('app_name') }}
                                            @endif
                                        </a>
                                    </li>
                                    <li class="breadcrumb-item active" aria-current="page">{{ __('Dashboard') }}</li>
                                </ul>
                            </nav>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Organization Branding Header -->
            @if($current_organization ?? false)
            <div class="row mb-4">
                <div class="col-12">
                    <div class="organization-branding-header" style="background: linear-gradient(135deg, {{ $organization_colors['primary'] ?? '#007bff' }} 0%, {{ $organization_colors['accent'] ?? '#28a745' }} 100%); color: white; padding: 30px; border-radius: 12px; box-shadow: 0 8px 25px rgba(0,0,0,0.15);">
                        <div class="row align-items-center">
                            <div class="col-md-8">
                                <div class="d-flex align-items-center mb-3">
                                    @if($current_organization->organization_logo)
                                        <img src="{{ $current_organization->organization_logo_url }}" alt="{{ $current_organization->organization_name }}" height="60" class="me-3" style="border-radius: 8px;">
                                    @else
                                        <div class="organization-logo-placeholder me-3" style="width: 60px; height: 60px; background: rgba(255,255,255,0.2); border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                                            <i class="fas fa-building" style="font-size: 24px; color: white;"></i>
                                        </div>
                                    @endif
                                    <div>
                                        <h2 class="mb-1" style="font-weight: 700; font-size: 1.8rem;">{{ $current_organization->organization_name }}</h2>
                                        @if($current_organization->organization_tagline)
                                            <p class="mb-0" style="opacity: 0.9; font-size: 1.1rem;">{{ $current_organization->organization_tagline }}</p>
                                        @endif
                                    </div>
                                </div>
                                @if($current_organization->organization_description)
                                    <p class="mb-0" style="opacity: 0.85; font-size: 0.95rem; line-height: 1.5;">{{ $current_organization->organization_description }}</p>
                                @endif
                            </div>
                            <div class="col-md-4 text-end">
                                <div class="organization-stats">
                                    <div class="stat-item">
                                        <i class="fas fa-users"></i>
                                        <span>{{ __('Users') }}</span>
                                    </div>
                                    <div class="stat-item">
                                        <i class="fas fa-book"></i>
                                        <span>{{ __('Courses') }}</span>
                                    </div>
                                    <div class="stat-item">
                                        <i class="fas fa-certificate"></i>
                                        <span>{{ __('Certificates') }}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            @endif

            <!-- Dashboard Stats -->
            <div class="row">
                <div class="col-lg-3 col-md-6 col-sm-6">
                    <div class="customers__area bg-style mb-30">
                        <div class="customers__icon">
                            <i class="fas fa-users"></i>
                        </div>
                        <div class="customers__content">
                            <h2 class="customers__number">{{ $organization ? $organization->organizationUsers()->count() : 0 }}</h2>
                            <p class="customers__title">{{ __('Total Users') }}</p>
                        </div>
                    </div>
                </div>

                <div class="col-lg-3 col-md-6 col-sm-6">
                    <div class="customers__area bg-style mb-30">
                        <div class="customers__icon">
                            <i class="fas fa-book"></i>
                        </div>
                        <div class="customers__content">
                            <h2 class="customers__number">{{ $organization ? $organization->courses()->count() : 0 }}</h2>
                            <p class="customers__title">{{ __('Total Courses') }}</p>
                        </div>
                    </div>
                </div>

                <div class="col-lg-3 col-md-6 col-sm-6">
                    <div class="customers__area bg-style mb-30">
                        <div class="customers__icon">
                            <i class="fas fa-certificate"></i>
                        </div>
                        <div class="customers__content">
                            <h2 class="customers__number">{{ $organization ? $organization->certificates()->count() : 0 }}</h2>
                            <p class="customers__title">{{ __('Total Certificates') }}</p>
                        </div>
                    </div>
                </div>

                <div class="col-lg-3 col-md-6 col-sm-6">
                    <div class="customers__area bg-style mb-30">
                        <div class="customers__icon">
                            <i class="fas fa-chart-line"></i>
                        </div>
                        <div class="customers__content">
                            <h2 class="customers__number">{{ $organization ? $organization->enrollments()->count() : 0 }}</h2>
                            <p class="customers__title">{{ __('Total Enrollments') }}</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Quick Actions -->
            <div class="row">
                <div class="col-12">
                    <div class="customers__area bg-style mb-30">
                        <div class="item-title d-flex justify-content-between">
                            <h2>{{ __('Quick Actions') }}</h2>
                        </div>
                        <div class="row">
                            @can('organization_create_user')
                            <div class="col-lg-3 col-md-6 mb-3">
                                <div class="organization-feature-card card h-100 text-center p-4">
                                    <div class="organization-feature-icon mx-auto mb-3">
                                        <i class="fas fa-user-plus"></i>
                                    </div>
                                    <h5 class="card-title">{{ __('Add User') }}</h5>
                                    <p class="card-text text-muted">{{ __('Create new users for your organization') }}</p>
                                    <a href="{{ route('organization.user-management.create') }}" class="btn btn-primary">
                                        {{ __('Add User') }}
                                    </a>
                                </div>
                            </div>
                            @endcan

                            @can('organization_create_certificate')
                            <div class="col-lg-3 col-md-6 mb-3">
                                <div class="organization-feature-card card h-100 text-center p-4">
                                    <div class="organization-feature-icon mx-auto mb-3">
                                        <i class="fas fa-certificate"></i>
                                    </div>
                                    <h5 class="card-title">{{ __('Create Certificate') }}</h5>
                                    <p class="card-text text-muted">{{ __('Design and create custom certificates') }}</p>
                                    <a href="{{ route('organization.certificate-management.create') }}" class="btn btn-primary">
                                        {{ __('Create Certificate') }}
                                    </a>
                                </div>
                            </div>
                            @endcan

                            @can('organization_manage_settings')
                            <div class="col-lg-3 col-md-6 mb-3">
                                <div class="organization-feature-card card h-100 text-center p-4">
                                    <div class="organization-feature-icon mx-auto mb-3">
                                        <i class="fas fa-palette"></i>
                                    </div>
                                    <h5 class="card-title">{{ __('Branding') }}</h5>
                                    <p class="card-text text-muted">{{ __('Customize your organization branding') }}</p>
                                    <a href="{{ route('organization.settings.branding') }}" class="btn btn-primary">
                                        {{ __('Branding') }}
                                    </a>
                                </div>
                            </div>
                            @endcan

                            @can('organization_manage_settings')
                            <div class="col-lg-3 col-md-6 mb-3">
                                <div class="organization-feature-card card h-100 text-center p-4">
                                    <div class="organization-feature-icon mx-auto mb-3">
                                        <i class="fas fa-eye"></i>
                                    </div>
                                    <h5 class="card-title">{{ __('Preview') }}</h5>
                                    <p class="card-text text-muted">{{ __('Preview your branded login page') }}</p>
                                    <a href="{{ route('organization.settings.preview') }}" class="btn btn-primary">
                                        {{ __('Preview') }}
                                    </a>
                                </div>
                            </div>
                            @endcan
                        </div>
                    </div>
                </div>
            </div>

            <!-- Recent Activity -->
            <div class="row">
                <div class="col-12">
                    <div class="customers__area bg-style mb-30">
                        <div class="item-title d-flex justify-content-between">
                            <h2>{{ __('Recent Activity') }}</h2>
                        </div>
                        <div class="table-responsive">
                            <table class="table">
                                <thead>
                                    <tr>
                                        <th>{{ __('Activity') }}</th>
                                        <th>{{ __('Date') }}</th>
                                        <th>{{ __('Status') }}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>{{ __('Welcome to your organization dashboard') }}</td>
                                        <td>{{ now()->format('M d, Y') }}</td>
                                        <td><span class="badge bg-success">{{ __('Active') }}</span></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
@endsection

@push('script')
<style>
/* Enhanced Organization Dashboard Branding */
.organization-branding-header {
    position: relative;
    overflow: hidden;
}

.organization-branding-header::before {
    content: '';
    position: absolute;
    top: -50%;
    right: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
    animation: float 6s ease-in-out infinite;
}

@keyframes float {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-20px) rotate(180deg); }
}

.organization-stats {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.stat-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    background: rgba(255,255,255,0.15);
    border-radius: 8px;
    backdrop-filter: blur(10px);
    transition: all 0.3s ease;
}

.stat-item:hover {
    background: rgba(255,255,255,0.25);
    transform: translateY(-2px);
}

.stat-item i {
    font-size: 1.2rem;
    color: white;
    width: 20px;
    text-align: center;
}

.stat-item span {
    font-size: 0.9rem;
    font-weight: 500;
    color: white;
}

.organization-logo-placeholder {
    transition: all 0.3s ease;
}

.organization-logo-placeholder:hover {
    background: rgba(255,255,255,0.3) !important;
    transform: scale(1.05);
}

/* Enhanced Feature Cards */
.organization-feature-card {
    transition: all 0.3s ease;
    border: 1px solid #e5e7eb !important;
    background: white;
}

.organization-feature-card:hover {
    box-shadow: 0 10px 30px rgba(0,0,0,0.1) !important;
    transform: translateY(-5px) !important;
    border-color: var(--primary-color) !important;
}

.organization-feature-icon {
    width: 50px;
    height: 50px;
    background-color: var(--primary-color);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 20px;
    transition: all 0.3s ease;
}

.organization-feature-card:hover .organization-feature-icon {
    background-color: var(--accent-color) !important;
    transform: scale(1.1);
}

/* Mobile Responsive */
@media (max-width: 768px) {
    .organization-branding-header {
        padding: 20px !important;
    }
    
    .organization-branding-header h2 {
        font-size: 1.4rem !important;
    }
    
    .organization-stats {
        margin-top: 1rem;
    }
    
    .stat-item {
        padding: 0.5rem 0.75rem;
    }
}
</style>
@endpush
