@extends('organization.settings.layout')

@section('settings-content')
<div class="general-settings">
    <h5 class="mb-4">{{__('General Settings')}}</h5>
    
    <form action="{{ route('organization.settings.general.update') }}" method="POST" enctype="multipart/form-data">
        @csrf
        
        <div class="row">
            <!-- Organization Information -->
            <div class="col-lg-8">
                <div class="card mb-4">
                    <div class="card-header">
                        <h6 class="mb-0">{{__('Organization Information')}}</h6>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <label class="form-label">{{__('Organization Name')}}</label>
                                <input type="text" name="organization_name" class="form-control @error('organization_name') is-invalid @enderror" 
                                       value="{{ old('organization_name', $organization->organization_name) }}">
                                @error('organization_name')
                                    <div class="text-danger">{{ $message }}</div>
                                @enderror
                            </div>
                            
                            <div class="col-md-6 mb-3">
                                <label class="form-label">{{__('Organization Tagline')}}</label>
                                <input type="text" name="organization_tagline" class="form-control @error('organization_tagline') is-invalid @enderror" 
                                       value="{{ old('organization_tagline', $organization->organization_tagline) }}">
                                @error('organization_tagline')
                                    <div class="text-danger">{{ $message }}</div>
                                @enderror
                            </div>
                            
                            <div class="col-12 mb-3">
                                <label class="form-label">{{__('Organization Description')}}</label>
                                <textarea name="organization_description" class="form-control @error('organization_description') is-invalid @enderror" 
                                          rows="4">{{ old('organization_description', $organization->organization_description) }}</textarea>
                                @error('organization_description')
                                    <div class="text-danger">{{ $message }}</div>
                                @enderror
                            </div>
                            
                            <div class="col-12 mb-3">
                                <label class="form-label">{{__('Footer Text')}}</label>
                                <input type="text" name="footer_text" class="form-control @error('footer_text') is-invalid @enderror" 
                                       value="{{ old('footer_text', $organization->footer_text) }}">
                                @error('footer_text')
                                    <div class="text-danger">{{ $message }}</div>
                                @enderror
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Color Settings -->
                <div class="card mb-4">
                    <div class="card-header">
                        <h6 class="mb-0">{{__('Color Settings')}}</h6>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-4 mb-3">
                                <label class="form-label">{{__('Primary Color')}}</label>
                                <input type="color" name="primary_color" class="form-control form-control-color @error('primary_color') is-invalid @enderror" 
                                       value="{{ old('primary_color', $organization->primary_color) }}">
                                @error('primary_color')
                                    <div class="text-danger">{{ $message }}</div>
                                @enderror
                            </div>
                            
                            <div class="col-md-4 mb-3">
                                <label class="form-label">{{__('Secondary Color')}}</label>
                                <input type="color" name="secondary_color" class="form-control form-control-color @error('secondary_color') is-invalid @enderror" 
                                       value="{{ old('secondary_color', $organization->secondary_color) }}">
                                @error('secondary_color')
                                    <div class="text-danger">{{ $message }}</div>
                                @enderror
                            </div>
                            
                            <div class="col-md-4 mb-3">
                                <label class="form-label">{{__('Accent Color')}}</label>
                                <input type="color" name="accent_color" class="form-control form-control-color @error('accent_color') is-invalid @enderror" 
                                       value="{{ old('accent_color', $organization->accent_color) }}">
                                @error('accent_color')
                                    <div class="text-danger">{{ $message }}</div>
                                @enderror
                            </div>
                        </div>
                        
                        <!-- Color Preview -->
                        <div class="color-preview mt-3">
                            <h6>{{__('Color Preview')}}</h6>
                            <div class="preview-colors d-flex gap-2">
                                <div class="color-swatch" style="background-color: {{ $organization->primary_color }}; width: 40px; height: 40px; border-radius: 4px;"></div>
                                <div class="color-swatch" style="background-color: {{ $organization->secondary_color }}; width: 40px; height: 40px; border-radius: 4px;"></div>
                                <div class="color-swatch" style="background-color: {{ $organization->accent_color }}; width: 40px; height: 40px; border-radius: 4px;"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Whitelabel Settings -->
            <div class="col-lg-4">
                <div class="card mb-4">
                    <div class="card-header">
                        <h6 class="mb-0">{{__('Whitelabel Settings')}}</h6>
                    </div>
                    <div class="card-body">
                        <div class="mb-3">
                            <div class="form-check">
                                <input type="checkbox" name="whitelabel_enabled" class="form-check-input" id="whitelabel_enabled" 
                                       {{ old('whitelabel_enabled', $organization->whitelabel_enabled) ? 'checked' : '' }}>
                                <label class="form-check-label" for="whitelabel_enabled">
                                    {{__('Enable Whitelabeling')}}
                                </label>
                            </div>
                            <div class="form-text">{{__('Enable custom branding and domain for your organization')}}</div>
                        </div>
                        
                        <div class="alert alert-info">
                            <strong>{{__('Whitelabeling Features:')}}</strong>
                            <ul class="mb-0 mt-2">
                                <li>{{__('Custom domain access')}}</li>
                                <li>{{__('Organization branding')}}</li>
                                <li>{{__('Custom CSS styling')}}</li>
                                <li>{{__('Logo and favicon')}}</li>
                            </ul>
                        </div>
                    </div>
                </div>
                
                <!-- Quick Actions -->
                <div class="card">
                    <div class="card-header">
                        <h6 class="mb-0">{{__('Quick Actions')}}</h6>
                    </div>
                    <div class="card-body">
                        <div class="d-grid gap-2">
                            <a href="{{ route('organization.settings.branding') }}" class="btn btn-outline-primary">
                                <i class="mdi mdi-palette me-1"></i>{{__('Branding Settings')}}
                            </a>
                            <a href="{{ route('organization.settings.subscription') }}" class="btn btn-outline-info">
                                <i class="mdi mdi-account-star me-1"></i>{{__('Subscription Settings')}}
                            </a>
                            <a href="{{ route('organization.settings.preview') }}" class="btn btn-outline-success">
                                <i class="mdi mdi-eye me-1"></i>{{__('Preview Settings')}}
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Action Buttons -->
        <div class="row">
            <div class="col-12">
                <div class="d-flex justify-content-between">
                    <a href="{{ route('organization.settings.index') }}" class="btn btn-outline-secondary">
                        <i class="mdi mdi-arrow-left me-1"></i>{{__('Back to Settings')}}
                    </a>
                    
                    <div>
                        <button type="submit" class="btn btn-primary">
                            <i class="mdi mdi-content-save me-1"></i>{{__('Save General Settings')}}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </form>
</div>
@endsection

@push('script')
<script>
// Update color preview when colors change
document.querySelectorAll('input[type="color"]').forEach(input => {
    input.addEventListener('change', function() {
        const colorSwatches = document.querySelectorAll('.color-swatch');
        const colorInputs = document.querySelectorAll('input[type="color"]');
        
        colorInputs.forEach((input, index) => {
            if (colorSwatches[index]) {
                colorSwatches[index].style.backgroundColor = input.value;
            }
        });
    });
});
</script>
@endpush