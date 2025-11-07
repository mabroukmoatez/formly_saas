@extends('layouts.organization')

@section('content')
<div class="modern-branding-page">
    <!-- Page Header -->
    <div class="page-header">
        <div class="header-content">
            <div class="header-left">
                <h1 class="page-title">{{ __('White Label Configuration') }}</h1>
                <p class="page-subtitle">{{ __('Customize your organization\'s appearance and branding') }}</p>
            </div>
            <div class="header-actions">
                <button type="button" class="btn-secondary" onclick="resetToDefaults()">
                    <i class="fas fa-undo"></i>
                    {{ __('Reset to Defaults') }}
                </button>
                <button type="submit" form="branding-form" class="btn-primary">
                    <i class="fas fa-save"></i>
                    {{ __('Save Changes') }}
                </button>
            </div>
        </div>
    </div>

    <!-- Main Content -->
    <div class="branding-content">
        <form id="branding-form" action="{{ route('organization.settings.branding.update') }}" method="POST" enctype="multipart/form-data">
        @csrf
        
            <!-- Brand Identity Section -->
            <div class="settings-section">
                <div class="section-header">
                    <div class="section-icon">
                        <i class="fas fa-palette"></i>
                    </div>
                    <div class="section-info">
                        <h3>{{ __('Brand Identity') }}</h3>
                        <p>{{ __('Define your organization\'s visual identity') }}</p>
                    </div>
                </div>
                
                <div class="section-content">
                    <div class="settings-grid">
                        <!-- Organization Info -->
                        <div class="settings-card">
                    <div class="card-header">
                                <h4>{{ __('Organization Information') }}</h4>
                    </div>
                            <div class="card-content">
                                <div class="form-group">
                                    <label class="form-label">{{ __('Organization Name') }} <span class="required">*</span></label>
                                    <input type="text" name="organization_name" class="form-input" 
                                       value="{{ old('organization_name', $organization->organization_name) }}"
                                       placeholder="{{ __('Your Organization Name') }}">
                                @error('organization_name')
                                        <div class="form-error">{{ $message }}</div>
                                @enderror
                            </div>
                            
                                <div class="form-group">
                                    <label class="form-label">{{ __('Tagline') }}</label>
                                    <input type="text" name="organization_tagline" class="form-input" 
                                       value="{{ old('organization_tagline', $organization->organization_tagline) }}"
                                       placeholder="{{ __('Professional Learning Platform') }}">
                            </div>
                            
                                <div class="form-group">
                                    <label class="form-label">{{ __('Description') }}</label>
                                    <textarea name="organization_description" class="form-textarea" rows="3" 
                                              placeholder="{{ __('Empowering learners with quality education...') }}">{{ old('organization_description', $organization->organization_description) }}</textarea>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Color Scheme -->
                        <div class="settings-card">
                            <div class="card-header">
                                <h4>{{ __('Color Scheme') }}</h4>
                                        </div>
                            <div class="card-content">
                                <div class="color-picker-group">
                                    <div class="color-picker-item">
                                        <label class="form-label">{{ __('Primary Color') }}</label>
                                        <div class="color-input-wrapper">
                                            <input type="color" name="primary_color" class="color-input" 
                                                   value="{{ old('primary_color', $organization->primary_color ?? '#3b82f6') }}">
                                            <input type="text" class="color-text" 
                                                   value="{{ old('primary_color', $organization->primary_color ?? '#3b82f6') }}"
                                                   placeholder="#3b82f6">
                                </div>
                            </div>
                            
                                    <div class="color-picker-item">
                                        <label class="form-label">{{ __('Secondary Color') }}</label>
                                        <div class="color-input-wrapper">
                                            <input type="color" name="secondary_color" class="color-input" 
                                                   value="{{ old('secondary_color', $organization->secondary_color ?? '#6c757d') }}">
                                            <input type="text" class="color-text" 
                                                   value="{{ old('secondary_color', $organization->secondary_color ?? '#6c757d') }}"
                                                   placeholder="#6c757d">
                            </div>
                                    </div>
                                    
                                    <div class="color-picker-item">
                                        <label class="form-label">{{ __('Accent Color') }}</label>
                                        <div class="color-input-wrapper">
                                            <input type="color" name="accent_color" class="color-input" 
                                                   value="{{ old('accent_color', $organization->accent_color ?? '#10b981') }}">
                                            <input type="text" class="color-text" 
                                                   value="{{ old('accent_color', $organization->accent_color ?? '#10b981') }}"
                                                   placeholder="#10b981">
                        </div>
                    </div>
                </div>
                
                                <div class="color-preview">
                                    <div class="preview-item" style="background: {{ $organization->primary_color ?? '#3b82f6' }};">
                                        <span>{{ __('Primary') }}</span>
                    </div>
                                    <div class="preview-item" style="background: {{ $organization->secondary_color ?? '#6c757d' }};">
                                        <span>{{ __('Secondary') }}</span>
                        </div>
                                    <div class="preview-item" style="background: {{ $organization->accent_color ?? '#10b981' }};">
                                        <span>{{ __('Accent') }}</span>
                                    </div>
                            </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Visual Assets Section -->
            <div class="settings-section">
                <div class="section-header">
                    <div class="section-icon">
                        <i class="fas fa-images"></i>
                    </div>
                    <div class="section-info">
                        <h3>{{ __('Visual Assets') }}</h3>
                        <p>{{ __('Upload logos, favicons, and background images') }}</p>
                    </div>
                </div>
                
                <div class="section-content">
                    <div class="settings-grid">
                        <!-- Logo Upload -->
                        <div class="settings-card">
                    <div class="card-header">
                                <h4>{{ __('Organization Logo') }}</h4>
                    </div>
                            <div class="card-content">
                                <div class="upload-area">
                                    <div class="logo-preview">
                                @if($organization->organization_logo)
                                            <img src="{{ asset($organization->organization_logo) }}" alt="Logo" class="preview-image">
                                @else
                                            <div class="upload-placeholder">
                                                <i class="fas fa-image"></i>
                                                <p>{{ __('No logo uploaded') }}</p>
                                    </div>
                                @endif
                            </div>
                                    <input type="file" name="organization_logo" class="file-input" accept="image/*" onchange="previewImage(this, '.logo-preview')">
                                    <button type="button" class="upload-btn" data-target="organization_logo">
                                        <i class="fas fa-upload"></i>
                                        {{ __('Upload Logo') }}
                                    </button>
                                    <p class="upload-hint">{{ __('Recommended: 300x300px, PNG or JPG') }}</p>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Favicon Upload -->
                        <div class="settings-card">
                    <div class="card-header">
                                <h4>{{ __('Favicon') }}</h4>
                            </div>
                            <div class="card-content">
                                <div class="upload-area">
                                    <div class="favicon-preview">
                                @if($organization->organization_favicon)
                                            <img src="{{ asset($organization->organization_favicon) }}" alt="Favicon" class="preview-image small">
                                @else
                                            <div class="upload-placeholder small">
                                                <i class="fas fa-image"></i>
                                    </div>
                                @endif
                            </div>
                                    <input type="file" name="organization_favicon" class="file-input" accept="image/*" onchange="previewImage(this, '.favicon-preview')">
                                    <button type="button" class="upload-btn" data-target="organization_favicon">
                                        <i class="fas fa-upload"></i>
                                        {{ __('Upload Favicon') }}
                                    </button>
                                    <p class="upload-hint">{{ __('Recommended: 32x32px, ICO or PNG') }}</p>
                        </div>
                    </div>
                </div>
                        
                        <!-- Background Image -->
                        <div class="settings-card">
                            <div class="card-header">
                                <h4>{{ __('Login Background') }}</h4>
                            </div>
                            <div class="card-content">
                                <div class="upload-area">
                                    <div class="background-preview">
                                        @if($organization->login_background_image)
                                            <img src="{{ asset($organization->login_background_image) }}" alt="Background" class="preview-image">
                                        @else
                                            <div class="upload-placeholder">
                                                <i class="fas fa-image"></i>
                                                <p>{{ __('No background uploaded') }}</p>
                                            </div>
                                        @endif
                                    </div>
                                    <input type="file" name="login_background_image" class="file-input" accept="image/*" onchange="previewImage(this, '.background-preview')">
                                    <button type="button" class="upload-btn" data-target="login_background_image">
                                        <i class="fas fa-upload"></i>
                                        {{ __('Upload Background') }}
                                    </button>
                                    <p class="upload-hint">{{ __('Recommended: 1920x1080px, JPG or PNG') }}</p>
                                </div>
                            </div>
                        </div>
                    </div>
            </div>
        </div>
        
            <!-- Advanced Settings Section -->
            <div class="settings-section">
                <div class="section-header">
                    <div class="section-icon">
                        <i class="fas fa-cog"></i>
                    </div>
                    <div class="section-info">
                        <h3>{{ __('Advanced Settings') }}</h3>
                        <p>{{ __('Custom domain and styling options') }}</p>
                    </div>
                </div>
                
                <div class="section-content">
                    <div class="advanced-settings-grid">
                        <!-- Custom Domain -->
                        <div class="settings-card domain-card">
                            <div class="card-header">
                                <h4>{{ __('Custom Domain') }}</h4>
                                <div class="card-status">
                                    <span class="status-indicator" id="domain-status">
                                        <i class="fas fa-circle"></i>
                                        {{ __('Not Configured') }}
                                    </span>
                                </div>
                            </div>
                            <div class="card-content">
                                <div class="form-group">
                                    <label class="form-label">{{ __('Subdomain') }}</label>
                                    <div class="input-group">
                                        <input type="text" name="custom_domain" id="subdomain-input" class="form-input" 
                                               value="{{ old('custom_domain', $organization->custom_domain) }}"
                                               placeholder="yourorg" onkeyup="testSubdomain()">
                                        <span class="input-suffix">.localhost</span>
                                    </div>
                                    <p class="form-hint">{{ __('Enter your subdomain name (e.g., yourorg for yourorg.localhost)') }}</p>
                                </div>
                                
                                <!-- Subdomain Tester -->
                                <div class="subdomain-tester">
                                    <div class="tester-header">
                                        <h5>{{ __('Domain Tester') }}</h5>
                                        <button type="button" class="test-btn" onclick="testSubdomain()">
                                            <i class="fas fa-play"></i>
                                            {{ __('Test Connection') }}
                        </button>
                    </div>
                                    <div class="test-results" id="test-results">
                                        <div class="test-item">
                                            <span class="test-label">{{ __('Localhost Test:') }}</span>
                                            <span class="test-status" id="localhost-test">
                                                <i class="fas fa-question-circle"></i>
                                                {{ __('Not Tested') }}
                                            </span>
                </div>
                                        <div class="test-item">
                                            <span class="test-label">{{ __('DNS Resolution:') }}</span>
                                            <span class="test-status" id="dns-test">
                                                <i class="fas fa-question-circle"></i>
                                                {{ __('Not Tested') }}
                                            </span>
                                        </div>
                                        <div class="test-item">
                                            <span class="test-label">{{ __('Access URL:') }}</span>
                                            <span class="test-url" id="access-url">
                                                {{ __('Enter subdomain to test') }}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="info-box">
                                    <h5>{{ __('Setup Instructions:') }}</h5>
                                    <ol>
                                        <li>{{ __('Configure your subdomain in the field above') }}</li>
                                        <li>{{ __('Access via: http://localhost/form.fr/org/yourorg/login') }}</li>
                                        <li>{{ __('Enable whitelabeling in General Settings') }}</li>
                                    </ol>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Custom CSS -->
                        <div class="settings-card css-card">
                            <div class="card-header">
                                <h4>{{ __('Custom CSS') }}</h4>
                                <div class="css-actions">
                                    <button type="button" class="css-btn" onclick="previewCSS()">
                                        <i class="fas fa-eye"></i>
                                        {{ __('Preview') }}
                                    </button>
                                    <button type="button" class="css-btn" onclick="resetCSS()">
                                        <i class="fas fa-undo"></i>
                                        {{ __('Reset') }}
                                    </button>
                                </div>
                            </div>
                            <div class="card-content">
                                <div class="form-group">
                                    <label class="form-label">{{ __('Custom CSS Code') }}</label>
                                    <div class="code-editor-wrapper">
                                        <textarea name="custom_css" id="css-editor" class="form-textarea code-editor" rows="12" 
                                                  placeholder="/* Add your custom CSS here */">{{ old('custom_css', $organization->custom_css) }}</textarea>
                                        <div class="editor-toolbar">
                                            <span class="line-count" id="line-count">1 line</span>
                                            <span class="char-count" id="char-count">0 characters</span>
                                        </div>
                                    </div>
                                    <p class="form-hint">{{ __('Add custom CSS to override default styles') }}</p>
                                </div>
                                
                                <div class="info-box warning">
                                    <h5>{{ __('CSS Tips:') }}</h5>
                                    <ul>
                                        <li>{{ __('Use CSS variables: var(--org-primary-color)') }}</li>
                                        <li>{{ __('Target specific elements with .organization-specific classes') }}</li>
                                        <li>{{ __('Test changes carefully before saving') }}</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
            </div>
        </div>
    </form>
</div>
        </div>

<style>
/* CSS Custom Properties for Organization Colors */
:root {
    --org-primary-color: {{ $organization->primary_color ?? '#3b82f6' }};
    --org-accent-color: {{ $organization->accent_color ?? '#1d4ed8' }};
    --org-secondary-color: {{ $organization->secondary_color ?? '#6c757d' }};
}

/* Modern Branding Page Styles */
.modern-branding-page {
    padding: 0;
    background: #f8fafc;
    min-height: 100vh;
    transition: background-color 0.3s ease;
}

.page-header {
    background: white;
    border-radius: 0 0 16px 16px;
    padding: 32px;
    margin-bottom: 24px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    transition: background-color 0.3s ease, color 0.3s ease;
}

.header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.page-title {
    font-size: 28px;
    font-weight: 700;
    color: #1e293b;
    margin: 0 0 8px 0;
    transition: color 0.3s ease;
}

.page-subtitle {
    font-size: 16px;
    color: #64748b;
    margin: 0;
    transition: color 0.3s ease;
}

.header-actions {
    display: flex;
    gap: 12px;
}

.btn-primary, .btn-secondary {
    padding: 12px 24px;
    border-radius: 8px;
    font-weight: 600;
    font-size: 14px;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.3s ease;
}

.btn-primary {
    background: var(--org-primary-color);
    color: white;
}

.btn-primary:hover {
    background: var(--org-accent-color);
    transform: translateY(-1px);
}

.btn-secondary {
    background: #f1f5f9;
    color: #475569;
    border: 1px solid #e2e8f0;
}

.btn-secondary:hover {
    background: #e2e8f0;
    color: #334155;
}

.branding-content {
    padding: 0 32px 32px 32px;
}

.settings-section {
    background: white;
    border-radius: 16px;
    margin-bottom: 24px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    transition: background-color 0.3s ease, color 0.3s ease;
}

.section-header {
    display: flex;
    align-items: center;
    padding: 24px 32px;
    border-bottom: 1px solid #e2e8f0;
    transition: border-color 0.3s ease;
}

.section-icon {
    width: 48px;
    height: 48px;
    background: linear-gradient(135deg, var(--org-primary-color), var(--org-accent-color));
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 16px;
}

.section-icon i {
    color: white;
    font-size: 20px;
}

.section-info h3 {
    font-size: 20px;
    font-weight: 600;
    color: #1e293b;
    margin: 0 0 4px 0;
    transition: color 0.3s ease;
}

.section-info p {
    font-size: 14px;
    color: #64748b;
    margin: 0;
    transition: color 0.3s ease;
}

.section-content {
    padding: 32px;
}

.settings-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 24px;
}

.advanced-settings-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
}

.settings-card {
    background: #f8fafc;
    border-radius: 12px;
    padding: 24px;
    border: 1px solid #e2e8f0;
    transition: background-color 0.3s ease, border-color 0.3s ease;
}

.settings-card.full-width {
    grid-column: 1 / -1;
}

.card-header h4 {
    font-size: 16px;
    font-weight: 600;
    color: #1e293b;
    margin: 0 0 16px 0;
    transition: color 0.3s ease;
}

.form-group {
    margin-bottom: 20px;
}

.form-label {
    display: block;
    font-size: 14px;
    font-weight: 500;
    color: #374151;
    margin-bottom: 8px;
    transition: color 0.3s ease;
}

.required {
    color: #ef4444;
}

.form-input, .form-textarea {
    width: 100%;
    padding: 12px 16px;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    font-size: 14px;
    transition: all 0.3s ease;
    background: white;
}

.form-input:focus, .form-textarea:focus {
    outline: none;
    border-color: var(--org-primary-color);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-hint {
    font-size: 12px;
    color: #6b7280;
    margin-top: 4px;
    transition: color 0.3s ease;
}

.form-error {
    font-size: 12px;
    color: #ef4444;
    margin-top: 4px;
}

.color-picker-group {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.color-picker-item {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.color-input-wrapper {
    display: flex;
    align-items: center;
    gap: 12px;
}

.color-input {
    width: 48px;
    height: 48px;
    border: none;
    border-radius: 8px;
    cursor: pointer;
}

.color-text {
    flex: 1;
    padding: 12px 16px;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    font-size: 14px;
    font-family: monospace;
}

.color-preview {
    display: flex;
    gap: 12px;
    margin-top: 16px;
}

.preview-item {
    flex: 1;
    height: 40px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 12px;
    font-weight: 500;
}

.upload-area {
    text-align: center;
}

.logo-preview, .favicon-preview, .background-preview {
    margin-bottom: 16px;
    border-radius: 8px;
    overflow: hidden;
}

.preview-image {
    width: 100%;
    height: 120px;
    object-fit: cover;
    border-radius: 8px;
}

.preview-image.small {
    width: 64px;
    height: 64px;
}

.upload-placeholder {
    width: 100%;
    height: 120px;
    background: #f1f5f9;
    border: 2px dashed #cbd5e1;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #64748b;
    transition: all 0.3s ease;
}

.upload-placeholder.small {
    width: 64px;
    height: 64px;
}

.upload-placeholder i {
    font-size: 24px;
    margin-bottom: 8px;
}

.upload-placeholder.small i {
    font-size: 16px;
    margin-bottom: 4px;
}

.upload-placeholder p {
    font-size: 12px;
    margin: 0;
}

.file-input {
    display: none;
}

.upload-btn {
    background: var(--org-primary-color);
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    transition: all 0.3s ease;
}

.upload-btn:hover {
    background: var(--org-accent-color);
    transform: translateY(-1px);
}

.upload-hint {
    font-size: 12px;
    color: #6b7280;
    margin-top: 8px;
}

.input-group {
    display: flex;
    align-items: center;
}

.input-suffix {
    padding: 12px 16px;
    background: #f1f5f9;
    border: 1px solid #d1d5db;
    border-left: none;
    border-radius: 0 8px 8px 0;
    font-size: 14px;
    color: #6b7280;
}

.code-editor {
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 13px;
    line-height: 1.5;
}

.info-box {
    background: #f0f9ff;
    border: 1px solid #bae6fd;
    border-radius: 8px;
    padding: 16px;
    margin-top: 16px;
}

.info-box.warning {
    background: #fffbeb;
    border-color: #fcd34d;
}

.info-box h5 {
    font-size: 14px;
    font-weight: 600;
    color: #1e40af;
    margin: 0 0 8px 0;
}

.info-box.warning h5 {
    color: #92400e;
}

.info-box ol, .info-box ul {
    margin: 0;
    padding-left: 20px;
}

.info-box li {
    font-size: 13px;
    color: #1e40af;
    margin-bottom: 4px;
}

.info-box.warning li {
    color: #92400e;
}

/* Dark Mode Styles */
@media (prefers-color-scheme: dark) {
    .modern-branding-page {
        background: #0f172a;
    }
    
    .page-header {
        background: #1e293b;
        color: #e2e8f0;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2);
    }
    
    .page-title {
        color: #e2e8f0;
    }
    
    .page-subtitle {
        color: #94a3b8;
    }
    
    .btn-secondary {
        background: #334155;
        color: #e2e8f0;
        border-color: #475569;
    }
    
    .btn-secondary:hover {
        background: #475569;
        color: #f1f5f9;
    }
    
    .settings-section {
        background: #1e293b;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2);
    }
    
    .section-header {
        border-bottom-color: #334155;
    }
    
    .section-info h3 {
        color: #e2e8f0;
    }
    
    .section-info p {
        color: #94a3b8;
    }
    
    .settings-card {
        background: #0f172a;
        border-color: #334155;
    }
    
    .card-header h4 {
        color: #e2e8f0;
    }
    
    .form-label {
        color: #e2e8f0;
    }
    
    .form-input, .form-textarea {
        background: #1e293b;
        border-color: #475569;
        color: #e2e8f0;
    }
    
    .form-input:focus, .form-textarea:focus {
        border-color: var(--org-primary-color);
        background: #1e293b;
    }
    
    .form-hint {
        color: #94a3b8;
    }
    
    .color-text {
        background: #1e293b;
        border-color: #475569;
        color: #e2e8f0;
    }
    
    .upload-placeholder {
        background: #1e293b;
        border-color: #475569;
        color: #94a3b8;
    }
    
    .input-suffix {
        background: #1e293b;
        border-color: #475569;
        color: #94a3b8;
    }
    
    .info-box {
        background: #1e3a8a;
        border-color: #3b82f6;
    }
    
    .info-box.warning {
        background: #92400e;
        border-color: #f59e0b;
    }
    
    .info-box h5 {
        color: #dbeafe;
    }
    
    .info-box.warning h5 {
        color: #fef3c7;
    }
    
    .info-box li {
        color: #dbeafe;
    }
    
    .info-box.warning li {
        color: #fef3c7;
    }
}

[data-theme="dark"] .modern-branding-page {
    background: #0f172a;
}

[data-theme="dark"] .page-header {
    background: #1e293b;
    color: #e2e8f0;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2);
}

[data-theme="dark"] .page-title {
    color: #e2e8f0;
}

[data-theme="dark"] .page-subtitle {
    color: #94a3b8;
}

[data-theme="dark"] .btn-secondary {
    background: #334155;
    color: #e2e8f0;
    border-color: #475569;
}

[data-theme="dark"] .btn-secondary:hover {
    background: #475569;
    color: #f1f5f9;
}

[data-theme="dark"] .settings-section {
    background: #1e293b;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2);
}

[data-theme="dark"] .section-header {
    border-bottom-color: #334155;
}

[data-theme="dark"] .section-info h3 {
    color: #e2e8f0;
}

[data-theme="dark"] .section-info p {
    color: #94a3b8;
}

[data-theme="dark"] .settings-card {
    background: #0f172a;
    border-color: #334155;
}

[data-theme="dark"] .card-header h4 {
    color: #e2e8f0;
}

[data-theme="dark"] .form-label {
    color: #e2e8f0;
}

[data-theme="dark"] .form-input, [data-theme="dark"] .form-textarea {
    background: #1e293b;
    border-color: #475569;
    color: #e2e8f0;
}

[data-theme="dark"] .form-input:focus, [data-theme="dark"] .form-textarea:focus {
    border-color: var(--org-primary-color);
    background: #1e293b;
}

[data-theme="dark"] .form-hint {
    color: #94a3b8;
}

[data-theme="dark"] .color-text {
    background: #1e293b;
    border-color: #475569;
    color: #e2e8f0;
}

[data-theme="dark"] .upload-placeholder {
    background: #1e293b;
    border-color: #475569;
    color: #94a3b8;
}

[data-theme="dark"] .input-suffix {
    background: #1e293b;
    border-color: #475569;
    color: #94a3b8;
}

[data-theme="dark"] .info-box {
    background: #1e3a8a;
    border-color: #3b82f6;
}

[data-theme="dark"] .info-box.warning {
    background: #92400e;
    border-color: #f59e0b;
}

[data-theme="dark"] .info-box h5 {
    color: #dbeafe;
}

[data-theme="dark"] .info-box.warning h5 {
    color: #fef3c7;
}

[data-theme="dark"] .info-box li {
    color: #dbeafe;
}

[data-theme="dark"] .info-box.warning li {
    color: #fef3c7;
}

/* Advanced Settings Styles */
.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
}

.card-status {
    display: flex;
    align-items: center;
}

.status-indicator {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    font-weight: 500;
    padding: 4px 8px;
    border-radius: 6px;
    background: #f1f5f9;
    color: #64748b;
}

.status-indicator.success {
    background: #dcfce7;
    color: #166534;
}

.status-indicator.error {
    background: #fef2f2;
    color: #dc2626;
}

.status-indicator.warning {
    background: #fef3c7;
    color: #92400e;
}

.status-indicator i {
    font-size: 8px;
}

.subdomain-tester {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 16px;
    margin-top: 16px;
}

.tester-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
}

.tester-header h5 {
    font-size: 14px;
    font-weight: 600;
    color: #1e293b;
    margin: 0;
}

.test-btn {
    background: var(--org-primary-color);
    color: white;
    border: none;
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 4px;
    transition: all 0.3s ease;
}

.test-btn:hover {
    background: var(--org-accent-color);
    transform: translateY(-1px);
}

.test-btn:disabled {
    background: #9ca3af;
    cursor: not-allowed;
    transform: none;
}

.test-results {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.test-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
    border-bottom: 1px solid #e2e8f0;
}

.test-item:last-child {
    border-bottom: none;
}

.test-label {
    font-size: 12px;
    font-weight: 500;
    color: #64748b;
}

.test-status {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    font-weight: 500;
}

.test-status.success {
    color: #166534;
}

.test-status.error {
    color: #dc2626;
}

.test-status.warning {
    color: #92400e;
}

.test-url {
    font-size: 12px;
    color: var(--org-primary-color);
    font-family: monospace;
    background: #f1f5f9;
    padding: 2px 6px;
    border-radius: 4px;
}

.css-actions {
    display: flex;
    gap: 8px;
}

.css-btn {
    background: #f1f5f9;
    color: #64748b;
    border: 1px solid #e2e8f0;
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 4px;
    transition: all 0.3s ease;
}

.css-btn:hover {
    background: #e2e8f0;
    color: #334155;
}

.code-editor-wrapper {
    position: relative;
}

.editor-toolbar {
    position: absolute;
    bottom: 8px;
    right: 8px;
    display: flex;
    gap: 12px;
    font-size: 11px;
    color: #9ca3af;
    background: rgba(255, 255, 255, 0.9);
    padding: 4px 8px;
    border-radius: 4px;
}

/* Responsive Design */
@media (max-width: 768px) {
    .page-header {
        padding: 24px;
    }
    
    .header-content {
        flex-direction: column;
        gap: 16px;
        align-items: flex-start;
    }
    
    .header-actions {
        width: 100%;
        justify-content: flex-end;
    }
    
    .branding-content {
        padding: 0 16px 16px 16px;
    }
    
    .section-content {
        padding: 24px;
    }
    
    .settings-grid {
        grid-template-columns: 1fr;
    }
    
    .advanced-settings-grid {
        grid-template-columns: 1fr;
    }
    
    .card-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
    }
    
    .css-actions {
        width: 100%;
        justify-content: flex-end;
    }
    
    .tester-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
    }
    
    .test-btn {
        width: 100%;
        justify-content: center;
    }
    
    .color-picker-group {
        gap: 12px;
    }
    
    .color-preview {
        flex-direction: column;
        gap: 8px;
    }
}
</style>

<script>
// Image preview functionality
function previewImage(input, previewSelector) {
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.querySelector(previewSelector);
            if (previewSelector.includes('favicon')) {
                preview.innerHTML = `<img src="${e.target.result}" alt="Preview" class="preview-image small">`;
            } else {
                preview.innerHTML = `<img src="${e.target.result}" alt="Preview" class="preview-image">`;
            }
        };
        reader.readAsDataURL(file);
    }
}

// Enhanced upload button functionality
document.addEventListener('DOMContentLoaded', function() {
    // Fix upload buttons for all file inputs using data-target attributes
    const uploadButtons = document.querySelectorAll('.upload-btn[data-target]');
    uploadButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const targetName = this.getAttribute('data-target');
            const fileInput = document.querySelector(`input[name="${targetName}"]`);
            if (fileInput) {
                fileInput.click();
            }
        });
    });

    // Add change listeners to all file inputs
    const fileInputs = document.querySelectorAll('input[type="file"]');
    fileInputs.forEach(input => {
        input.addEventListener('change', function() {
            const onchangeAttr = this.getAttribute('onchange');
            if (onchangeAttr) {
                const match = onchangeAttr.match(/previewImage\(this, '([^']+)'/);
                if (match && match[1]) {
                    previewImage(this, match[1]);
                }
            }
        });
    });

    // CSS Editor functionality
    const cssEditor = document.getElementById('css-editor');
    if (cssEditor) {
        cssEditor.addEventListener('input', updateEditorStats);
        updateEditorStats();
    }
});

// Color picker synchronization
document.querySelectorAll('.color-input').forEach(input => {
    input.addEventListener('change', function() {
        const textInput = this.parentNode.querySelector('.color-text');
        textInput.value = this.value;
        updateColorPreview();
    });
});

document.querySelectorAll('.color-text').forEach(input => {
    input.addEventListener('input', function() {
        const colorInput = this.parentNode.querySelector('.color-input');
        if (this.value.match(/^#[0-9A-F]{6}$/i)) {
            colorInput.value = this.value;
            updateColorPreview();
        }
    });
});

function updateColorPreview() {
    const primaryColor = document.querySelector('input[name="primary_color"]').value;
    const secondaryColor = document.querySelector('input[name="secondary_color"]').value;
    const accentColor = document.querySelector('input[name="accent_color"]').value;
    
    document.querySelectorAll('.preview-item').forEach((item, index) => {
        const colors = [primaryColor, secondaryColor, accentColor];
        item.style.background = colors[index];
    });
}

// Reset to defaults
function resetToDefaults() {
    if (confirm('{{ __("Are you sure you want to reset all settings to defaults? This action cannot be undone.") }}')) {
        document.querySelector('input[name="organization_name"]').value = '';
        document.querySelector('input[name="organization_tagline"]').value = '';
        document.querySelector('textarea[name="organization_description"]').value = '';
        document.querySelector('input[name="primary_color"]').value = '#3b82f6';
        document.querySelector('input[name="secondary_color"]').value = '#6c757d';
        document.querySelector('input[name="accent_color"]').value = '#10b981';
        document.querySelector('input[name="custom_domain"]').value = '';
        document.querySelector('textarea[name="custom_css"]').value = '';
        
        // Update text inputs
        document.querySelectorAll('.color-text').forEach((input, index) => {
            const colors = ['#3b82f6', '#6c757d', '#10b981'];
            input.value = colors[index];
        });
        
        updateColorPreview();
    }
}

// Initialize color preview
updateColorPreview();

// Subdomain Tester Functions
function testSubdomain() {
    const subdomain = document.getElementById('subdomain-input').value.trim();
    const testBtn = document.querySelector('.test-btn');
    const localhostTest = document.getElementById('localhost-test');
    const dnsTest = document.getElementById('dns-test');
    const accessUrl = document.getElementById('access-url');
    const domainStatus = document.getElementById('domain-status');
    
    if (!subdomain) {
        updateTestStatus(localhostTest, 'question', 'Not Tested', 'warning');
        updateTestStatus(dnsTest, 'question', 'Not Tested', 'warning');
        accessUrl.textContent = 'Enter subdomain to test';
        updateDomainStatus('warning', 'Not Configured');
        return;
    }
    
    // Disable test button
    testBtn.disabled = true;
    testBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Testing...';
    
    // Update access URL
    accessUrl.textContent = `http://localhost/form.fr/org/${subdomain}/login`;
    
    // Test localhost resolution
    testLocalhost(subdomain, localhostTest, dnsTest, domainStatus, testBtn);
}

function testLocalhost(subdomain, localhostTest, dnsTest, domainStatus, testBtn) {
    // Test the actual organization login URL
    const testUrl = `http://localhost/form.fr/org/${subdomain}/login`;
    
    // Test localhost connection
    fetch(testUrl, { 
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-cache'
    })
    .then(() => {
        updateTestStatus(localhostTest, 'check-circle', 'Accessible', 'success');
        updateDomainStatus('success', 'Configured');
    })
    .catch(() => {
        updateTestStatus(localhostTest, 'times-circle', 'Not Accessible', 'error');
        updateDomainStatus('error', 'Not Accessible');
    })
    .finally(() => {
        // Test DNS resolution
        testDNSResolution(subdomain, dnsTest, testBtn);
    });
}

function testDNSResolution(subdomain, dnsTest, testBtn) {
    // Simulate DNS test (in real implementation, this would be a server-side test)
    setTimeout(() => {
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        
        if (isLocalhost) {
            updateTestStatus(dnsTest, 'check-circle', 'Resolved', 'success');
        } else {
            updateTestStatus(dnsTest, 'exclamation-triangle', 'Check Hosts File', 'warning');
        }
        
        // Re-enable test button
        testBtn.disabled = false;
        testBtn.innerHTML = '<i class="fas fa-play"></i> Test Connection';
    }, 1000);
}

function updateTestStatus(element, icon, text, status) {
    element.innerHTML = `<i class="fas fa-${icon}"></i> ${text}`;
    element.className = `test-status ${status}`;
}

function updateDomainStatus(status, text) {
    const domainStatus = document.getElementById('domain-status');
    domainStatus.className = `status-indicator ${status}`;
    domainStatus.innerHTML = `<i class="fas fa-circle"></i> ${text}`;
}

// CSS Editor Functions
function updateEditorStats() {
    const cssEditor = document.getElementById('css-editor');
    const lineCount = document.getElementById('line-count');
    const charCount = document.getElementById('char-count');
    
    if (cssEditor && lineCount && charCount) {
        const lines = cssEditor.value.split('\n').length;
        const chars = cssEditor.value.length;
        
        lineCount.textContent = `${lines} line${lines !== 1 ? 's' : ''}`;
        charCount.textContent = `${chars} character${chars !== 1 ? 's' : ''}`;
    }
}

function previewCSS() {
    const cssCode = document.getElementById('css-editor').value;
    if (cssCode.trim()) {
        // Create a temporary style element to preview CSS
        const previewStyle = document.createElement('style');
        previewStyle.id = 'css-preview';
        previewStyle.textContent = cssCode;
        
        // Remove existing preview
        const existingPreview = document.getElementById('css-preview');
        if (existingPreview) {
            existingPreview.remove();
        }
        
        // Add new preview
        document.head.appendChild(previewStyle);
        
        // Show success message
        showNotification('CSS Preview Applied', 'success');
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
            previewStyle.remove();
            showNotification('CSS Preview Removed', 'info');
        }, 10000);
    } else {
        showNotification('Please enter some CSS code to preview', 'warning');
    }
}

function resetCSS() {
    if (confirm('Are you sure you want to reset the CSS editor? This will clear all custom CSS.')) {
        document.getElementById('css-editor').value = '';
        updateEditorStats();
        
        // Remove any existing preview
        const existingPreview = document.getElementById('css-preview');
        if (existingPreview) {
            existingPreview.remove();
        }
        
        showNotification('CSS Editor Reset', 'success');
    }
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'times-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#dcfce7' : type === 'error' ? '#fef2f2' : type === 'warning' ? '#fef3c7' : '#dbeafe'};
        color: ${type === 'success' ? '#166534' : type === 'error' ? '#dc2626' : type === 'warning' ? '#92400e' : '#1e40af'};
        border: 1px solid ${type === 'success' ? '#bbf7d0' : type === 'error' ? '#fecaca' : type === 'warning' ? '#fde68a' : '#bfdbfe'};
        border-radius: 8px;
        padding: 12px 16px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    .notification-content {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        font-weight: 500;
    }
`;
document.head.appendChild(style);
</script>
@endsection

@push('script')
<script>
// Preview logo when file is selected
document.querySelector('input[name="organization_logo"]').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.querySelector('.logo-preview').innerHTML = 
                `<img src="${e.target.result}" alt="Logo Preview" class="img-thumbnail" style="max-width: 150px;">`;
        };
        reader.readAsDataURL(file);
    }
});

// Preview favicon when file is selected
document.querySelector('input[name="organization_favicon"]').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.querySelector('.favicon-preview').innerHTML = 
                `<img src="${e.target.result}" alt="Favicon Preview" class="img-thumbnail" style="max-width: 32px;">`;
        };
        reader.readAsDataURL(file);
    }
});
</script>
@endpush
