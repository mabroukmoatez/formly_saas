@extends('layouts.organization')

@section('title', 'Actualités')

@push('style')
<style>
    .news-card {
        transition: transform 0.3s ease, box-shadow 0.3s ease;
        border: none;
        border-radius: 12px;
        overflow: hidden;
    }
    
    .news-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 10px 25px rgba(0,0,0,0.1);
    }
    
    .news-image {
        height: 200px;
        object-fit: cover;
        width: 100%;
    }
    
    .news-category {
        background: linear-gradient(45deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 500;
    }
    
    .news-featured {
        position: absolute;
        top: 10px;
        right: 10px;
        background: #ff6b6b;
        color: white;
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 10px;
        font-weight: 600;
    }
    
    .news-stats {
        color: #6c757d;
        font-size: 14px;
    }
    
    .news-stats i {
        margin-right: 5px;
    }
    
    .search-box {
        background: white;
        border-radius: 25px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        padding: 10px 20px;
        border: none;
    }
    
    .filter-btn {
        background: white;
        border: 1px solid #e9ecef;
        border-radius: 20px;
        padding: 8px 16px;
        margin: 0 5px;
        transition: all 0.3s ease;
    }
    
    .filter-btn:hover, .filter-btn.active {
        background: #667eea;
        color: white;
        border-color: #667eea;
    }
    
    .stats-card {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border-radius: 15px;
        padding: 20px;
        text-align: center;
    }
    
    .stats-number {
        font-size: 2rem;
        font-weight: bold;
        margin-bottom: 5px;
    }
    
    .stats-label {
        font-size: 14px;
        opacity: 0.9;
    }
</style>
@endpush

@section('content')
<div class="container-fluid">
    <!-- Header Section -->
    <div class="row mb-4">
        <div class="col-12">
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <h2 class="mb-1">📰 Actualités</h2>
                    <p class="text-muted mb-0">Découvrez les dernières nouvelles et informations</p>
                </div>
                <div class="d-flex align-items-center">
                    <div class="stats-card me-3">
                        <div class="stats-number">{{ $stats['total_news'] }}</div>
                        <div class="stats-label">Actualités</div>
                    </div>
                    <div class="stats-card">
                        <div class="stats-number">{{ $stats['featured_news'] }}</div>
                        <div class="stats-label">À la une</div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Search and Filters -->
    <div class="row mb-4">
        <div class="col-12">
            <div class="card">
                <div class="card-body">
                    <form method="GET" class="row align-items-end">
                        <div class="col-md-4">
                            <label class="form-label">Rechercher</label>
                            <input type="text" name="search" class="form-control search-box" 
                                   placeholder="Rechercher dans les actualités..." 
                                   value="{{ request('search') }}">
                        </div>
                        <div class="col-md-3">
                            <label class="form-label">Catégorie</label>
                            <select name="category" class="form-select">
                                <option value="">Toutes les catégories</option>
                                @foreach($categories as $category)
                                    <option value="{{ $category }}" {{ request('category') == $category ? 'selected' : '' }}>
                                        {{ $category }}
                                    </option>
                                @endforeach
                            </select>
                        </div>
                        <div class="col-md-2">
                            <label class="form-label">Tri</label>
                            <select name="sort" class="form-select">
                                <option value="published_at" {{ request('sort') == 'published_at' ? 'selected' : '' }}>Date de publication</option>
                                <option value="views_count" {{ request('sort') == 'views_count' ? 'selected' : '' }}>Plus vues</option>
                                <option value="likes_count" {{ request('sort') == 'likes_count' ? 'selected' : '' }}>Plus aimées</option>
                                <option value="title" {{ request('sort') == 'title' ? 'selected' : '' }}>Titre</option>
                            </select>
                        </div>
                        <div class="col-md-2">
                            <label class="form-label">Ordre</label>
                            <select name="order" class="form-select">
                                <option value="desc" {{ request('order') == 'desc' ? 'selected' : '' }}>Décroissant</option>
                                <option value="asc" {{ request('order') == 'asc' ? 'selected' : '' }}>Croissant</option>
                            </select>
                        </div>
                        <div class="col-md-1">
                            <button type="submit" class="btn btn-primary w-100">
                                <i class="fas fa-search"></i>
                            </button>
                        </div>
                    </form>
                    
                    <!-- Quick Filters -->
                    <div class="mt-3">
                        <a href="{{ route('news.index') }}" class="filter-btn {{ !request()->hasAny(['featured', 'category', 'search']) ? 'active' : '' }}">
                            Toutes
                        </a>
                        <a href="{{ route('news.index', ['featured' => 1]) }}" class="filter-btn {{ request('featured') ? 'active' : '' }}">
                            À la une
                        </a>
                        @foreach($categories->take(5) as $category)
                            <a href="{{ route('news.index', ['category' => $category]) }}" class="filter-btn {{ request('category') == $category ? 'active' : '' }}">
                                {{ $category }}
                            </a>
                        @endforeach
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- News Grid -->
    <div class="row">
        @forelse($news as $article)
            <div class="col-lg-4 col-md-6 mb-4">
                <div class="card news-card h-100 position-relative">
                    @if($article->featured)
                        <div class="news-featured">⭐ À la une</div>
                    @endif
                    
                    @if($article->image_url)
                        <img src="{{ $article->image_url }}" class="news-image" alt="{{ $article->title }}">
                    @else
                        <div class="news-image d-flex align-items-center justify-content-center bg-light">
                            <i class="fas fa-newspaper fa-3x text-muted"></i>
                        </div>
                    @endif
                    
                    <div class="card-body d-flex flex-column">
                        <div class="mb-2">
                            <span class="news-category">{{ $article->category }}</span>
                        </div>
                        
                        <h5 class="card-title">
                            <a href="{{ route('news.show', $article->uuid) }}" class="text-decoration-none text-dark">
                                {{ Str::limit($article->title, 60) }}
                            </a>
                        </h5>
                        
                        <p class="card-text text-muted flex-grow-1">
                            {{ Str::limit(strip_tags($article->short_description), 120) }}
                        </p>
                        
                        <div class="mt-auto">
                            <div class="d-flex justify-content-between align-items-center mb-3">
                                <div class="news-stats">
                                    <i class="fas fa-eye"></i>{{ $article->views_count }}
                                    <i class="fas fa-heart ms-3"></i>{{ $article->likes_count }}
                                </div>
                                <small class="text-muted">
                                    {{ $article->published_at->diffForHumans() }}
                                </small>
                            </div>
                            
                            <div class="d-flex justify-content-between align-items-center">
                                <div class="d-flex align-items-center">
                                    @if($article->author->avatar)
                                        <img src="{{ Storage::url($article->author->avatar) }}" 
                                             class="rounded-circle me-2" width="30" height="30" alt="Avatar">
                                    @else
                                        <div class="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-2" 
                                             style="width: 30px; height: 30px;">
                                            {{ substr($article->author->name, 0, 1) }}
                                        </div>
                                    @endif
                                    <small class="text-muted">{{ $article->author->name }}</small>
                                </div>
                                
                                <a href="{{ route('news.show', $article->uuid) }}" class="btn btn-outline-primary btn-sm">
                                    Lire la suite
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        @empty
            <div class="col-12">
                <div class="text-center py-5">
                    <i class="fas fa-newspaper fa-4x text-muted mb-3"></i>
                    <h4 class="text-muted">Aucune actualité trouvée</h4>
                    <p class="text-muted">Il n'y a pas d'actualités correspondant à vos critères de recherche.</p>
                    @if(request()->hasAny(['search', 'category', 'featured']))
                        <a href="{{ route('news.index') }}" class="btn btn-primary">
                            Voir toutes les actualités
                        </a>
                    @endif
                </div>
            </div>
        @endforelse
    </div>

    <!-- Pagination -->
    @if($news->hasPages())
        <div class="row mt-4">
            <div class="col-12">
                <div class="d-flex justify-content-center">
                    {{ $news->appends(request()->query())->links() }}
                </div>
            </div>
        </div>
    @endif
</div>
@endsection

@push('script')
<script>
    // Auto-submit form on category change
    document.querySelector('select[name="category"]').addEventListener('change', function() {
        this.form.submit();
    });
    
    // Auto-submit form on sort change
    document.querySelector('select[name="sort"]').addEventListener('change', function() {
        this.form.submit();
    });
</script>
@endpush
