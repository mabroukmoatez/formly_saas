@extends('layouts.organization')

@section('breadcrumb')
    <div class="page-banner-content text-center">
        <h3 class="page-banner-heading text-white pb-15">{{__('Organization Settings')}}</h3>
        <nav aria-label="breadcrumb">
            <ol class="breadcrumb justify-content-center">
                <li class="breadcrumb-item font-14"><a href="{{route('main.index')}}">{{__('Home')}}</a></li>
                <li class="breadcrumb-item font-14"><a href="{{route('organization.dashboard')}}">{{__('Dashboard')}}</a></li>
                <li class="breadcrumb-item font-14 active" aria-current="page">{{__('Settings')}}</li>
            </ol>
        </nav>
    </div>
@endsection

@section('content')
<div class="instructor-profile-right-part">
    <div class="instructor-dashboard-box">
        
        <!-- Settings Navigation -->
        <div class="row mb-30">
            <div class="col-12">
                <div class="settings-nav">
                    <ul class="nav nav-pills nav-fill">
                        <li class="nav-item">
                            <a class="nav-link {{ request()->routeIs('organization.settings.general') ? 'active' : '' }}" 
                               href="{{ route('organization.settings.general') }}">
                                <i class="mdi mdi-cog me-2"></i>{{__('General')}}
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link {{ request()->routeIs('organization.settings.branding') ? 'active' : '' }}" 
                               href="{{ route('organization.settings.branding') }}">
                                <i class="mdi mdi-palette me-2"></i>{{__('White Label')}}
                            </a>
                        </li>
                    </ul>
                </div>
            </div>
        </div>

        <!-- Settings Content -->
        <div class="row">
            <div class="col-12">
                <div class="settings-content">
                    @yield('settings-content')
                </div>
            </div>
        </div>

    </div>
</div>
@endsection

@push('style')
<style>
.settings-nav .nav-pills .nav-link {
    border-radius: 8px;
    margin: 0 5px;
    background-color: #f8f9fa;
    color: #6c757d;
    border: 1px solid #e9ecef;
}

.settings-nav .nav-pills .nav-link.active {
    background-color: #007bff;
    color: white;
    border-color: #007bff;
}

.settings-nav .nav-pills .nav-link:hover {
    background-color: #e9ecef;
    color: #495057;
}

.settings-content {
    background: white;
    border-radius: 8px;
    padding: 30px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
</style>
@endpush
