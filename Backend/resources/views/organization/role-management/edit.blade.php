@extends('layouts.organization')

@section('breadcrumb')
    <div class="page-banner-content text-center">
        <h3 class="page-banner-heading text-white pb-15">{{__('Edit Role')}}</h3>
        <nav aria-label="breadcrumb">
            <ol class="breadcrumb justify-content-center">
                <li class="breadcrumb-item font-14"><a href="{{route('main.index')}}">{{__('Home')}}</a></li>
                <li class="breadcrumb-item font-14"><a href="{{route('organization.dashboard')}}">{{__('Dashboard')}}</a></li>
                <li class="breadcrumb-item font-14"><a href="{{route('organization.role-management.index')}}">{{__('Role Management')}}</a></li>
                <li class="breadcrumb-item font-14 active" aria-current="page">{{__('Edit Role')}}</li>
            </ol>
        </nav>
    </div>
@endsection

@section('content')
<div class="instructor-profile-right-part">
    <div class="instructor-dashboard-box">
        
        <!-- Header -->
        <div class="row mb-30">
            <div class="col-12">
                <div class="d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">{{__('Edit Role')}}: {{ $role->name }}</h5>
                    <a href="{{ route('organization.role-management.index') }}" class="btn btn-secondary">
                        <i class="mdi mdi-arrow-left me-1"></i>{{__('Back to Roles')}}
                    </a>
                </div>
            </div>
        </div>

        <!-- Edit Role Form -->
        <div class="row">
            <div class="col-12">
                <div class="card">
                    <div class="card-body">
                        <form method="POST" action="{{ route('organization.role-management.update', $role->id) }}">
                            @csrf
                            @method('PUT')
                            
                            <div class="row">
                                <!-- Role Name -->
                                <div class="col-md-6 mb-3">
                                    <label for="name" class="form-label">{{__('Role Name')}} <span class="text-danger">*</span></label>
                                    <input type="text" class="form-control @error('name') is-invalid @enderror" 
                                           id="name" name="name" value="{{ old('name', $role->name) }}" required>
                                    @error('name')
                                        <div class="invalid-feedback">{{ $message }}</div>
                                    @enderror
                                </div>

                                <!-- Description -->
                                <div class="col-md-6 mb-3">
                                    <label for="description" class="form-label">{{__('Description')}}</label>
                                    <input type="text" class="form-control @error('description') is-invalid @enderror" 
                                           id="description" name="description" value="{{ old('description', $role->description) }}">
                                    @error('description')
                                        <div class="invalid-feedback">{{ $message }}</div>
                                    @enderror
                                </div>
                            </div>

                            <!-- Current Users -->
                            @if($role->users->count() > 0)
                                <div class="row mb-4">
                                    <div class="col-12">
                                        <h6 class="mb-3">{{__('Users with this Role')}}</h6>
                                        <div class="alert alert-info">
                                            <i class="mdi mdi-information me-2"></i>
                                            {{__('This role is currently assigned to')}} <strong>{{ $role->users->count() }}</strong> {{__('user(s)')}}.
                                            {{__('Changes will affect all users with this role.')}}
                                        </div>
                                    </div>
                                </div>
                            @endif

                            <!-- Permissions -->
                            <div class="row">
                                <div class="col-12">
                                    <h6 class="mb-3">{{__('Permissions')}}</h6>
                                    <p class="text-muted mb-4">{{__('Select the permissions for this role. Users with this role will have access to the selected features.')}}</p>
                                    
                                    @foreach($categories as $categoryKey => $categoryName)
                                        <div class="card mb-3">
                                            <div class="card-header">
                                                <h6 class="mb-0">{{ $categoryName }}</h6>
                                            </div>
                                            <div class="card-body">
                                                <div class="row">
                                                    @if(isset($permissions[$categoryKey]))
                                                        @foreach($permissions[$categoryKey] as $permission)
                                                            <div class="col-md-6 mb-2">
                                                                <div class="form-check">
                                                                    <input class="form-check-input" type="checkbox" 
                                                                           name="permissions[]" value="{{ $permission->name }}" 
                                                                           id="permission_{{ $permission->id }}"
                                                                           {{ in_array($permission->name, old('permissions', $role->permissions ?? [])) ? 'checked' : '' }}>
                                                                    <label class="form-check-label" for="permission_{{ $permission->id }}">
                                                                        <strong>{{ $permission->display_name }}</strong>
                                                                        @if($permission->description)
                                                                            <br><small class="text-muted">{{ $permission->description }}</small>
                                                                        @endif
                                                                    </label>
                                                                </div>
                                                            </div>
                                                        @endforeach
                                                    @endif
                                                </div>
                                            </div>
                                        </div>
                                    @endforeach
                                </div>
                            </div>

                            <!-- Submit Buttons -->
                            <div class="row">
                                <div class="col-12">
                                    <div class="d-flex justify-content-end gap-2">
                                        <a href="{{ route('organization.role-management.index') }}" class="btn btn-secondary">
                                            {{__('Cancel')}}
                                        </a>
                                        <button type="submit" class="btn btn-primary">
                                            <i class="mdi mdi-check me-1"></i>{{__('Update Role')}}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
@endsection
