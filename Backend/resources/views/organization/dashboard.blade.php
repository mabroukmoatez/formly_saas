@extends('layouts.organization')

@section('content')
<div class="modern-dashboard">
    <!-- Modern Header Section -->
    <div class="dashboard-header">
        <div class="header-content">
            <div class="welcome-section">
                <h1 class="welcome-title">{{ __('Welcome to your Dashboard') }}</h1>
                <p class="welcome-subtitle">{{ __('Manage your organization efficiently') }}</p>
                            </div>
            <div class="header-actions">
                <div class="status-indicators">
                    <div class="status-item">
                        <div class="status-icon auto-save">
                            <i class="fas fa-check"></i>
                        </div>
                        <span>{{ __('Auto Save') }}</span>
                    </div>
                    <div class="status-item draft">
                        <div class="status-icon">
                            <i class="fas fa-check"></i>
                        </div>
                        <span>{{ __('Draft') }}</span>
                    </div>
                </div>
                <div class="progress-indicator">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: 100%; background: {{ $organization_colors['primary'] ?? '#3b82f6' }}"></div>
                    </div>
                    <span class="progress-text">100/100%</span>
                        </div>
                    </div>
                </div>
            </div>

    <!-- Organization Branding Card -->
            @if($current_organization ?? false)
    <div class="organization-card" style="background: linear-gradient(135deg, {{ $organization_colors['primary'] ?? '#3b82f6' }} 0%, {{ $organization_colors['accent'] ?? '#1d4ed8' }} 100%); color: white;">
        <div class="organization-content">
            <div class="organization-info">
                <div class="organization-logo">
                                    @if($current_organization->organization_logo)
                        @php
                            $logoPath = $current_organization->organization_logo;
                            if (substr($logoPath, 0, 8) !== 'uploads/') {
                                $logoPath = 'uploads/' . ltrim($logoPath, '/');
                            }
                            $logoUrl = url($logoPath);
                        @endphp
                        <img src="{{ $logoUrl }}" alt="{{ $current_organization->organization_name }}">
                                    @else
                        <div class="logo-placeholder">
                            <i class="fas fa-building"></i>
                                        </div>
                                    @endif
                </div>
                <div class="organization-details">
                    <h2 class="organization-name">{{ $current_organization->organization_name }}</h2>
                                        @if($current_organization->organization_tagline)
                        <p class="organization-tagline">{{ $current_organization->organization_tagline }}</p>
                                        @endif
                                    </div>
                                </div>
                                <div class="organization-stats">
                                    <div class="stat-item">
                    <div class="stat-icon" style="background: rgba(255,255,255,0.2);">
                                        <i class="fas fa-users"></i>
                    </div>
                    <div class="stat-content">
                        <span class="stat-number">{{ $organization ? $organization->organizationUsers()->count() : 0 }}</span>
                        <span class="stat-label">{{ __('Users') }}</span>
                    </div>
                </div>
                <div class="stat-item">
                    <div class="stat-icon" style="background: rgba(255,255,255,0.2);">
                            <i class="fas fa-book"></i>
                        </div>
                    <div class="stat-content">
                        <span class="stat-number">{{ $organization ? $organization->courses()->count() : 0 }}</span>
                        <span class="stat-label">{{ __('Courses') }}</span>
                    </div>
                </div>
                <div class="stat-item">
                    <div class="stat-icon" style="background: rgba(255,255,255,0.2);">
                            <i class="fas fa-certificate"></i>
                    </div>
                    <div class="stat-content">
                        <span class="stat-number">{{ $organization ? $organization->certificates()->count() : 0 }}</span>
                        <span class="stat-label">{{ __('Certificates') }}</span>
                    </div>
                </div>
            </div>
        </div>
                        </div>
    @endif

    <!-- Quick Actions Section -->
    <div class="actions-section">
        <h3 class="section-title">{{ __('Quick Actions') }}</h3>
        <div class="actions-grid">
                            @can('organization_create_user')
            <div class="action-card">
                <div class="action-icon" style="background: linear-gradient(135deg, {{ $organization_colors['primary'] ?? '#3b82f6' }}, {{ $organization_colors['accent'] ?? '#1d4ed8' }});">
                    <i class="fas fa-user-plus"></i>
                </div>
                <div class="action-content">
                    <h4>{{ __('Add User') }}</h4>
                    <p>{{ __('Create a new user account') }}</p>
                </div>
                <a href="{{ route('organization.user-management.create') }}" class="action-button">
                    <i class="fas fa-arrow-right"></i>
                                </a>
                            </div>
                            @endcan

                            @can('organization_create_certificate')
            <div class="action-card">
                <div class="action-icon" style="background: linear-gradient(135deg, {{ $organization_colors['primary'] ?? '#3b82f6' }}, {{ $organization_colors['accent'] ?? '#1d4ed8' }});">
                    <i class="fas fa-certificate"></i>
                </div>
                <div class="action-content">
                    <h4>{{ __('Create Certificate') }}</h4>
                    <p>{{ __('Design a new certificate') }}</p>
                </div>
                <a href="{{ route('organization.certificate-management.create') }}" class="action-button">
                    <i class="fas fa-arrow-right"></i>
                                </a>
                            </div>
                            @endcan

                            @can('organization_manage_settings')
            <div class="action-card">
                <div class="action-icon" style="background: linear-gradient(135deg, {{ $organization_colors['primary'] ?? '#3b82f6' }}, {{ $organization_colors['accent'] ?? '#1d4ed8' }});">
                    <i class="fas fa-palette"></i>
                </div>
                <div class="action-content">
                    <h4>{{ __('Branding') }}</h4>
                    <p>{{ __('Customize your brand') }}</p>
                </div>
                <a href="{{ route('organization.settings.branding') }}" class="action-button">
                    <i class="fas fa-arrow-right"></i>
                                </a>
                            </div>
                            @endcan

                            @can('organization_manage_settings')
            <div class="action-card">
                <div class="action-icon" style="background: linear-gradient(135deg, {{ $organization_colors['primary'] ?? '#3b82f6' }}, {{ $organization_colors['accent'] ?? '#1d4ed8' }});">
                    <i class="fas fa-eye"></i>
                </div>
                <div class="action-content">
                    <h4>{{ __('Preview') }}</h4>
                    <p>{{ __('Preview your organization') }}</p>
                </div>
                <a href="{{ route('organization.settings.preview') }}" class="action-button">
                    <i class="fas fa-arrow-right"></i>
                                </a>
                            </div>
                            @endcan
                        </div>
                    </div>

    <!-- Management Cards Section -->
    <div class="management-section">
        <h3 class="section-title">{{ __('Organization Management') }}</h3>
        <div class="management-grid">
            @can('organization_manage_settings')
            <div class="management-card">
                <div class="card-header">
                    <div class="card-icon">
                        <i class="fas fa-palette"></i>
                    </div>
                    <h4>{{ __('White Label') }}</h4>
                </div>
                <div class="card-content">
                    <p>{{ __('Configure your organization branding and customize the appearance') }}</p>
                </div>
                <div class="card-footer">
                    <a href="{{ route('organization.settings.branding') }}" class="card-button" style="background: {{ $organization_colors['primary'] ?? '#3b82f6' }};">
                        {{ __('Configure') }}
                        <i class="fas fa-arrow-right"></i>
                    </a>
                </div>
            </div>
            @endcan

            @can('organization_manage_certificate')
            <div class="management-card">
                <div class="card-header">
                    <div class="card-icon">
                        <i class="fas fa-certificate"></i>
                    </div>
                    <h4>{{ __('Certificate Management') }}</h4>
                        </div>
                <div class="card-content">
                    <p>{{ __('Create and manage certificates for your organization') }}</p>
                                    </div>
                <div class="card-footer">
                    <a href="{{ route('organization.certificate-management.index') }}" class="card-button" style="background: {{ $organization_colors['primary'] ?? '#3b82f6' }};">
                        {{ __('Manage') }}
                        <i class="fas fa-arrow-right"></i>
                    </a>
                                </div>
                            </div>
                            @endcan

            @can('organization_manage_user')
            <div class="management-card">
                <div class="card-header">
                    <div class="card-icon">
                        <i class="fas fa-users"></i>
                                    </div>
                    <h4>{{ __('User Management') }}</h4>
                                </div>
                <div class="card-content">
                    <p>{{ __('Manage organization users and their permissions') }}</p>
                            </div>
                <div class="card-footer">
                    <a href="{{ route('organization.user-management.index') }}" class="card-button" style="background: {{ $organization_colors['primary'] ?? '#3b82f6' }};">
                        {{ __('Manage') }}
                        <i class="fas fa-arrow-right"></i>
                    </a>
                                </div>
                            </div>
                            @endcan

                            @can('organization_manage_settings')
            <div class="management-card">
                <div class="card-header">
                    <div class="card-icon">
                        <i class="fas fa-cog"></i>
                    </div>
                    <h4>{{ __('Settings') }}</h4>
                </div>
                <div class="card-content">
                    <p>{{ __('General organization settings and preferences') }}</p>
                                    </div>
                <div class="card-footer">
                    <a href="{{ route('organization.settings.general') }}" class="card-button" style="background: {{ $organization_colors['primary'] ?? '#3b82f6' }};">
                        {{ __('Settings') }}
                        <i class="fas fa-arrow-right"></i>
                    </a>
                                </div>
                            </div>
                            @endcan

                            @can('organization_view_analytics')
            <div class="management-card">
                <div class="card-header">
                    <div class="card-icon">
                        <i class="fas fa-chart-line"></i>
                    </div>
                    <h4>{{ __('Analytics') }}</h4>
                </div>
                <div class="card-content">
                    <p>{{ __('View detailed analytics and reports') }}</p>
                                    </div>
                <div class="card-footer">
                    <a href="#" class="card-button" style="background: {{ $organization_colors['primary'] ?? '#3b82f6' }};">
                        {{ __('View') }}
                        <i class="fas fa-arrow-right"></i>
                    </a>
                                </div>
                            </div>
                            @endcan

            <div class="management-card">
                <div class="card-header">
                    <div class="card-icon">
                        <i class="fas fa-bolt"></i>
                    </div>
                    <h4>{{ __('Quick Actions') }}</h4>
                                    </div>
                <div class="card-content">
                    <p>{{ __('Access frequently used actions and shortcuts') }}</p>
                                </div>
                <div class="card-footer">
                    <a href="#" class="card-button" style="background: {{ $organization_colors['primary'] ?? '#3b82f6' }};">
                        {{ __('Actions') }}
                        <i class="fas fa-arrow-right"></i>
                    </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

<style>
/* Modern Dashboard Styles */
.modern-dashboard {
    padding: 0;
    background: #f8fafc;
    min-height: calc(100vh - 60px);
    margin-top: -20px;
    transition: background-color 0.3s ease, color 0.3s ease;
}

/* Dark Mode Styles */
@media (prefers-color-scheme: dark) {
    .modern-dashboard {
        background: #0f172a;
        color: #e2e8f0;
    }
}

[data-theme="dark"] .modern-dashboard {
    background: #0f172a;
    color: #e2e8f0;
}

/* Header Section */
.dashboard-header {
    background: white;
    border-radius: 0 0 16px 16px;
    padding: 24px 32px;
    margin-bottom: 24px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    transition: background-color 0.3s ease, color 0.3s ease;
}

@media (prefers-color-scheme: dark) {
    .dashboard-header {
        background: #1e293b;
        color: #e2e8f0;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2);
    }
}

[data-theme="dark"] .dashboard-header {
    background: #1e293b;
    color: #e2e8f0;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2);
}

.header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.welcome-section h1 {
    font-size: 2rem;
    font-weight: 700;
    color: #1f2937;
    margin-bottom: 8px;
    transition: color 0.3s ease;
}

.welcome-section p {
    font-size: 1.1rem;
    color: #6b7280;
    margin: 0;
    transition: color 0.3s ease;
}

@media (prefers-color-scheme: dark) {
    .welcome-section h1 {
        color: #e2e8f0;
    }
    
    .welcome-section p {
        color: #94a3b8;
    }
}

[data-theme="dark"] .welcome-section h1 {
    color: #e2e8f0;
}

[data-theme="dark"] .welcome-section p {
    color: #94a3b8;
}

.header-actions {
    display: flex;
    align-items: center;
    gap: 24px;
}

.status-indicators {
    display: flex;
    gap: 16px;
}

.status-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    border-radius: 12px;
    font-size: 0.875rem;
    font-weight: 500;
}

.status-item.auto-save {
    background: #f3f4f6;
    color: #374151;
    transition: background-color 0.3s ease, color 0.3s ease;
}

.status-item.draft {
    background: #fef3c7;
    color: #92400e;
    transition: background-color 0.3s ease, color 0.3s ease;
}

@media (prefers-color-scheme: dark) {
    .status-item.auto-save {
        background: #374151;
        color: #d1d5db;
    }
    
    .status-item.draft {
        background: #451a03;
        color: #fbbf24;
    }
}

[data-theme="dark"] .status-item.auto-save {
    background: #374151;
    color: #d1d5db;
}

[data-theme="dark"] .status-item.draft {
    background: #451a03;
    color: #fbbf24;
}

.status-icon {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
}

.status-icon.auto-save {
    background: #d1d5db;
    color: #374151;
}

.status-icon {
    background: #f59e0b;
    color: white;
}

.progress-indicator {
    display: flex;
    align-items: center;
    gap: 12px;
}

.progress-bar {
    width: 120px;
    height: 8px;
    background: #e5e7eb;
    border-radius: 4px;
    overflow: hidden;
}

.progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #3b82f6 0%, #1d4ed8 100%);
    border-radius: 4px;
    transition: width 0.3s ease;
}

.progress-text {
    font-size: 0.875rem;
    font-weight: 600;
    color: #374151;
    transition: color 0.3s ease;
}

@media (prefers-color-scheme: dark) {
    .progress-text {
        color: #d1d5db;
    }
}

[data-theme="dark"] .progress-text {
    color: #d1d5db;
}

/* Organization Card */
.organization-card {
    background: white;
    border-radius: 16px;
    padding: 32px;
    margin: 0 24px 24px 24px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    transition: background-color 0.3s ease, color 0.3s ease;
}

@media (prefers-color-scheme: dark) {
    .organization-card {
        background: #1e293b;
        color: #e2e8f0;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2);
    }
}

[data-theme="dark"] .organization-card {
    background: #1e293b;
    color: #e2e8f0;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2);
}

.organization-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.organization-info {
    display: flex;
    align-items: center;
    gap: 20px;
}

.organization-logo {
    width: 80px;
    height: 80px;
    border-radius: 12px;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
}

.organization-logo img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.logo-placeholder {
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 2rem;
}

.organization-details h2 {
    font-size: 1.75rem;
    font-weight: 700;
    color: #1f2937;
    margin-bottom: 8px;
}

.organization-tagline {
    font-size: 1rem;
    color: #6b7280;
    margin: 0;
}

.organization-stats {
    display: flex;
    gap: 32px;
}

.stat-item {
    display: flex;
    align-items: center;
    gap: 12px;
}

.stat-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    background: #f3f4f6;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #3b82f6;
    font-size: 1.25rem;
}

.stat-content {
    display: flex;
    flex-direction: column;
}

.stat-number {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1f2937;
    line-height: 1;
}

.stat-label {
    font-size: 0.875rem;
    color: #6b7280;
    font-weight: 500;
}

/* Actions Section */
.actions-section {
    margin: 0 24px 32px 24px;
}

.section-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1f2937;
    margin-bottom: 20px;
    transition: color 0.3s ease;
}

@media (prefers-color-scheme: dark) {
    .section-title {
        color: #e2e8f0;
    }
}

[data-theme="dark"] .section-title {
    color: #e2e8f0;
}

.actions-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 20px;
}

.action-card {
    background: white;
    border-radius: 16px;
    padding: 24px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    display: flex;
    align-items: center;
    gap: 16px;
    transition: all 0.3s ease;
    cursor: pointer;
}

.action-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

@media (prefers-color-scheme: dark) {
    .action-card {
        background: #1e293b;
        color: #e2e8f0;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2);
    }
    
    .action-card:hover {
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2);
    }
}

[data-theme="dark"] .action-card {
    background: #1e293b;
    color: #e2e8f0;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2);
}

[data-theme="dark"] .action-card:hover {
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2);
}

.action-icon {
    width: 56px;
    height: 56px;
    border-radius: 12px;
    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 1.5rem;
}

.action-content {
    flex: 1;
}

.action-content h4 {
    font-size: 1.125rem;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 4px;
    transition: color 0.3s ease;
}

.action-content p {
    font-size: 0.875rem;
    color: #6b7280;
    margin: 0;
    transition: color 0.3s ease;
}

@media (prefers-color-scheme: dark) {
    .action-content h4 {
        color: #e2e8f0;
    }
    
    .action-content p {
        color: #94a3b8;
    }
}

[data-theme="dark"] .action-content h4 {
    color: #e2e8f0;
}

[data-theme="dark"] .action-content p {
    color: #94a3b8;
}

.action-button {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    background: #f3f4f6;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #6b7280;
    text-decoration: none;
    transition: all 0.3s ease;
}

@media (prefers-color-scheme: dark) {
    .action-button {
        background: #374151;
        color: #9ca3af;
    }
}

[data-theme="dark"] .action-button {
    background: #374151;
    color: #9ca3af;
}

.action-button:hover {
    background: {{ $organization_colors['primary'] ?? '#3b82f6' }};
    color: white;
}

/* Management Section */
.management-section {
    margin: 0 24px 32px 24px;
}

.management-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 24px;
}

.management-card {
    background: white;
    border-radius: 16px;
    padding: 24px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    transition: all 0.3s ease;
}

.management-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

@media (prefers-color-scheme: dark) {
    .management-card {
        background: white !important;
        color: #1f2937 !important;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
    }
    
    .management-card:hover {
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05) !important;
    }
}

[data-theme="dark"] .management-card {
    background: white !important;
    color: #1f2937 !important;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
}

[data-theme="dark"] .management-card:hover {
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05) !important;
}

.card-header {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 16px;
}

.card-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    background: #f3f4f6;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #3b82f6;
    font-size: 1.25rem;
    transition: background-color 0.3s ease, color 0.3s ease;
}

@media (prefers-color-scheme: dark) {
    .card-icon {
        background: #f3f4f6 !important;
        color: #3b82f6 !important;
    }
}

[data-theme="dark"] .card-icon {
    background: #f3f4f6 !important;
    color: #3b82f6 !important;
}

.card-header h4 {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1f2937;
    margin: 0;
    transition: color 0.3s ease;
}

.card-content {
    margin-bottom: 20px;
}

.card-content p {
    font-size: 0.875rem;
    color: #6b7280;
    line-height: 1.5;
    margin: 0;
    transition: color 0.3s ease;
}

@media (prefers-color-scheme: dark) {
    .card-header h4 {
        color: #1f2937 !important;
    }
    
    .card-content p {
        color: #6b7280 !important;
    }
}

[data-theme="dark"] .card-header h4 {
    color: #1f2937 !important;
}

[data-theme="dark"] .card-content p {
    color: #6b7280 !important;
}

.card-footer {
    display: flex;
    justify-content: flex-end;
}

.card-button {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 12px 20px;
    background: #3b82f6;
    color: white;
    text-decoration: none;
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 500;
    transition: all 0.3s ease;
}

.card-button:hover {
    background: {{ $organization_colors['accent'] ?? '#1d4ed8' }};
    color: white;
    text-decoration: none;
}

/* Responsive Design */
@media (max-width: 768px) {
    .modern-dashboard {
        padding: 0;
    }
    
    .dashboard-header {
        padding: 20px;
        margin-bottom: 16px;
    }
    
    .organization-card {
        margin: 0 16px 16px 16px;
        padding: 24px;
    }
    
    .actions-section,
    .management-section {
        margin: 0 16px 24px 16px;
    }
    
    .header-content {
        flex-direction: column;
        gap: 20px;
        align-items: flex-start;
    }
    
    .organization-content {
        flex-direction: column;
        gap: 24px;
        align-items: flex-start;
    }
    
    .organization-stats {
        flex-direction: column;
        gap: 16px;
        width: 100%;
    }
    
    .actions-grid,
    .management-grid {
        grid-template-columns: 1fr;
    }
}
</style>
@endsection