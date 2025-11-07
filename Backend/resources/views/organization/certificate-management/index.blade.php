@extends('layouts.organization')

@section('breadcrumb')
    <div class="page-banner-content text-center">
        <h3 class="page-banner-heading text-white pb-15">{{__('Certificate Management')}}</h3>
        <nav aria-label="breadcrumb">
            <ol class="breadcrumb justify-content-center">
                <li class="breadcrumb-item font-14"><a href="{{route('main.index')}}">{{__('Home')}}</a></li>
                <li class="breadcrumb-item font-14"><a href="{{route('organization.dashboard')}}">{{__('Dashboard')}}</a></li>
                <li class="breadcrumb-item font-14 active" aria-current="page">{{__('Certificate Management')}}</li>
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
                    <h5 class="mb-0">{{__('Certificate Templates')}}</h5>
                    <a href="{{ route('organization.certificate-management.create') }}" class="btn btn-primary">
                        <i class="mdi mdi-plus me-1"></i>{{__('Create Certificate')}}
                    </a>
                </div>
            </div>
        </div>

        <!-- Certificates Table -->
        <div class="row">
            <div class="col-12">
                <div class="card">
                    <div class="card-body">
                        @if($certificates->count() > 0)
                            <div class="table-responsive">
                                <table class="table table-striped">
                                    <thead>
                                        <tr>
                                            <th>{{__('Certificate Name')}}</th>
                                            <th>{{__('Description')}}</th>
                                            <th>{{__('Status')}}</th>
                                            <th>{{__('Created')}}</th>
                                            <th>{{__('Actions')}}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        @foreach($certificates as $certificate)
                                            <tr>
                                                <td>
                                                    <div class="d-flex align-items-center">
                                                        <div class="avatar-sm bg-success-subtle text-success rounded-circle me-2 d-flex align-items-center justify-content-center">
                                                            <i class="mdi mdi-certificate font-16"></i>
                                                        </div>
                                                        <div>
                                                            <h6 class="mb-0">{{ $certificate->name }}</h6>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>{{ Str::limit($certificate->description, 50) }}</td>
                                                <td>
                                                    @if($certificate->status == 1)
                                                        <span class="badge bg-success">{{__('Active')}}</span>
                                                    @else
                                                        <span class="badge bg-secondary">{{__('Inactive')}}</span>
                                                    @endif
                                                </td>
                                                <td>{{ $certificate->created_at->format('M d, Y') }}</td>
                                                <td>
                                                    <div class="btn-group" role="group">
                                                        <a href="{{ route('organization.certificate-management.edit', $certificate->id) }}" 
                                                           class="btn btn-sm btn-outline-primary">
                                                            <i class="mdi mdi-pencil"></i>
                                                        </a>
                                                        
                                                        <a href="{{ route('organization.certificate-management.preview', $certificate->id) }}" 
                                                           class="btn btn-sm btn-outline-info" target="_blank">
                                                            <i class="mdi mdi-eye"></i>
                                                        </a>
                                                        
                                                        <form method="POST" action="{{ route('organization.certificate-management.duplicate', $certificate->id) }}" 
                                                              class="d-inline">
                                                            @csrf
                                                            <button type="submit" class="btn btn-sm btn-outline-success"
                                                                    onclick="return confirm('{{__('Are you sure you want to duplicate this certificate?')}}')">
                                                                <i class="mdi mdi-content-copy"></i>
                                                            </button>
                                                        </form>
                                                        
                                                        <form method="POST" action="{{ route('organization.certificate-management.delete', $certificate->id) }}" 
                                                              class="d-inline">
                                                            @csrf
                                                            @method('DELETE')
                                                            <button type="submit" class="btn btn-sm btn-outline-danger"
                                                                    onclick="return confirm('{{__('Are you sure you want to delete this certificate?')}}')">
                                                                <i class="mdi mdi-delete"></i>
                                                            </button>
                                                        </form>
                                                    </div>
                                                </td>
                                            </tr>
                                        @endforeach
                                    </tbody>
                                </table>
                            </div>
                            
                            <!-- Pagination -->
                            <div class="d-flex justify-content-center">
                                {{ $certificates->links() }}
                            </div>
                        @else
                            <div class="text-center py-5">
                                <div class="mb-3">
                                    <i class="mdi mdi-certificate font-48 text-muted"></i>
                                </div>
                                <h5 class="text-muted">{{__('No certificates found')}}</h5>
                                <p class="text-muted">{{__('Start by creating your first certificate template.')}}</p>
                                <a href="{{ route('organization.certificate-management.create') }}" class="btn btn-primary">
                                    <i class="mdi mdi-plus me-1"></i>{{__('Create First Certificate')}}
                                </a>
                            </div>
                        @endif
                    </div>
                </div>
            </div>
        </div>

        <!-- Statistics -->
        <div class="row mt-4">
            <div class="col-md-3">
                <div class="card text-center">
                    <div class="card-body">
                        <h3 class="text-primary">{{ $certificates->total() }}</h3>
                        <p class="text-muted mb-0">{{__('Total Certificates')}}</p>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card text-center">
                    <div class="card-body">
                        <h3 class="text-success">{{ $certificates->where('status', 1)->count() }}</h3>
                        <p class="text-muted mb-0">{{__('Active Certificates')}}</p>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card text-center">
                    <div class="card-body">
                        <h3 class="text-info">{{ $certificates->where('status', 0)->count() }}</h3>
                        <p class="text-muted mb-0">{{__('Inactive Certificates')}}</p>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card text-center">
                    <div class="card-body">
                        <h3 class="text-warning">{{ $certificates->where('created_at', '>=', now()->subDays(30))->count() }}</h3>
                        <p class="text-muted mb-0">{{__('This Month')}}</p>
                    </div>
                </div>
            </div>
        </div>

    </div>
</div>
@endsection
