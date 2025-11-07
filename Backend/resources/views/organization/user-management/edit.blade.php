@extends('layouts.organization')

@push('styles')
<link href="https://cdn.jsdelivr.net/npm/@iconify/iconify@3.1.1/dist/iconify.min.js" rel="stylesheet">
@endpush

@section('breadcrumb')
    <div class="page-banner-content text-center">
        <h3 class="page-banner-heading text-white pb-15">{{__('Edit User')}}</h3>
        <nav aria-label="breadcrumb">
            <ol class="breadcrumb justify-content-center">
                <li class="breadcrumb-item font-14"><a href="{{route('main.index')}}">{{__('Home')}}</a></li>
                <li class="breadcrumb-item font-14"><a href="{{route('organization.dashboard')}}">{{__('Dashboard')}}</a></li>
                <li class="breadcrumb-item font-14"><a href="{{route('organization.user-management.index')}}">{{__('User Management')}}</a></li>
                <li class="breadcrumb-item font-14 active" aria-current="page">{{__('Edit User')}}</li>
            </ol>
        </nav>
    </div>
@endsection

@section('content')
<div class="user-edit-container">
    <!-- Modern Header -->
    <div class="edit-header">
        <div class="header-content">
            <div class="user-profile-section">
                <div class="user-avatar">
                    @if($user->image_path && $user->image_path != '')
                        <img src="{{ getImageFile($user->image_path) }}" alt="{{ $user->name }}" class="avatar-image">
                    @else
                        <div class="avatar-circle">
                            <span class="avatar-text">{{ substr($user->name, 0, 2) }}</span>
                        </div>
                    @endif
                </div>
                <div class="user-details">
                    <div class="user-name-section">
                        <h1 class="user-name">{{ $user->name }}</h1>
                        @if($user->status == STATUS_APPROVED)
                            <span class="status-label status-active">
                                <span class="iconify me-1" data-icon="mdi:check-circle"></span>{{__('Active')}}
                            </span>
                        @else
                            <span class="status-label status-suspended">
                                <span class="iconify me-1" data-icon="mdi:pause-circle"></span>{{__('Suspended')}}
                            </span>
                        @endif
                    </div>
                    <div class="user-email">{{ $user->email }}</div>
                </div>
            </div>
        </div>
        <div class="header-actions">
            <a href="{{ route('organization.user-management.index') }}" class="back-button">
                <span class="iconify me-2" data-icon="mdi:arrow-left"></span>{{__('Back to Users')}}
            </a>
        </div>
    </div>

    <!-- Edit Form -->
    <div class="edit-form-container">
        <form method="POST" action="{{ route('organization.user-management.update', $user->id) }}" class="modern-form">
            @csrf
            @method('PUT')
            
            <!-- Basic Information Card -->
            <div class="form-card">
                <div class="card-header">
                    <div class="card-icon">
                        <span class="iconify" data-icon="mdi:account-edit"></span>
                    </div>
                    <div class="card-title">
                        <h3>{{__('Basic Information')}}</h3>
                        <p>{{__('Update user personal details')}}</p>
                    </div>
                </div>
                <div class="card-content">
                    <div class="form-grid">
                        <!-- Name -->
                        <div class="form-group">
                            <label for="name" class="form-label">
                                <span class="iconify me-2" data-icon="mdi:account"></span>{{__('Full Name')}}
                                <span class="required">*</span>
                            </label>
                            <input type="text" class="form-input @error('name') error @enderror" 
                                   id="name" name="name" value="{{ old('name', $user->name) }}" required>
                            @error('name')
                                <div class="error-message">{{ $message }}</div>
                            @enderror
                        </div>

                        <!-- Email -->
                        <div class="form-group">
                            <label for="email" class="form-label">
                                <span class="iconify me-2" data-icon="mdi:email"></span>{{__('Email Address')}}
                                <span class="required">*</span>
                            </label>
                            <input type="email" class="form-input @error('email') error @enderror" 
                                   id="email" name="email" value="{{ old('email', $user->email) }}" required>
                            @error('email')
                                <div class="error-message">{{ $message }}</div>
                            @enderror
                        </div>

                        <!-- Phone Number -->
                        <div class="form-group">
                            <label for="phone_number" class="form-label">
                                <span class="iconify me-2" data-icon="mdi:phone"></span>{{__('Phone Number')}}
                            </label>
                            <input type="text" class="form-input @error('phone_number') error @enderror" 
                                   id="phone_number" name="phone_number" value="{{ old('phone_number', $user->phone_number) }}">
                            @error('phone_number')
                                <div class="error-message">{{ $message }}</div>
                            @enderror
                        </div>

                        <!-- Organization ID (if applicable) -->
                        @if($user->organization_id)
                        <div class="form-group">
                            <label class="form-label">
                                <span class="iconify me-2" data-icon="mdi:domain"></span>{{__('Organization ID')}}
                            </label>
                            <input type="text" class="form-input" value="{{ $user->organization_id }}" readonly>
                        </div>
                        @endif
                    </div>
                </div>
            </div>

            <!-- Role & Status Card -->
            <div class="form-card">
                <div class="card-header">
                    <div class="card-icon">
                        <span class="iconify" data-icon="mdi:shield-account"></span>
                    </div>
                    <div class="card-title">
                        <h3>{{__('Role & Access')}}</h3>
                        <p>{{__('Manage user permissions and status')}}</p>
                    </div>
                </div>
                <div class="card-content">
                    <div class="form-grid">
                        <!-- Role -->
                        <div class="form-group">
                            <label for="role" class="form-label">
                                <span class="iconify me-2" data-icon="mdi:account-key"></span>{{__('Role')}}
                                <span class="required">*</span>
                            </label>
                            <select class="form-select @error('role') error @enderror" id="role" name="role" required>
                                <option value="">{{__('Select Role')}}</option>
                                @foreach($roles as $role)
                                    <option value="{{ $role->id }}" 
                                            {{ old('role', $user->organizationRoles->first()->id ?? '') == $role->id ? 'selected' : '' }}>
                                        {{ $role->name }}
                                        @if($role->description)
                                            - {{ $role->description }}
                                        @endif
                                    </option>
                                @endforeach
                            </select>
                            @error('role')
                                <div class="error-message">{{ $message }}</div>
                            @enderror
                        </div>

                        <!-- Status -->
                        <div class="form-group">
                            <label for="status" class="form-label">
                                <span class="iconify me-2" data-icon="mdi:account-check"></span>{{__('Status')}}
                                <span class="required">*</span>
                            </label>
                            <select class="form-select @error('status') error @enderror" id="status" name="status" required>
                                <option value="">{{__('Select Status')}}</option>
                                <option value="{{ STATUS_APPROVED }}" {{ old('status', $user->status) == STATUS_APPROVED ? 'selected' : '' }}>
                                    {{__('Active')}}
                                </option>
                                <option value="{{ STATUS_SUSPENDED }}" {{ old('status', $user->status) == STATUS_SUSPENDED ? 'selected' : '' }}>
                                    {{__('Suspended')}}
                                </option>
                            </select>
                            @error('status')
                                <div class="error-message">{{ $message }}</div>
                            @enderror
                        </div>
                    </div>
                </div>
            </div>

            <!-- Security Card -->
            <div class="form-card">
                <div class="card-header">
                    <div class="card-icon">
                        <span class="iconify" data-icon="mdi:lock"></span>
                    </div>
                    <div class="card-title">
                        <h3>{{__('Security')}}</h3>
                        <p>{{__('Update user password')}}</p>
                    </div>
                </div>
                <div class="card-content">
                    <div class="form-grid">
                        <!-- New Password -->
                        <div class="form-group">
                            <label for="password" class="form-label">
                                <span class="iconify me-2" data-icon="mdi:key"></span>{{__('New Password')}}
                            </label>
                            <input type="password" class="form-input @error('password') error @enderror" 
                                   id="password" name="password">
                            <div class="form-help">{{__('Leave blank to keep current password')}}</div>
                            @error('password')
                                <div class="error-message">{{ $message }}</div>
                            @enderror
                        </div>

                        <!-- Confirm Password -->
                        <div class="form-group">
                            <label for="password_confirmation" class="form-label">
                                <span class="iconify me-2" data-icon="mdi:key-check"></span>{{__('Confirm New Password')}}
                            </label>
                            <input type="password" class="form-input" id="password_confirmation" name="password_confirmation">
                        </div>
                    </div>
                </div>
            </div>

            <!-- User Information Card -->
            <div class="form-card">
                <div class="card-header">
                    <div class="card-icon">
                        <span class="iconify" data-icon="mdi:information"></span>
                    </div>
                    <div class="card-title">
                        <h3>{{__('User Information')}}</h3>
                        <p>{{__('Current user details and statistics')}}</p>
                    </div>
                </div>
                <div class="card-content">
                    <div class="info-grid">
                        <div class="info-item">
                            <div class="info-label">{{__('User ID')}}</div>
                            <div class="info-value">{{ $user->id }}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">{{__('Current Role')}}</div>
                            <div class="info-value">
                                @if($user->organizationRoles->count() > 0)
                                    @foreach($user->organizationRoles as $role)
                                        <span class="role-badge">{{ $role->name }}</span>
                                    @endforeach
                                @else
                                    <span class="role-badge no-role">{{__('No Role')}}</span>
                                @endif
                            </div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">{{__('Email Verified')}}</div>
                            <div class="info-value">
                                @if($user->email_verified_at)
                                    <span class="status-badge status-active">{{__('Verified')}}</span>
                                @else
                                    <span class="status-badge status-suspended">{{__('Not Verified')}}</span>
                                @endif
                            </div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">{{__('Created')}}</div>
                            <div class="info-value">{{ $user->created_at->format('M d, Y H:i') }}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">{{__('Last Updated')}}</div>
                            <div class="info-value">{{ $user->updated_at->format('M d, Y H:i') }}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">{{__('Last Login')}}</div>
                            <div class="info-value">
                                @if($user->last_login_at)
                                    {{ $user->last_login_at->format('M d, Y H:i') }}
                                @else
                                    {{__('Never')}}
                                @endif
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Action Buttons -->
            <div class="form-actions">
                <a href="{{ route('organization.user-management.index') }}" class="btn-cancel">
                    <span class="iconify me-2" data-icon="mdi:close"></span>{{__('Cancel')}}
                </a>
                <button type="submit" class="btn-save">
                    <span class="iconify me-2" data-icon="mdi:content-save"></span>{{__('Update User')}}
                </button>
            </div>
        </form>
    </div>
</div>

<style>
/* Modern Edit User Styles */
.user-edit-container {
    background: #f8fafc;
    min-height: 100vh;
    padding: 32px;
}

.edit-header {
    background: white;
    border-radius: 16px;
    padding: 32px;
    margin-bottom: 40px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    display: flex;
    justify-content: space-between;
    align-items: center;
    border: 1px solid #e5e7eb;
}

.header-content {
    display: flex;
    align-items: flex-start;
    gap: 32px;
    flex: 1;
}

.user-profile-section {
    display: flex;
    align-items: flex-start;
    gap: 24px;
    flex: 1;
}

.user-avatar {
    width: 100px;
    height: 100px;
    border-radius: 50%;
    background: linear-gradient(135deg, {{ $organization_colors['primary'] ?? '#3b82f6' }} 0%, {{ $organization_colors['accent'] ?? '#1d4ed8' }} 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 28px;
    font-weight: 700;
    overflow: hidden;
    border: 4px solid white;
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    flex-shrink: 0;
}

.avatar-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 50%;
}

.avatar-circle {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.avatar-text {
    font-size: 28px;
    font-weight: 700;
    color: white;
}

.user-details {
    display: flex;
    flex-direction: column;
    gap: 12px;
    flex: 1;
    min-width: 0;
}

.user-name-section {
    display: flex;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
}

.status-label {
    display: inline-flex;
    align-items: center;
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 14px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.status-label.status-active {
    background: #dcfce7;
    color: #166534;
    border: 1px solid #bbf7d0;
}

.status-label.status-suspended {
    background: #fef2f2;
    color: #dc2626;
    border: 1px solid #fecaca;
}

.user-name {
    font-size: 32px;
    font-weight: 700;
    color: #1f2937;
    margin: 0;
    line-height: 1.2;
    word-break: break-word;
}

.user-email {
    color: #6b7280;
    font-size: 18px;
    margin: 0;
    line-height: 1.4;
    word-break: break-all;
}


.status-badge {
    display: inline-flex;
    align-items: center;
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 14px;
    font-weight: 500;
}

.status-active {
    background: #dcfce7;
    color: #166534;
}

.status-suspended {
    background: #fef2f2;
    color: #dc2626;
}

.back-button {
    display: inline-flex;
    align-items: center;
    padding: 12px 24px;
    background: #f3f4f6;
    color: #374151;
    text-decoration: none;
    border-radius: 8px;
    font-weight: 500;
    transition: all 0.2s;
}

.back-button:hover {
    background: #e5e7eb;
    color: #1f2937;
    text-decoration: none;
}

.edit-form-container {
    display: flex;
    flex-direction: column;
    gap: 40px;
    margin-top: 0;
}

.form-card {
    background: white;
    border-radius: 16px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    border: 1px solid #e5e7eb;
    transition: all 0.2s ease;
    margin-bottom: 8px;
}

.form-card:hover {
    box-shadow: 0 8px 25px -5px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
}

.form-card:last-child {
    margin-bottom: 0;
}

.card-header {
    background: #f8fafc;
    padding: 24px;
    border-bottom: 1px solid #e5e7eb;
    display: flex;
    align-items: center;
    gap: 16px;
}

.card-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    background: linear-gradient(135deg, {{ $organization_colors['primary'] ?? '#3b82f6' }} 0%, {{ $organization_colors['accent'] ?? '#1d4ed8' }} 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 20px;
}

.card-title h3 {
    font-size: 20px;
    font-weight: 600;
    color: #1f2937;
    margin: 0 0 4px 0;
}

.card-title p {
    color: #6b7280;
    font-size: 14px;
    margin: 0;
}

.card-content {
    padding: 32px;
}

.form-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 24px;
}

.form-group {
    display: flex;
    flex-direction: column;
    margin-bottom: 0;
}

.form-label {
    display: flex;
    align-items: center;
    font-weight: 600;
    color: #374151;
    margin-bottom: 8px;
    font-size: 14px;
    line-height: 1.4;
}

.required {
    color: #dc2626;
    margin-left: 4px;
    font-weight: 700;
}

.form-input, .form-select {
    padding: 14px 16px;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    font-size: 14px;
    transition: all 0.2s ease;
    background: white;
    line-height: 1.4;
    min-height: 48px;
}

.form-input:focus, .form-select:focus {
    outline: none;
    border-color: {{ $organization_colors['primary'] ?? '#3b82f6' }};
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    transform: translateY(-1px);
}

.form-input.error, .form-select.error {
    border-color: #dc2626;
    box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
}

.error-message {
    color: #dc2626;
    font-size: 12px;
    margin-top: 6px;
    font-weight: 500;
}

.form-help {
    color: #6b7280;
    font-size: 12px;
    margin-top: 6px;
    font-style: italic;
}

.info-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 32px;
}

.info-item {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 20px;
    background: #f8fafc;
    border-radius: 12px;
    border: 1px solid #e5e7eb;
    transition: all 0.2s ease;
}

.info-item:hover {
    background: #f1f5f9;
    border-color: {{ $organization_colors['primary'] ?? '#3b82f6' }};
}

.info-label {
    font-size: 11px;
    font-weight: 600;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 4px;
}

.info-value {
    font-size: 14px;
    color: #1f2937;
    font-weight: 500;
    line-height: 1.4;
    word-break: break-word;
}

.role-badge {
    display: inline-block;
    padding: 6px 14px;
    background: {{ $organization_colors['primary'] ?? '#3b82f6' }};
    color: white;
    border-radius: 16px;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.role-badge.no-role {
    background: #6b7280;
    opacity: 0.8;
}

.form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 16px;
    padding: 32px;
    background: #f8fafc;
    border-radius: 16px;
    margin-top: 24px;
    border: 1px solid #e5e7eb;
}

.btn-cancel {
    display: inline-flex;
    align-items: center;
    padding: 12px 24px;
    background: #f3f4f6;
    color: #374151;
    text-decoration: none;
    border-radius: 8px;
    font-weight: 500;
    transition: all 0.2s;
}

.btn-cancel:hover {
    background: #e5e7eb;
    color: #1f2937;
    text-decoration: none;
}

.btn-save {
    display: inline-flex;
    align-items: center;
    padding: 12px 24px;
    background: {{ $organization_colors['primary'] ?? '#3b82f6' }};
    color: white;
    border: none;
    border-radius: 8px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
}

.btn-save:hover {
    background: {{ $organization_colors['accent'] ?? '#1d4ed8' }};
}

/* Dark Mode Support */
[data-theme="dark"] .user-edit-container,
.dark .user-edit-container,
.dark-mode .user-edit-container,
body.dark .user-edit-container {
    background: #111827;
}

[data-theme="dark"] .edit-header,
.dark .edit-header,
.dark-mode .edit-header,
body.dark .edit-header {
    background: #1f2937;
    color: #f9fafb;
    border-color: #374151;
}

[data-theme="dark"] .user-name,
.dark .user-name,
.dark-mode .user-name,
body.dark .user-name {
    color: #f9fafb;
}

[data-theme="dark"] .user-email,
.dark .user-email,
.dark-mode .user-email,
body.dark .user-email {
    color: #9ca3af;
}

[data-theme="dark"] .form-card,
.dark .form-card,
.dark-mode .form-card,
body.dark .form-card {
    background: #1f2937;
    color: #f9fafb;
    border-color: #374151;
}

[data-theme="dark"] .card-header,
.dark .card-header,
.dark-mode .card-header,
body.dark .card-header {
    background: #374151;
    border-color: #4b5563;
}

[data-theme="dark"] .card-title h3,
.dark .card-title h3,
.dark-mode .card-title h3,
body.dark .card-title h3 {
    color: #f9fafb;
}

[data-theme="dark"] .card-title p,
.dark .card-title p,
.dark-mode .card-title p,
body.dark .card-title p {
    color: #9ca3af;
}

[data-theme="dark"] .form-input,
.dark .form-input,
.dark-mode .form-input,
body.dark .form-input,
[data-theme="dark"] .form-select,
.dark .form-select,
.dark-mode .form-select,
body.dark .form-select {
    background: #374151;
    border-color: #4b5563;
    color: #f9fafb;
}

[data-theme="dark"] .form-input:focus,
.dark .form-input:focus,
.dark-mode .form-input:focus,
body.dark .form-input:focus,
[data-theme="dark"] .form-select:focus,
.dark .form-select:focus,
.dark-mode .form-select:focus,
body.dark .form-select:focus {
    border-color: {{ $organization_colors['primary'] ?? '#3b82f6' }};
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
}

[data-theme="dark"] .form-label,
.dark .form-label,
.dark-mode .form-label,
body.dark .form-label {
    color: #d1d5db;
}

[data-theme="dark"] .info-label,
.dark .info-label,
.dark-mode .info-label,
body.dark .info-label {
    color: #9ca3af;
}

[data-theme="dark"] .info-value,
.dark .info-value,
.dark-mode .info-value,
body.dark .info-value {
    color: #f9fafb;
}

[data-theme="dark"] .info-item,
.dark .info-item,
.dark-mode .info-item,
body.dark .info-item {
    background: #374151;
    border-color: #4b5563;
}

[data-theme="dark"] .info-item:hover,
.dark .info-item:hover,
.dark-mode .info-item:hover,
body.dark .info-item:hover {
    background: #4b5563;
    border-color: {{ $organization_colors['primary'] ?? '#3b82f6' }};
}

[data-theme="dark"] .form-actions,
.dark .form-actions,
.dark-mode .form-actions,
body.dark .form-actions {
    background: #374151;
    border-color: #4b5563;
}

[data-theme="dark"] .btn-cancel,
.dark .btn-cancel,
.dark-mode .btn-cancel,
body.dark .btn-cancel {
    background: #4b5563;
    color: #d1d5db;
}

[data-theme="dark"] .btn-cancel:hover,
.dark .btn-cancel:hover,
.dark-mode .btn-cancel:hover,
body.dark .btn-cancel:hover {
    background: #6b7280;
    color: #f9fafb;
}

[data-theme="dark"] .back-button,
.dark .back-button,
.dark-mode .back-button,
body.dark .back-button {
    background: #4b5563;
    color: #d1d5db;
}

[data-theme="dark"] .back-button:hover,
.dark .back-button:hover,
.dark-mode .back-button:hover,
body.dark .back-button:hover {
    background: #6b7280;
    color: #f9fafb;
}

[data-theme="dark"] .status-label.status-active,
.dark .status-label.status-active,
.dark-mode .status-label.status-active,
body.dark .status-label.status-active {
    background: #064e3b;
    color: #6ee7b7;
    border-color: #10b981;
}

[data-theme="dark"] .status-label.status-suspended,
.dark .status-label.status-suspended,
.dark-mode .status-label.status-suspended,
body.dark .status-label.status-suspended {
    background: #7f1d1d;
    color: #fca5a5;
    border-color: #ef4444;
}

[data-theme="dark"] .status-badge.status-active,
.dark .status-badge.status-active,
.dark-mode .status-badge.status-active,
body.dark .status-badge.status-active {
    background: #064e3b;
    color: #6ee7b7;
}

[data-theme="dark"] .status-badge.status-suspended,
.dark .status-badge.status-suspended,
.dark-mode .status-badge.status-suspended,
body.dark .status-badge.status-suspended {
    background: #7f1d1d;
    color: #fca5a5;
}

/* Responsive Design */
@media (max-width: 1024px) {
    .info-grid {
        grid-template-columns: repeat(2, 1fr);
    }
}

@media (max-width: 768px) {
    .user-edit-container {
        padding: 16px;
    }
    
    .edit-header {
        flex-direction: column;
        gap: 20px;
        text-align: center;
        padding: 24px;
    }
    
    .header-content {
        flex-direction: column;
        text-align: center;
        gap: 24px;
    }
    
    .user-profile-section {
        flex-direction: column;
        align-items: center;
        text-align: center;
        gap: 16px;
    }
    
    .user-avatar {
        width: 80px;
        height: 80px;
        font-size: 24px;
    }
    
    .user-name-section {
        flex-direction: column;
        align-items: center;
        gap: 12px;
    }
    
    .status-label {
        font-size: 12px;
        padding: 6px 12px;
    }
    
    .user-name {
        font-size: 28px;
    }
    
    .user-email {
        font-size: 16px;
    }
    
    .form-grid {
        grid-template-columns: 1fr;
    }
    
    .info-grid {
        grid-template-columns: 1fr;
    }
    
    .form-actions {
        flex-direction: column;
    }
    
    .card-content {
        padding: 20px;
    }
    
    .card-header {
        padding: 20px;
    }
}

@media (max-width: 480px) {
    .user-edit-container {
        padding: 12px;
    }
    
    .edit-header {
        padding: 20px;
    }
    
    .card-content {
        padding: 16px;
    }
    
    .card-header {
        padding: 16px;
    }
}
</style>

@push('script')
<script src="https://cdn.jsdelivr.net/npm/@iconify/iconify@3.1.1/dist/iconify.min.js"></script>
<script>
    // Form validation
    document.addEventListener('DOMContentLoaded', function() {
        const form = document.querySelector('.modern-form');
        const password = document.getElementById('password');
        const passwordConfirmation = document.getElementById('password_confirmation');
        
        form.addEventListener('submit', function(e) {
            if (password.value && password.value !== passwordConfirmation.value) {
                e.preventDefault();
                passwordConfirmation.setCustomValidity('{{__("Passwords do not match")}}');
                passwordConfirmation.reportValidity();
            } else {
                passwordConfirmation.setCustomValidity('');
            }
        });
        
        // Clear custom validity when user types
        passwordConfirmation.addEventListener('input', function() {
            this.setCustomValidity('');
        });
        
        // Hide debug bar in production
        @if(config('app.debug') == false)
        const debugBar = document.querySelector('[data-turbo-permanent]');
        if (debugBar) {
            debugBar.style.display = 'none';
        }
        @endif
    });
</script>
@endpush
@endsection