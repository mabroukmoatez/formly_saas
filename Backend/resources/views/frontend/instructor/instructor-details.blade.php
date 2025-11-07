@extends('frontend.layouts.app')

@section('title') {{ $pageTitle }} @endsection

@section('meta')
    @php
        $metaData = getMeta('instructor');
    @endphp

    <meta name="description" content="{{ __($metaData['meta_description']) }}">
    <meta name="keywords" content="{{ __($metaData['meta_keyword']) }}">

    <!-- Open Graph meta tags for social sharing -->
    <meta property="og:type" content="Learning">
    <meta property="og:title" content="{{ $userInstructor->name }} - {{ __($metaData['meta_title']) }}">
    <meta property="og:description" content="{{ $userInstructor->instructor->professional_title ?? 'Professional Instructor' }}">
    <meta property="og:image" content="{{ getImageFile($userInstructor->image_path) }}">
    <meta property="og:url" content="{{ url()->current() }}">

    <meta property="og:site_name" content="{{ __(get_option('app_name')) }}">

    <!-- Twitter Card meta tags for Twitter sharing -->
    <meta name="twitter:card" content="Learning">
    <meta name="twitter:title" content="{{ $userInstructor->name }} - {{ __($metaData['meta_title']) }}">
    <meta name="twitter:description" content="{{ $userInstructor->instructor->professional_title ?? 'Professional Instructor' }}">
    <meta name="twitter:image" content="{{ getImageFile($userInstructor->image_path) }}">
@endsection

@section('content')
<div class="instructor-details-page">
    <!-- Hero Section -->
    <section class="instructor-hero">
        <div class="container">
            <div class="hero-content">
                <div class="instructor-profile">
                    <div class="profile-image">
                        <img src="{{ getImageFile($userInstructor->image_path) }}" alt="{{ $userInstructor->name }}">
                        <div class="status-indicator">
                            <span class="status-dot"></span>
                            <span>{{ __('Online') }}</span>
                        </div>
                    </div>
                    <div class="profile-info">
                        <h1 class="instructor-name">{{ $userInstructor->name }}</h1>
                        <p class="instructor-title">{{ $userInstructor->instructor->professional_title ?? __('Professional Instructor') }}</p>
                        <div class="instructor-rating">
                            <div class="stars">
                                @for($i = 1; $i <= 5; $i++)
                                    <svg class="star {{ $i <= $average_rating ? 'filled' : '' }}" viewBox="0 0 24 24" fill="none">
                                        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" fill="currentColor"/>
                                    </svg>
                                @endfor
                            </div>
                            <span class="rating-text">{{ number_format($average_rating, 1) }} ({{ $total_rating }} {{ __('reviews') }})</span>
                        </div>
                        <div class="instructor-stats">
                            <div class="stat">
                                <span class="stat-number">{{ $courses->total() }}</span>
                                <span class="stat-label">{{ __('Courses') }}</span>
                            </div>
                            <div class="stat">
                                <span class="stat-number">{{ $total_lectures }}</span>
                                <span class="stat-label">{{ __('Lectures') }}</span>
                            </div>
                            <div class="stat">
                                <span class="stat-number">{{ $total_assignments }}</span>
                                <span class="stat-label">{{ __('Assignments') }}</span>
                            </div>
                            <div class="stat">
                                <span class="stat-number">{{ $total_quizzes }}</span>
                                <span class="stat-label">{{ __('Quizzes') }}</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="hero-actions">
                    <button class="btn-primary">
                        <svg viewBox="0 0 24 24" fill="none">
                            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        {{ __('Follow') }}
                    </button>
                    <button class="btn-secondary">
                        <svg viewBox="0 0 24 24" fill="none">
                            <path d="M4 12V20H20V12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M12 2L12 14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M8 6L12 2L16 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        {{ __('Share') }}
                    </button>
                </div>
            </div>
        </div>
    </section>

    <!-- About Section -->
    <section class="about-section">
        <div class="container">
            <div class="section-header">
                <h2>{{ __('About Instructor') }}</h2>
            </div>
            <div class="about-content">
                <div class="about-text">
                    <p>{{ $userInstructor->instructor->about ?? __('This instructor is passionate about sharing knowledge and helping students achieve their learning goals.') }}</p>
                </div>
                <div class="about-stats">
                    <div class="stat-card">
                        <div class="stat-icon">
                            <svg viewBox="0 0 24 24" fill="none">
                                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </div>
                        <div class="stat-content">
                            <span class="stat-number">{{ number_format($average_rating, 1) }}</span>
                            <span class="stat-label">{{ __('Average Rating') }}</span>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">
                            <svg viewBox="0 0 24 24" fill="none">
                                <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89317 18.7122 8.75608 18.1676 9.45768C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </div>
                        <div class="stat-content">
                            <span class="stat-number">{{ $userInstructor->followers->count() }}</span>
                            <span class="stat-label">{{ __('Followers') }}</span>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">
                            <svg viewBox="0 0 24 24" fill="none">
                                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </div>
                        <div class="stat-content">
                            <span class="stat-number">{{ $courses->total() }}</span>
                            <span class="stat-label">{{ __('Total Courses') }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Courses Section -->
    <section class="courses-section">
        <div class="container">
            <div class="section-header">
                <h2>{{ __('Courses by') }} {{ $userInstructor->name }}</h2>
                <p>{{ __('Explore all courses created by this instructor') }}</p>
            </div>
            
            @if($courses->count() > 0)
            <div class="courses-grid">
                @foreach($courses as $course)
                <div class="course-card">
                    <div class="course-image">
                        <img src="{{ getImageFile($course->image_path) }}" alt="{{ $course->title }}">
                        <div class="course-badge">
                            @if($course->is_free)
                                <span class="badge-free">{{ __('Free') }}</span>
                            @else
                                <span class="badge-paid">{{ get_currency_symbol() }}{{ $course->price }}</span>
                            @endif
                        </div>
                    </div>
                    <div class="course-content">
                        <div class="course-meta">
                            <span class="course-category">{{ $course->category->name ?? __('General') }}</span>
                            <div class="course-rating">
                                <svg viewBox="0 0 24 24" fill="none">
                                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                                <span>{{ number_format($course->average_rating ?? 0, 1) }}</span>
                            </div>
                        </div>
                        <h3 class="course-title">{{ $course->title }}</h3>
                        <p class="course-description">{{ Str::limit($course->subtitle, 100) }}</p>
                        <div class="course-stats">
                            <div class="stat">
                                <svg viewBox="0 0 24 24" fill="none">
                                    <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                                <span>{{ $course->enrollments_count ?? 0 }} {{ __('students') }}</span>
                            </div>
                            <div class="stat">
                                <svg viewBox="0 0 24 24" fill="none">
                                    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                                <span>{{ $course->lectures_count ?? 0 }} {{ __('lectures') }}</span>
                            </div>
                        </div>
                        <a href="{{ route('course-details', ['id' => $course->id, 'slug' => Str::slug($course->title)]) }}" class="course-btn">
                            {{ __('View Course') }}
                            <svg viewBox="0 0 24 24" fill="none">
                                <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </a>
                    </div>
                </div>
                @endforeach
            </div>
            
            <!-- Pagination -->
            @if($courses->hasPages())
            <div class="pagination-wrapper">
                {{ $courses->links() }}
            </div>
            @endif
            
            @else
            <div class="empty-state">
                <div class="empty-icon">
                    <svg viewBox="0 0 24 24" fill="none">
                        <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </div>
                <h3>{{ __('No courses found') }}</h3>
                <p>{{ __('This instructor hasn\'t published any courses yet.') }}</p>
            </div>
            @endif
        </div>
    </section>
</div>
@endsection

@push('style')
<style>
/* Instructor Details Page Styles */
.instructor-details-page {
    background: #f8fafc;
    min-height: 100vh;
}

/* Hero Section */
.instructor-hero {
    background: linear-gradient(135deg, #007AFF 0%, #0056CC 100%);
    color: white;
    padding: 4rem 0;
    position: relative;
    overflow: hidden;
}

.instructor-hero::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="50" cy="50" r="1" fill="white" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
    opacity: 0.3;
}

.hero-content {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 3rem;
}

.instructor-profile {
    display: flex;
    align-items: center;
    gap: 2rem;
}

.profile-image {
    position: relative;
    width: 150px;
    height: 150px;
    border-radius: 50%;
    overflow: hidden;
    border: 4px solid rgba(255, 255, 255, 0.2);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.profile-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.status-indicator {
    position: absolute;
    bottom: 10px;
    right: 10px;
    background: rgba(255, 255, 255, 0.9);
    color: #10b981;
    padding: 0.5rem 1rem;
    border-radius: 20px;
    font-size: 0.875rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.status-dot {
    width: 8px;
    height: 8px;
    background: #10b981;
    border-radius: 50%;
    animation: pulse 2s infinite;
}

@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
}

.profile-info {
    flex: 1;
}

.instructor-name {
    font-size: 2.5rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.instructor-title {
    font-size: 1.25rem;
    opacity: 0.9;
    margin-bottom: 1.5rem;
}

.instructor-rating {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 2rem;
}

.stars {
    display: flex;
    gap: 0.25rem;
}

.star {
    width: 20px;
    height: 20px;
    color: #FFCC00;
}

.star.filled {
    fill: currentColor;
}

.rating-text {
    font-size: 1.125rem;
    font-weight: 600;
}

.instructor-stats {
    display: flex;
    gap: 2rem;
}

.stat {
    text-align: center;
}

.stat-number {
    display: block;
    font-size: 1.5rem;
    font-weight: 700;
    margin-bottom: 0.25rem;
}

.stat-label {
    font-size: 0.875rem;
    opacity: 0.8;
}

.hero-actions {
    display: flex;
    gap: 1rem;
}

.btn-primary, .btn-secondary {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    border-radius: 50px;
    font-weight: 600;
    text-decoration: none;
    transition: all 0.3s ease;
    border: none;
    cursor: pointer;
}

.btn-primary {
    background: rgba(255, 255, 255, 0.2);
    color: white;
    border: 2px solid rgba(255, 255, 255, 0.3);
}

.btn-primary:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: translateY(-2px);
}

.btn-secondary {
    background: transparent;
    color: white;
    border: 2px solid rgba(255, 255, 255, 0.3);
}

.btn-secondary:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: translateY(-2px);
}

.btn-primary svg, .btn-secondary svg {
    width: 18px;
    height: 18px;
}

/* About Section */
.about-section {
    padding: 4rem 0;
    background: white;
}

.section-header {
    text-align: center;
    margin-bottom: 3rem;
}

.section-header h2 {
    font-size: 2.5rem;
    font-weight: 700;
    color: #1f2937;
    margin-bottom: 1rem;
}

.about-content {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 3rem;
    align-items: start;
}

.about-text p {
    font-size: 1.125rem;
    line-height: 1.7;
    color: #6b7280;
}

.about-stats {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.stat-card {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.5rem;
    background: #f8fafc;
    border-radius: 12px;
    border: 1px solid #e5e7eb;
}

.stat-icon {
    width: 48px;
    height: 48px;
    background: linear-gradient(135deg, #007AFF, #0056CC);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
}

.stat-icon svg {
    width: 24px;
    height: 24px;
}

.stat-content {
    flex: 1;
}

.stat-content .stat-number {
    display: block;
    font-size: 1.5rem;
    font-weight: 700;
    color: #1f2937;
    margin-bottom: 0.25rem;
}

.stat-content .stat-label {
    font-size: 0.875rem;
    color: #6b7280;
}

/* Courses Section */
.courses-section {
    padding: 4rem 0;
    background: #f8fafc;
}

.courses-section .section-header h2 {
    color: #1f2937;
}

.courses-section .section-header p {
    font-size: 1.125rem;
    color: #6b7280;
}

.courses-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    gap: 2rem;
    margin-bottom: 3rem;
}

.course-card {
    background: white;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    transition: all 0.3s ease;
    border: 1px solid #e5e7eb;
}

.course-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
}

.course-image {
    position: relative;
    height: 200px;
    overflow: hidden;
}

.course-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
}

.course-card:hover .course-image img {
    transform: scale(1.05);
}

.course-badge {
    position: absolute;
    top: 1rem;
    right: 1rem;
}

.badge-free, .badge-paid {
    padding: 0.5rem 1rem;
    border-radius: 20px;
    font-size: 0.875rem;
    font-weight: 600;
    color: white;
}

.badge-free {
    background: #10b981;
}

.badge-paid {
    background: #FF9500;
}

.course-content {
    padding: 1.5rem;
}

.course-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
}

.course-category {
    background: #f3f4f6;
    color: #6b7280;
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    font-size: 0.875rem;
    font-weight: 500;
}

.course-rating {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    color: #FFCC00;
}

.course-rating svg {
    width: 16px;
    height: 16px;
    fill: currentColor;
}

.course-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 0.75rem;
    line-height: 1.4;
}

.course-description {
    color: #6b7280;
    line-height: 1.6;
    margin-bottom: 1.5rem;
}

.course-stats {
    display: flex;
    gap: 1.5rem;
    margin-bottom: 1.5rem;
}

.course-stats .stat {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #6b7280;
    font-size: 0.875rem;
}

.course-stats .stat svg {
    width: 16px;
    height: 16px;
}

.course-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    width: 100%;
    padding: 0.75rem 1.5rem;
    background: linear-gradient(135deg, #007AFF, #0056CC);
    color: white;
    text-decoration: none;
    border-radius: 12px;
    font-weight: 600;
    transition: all 0.3s ease;
}

.course-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 122, 255, 0.3);
}

.course-btn svg {
    width: 16px;
    height: 16px;
}

/* Empty State */
.empty-state {
    text-align: center;
    padding: 4rem 2rem;
}

.empty-icon {
    width: 80px;
    height: 80px;
    margin: 0 auto 2rem;
    background: #f3f4f6;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #9ca3af;
}

.empty-icon svg {
    width: 40px;
    height: 40px;
}

.empty-state h3 {
    font-size: 1.5rem;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 1rem;
}

.empty-state p {
    color: #6b7280;
    font-size: 1.125rem;
}

/* Pagination */
.pagination-wrapper {
    display: flex;
    justify-content: center;
    margin-top: 3rem;
}

/* Responsive Design */
@media (max-width: 768px) {
    .hero-content {
        flex-direction: column;
        text-align: center;
        gap: 2rem;
    }
    
    .instructor-profile {
        flex-direction: column;
        text-align: center;
    }
    
    .profile-image {
        width: 120px;
        height: 120px;
    }
    
    .instructor-name {
        font-size: 2rem;
    }
    
    .instructor-stats {
        justify-content: center;
    }
    
    .about-content {
        grid-template-columns: 1fr;
        gap: 2rem;
    }
    
    .courses-grid {
        grid-template-columns: 1fr;
    }
    
    .hero-actions {
        flex-direction: column;
        width: 100%;
    }
    
    .btn-primary, .btn-secondary {
        width: 100%;
        justify-content: center;
    }
}

/* Dark Mode Support */
[data-theme="dark"] .instructor-details-page {
    background: #111827;
}

[data-theme="dark"] .about-section {
    background: #1f2937;
}

[data-theme="dark"] .section-header h2 {
    color: #f9fafb;
}

[data-theme="dark"] .about-text p {
    color: #d1d5db;
}

[data-theme="dark"] .stat-card {
    background: #374151;
    border-color: #4b5563;
}

[data-theme="dark"] .stat-content .stat-number {
    color: #f9fafb;
}

[data-theme="dark"] .stat-content .stat-label {
    color: #d1d5db;
}

[data-theme="dark"] .courses-section {
    background: #111827;
}

[data-theme="dark"] .course-card {
    background: #1f2937;
    border-color: #374151;
}

[data-theme="dark"] .course-title {
    color: #f9fafb;
}

[data-theme="dark"] .course-description {
    color: #d1d5db;
}

[data-theme="dark"] .empty-state h3 {
    color: #f9fafb;
}

[data-theme="dark"] .empty-state p {
    color: #d1d5db;
}

[data-theme="dark"] .empty-icon {
    background: #374151;
    color: #6b7280;
}
</style>
@endpush
