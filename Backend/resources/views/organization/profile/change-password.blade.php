@extends('layouts.organization')

@section('breadcrumb')
    <div class="page-banner-content text-center">
        <h3 class="page-banner-heading text-white pb-15"> {{__('Change Password')}} </h3>

        <!-- Breadcrumb Start-->
        <nav aria-label="breadcrumb">
            <ol class="breadcrumb justify-content-center">
                <li class="breadcrumb-item font-14"><a href="{{route('organization.dashboard')}}">{{__('Dashboard')}}</a></li>
                <li class="breadcrumb-item font-14"><a href="{{route('organization.profile')}}">{{__('Profile')}}</a></li>
                <li class="breadcrumb-item font-14 active" aria-current="page">{{__('Change Password')}}</li>
            </ol>
        </nav>
    </div>
@endsection

@section('content')
    <div class="instructor-profile-right-part">
        <form method="POST" action="{{route('organization.change-password')}}" class="form-horizontal">
            @csrf
            <div class="instructor-profile-info-box">
                <div class="instructor-my-courses-title d-flex justify-content-between align-items-center">
                    <h6>{{ __('Update Password') }}</h6>
                </div>

                <div class="row">
                    <div class="col-md-6 mb-30">
                        <label class="font-medium font-15 color-heading">{{ __('New Password') }} <span class="text-danger">*</span></label>
                        <input type="password" name="password" id="password" value="" placeholder="{{ __('Type your new password') }}" class="form-control" required>
                        @if ($errors->has('password'))
                            <span class="text-danger"><i class="fas fa-exclamation-triangle"></i> {{ $errors->first('password') }}</span>
                        @endif
                    </div>
                    <div class="col-md-6 mb-30">
                        <label class="font-medium font-15 color-heading">{{ __('Confirm Password') }} <span class="text-danger">*</span></label>
                        <input type="password" name="password_confirmation" id="password_confirmation" value="" placeholder="{{ __('Type your confirm password') }}" class="form-control" required>
                        @if ($errors->has('password_confirmation'))
                            <span class="text-danger"><i class="fas fa-exclamation-triangle"></i> {{ $errors->first('password_confirmation') }}</span>
                        @endif
                    </div>
                </div>

                <div class="row mb-3">
                    <div class="col-md-12">
                        <div class="d-flex justify-content-end">
                            <button type="submit" class="theme-btn theme-button1 theme-button3 font-15 fw-bold">{{ __('Update Password') }}</button>
                        </div>
                    </div>
                </div>
            </div>
        </form>
    </div>
@endsection
