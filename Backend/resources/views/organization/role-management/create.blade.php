@extends('layouts.organization')

@push('styles')
<link href="https://cdn.jsdelivr.net/npm/@iconify/iconify@3.1.1/dist/iconify.min.js" rel="stylesheet">
@endpush

@section('breadcrumb')
    <div class="page-banner-content text-center">
        <h3 class="page-banner-heading text-white pb-15">{{__('Create Role')}}</h3>
        <nav aria-label="breadcrumb">
            <ol class="breadcrumb justify-content-center">
                <li class="breadcrumb-item font-14"><a href="{{route('main.index')}}">{{__('Home')}}</a></li>
                <li class="breadcrumb-item font-14"><a href="{{route('organization.dashboard')}}">{{__('Dashboard')}}</a></li>
                <li class="breadcrumb-item font-14"><a href="{{route('organization.role-management.index')}}">{{__('Role Management')}}</a></li>
                <li class="breadcrumb-item font-14 active" aria-current="page">{{__('Create Role')}}</li>
            </ol>
        </nav>
    </div>
@endsection

@section('content')
<div id="create-role-app" class="user-edit-container">
    <!-- Modern Header -->
    <div class="edit-header">
        <div class="header-content">
            <div class="header-info">
                <h1 class="page-title">{{__('Create New Role')}}</h1>
                <p class="page-description">{{__('Add a new role to your organization with specific permissions')}}</p>
            </div>
            <div class="header-actions">
                <a href="{{ route('organization.role-management.index') }}" class="back-button">
                    <span class="iconify me-2" data-icon="mdi:arrow-left"></span>{{__('Back to Roles')}}
                    </a>
                </div>
            </div>
        </div>

    <!-- Form Container -->
    <div class="form-container">
        <form method="POST" action="{{ route('organization.role-management.store') }}" class="role-form">
                            @csrf
                            
            <!-- Basic Information Card -->
            <div class="form-card">
                <div class="card-header">
                    <div class="header-icon">
                        <span class="iconify" data-icon="mdi:account-key"></span>
                    </div>
                    <div class="header-content">
                        <h3 class="card-title">{{__('Basic Information')}}</h3>
                        <p class="card-description">{{__('Enter role basic details')}}</p>
                    </div>
                </div>
                <div class="card-body">
                            <div class="row">
                        <div class="col-md-6">
                            <div class="form-group">
                                <label for="name" class="form-label">
                                    {{__('Role Name')}} <span class="required">*</span>
                                </label>
                                <input type="text" 
                                       class="form-control @error('name') is-invalid @enderror" 
                                       id="name" 
                                       name="name" 
                                       value="{{ old('name') }}" 
                                       placeholder="{{__('Enter role name')}}"
                                       required>
                                    @error('name')
                                        <div class="invalid-feedback">{{ $message }}</div>
                                    @enderror
                                </div>
                        </div>
                        <div class="col-md-6">
                            <div class="form-group">
                                    <label for="description" class="form-label">{{__('Description')}}</label>
                                <input type="text" 
                                       class="form-control @error('description') is-invalid @enderror" 
                                       id="description" 
                                       name="description" 
                                       value="{{ old('description') }}"
                                       placeholder="{{__('Enter role description')}}">
                                    @error('description')
                                        <div class="invalid-feedback">{{ $message }}</div>
                                    @enderror
                            </div>
                        </div>
                    </div>
                                </div>
                            </div>

            <!-- Permissions Card -->
            <div class="form-card">
                                            <div class="card-header">
                    <div class="header-icon">
                        <span class="iconify" data-icon="mdi:shield-account"></span>
                    </div>
                    <div class="header-content">
                        <h3 class="card-title">{{__('Permissions')}}</h3>
                        <p class="card-description">{{__('Select the permissions for this role')}}</p>
                    </div>
                                            </div>
                                            <div class="card-body">
                    @foreach($categories as $categoryKey => $categoryName)
                        <div class="permission-category">
                            <div class="category-header">
                                <h4 class="category-title">{{ $categoryName }}</h4>
                                <div class="category-actions">
                                    <button type="button" class="select-all-btn" onclick="selectAllInCategory('{{ $categoryKey }}')">
                                        {{__('Select All')}}
                                    </button>
                                    <button type="button" class="deselect-all-btn" onclick="deselectAllInCategory('{{ $categoryKey }}')">
                                        {{__('Deselect All')}}
                                    </button>
                                </div>
                            </div>
                            <div class="permissions-grid">
                                                    @if(isset($permissions[$categoryKey]))
                                                        @foreach($permissions[$categoryKey] as $permission)
                                        <div class="permission-item">
                                            <div class="permission-checkbox">
                                                <input type="checkbox" 
                                                       name="permissions[]" 
                                                       value="{{ $permission->name }}" 
                                                                           id="permission_{{ $permission->id }}"
                                                       class="permission-input"
                                                       data-category="{{ $categoryKey }}"
                                                                           {{ in_array($permission->name, old('permissions', [])) ? 'checked' : '' }}>
                                                <label for="permission_{{ $permission->id }}" class="permission-label">
                                                    <div class="permission-icon">
                                                        <span class="iconify" data-icon="mdi:check"></span>
                                                    </div>
                                                                    </label>
                                                                </div>
                                            <div class="permission-content">
                                                <div class="permission-name">{{ $permission->display_name }}</div>
                                                @if($permission->description)
                                                    <div class="permission-description">{{ $permission->description }}</div>
                                                @endif
                                                                </div>
                                                            </div>
                                                        @endforeach
                                                    @endif
                                            </div>
                                        </div>
                                    @endforeach
                                </div>
                            </div>

            <!-- Form Actions -->
            <div class="form-actions">
                <div class="action-buttons">
                    <a href="{{ route('organization.role-management.index') }}" class="btn btn-cancel">
                        <span class="iconify me-2" data-icon="mdi:close"></span>{{__('Cancel')}}
                                        </a>
                                        <button type="submit" class="btn btn-primary">
                        <span class="iconify me-2" data-icon="mdi:check"></span>{{__('Create Role')}}
                                        </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>

@push('script')
<script src="https://cdn.jsdelivr.net/npm/@iconify/iconify@3.1.1/dist/iconify.min.js"></script>
<script>
function selectAllInCategory(categoryKey) {
    const checkboxes = document.querySelectorAll(`input[data-category="${categoryKey}"]`);
    checkboxes.forEach(checkbox => {
        checkbox.checked = true;
    });
}

function deselectAllInCategory(categoryKey) {
    const checkboxes = document.querySelectorAll(`input[data-category="${categoryKey}"]`);
    checkboxes.forEach(checkbox => {
        checkbox.checked = false;
    });
}
</script>

<style>
/* Create Role Styles - Same as User Management */
.user-edit-container {
    background: #f8fafc;
    min-height: 100vh;
    padding: 32px;
}

.edit-header {
    background: white;
    border-radius: 16px;
    padding: 32px;
    margin-bottom: 32px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    border: 1px solid #e5e7eb;
}

.header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 24px;
}

.header-info {
    flex: 1;
}

.page-title {
    font-size: 32px;
    font-weight: 700;
    color: #1f2937;
    margin: 0 0 8px 0;
}

.page-description {
    color: #6b7280;
    font-size: 16px;
    margin: 0;
}

.header-actions {
    display: flex;
    align-items: center;
    gap: 16px;
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
    border: 1px solid #d1d5db;
}

.back-button:hover {
    background: #e5e7eb;
    color: #374151;
    text-decoration: none;
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.form-container {
    max-width: 1200px;
    margin: 0 auto;
}

.role-form {
    display: flex;
    flex-direction: column;
    gap: 24px;
}

.form-card {
    background: white;
    border-radius: 16px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    border: 1px solid #e5e7eb;
    overflow: hidden;
}

.card-header {
    background: linear-gradient(135deg, {{ $organization_colors['primary'] ?? '#3b82f6' }} 0%, {{ $organization_colors['accent'] ?? '#1d4ed8' }} 100%);
    color: white;
    padding: 24px;
    display: flex;
    align-items: center;
    gap: 16px;
}

.header-icon {
    width: 48px;
    height: 48px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
}

.header-content {
    flex: 1;
}

.card-title {
    font-size: 20px;
    font-weight: 600;
    margin: 0 0 4px 0;
}

.card-description {
    font-size: 14px;
    margin: 0;
    opacity: 0.9;
}

.card-body {
    padding: 32px;
}

.form-group {
    margin-bottom: 24px;
}

.form-label {
    display: block;
    font-weight: 600;
    color: #374151;
    margin-bottom: 8px;
    font-size: 14px;
}

.required {
    color: #ef4444;
}

.form-control {
    width: 100%;
    padding: 12px 16px;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    font-size: 14px;
    transition: all 0.2s;
    background: white;
}

.form-control:focus {
    outline: none;
    border-color: {{ $organization_colors['primary'] ?? '#3b82f6' }};
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-control.is-invalid {
    border-color: #ef4444;
}

.invalid-feedback {
    display: block;
    color: #ef4444;
    font-size: 12px;
    margin-top: 4px;
}

/* Permissions Styles */
.permission-category {
    margin-bottom: 32px;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    overflow: hidden;
}

.category-header {
    background: #f8fafc;
    padding: 16px 20px;
    border-bottom: 1px solid #e5e7eb;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.category-title {
    font-size: 16px;
    font-weight: 600;
    color: #1f2937;
    margin: 0;
}

.category-actions {
    display: flex;
    gap: 8px;
}

.select-all-btn, .deselect-all-btn {
    padding: 6px 12px;
    border: 1px solid #d1d5db;
    background: white;
    color: #374151;
    border-radius: 6px;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s;
}

.select-all-btn:hover {
    background: {{ $organization_colors['primary'] ?? '#3b82f6' }};
    color: white;
    border-color: {{ $organization_colors['primary'] ?? '#3b82f6' }};
}

.deselect-all-btn:hover {
    background: #ef4444;
    color: white;
    border-color: #ef4444;
}

.permissions-grid {
    padding: 20px;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 16px;
}

.permission-item {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 16px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    transition: all 0.2s;
}

.permission-item:hover {
    background: #f8fafc;
    border-color: {{ $organization_colors['primary'] ?? '#3b82f6' }};
}

.permission-checkbox {
    position: relative;
    flex-shrink: 0;
}

.permission-input {
    position: absolute;
    opacity: 0;
    cursor: pointer;
}

.permission-label {
    display: block;
    cursor: pointer;
}

.permission-icon {
    width: 20px;
    height: 20px;
    border: 2px solid #d1d5db;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    background: white;
}

.permission-icon .iconify {
    font-size: 12px;
    color: white;
    opacity: 0;
    transition: opacity 0.2s;
}

.permission-input:checked + .permission-label .permission-icon {
    background: {{ $organization_colors['primary'] ?? '#3b82f6' }};
    border-color: {{ $organization_colors['primary'] ?? '#3b82f6' }};
}

.permission-input:checked + .permission-label .permission-icon .iconify {
    opacity: 1;
}

.permission-content {
    flex: 1;
}

.permission-name {
    font-weight: 600;
    color: #1f2937;
    font-size: 14px;
    margin-bottom: 4px;
}

.permission-description {
    color: #6b7280;
    font-size: 12px;
    line-height: 1.4;
}

/* Form Actions */
.form-actions {
    background: white;
    border-radius: 16px;
    padding: 24px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    border: 1px solid #e5e7eb;
}

.action-buttons {
    display: flex;
    justify-content: flex-end;
    gap: 16px;
}

.btn {
    display: inline-flex;
    align-items: center;
    padding: 12px 24px;
    border-radius: 8px;
    font-weight: 500;
    text-decoration: none;
    transition: all 0.2s;
    border: none;
    cursor: pointer;
    font-size: 14px;
}

.btn-cancel {
    background: #f3f4f6;
    color: #374151;
    border: 1px solid #d1d5db;
}

.btn-cancel:hover {
    background: #e5e7eb;
    color: #374151;
    text-decoration: none;
}

.btn-primary {
    background: {{ $organization_colors['primary'] ?? '#3b82f6' }};
    color: white;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.btn-primary:hover {
    background: {{ $organization_colors['accent'] ?? '#1d4ed8' }};
    color: white;
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

/* Responsive Design */
@media (max-width: 768px) {
    .user-edit-container {
        padding: 16px;
    }
    
    .edit-header {
        padding: 24px;
    }
    
    .header-content {
        flex-direction: column;
        align-items: flex-start;
        gap: 16px;
    }
    
    .page-title {
        font-size: 28px;
    }
    
    .card-body {
        padding: 20px;
    }
    
    .permissions-grid {
        grid-template-columns: 1fr;
        padding: 16px;
    }
    
    .category-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
    }
    
    .category-actions {
        width: 100%;
        justify-content: space-between;
    }
    
    .action-buttons {
        flex-direction: column;
    }
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
    border-color: #374151;
}

[data-theme="dark"] .page-title,
.dark .page-title,
.dark-mode .page-title,
body.dark .page-title {
    color: #f9fafb;
}

[data-theme="dark"] .page-description,
.dark .page-description,
.dark-mode .page-description,
body.dark .page-description {
    color: #9ca3af;
}

[data-theme="dark"] .form-card,
.dark .form-card,
.dark-mode .form-card,
body.dark .form-card {
    background: #1f2937;
    border-color: #374151;
}

[data-theme="dark"] .form-control,
.dark .form-control,
.dark-mode .form-control,
body.dark .form-control {
    background: #374151;
    border-color: #4b5563;
    color: #f9fafb;
}

[data-theme="dark"] .form-label,
.dark .form-label,
.dark-mode .form-label,
body.dark .form-label {
    color: #f9fafb;
}

[data-theme="dark"] .permission-category,
.dark .permission-category,
.dark-mode .permission-category,
body.dark .permission-category {
    border-color: #4b5563;
}

[data-theme="dark"] .category-header,
.dark .category-header,
.dark-mode .category-header,
body.dark .category-header {
    background: #374151;
    border-color: #4b5563;
}

[data-theme="dark"] .category-title,
.dark .category-title,
.dark-mode .category-title,
body.dark .category-title {
    color: #f9fafb;
}

[data-theme="dark"] .permission-item,
.dark .permission-item,
.dark-mode .permission-item,
body.dark .permission-item {
    background: #1f2937;
    border-color: #4b5563;
}

[data-theme="dark"] .permission-name,
.dark .permission-name,
.dark-mode .permission-name,
body.dark .permission-name {
    color: #f9fafb;
}

[data-theme="dark"] .permission-description,
.dark .permission-description,
.dark-mode .permission-description,
body.dark .permission-description {
    color: #9ca3af;
}

[data-theme="dark"] .form-actions,
.dark .form-actions,
.dark-mode .form-actions,
body.dark .form-actions {
    background: #1f2937;
    border-color: #374151;
}
</style>
@endpush
@endsection
