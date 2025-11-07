@extends('layouts.organization')

@section('breadcrumb')
    <div class="page-banner-content text-center">
        <h3 class="page-banner-heading text-white pb-15">{{__('Create Certificate')}}</h3>
        <nav aria-label="breadcrumb">
            <ol class="breadcrumb justify-content-center">
                <li class="breadcrumb-item font-14"><a href="{{route('main.index')}}">{{__('Home')}}</a></li>
                <li class="breadcrumb-item font-14"><a href="{{route('organization.dashboard')}}">{{__('Dashboard')}}</a></li>
                <li class="breadcrumb-item font-14"><a href="{{route('organization.certificate-management.index')}}">{{__('Certificate Management')}}</a></li>
                <li class="breadcrumb-item font-14 active" aria-current="page">{{__('Create Certificate')}}</li>
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
                    <h5 class="mb-0">{{__('Create Certificate Template')}}</h5>
                    <a href="{{ route('organization.certificate-management.index') }}" class="btn btn-outline-secondary">
                        <i class="mdi mdi-arrow-left me-1"></i>{{__('Back to Certificates')}}
                    </a>
                </div>
            </div>
        </div>

        <!-- Certificate Creation Form -->
        <div class="row">
            <div class="col-12 col-md-7 col-lg-7 col-xl-8">
                <div class="sticky-top" id="certificate-preview-div">
                    <!-- Live preview will be loaded here -->
                    <div class="text-center p-4">
                        <img src="{{asset('frontend/assets/img/certificate.jpg')}}" alt="Certificate Preview" class="img-fluid" style="max-width: 100%; height: auto;">
                        <p class="mt-2 text-muted">Certificate preview will appear here</p>
                    </div>
                </div>

                <div style="overflow: hidden; height: 0; position: absolute; top: -9999px;">
                    <div id="certificate-preview-div-hidden" style="width:1030px; height:734px; overflow:hidden; position: relative;">
                        <img src="{{asset('frontend/assets/img/certificate.jpg')}}" alt="img" class="sample-certificate-img-show img-fluid" style="width: 1030px; height: 734px;">
                    </div>
                </div>
            </div>

            <div class="col-12 col-md-5 col-lg-5 col-xl-4">
                <form method="POST" id="certificate-form" action="{{route('organization.certificate-management.store')}}" enctype="multipart/form-data">
                    @csrf
                    <div class="create-certificate-sidebar admin-certificate-sidebar">
                        <div class="accordion" id="accordionPanelsStayOpenExample">
                            
                            <!-- Background Image Section -->
                            <div class="row">
                                <div class="col-md-12 mb-15">
                                    <div class="label-text-title color-heading font-16 mb-1">{{__('Background Image')}}</div>
                                    <div class="create-certificate-browse-file form-control mb-2">
                                        <div>
                                            <input type="file" name="background_image" accept="image/*" class="form-control" title="Browse Image File">
                                        </div>
                                    </div>
                                    <div class="recomended-size-for-img font-12">{{__('Accepted Files')}}: JPG, PNG</div>
                                    <div class="recomended-size-for-img font-12">{{__('Accepted Size')}}: 1030 x 734</div>
                                    @if ($errors->has('background_image'))
                                        <span class="text-danger"><i class="fas fa-exclamation-triangle"></i> {{ $errors->first('background_image') }}</span>
                                    @endif
                                </div>
                            </div>

                            <!-- Certificate Number Section -->
                            <div class="accordion-item course-sidebar-accordion-item">
                                <h2 class="accordion-header course-sidebar-title mb-2" id="panelsStayOpen-headingOne">
                                    <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#panelsStayOpen-collapseOne" aria-expanded="true" aria-controls="panelsStayOpen-collapseOne">
                                        {{__('Certificate Number')}}
                                    </button>
                                </h2>
                                <div id="panelsStayOpen-collapseOne" class="accordion-collapse collapse show" aria-labelledby="panelsStayOpen-headingOne">
                                    <div class="accordion-body">
                                        <div class="certificate-inner-box">
                                            <div class="row">
                                                <div class="col-md-12 mb-15">
                                                    <div class="label-text-title color-heading font-16 mb-1">{{__('Certificate Number Show')}}</div>
                                                    <div class="admin-certificate-radio d-flex align-items-center">
                                                        <div class="form-check mb-0 d-flex align-items-center">
                                                            <input class="form-check-input" type="radio" name="show_number" id="show_number_yes" value="yes" {{old('show_number')=='yes' ? 'checked' : '' }}>
                                                            <label class="form-check-label mb-0 color-heading" for="show_number_yes">{{__('Yes')}}</label>
                                                        </div>
                                                        <div class="form-check mb-0 d-flex align-items-center">
                                                            <input class="form-check-input" type="radio" name="show_number" id="show_number_no" value="no" {{old('show_number')=='no' ? 'checked' : '' }}>
                                                            <label class="form-check-label mb-0 color-heading" for="show_number_no">{{__('No')}}</label>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="row">
                                                <div class="col-md-12 mb-15">
                                                    <div class="label-text-title color-heading font-16 mb-1">{{__('Position X')}}</div>
                                                    <input type="number" min="0" name="number_x_position" value="{{old('number_x_position')}}" class="form-control" placeholder="0">
                                                </div>
                                            </div>
                                            <div class="row">
                                                <div class="col-md-12 mb-15">
                                                    <div class="label-text-title color-heading font-16 mb-1">{{__('Position Y')}}</div>
                                                    <input type="number" min="0" name="number_y_position" value="{{old('number_y_position')}}" class="form-control" placeholder="20">
                                                </div>
                                            </div>
                                            <div class="row">
                                                <div class="col-md-6 mb-15">
                                                    <div class="label-text-title color-heading font-16 mb-1">{{__('Font Size')}}</div>
                                                    <input type="number" min="1" name="number_font_size" value="{{old('number_font_size')}}" class="form-control" placeholder="20">
                                                </div>
                                                <div class="col-md-6 mb-15">
                                                    <div class="label-text-title color-heading font-16 mb-1">{{__('Font Color')}}</div>
                                                    <span class="color-picker">
                                                        <label for="colorPicker3" class="mb-0">
                                                            <input type="color" name="number_font_color" value="{{old('number_font_color') ? : '#363234'}}" id="colorPicker3">
                                                        </label>
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Certificate Title Section -->
                            <div class="accordion-item course-sidebar-accordion-item">
                                <h2 class="accordion-header course-sidebar-title mb-2" id="panelsStayOpen-headingTwo">
                                    <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#panelsStayOpen-collapseTwo" aria-expanded="false" aria-controls="panelsStayOpen-collapseTwo">
                                        {{__('Certificate Title')}}
                                    </button>
                                </h2>
                                <div id="panelsStayOpen-collapseTwo" class="accordion-collapse collapse" aria-labelledby="panelsStayOpen-headingTwo">
                                    <div class="accordion-body">
                                        <div class="certificate-inner-box">
                                            <div class="row">
                                                <div class="col-md-12 mb-15">
                                                    <div class="label-text-title color-heading font-16 mb-1">{{__('Title')}}</div>
                                                    <input type="text" name="title" value="{{old('title')}}" class="form-control" placeholder="Certificate of Completion">
                                                </div>
                                            </div>
                                            <div class="row">
                                                <div class="col-md-12 mb-15">
                                                    <div class="label-text-title color-heading font-16 mb-1">{{__('Position X')}}</div>
                                                    <input type="number" min="0" name="title_x_position" value="{{old('title_x_position')}}" class="form-control" placeholder="0">
                                                </div>
                                            </div>
                                            <div class="row">
                                                <div class="col-md-12 mb-15">
                                                    <div class="label-text-title color-heading font-16 mb-1">{{__('Position Y')}}</div>
                                                    <input type="number" min="0" name="title_y_position" value="{{old('title_y_position')}}" class="form-control" placeholder="100">
                                                </div>
                                            </div>
                                            <div class="row">
                                                <div class="col-md-6 mb-15">
                                                    <div class="label-text-title color-heading font-16 mb-1">{{__('Font Size')}}</div>
                                                    <input type="number" min="1" name="title_font_size" value="{{old('title_font_size')}}" class="form-control" placeholder="30">
                                                </div>
                                                <div class="col-md-6 mb-15">
                                                    <div class="label-text-title color-heading font-16 mb-1">{{__('Font Color')}}</div>
                                                    <span class="color-picker">
                                                        <label for="colorPicker4" class="mb-0">
                                                            <input type="color" name="title_font_color" value="{{old('title_font_color') ? : '#363234'}}" id="colorPicker4">
                                                        </label>
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Student Name Section -->
                            <div class="accordion-item course-sidebar-accordion-item">
                                <h2 class="accordion-header course-sidebar-title mb-2" id="panelsStayOpen-headingThree">
                                    <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#panelsStayOpen-collapseThree" aria-expanded="false" aria-controls="panelsStayOpen-collapseThree">
                                        {{__('Student Name')}}
                                    </button>
                                </h2>
                                <div id="panelsStayOpen-collapseThree" class="accordion-collapse collapse" aria-labelledby="panelsStayOpen-headingThree">
                                    <div class="accordion-body">
                                        <div class="certificate-inner-box">
                                            <div class="row">
                                                <div class="col-md-12 mb-15">
                                                    <div class="label-text-title color-heading font-16 mb-1">{{__('Student Name Show')}}</div>
                                                    <div class="admin-certificate-radio d-flex align-items-center">
                                                        <div class="form-check mb-0 d-flex align-items-center">
                                                            <input class="form-check-input" type="radio" name="show_student_name" id="show_student_name_yes" value="yes" {{old('show_student_name')=='yes' ? 'checked' : '' }}>
                                                            <label class="form-check-label mb-0 color-heading" for="show_student_name_yes">{{__('Yes')}}</label>
                                                        </div>
                                                        <div class="form-check mb-0 d-flex align-items-center">
                                                            <input class="form-check-input" type="radio" name="show_student_name" id="show_student_name_no" value="no" {{old('show_student_name')=='no' ? 'checked' : '' }}>
                                                            <label class="form-check-label mb-0 color-heading" for="show_student_name_no">{{__('No')}}</label>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="row">
                                                <div class="col-md-12 mb-15">
                                                    <div class="label-text-title color-heading font-16 mb-1">{{__('Position X')}}</div>
                                                    <input type="number" min="0" name="student_name_x_position" value="{{old('student_name_x_position')}}" class="form-control" placeholder="0">
                                                </div>
                                            </div>
                                            <div class="row">
                                                <div class="col-md-12 mb-15">
                                                    <div class="label-text-title color-heading font-16 mb-1">{{__('Position Y')}}</div>
                                                    <input type="number" min="0" name="student_name_y_position" value="{{old('student_name_y_position')}}" class="form-control" placeholder="200">
                                                </div>
                                            </div>
                                            <div class="row">
                                                <div class="col-md-6 mb-15">
                                                    <div class="label-text-title color-heading font-16 mb-1">{{__('Font Size')}}</div>
                                                    <input type="number" min="1" name="student_name_font_size" value="{{old('student_name_font_size')}}" class="form-control" placeholder="24">
                                                </div>
                                                <div class="col-md-6 mb-15">
                                                    <div class="label-text-title color-heading font-16 mb-1">{{__('Font Color')}}</div>
                                                    <span class="color-picker">
                                                        <label for="colorPicker5" class="mb-0">
                                                            <input type="color" name="student_name_font_color" value="{{old('student_name_font_color') ? : '#363234'}}" id="colorPicker5">
                                                        </label>
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Certificate Body Section -->
                            <div class="accordion-item course-sidebar-accordion-item">
                                <h2 class="accordion-header course-sidebar-title mb-2" id="panelsStayOpen-headingFour">
                                    <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#panelsStayOpen-collapseFour" aria-expanded="false" aria-controls="panelsStayOpen-collapseFour">
                                        {{__('Certificate Body')}}
                                    </button>
                                </h2>
                                <div id="panelsStayOpen-collapseFour" class="accordion-collapse collapse" aria-labelledby="panelsStayOpen-headingFour">
                                    <div class="accordion-body">
                                        <div class="certificate-inner-box">
                                            <div class="row">
                                                <div class="col-md-12 mb-15">
                                                    <div class="label-text-title color-heading font-16 mb-1">{{__('Body Text')}}</div>
                                                    <textarea name="body" class="form-control" rows="3" placeholder="This is to certify that {student_name} has successfully completed the course {course_name}">{{old('body')}}</textarea>
                                                </div>
                                            </div>
                                            <div class="row">
                                                <div class="col-md-12 mb-15">
                                                    <div class="label-text-title color-heading font-16 mb-1">{{__('Position X')}}</div>
                                                    <input type="number" min="0" name="body_x_position" value="{{old('body_x_position')}}" class="form-control" placeholder="0">
                                                </div>
                                            </div>
                                            <div class="row">
                                                <div class="col-md-12 mb-15">
                                                    <div class="label-text-title color-heading font-16 mb-1">{{__('Position Y')}}</div>
                                                    <input type="number" min="0" name="body_y_position" value="{{old('body_y_position')}}" class="form-control" placeholder="300">
                                                </div>
                                            </div>
                                            <div class="row">
                                                <div class="col-md-6 mb-15">
                                                    <div class="label-text-title color-heading font-16 mb-1">{{__('Font Size')}}</div>
                                                    <input type="number" min="1" name="body_font_size" value="{{old('body_font_size')}}" class="form-control" placeholder="16">
                                                </div>
                                                <div class="col-md-6 mb-15">
                                                    <div class="label-text-title color-heading font-16 mb-1">{{__('Font Color')}}</div>
                                                    <span class="color-picker">
                                                        <label for="colorPicker6" class="mb-0">
                                                            <input type="color" name="body_font_color" value="{{old('body_font_color') ? : '#363234'}}" id="colorPicker6">
                                                        </label>
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Date Section -->
                            <div class="accordion-item course-sidebar-accordion-item">
                                <h2 class="accordion-header course-sidebar-title mb-2" id="panelsStayOpen-headingFive">
                                    <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#panelsStayOpen-collapseFive" aria-expanded="false" aria-controls="panelsStayOpen-collapseFive">
                                        {{__('Date')}}
                                    </button>
                                </h2>
                                <div id="panelsStayOpen-collapseFive" class="accordion-collapse collapse" aria-labelledby="panelsStayOpen-headingFive">
                                    <div class="accordion-body">
                                        <div class="certificate-inner-box">
                                            <div class="row">
                                                <div class="col-md-12 mb-15">
                                                    <div class="label-text-title color-heading font-16 mb-1">{{__('Date Show')}}</div>
                                                    <div class="admin-certificate-radio d-flex align-items-center">
                                                        <div class="form-check mb-0 d-flex align-items-center">
                                                            <input class="form-check-input" type="radio" name="show_date" id="show_date_yes" value="yes" {{old('show_date')=='yes' ? 'checked' : '' }}>
                                                            <label class="form-check-label mb-0 color-heading" for="show_date_yes">{{__('Yes')}}</label>
                                                        </div>
                                                        <div class="form-check mb-0 d-flex align-items-center">
                                                            <input class="form-check-input" type="radio" name="show_date" id="show_date_no" value="no" {{old('show_date')=='no' ? 'checked' : '' }}>
                                                            <label class="form-check-label mb-0 color-heading" for="show_date_no">{{__('No')}}</label>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="row">
                                                <div class="col-md-12 mb-15">
                                                    <div class="label-text-title color-heading font-16 mb-1">{{__('Position X')}}</div>
                                                    <input type="number" min="0" name="date_x_position" value="{{old('date_x_position')}}" class="form-control" placeholder="0">
                                                </div>
                                            </div>
                                            <div class="row">
                                                <div class="col-md-12 mb-15">
                                                    <div class="label-text-title color-heading font-16 mb-1">{{__('Position Y')}}</div>
                                                    <input type="number" min="0" name="date_y_position" value="{{old('date_y_position')}}" class="form-control" placeholder="400">
                                                </div>
                                            </div>
                                            <div class="row">
                                                <div class="col-md-6 mb-15">
                                                    <div class="label-text-title color-heading font-16 mb-1">{{__('Font Size')}}</div>
                                                    <input type="number" min="1" name="date_font_size" value="{{old('date_font_size')}}" class="form-control" placeholder="14">
                                                </div>
                                                <div class="col-md-6 mb-15">
                                                    <div class="label-text-title color-heading font-16 mb-1">{{__('Font Color')}}</div>
                                                    <span class="color-picker">
                                                        <label for="colorPicker7" class="mb-0">
                                                            <input type="color" name="date_font_color" value="{{old('date_font_color') ? : '#363234'}}" id="colorPicker7">
                                                        </label>
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Role 1 Section -->
                            <div class="accordion-item course-sidebar-accordion-item">
                                <h2 class="accordion-header course-sidebar-title mb-2" id="panelsStayOpen-headingSix">
                                    <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#panelsStayOpen-collapseSix" aria-expanded="false" aria-controls="panelsStayOpen-collapseSix">
                                        {{__('Role 1')}}
                                    </button>
                                </h2>
                                <div id="panelsStayOpen-collapseSix" class="accordion-collapse collapse" aria-labelledby="panelsStayOpen-headingSix">
                                    <div class="accordion-body">
                                        <div class="certificate-inner-box">
                                            <div class="row">
                                                <div class="col-md-12 mb-15">
                                                    <div class="label-text-title color-heading font-16 mb-1">{{__('Role 1 Show')}}</div>
                                                    <div class="admin-certificate-radio d-flex align-items-center">
                                                        <div class="form-check mb-0 d-flex align-items-center">
                                                            <input class="form-check-input" type="radio" name="role_1_show" id="role_1_show_yes" value="yes" {{old('role_1_show')=='yes' ? 'checked' : '' }}>
                                                            <label class="form-check-label mb-0 color-heading" for="role_1_show_yes">{{__('Yes')}}</label>
                                                        </div>
                                                        <div class="form-check mb-0 d-flex align-items-center">
                                                            <input class="form-check-input" type="radio" name="role_1_show" id="role_1_show_no" value="no" {{old('role_1_show')=='no' ? 'checked' : '' }}>
                                                            <label class="form-check-label mb-0 color-heading" for="role_1_show_no">{{__('No')}}</label>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="row">
                                                <div class="col-md-12 mb-15">
                                                    <div class="label-text-title color-heading font-16 mb-1">{{__('Title')}}</div>
                                                    <input type="text" name="role_1_title" value="{{old('role_1_title')}}" class="form-control" placeholder="Director">
                                                </div>
                                            </div>
                                            <div class="row">
                                                <div class="col-md-12 mb-15">
                                                    <div class="label-text-title color-heading font-16 mb-1">{{__('Position X')}}</div>
                                                    <input type="number" min="0" name="role_1_x_position" value="{{old('role_1_x_position')}}" class="form-control" placeholder="200">
                                                </div>
                                            </div>
                                            <div class="row">
                                                <div class="col-md-12 mb-15">
                                                    <div class="label-text-title color-heading font-16 mb-1">{{__('Position Y')}}</div>
                                                    <input type="number" min="0" name="role_1_y_position" value="{{old('role_1_y_position')}}" class="form-control" placeholder="600">
                                                </div>
                                            </div>
                                            <div class="row">
                                                <div class="col-md-6 mb-15">
                                                    <div class="label-text-title color-heading font-16 mb-1">{{__('Font Size')}}</div>
                                                    <input type="number" min="1" name="role_1_font_size" value="{{old('role_1_font_size')}}" class="form-control" placeholder="14">
                                                </div>
                                                <div class="col-md-6 mb-15">
                                                    <div class="label-text-title color-heading font-16 mb-1">{{__('Font Color')}}</div>
                                                    <span class="color-picker">
                                                        <label for="colorPicker8" class="mb-0">
                                                            <input type="color" name="role_1_font_color" value="{{old('role_1_font_color') ? : '#363234'}}" id="colorPicker8">
                                                        </label>
                                                    </span>
                                                </div>
                                            </div>
                                            <div class="row">
                                                <div class="col-md-12 mb-15">
                                                    <div class="label-text-title color-heading font-16 mb-1">{{__('Signature')}}</div>
                                                    <div class="create-certificate-browse-file form-control mb-2">
                                                        <div>
                                                            <input type="file" name="role_1_signature" accept="image/*" class="form-control" title="Browse Signature File">
                                                        </div>
                                                    </div>
                                                    <div class="recomended-size-for-img font-12">{{__('Accepted Files')}}: PNG</div>
                                                    <div class="recomended-size-for-img font-12">{{__('Accepted Size')}}: 120 x 60</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Role 2 Section -->
                            <div class="accordion-item course-sidebar-accordion-item">
                                <h2 class="accordion-header course-sidebar-title mb-2" id="panelsStayOpen-headingSeven">
                                    <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#panelsStayOpen-collapseSeven" aria-expanded="false" aria-controls="panelsStayOpen-collapseSeven">
                                        {{__('Role 2')}}
                                    </button>
                                </h2>
                                <div id="panelsStayOpen-collapseSeven" class="accordion-collapse collapse" aria-labelledby="panelsStayOpen-headingSeven">
                                    <div class="accordion-body">
                                        <div class="certificate-inner-box">
                                            <div class="row">
                                                <div class="col-md-12 mb-15">
                                                    <div class="label-text-title color-heading font-16 mb-1">{{__('Role 2 Show')}}</div>
                                                    <div class="admin-certificate-radio d-flex align-items-center">
                                                        <div class="form-check mb-0 d-flex align-items-center">
                                                            <input class="form-check-input" type="radio" name="role_2_show" id="role_2_show_yes" value="yes" {{old('role_2_show')=='yes' ? 'checked' : '' }}>
                                                            <label class="form-check-label mb-0 color-heading" for="role_2_show_yes">{{__('Yes')}}</label>
                                                        </div>
                                                        <div class="form-check mb-0 d-flex align-items-center">
                                                            <input class="form-check-input" type="radio" name="role_2_show" id="role_2_show_no" value="no" {{old('role_2_show')=='no' ? 'checked' : '' }}>
                                                            <label class="form-check-label mb-0 color-heading" for="role_2_show_no">{{__('No')}}</label>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="row">
                                                <div class="col-md-12 mb-15">
                                                    <div class="label-text-title color-heading font-16 mb-1">{{__('Title')}}</div>
                                                    <input type="text" name="role_2_title" value="{{old('role_2_title')}}" class="form-control" placeholder="Instructor">
                                                </div>
                                            </div>
                                            <div class="row">
                                                <div class="col-md-12 mb-15">
                                                    <div class="label-text-title color-heading font-16 mb-1">{{__('Position X')}}</div>
                                                    <input type="number" min="0" name="role_2_x_position" value="{{old('role_2_x_position')}}" class="form-control" placeholder="600">
                                                </div>
                                            </div>
                                            <div class="row">
                                                <div class="col-md-12 mb-15">
                                                    <div class="label-text-title color-heading font-16 mb-1">{{__('Position Y')}}</div>
                                                    <input type="number" min="0" name="role_2_y_position" value="{{old('role_2_y_position')}}" class="form-control" placeholder="600">
                                                </div>
                                            </div>
                                            <div class="row">
                                                <div class="col-md-6 mb-15">
                                                    <div class="label-text-title color-heading font-16 mb-1">{{__('Font Size')}}</div>
                                                    <input type="number" min="1" name="role_2_font_size" value="{{old('role_2_font_size')}}" class="form-control" placeholder="14">
                                                </div>
                                                <div class="col-md-6 mb-15">
                                                    <div class="label-text-title color-heading font-16 mb-1">{{__('Font Color')}}</div>
                                                    <span class="color-picker">
                                                        <label for="colorPicker9" class="mb-0">
                                                            <input type="color" name="role_2_font_color" value="{{old('role_2_font_color') ? : '#363234'}}" id="colorPicker9">
                                                        </label>
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Action Buttons -->
                            <div class="row mt-4">
                                <div class="col-12">
                                    <div class="d-grid gap-2">
                                        <button type="button" class="btn btn-info" id="test-preview-btn">
                                            <i class="mdi mdi-eye me-1"></i>{{__('Test Preview')}}
                                        </button>
                                        <button type="submit" class="btn btn-primary" name="preview">
                                            <i class="mdi mdi-eye me-1"></i>{{__('Preview')}}
                                        </button>
                                        <button type="submit" class="btn btn-success" name="final_submit" value="1">
                                            <i class="mdi mdi-content-save me-1"></i>{{__('Save Certificate')}}
                                        </button>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </form>
            </div>
        </div>

    </div>
</div>
@endsection

@push('style')
<style>
.admin-certificate-page {
    background: #f8f9fa;
    padding: 20px;
    border-radius: 8px;
}

.create-certificate-sidebar {
    background: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.course-sidebar-accordion-item {
    border: 1px solid #dee2e6;
    border-radius: 8px;
    margin-bottom: 15px;
}

.course-sidebar-title .accordion-button {
    background: #f8f9fa;
    border: none;
    font-weight: 600;
    color: #495057;
}

.course-sidebar-title .accordion-button:not(.collapsed) {
    background: #007bff;
    color: white;
}

.certificate-inner-box {
    padding: 15px;
}

.admin-certificate-radio {
    gap: 20px;
}

.color-picker input[type="color"] {
    width: 40px;
    height: 40px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}

.recomended-size-for-img {
    color: #6c757d;
    font-size: 12px;
}

#certificate-preview-div {
    min-height: 400px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    padding: 20px;
}

.sample-certificate-img-show {
    max-width: 100%;
    height: auto;
}
</style>
@endpush

@push('script')
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
<script>
$(document).ready(function() {
    // Prevent form submission on Enter key
    $(document).on('keypress', 'input', function(e) {
        if ( e.which == 13 ) e.preventDefault();
    });
    
    // Auto-preview on input change (exactly like admin)
    $(document).on('input', '.form-control,.form-check-input', function(e){
        e.preventDefault();

        clearTimeout( $(this).data('timer') );

        var timer = setTimeout(function() {
            var form = $('#certificate-form');
            let enctype = form.prop("enctype");
            if (!enctype) {
                enctype = "application/x-www-form-urlencoded";
            }

            $.ajax({
                type: form.prop('method'),
                encType: enctype,
                contentType: false,
                processData: false,
                url: form.prop('action'),
                data: new FormData( form[0]),
                dataType: 'json',
                success: function(response){
                    console.log('Response:', response);
                    if(typeof response.certificate != 'undefined'){
                        $('#certificate-preview-div-hidden').html(response.certificate);
                        screenshot()
                    }
                },
                error: function(xhr, status, error) {
                    console.log('AJAX Error:', xhr.responseText);
                }
            });
        }, 1000);
        
        $(this).data('timer', timer);
    });

    // Handle save and preview button
    $(document).on('click', 'button[name="preview"]', function(e){
        e.preventDefault();

        var form = $('#certificate-form');
        let enctype = form.prop("enctype");
        if (!enctype) {
            enctype = "application/x-www-form-urlencoded";
        }

        $.ajax({
            type: form.prop('method'),
            encType: enctype,
            contentType: false,
            processData: false,
            url: form.prop('action'),
            data: new FormData( form[0]),
            dataType: 'json',
            success: function(response){
                if(typeof response.certificate != 'undefined'){
                    $('#certificate-preview-div-hidden').html(response.certificate);
                    screenshot()
                }
            }
        });
    });

    // Handle final submit button
    $(document).on('click', 'button[name="final_submit"]', function(e){
        e.preventDefault();

        var form = $('#certificate-form');
        let enctype = form.prop("enctype");
        if (!enctype) {
            enctype = "application/x-www-form-urlencoded";
        }

        $(document).find(':input[name=final_submit]').val(1);

        $.ajax({
            type: form.prop('method'),
            encType: enctype,
            contentType: false,
            processData: false,
            url: form.prop('action'),
            data: new FormData( form[0]),
            dataType: 'json',
            success: function(response){
                if(typeof response.certificate != 'undefined'){
                    $('#certificate-preview-div-hidden').html(response.certificate);
                }
                else if(typeof response.view != 'undefined'){
                    window.location.href = response.view;
                }
            }
        });
    });

    // Test preview button
    $(document).on('click', '#test-preview-btn', function(e){
        e.preventDefault();
        
        // Create a simple test certificate HTML
        var testHtml = `
            <div class="certificate-preview" style="position: relative; width: 100%; max-width: 1030px; margin: 0 auto;">
                <img src="{{asset('frontend/assets/img/certificate.jpg')}}" alt="Certificate Background" style="width: 100%; height: auto; position: absolute; top: 0; left: 0; z-index: 1;">
                <div class="certificate-content" style="position: relative; z-index: 2; width: 100%; height: 734px;">
                    <div style="position: absolute; left: 50px; top: 100px; font-size: 30px; color: #363234; font-weight: bold; text-align: center; width: 100%;">
                        Certificate of Completion
                    </div>
                    <div style="position: absolute; left: 50px; top: 200px; font-size: 24px; color: #363234; font-weight: bold; text-align: center; width: 100%;">
                        John Doe
                    </div>
                    <div style="position: absolute; left: 50px; top: 300px; font-size: 16px; color: #363234; text-align: center; width: 100%; max-width: 800px; margin: 0 auto;">
                        This is to certify that John Doe has successfully completed the course Web Development
                    </div>
                </div>
            </div>
        `;
        
        $('#certificate-preview-div').html(testHtml);
        console.log('Test preview loaded');
    });

    // Screenshot function (exactly like admin)
    function screenshot(){
        html2canvas(document.getElementById("certificate-preview-div-hidden")).then(function(canvas){
            $("#certificate-preview-div").html('<img class="img-fluid" src="'+canvas.toDataURL()+'" />');
        });
    }
});
</script>
@endpush