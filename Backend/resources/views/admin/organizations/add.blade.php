@extends('layouts.admin')

@section('content')
<!-- Page content area start -->
<div class="page-content">
    <div class="container-fluid">
        <div class="row">
            <div class="col-md-12">
                <div class="breadcrumb__content">
                    <div class="breadcrumb__content__left">
                        <div class="breadcrumb__title">
                            <h2>{{ __('Add Organization') }}</h2>
                        </div>
                    </div>
                    <div class="breadcrumb__content__right">
                        <nav aria-label="breadcrumb">
                            <ul class="breadcrumb">
                                <li class="breadcrumb-item"><a
                                        href="{{route('admin.dashboard')}}">{{__('Dashboard')}}</a></li>
                                <li class="breadcrumb-item active" aria-current="page">{{ __('Add Organization') }}</li>
                            </ul>
                        </nav>
                    </div>
                </div>
            </div>
        </div>
        <div class="row">
            <div class="col-md-12">
                <div class="customers__area bg-style mb-30">
                    <div class="item-title d-flex justify-content-between">
                        <h2>{{ __('Add Organization') }}</h2>
                    </div>
                    <form action="{{route('organizations.store')}}" method="post" class="form-horizontal"
                        enctype="multipart/form-data">
                        @csrf
                        <div class="row">
                            <div class="col-md-6">

                                <div class="input__group mb-25">
                                    <label>{{__('First Name')}} <span class="text-danger">*</span></label>
                                    <input type="text" name="first_name" value="{{old('first_name')}}"
                                        placeholder="{{__('First Name')}}" class="form-control" required>
                                    @if ($errors->has('first_name'))
                                    <span class="text-danger"><i class="fas fa-exclamation-triangle"></i> {{
                                        $errors->first('first_name') }}</span>
                                    @endif
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="input__group mb-25">
                                    <label>{{__('Last Name')}} <span class="text-danger">*</span></label>
                                    <input type="text" name="last_name" value="{{old('last_name')}}"
                                        placeholder="{{__('Last Name')}}" class="form-control" required>
                                    @if ($errors->has('last_name'))
                                    <span class="text-danger"><i class="fas fa-exclamation-triangle"></i> {{
                                        $errors->first('last_name') }}</span>
                                    @endif
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="input__group mb-25">
                                    <label>{{__('Email')}} <span class="text-danger">*</span></label>
                                    <input type="email" name="email" value="{{old('email')}}"
                                        placeholder="{{__('Email')}}" class="form-control" required>
                                    @if ($errors->has('email'))
                                    <span class="text-danger"><i class="fas fa-exclamation-triangle"></i> {{
                                        $errors->first('email') }}</span>
                                    @endif
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="input__group mb-25">
                                    <label>{{ __('Password') }} <span class="text-danger">*</span></label>
                                    <input type="password" name="password" value="{{old('password')}}"
                                        placeholder="{{ __('Password') }}" class="form-control" required>
                                    @if ($errors->has('password'))
                                    <span class="text-danger"><i class="fas fa-exclamation-triangle"></i> {{
                                        $errors->first('password') }}</span>
                                    @endif
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="input__group mb-25">
                                    <label>{{__('Professional Title')}} <span class="text-danger">*</span></label>
                                    <input type="text" name="professional_title" value="{{old('professional_title')}}"
                                        placeholder="{{__('Professional Title')}}" class="form-control" required>
                                    @if ($errors->has('professional_title'))
                                    <span class="text-danger"><i class="fas fa-exclamation-triangle"></i> {{
                                        $errors->first('professional_title') }}</span>
                                    @endif
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="input__group mb-25">
                                    <label class="label-text-title color-heading font-medium font-16 mb-3">{{ __('Area
                                        Code')
                                        }} <span class="text-danger">*</span></label>
                                    <select class="form-control" name="area_code">
                                        <option value>{{ __("Select Code") }}</option>
                                        @foreach ($countries as $country)
                                        <option value="{{ $country->phonecode }}" @if(old('area_code',)==$country->
                                            phonecode) selected @endif>{{ $country->short_name.'('.$country->phonecode.')' }}</option>
                                        @endforeach
                                    </select>
                                    @if ($errors->has('area_code'))
                                    <span class="text-danger"><i class="fas fa-exclamation-triangle"></i> {{
                                        $errors->first('area_code') }}</span>
                                    @endif
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="input__group mb-25">
                                    <label>{{__('Mobile Number')}}<span class="text-danger">*</span></label>
                                    <input type="text" name="phone_number" value="{{old('phone_number')}}"
                                        placeholder="{{__('Mobile Number')}}" class="form-control">
                                    @if ($errors->has('phone_number'))
                                    <span class="text-danger"><i class="fas fa-exclamation-triangle"></i> {{
                                        $errors->first('phone_number') }}</span>
                                    @endif
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="input__group mb-25">
                                    <label>{{ __('Address') }} <span class="text-danger">*</span></label>
                                    <input type="text" name="address" value="{{old('address')}}"
                                        placeholder="{{ __('Address') }}" class="form-control" required>
                                    @if ($errors->has('address'))
                                    <span class="text-danger"><i class="fas fa-exclamation-triangle"></i> {{
                                        $errors->first('address') }}</span>
                                    @endif
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="input__group mb-25">
                                    <label>{{ __('Postal Code') }} <span class="text-danger">*</span></label>
                                    <input type="text" name="postal_code" value="{{old('postal_code')}}"
                                        placeholder="{{ __('Postal Code') }}" class="form-control" required>
                                    @if ($errors->has('postal_code'))
                                    <span class="text-danger"><i class="fas fa-exclamation-triangle"></i> {{
                                        $errors->first('postal_code') }}</span>
                                    @endif
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="input__group mb-25">
                                    <label>{{__('Country')}}</label>
                                    <select name="country_id" id="country_id" class="form-select">
                                        <option value="">{{__('Select Country')}}</option>
                                        @foreach($countries as $country)
                                        <option value="{{$country->id}}" @if(old('country_id'))
                                            {{old('country_id')==$country->id ? 'selected' : '' }}
                                            @endif >{{$country->country_name}}</option>
                                        @endforeach
                                    </select>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="input__group mb-25">
                                    <label>{{__('State')}}</label>
                                    <select name="state_id" id="state_id" class="form-select">
                                        <option value="">{{__('Select State')}}</option>
                                        @if(old('country_id'))
                                        @foreach($states as $state)
                                        <option value="{{$state->id}}" {{old('state_id')==$state->id ? 'selected' : ''}}
                                            >{{$state->name}}</option>
                                        @endforeach
                                        @endif
                                    </select>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="input__group mb-25">
                                    <label>{{__('City')}}</label>
                                    <select name="city_id" id="city_id" class="form-select">
                                        <option value="">{{__('Select City')}}</option>
                                        @if(old('state_id'))
                                        @foreach($cities as $city)
                                        <option value="{{$city->id}}" {{old('city_id')==$city->id ? 'selected' : '' }}
                                            >{{$city->name}}</option>
                                        @endforeach
                                        @endif
                                    </select>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="input__group mb-25">
                                    <label>{{__('Gender')}}<span class="text-danger">*</span></label>
                                    <select name="gender" id="gender" class="form-select" required>
                                        <option value="">{{__('Select Option')}}</option>
                                        <option value="Male" {{old('gender')=='Male' ? 'selected' : '' }}>{{ __('Male')
                                            }}</option>
                                        <option value="Female" {{old('gender')=='Female' ? 'selected' : '' }}>{{
                                            __('Female') }}</option>
                                        <option value="Others" {{old('gender')=='Others' ? 'selected' : '' }}>{{
                                            __('Others') }}</option>
                                    </select>
                                </div>
                            </div>

                            <div class="col-md-6">
                                <div class="input__group mb-25">
                                    <label>{{ __('Facebook') }} <span class="text-danger">*</span></label>
                                    <input type="text" name="social_link[facebook]" value=""
                                        placeholder="https://facebook.com" class="form-control">
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="input__group mb-25">
                                    <label>{{ __('Twitter') }}</label>
                                    <input type="text" name="social_link[twitter]" value="" class="form-control"
                                        placeholder="https://twitter.com">
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="input__group mb-25">
                                    <label>{{ __('Linkedin') }}</label>
                                    <input type="text" name="social_link[linkedin]" value="" class="form-control"
                                        placeholder="https://linkedin.com">
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="input__group mb-25">
                                    <label>{{ __('Pinterest') }}</label>
                                    <input type="text" name="social_link[pinterest]" value="" class="form-control"
                                        placeholder="https://pinterest.com">
                                </div>
                            </div>

                            <!-- Organization Subdomain Section -->
                            <div class="col-md-12">
                                <div class="card mb-25">
                                    <div class="card-header">
                                        <h5 class="card-title">{{ __('Organization Branding') }}</h5>
                                        <p class="card-text text-muted">{{ __('Configure subdomain for branded access') }}</p>
                                    </div>
                                    <div class="card-body">
                                        <div class="row">
                                            <div class="col-md-6">
                                                <div class="input__group mb-25">
                                                    <label>{{ __('Subdomain') }} <span class="text-danger">*</span></label>
                                                    <input type="text" name="custom_domain" value="{{old('custom_domain')}}"
                                                        placeholder="mycompany" class="form-control" required>
                                                    <small class="form-text text-muted">
                                                        {{ __('This will create:') }} <strong id="subdomain-preview">mycompany.formly.fr</strong>
                                                    </small>
                                                    @if ($errors->has('custom_domain'))
                                                    <span class="text-danger"><i class="fas fa-exclamation-triangle"></i> {{
                                                        $errors->first('custom_domain') }}</span>
                                                    @endif
                                                </div>
                                            </div>
                                            <div class="col-md-6">
                                                <div class="input__group mb-25">
                                                    <label>{{ __('Organization Name') }}</label>
                                                    <input type="text" name="organization_name" value="{{old('organization_name')}}"
                                                        placeholder="{{ __('Organization Display Name') }}" class="form-control">
                                                    <small class="form-text text-muted">
                                                        {{ __('Name shown on branded login page') }}
                                                    </small>
                                                    @if ($errors->has('organization_name'))
                                                    <span class="text-danger"><i class="fas fa-exclamation-triangle"></i> {{
                                                        $errors->first('organization_name') }}</span>
                                                    @endif
                                                </div>
                                            </div>
                                        </div>
                                        <div class="row">
                                            <div class="col-md-12">
                                                <div class="alert alert-info">
                                                    <i class="fas fa-info-circle"></i>
                                                    <strong>{{ __('Note:') }}</strong> {{ __('The organization will use the default Formly logo until they upload their own branding. They can access their branded login at:') }} 
                                                    <code id="login-url-preview">http://localhost/formly.fr/org/mycompany/login</code>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="col-md-12">
                                <div class="input__group mb-25">
                                    <label>{{ __('About Organization') }} <span class="text-danger">*</span></label>
                                    <textarea name="about_me" id="" cols="15" rows="5" required>{{ old('about_me')
                                        }}</textarea>
                                    @if ($errors->has('about_me'))
                                    <span class="text-danger"><i class="fas fa-exclamation-triangle"></i> {{
                                        $errors->first('about_me') }}</span>
                                    @endif
                                </div>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-md-3">
                                <div class="upload-img-box mb-25">
                                    <img src="">
                                    <input type="file" name="image" id="image" accept="image/*"
                                        onchange="previewFile(this)">
                                    <div class="upload-img-box-icon">
                                        <i class="fa fa-camera"></i>
                                        <p class="m-0">{{__('Image')}}</p>
                                    </div>
                                </div>
                            </div>
                            @if ($errors->has('image'))
                            <span class="text-danger"><i class="fas fa-exclamation-triangle"></i> {{
                                $errors->first('image') }}</span>
                            @endif
                            <p>{{ __('Accepted Image Files') }}: JPEG, JPG, PNG <br> {{ __('Accepted Size') }}: 300 x
                                300 (1MB)</p>
                        </div>

                        <div class="row mb-3">
                            <div class="col-md-12 text-right">
                                <button class="btn btn-primary" type="submit">{{ __('Save') }}</button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
</div>
<!-- Page content area end -->
@endsection

@push('style')
<link rel="stylesheet" href="{{asset('admin/css/custom/image-preview.css')}}">
@endpush

@push('script')
<script src="{{asset('admin/js/custom/image-preview.js')}}"></script>
<script src="{{asset('admin/js/custom/admin-profile.js')}}"></script>
<script>
$(document).ready(function() {
    // Real-time subdomain preview
    $('input[name="custom_domain"]').on('input', function() {
        var subdomain = $(this).val().toLowerCase().replace(/[^a-z0-9-]/g, '');
        if (subdomain) {
            $('#subdomain-preview').text(subdomain + '.formly.fr');
            $('#login-url-preview').text('http://localhost/formly.fr/org/' + subdomain + '/login');
        } else {
            $('#subdomain-preview').text('mycompany.formly.fr');
            $('#login-url-preview').text('http://localhost/formly.fr/org/mycompany/login');
        }
    });
    
    // Auto-generate subdomain from organization name
    $('input[name="organization_name"]').on('input', function() {
        var orgName = $(this).val();
        if (orgName && !$('input[name="custom_domain"]').val()) {
            var subdomain = orgName.toLowerCase()
                .replace(/[^a-z0-9\s]/g, '')
                .replace(/\s+/g, '')
                .substring(0, 20);
            $('input[name="custom_domain"]').val(subdomain);
            $('input[name="custom_domain"]').trigger('input');
        }
    });
});
</script>
@endpush
