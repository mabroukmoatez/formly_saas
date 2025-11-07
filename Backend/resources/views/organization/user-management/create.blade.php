@extends('layouts.organization')

@section('breadcrumb')
    <div class="page-banner-content text-center">
        <h3 class="page-banner-heading text-white pb-15">{{__('Create User')}}</h3>
        <nav aria-label="breadcrumb">
            <ol class="breadcrumb justify-content-center">
                <li class="breadcrumb-item font-14"><a href="{{route('main.index')}}">{{__('Home')}}</a></li>
                <li class="breadcrumb-item font-14"><a href="{{route('organization.dashboard')}}">{{__('Dashboard')}}</a></li>
                <li class="breadcrumb-item font-14"><a href="{{route('organization.user-management.index')}}">{{__('User Management')}}</a></li>
                <li class="breadcrumb-item font-14 active" aria-current="page">{{__('Create User')}}</li>
            </ol>
        </nav>
    </div>
@endsection

@section('content')
<div id="create-user-app" class="user-edit-container">
        <!-- Modern Header -->
    <div class="edit-header">
        <div class="header-content">
            <div class="user-profile-section">
                <div class="user-avatar">
                    <div class="avatar-circle">
                        <span class="avatar-text">+</span>
                    </div>
                </div>
                <div class="user-details">
                    <h1 class="user-name">{{__('Create New User')}}</h1>
                    <div class="user-email">{{__('Add a new user to your organization')}}</div>
                </div>
            </div>
        </div>
        <div class="header-actions">
            <a href="{{ route('organization.user-management.index') }}" class="back-button">
                <span class="iconify me-2" data-icon="mdi:arrow-left"></span>{{__('Back to Users')}}
            </a>
        </div>
    </div>

    <!-- Create Form -->
    <div class="edit-form-container">
        <form method="POST" action="{{ route('organization.user-management.store') }}" class="modern-form">
            @csrf
            
            <!-- Basic Information Card -->
            <div class="form-card">
                <div class="card-header">
                    <div class="card-icon">
                        <span class="iconify" data-icon="mdi:account-plus"></span>
                    </div>
                    <div class="card-title">
                        <h3>{{__('Basic Information')}}</h3>
                        <p>{{__('Enter user personal details')}}</p>
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
                                   id="name" name="name" value="{{ old('name') }}" required>
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
                                   id="email" name="email" value="{{ old('email') }}" required>
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
                                   id="phone_number" name="phone_number" value="{{ old('phone_number') }}">
                            @error('phone_number')
                                <div class="error-message">{{ $message }}</div>
                                    @enderror
                                </div>
                    </div>
                                    </div>
                                </div>
                                
            <!-- Password Card -->
            <div class="form-card">
                <div class="card-header">
                    <div class="card-icon">
                        <span class="iconify" data-icon="mdi:lock"></span>
                    </div>
                    <div class="card-title">
                        <h3>{{__('Password')}}</h3>
                        <p>{{__('Set user password')}}</p>
                    </div>
                </div>
                <div class="card-content">
                    <div class="form-grid">
                        <!-- Password -->
                        <div class="form-group">
                            <label for="password" class="form-label">
                                <span class="iconify me-2" data-icon="mdi:key"></span>{{__('Password')}}
                                <span class="required">*</span>
                            </label>
                            <div class="password-input-group">
                                <input :type="showPassword ? 'text' : 'password'" class="form-input @error('password') error @enderror" 
                                       id="password" name="password" v-model="password" required>
                                <button type="button" class="password-toggle" @click="togglePassword('password')">
                                    <span class="iconify" :data-icon="showPassword ? 'mdi:eye-off' : 'mdi:eye'"></span>
                                </button>
                                    </div>
                            @error('password')
                                <div class="error-message">{{ $message }}</div>
                                    @enderror
                                </div>
                                
                        <!-- Confirm Password -->
                        <div class="form-group">
                            <label for="password_confirmation" class="form-label">
                                <span class="iconify me-2" data-icon="mdi:key-check"></span>{{__('Confirm Password')}}
                                <span class="required">*</span>
                            </label>
                            <div class="password-input-group">
                                <input :type="showPasswordConfirmation ? 'text' : 'password'" class="form-input" 
                                       id="password_confirmation" name="password_confirmation" v-model="passwordConfirmation" required>
                                <button type="button" class="password-toggle" @click="togglePassword('passwordConfirmation')">
                                    <span class="iconify" :data-icon="showPasswordConfirmation ? 'mdi:eye-off' : 'mdi:eye'"></span>
                                </button>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Password Strength Indicator -->
                    <div v-if="password" class="password-strength">
                                <label class="form-label small">{{__('Password Strength')}}</label>
                        <div class="strength-bar">
                            <div class="strength-fill" :class="passwordStrengthClass" :style="{ width: passwordStrength + '%' }"></div>
                                </div>
                        <small class="strength-text">@{{ passwordStrengthText }}</small>
                            </div>
                            
                            <!-- Password Match Indicator -->
                    <div v-if="passwordConfirmation" class="password-match">
                        <div class="match-indicator">
                            <span class="iconify me-2" :class="passwordsMatch ? 'text-success' : 'text-danger'" 
                                  :data-icon="passwordsMatch ? 'mdi:check-circle' : 'mdi:close-circle'"></span>
                                    <small :class="passwordsMatch ? 'text-success' : 'text-danger'">
                                @{{ passwordsMatch ? 'Passwords match' : 'Passwords do not match' }}
                                    </small>
                        </div>
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
                        <p>{{__('Assign user role and permissions')}}</p>
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
                            <select class="form-select @error('role') error @enderror" id="role" name="role" required v-model="selectedRole" @change="updateRoleInfo">
                                <option value="">{{__('Select Role')}}</option>
                                @foreach($roles as $role)
                                    <option value="{{ $role->id }}">
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
                    </div>
                </div>
            </div>
            
                <!-- Role Information Card -->
            <div v-if="selectedRoleInfo" class="form-card">
                <div class="card-header">
                    <div class="card-icon">
                        <span class="iconify" data-icon="mdi:information"></span>
                    </div>
                    <div class="card-title">
                        <h3>{{__('Role Information')}}</h3>
                        <p>{{__('Selected role details and permissions')}}</p>
                                </div>
                            </div>
                <div class="card-content">
                    <div class="role-info">
                        <div class="role-header">
                            <div class="role-icon">
                                <span class="iconify" data-icon="mdi:account-key"></span>
                            </div>
                            <div class="role-details">
                                <h4>@{{ selectedRoleInfo.name }}</h4>
                                <p>@{{ selectedRoleInfo.description }}</p>
                            </div>
                        </div>
                        <div class="role-stats">
                            <div class="stat-item">
                                <span class="stat-label">{{__('Permissions')}}</span>
                                <span class="stat-value">@{{ selectedRoleInfo.permissions }} {{__('permissions')}}</span>
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
                <button type="submit" class="btn-save" :disabled="!isFormValid">
                    <span class="iconify me-2" data-icon="mdi:account-plus"></span>{{__('Create User')}}
                </button>
            </div>
        </form>
    </div>
</div>

@push('styles')
<link href="https://cdn.jsdelivr.net/npm/@iconify/iconify@3.1.1/dist/iconify.min.js" rel="stylesheet">
@endpush

@push('script')
<script src="https://cdn.jsdelivr.net/npm/@iconify/iconify@3.1.1/dist/iconify.min.js"></script>
<script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
<script>
const { createApp } = Vue;

createApp({
    data() {
        return {
            password: '',
            passwordConfirmation: '',
            selectedRole: '',
            selectedRoleInfo: null,
            showPassword: false,
            showPasswordConfirmation: false,
            roles: @json($roles)
        }
    },
    computed: {
        passwordStrength() {
            if (!this.password) return 0;
            
            let strength = 0;
            if (this.password.length >= 8) strength += 20;
            if (this.password.length >= 12) strength += 20;
            if (/[a-z]/.test(this.password)) strength += 20;
            if (/[A-Z]/.test(this.password)) strength += 20;
            if (/[0-9]/.test(this.password)) strength += 10;
            if (/[^A-Za-z0-9]/.test(this.password)) strength += 10;
            
            return Math.min(strength, 100);
        },
        passwordStrengthClass() {
            if (this.passwordStrength < 40) return 'strength-weak';
            if (this.passwordStrength < 70) return 'strength-medium';
            return 'strength-strong';
        },
        passwordStrengthText() {
            if (this.passwordStrength < 40) return '{{__("Weak password")}}';
            if (this.passwordStrength < 70) return '{{__("Medium password")}}';
            return '{{__("Strong password")}}';
        },
        passwordsMatch() {
            return this.password && this.passwordConfirmation && this.password === this.passwordConfirmation;
        },
        isFormValid() {
            return this.password && this.passwordConfirmation && this.passwordsMatch && this.selectedRole;
        }
    },
    methods: {
        togglePassword(field) {
            if (field === 'password') {
                this.showPassword = !this.showPassword;
            } else {
                this.showPasswordConfirmation = !this.showPasswordConfirmation;
            }
        },
        updateRoleInfo() {
            if (this.selectedRole) {
                const role = this.roles.find(r => r.id == this.selectedRole);
                if (role) {
                    this.selectedRoleInfo = {
                        name: role.name,
                        description: role.description || '{{__("No description available")}}',
                        permissions: role.permissions ? role.permissions.length : 0
                    };
                }
            } else {
                this.selectedRoleInfo = null;
            }
        }
    },
    watch: {
        selectedRole() {
            this.updateRoleInfo();
        }
    }
}).mount('#create-user-app');
</script>

<style>
/* Modern Create User Styles - Same as Edit User */
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

.password-input-group {
    position: relative;
    display: flex;
    align-items: center;
}

.password-toggle {
    position: absolute;
    right: 12px;
    background: none;
    border: none;
    color: #6b7280;
    cursor: pointer;
    padding: 8px;
    border-radius: 4px;
    transition: all 0.2s;
}

.password-toggle:hover {
    background: #f3f4f6;
    color: #374151;
}

.password-strength {
    margin-top: 16px;
    padding: 16px;
    background: #f8fafc;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
}

.strength-bar {
    height: 6px;
    background: #e5e7eb;
    border-radius: 3px;
    overflow: hidden;
    margin: 8px 0;
}

.strength-fill {
    height: 100%;
    transition: all 0.3s ease;
    border-radius: 3px;
}

.strength-weak {
    background: #dc2626;
}

.strength-medium {
    background: #f59e0b;
}

.strength-strong {
    background: #10b981;
}

.strength-text {
    color: #6b7280;
    font-size: 12px;
    font-weight: 500;
}

.password-match {
    margin-top: 16px;
    padding: 16px;
    background: #f8fafc;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
}

.match-indicator {
    display: flex;
    align-items: center;
}

.role-info {
    padding: 20px;
    background: #f8fafc;
    border-radius: 12px;
    border: 1px solid #e5e7eb;
}

.role-header {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 20px;
}

.role-icon {
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

.role-details h4 {
    font-size: 18px;
    font-weight: 600;
    color: #1f2937;
    margin: 0 0 4px 0;
}

.role-details p {
    color: #6b7280;
    font-size: 14px;
    margin: 0;
}

.role-stats {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.stat-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.stat-label {
    font-size: 12px;
    font-weight: 600;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.stat-value {
    font-size: 14px;
    color: #1f2937;
    font-weight: 600;
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

.btn-save:hover:not(:disabled) {
    background: {{ $organization_colors['accent'] ?? '#1d4ed8' }};
}

.btn-save:disabled {
    opacity: 0.6;
    cursor: not-allowed;
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

[data-theme="dark"] .password-strength,
.dark .password-strength,
.dark-mode .password-strength,
body.dark .password-strength {
    background: #374151;
    border-color: #4b5563;
}

[data-theme="dark"] .password-match,
.dark .password-match,
.dark-mode .password-match,
body.dark .password-match {
    background: #374151;
    border-color: #4b5563;
}

[data-theme="dark"] .strength-text,
.dark .strength-text,
.dark-mode .strength-text,
body.dark .strength-text {
    color: #9ca3af;
}

[data-theme="dark"] .role-info,
.dark .role-info,
.dark-mode .role-info,
body.dark .role-info {
    background: #374151;
    border-color: #4b5563;
}

[data-theme="dark"] .role-details h4,
.dark .role-details h4,
.dark-mode .role-details h4,
body.dark .role-details h4 {
    color: #f9fafb;
}

[data-theme="dark"] .role-details p,
.dark .role-details p,
.dark-mode .role-details p,
body.dark .role-details p {
    color: #9ca3af;
}

[data-theme="dark"] .stat-label,
.dark .stat-label,
.dark-mode .stat-label,
body.dark .stat-label {
    color: #9ca3af;
}

[data-theme="dark"] .stat-value,
.dark .stat-value,
.dark-mode .stat-value,
body.dark .stat-value {
    color: #f9fafb;
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

[data-theme="dark"] .password-toggle,
.dark .password-toggle,
.dark-mode .password-toggle,
body.dark .password-toggle {
    color: #9ca3af;
}

[data-theme="dark"] .password-toggle:hover,
.dark .password-toggle:hover,
.dark-mode .password-toggle:hover,
body.dark .password-toggle:hover {
    background: #4b5563;
    color: #d1d5db;
}

/* Responsive Design */
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
    
    .user-name {
        font-size: 28px;
    }
    
    .user-email {
        font-size: 16px;
    }
    
    .form-grid {
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
</style>
@endpush
@endsection