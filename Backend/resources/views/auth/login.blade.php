@extends('layouts.auth')

@push('styles')
<style>
    /* Toasts en bas à droite - CSS ultra-agressif */
    #toast-container, #custom-toast-container {
        position: fixed !important;
        bottom: 0px !important;
        right: 0px !important;
        top: auto !important;
        left: auto !important;
        z-index: 9999999 !important;
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
        pointer-events: auto !important;
        width: auto !important;
        max-width: 400px !important;
        margin: 0 !important;
        padding: 0 !important;
    }
    
    .toast {
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
        position: relative !important;
        margin: 10px 0 !important;
        padding: 15px !important;
        background: #333 !important;
        color: white !important;
        border-radius: 5px !important;
        box-shadow: 0 0 10px rgba(0,0,0,0.5) !important;
        z-index: 9999999 !important;
        min-width: 300px !important;
    }
    
    .toast-success { background: #4CAF50 !important; }
    .toast-error { background: #f44336 !important; }
    .toast-warning { background: #ff9800 !important; }
    .toast-info { background: #2196F3 !important; }
    
    /* Forcer l'affichage au-dessus de tout */
    .formly-login-container {
        overflow: visible !important;
    }
</style>
@endpush

@section('content')
    <!-- Formly Login Page - Exact Design Clone -->
    <div class="formly-login-container" id="formly-container">
        <!-- Theme Toggle Button -->
        <button
            id="theme-toggle"
            class="formly-theme-toggle"
            aria-label="Toggle theme"
        >
            <svg class="sun-icon" style="display: none;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>
            </svg>
            <svg class="moon-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>
            </svg>
        </button>
        <!-- Mobile Header - Gradient with Formly branding -->
        <div class="formly-mobile-header">
            <!-- Custom Background Image or Gradient -->
            @if($current_organization ?? false && $current_organization->login_background_image)
                <div class="formly-custom-bg" style="background-image: url('{{ $current_organization->login_background_image_url }}'); background-size: cover; background-position: center; background-repeat: no-repeat;"></div>
            @else
                <div class="formly-gradient-bg"></div>
            @endif
            
            <!-- Geometric Patterns - Simplified for mobile -->
            <div class="formly-patterns">
                <div class="formly-pattern-1" style="width: 250px; height: 350px; top: 10%; left: 5%;"></div>
                <div class="formly-pattern-3" style="width: 150px; height: 200px; top: 15%; right: 5%;">
                    <svg viewBox="0 0 150 200" style="width: 100%; height: 100%;">
                        <path d="M 25 25 L 125 25 L 125 125 L 75 125 L 75 175 L 25 125 Z" 
                              fill="none" 
                              stroke="white" 
                              stroke-width="2" />
                    </svg>
                </div>
            </div>

            <!-- Mobile Branding -->
            <div class="formly-mobile-branding">
                <div style="color: white;">
                    @if($current_organization ?? false)
                        <h1 class="formly-mobile-title">{{ $current_organization->organization_name }}</h1>
                        <p class="formly-mobile-subtitle">{{ $current_organization->organization_tagline ?: 'Professional Learning Platform' }}</p>
                        @if($current_organization->organization_description)
                            <p class="formly-mobile-description">{{ $current_organization->organization_description }}</p>
                        @endif
                    @else
                        <h1 class="formly-mobile-title">{{ get_option('app_name', 'Formly') }}</h1>
                        <p class="formly-mobile-subtitle">{{ __(get_option('sign_up_left_text', 'An LMS solution for your school')) }}</p>
                    @endif
                </div>
            </div>
        </div>

        <!-- Left side - Custom Background or Gradient with geometric patterns (Desktop only) -->
        <div class="formly-left-panel">
            <!-- Custom Background Image or Gradient -->
            @if($current_organization ?? false && $current_organization->login_background_image)
                <div class="formly-custom-bg" style="background-image: url('{{ $current_organization->login_background_image_url }}'); background-size: cover; background-position: center; background-repeat: no-repeat;"></div>
            @else
                <div class="formly-gradient-bg"></div>
            @endif
            
            <!-- Geometric Patterns -->
            <div class="formly-patterns">
                <!-- Large tilted rectangle outline -->
                <div class="formly-pattern-1"></div>
                <div class="formly-pattern-2"></div>
                
                <!-- Arrow-like shapes -->
                <div class="formly-pattern-3">
                    <svg viewBox="0 0 300 400" style="width: 100%; height: 100%; opacity: 0.3;">
                        <path d="M 50 50 L 250 50 L 250 250 L 150 250 L 150 350 L 50 250 Z" 
                              fill="none" 
                              stroke="white" 
                              stroke-width="2" />
                    </svg>
                </div>
                
                <!-- Small rectangles -->
                <div class="formly-pattern-4"></div>
            </div>

            <!-- Desktop Branding -->
            <div class="formly-desktop-branding">
                <div style="color: white;">
                    @if($current_organization ?? false)
                        <h1 class="formly-brand-title">{{ $current_organization->organization_name }}</h1>
                        <p class="formly-brand-subtitle">{{ $current_organization->organization_tagline ?: 'Professional Learning Platform' }}</p>
                        @if($current_organization->organization_description)
                            <p class="formly-brand-description">{{ $current_organization->organization_description }}</p>
                        @endif
                        <div class="formly-brand-features">
                            <div class="formly-feature-item">
                                <i class="fas fa-graduation-cap"></i>
                                <span>{{ __('Quality Education') }}</span>
                            </div>
                            <div class="formly-feature-item">
                                <i class="fas fa-users"></i>
                                <span>{{ __('Expert Instructors') }}</span>
                            </div>
                            <div class="formly-feature-item">
                                <i class="fas fa-certificate"></i>
                                <span>{{ __('Certified Courses') }}</span>
                            </div>
                        </div>
                    @else
                        <h1 class="formly-brand-title">{{ get_option('app_name', 'Formly') }}</h1>
                        <p class="formly-brand-subtitle">{{ __(get_option('sign_up_left_text', 'An LMS solution for your school')) }}</p>
                    @endif
                </div>
            </div>
        </div>

        <!-- Right side - Login Form -->
        <div class="formly-right-panel">
            <div class="formly-form-container">
                <!-- Logo - Desktop only -->
                <div class="formly-logo-section">
                    @if($current_organization ?? false)
                        @if($current_organization->organization_logo)
                            <img 
                                src="{{ $organization_logo_url ?? $current_organization->organization_logo_url }}" 
                                alt="{{ $current_organization->organization_name }} Logo" 
                                class="formly-logo"
                            />
                        @else
                            <img 
                                src="{{ $organization_logo_url ?? asset(getImageFile(get_option('app_logo'))) }}" 
                                alt="{{ $current_organization->organization_name }} Logo" 
                                class="formly-logo"
                            />
                        @endif
                        <h2 class="formly-logo-text">{{ $current_organization->organization_name }}</h2>
                        @if($current_organization->organization_tagline)
                            <p class="formly-tagline">{{ $current_organization->organization_tagline }}</p>
                        @endif
                    @else
                        <img 
                            src="{{getImageFile(get_option('app_logo'))}}" 
                            alt="{{ get_option('app_name', 'Formly') }} Logo" 
                            class="formly-logo"
                        />
                        <h2 class="formly-logo-text">{{ get_option('app_name', 'Formly') }}</h2>
                    @endif
                </div>

                <!-- Login Form Title -->
                <div class="formly-form-title-section">
                    <h1 class="formly-form-title">{{ __('Sign In') }}</h1>
                    <p class="formly-form-subtitle">{{ __('Email or Phone') }}</p>
                </div>

                <!-- Login Form -->
                <form method="POST" action="{{ route('login') }}" class="formly-form">
                    @csrf

                    <!-- Email Field -->
                    <div class="formly-form-group">
                        <label class="formly-label">{{ __('Email or Phone') }}*</label>
                        <input 
                            type="text" 
                            name="email" 
                            value="{{old('email')}}" 
                            class="formly-input" 
                            placeholder="{{ __('Type your email or phone number') }}"
                            required
                        >
                        @if ($errors->has('email'))
                            <div class="formly-error">
                                <i class="fas fa-exclamation-triangle"></i> {{ $errors->first('email') }}
                            </div>
                        @endif
                    </div>

                    <!-- Password Field -->
                    <div class="formly-form-group">
                        <label class="formly-label">{{ __('Password') }}*</label>
                        <div class="formly-password-container">
                            <input 
                                type="password" 
                                name="password" 
                                class="formly-input formly-password-input" 
                                placeholder="*********"
                                required
                            >
                            <span class="formly-eye-icon" onclick="togglePassword()">
                                <i class="fas fa-eye"></i>
                            </span>
                        </div>
                        @if ($errors->has('password'))
                            <div class="formly-error">
                                <i class="fas fa-exclamation-triangle"></i> {{ $errors->first('password') }}
                            </div>
                        @endif
                    </div>

                    <!-- Options Row -->
                    <div class="formly-options-row">
                        <div class="formly-remember-me">
                            <input type="checkbox" id="remember" name="remember" class="formly-checkbox">
                            <label for="remember" class="formly-remember-text">{{ __('Remember Me') }}</label>
                        </div>
                        <a href="{{ route('forget-password') }}" class="formly-forgot-link">{{ __('Forgot Password') }}?</a>
                    </div>

                    <!-- Login Button -->
                    <button type="submit" class="formly-login-button">{{ __('Sign In') }}</button>

                    <!-- Social Login Buttons -->

                    <!-- Login Help Table -->
                    @if(env('LOGIN_HELP') == 'active')
                        <div style="margin-top: 1rem;">
                            <table style="width: 100%; border-collapse: collapse; font-size: 0.75rem;">
                                <tbody>
                                <tr>
                                    <td id="adminCredentialShow" style="border: 1px solid #d1d5db; padding: 0.5rem; cursor: pointer;"><b>Admin:</b> admin@gmail.com | 123456</td>
                                    <td id="instructorCredentialShow" style="border: 1px solid #d1d5db; padding: 0.5rem; cursor: pointer;"><b>Instructor:</b> instructor@gmail.com | 123456</td>
                                </tr>
                                <tr>
                                    <td id="studentCredentialShow" style="border: 1px solid #d1d5db; padding: 0.5rem; cursor: pointer;"><b>Student:</b> student@gmail.com | 123456</td>
                                    <td id="affiliatorCredentialShow" style="border: 1px solid #d1d5db; padding: 0.5rem; cursor: pointer;"><b>Affiliator:</b> affiliator@gmail.com | 123456</td>
                                </tr>
                                <tr>
                                    <td colspan="2" id="organizationCredentialShow" style="border: 1px solid #d1d5db; padding: 0.5rem; cursor: pointer;"><b>Organization:</b> organization@gmail.com | 123456</td>
                                </tr>
                                </tbody>
                            </table>
                        </div>
                    @endif
                </form>
                
                <!-- Organization Footer -->
                @if($current_organization ?? false)
                <div class="formly-organization-footer">
                    <div class="formly-footer-content">
                        <div class="formly-footer-links">
                            <a href="#" class="formly-footer-link">{{ __('Privacy Policy') }}</a>
                            <a href="#" class="formly-footer-link">{{ __('Terms of Service') }}</a>
                            <a href="#" class="formly-footer-link">{{ __('Contact Us') }}</a>
                        </div>
                        <div class="formly-footer-copyright">
                            <p>&copy; {{ date('Y') }} {{ $current_organization->organization_name }}. {{ __('All rights reserved.') }}</p>
                            @if($current_organization->footer_text)
                                <p class="formly-footer-custom">{{ $current_organization->footer_text }}</p>
                            @endif
                        </div>
                    </div>
                </div>
                @else
                <div class="formly-default-footer">
                    <div class="formly-footer-content">
                        <div class="formly-footer-links">
                            <a href="#" class="formly-footer-link">{{ __('Privacy Policy') }}</a>
                            <a href="#" class="formly-footer-link">{{ __('Terms of Service') }}</a>
                            <a href="#" class="formly-footer-link">{{ __('Contact Us') }}</a>
                        </div>
                        <div class="formly-footer-copyright">
                            <p>&copy; {{ date('Y') }} {{ get_option('app_name', 'Formly') }}. {{ __('All rights reserved.') }}</p>
                        </div>
                    </div>
                </div>
                @endif
            </div>
        </div>
    </div>
@endsection

@push('script')
    <script>
        "use strict"
        
        // Theme Management
        class ThemeManager {
            constructor() {
                this.theme = localStorage.getItem('formly-theme') || 'light';
                this.init();
            }
            
            init() {
                this.applyTheme(this.theme);
                this.bindEvents();
            }
            
            applyTheme(theme) {
                const container = document.getElementById('formly-container');
                const rightPanel = document.querySelector('.formly-right-panel');
                const logoText = document.querySelector('.formly-logo-text');
                const formTitle = document.querySelector('.formly-form-title');
                const formSubtitle = document.querySelector('.formly-form-subtitle');
                const labels = document.querySelectorAll('.formly-label');
                const inputs = document.querySelectorAll('.formly-input');
                const eyeIcon = document.querySelector('.formly-eye-icon');
                const rememberText = document.querySelector('.formly-remember-text');
                const forgotLink = document.querySelector('.formly-forgot-link');
                const checkbox = document.querySelector('.formly-checkbox');
                const socialButtons = document.querySelectorAll('.formly-social-button');
                const themeToggle = document.getElementById('theme-toggle');
                const sunIcon = document.querySelector('.sun-icon');
                const moonIcon = document.querySelector('.moon-icon');
                
                if (theme === 'dark') {
                    container.classList.add('dark-mode');
                    rightPanel.classList.add('dark-mode');
                    logoText.classList.add('dark-mode');
                    formTitle.classList.add('dark-mode');
                    formSubtitle.classList.add('dark-mode');
                    labels.forEach(label => label.classList.add('dark-mode'));
                    inputs.forEach(input => input.classList.add('dark-mode'));
                    if (eyeIcon) eyeIcon.classList.add('dark-mode');
                    if (rememberText) rememberText.classList.add('dark-mode');
                    if (forgotLink) forgotLink.classList.add('dark-mode');
                    if (checkbox) checkbox.classList.add('dark-mode');
                    socialButtons.forEach(btn => btn.classList.add('dark-mode'));
                    themeToggle.classList.add('dark-mode');
                    sunIcon.style.display = 'block';
                    moonIcon.style.display = 'none';
                } else {
                    container.classList.remove('dark-mode');
                    rightPanel.classList.remove('dark-mode');
                    logoText.classList.remove('dark-mode');
                    formTitle.classList.remove('dark-mode');
                    formSubtitle.classList.remove('dark-mode');
                    labels.forEach(label => label.classList.remove('dark-mode'));
                    inputs.forEach(input => input.classList.remove('dark-mode'));
                    if (eyeIcon) eyeIcon.classList.remove('dark-mode');
                    if (rememberText) rememberText.classList.remove('dark-mode');
                    if (forgotLink) forgotLink.classList.remove('dark-mode');
                    if (checkbox) checkbox.classList.remove('dark-mode');
                    socialButtons.forEach(btn => btn.classList.remove('dark-mode'));
                    themeToggle.classList.remove('dark-mode');
                    sunIcon.style.display = 'none';
                    moonIcon.style.display = 'block';
                }
            }
            
            toggleTheme() {
                this.theme = this.theme === 'light' ? 'dark' : 'light';
                localStorage.setItem('formly-theme', this.theme);
                this.applyTheme(this.theme);
            }
            
            bindEvents() {
                const themeToggle = document.getElementById('theme-toggle');
                if (themeToggle) {
                    themeToggle.addEventListener('click', () => this.toggleTheme());
                }
            }
        }
        
        // Initialize theme manager
        const themeManager = new ThemeManager();
        
        // Password toggle functionality
        function togglePassword() {
            const passwordInput = document.querySelector('.formly-password-input');
            const eyeIcon = document.querySelector('.formly-eye-icon i');
            
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                eyeIcon.classList.remove('fa-eye');
                eyeIcon.classList.add('fa-eye-slash');
            } else {
                passwordInput.type = 'password';
                eyeIcon.classList.remove('fa-eye-slash');
                eyeIcon.classList.add('fa-eye');
            }
        }
        
        // Credential auto-fill functionality
        $('#adminCredentialShow').on('click', function (){
            $('input[name="email"]').val('admin@gmail.com');
            $('input[name="password"]').val('123456');
        });

        $('#instructorCredentialShow').on('click', function (){
            $('input[name="email"]').val('instructor@gmail.com');
            $('input[name="password"]').val('123456');
        });

        $('#studentCredentialShow').on('click', function (){
            $('input[name="email"]').val('student@gmail.com');
            $('input[name="password"]').val('123456');
        });

        $('#affiliatorCredentialShow').on('click', function (){
            $('input[name="email"]').val('affiliator@gmail.com');
            $('input[name="password"]').val('123456');
        });

        $('#organizationCredentialShow').on('click', function (){
            $('input[name="email"]').val('organization@gmail.com');
            $('input[name="password"]').val('123456');
        });
        
        // Form validation and loading state
        $('.formly-form').on('submit', function() {
            const submitBtn = $(this).find('.formly-login-button');
            submitBtn.prop('disabled', true);
            submitBtn.text('{{ __("Sign In") }}...');
            $('.formly-login-container').addClass('formly-loading');
        });
    </script>

    @if($organization_colors ?? false)
    <style>
        :root {
            --primary-color: {{ $organization_colors['primary'] ?? '#007bff' }};
            --secondary-color: {{ $organization_colors['secondary'] ?? '#6c757d' }};
            --accent-color: {{ $organization_colors['accent'] ?? '#28a745' }};
        }
        
        .formly-login-button {
            background-color: var(--primary-color) !important;
            border-color: var(--primary-color) !important;
        }
        
        .formly-login-button:hover {
            background-color: var(--accent-color) !important;
            border-color: var(--accent-color) !important;
        }
        
        .formly-tagline {
            color: var(--secondary-color);
            font-size: 0.9rem;
            margin-top: 0.5rem;
            font-style: italic;
        }
        
        .formly-logo-text {
            color: var(--primary-color) !important;
        }
        
        /* Custom Background Image Styles */
        .formly-custom-bg {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 1;
        }
        
        .formly-custom-bg::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.3); /* Dark overlay for better text readability */
            z-index: 1;
        }
        
        /* Ensure patterns and text appear above custom background */
        .formly-patterns,
        .formly-desktop-branding,
        .formly-mobile-branding {
            position: relative;
            z-index: 2;
        }
        
        /* Enhanced Organization Branding Styles */
        .formly-brand-description {
            font-size: 1rem;
            line-height: 1.6;
            margin: 1rem 0;
            opacity: 0.9;
        }
        
        .formly-brand-features {
            margin-top: 2rem;
            display: flex;
            flex-direction: column;
            gap: 1rem;
        }
        
        .formly-feature-item {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            font-size: 0.95rem;
            opacity: 0.9;
        }
        
        .formly-feature-item i {
            font-size: 1.1rem;
            color: var(--accent-color);
            width: 20px;
            text-align: center;
        }
        
        .formly-mobile-description {
            font-size: 0.9rem;
            line-height: 1.5;
            margin-top: 0.5rem;
            opacity: 0.9;
        }
        
        /* Footer Styles */
        .formly-organization-footer,
        .formly-default-footer {
            margin-top: 2rem;
            padding-top: 1.5rem;
            border-top: 1px solid #e5e7eb;
        }
        
        .formly-footer-content {
            text-align: center;
        }
        
        .formly-footer-links {
            display: flex;
            justify-content: center;
            gap: 1.5rem;
            margin-bottom: 1rem;
            flex-wrap: wrap;
        }
        
        .formly-footer-link {
            color: var(--secondary-color);
            text-decoration: none;
            font-size: 0.85rem;
            transition: color 0.3s ease;
        }
        
        .formly-footer-link:hover {
            color: var(--primary-color);
            text-decoration: none;
        }
        
        .formly-footer-copyright {
            color: var(--secondary-color);
            font-size: 0.8rem;
            line-height: 1.4;
        }
        
        .formly-footer-copyright p {
            margin: 0.25rem 0;
        }
        
        .formly-footer-custom {
            font-style: italic;
            color: var(--primary-color);
        }
        
        /* Mobile Footer Adjustments */
        @media (max-width: 768px) {
            .formly-footer-links {
                gap: 1rem;
            }
            
            .formly-footer-link {
                font-size: 0.8rem;
            }
            
            .formly-footer-copyright {
                font-size: 0.75rem;
            }
        }
    </style>
    @endif
@endpush

@push('script')
<script>
$(document).ready(function() {
    console.log('Login page - Toast debug started');
    
    // Forcer l'affichage des toasts de session
    setTimeout(function() {
        const sessionToasts = {!! json_encode(session()->get('toastr::notifications', [])) !!};
        console.log('Toasts en session:', sessionToasts.length);
        
        if (sessionToasts.length > 0) {
            // Créer un container de toasts personnalisé
            let customContainer = document.getElementById('custom-toast-container');
            if (!customContainer) {
                customContainer = document.createElement('div');
                customContainer.id = 'custom-toast-container';
                customContainer.style.cssText = `
                    position: fixed !important;
                    bottom: 0px !important;
                    right: 0px !important;
                    top: auto !important;
                    left: auto !important;
                    z-index: 9999999 !important;
                    pointer-events: auto !important;
                    width: auto !important;
                    max-width: 400px !important;
                `;
                document.body.appendChild(customContainer);
                console.log('Container personnalisé créé');
            }
            
            // Afficher chaque toast
            sessionToasts.forEach(function(toast, index) {
                const toastDiv = document.createElement('div');
                toastDiv.style.cssText = `
                    display: block !important;
                    visibility: visible !important;
                    opacity: 1 !important;
                    position: relative !important;
                    margin: 10px 0 !important;
                    padding: 15px !important;
                    background: ${toast.type === 'error' ? '#f44336' : toast.type === 'success' ? '#4CAF50' : toast.type === 'warning' ? '#ff9800' : '#2196F3'} !important;
                    color: white !important;
                    border-radius: 5px !important;
                    box-shadow: 0 0 10px rgba(0,0,0,0.5) !important;
                    z-index: 9999999 !important;
                    min-width: 300px !important;
                `;
                toastDiv.innerHTML = `<strong>${toast.type.toUpperCase()}</strong><br>${toast.message}`;
                customContainer.appendChild(toastDiv);
                console.log('Toast affiché:', toast.type, toast.message);
                
                // Auto-supprimer après 5 secondes
                setTimeout(function() {
                    if (toastDiv.parentNode) {
                        toastDiv.parentNode.removeChild(toastDiv);
                    }
                }, 5000);
            });
        }
        
        // Test manuel si demandé
        @if(isset($test_toast) && $test_toast)
        setTimeout(function() {
            console.log('Test manuel des toasts...');
            if (typeof toastr !== 'undefined') {
                toastr.success('Test de toast de succès', 'Succès');
                toastr.error('Test de toast d\'erreur', 'Erreur');
                toastr.warning('Test de toast d\'avertissement', 'Attention');
                toastr.info('Test de toast d\'information', 'Info');
            } else {
                console.error('toastr n\'est pas disponible!');
            }
        }, 2000);
        @endif
    }, 1000);
});
</script>
@endpush
