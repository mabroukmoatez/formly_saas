@extends('layouts.organization')

@section('breadcrumb')
    <div class="page-banner-content text-center">
        <h3 class="page-banner-heading text-white pb-15">{{__('Certificate Preview')}}</h3>
        <nav aria-label="breadcrumb">
            <ol class="breadcrumb justify-content-center">
                <li class="breadcrumb-item font-14"><a href="{{route('main.index')}}">{{__('Home')}}</a></li>
                <li class="breadcrumb-item font-14"><a href="{{route('organization.dashboard')}}">{{__('Dashboard')}}</a></li>
                <li class="breadcrumb-item font-14"><a href="{{route('organization.certificate-management.index')}}">{{__('Certificate Management')}}</a></li>
                <li class="breadcrumb-item font-14 active" aria-current="page">{{__('Certificate Preview')}}</li>
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
                    <h5 class="mb-0">{{__('Certificate Preview')}}</h5>
                    <div>
                        <a href="{{ route('organization.certificate-management.edit', $certificate->uuid) }}" class="btn btn-outline-primary me-2">
                            <i class="mdi mdi-pencil me-1"></i>{{__('Edit Certificate')}}
                        </a>
                        <a href="{{ route('organization.certificate-management.index') }}" class="btn btn-outline-secondary">
                            <i class="mdi mdi-arrow-left me-1"></i>{{__('Back to Certificates')}}
                        </a>
                    </div>
                </div>
            </div>
        </div>

        <!-- Certificate Preview -->
        <div class="row">
            <div class="col-12">
                <div class="text-center mb-4">
                    <h6 class="text-muted">{{__('Certificate Preview')}}</h6>
                    <p class="text-muted">{{__('This is how your certificate will look when generated')}}</p>
                </div>
                
                <div class="certificate-preview-container" style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
                    <div class="certificate-preview" style="position: relative; width: 100%; max-width: 1030px; margin: 0 auto; background: white; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
                        @if($certificate->image)
                            <img src="{{ $certificate->image_url }}" alt="Certificate Background" style="width: 100%; height: auto; position: absolute; top: 0; left: 0; z-index: 1;">
                        @else
                            <img src="{{ asset('frontend/assets/img/certificate.jpg') }}" alt="Certificate Background" style="width: 100%; height: auto; position: absolute; top: 0; left: 0; z-index: 1;">
                        @endif
                        
                        <div class="certificate-content" style="position: relative; z-index: 2; width: 100%; height: 734px;">
                            
                            <!-- Certificate Number -->
                            @if($certificate->show_number == 'yes')
                                <div style="position: absolute; left: {{ $certificate->number_x_position ?? 0 }}px; top: {{ $certificate->number_y_position ?? 20 }}px; font-size: {{ $certificate->number_font_size ?? 20 }}px; color: {{ $certificate->number_font_color ?? '#363234' }}; font-weight: bold;">
                                    Certificate #{{ $certificate->certificate_number }}
                                </div>
                            @endif
                            
                            <!-- Certificate Title -->
                            @if($certificate->title)
                                <div style="position: absolute; left: {{ $certificate->title_x_position ?? 0 }}px; top: {{ $certificate->title_y_position ?? 100 }}px; font-size: {{ $certificate->title_font_size ?? 30 }}px; color: {{ $certificate->title_font_color ?? '#363234' }}; font-weight: bold; text-align: center; width: 100%;">
                                    {{ $certificate->title }}
                                </div>
                            @endif
                            
                            <!-- Student Name -->
                            @if($certificate->show_student_name == 'yes')
                                <div style="position: absolute; left: {{ $certificate->student_name_x_position ?? 0 }}px; top: {{ $certificate->student_name_y_position ?? 200 }}px; font-size: {{ $certificate->student_name_font_size ?? 24 }}px; color: {{ $certificate->student_name_font_color ?? '#363234' }}; font-weight: bold; text-align: center; width: 100%;">
                                    John Doe
                                </div>
                            @endif
                            
                            <!-- Certificate Body -->
                            @if($certificate->body)
                                <div style="position: absolute; left: {{ $certificate->body_x_position ?? 0 }}px; top: {{ $certificate->body_y_position ?? 300 }}px; font-size: {{ $certificate->body_font_size ?? 16 }}px; color: {{ $certificate->body_font_color ?? '#363234' }}; text-align: center; width: 100%; max-width: 800px; margin: 0 auto;">
                                    {{ str_replace(['{student_name}', '{course_name}', '{completion_date}'], ['John Doe', 'Web Development Course', date('F j, Y')], $certificate->body) }}
                                </div>
                            @endif
                            
                            <!-- Date -->
                            @if($certificate->show_date == 'yes')
                                <div style="position: absolute; left: {{ $certificate->date_x_position ?? 0 }}px; top: {{ $certificate->date_y_position ?? 400 }}px; font-size: {{ $certificate->date_font_size ?? 14 }}px; color: {{ $certificate->date_font_color ?? '#363234' }}; text-align: center; width: 100%;">
                                    {{ date('F j, Y') }}
                                </div>
                            @endif
                            
                            <!-- Role 1 Signature -->
                            @if($certificate->role_1_show == 'yes' && $certificate->role_1_title)
                                <div style="position: absolute; left: {{ $certificate->role_1_x_position ?? 200 }}px; top: {{ $certificate->role_1_y_position ?? 600 }}px; text-align: center;">
                                    @if($certificate->role_1_signature)
                                        <img src="{{ $certificate->role_1_signature_url }}" alt="Signature" style="max-width: 120px; max-height: 60px;">
                                    @endif
                                    <div style="font-size: {{ $certificate->role_1_font_size ?? 14 }}px; color: {{ $certificate->role_1_font_color ?? '#363234' }}; margin-top: 5px;">
                                        {{ $certificate->role_1_title }}
                                    </div>
                                </div>
                            @endif
                            
                            <!-- Role 2 Signature -->
                            @if($certificate->role_2_show == 'yes' && $certificate->role_2_title)
                                <div style="position: absolute; left: {{ $certificate->role_2_x_position ?? 600 }}px; top: {{ $certificate->role_2_y_position ?? 600 }}px; text-align: center;">
                                    <div style="font-size: {{ $certificate->role_2_font_size ?? 14 }}px; color: {{ $certificate->role_2_font_color ?? '#363234' }};">
                                        {{ $certificate->role_2_title }}
                                    </div>
                                </div>
                            @endif
                            
                        </div>
                    </div>
                </div>

                <!-- Certificate Information -->
                <div class="row mt-4">
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-header">
                                <h6 class="mb-0">{{__('Certificate Information')}}</h6>
                            </div>
                            <div class="card-body">
                                <p><strong>{{__('Certificate Number')}}:</strong> {{ $certificate->certificate_number }}</p>
                                <p><strong>{{__('Title')}}:</strong> {{ $certificate->title ?? 'Not set' }}</p>
                                <p><strong>{{__('Status')}}:</strong> 
                                    @if($certificate->status == CERTIFICATE_DRAFT)
                                        <span class="badge bg-warning">{{__('Draft')}}</span>
                                    @else
                                        <span class="badge bg-success">{{__('Active')}}</span>
                                    @endif
                                </p>
                                <p><strong>{{__('Created')}}:</strong> {{ $certificate->created_at->format('M j, Y') }}</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-header">
                                <h6 class="mb-0">{{__('Actions')}}</h6>
                            </div>
                            <div class="card-body">
                                <div class="d-grid gap-2">
                                    <a href="{{ route('organization.certificate-management.edit', $certificate->uuid) }}" class="btn btn-primary">
                                        <i class="mdi mdi-pencil me-1"></i>{{__('Edit Certificate')}}
                                    </a>
                                    <a href="{{ route('organization.certificate-management.duplicate', $certificate->id) }}" class="btn btn-outline-success">
                                        <i class="mdi mdi-content-copy me-1"></i>{{__('Duplicate Certificate')}}
                                    </a>
                                    <form method="POST" action="{{ route('organization.certificate-management.delete', $certificate->id) }}" class="d-inline" onsubmit="return confirm('Are you sure you want to delete this certificate?')">
                                        @csrf
                                        @method('DELETE')
                                        <button type="submit" class="btn btn-outline-danger w-100">
                                            <i class="mdi mdi-delete me-1"></i>{{__('Delete Certificate')}}
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>

    </div>
</div>
@endsection

@push('style')
<style>
.certificate-preview-container {
    overflow-x: auto;
}

.certificate-preview {
    min-width: 1030px;
}

@media (max-width: 768px) {
    .certificate-preview {
        transform: scale(0.7);
        transform-origin: top left;
    }
}
</style>
@endpush
