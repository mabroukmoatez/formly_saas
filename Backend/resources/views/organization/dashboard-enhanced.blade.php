@extends('layouts.organization')

@section('title', 'Organization Dashboard')

@section('content')
<div class="container-fluid">
    <div class="row">
        <div class="col-12">
            <div class="page-title-box">
                <h4 class="page-title">Organization Dashboard</h4>
            </div>
        </div>
    </div>

    <!-- Feature Cards -->
    <div class="row">
        <!-- Whitelabeling Card -->
        <div class="col-lg-4 col-md-6">
            <div class="card">
                <div class="card-body">
                    <div class="d-flex align-items-center">
                        <div class="flex-shrink-0">
                            <div class="avatar-sm rounded-circle bg-primary-subtle text-primary">
                                <i class="mdi mdi-palette font-20"></i>
                            </div>
                        </div>
                        <div class="flex-grow-1 ms-3">
                            <h5 class="card-title mb-1">Whitelabel Settings</h5>
                            <p class="text-muted mb-0">Customize your organization's branding</p>
                        </div>
                    </div>
                    <div class="mt-3">
                        <a href="{{ route('organization.whitelabel.index') }}" class="btn btn-primary btn-sm">
                            <i class="mdi mdi-cog me-1"></i> Configure
                        </a>
                    </div>
                </div>
            </div>
        </div>

        <!-- Certificate Management Card -->
        <div class="col-lg-4 col-md-6">
            <div class="card">
                <div class="card-body">
                    <div class="d-flex align-items-center">
                        <div class="flex-shrink-0">
                            <div class="avatar-sm rounded-circle bg-success-subtle text-success">
                                <i class="mdi mdi-certificate font-20"></i>
                            </div>
                        </div>
                        <div class="flex-grow-1 ms-3">
                            <h5 class="card-title mb-1">Certificate Management</h5>
                            <p class="text-muted mb-0">Create and manage certificate templates</p>
                        </div>
                    </div>
                    <div class="mt-3">
                        <a href="{{ route('organization.certificate-management.index') }}" class="btn btn-success btn-sm">
                            <i class="mdi mdi-plus me-1"></i> Manage
                        </a>
                    </div>
                </div>
            </div>
        </div>

        <!-- User Management Card -->
        <div class="col-lg-4 col-md-6">
            <div class="card">
                <div class="card-body">
                    <div class="d-flex align-items-center">
                        <div class="flex-shrink-0">
                            <div class="avatar-sm rounded-circle bg-info-subtle text-info">
                                <i class="mdi mdi-account-group font-20"></i>
                            </div>
                        </div>
                        <div class="flex-grow-1 ms-3">
                            <h5 class="card-title mb-1">User Management</h5>
                            <p class="text-muted mb-0">Create and manage organization users</p>
                        </div>
                    </div>
                    <div class="mt-3">
                        <a href="{{ route('organization.user-management.index') }}" class="btn btn-info btn-sm">
                            <i class="mdi mdi-account-plus me-1"></i> Manage
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Organization Stats -->
    <div class="row mt-4">
        <div class="col-12">
            <div class="card">
                <div class="card-header">
                    <h5 class="card-title mb-0">Organization Statistics</h5>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-3">
                            <div class="text-center">
                                <h3 class="text-primary">{{ (auth()->user()->organization ?? auth()->user()->organizationBelongsTo)->courses()->count() }}</h3>
                                <p class="text-muted mb-0">Total Courses</p>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="text-center">
                                <h3 class="text-success">{{ (auth()->user()->organization ?? auth()->user()->organizationBelongsTo)->organizationUsers()->count() }}</h3>
                                <p class="text-muted mb-0">Organization Users</p>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="text-center">
                                <h3 class="text-info">{{ (auth()->user()->organization ?? auth()->user()->organizationBelongsTo)->certificates()->count() }}</h3>
                                <p class="text-muted mb-0">Certificate Templates</p>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="text-center">
                                <h3 class="text-warning">{{ (auth()->user()->organization ?? auth()->user()->organizationBelongsTo)->enrollments()->count() }}</h3>
                                <p class="text-muted mb-0">Total Enrollments</p>
                            </div>
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
                    <h5 class="card-title mb-0">Quick Actions</h5>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-4">
                            <a href="{{ route('organization.course.create') }}" class="btn btn-outline-primary w-100 mb-2">
                                <i class="mdi mdi-book-plus me-1"></i> Create New Course
                            </a>
                        </div>
                        <div class="col-md-4">
                            <a href="{{ route('organization.user-management.create') }}" class="btn btn-outline-success w-100 mb-2">
                                <i class="mdi mdi-account-plus me-1"></i> Add New User
                            </a>
                        </div>
                        <div class="col-md-4">
                            <a href="{{ route('organization.certificate-management.create') }}" class="btn btn-outline-info w-100 mb-2">
                                <i class="mdi mdi-certificate me-1"></i> Create Certificate Template
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
@endsection
