@extends('layouts.organization')

@push('styles')
<link href="https://cdn.jsdelivr.net/npm/@iconify/iconify@3.1.1/dist/iconify.min.js" rel="stylesheet">
@endpush

@section('breadcrumb')
    <div class="page-banner-content text-center">
        <h3 class="page-banner-heading text-white pb-15">{{__('Role Management')}}</h3>
        <nav aria-label="breadcrumb">
            <ol class="breadcrumb justify-content-center">
                <li class="breadcrumb-item font-14"><a href="{{route('main.index')}}">{{__('Home')}}</a></li>
                <li class="breadcrumb-item font-14"><a href="{{route('organization.dashboard')}}">{{__('Dashboard')}}</a></li>
                <li class="breadcrumb-item font-14 active" aria-current="page">{{__('Role Management')}}</li>
            </ol>
        </nav>
    </div>
@endsection

@section('content')
<div id="role-management-app" class="user-management-container">
    <!-- Modern Header -->
    <div class="management-header">
        <div class="header-content">
            <div class="header-info">
                <h1 class="page-title">{{__('Role Management')}}</h1>
                <p class="page-description">{{__('Manage user roles and permissions for your organization')}}</p>
            </div>
            <div class="header-actions">
                <a href="{{ route('organization.role-management.create') }}" class="create-button">
                    <span class="iconify me-2" data-icon="mdi:plus"></span>{{__('Create New Role')}}
                    </a>
                </div>
            </div>
        </div>

    <!-- View Toggle -->
    <div class="view-controls">
        <div class="view-toggle">
            <button class="toggle-btn" :class="{ 'active': viewMode === 'table' }" @click="viewMode = 'table'">
                <span class="iconify me-1" data-icon="mdi:table"></span>{{__('Table View')}}
            </button>
            <button class="toggle-btn" :class="{ 'active': viewMode === 'grid' }" @click="viewMode = 'grid'">
                <span class="iconify me-1" data-icon="mdi:view-grid"></span>{{__('Grid View')}}
            </button>
        </div>
    </div>

    <!-- Roles Container -->
    <div class="roles-container">
                        @if($roles->count() > 0)
            <!-- Table View -->
            <div v-if="viewMode === 'table'" class="table-view">
                <table class="roles-table">
                                    <thead>
                                        <tr>
                            <th class="checkbox-column">
                                <input type="checkbox" v-model="selectAll" @change="toggleSelectAll" class="table-checkbox">
                            </th>
                            <th class="name-column">{{__('Role Name')}}</th>
                            <th class="description-column">{{__('Description')}}</th>
                            <th class="permissions-column">{{__('Permissions')}}</th>
                            <th class="users-column">{{__('Users')}}</th>
                            <th class="actions-column">{{__('Actions')}}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        @foreach($roles as $role)
                            <tr class="role-row" :class="{ 'selected': selectedRoles.includes({{ $role->id }}) }">
                                <td class="checkbox-cell">
                                    <input type="checkbox" :value="{{ $role->id }}" v-model="selectedRoles" class="table-checkbox">
                                </td>
                                <td class="name-cell">
                                    <div class="role-info">
                                        <div class="role-avatar">
                                            <span class="iconify" data-icon="mdi:account-key"></span>
                                                        </div>
                                        <div class="role-details">
                                            <div class="role-name">{{ $role->name }}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                <td class="description-cell">
                                    <span class="role-description">{{ $role->description ?? __('No description') }}</span>
                                                </td>
                                <td class="permissions-cell">
                                    <span class="permissions-badge">{{ count($role->permissions) }} {{__('permissions')}}</span>
                                                </td>
                                <td class="users-cell">
                                    <span class="users-badge">{{ $role->users->count() }} {{__('users')}}</span>
                                                </td>
                                <td class="actions-cell">
                                    <div class="action-buttons">
                                        <button class="action-btn action-edit" @click="editRole({{ $role->id }})" title="{{__('Edit')}}">
                                            <span class="iconify" data-icon="mdi:pencil"></span>
                                        </button>
                                                        @if($role->users->count() == 0)
                                            <button class="action-btn action-delete" @click="deleteRole({{ $role->id }})" title="{{__('Delete')}}">
                                                <span class="iconify" data-icon="mdi:delete"></span>
                                                                </button>
                                                        @else
                                            <button class="action-btn action-disabled" disabled title="{{__('Cannot delete role with assigned users')}}">
                                                <span class="iconify" data-icon="mdi:delete"></span>
                                                            </button>
                                                        @endif
                                                    </div>
                                                </td>
                                            </tr>
                                        @endforeach
                                    </tbody>
                                </table>
                            </div>
            
            <!-- Grid View -->
            <div v-if="viewMode === 'grid'" class="grid-view">
                <div class="roles-grid">
                    @foreach($roles as $role)
                        <div class="role-card">
                            <div class="role-card-header">
                                <div class="role-avatar">
                                    <span class="iconify" data-icon="mdi:account-key"></span>
                                </div>
                            </div>
                            <div class="role-card-body">
                                <div class="role-name">{{ $role->name }}</div>
                                <div class="role-description">{{ $role->description ?? __('No description') }}</div>
                                <div class="role-stats">
                                    <div class="stat-item">
                                        <span class="stat-label">{{__('Permissions')}}</span>
                                        <span class="stat-value">{{ count($role->permissions) }}</span>
                                    </div>
                                    <div class="stat-item">
                                        <span class="stat-label">{{__('Users')}}</span>
                                        <span class="stat-value">{{ $role->users->count() }}</span>
                                    </div>
                                </div>
                            </div>
                            <div class="role-card-actions">
                                <button class="action-button action-edit" @click="editRole({{ $role->id }})">
                                    <span class="iconify me-1" data-icon="mdi:pencil"></span>{{__('Edit')}}
                                </button>
                                @if($role->users->count() == 0)
                                    <button class="action-button action-danger" @click="deleteRole({{ $role->id }})">
                                        <span class="iconify me-1" data-icon="mdi:delete"></span>{{__('Delete')}}
                                    </button>
                                @else
                                    <button class="action-button action-disabled" disabled>
                                        <span class="iconify me-1" data-icon="mdi:delete"></span>{{__('Delete')}}
                                    </button>
                                @endif
                            </div>
                        </div>
                    @endforeach
                </div>
                            </div>
                        @else
            <!-- Empty State -->
            <div class="empty-state">
                <div class="empty-icon">
                    <span class="iconify" data-icon="mdi:account-key"></span>
                                </div>
                <h3 class="empty-title">{{__('No Roles Found')}}</h3>
                <p class="empty-description">{{__('Start by creating your first role to manage user permissions.')}}</p>
                <a href="{{ route('organization.role-management.create') }}" class="create-button">
                    <span class="iconify me-2" data-icon="mdi:plus"></span>{{__('Create First Role')}}
                                </a>
                            </div>
                        @endif
                    </div>
                </div>

@push('script')
<script src="https://cdn.jsdelivr.net/npm/@iconify/iconify@3.1.1/dist/iconify.min.js"></script>
<script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
<script>
const { createApp } = Vue;

createApp({
    data() {
        return {
            viewMode: 'table',
            selectedRoles: [],
            selectAll: false
        }
    },
    methods: {
        toggleSelectAll() {
            if (this.selectAll) {
                this.selectedRoles = @json($roles->pluck('id'));
            } else {
                this.selectedRoles = [];
            }
        },
        editRole(roleId) {
            window.location.href = `/organization/role-management/${roleId}/edit`;
        },
        deleteRole(roleId) {
            if (confirm('{{__("Are you sure you want to delete this role?")}}')) {
                // Create and submit form
                const form = document.createElement('form');
                form.method = 'POST';
                form.action = `/organization/role-management/${roleId}`;
                
                const csrfToken = document.createElement('input');
                csrfToken.type = 'hidden';
                csrfToken.name = '_token';
                csrfToken.value = '{{ csrf_token() }}';
                
                const methodField = document.createElement('input');
                methodField.type = 'hidden';
                methodField.name = '_method';
                methodField.value = 'DELETE';
                
                form.appendChild(csrfToken);
                form.appendChild(methodField);
                document.body.appendChild(form);
                form.submit();
            }
        }
    },
    watch: {
        selectedRoles() {
            this.selectAll = this.selectedRoles.length === @json($roles->count());
        }
    }
}).mount('#role-management-app');
</script>

<style>
/* Role Management Styles - Same as User Management */
.user-management-container {
    background: #f8fafc;
    min-height: 100vh;
    padding: 32px;
}

.management-header {
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

.create-button {
    display: inline-flex;
    align-items: center;
    padding: 12px 24px;
    background: {{ $organization_colors['primary'] ?? '#3b82f6' }};
    color: white;
    text-decoration: none;
    border-radius: 8px;
    font-weight: 500;
    transition: all 0.2s;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.create-button:hover {
    background: {{ $organization_colors['accent'] ?? '#1d4ed8' }};
    color: white;
    text-decoration: none;
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.view-controls {
    margin-bottom: 24px;
}

.view-toggle {
    display: flex;
    background: white;
    border-radius: 8px;
    padding: 4px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    border: 1px solid #e5e7eb;
}

.toggle-btn {
    flex: 1;
    padding: 8px 16px;
    border: none;
    background: transparent;
    color: #6b7280;
    font-weight: 500;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
}

.toggle-btn.active {
    background: {{ $organization_colors['primary'] ?? '#3b82f6' }};
    color: white;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.roles-container {
    margin-bottom: 24px;
}

.table-view {
    overflow-x: auto;
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    border: 1px solid #e5e7eb;
}

.grid-view {
    margin-top: 20px;
}

.roles-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 20px;
}

.role-card {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 20px;
    transition: all 0.3s ease;
    position: relative;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.role-card:hover {
    box-shadow: 0 8px 25px -5px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
}

.role-card.selected {
    border-color: {{ $organization_colors['primary'] ?? '#3b82f6' }};
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.role-card-header {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 16px;
}

.role-card-body {
    margin-bottom: 16px;
}

.role-card .role-name {
    font-size: 18px;
    font-weight: 600;
    color: #1f2937;
    margin: 0 0 8px 0;
}

.role-card .role-description {
    font-size: 14px;
    color: #6b7280;
    margin: 0 0 12px 0;
    line-height: 1.4;
}

.role-stats {
    display: flex;
    gap: 16px;
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
    font-size: 16px;
    color: #1f2937;
    font-weight: 600;
}

.role-card-actions {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
}

.action-button {
    background: #ffffff;
    color: #374151;
    border: 1px solid {{ $organization_colors['primary'] ?? '#3b82f6' }};
    padding: 8px 16px;
    border-radius: 6px;
    font-size: 14px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: all 0.2s;
    text-decoration: none;
}

.action-button:hover {
    background: {{ $organization_colors['primary'] ?? '#3b82f6' }};
    color: white;
    text-decoration: none;
}

.action-danger {
    color: #dc2626;
    border-color: #dc2626;
}

.action-danger:hover {
    background: #dc2626;
    color: white;
}

.action-disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.action-disabled:hover {
    background: #ffffff;
    color: #374151;
}

/* Table */
.roles-table {
    width: 100%;
    border-collapse: collapse;
}

.roles-table th {
    text-align: left;
    padding: 16px;
    font-size: 14px;
    font-weight: 600;
    color: #1f2937;
    border-bottom: 1px solid #e5e7eb;
    vertical-align: middle;
    height: 56px;
    background: #f8fafc;
}

.roles-table th.checkbox-column {
    text-align: center;
    padding: 16px 8px;
    width: 50px;
}

.roles-table td {
    padding: 16px;
    border-bottom: 1px solid #e5e7eb;
    font-size: 14px;
    color: #1f2937;
    vertical-align: middle;
    height: 56px;
}

.roles-table td.checkbox-cell {
    text-align: center;
    padding: 16px 8px;
    width: 50px;
}

.role-row:hover {
    background-color: rgba(59, 130, 246, 0.05);
}

.role-row.selected {
    background-color: rgba(59, 130, 246, 0.1);
}

/* Role Info */
.role-info {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 40px;
    padding-left: 0;
}

.role-avatar {
    width: 40px;
    height: 40px;
    background: linear-gradient(135deg, {{ $organization_colors['primary'] ?? '#3b82f6' }} 0%, {{ $organization_colors['accent'] ?? '#1d4ed8' }} 100%);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 18px;
    font-weight: 600;
    overflow: hidden;
    border: 2px solid white;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.role-name {
    font-weight: 500;
    color: #1f2937;
    font-size: 14px;
}

.role-description {
    color: #6b7280;
    font-size: 14px;
}

/* Badges */
.permissions-badge, .users-badge {
    display: inline-block;
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
    text-transform: lowercase;
}

.permissions-badge {
    background: #dbeafe;
    color: #1e40af;
}

.users-badge {
    background: #dcfce7;
    color: #166534;
}

/* Checkboxes */
.table-checkbox {
    width: 18px;
    height: 18px;
    accent-color: {{ $organization_colors['primary'] ?? '#3b82f6' }};
    cursor: pointer;
    vertical-align: middle;
    margin: 0;
}

/* Action Buttons in Table */
.action-buttons {
    display: flex;
    gap: 4px;
    align-items: center;
}

.action-btn {
    background: #ffffff;
    border: 1px solid {{ $organization_colors['primary'] ?? '#3b82f6' }};
    color: {{ $organization_colors['primary'] ?? '#3b82f6' }};
    padding: 8px 10px;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.action-btn .iconify {
    font-size: 16px;
    line-height: 1;
    color: {{ $organization_colors['primary'] ?? '#3b82f6' }};
    transition: color 0.2s ease;
}

.action-btn:hover .iconify {
    color: white;
}

.action-btn:hover {
    background: {{ $organization_colors['primary'] ?? '#3b82f6' }};
    color: white;
}

.action-disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.action-disabled:hover {
    background: #ffffff;
    color: {{ $organization_colors['primary'] ?? '#3b82f6' }};
}

/* Empty State */
.empty-state {
    text-align: center;
    padding: 80px 20px;
    background: white;
    border-radius: 16px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    border: 1px solid #e5e7eb;
}

.empty-icon {
    margin-bottom: 24px;
}

.empty-icon .iconify {
    font-size: 64px;
    color: #9ca3af;
}

.empty-title {
    font-size: 24px;
    font-weight: 600;
    color: #1f2937;
    margin: 0 0 12px 0;
}

.empty-description {
    font-size: 16px;
    color: #6b7280;
    margin: 0 0 32px 0;
    max-width: 400px;
    margin-left: auto;
    margin-right: auto;
}

/* Responsive Design */
@media (max-width: 768px) {
    .user-management-container {
        padding: 16px;
    }
    
    .management-header {
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
    
    .roles-grid {
        grid-template-columns: 1fr;
    }
    
    .role-card-actions {
        flex-direction: column;
    }
    
    .view-toggle {
        flex-direction: column;
    }
    
    .toggle-btn {
        border-radius: 0;
    }
    
    .toggle-btn:first-child {
        border-radius: 6px 6px 0 0;
    }
    
    .toggle-btn:last-child {
        border-radius: 0 0 6px 6px;
    }
}

/* Dark Mode Support */
[data-theme="dark"] .user-management-container,
.dark .user-management-container,
.dark-mode .user-management-container,
body.dark .user-management-container {
    background: #111827;
}

[data-theme="dark"] .management-header,
.dark .management-header,
.dark-mode .management-header,
body.dark .management-header {
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

[data-theme="dark"] .table-view,
.dark .table-view,
.dark-mode .table-view,
body.dark .table-view {
    background: #1f2937;
    border-color: #374151;
}

[data-theme="dark"] .roles-table th,
.dark .roles-table th,
.dark-mode .roles-table th,
body.dark .roles-table th {
    background: #374151;
    color: #f9fafb;
    border-color: #4b5563;
}

[data-theme="dark"] .roles-table td,
.dark .roles-table td,
.dark-mode .roles-table td,
body.dark .roles-table td {
    color: #f9fafb;
    border-color: #4b5563;
}

[data-theme="dark"] .role-card,
.dark .role-card,
.dark-mode .role-card,
body.dark .role-card {
    background: #1f2937;
    border-color: #374151;
}

[data-theme="dark"] .role-name,
.dark .role-name,
.dark-mode .role-name,
body.dark .role-name {
    color: #f9fafb;
}

[data-theme="dark"] .role-description,
.dark .role-description,
.dark-mode .role-description,
body.dark .role-description {
    color: #9ca3af;
}

[data-theme="dark"] .empty-state,
.dark .empty-state,
.dark-mode .empty-state,
body.dark .empty-state {
    background: #1f2937;
    border-color: #374151;
}

[data-theme="dark"] .empty-title,
.dark .empty-title,
.dark-mode .empty-title,
body.dark .empty-title {
    color: #f9fafb;
}

[data-theme="dark"] .empty-description,
.dark .empty-description,
.dark-mode .empty-description,
body.dark .empty-description {
    color: #9ca3af;
}
</style>
@endpush
@endsection
