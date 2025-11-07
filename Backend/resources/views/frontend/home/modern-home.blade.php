@extends('frontend.layouts.app')

@section('title') {{ $pageTitle }} @endsection

@section('content')
<!-- Modern Hero Section -->
<section class="modern-hero">
    <div class="hero-background">
        <div class="hero-gradient"></div>
        <div class="hero-particles"></div>
        <div class="hero-shapes">
            <div class="shape shape-1"></div>
            <div class="shape shape-2"></div>
            <div class="shape shape-3"></div>
            <div class="shape shape-4"></div>
        </div>
    </div>
    
    <div class="container">
        <div class="hero-content">
            <div class="hero-text">
                <div class="hero-badge">
                    <span class="badge-icon">🚀</span>
                    <span>{{ __('Transform Your Learning Journey') }}</span>
                </div>
                
                <h1 class="hero-title">
                    <span class="title-line">{{ __('A Better') }}</span>
                    <span class="title-line highlight">{{ __('Learning') }}</span>
                    <span class="title-line">{{ __('Starts Here') }}</span>
                </h1>
                
                <p class="hero-description">
                    {{ __('Experience the future of online learning with our cutting-edge platform designed for modern learners.') }}
                </p>
                
                <div class="hero-actions">
                    <button class="btn-primary">
                        <span>{{ __('Explore Courses') }}</span>
                        <svg class="btn-icon" viewBox="0 0 24 24" fill="none">
                            <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                    <button class="btn-secondary">
                        <svg class="play-icon" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                            <polygon points="10,8 16,12 10,16" fill="currentColor"/>
                        </svg>
                        <span>{{ __('Watch Demo') }}</span>
                    </button>
                </div>
                
                <div class="hero-stats">
                    <div class="stat-item">
                        <div class="stat-number">{{ __('Expert Instructors') }}</div>
                        <div class="stat-label">{{ __('Professional Teachers') }}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-number">{{ __('Happy Students') }}</div>
                        <div class="stat-label">{{ __('Satisfied Learners') }}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-number">{{ __('Interactive Learning') }}</div>
                        <div class="stat-label">{{ __('Engaging Content') }}</div>
                    </div>
                </div>
            </div>
            
            <div class="hero-visual">
                <div class="hero-image-container">
                    <div class="floating-card card-1">
                        <div class="card-icon">📚</div>
                        <div class="card-text">{{ __('Course Library') }}</div>
                    </div>
                    <div class="floating-card card-2">
                        <div class="card-icon">🎓</div>
                        <div class="card-text">{{ __('Certification') }}</div>
                    </div>
                    <div class="floating-card card-3">
                        <div class="card-icon">🏆</div>
                        <div class="card-text">{{ __('Goal Achievement') }}</div>
                    </div>
                    <div class="main-hero-image">
                        <img src="{{ getImageFile($home->banner_image) }}" alt="Learning Platform" class="hero-img">
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>

<!-- Features Section -->
<section class="features-section">
    <div class="container">
        <div class="section-header">
            <div class="section-badge">
                <span>{{ __('Why Choose Formly?') }}</span>
            </div>
            <h2 class="section-title">{{ __('Experience the future of online learning') }}</h2>
            <p class="section-description">{{ __('Discover innovative features designed to enhance your learning experience') }}</p>
        </div>
        
        <div class="features-grid">
            <div class="feature-card" data-aos="fade-up" data-aos-delay="100">
                <div class="feature-icon">
                    <svg viewBox="0 0 24 24" fill="none">
                        <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </div>
                <h3>{{ __('Expert Instructors') }}</h3>
                <p>{{ __('Learn from industry professionals with years of experience') }}</p>
            </div>
            
            <div class="feature-card" data-aos="fade-up" data-aos-delay="200">
                <div class="feature-icon">
                    <svg viewBox="0 0 24 24" fill="none">
                        <path d="M9 12L11 14L15 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2"/>
                    </svg>
                </div>
                <h3>{{ __('Certification') }}</h3>
                <p>{{ __('Get recognized certificates upon course completion') }}</p>
            </div>
            
            <div class="feature-card" data-aos="fade-up" data-aos-delay="300">
                <div class="feature-icon">
                    <svg viewBox="0 0 24 24" fill="none">
                        <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <circle cx="9" cy="7" r="4" stroke="currentColor" stroke-width="2"/>
                        <path d="M23 21V19C23 18.1645 22.7155 17.3541 22.2094 16.6977C21.7033 16.0413 20.9991 15.5714 20.2 15.36" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89317 18.7122 8.75608 18.1676 9.45768C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </div>
                <h3>{{ __('Community') }}</h3>
                <p>{{ __('Join a vibrant community of learners and professionals') }}</p>
            </div>
            
            <div class="feature-card" data-aos="fade-up" data-aos-delay="400">
                <div class="feature-icon">
                    <svg viewBox="0 0 24 24" fill="none">
                        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" stroke="currentColor" stroke-width="2"/>
                        <line x1="8" y1="21" x2="16" y2="21" stroke="currentColor" stroke-width="2"/>
                        <line x1="12" y1="17" x2="12" y2="21" stroke="currentColor" stroke-width="2"/>
                    </svg>
                </div>
                <h3>{{ __('Accessible') }}</h3>
                <p>{{ __('Access your courses anywhere, anytime on any device') }}</p>
            </div>
            
            <div class="feature-card" data-aos="fade-up" data-aos-delay="500">
                <div class="feature-icon">
                    <svg viewBox="0 0 24 24" fill="none">
                        <path d="M22 16.92V19.92C22.0011 20.1985 21.9441 20.4742 21.8325 20.7293C21.7209 20.9845 21.5573 21.2136 21.3521 21.4019C21.1468 21.5901 20.9046 21.7335 20.6407 21.8227C20.3769 21.9119 20.0974 21.9451 19.82 21.92H4.18C3.90259 21.9451 3.62308 21.9119 3.35926 21.8227C3.09544 21.7335 2.85322 21.5901 2.64796 21.4019C2.4427 21.2136 2.27909 20.9845 2.16747 20.7293C2.05585 20.4742 1.9989 20.1985 2 19.92V16.92" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M7 10L12 15L17 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M12 15V3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </div>
                <h3>{{ __('Support') }}</h3>
                <p>{{ __('Get help whenever you need it with our dedicated support team') }}</p>
            </div>
            
            <div class="feature-card" data-aos="fade-up" data-aos-delay="600">
                <div class="feature-icon">
                    <svg viewBox="0 0 24 24" fill="none">
                        <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </div>
                <h3>{{ __('Career Growth') }}</h3>
                <p>{{ __('Advance your career with in-demand skills and knowledge') }}</p>
            </div>
        </div>
    </div>
</section>

<!-- Courses Section -->
@if(isset($featuredCourses) && count($featuredCourses))
<section class="courses-section">
    <div class="container">
        <div class="section-header">
            <div class="section-badge">
                <span>{{ __('Featured Courses') }}</span>
            </div>
            <h2 class="section-title">{{ __(get_option('course_title')) }}</h2>
            <p class="section-description">{{ __(get_option('course_subtitle')) }}</p>
        </div>
        
        <div class="courses-grid">
            @foreach($featuredCourses->take(6) as $course)
            <div class="course-card" data-aos="fade-up" data-aos-delay="{{ $loop->index * 100 }}">
                <div class="course-image">
                    <img src="{{ getImageFile($course->image_path) }}" alt="{{ $course->title }}">
                    <div class="course-overlay">
                        <button class="play-btn">
                            <svg viewBox="0 0 24 24" fill="none">
                                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                                <polygon points="10,8 16,12 10,16" fill="currentColor"/>
                            </svg>
                        </button>
                    </div>
                </div>
                <div class="course-content">
                    <div class="course-category">{{ $course->category->name ?? 'General' }}</div>
                    <h3 class="course-title">{{ $course->title }}</h3>
                    <p class="course-description">{{ Str::limit($course->short_description, 100) }}</p>
                    <div class="course-meta">
                        <div class="course-rating">
                            <div class="stars">
                                @for($i = 1; $i <= 5; $i++)
                                    <svg class="star {{ $i <= $course->average_rating ? 'filled' : '' }}" viewBox="0 0 24 24" fill="none">
                                        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" stroke="currentColor" stroke-width="2"/>
                                    </svg>
                                @endfor
                            </div>
                            <span class="rating-text">{{ number_format($course->average_rating, 1) }} ({{ $course->reviews->count() }})</span>
                        </div>
                        <div class="course-price">
                            @if($course->is_free)
                                <span class="price-free">{{ __('Free') }}</span>
                            @else
                                <span class="price-current">{{ get_currency_symbol() }}{{ $course->price }}</span>
                                @if($course->old_price)
                                    <span class="price-old">{{ get_currency_symbol() }}{{ $course->old_price }}</span>
                                @endif
                            @endif
                        </div>
                    </div>
                    <div class="course-footer">
                        <div class="course-instructor">
                            <img src="{{ getImageFile($course->user->image_path) }}" alt="{{ $course->user->name }}" class="instructor-avatar">
                            <span>{{ $course->user->name }}</span>
                        </div>
                        <button class="enroll-btn">
                            <span>{{ __('Enroll Now') }}</span>
                            <svg viewBox="0 0 24 24" fill="none">
                                <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
            @endforeach
        </div>
        
        <div class="section-footer">
            <a href="{{ route('courses') }}" class="btn-outline">
                <span>{{ __('View All Courses') }}</span>
                <svg viewBox="0 0 24 24" fill="none">
                    <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </a>
        </div>
    </div>
</section>
@endif

<!-- Categories Section -->
@if(isset($firstFourCategories) && count($firstFourCategories))
<section class="categories-section">
    <div class="container">
        <div class="section-header">
            <div class="section-badge">
                <span>{{ __('Our Top Categories') }}</span>
            </div>
            <h2 class="section-title">{{ __('Explore by Category') }}</h2>
            <p class="section-description">{{ __('Discover courses organized by subject areas') }}</p>
        </div>
        
        <div class="categories-grid">
            @foreach($firstFourCategories as $category)
            <div class="category-card" data-aos="fade-up" data-aos-delay="{{ $loop->index * 100 }}">
                <div class="category-icon">
                    <img src="{{ getImageFile($category->image_path) }}" alt="{{ $category->name }}">
                </div>
                <div class="category-content">
                    <h3 class="category-name">{{ $category->name }}</h3>
                    <p class="category-count">{{ $category->courses->count() }} {{ __('Courses') }}</p>
                    <a href="{{ route('courses', ['category' => $category->id]) }}" class="category-link">
                        <span>{{ __('Explore') }}</span>
                        <svg viewBox="0 0 24 24" fill="none">
                            <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </a>
                </div>
            </div>
            @endforeach
        </div>
    </div>
</section>
@endif

<!-- Instructors Section -->
@if(isset($instructors) && count($instructors))
<section class="instructors-section">
    <div class="container">
        <div class="section-header">
            <div class="section-badge">
                <span>{{ __('Our Top Instructors') }}</span>
            </div>
            <h2 class="section-title">{{ __('Learn from the Best') }}</h2>
            <p class="section-description">{{ __('Meet our expert instructors and start your learning journey') }}</p>
        </div>
        
        <div class="instructors-grid">
            @foreach($instructors->take(4) as $instructor)
            <div class="instructor-card" data-aos="fade-up" data-aos-delay="{{ $loop->index * 100 }}">
                <div class="instructor-image">
                    <img src="{{ getImageFile($instructor->image_path) }}" alt="{{ $instructor->name }}">
                    <div class="instructor-status">
                        <span class="status-dot"></span>
                        <span>{{ __('Online') }}</span>
                    </div>
                </div>
                <div class="instructor-content">
                    <h3 class="instructor-name">{{ $instructor->name }}</h3>
                    <p class="instructor-title">{{ __('Professional Instructor') }}</p>
                    <div class="instructor-rating">
                        <div class="stars">
                            @for($i = 1; $i <= 5; $i++)
                                <svg class="star filled" viewBox="0 0 24 24" fill="none">
                                    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" fill="currentColor"/>
                                </svg>
                            @endfor
                        </div>
                        <span class="rating-text">4.8 ({{ $instructor->enrollment_students_count ?? 0 }})</span>
                    </div>
                    <div class="instructor-stats">
                        <div class="stat">
                            <span class="stat-number">{{ $instructor->courses_count ?? 0 }}</span>
                            <span class="stat-label">{{ __('Courses') }}</span>
                        </div>
                        <div class="stat">
                            <span class="stat-number">{{ $instructor->enrollment_students_count ?? 0 }}</span>
                            <span class="stat-label">{{ __('Students') }}</span>
                        </div>
                    </div>
                    <a href="{{ route('instructor.details', ['id' => $instructor->id, 'slug' => Str::slug($instructor->name)]) }}" class="instructor-btn">
                        <span>{{ __('View Profile') }}</span>
                        <svg viewBox="0 0 24 24" fill="none">
                            <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </a>
                </div>
            </div>
            @endforeach
        </div>
        
        <div class="section-footer">
            <a href="{{ route('instructor') }}" class="btn-outline">
                <span>{{ __('View All Instructors') }}</span>
                <svg viewBox="0 0 24 24" fill="none">
                    <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </a>
        </div>
    </div>
</section>
@endif

<!-- CTA Section -->
<section class="cta-section">
    <div class="container">
        <div class="cta-content">
            <div class="cta-text">
                <h2>{{ __('Ready to Start Learning?') }}</h2>
                <p>{{ __('Join thousands of students who are already transforming their careers') }}</p>
            </div>
            <div class="cta-actions">
                <a href="{{ route('courses') }}" class="btn-primary">
                    <span>{{ __('Browse Courses') }}</span>
                    <svg viewBox="0 0 24 24" fill="none">
                        <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </a>
                @if(!auth()->check())
                <a href="{{ route('login') }}" class="btn-secondary">
                    <span>{{ __('Sign In') }}</span>
                </a>
                @endif
            </div>
        </div>
    </div>
</section>

@endsection

@push('style')
<style>
:root {
    --formly-primary: #007AFF;
    --formly-secondary: #FF9500;
    --formly-accent: #FFCC00;
    --formly-white: #ffffff;
    --formly-dark: #1a1a1a;
    --formly-text: #666666;
    --formly-light: #f8fafc;
    --formly-border: rgba(0, 0, 0, 0.07);
    --formly-shadow: 0 10px 40px rgba(0, 122, 255, 0.1);
    --formly-shadow-lg: 0 20px 60px rgba(0, 122, 255, 0.15);
    --formly-gradient: linear-gradient(135deg, #007AFF 0%, #FF9500 100%);
    --formly-gradient-light: linear-gradient(135deg, rgba(0, 122, 255, 0.1) 0%, rgba(255, 149, 0, 0.1) 100%);
}

/* Modern Hero Section */
.modern-hero {
    position: relative;
    min-height: 100vh;
    display: flex;
    align-items: center;
    overflow: hidden;
    background: var(--formly-gradient);
}

.hero-background {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1;
}

.hero-gradient {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, #007AFF 0%, #FF9500 50%, #FFCC00 100%);
    opacity: 0.9;
}

.hero-particles {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: 
        radial-gradient(circle at 20% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
        radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
        radial-gradient(circle at 40% 40%, rgba(255, 255, 255, 0.05) 0%, transparent 50%);
    animation: particles 20s ease-in-out infinite;
}

@keyframes particles {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-20px) rotate(180deg); }
}

.hero-shapes {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
}

.shape {
    position: absolute;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.1);
    animation: float 6s ease-in-out infinite;
}

.shape-1 {
    width: 200px;
    height: 200px;
    top: 10%;
    left: 10%;
    animation-delay: 0s;
}

.shape-2 {
    width: 150px;
    height: 150px;
    top: 60%;
    right: 10%;
    animation-delay: 2s;
}

.shape-3 {
    width: 100px;
    height: 100px;
    top: 30%;
    right: 30%;
    animation-delay: 4s;
}

.shape-4 {
    width: 80px;
    height: 80px;
    bottom: 20%;
    left: 20%;
    animation-delay: 1s;
}

@keyframes float {
    0%, 100% { transform: translateY(0px) scale(1); }
    50% { transform: translateY(-30px) scale(1.1); }
}

.hero-content {
    position: relative;
    z-index: 2;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4rem;
    align-items: center;
    min-height: 100vh;
    padding: 2rem 0;
}

.hero-text {
    color: white;
}

.hero-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    background: rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(10px);
    padding: 0.5rem 1rem;
    border-radius: 50px;
    font-size: 0.875rem;
    font-weight: 500;
    margin-bottom: 2rem;
    animation: slideInLeft 1s ease-out;
}

.badge-icon {
    font-size: 1.25rem;
}

.hero-title {
    font-size: clamp(2.5rem, 5vw, 4rem);
    font-weight: 800;
    line-height: 1.1;
    margin-bottom: 1.5rem;
    animation: slideInLeft 1s ease-out 0.2s both;
}

.title-line {
    display: block;
}

.title-line.highlight {
    background: linear-gradient(45deg, #FFCC00, #FF9500);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.hero-description {
    font-size: 1.25rem;
    line-height: 1.6;
    opacity: 0.9;
    margin-bottom: 2.5rem;
    animation: slideInLeft 1s ease-out 0.4s both;
}

.hero-actions {
    display: flex;
    gap: 1rem;
    margin-bottom: 3rem;
    animation: slideInLeft 1s ease-out 0.6s both;
}

.btn-primary, .btn-secondary {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 1rem 2rem;
    border-radius: 50px;
    font-weight: 600;
    text-decoration: none;
    transition: all 0.3s ease;
    border: none;
    cursor: pointer;
    font-size: 1rem;
}

.btn-primary {
    background: white;
    color: var(--formly-primary);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 15px 40px rgba(0, 0, 0, 0.3);
}

.btn-secondary {
    background: transparent;
    color: white;
    border: 2px solid rgba(255, 255, 255, 0.3);
    backdrop-filter: blur(10px);
}

.btn-secondary:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.5);
}

.btn-icon, .play-icon {
    width: 20px;
    height: 20px;
}

.hero-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 2rem;
    animation: slideInLeft 1s ease-out 0.8s both;
}

.stat-item {
    text-align: center;
}

.stat-number {
    font-size: 1.5rem;
    font-weight: 700;
    margin-bottom: 0.25rem;
}

.stat-label {
    font-size: 0.875rem;
    opacity: 0.8;
}

.hero-visual {
    position: relative;
    animation: slideInRight 1s ease-out 0.4s both;
}

.hero-image-container {
    position: relative;
    height: 600px;
}

.main-hero-image {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 400px;
    height: 400px;
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 30px 60px rgba(0, 0, 0, 0.3);
    animation: heroImageFloat 6s ease-in-out infinite;
}

.hero-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

@keyframes heroImageFloat {
    0%, 100% { transform: translate(-50%, -50%) rotate(0deg) scale(1); }
    50% { transform: translate(-50%, -50%) rotate(2deg) scale(1.05); }
}

.floating-card {
    position: absolute;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    padding: 1rem 1.5rem;
    border-radius: 15px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
    display: flex;
    align-items: center;
    gap: 0.75rem;
    animation: cardFloat 4s ease-in-out infinite;
}

.card-1 {
    top: 10%;
    right: 10%;
    animation-delay: 0s;
}

.card-2 {
    bottom: 20%;
    left: 5%;
    animation-delay: 1.5s;
}

.card-3 {
    top: 60%;
    right: 5%;
    animation-delay: 3s;
}

@keyframes cardFloat {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-15px); }
}

.card-icon {
    font-size: 1.5rem;
}

.card-text {
    font-weight: 600;
    color: var(--formly-dark);
}

/* Features Section */
.features-section {
    padding: 6rem 0;
    background: var(--formly-light);
}

.section-header {
    text-align: center;
    margin-bottom: 4rem;
}

.section-badge {
    display: inline-block;
    background: var(--formly-gradient-light);
    color: var(--formly-primary);
    padding: 0.5rem 1.5rem;
    border-radius: 50px;
    font-size: 0.875rem;
    font-weight: 600;
    margin-bottom: 1rem;
}

.section-title {
    font-size: clamp(2rem, 4vw, 3rem);
    font-weight: 700;
    color: var(--formly-dark);
    margin-bottom: 1rem;
}

.section-description {
    font-size: 1.125rem;
    color: var(--formly-text);
    max-width: 600px;
    margin: 0 auto;
}

.features-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
}

.feature-card {
    background: white;
    padding: 2rem;
    border-radius: 20px;
    box-shadow: var(--formly-shadow);
    transition: all 0.3s ease;
    border: 1px solid var(--formly-border);
}

.feature-card:hover {
    transform: translateY(-10px);
    box-shadow: var(--formly-shadow-lg);
}

.feature-icon {
    width: 60px;
    height: 60px;
    background: var(--formly-gradient-light);
    border-radius: 15px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 1.5rem;
    color: var(--formly-primary);
}

.feature-icon svg {
    width: 30px;
    height: 30px;
}

.feature-card h3 {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--formly-dark);
    margin-bottom: 1rem;
}

.feature-card p {
    color: var(--formly-text);
    line-height: 1.6;
}

/* Courses Section */
.courses-section {
    padding: 6rem 0;
    background: white;
}

.courses-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    gap: 2rem;
    margin-bottom: 3rem;
}

.course-card {
    background: white;
    border-radius: 20px;
    overflow: hidden;
    box-shadow: var(--formly-shadow);
    transition: all 0.3s ease;
    border: 1px solid var(--formly-border);
}

.course-card:hover {
    transform: translateY(-5px);
    box-shadow: var(--formly-shadow-lg);
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

.course-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.3s ease;
}

.course-card:hover .course-overlay {
    opacity: 1;
}

.play-btn {
    width: 60px;
    height: 60px;
    background: white;
    border: none;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--formly-primary);
    cursor: pointer;
    transition: transform 0.3s ease;
}

.play-btn:hover {
    transform: scale(1.1);
}

.play-btn svg {
    width: 24px;
    height: 24px;
}

.course-content {
    padding: 1.5rem;
}

.course-category {
    font-size: 0.875rem;
    color: var(--formly-primary);
    font-weight: 600;
    margin-bottom: 0.5rem;
}

.course-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--formly-dark);
    margin-bottom: 0.75rem;
    line-height: 1.4;
}

.course-description {
    color: var(--formly-text);
    line-height: 1.6;
    margin-bottom: 1rem;
}

.course-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
}

.course-rating {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.stars {
    display: flex;
    gap: 2px;
}

.star {
    width: 16px;
    height: 16px;
    color: #e5e7eb;
}

.star.filled {
    color: #fbbf24;
}

.rating-text {
    font-size: 0.875rem;
    color: var(--formly-text);
}

.course-price {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.price-current {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--formly-primary);
}

.price-old {
    font-size: 1rem;
    color: var(--formly-text);
    text-decoration: line-through;
}

.price-free {
    font-size: 1.25rem;
    font-weight: 700;
    color: #10b981;
}

.course-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.course-instructor {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.instructor-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    object-fit: cover;
}

.enroll-btn {
    background: var(--formly-gradient);
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 50px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.enroll-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(0, 122, 255, 0.3);
}

.enroll-btn svg {
    width: 16px;
    height: 16px;
}

.section-footer {
    text-align: center;
}

.btn-outline {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 1rem 2rem;
    border: 2px solid var(--formly-primary);
    color: var(--formly-primary);
    text-decoration: none;
    border-radius: 50px;
    font-weight: 600;
    transition: all 0.3s ease;
}

.btn-outline:hover {
    background: var(--formly-primary);
    color: white;
    transform: translateY(-2px);
}

.btn-outline svg {
    width: 20px;
    height: 20px;
}

/* Categories Section */
.categories-section {
    padding: 6rem 0;
    background: var(--formly-light);
}

.categories-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 2rem;
}

.category-card {
    background: white;
    padding: 2rem;
    border-radius: 20px;
    text-align: center;
    box-shadow: var(--formly-shadow);
    transition: all 0.3s ease;
    border: 1px solid var(--formly-border);
}

.category-card:hover {
    transform: translateY(-5px);
    box-shadow: var(--formly-shadow-lg);
}

.category-icon {
    width: 80px;
    height: 80px;
    margin: 0 auto 1.5rem;
    background: var(--formly-gradient-light);
    border-radius: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.category-icon img {
    width: 40px;
    height: 40px;
    object-fit: contain;
}

.category-name {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--formly-dark);
    margin-bottom: 0.5rem;
}

.category-count {
    color: var(--formly-text);
    margin-bottom: 1.5rem;
}

.category-link {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--formly-primary);
    text-decoration: none;
    font-weight: 600;
    transition: all 0.3s ease;
}

.category-link:hover {
    gap: 0.75rem;
}

.category-link svg {
    width: 16px;
    height: 16px;
}

/* Instructors Section */
.instructors-section {
    padding: 6rem 0;
    background: white;
}

.instructors-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 2rem;
    margin-bottom: 3rem;
}

.instructor-card {
    background: white;
    border-radius: 20px;
    padding: 2rem;
    text-align: center;
    box-shadow: var(--formly-shadow);
    transition: all 0.3s ease;
    border: 1px solid var(--formly-border);
}

.instructor-card:hover {
    transform: translateY(-5px);
    box-shadow: var(--formly-shadow-lg);
}

.instructor-image {
    position: relative;
    width: 120px;
    height: 120px;
    margin: 0 auto 1.5rem;
    border-radius: 50%;
    overflow: hidden;
}

.instructor-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.instructor-status {
    position: absolute;
    bottom: 5px;
    right: 5px;
    background: white;
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-size: 0.75rem;
    display: flex;
    align-items: center;
    gap: 0.25rem;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.status-dot {
    width: 8px;
    height: 8px;
    background: #10b981;
    border-radius: 50%;
}

.instructor-name {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--formly-dark);
    margin-bottom: 0.25rem;
}

.instructor-title {
    color: var(--formly-text);
    margin-bottom: 1rem;
}

.instructor-rating {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
}

.instructor-stats {
    display: flex;
    justify-content: center;
    gap: 2rem;
    margin-bottom: 1.5rem;
}

.stat {
    text-align: center;
}

.stat-number {
    display: block;
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--formly-primary);
}

.stat-label {
    font-size: 0.875rem;
    color: var(--formly-text);
}

.instructor-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    background: var(--formly-gradient);
    color: white;
    text-decoration: none;
    padding: 0.75rem 1.5rem;
    border-radius: 50px;
    font-weight: 600;
    transition: all 0.3s ease;
}

.instructor-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(0, 122, 255, 0.3);
}

.instructor-btn svg {
    width: 16px;
    height: 16px;
}

/* CTA Section */
.cta-section {
    padding: 6rem 0;
    background: var(--formly-gradient);
    color: white;
}

.cta-content {
    text-align: center;
}

.cta-text h2 {
    font-size: clamp(2rem, 4vw, 3rem);
    font-weight: 700;
    margin-bottom: 1rem;
}

.cta-text p {
    font-size: 1.25rem;
    opacity: 0.9;
    margin-bottom: 2rem;
}

.cta-actions {
    display: flex;
    justify-content: center;
    gap: 1rem;
}

/* Animations */
@keyframes slideInLeft {
    from {
        opacity: 0;
        transform: translateX(-50px);
    }
    to {
        opacity: 1;
        transform: translateX(0);
    }
}

@keyframes slideInRight {
    from {
        opacity: 0;
        transform: translateX(50px);
    }
    to {
        opacity: 1;
        transform: translateX(0);
    }
}

/* Responsive Design */
@media (max-width: 768px) {
    .hero-content {
        grid-template-columns: 1fr;
        gap: 2rem;
        text-align: center;
    }
    
    .hero-actions {
        justify-content: center;
        flex-wrap: wrap;
    }
    
    .hero-stats {
        grid-template-columns: 1fr;
        gap: 1rem;
    }
    
    .main-hero-image {
        width: 300px;
        height: 300px;
    }
    
    .floating-card {
        display: none;
    }
    
    .features-grid,
    .courses-grid,
    .categories-grid,
    .instructors-grid {
        grid-template-columns: 1fr;
    }
    
    .cta-actions {
        flex-direction: column;
        align-items: center;
    }
}

@media (max-width: 480px) {
    .hero-title {
        font-size: 2rem;
    }
    
    .section-title {
        font-size: 1.5rem;
    }
    
    .btn-primary,
    .btn-secondary,
    .btn-outline {
        padding: 0.75rem 1.5rem;
        font-size: 0.875rem;
    }
}
</style>
@endpush

@push('script')
<script src="https://unpkg.com/aos@2.3.1/dist/aos.js"></script>
<script>
document.addEventListener('DOMContentLoaded', function() {
    // Initialize AOS (Animate On Scroll)
    AOS.init({
        duration: 1000,
        once: true,
        offset: 100
    });
    
    // Hero section animations
    const heroShapes = document.querySelectorAll('.shape');
    heroShapes.forEach((shape, index) => {
        shape.style.animationDelay = `${index * 0.5}s`;
    });
    
    // Floating cards animation
    const floatingCards = document.querySelectorAll('.floating-card');
    floatingCards.forEach((card, index) => {
        card.style.animationDelay = `${index * 1.5}s`;
    });
    
    // Course card hover effects
    const courseCards = document.querySelectorAll('.course-card');
    courseCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
    
    // Feature card animations
    const featureCards = document.querySelectorAll('.feature-card');
    featureCards.forEach((card, index) => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px)';
            this.style.boxShadow = '0 20px 60px rgba(0, 122, 255, 0.15)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '0 10px 40px rgba(0, 122, 255, 0.1)';
        });
    });
    
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Parallax effect for hero section
    window.addEventListener('scroll', function() {
        const scrolled = window.pageYOffset;
        const heroSection = document.querySelector('.modern-hero');
        if (heroSection) {
            const rate = scrolled * -0.5;
            heroSection.style.transform = `translateY(${rate}px)`;
        }
    });
});
</script>
@endpush