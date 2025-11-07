@extends('layouts.organization')

@push('styles')
<link href="https://cdn.jsdelivr.net/npm/@iconify/iconify@3.1.1/dist/iconify.min.js" rel="stylesheet">
@endpush

@section('breadcrumb')
    <div class="page-banner-content text-center">
        <h3 class="page-banner-heading text-white pb-15">{{__('User Management')}}</h3>
        <nav aria-label="breadcrumb">
            <ol class="breadcrumb justify-content-center">
                <li class="breadcrumb-item font-14"><a href="{{route('main.index')}}">{{__('Home')}}</a></li>
                <li class="breadcrumb-item font-14"><a href="{{route('organization.dashboard')}}">{{__('Dashboard')}}</a></li>
                <li class="breadcrumb-item font-14 active" aria-current="page">{{__('User Management')}}</li>
            </ol>
        </nav>
    </div>
@endsection

@section('content')
<div id="user-management-app" class="user-management-container">
    
    <!-- KPI Cards Section -->
    <div class="kpi-cards-container">
        <div class="kpi-card">
            <div class="kpi-header">
                <h3 class="kpi-title">{{__('Active Users')}}</h3>
                <div class="kpi-icon">
                    <span class="iconify" data-icon="mdi:account-group"></span>
                </div>
            </div>
            <div class="kpi-metric">@{{ activeUsers }}</div>
            <div class="kpi-subtitle">+@{{ activeUsers }} ce mois</div>
        </div>
        
        <div class="kpi-card">
            <div class="kpi-header">
                <h3 class="kpi-title">{{__('Administrators')}}</h3>
                <div class="kpi-icon">
                    <span class="iconify" data-icon="mdi:shield-account"></span>
                </div>
            </div>
            <div class="kpi-metric">@{{ adminUsers }}</div>
            <div class="kpi-subtitle">{{__('Privileged Access')}}</div>
        </div>
        
        <div class="kpi-card">
            <div class="kpi-header">
                <h3 class="kpi-title">{{__('Pending Invitations')}}</h3>
                <div class="kpi-icon">
                    <span class="iconify" data-icon="mdi:account-plus"></span>
                </div>
            </div>
            <div class="kpi-metric">@{{ pendingInvitations }}</div>
            <div class="kpi-subtitle">{{__('Pending')}}</div>
        </div>
        
        <div class="kpi-card">
            <div class="kpi-header">
                <h3 class="kpi-title">{{__('Last Connection')}}</h3>
                <div class="kpi-icon">
                    <span class="iconify" data-icon="mdi:clock-outline"></span>
                </div>
            </div>
            <div class="kpi-metric">@{{ lastConnection }}</div>
            <div class="kpi-subtitle">@{{ lastUserEmail }}</div>
        </div>
    </div>

    <!-- Main User Management Section -->
    <div class="main-section">
        <!-- Header -->
        <div class="section-header">
            <div class="header-content">
                <h1 class="section-title">{{__('User Management')}}</h1>
                <p class="section-subtitle">{{__('Access control and role assignment')}}</p>
            </div>
        </div>

        <!-- Search and Action Bar -->
        <div class="search-action-bar">
            <div class="search-container">
                <div class="search-input-wrapper">
                    <span class="iconify search-icon" data-icon="mdi:magnify"></span>
                    <input type="text" v-model="searchQuery" @input="filterUsers" 
                           class="search-input" 
                           placeholder="{{__('Search for a user...')}}">
                </div>
            </div>
            <div class="action-buttons-group">
                <button class="action-button" @click="exportCSV">
                    <span class="iconify me-2" data-icon="mdi:download"></span>{{__('Export CSV')}}
                </button>
                <button class="action-button" @click="toggleViewMode">
                    <span class="iconify" :data-icon="viewMode === 'table' ? 'mdi:view-grid' : 'mdi:view-list'"></span>
                </button>
                <button @click="createUser" class="create-button">
                    <span class="iconify me-2" data-icon="mdi:account-plus"></span>{{__('Create User')}}
                </button>
            </div>
        </div>

        <!-- Bulk Actions -->
        <div class="bulk-actions-bar" v-if="selectedUsers.length > 0">
            <div class="bulk-actions">
                <span class="bulk-info">@{{ selectedUsers.length }} {{__('user(s) selected')}}</span>
                <button class="action-button action-danger" @click="bulkDelete">
                    <span class="iconify me-2" data-icon="mdi:delete"></span>{{__('Delete')}}
                </button>
                <button class="action-button action-warning" @click="bulkSuspend">
                    <span class="iconify me-2" data-icon="mdi:pause"></span>{{__('Suspend')}}
                </button>
            </div>
        </div>

        <!-- Users Display -->
        <div class="users-container">
                        @if($users->count() > 0)
                <!-- Table View -->
                <div v-if="viewMode === 'table'" class="table-view">
                    <table class="users-table">
                                    <thead>
                                        <tr>
                            <th class="checkbox-column">
                                <input type="checkbox" v-model="selectAll" @change="toggleSelectAll" class="table-checkbox">
                            </th>
                            <th class="name-column">{{__('Name')}}</th>
                            <th class="email-column">{{__('Email')}}</th>
                            <th class="role-column">{{__('Role')}}</th>
                            <th class="status-column">{{__('Status')}}</th>
                            <th class="actions-column">{{__('Actions')}}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        @foreach($users as $user)
                            <tr class="user-row" :class="{ 'selected': selectedUsers.includes({{ $user->id }}) }">
                                <td class="checkbox-cell">
                                    <input type="checkbox" :value="{{ $user->id }}" v-model="selectedUsers" class="table-checkbox">
                                </td>
                                <td class="name-cell">
                                    <div class="user-info">
                                        <div class="user-avatar">
                                            @if($user->image_path && $user->image_path != '')
                                                <img src="{{ getImageFile($user->image_path) }}" alt="{{ $user->name }}" class="avatar-image">
                                            @else
                                                <span class="avatar-text">{{ substr($user->name, 0, 2) }}</span>
                                            @endif
                                        </div>
                                        <div class="user-details">
                                            <div class="user-name">{{ $user->name }}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                <td class="email-cell">{{ $user->email }}</td>
                                <td class="role-cell">
                                    @if($user->organizationRoles->count() > 0)
                                        @foreach($user->organizationRoles as $role)
                                            <span class="role-tag role-default">{{ $role->name }}</span>
                                        @endforeach
                                    @else
                                        <span class="role-tag role-default">{{__('No Role')}}</span>
                                    @endif
                                </td>
                                <td class="status-cell">
                                                    @if($user->status == 1)
                                        <span class="status-tag status-active">{{__('active')}}</span>
                                                    @else
                                        <span class="status-tag status-invited">{{__('invited')}}</span>
                                                    @endif
                                                </td>
                                <td class="actions-cell">
                                    <div class="action-buttons">
                                        <button class="action-btn action-edit" @click="editUser({{ $user->id }})" title="{{__('Edit')}}">
                                            <span class="iconify" data-icon="mdi:pencil"></span>
                                        </button>
                                                        @if($user->id != auth()->id())
                                            <button class="action-btn action-toggle" @click="toggleUserStatus({{ $user->id }})" 
                                                    title="{{ $user->status == 1 ? __('Suspend') : __('Activate') }}">
                                                <span class="iconify" data-icon="{{ $user->status == 1 ? 'mdi:pause' : 'mdi:play' }}"></span>
                                                                </button>
                                            <button class="action-btn action-delete" @click="deleteUser({{ $user->id }})" title="{{__('Delete')}}">
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
                    <div class="users-grid">
                        @foreach($users as $user)
                            <div class="user-card" :class="{ 'selected': selectedUsers.includes({{ $user->id }}) }">
                                <div class="user-card-header">
                                    <input type="checkbox" :value="{{ $user->id }}" v-model="selectedUsers" class="user-checkbox">
                                    <div class="user-avatar">
                                        @if($user->image_path && $user->image_path != '')
                                            <img src="{{ getImageFile($user->image_path) }}" alt="{{ $user->name }}" class="avatar-image">
                                        @else
                                            <span class="avatar-text">{{ substr($user->name, 0, 2) }}</span>
                                        @endif
                                    </div>
                                </div>
                                <div class="user-card-body">
                                    <h4 class="user-name">{{ $user->name }}</h4>
                                    <p class="user-email">{{ $user->email }}</p>
                                    <div class="user-role">
                                        @if($user->organizationRoles->count() > 0)
                                            @foreach($user->organizationRoles as $role)
                                                <span class="role-tag role-default">{{ $role->name }}</span>
                                            @endforeach
                                        @else
                                            <span class="role-tag role-default">{{__('No Role')}}</span>
                                        @endif
                            </div>
                                    <div class="user-status">
                                        @if($user->status == 1)
                                            <span class="status-tag status-active">{{__('active')}}</span>
                                        @else   
                                            <span class="status-tag status-invited">{{__('invited')}}</span>
                        @endif
                    </div>
                </div>
                                <div class="user-card-actions">
                                        <button class="action-btn action-edit" @click="editUser({{ $user->id }})" title="{{__('Edit')}}">
                                            <span class="iconify" data-icon="mdi:pencil"></span>
                                        </button>
                                        @if($user->id != auth()->id())
                                        <button class="action-btn action-toggle" @click="toggleUserStatus({{ $user->id }})" 
                                                title="{{ $user->status == 1 ? __('Suspendre') : __('Activer') }}">
                                            <span class="iconify" data-icon="{{ $user->status == 1 ? 'mdi:pause' : 'mdi:play' }}"></span>
                                        </button>
                                        <button class="action-btn action-delete" @click="deleteUser({{ $user->id }})" title="{{__('Supprimer')}}">
                                            <span class="iconify" data-icon="mdi:delete"></span>
                                        </button>
                                    @endif
            </div>
        </div>
                        @endforeach
                    </div>
                </div>
            @else
                <div class="empty-state">
                    <div class="empty-icon">
                        <span class="iconify" data-icon="mdi:account-group"></span>
                    </div>
                    <h3>{{__('No users found')}}</h3>
                    <p>{{__('Start by creating your first user.')}}</p>
                    <button @click="createUser" class="create-button">
                        <span class="iconify me-2" data-icon="mdi:account-plus"></span>{{__('Create User')}}
                    </button>
                </div>
            @endif
            </div>

        <!-- Table Footer -->
        <div class="table-footer">
            <div class="selection-info">
                @{{ selectedUsers.length }} {{__('of')}} @{{ totalUsers }} {{__('line(s) selected')}}.
            </div>
            <div class="pagination-controls">
                <button class="pagination-button" :disabled="currentPage === 1" @click="previousPage">
                    <span class="iconify me-1" data-icon="mdi:chevron-left"></span>{{__('Previous')}}
                </button>
                <button class="pagination-button" :disabled="currentPage === totalPages" @click="nextPage">
                    {{__('Next')}}<span class="iconify ms-1" data-icon="mdi:chevron-right"></span>
                </button>
            </div>
        </div>
    </div>
</div>

<!-- Vue.js Script -->
<script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@iconify/iconify@3.1.1/dist/iconify.min.js"></script>
<script>
const { createApp } = Vue;

createApp({
    data() {
        return {
            searchQuery: '',
            selectedUsers: [],
            selectAll: false,
            users: @json($users->items()),
            availableRoles: @json($roles),
            filteredUsers: [],
            currentPage: 1,
            totalPages: 1,
            viewMode: 'table' // 'table' or 'grid'
        }
    },
    computed: {
        totalUsers() {
            return this.users.length;
        },
        activeUsers() {
            return this.users.filter(user => user.status == 1).length;
        },
        adminUsers() {
            return this.users.filter(user => {
                const roles = user.organization_roles || [];
                return roles.some(roleItem => 
                    roleItem.name === 'Organization Admin' || roleItem.name === 'Administrative Manager'
                );
            }).length;
        },
        pendingInvitations() {
            return this.users.filter(user => user.status == 0).length;
        },
        lastConnection() {
            // Calculate last connection time (simplified)
            return '2h';
        },
        lastUserEmail() {
            // Get the most recent user's email
            const recentUser = this.users[0];
            return recentUser ? recentUser.email : 'admin@company.com';
        }
    },
    methods: {
        filterUsers() {
            // Filter users based on search query
            if (this.searchQuery.trim()) {
                this.filteredUsers = this.users.filter(user => 
                    user.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                    user.email.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                    (user.roles && user.roles.some(role => 
                        role.name.toLowerCase().includes(this.searchQuery.toLowerCase())
                    ))
                );
            } else {
                this.filteredUsers = [...this.users];
            }
        },
        createUser() {
            window.location.href = '{{ route("organization.user-management.create") }}';
        },
        editUser(userId) {
            window.location.href = `{{ route("organization.user-management.edit", "") }}/${userId}`;
        },
        toggleUserStatus(userId) {
            if (confirm('{{__("Êtes-vous sûr de vouloir changer le statut de cet utilisateur ?")}}')) {
                // Implement toggle status logic
                console.log('Toggle status for user:', userId);
            }
        },
        deleteUser(userId) {
            if (confirm('{{__("Êtes-vous sûr de vouloir supprimer cet utilisateur ?")}}')) {
                // Implement delete logic
                console.log('Delete user:', userId);
            }
        },
        bulkDelete() {
            if (this.selectedUsers.length > 0 && confirm(`{{__("Êtes-vous sûr de vouloir supprimer")}} ${this.selectedUsers.length} {{__("utilisateur(s) ?")}}`)) {
                console.log('Bulk delete users:', this.selectedUsers);
                this.selectedUsers = [];
                this.selectAll = false;
            }
        },
        bulkSuspend() {
            if (this.selectedUsers.length > 0 && confirm(`{{__("Êtes-vous sûr de vouloir suspendre")}} ${this.selectedUsers.length} {{__("utilisateur(s) ?")}}`)) {
                console.log('Bulk suspend users:', this.selectedUsers);
                this.selectedUsers = [];
                this.selectAll = false;
            }
        },
        exportCSV() {
            // Create CSV content
            const headers = ['{{__('Name')}}', '{{__('Role')}}', '{{__('Status')}}', '{{__('Created')}}'];
            const csvContent = [
                headers.join(','),
                ...this.users.map(user => [
                    `"${user.name}"`,
                    `"${user.email}"`,
                    `"${user.organization_roles?.map(r => r.name).join('; ') || 'Aucun'}"`,
                    `"${user.status == 1 ? 'Actif' : 'Suspendu'}"`,
                    `"${new Date(user.created_at).toLocaleDateString('fr-FR')}"`
                ].join(','))
            ].join('\n');
            
            // Download CSV
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `utilisateurs_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        },
        toggleColumns() {
            this.showColumns = !this.showColumns;
        },
        toggleViewMode() {
            this.viewMode = this.viewMode === 'table' ? 'grid' : 'table';
        },
        toggleSelectAll() {
            if (this.selectAll) {
                this.selectedUsers = this.users.map(user => user.id);
            } else {
                this.selectedUsers = [];
            }
        },
        previousPage() {
            if (this.currentPage > 1) {
                this.currentPage--;
            }
        },
        nextPage() {
            if (this.currentPage < this.totalPages) {
                this.currentPage++;
            }
        },
    },
    mounted() {
        this.filteredUsers = [...this.users];
    }
}).mount('#user-management-app');
</script>

<style>
/* Organization Color Variables */
:root {
    --color-primary-blue: #2563eb;
    --color-text-dark: #374151;
    --color-text-light: #6b7280;
    --color-background-white: #ffffff;
    --color-background-page: #f9fafb;
    --color-status-success: #10b981;
    --color-status-neutral: #e5e7eb;
    --color-border-light: #d1d5db;
    --color-shadow-subtle: rgba(0, 0, 0, 0.1);
    --color-danger: #ef4444;
    --color-warning: #f59e0b;
}

/* Dark Mode Variables */
.dark-mode {
    --color-text-dark: #f9fafb;
    --color-text-light: #9ca3af;
    --color-background-white: #1f2937;
    --color-background-page: #111827;
    --color-border-light: #374151;
    --color-shadow-subtle: rgba(0, 0, 0, 0.3);
    --color-status-neutral: #374151;
}

/* Main Container */
.user-management-container {
    background-color: var(--color-background-page);
    min-height: 100vh;
    padding: 24px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* KPI Cards */
.kpi-cards-container {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
    margin-bottom: 32px;
}

.kpi-card {
    background: var(--color-background-white);
    border-radius: 8px;
    padding: 24px;
    box-shadow: 0 1px 3px var(--color-shadow-subtle);
    position: relative;
}

.kpi-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 16px;
}

.kpi-title {
    font-size: 14px;
    font-weight: 500;
    color: var(--color-text-dark);
    margin: 0;
}

.kpi-icon {
    color: var(--color-text-light);
    font-size: 20px;
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, {{ $organization_colors['primary'] ?? '#3b82f6' }} 0%, {{ $organization_colors['accent'] ?? '#1d4ed8' }} 100%);
    color: white;
    box-shadow: 0 4px 12px rgba({{ hexdec(substr($organization_colors['primary'] ?? '#3b82f6', 1, 2)) }}, {{ hexdec(substr($organization_colors['primary'] ?? '#3b82f6', 3, 2)) }}, {{ hexdec(substr($organization_colors['primary'] ?? '#3b82f6', 5, 2)) }}, 0.3);
    transition: all 0.3s ease;
}

.kpi-icon:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.kpi-icon .iconify {
    font-size: 24px;
    color: white;
}

.kpi-metric {
    font-size: 32px;
    font-weight: 700;
    color: var(--color-text-dark);
    margin-bottom: 8px;
}

.kpi-subtitle {
    font-size: 12px;
    color: var(--color-text-light);
    margin: 0;
}

/* Main Section */
.main-section {
    background: var(--color-background-white);
    border-radius: 8px;
    box-shadow: 0 1px 3px var(--color-shadow-subtle);
    padding: 32px;
}

.section-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 32px;
}

.header-content {
    flex: 1;
}

.section-title {
    font-size: 24px;
    font-weight: 600;
    color: var(--color-text-dark);
    margin: 0 0 8px 0;
}

.section-subtitle {
    font-size: 14px;
    color: var(--color-text-light);
    margin: 0;
}

.header-actions {
    display: flex;
    align-items: center;
    gap: 12px;
}

.theme-toggle {
    background: var(--color-background-white);
    border: 1px solid var(--color-border-light);
    color: var(--color-text-dark);
    padding: 8px 12px;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 16px;
}

.theme-toggle:hover {
    background: var(--color-status-neutral);
}

.theme-toggle.active {
    background: var(--color-primary-blue);
    color: white;
    border-color: var(--color-primary-blue);
}

/* Search and Action Bar */
.search-action-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    gap: 20px;
}

.action-buttons-group {
    display: flex;
    align-items: center;
    gap: 12px;
}

.bulk-actions-bar {
    background: var(--color-status-neutral);
    padding: 12px 16px;
    border-radius: 6px;
    margin-bottom: 24px;
}

.bulk-actions {
    display: flex;
    align-items: center;
    gap: 12px;
}

.bulk-info {
    font-size: 14px;
    color: var(--color-text-dark);
    font-weight: 500;
}

.search-container {
    flex: 1;
    max-width: 400px;
}

.search-input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
}

.search-icon {
    position: absolute;
    left: 12px;
    color: var(--color-text-light);
    font-size: 16px;
    z-index: 1;
}

.search-icon .iconify {
    font-size: 16px;
    color: var(--color-text-light);
}

.search-input {
    width: 100%;
    padding: 12px 16px 12px 40px;
    border: 1px solid var(--color-border-light);
    border-radius: 6px;
    font-size: 14px;
    color: var(--color-text-dark);
    background: var(--color-background-white);
}

.search-input:focus {
    outline: none;
    border-color: var(--color-primary-blue);
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.search-input::placeholder {
    color: var(--color-text-light);
}

.create-button {
    background: {{ $organization_colors['primary'] ?? '#3b82f6' }};
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.2s;
    display: flex;
    align-items: center;
}

.create-button:hover {
    background: {{ $organization_colors['accent'] ?? '#1d4ed8' }};
}

/* Users Container */
.users-container {
    margin-bottom: 24px;
}

.table-view {
    overflow-x: auto;
}

.grid-view {
    margin-top: 20px;
}

.users-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 20px;
}

.user-card {
    background: var(--color-background-white);
    border: 1px solid var(--color-border-light);
    border-radius: 8px;
    padding: 20px;
    transition: all 0.3s ease;
    position: relative;
}

.user-card:hover {
    box-shadow: 0 4px 12px var(--color-shadow-subtle);
    transform: translateY(-2px);
}

.user-card.selected {
    border-color: var(--color-primary-blue);
    box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
}

.user-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
}

.user-checkbox {
    width: 16px;
    height: 16px;
    accent-color: var(--color-primary-blue);
}

.user-card-body {
    margin-bottom: 16px;
}

.user-card .user-name {
    font-size: 16px;
    font-weight: 600;
    color: var(--color-text-dark);
    margin: 0 0 8px 0;
}

.user-card .user-email {
    font-size: 14px;
    color: var(--color-text-light);
    margin: 0 0 12px 0;
}

.user-card .user-role {
    margin-bottom: 12px;
}

.user-card .user-status {
    margin-bottom: 16px;
}

.user-card-actions {
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
}

.action-button i {
    font-size: 16px;
    line-height: 1;
}

.action-button:hover {
    background: {{ $organization_colors['primary'] ?? '#3b82f6' }};
    color: white;
}

.action-danger {
    color: var(--color-danger);
    border-color: var(--color-danger);
}

.action-danger:hover {
    background: var(--color-danger);
    color: white;
}

.action-warning {
    color: var(--color-warning);
    border-color: var(--color-warning);
}

.action-warning:hover {
    background: var(--color-warning);
    color: white;
}

.bulk-actions {
    display: flex;
    gap: 8px;
    align-items: center;
}

/* Table */
.table-container {
    margin-bottom: 24px;
}

.users-table {
    width: 100%;
    border-collapse: collapse;
}

.users-table th {
    text-align: left;
    padding: 16px;
    font-size: 14px;
    font-weight: 600;
    color: var(--color-text-dark);
    border-bottom: 1px solid var(--color-border-light);
    vertical-align: middle;
    height: 56px;
    background: #f8fafc;
}

.users-table th.checkbox-column {
    text-align: center;
    padding: 16px 8px;
}

.users-table td {
    padding: 16px;
    border-bottom: 1px solid var(--color-border-light);
    font-size: 14px;
    color: var(--color-text-dark);
    vertical-align: middle;
    height: 56px;
}

.users-table td.checkbox-cell {
    text-align: center;
    padding: 16px 8px;
}

.user-row:hover {
    background-color: rgba(37, 99, 235, 0.05);
}

.user-row.selected {
    background-color: rgba(37, 99, 235, 0.1);
}

/* User Info */
.user-info {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 40px;
    padding-left: 0;
}

.user-avatar {
    width: 40px;
    height: 40px;
    background: linear-gradient(135deg, {{ $organization_colors['primary'] ?? '#3b82f6' }} 0%, {{ $organization_colors['accent'] ?? '#1d4ed8' }} 100%);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 14px;
    font-weight: 600;
    overflow: hidden;
    border: 2px solid white;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.avatar-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 50%;
}

.avatar-text {
    font-size: 14px;
    font-weight: 600;
    color: white;
    text-transform: uppercase;
}

.user-name {
    font-weight: 500;
    color: var(--color-text-dark);
}

/* Role Tags */
.role-tag {
    display: inline-block;
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
    text-transform: lowercase;
    margin-right: 4px;
}

.role-default {
    background: {{ $organization_colors['primary'] ?? '#3b82f6' }};
    color: white;
}


/* Status Tags */
.status-tag {
    display: inline-block;
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
    text-transform: lowercase;
}

.status-active {
    background: var(--color-status-success);
    color: white;
}

.status-invited {
    background: var(--color-status-neutral);
    color: var(--color-text-dark);
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

.checkbox-column {
    width: 50px;
    text-align: center;
    padding: 16px 8px !important;
}

.checkbox-cell {
    width: 50px;
    text-align: center;
    padding: 16px 8px !important;
    vertical-align: middle;
}

.name-column {
    padding-left: 8px !important;
}

.name-cell {
    padding-left: 8px !important;
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

.action-button .iconify {
    font-size: 16px;
    color: #475569;
    transition: color 0.2s ease;
}

.action-button:hover .iconify {
    color: #1e293b;
}


.action-btn:hover {
    background: {{ $organization_colors['primary'] ?? '#3b82f6' }};
    color: white;
    transform: translateY(-1px);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

.action-edit:hover {
    background: #2563eb;
    color: white;
    border-color: #2563eb;
}

.action-toggle:hover {
    background: #f59e0b;
    color: white;
    border-color: #f59e0b;
}

.action-delete:hover {
    background: #ef4444;
    color: white;
    border-color: #ef4444;
}

/* Dark Mode Support - Multiple selectors for compatibility */
[data-theme="dark"] .action-btn,
.dark .action-btn,
.dark-mode .action-btn,
body.dark .action-btn {
    background: #374151;
    border-color: #4b5563;
    color: #d1d5db;
}

[data-theme="dark"] .action-btn:hover,
.dark .action-btn:hover,
.dark-mode .action-btn:hover,
body.dark .action-btn:hover {
    background: #4b5563;
    color: #f9fafb;
}

[data-theme="dark"] .role-tag,
.dark .role-tag,
.dark-mode .role-tag,
body.dark .role-tag {
    color: white;
}

[data-theme="dark"] .status-tag,
.dark .status-tag,
.dark-mode .status-tag,
body.dark .status-tag {
    color: white;
}

[data-theme="dark"] .user-management-container,
.dark .user-management-container,
.dark-mode .user-management-container,
body.dark .user-management-container {
    background-color: #111827;
}

[data-theme="dark"] .main-section,
.dark .main-section,
.dark-mode .main-section,
body.dark .main-section {
    background: #1f2937;
}

[data-theme="dark"] .kpi-card,
.dark .kpi-card,
.dark-mode .kpi-card,
body.dark .kpi-card {
    background: #1f2937;
    border-color: #374151;
}

[data-theme="dark"] .user-card,
.dark .user-card,
.dark-mode .user-card,
body.dark .user-card {
    background: #1f2937;
    border-color: #374151;
}

[data-theme="dark"] .users-table,
.dark .users-table,
.dark-mode .users-table,
body.dark .users-table {
    color: #f9fafb;
}

[data-theme="dark"] .users-table th,
.dark .users-table th,
.dark-mode .users-table th,
body.dark .users-table th {
    color: #f9fafb;
    border-color: #374151;
}

[data-theme="dark"] .users-table td,
.dark .users-table td,
.dark-mode .users-table td,
body.dark .users-table td {
    color: #f9fafb;
    border-color: #374151;
}

[data-theme="dark"] .section-title,
.dark .section-title,
.dark-mode .section-title,
body.dark .section-title {
    color: #f9fafb;
}

[data-theme="dark"] .section-subtitle,
.dark .section-subtitle,
.dark-mode .section-subtitle,
body.dark .section-subtitle {
    color: #9ca3af;
}

[data-theme="dark"] .search-input,
.dark .search-input,
.dark-mode .search-input,
body.dark .search-input {
    background: #374151;
    border-color: #4b5563;
    color: #f9fafb;
}

[data-theme="dark"] .search-input::placeholder,
.dark .search-input::placeholder,
.dark-mode .search-input::placeholder,
body.dark .search-input::placeholder {
    color: #9ca3af;
}

/* Table Footer */
.table-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 16px;
    border-top: 1px solid var(--color-border-light);
}

.selection-info {
    font-size: 14px;
    color: var(--color-text-light);
}

.pagination-controls {
    display: flex;
    gap: 8px;
}

.pagination-button {
    background: var(--color-background-white);
    color: var(--color-text-dark);
    border: 1px solid var(--color-border-light);
    padding: 8px 16px;
    border-radius: 6px;
    font-size: 14px;
    cursor: pointer;
}

.pagination-button:disabled {
    background: var(--color-status-neutral);
    color: var(--color-text-light);
    cursor: not-allowed;
}

.pagination-button:not(:disabled):hover {
    background: var(--color-status-neutral);
}

.pagination-button .iconify {
    font-size: 14px;
    color: inherit;
}

/* Empty State */
.empty-state {
    text-align: center;
    padding: 64px 32px;
}

.empty-icon {
    font-size: 48px;
    color: var(--color-text-light);
    margin-bottom: 16px;
}

.empty-icon .iconify {
    font-size: 48px;
    color: var(--color-text-light);
}

.empty-state h3 {
    font-size: 18px;
    font-weight: 600;
    color: var(--color-text-dark);
    margin: 0 0 8px 0;
}

.empty-state p {
    font-size: 14px;
    color: var(--color-text-light);
    margin: 0 0 24px 0;
}

/* Responsive */
@media (max-width: 768px) {
    .user-management-container {
        padding: 16px;
    }
    
    .kpi-cards-container {
        grid-template-columns: repeat(2, 1fr);
        gap: 16px;
    }
    
    .kpi-card {
        padding: 16px;
    }
    
    .main-section {
        padding: 20px;
    }
    
    .section-header {
        flex-direction: column;
        gap: 16px;
        align-items: flex-start;
    }
    
    .search-action-bar {
        flex-direction: column;
        gap: 16px;
        align-items: stretch;
    }
    
    .table-controls {
        flex-direction: column;
        gap: 16px;
        align-items: stretch;
    }
    
    .table-actions-left {
        flex-wrap: wrap;
    }
    
    .table-footer {
        flex-direction: column;
        gap: 16px;
        align-items: center;
    }
    
    .users-table {
        font-size: 12px;
    }
    
    .users-table th,
    .users-table td {
        padding: 8px 4px;
    }
    
    .action-buttons {
        flex-direction: column;
        gap: 2px;
    }
    
    .action-btn {
        width: 32px;
        height: 32px;
        font-size: 12px;
    }
    
    .users-grid {
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 16px;
    }
    
    .user-card {
        padding: 16px;
    }
}

/* Table Cell Styles */
.name-column {
    width: 35%;
    padding: 16px;
    vertical-align: middle;
}

.name-cell {
    width: 35%;
    padding: 16px;
    vertical-align: middle;
}

.email-column {
    width: 25%;
    padding: 16px;
    vertical-align: middle;
}

.email-cell {
    width: 25%;
    padding: 16px;
    vertical-align: middle;
}

.role-column {
    width: 20%;
    padding: 16px;
    vertical-align: middle;
}

.role-cell {
    width: 20%;
    padding: 16px;
    vertical-align: middle;
}

.status-column {
    width: 15%;
    padding: 16px;
    vertical-align: middle;
}

.status-cell {
    width: 15%;
    padding: 16px;
    vertical-align: middle;
}

.actions-column {
    width: 15%;
    padding: 16px;
    vertical-align: middle;
}

.actions-cell {
    width: 15%;
    padding: 16px;
    vertical-align: middle;
}

.checkbox-column {
    width: 10%;
    padding: 16px;
    text-align: center;
    vertical-align: middle;
}

.checkbox-cell {
    width: 10%;
    padding: 16px;
    text-align: center;
    vertical-align: middle;
}

@media (max-width: 480px) {
    .kpi-cards-container {
        grid-template-columns: 1fr;
    }
    
    .kpi-metric {
        font-size: 24px;
    }
    
    .section-title {
        font-size: 20px;
    }
    
    .users-grid {
        grid-template-columns: 1fr;
    }
    
    .action-buttons-group {
        flex-wrap: wrap;
        gap: 8px;
    }
    
    .search-action-bar {
        flex-direction: column;
        align-items: stretch;
    }
}
</style>
@endsection
