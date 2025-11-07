{{-- Not Found Component --}}
{{-- Usage: @include('admin.components.not-found', ['type' => 'courses', 'message' => 'custom message', 'showClearFilters' => true]) --}}

@php
    // Default configurations
    $type = $type ?? 'data';
    $message = $message ?? null;
    $showClearFilters = $showClearFilters ?? false;
    $showRefresh = $showRefresh ?? false;
    $icon = $icon ?? 'fas fa-search';
    $size = $size ?? 'large'; // small, medium, large
    
    // Type-specific configurations
    $configs = [
        'courses' => [
            'title' => __('No courses found'),
            'subtitle' => __('The search did not return any results'),
            'icon' => 'fas fa-graduation-cap',
            'suggestions' => [
                __('Try adjusting your search or filter criteria'),
                __('Check your spelling'),
                __('Try different keywords')
            ]
        ],
        'students' => [
            'title' => __('No students found'),
            'subtitle' => __('No students match your current filters'),
            'icon' => 'fas fa-users',
            'suggestions' => [
                __('Try adjusting your search criteria'),
                __('Check your filter settings'),
                __('Try different keywords')
            ]
        ],
        'instructors' => [
            'title' => __('No instructors found'),
            'subtitle' => __('No instructors match your current filters'),
            'icon' => 'fas fa-chalkboard-teacher',
            'suggestions' => [
                __('Try adjusting your search criteria'),
                __('Check your filter settings'),
                __('Try different keywords')
            ]
        ],
        'orders' => [
            'title' => __('No orders found'),
            'subtitle' => __('No orders match your current filters'),
            'icon' => 'fas fa-shopping-cart',
            'suggestions' => [
                __('Try adjusting your date range'),
                __('Check your filter settings'),
                __('Try different search terms')
            ]
        ],
        'data' => [
            'title' => __('No data available'),
            'subtitle' => __('Nothing to show here'),
            'icon' => 'fas fa-database',
            'suggestions' => [
                __('Try adjusting your search or filter criteria'),
                __('Check your settings'),
                __('Contact support if the problem persists')
            ]
        ]
    ];
    
    $config = $configs[$type] ?? $configs['data'];
    
    // Override with custom message if provided
    if ($message) {
        $config['title'] = $message;
    }
    
    // Size classes
    $sizeClasses = [
        'small' => 'py-3',
        'medium' => 'py-4',
        'large' => 'py-5'
    ];
@endphp

<div class="not-found-component text-center {{ $sizeClasses[$size] }}">
    <div class="not-found-content">
        {{-- Icon --}}
        <div class="not-found-icon mb-4">
            <i class="{{ $config['icon'] }}" style="font-size: {{ $size === 'large' ? '4rem' : ($size === 'medium' ? '3rem' : '2rem') }}; color: #6c757d; opacity: 0.5;"></i>
        </div>
        
        {{-- Title --}}
        <h4 class="not-found-title mb-3" style="color: #495057; font-weight: 600;">
            {{ $config['title'] }}
        </h4>
        
        {{-- Subtitle --}}
        <p class="not-found-subtitle mb-4" style="color: #6c757d; font-size: 1rem;">
            {{ $config['subtitle'] }}
        </p>
        
        {{-- Suggestions --}}
        @if(isset($config['suggestions']) && count($config['suggestions']) > 0)
            <div class="not-found-suggestions mb-4">
                <ul class="list-unstyled" style="color: #6c757d; font-size: 0.9rem;">
                    @foreach($config['suggestions'] as $suggestion)
                        <li class="mb-1">
                            <i class="fas fa-lightbulb me-2" style="color: #ffc107;"></i>
                            {{ $suggestion }}
                        </li>
                    @endforeach
                </ul>
            </div>
        @endif
        
        {{-- Action Buttons --}}
        <div class="not-found-actions">
            @if($showClearFilters)
                <a href="{{ request()->url() }}" class="btn btn-outline-primary me-2" style="border-radius: 8px;">
                    <i class="fas fa-times me-2"></i>{{ __('Clear filters') }}
                </a>
            @endif
            
            @if($showRefresh)
                <button onclick="window.location.reload()" class="btn btn-outline-secondary me-2" style="border-radius: 8px;">
                    <i class="fas fa-sync-alt me-2"></i>{{ __('Refresh') }}
                </button>
            @endif
            
            @if(isset($backUrl))
                <a href="{{ $backUrl }}" class="btn btn-outline-secondary" style="border-radius: 8px;">
                    <i class="fas fa-arrow-left me-2"></i>{{ __('Go back') }}
                </a>
            @endif
        </div>
    </div>
</div>

<style>
.not-found-component {
    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
    border-radius: 12px;
    border: 1px solid #e9ecef;
    margin: 2rem 0;
}

.not-found-content {
    max-width: 500px;
    margin: 0 auto;
    padding: 0 1rem;
}

.not-found-icon {
    animation: float 3s ease-in-out infinite;
}

@keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
}

.not-found-suggestions ul li {
    transition: color 0.2s ease;
}

.not-found-suggestions ul li:hover {
    color: #495057 !important;
}

.not-found-actions .btn {
    transition: all 0.2s ease;
}

.not-found-actions .btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}
</style>
