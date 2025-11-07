@extends('layouts.auth')

@section('content')
    <!-- Formly Sign Up Page - Exact Design Clone -->
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
            <!-- Gradient Background -->
            <div class="formly-gradient-bg"></div>
            
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
                    <h1 class="formly-mobile-title">{{ get_option('app_name', 'Formly') }}</h1>
                    <p class="formly-mobile-subtitle">{{ __(get_option('sign_up_left_text', 'An LMS solution for your school')) }}</p>
                </div>
            </div>
        </div>

        <!-- Left side - Gradient with geometric patterns (Desktop only) -->
        <div class="formly-left-panel">
            <!-- Gradient Background -->
            <div class="formly-gradient-bg"></div>
            
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
                    <h1 class="formly-brand-title">{{ get_option('app_name', 'Formly') }}</h1>
                    <p class="formly-brand-subtitle">{{ __(get_option('sign_up_left_text', 'An LMS solution for your school')) }}</p>
                </div>
            </div>
        </div>

        <!-- Right side - Sign Up Form -->
        <div class="formly-right-panel">
            <div class="formly-form-container">
                <!-- Logo - Desktop only -->
                <div class="formly-logo-section">
                    <img 
                        src="{{getImageFile(get_option('app_logo'))}}" 
                        alt="{{ get_option('app_name', 'Formly') }} Logo" 
                        class="formly-logo"
                    />
                    <h2 class="formly-logo-text">{{ get_option('app_name', 'Formly') }}</h2>
                </div>

                <!-- Sign Up Form Title -->
                <div class="formly-form-title-section">
                    <h1 class="formly-form-title">{{ __('Create an Account') }}</h1>
                    <p class="formly-form-subtitle">{{__('Already have an account?')}} <a href="{{route('login')}}" class="formly-forgot-link">{{__('Sign In')}}</a></p>
                </div>

                <!-- Sign Up Form -->
                <form method="POST" action="{{route('store.sign-up')}}" class="formly-form">
                    @csrf

                    <!-- Email Field -->
                    <div class="formly-form-group">
                        <label class="formly-label">{{__('Email')}}*</label>
                        <input 
                            type="email" 
                            name="email" 
                            id="email" 
                            value="{{old('email')}}"
                            class="formly-input" 
                            placeholder="{{ __('Type your email') }}"
                            required
                        >
                        @if ($errors->has('email'))
                            <div class="formly-error">
                                <i class="fas fa-exclamation-triangle"></i> {{ $errors->first('email') }}
                            </div>
                        @endif
                    </div>

                    <!-- Phone Number Fields -->
                    <div class="formly-form-group">
                        <label class="formly-label">{{__('Phone Number')}}</label>
                        <div style="display: flex; gap: 0.5rem;">
                            <select name="area_code" class="formly-input" style="flex: 0 0 30%;">
                                <option value="">{{ __('Select Code') }}</option>
                                @foreach ($countries as $country)
                                    <option value="{{ $country->phonecode }}" @if(old('area_code')==$country->phonecode) selected @endif>
                                        {{ $country->short_name.'('.$country->phonecode.')' }}
                                    </option>
                                @endforeach
                            </select>
                            <input 
                                type="text" 
                                name="mobile_number" 
                                id="mobile_number"
                                value="{{old('mobile_number')}}" 
                                class="formly-input" 
                                placeholder="{{__('Phone Number')}}"
                                style="flex: 1;"
                            >
                        </div>
                        @if ($errors->has('area_code'))
                            <div class="formly-error">
                                <i class="fas fa-exclamation-triangle"></i> {{ $errors->first('area_code') }}
                            </div>
                        @endif
                        @if ($errors->has('mobile_number'))
                            <div class="formly-error">
                                <i class="fas fa-exclamation-triangle"></i> {{ $errors->first('mobile_number') }}
                            </div>
                        @endif
                    </div>

                    <!-- Name Fields -->
                    <div style="display: flex; gap: 0.5rem;">
                        <div class="formly-form-group" style="flex: 1;">
                            <label class="formly-label">{{__('First Name')}}*</label>
                            <input 
                                type="text" 
                                name="first_name" 
                                id="first_name" 
                                value="{{old('first_name')}}"
                                class="formly-input" 
                                placeholder="{{__('First Name')}}"
                                required
                            >
                            @if ($errors->has('first_name'))
                                <div class="formly-error">
                                    <i class="fas fa-exclamation-triangle"></i> {{ $errors->first('first_name') }}
                                </div>
                            @endif
                        </div>
                        <div class="formly-form-group" style="flex: 1;">
                            <label class="formly-label">{{__('Last Name')}}*</label>
                            <input 
                                type="text" 
                                name="last_name" 
                                id="last_name" 
                                value="{{old('last_name')}}"
                                class="formly-input" 
                                placeholder="{{__('Last Name')}}"
                                required
                            >
                            @if ($errors->has('last_name'))
                                <div class="formly-error">
                                    <i class="fas fa-exclamation-triangle"></i> {{ $errors->first('last_name') }}
                                </div>
                            @endif
                        </div>
                    </div>

                    <!-- Password Field -->
                    <div class="formly-form-group">
                        <label class="formly-label">{{__('Password')}}*</label>
                        <div class="formly-password-container">
                            <input 
                                type="password" 
                                name="password" 
                                id="password" 
                                value="{{old('password')}}"
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

                    <!-- Terms and Conditions -->
                    <div class="formly-form-group">
                        <div class="formly-remember-me">
                            <input type="checkbox" id="terms" name="terms" class="formly-checkbox" required>
                            <label for="terms" class="formly-remember-text">
                                By clicking Create account, I agree that I have read and accepted the 
                                <a href="{{ route('terms-conditions') }}" class="formly-forgot-link">{{ __('Terms of Use') }}</a> 
                                and 
                                <a href="{{ route('privacy-policy') }}" class="formly-forgot-link">{{ __('Privacy Policy') }}.</a>
                            </label>
                        </div>
                    </div>

                    <!-- Sign Up Button -->
                    <button type="submit" class="formly-login-button">{{__('Sign Up')}}</button>
                </form>
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
        
        // Form validation and loading state
        $('.formly-form').on('submit', function() {
            const submitBtn = $(this).find('.formly-login-button');
            submitBtn.prop('disabled', true);
            submitBtn.text('{{ __("Sign Up") }}...');
            $('.formly-login-container').addClass('formly-loading');
        });
    </script>
@endpush
