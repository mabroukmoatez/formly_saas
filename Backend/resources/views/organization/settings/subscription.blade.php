@extends('organization.settings.layout')

@section('settings-content')
<div class="subscription-settings">
    <h5 class="mb-4">{{__('Subscription Settings')}}</h5>
    
    <form action="{{ route('organization.settings.subscription.update') }}" method="POST">
        @csrf
        
        <div class="row">
            <!-- Subscription Plan -->
            <div class="col-lg-8">
                <div class="card mb-4">
                    <div class="card-header">
                        <h6 class="mb-0">{{__('Subscription Plan')}}</h6>
                    </div>
                    <div class="card-body">
                        <div class="mb-3">
                            <label class="form-label">{{__('Current Plan')}}</label>
                            <select name="subscription_plan" class="form-control @error('subscription_plan') is-invalid @enderror" required>
                                <option value="basic" {{ old('subscription_plan', $organization->subscription_plan) == 'basic' ? 'selected' : '' }}>
                                    {{__('Basic Plan')}}
                                </option>
                                <option value="professional" {{ old('subscription_plan', $organization->subscription_plan) == 'professional' ? 'selected' : '' }}>
                                    {{__('Professional Plan')}}
                                </option>
                                <option value="enterprise" {{ old('subscription_plan', $organization->subscription_plan) == 'enterprise' ? 'selected' : '' }}>
                                    {{__('Enterprise Plan')}}
                                </option>
                            </select>
                            @error('subscription_plan')
                                <div class="text-danger">{{ $message }}</div>
                            @enderror
                        </div>
                        
                        <!-- Plan Features -->
                        <div class="row">
                            <div class="col-md-4">
                                <div class="plan-feature-card {{ $organization->subscription_plan == 'basic' ? 'active' : '' }}" data-plan="basic">
                                    <h6>{{__('Basic Plan')}}</h6>
                                    <ul class="list-unstyled">
                                        <li><i class="mdi mdi-check text-success me-1"></i>{{__('Up to 10 users')}}</li>
                                        <li><i class="mdi mdi-check text-success me-1"></i>{{__('Up to 50 courses')}}</li>
                                        <li><i class="mdi mdi-check text-success me-1"></i>{{__('Up to 20 certificates')}}</li>
                                        <li><i class="mdi mdi-check text-success me-1"></i>{{__('Basic support')}}</li>
                                    </ul>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="plan-feature-card {{ $organization->subscription_plan == 'professional' ? 'active' : '' }}" data-plan="professional">
                                    <h6>{{__('Professional Plan')}}</h6>
                                    <ul class="list-unstyled">
                                        <li><i class="mdi mdi-check text-success me-1"></i>{{__('Up to 100 users')}}</li>
                                        <li><i class="mdi mdi-check text-success me-1"></i>{{__('Up to 500 courses')}}</li>
                                        <li><i class="mdi mdi-check text-success me-1"></i>{{__('Up to 200 certificates')}}</li>
                                        <li><i class="mdi mdi-check text-success me-1"></i>{{__('Priority support')}}</li>
                                        <li><i class="mdi mdi-check text-success me-1"></i>{{__('Advanced analytics')}}</li>
                                    </ul>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="plan-feature-card {{ $organization->subscription_plan == 'enterprise' ? 'active' : '' }}" data-plan="enterprise">
                                    <h6>{{__('Enterprise Plan')}}</h6>
                                    <ul class="list-unstyled">
                                        <li><i class="mdi mdi-check text-success me-1"></i>{{__('Unlimited users')}}</li>
                                        <li><i class="mdi mdi-check text-success me-1"></i>{{__('Unlimited courses')}}</li>
                                        <li><i class="mdi mdi-check text-success me-1"></i>{{__('Unlimited certificates')}}</li>
                                        <li><i class="mdi mdi-check text-success me-1"></i>{{__('24/7 support')}}</li>
                                        <li><i class="mdi mdi-check text-success me-1"></i>{{__('Custom integrations')}}</li>
                                        <li><i class="mdi mdi-check text-success me-1"></i>{{__('White-label solution')}}</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Current Usage -->
            <div class="col-lg-4">
                <div class="card mb-4">
                    <div class="card-header">
                        <h6 class="mb-0">{{__('Current Usage')}}</h6>
                    </div>
                    <div class="card-body">
                        <div class="usage-item mb-3">
                            <div class="d-flex justify-content-between">
                                <span>{{__('Users')}}</span>
                                <span>{{ $organization->organizationUsers()->count() }} / {{ $organization->max_users }}</span>
                            </div>
                            <div class="progress mt-1" style="height: 6px;">
                                <div class="progress-bar" style="width: {{ ($organization->organizationUsers()->count() / $organization->max_users) * 100 }}%"></div>
                            </div>
                        </div>
                        
                        <div class="usage-item mb-3">
                            <div class="d-flex justify-content-between">
                                <span>{{__('Courses')}}</span>
                                <span>{{ $organization->courses()->count() }} / {{ $organization->max_courses }}</span>
                            </div>
                            <div class="progress mt-1" style="height: 6px;">
                                <div class="progress-bar bg-success" style="width: {{ ($organization->courses()->count() / $organization->max_courses) * 100 }}%"></div>
                            </div>
                        </div>
                        
                        <div class="usage-item mb-3">
                            <div class="d-flex justify-content-between">
                                <span>{{__('Certificates')}}</span>
                                <span>{{ $organization->certificates()->count() }} / {{ $organization->max_certificates }}</span>
                            </div>
                            <div class="progress mt-1" style="height: 6px;">
                                <div class="progress-bar bg-info" style="width: {{ ($organization->certificates()->count() / $organization->max_certificates) * 100 }}%"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Limits Configuration -->
        <div class="row">
            <div class="col-12">
                <div class="card mb-4">
                    <div class="card-header">
                        <h6 class="mb-0">{{__('Plan Limits')}}</h6>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-4 mb-3">
                                <label class="form-label">{{__('Maximum Users')}}</label>
                                <input type="number" name="max_users" class="form-control @error('max_users') is-invalid @enderror" 
                                       value="{{ old('max_users', $organization->max_users) }}" min="1" max="1000" required>
                                @error('max_users')
                                    <div class="text-danger">{{ $message }}</div>
                                @enderror
                            </div>
                            
                            <div class="col-md-4 mb-3">
                                <label class="form-label">{{__('Maximum Courses')}}</label>
                                <input type="number" name="max_courses" class="form-control @error('max_courses') is-invalid @enderror" 
                                       value="{{ old('max_courses', $organization->max_courses) }}" min="1" max="10000" required>
                                @error('max_courses')
                                    <div class="text-danger">{{ $message }}</div>
                                @enderror
                            </div>
                            
                            <div class="col-md-4 mb-3">
                                <label class="form-label">{{__('Maximum Certificates')}}</label>
                                <input type="number" name="max_certificates" class="form-control @error('max_certificates') is-invalid @enderror" 
                                       value="{{ old('max_certificates', $organization->max_certificates) }}" min="1" max="1000" required>
                                @error('max_certificates')
                                    <div class="text-danger">{{ $message }}</div>
                                @enderror
                            </div>
                        </div>
                        
                        <div class="alert alert-info">
                            <strong>{{__('Note:')}}</strong> {{__('These limits will be automatically updated based on your selected plan. You can also set custom limits within the plan boundaries.')}}
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
                            <i class="mdi mdi-content-save me-1"></i>{{__('Update Subscription')}}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </form>
</div>
@endsection

@push('style')
<style>
.plan-feature-card {
    border: 2px solid #e9ecef;
    border-radius: 8px;
    padding: 20px;
    text-align: center;
    transition: all 0.3s ease;
    cursor: pointer;
}

.plan-feature-card:hover {
    border-color: #007bff;
    transform: translateY(-2px);
}

.plan-feature-card.active {
    border-color: #007bff;
    background-color: #f8f9fa;
}

.plan-feature-card h6 {
    color: #495057;
    margin-bottom: 15px;
}

.plan-feature-card ul li {
    margin-bottom: 8px;
    font-size: 14px;
}

.usage-item .progress {
    background-color: #e9ecef;
}

.usage-item .progress-bar {
    background-color: #007bff;
}
</style>
@endpush

@push('script')
<script>
// Auto-update limits based on plan selection
document.querySelector('select[name="subscription_plan"]').addEventListener('change', function() {
    const plan = this.value;
    const limits = {
        basic: { users: 10, courses: 50, certificates: 20 },
        professional: { users: 100, courses: 500, certificates: 200 },
        enterprise: { users: 1000, courses: 10000, certificates: 1000 }
    };
    
    if (limits[plan]) {
        document.querySelector('input[name="max_users"]').value = limits[plan].users;
        document.querySelector('input[name="max_courses"]').value = limits[plan].courses;
        document.querySelector('input[name="max_certificates"]').value = limits[plan].certificates;
    }
});

// Plan card selection
document.querySelectorAll('.plan-feature-card').forEach(card => {
    card.addEventListener('click', function() {
        const plan = this.dataset.plan;
        document.querySelector('select[name="subscription_plan"]').value = plan;
        
        // Update active state
        document.querySelectorAll('.plan-feature-card').forEach(c => c.classList.remove('active'));
        this.classList.add('active');
        
        // Trigger change event
        document.querySelector('select[name="subscription_plan"]').dispatchEvent(new Event('change'));
    });
});
</script>
@endpush
