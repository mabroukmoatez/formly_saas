@extends('layouts.admin')

@section('content')
    <!-- Page content area start -->
    <div class="page-content">
        <div class="container-fluid">
            <!-- Header Controls -->
            <div class="row mb-4">
                <div class="col-md-12">
                    <form method="GET" action="{{route('admin.course.index')}}" id="filterForm">
                        <div class="d-flex justify-content-between align-items-center">
                            <div class="d-flex align-items-center">
                                <!-- Search Bar -->
                                <div class="position-relative me-3" style="width: 400px;">
                                    <i class="fas fa-search position-absolute search-icon" style="left: 15px; top: 50%; transform: translateY(-50%); color: #0F172A;"></i>
                                    <input type="text" name="search" value="{{request('search')}}" class="form-control ps-5 search-input" placeholder="{{__('Search for a Course')}}" style="background-color: #E3F2FD; color: #0F172A; border: none; border-radius: 8px; padding: 12px 15px 12px 45px;">
                                </div>
                            </div>
                            
                            <div class="d-flex align-items-center">
                                <!-- Filter Dropdowns -->
                                <div class="dropdown me-3">
                                    <button class="btn dropdown-toggle filter-btn" type="button" data-bs-toggle="dropdown" style="background-color: #E3F2FD; color: #0F172A; border: none; border-radius: 8px; padding: 8px 16px;">
                                        {{request('price') ? ucfirst(str_replace('-', '€ - ', request('price'))) . '€' : __('Price')}}
                                    </button>
                                    <ul class="dropdown-menu">
                                        <li><a class="dropdown-item" href="{{request()->fullUrlWithQuery(['price' => null])}}">{{__('All prices')}}</a></li>
                                        <li><a class="dropdown-item" href="{{request()->fullUrlWithQuery(['price' => '0-50'])}}">0€ - 50€</a></li>
                                        <li><a class="dropdown-item" href="{{request()->fullUrlWithQuery(['price' => '50-100'])}}">50€ - 100€</a></li>
                                        <li><a class="dropdown-item" href="{{request()->fullUrlWithQuery(['price' => '100-200'])}}">100€ - 200€</a></li>
                                        <li><a class="dropdown-item" href="{{request()->fullUrlWithQuery(['price' => '200+'])}}">200€+</a></li>
                                    </ul>
                                </div>
                                <div class="dropdown me-3">
                                    <button class="btn dropdown-toggle filter-btn" type="button" data-bs-toggle="dropdown" style="background-color: #E3F2FD; color: #0F172A; border: none; border-radius: 8px; padding: 8px 16px;">
                                        @if(request('category'))
                                            @php
                                                $selectedCategory = $categories->where('id', request('category'))->first();
                                            @endphp
                                            {{$selectedCategory ? $selectedCategory->name : __('Category')}}
                                        @else
                                            {{__('Category')}}
                                        @endif
                                    </button>
                                    <ul class="dropdown-menu">
                                        <li><a class="dropdown-item" href="{{request()->fullUrlWithQuery(['category' => null])}}">{{__('All categories')}}</a></li>
                                        @foreach($categories as $category)
                                            <li><a class="dropdown-item" href="{{request()->fullUrlWithQuery(['category' => $category->id])}}">{{$category->name}}</a></li>
                                        @endforeach
                                    </ul>
                                </div>
                                <div class="dropdown me-3">
                                    <button class="btn dropdown-toggle filter-btn" type="button" data-bs-toggle="dropdown" style="background-color: #E3F2FD; color: #0F172A; border: none; border-radius: 8px; padding: 8px 16px;">
                                        @if(request('instructor'))
                                            @php
                                                $selectedInstructor = $instructors->where('id', request('instructor'))->first();
                                            @endphp
                                            {{$selectedInstructor ? $selectedInstructor->first_name . ' ' . $selectedInstructor->last_name : __('Instructor')}}
                                        @else
                                            {{__('Instructor')}}
                                        @endif
                                    </button>
                                    <ul class="dropdown-menu">
                                        <li><a class="dropdown-item" href="{{request()->fullUrlWithQuery(['instructor' => null])}}">{{__('All instructors')}}</a></li>
                                        @foreach($instructors as $instructor)
                                            <li><a class="dropdown-item" href="{{request()->fullUrlWithQuery(['instructor' => $instructor->id])}}">{{$instructor->first_name}} {{$instructor->last_name}}</a></li>
                                        @endforeach
                                    </ul>
                                </div>
                                
                                <!-- Layout Toggle -->
                                <div class="btn-group" role="group">
                                    <button type="button" class="btn active layout-btn" id="gridView" style="background-color: #0F172A; color: #ffffff; border: none; border-radius: 8px 0 0 8px; padding: 8px 16px;">
                                        <i class="fas fa-th"></i>
                                    </button>
                                    <button type="button" class="btn layout-btn" id="listView" style="background-color: #E3F2FD; color: #0F172A; border: none; border-radius: 0 8px 8px 0; padding: 8px 16px;">
                                        <i class="fas fa-th-list"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Course Cards Grid -->
            <div class="row" id="coursesContainer">
                @if($courses->count() > 0)
                    @foreach($courses as $course)
                    <div class="col-lg-6 col-md-6 col-sm-12 mb-4 course-item">
                        <div class="card course-card" style="border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); border: none; overflow: hidden;">
                            <!-- Course Image -->
                            <div class="course-image" style="height: 200px; overflow: hidden; position: relative;">
                                <img src="{{getImageFile($course->image_path)}}" alt="{{$course->title}}" 
                                     style="width: 100%; height: 100%; object-fit: cover;">
                            </div>
                            
                            <!-- Course Content -->
                            <div class="card-body" style="padding: 20px;">
                                <!-- Course Title -->
                                <h5 class="card-title mb-3" style="font-size: 16px; font-weight: 600; color: #2c3e50; line-height: 1.4;">
                                    {{$course->title}}
                                </h5>
                                
                                <!-- Course Details -->
                                <div class="course-details mb-3">
                                    <!-- Category/Tools -->
                                    <div class="mb-2">
                                        <span class="badge" style="background-color: #e3f2fd; color: #1976d2; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
                                            {{$course->category ? $course->category->name : 'AI Tools'}} +5
                                        </span>
                                    </div>
                                    
                                    <!-- Instructor -->
                                    <div class="d-flex align-items-center mb-2">
                                        <i class="fas fa-user me-2" style="color: #6c757d; font-size: 14px;"></i>
                                        <span style="color: #6c757d; font-size: 14px;">
                                            {{$course->instructor ? $course->instructor->first_name . ' ' . $course->instructor->last_name : __('Instructor Name')}}
                                        </span>
                                    </div>
                                    
                                    <!-- Duration -->
                                    <div class="d-flex align-items-center mb-2">
                                        <i class="fas fa-clock me-2" style="color: #6c757d; font-size: 14px;"></i>
                                        <span style="color: #6c757d; font-size: 14px;">
                                            @if($course->lectures && $course->lectures->count() > 0)
                                                @php
                                                    $totalSeconds = 0;
                                                    foreach($course->lectures as $lecture) {
                                                        if($lecture->file_duration_second) {
                                                            $totalSeconds += $lecture->file_duration_second;
                                                        }
                                                    }
                                                    $hours = floor($totalSeconds / 3600);
                                                    $minutes = floor(($totalSeconds % 3600) / 60);
                                                @endphp
                                                @if($hours > 0)
                                                    {{$hours}} {{__('Hours')}}
                                                @else
                                                    {{$minutes}} {{__('Minutes')}}
                                                @endif
                                            @else
                                                32 {{__('Hours')}}
                                            @endif
                                        </span>
                                    </div>
                                    
                                    <!-- Price -->
                                    <div class="course-price">
                                        <span style="font-size: 18px; font-weight: 600; color: #2c3e50;">
                                            @if(get_currency_placement() == 'after')
                                                {{$course->price}} {{ get_currency_symbol() }}
                                            @else
                                                {{ get_currency_symbol() }}{{$course->price}}
                                            @endif
                                        </span>
                                    </div>
                                </div>
                                
                                <!-- Status and Actions -->
                                <div class="d-flex justify-content-between align-items-center">
                                    <!-- Status Badge -->
                                    <div class="status-badge position-relative">
                                        @if($course->status == 1)
                                            <span class="badge" style="background-color: #d4edda; color: #155724; padding: 6px 12px; border-radius: 20px; font-size: 12px; cursor: pointer;">
                                                <span class="status-dot" style="width: 8px; height: 8px; background-color: #28a745; border-radius: 50%; display: inline-block; margin-right: 6px;"></span>
                                                {{__('Published')}}
                                            </span>
                                            <!-- Hover Actions -->
                                            <div class="hover-actions">
                                                <a href="{{route('admin.course.view', [$course->uuid])}}" class="btn btn-primary">{{__('View')}}</a>
                                                <button class="btn btn-danger deleteItem" data-formid="delete_row_form_{{$course->uuid}}">{{__('Delete')}}</button>
                                            </div>
                                        @elseif($course->status == 2)
                                            <span class="badge" style="background-color: #fff3cd; color: #856404; padding: 6px 12px; border-radius: 20px; font-size: 12px; cursor: pointer;">
                                                <span class="status-dot" style="width: 8px; height: 8px; background-color: #ffc107; border-radius: 50%; display: inline-block; margin-right: 6px;"></span>
                                                {{__('Pending')}}
                                            </span>
                                            <!-- Hover Actions -->
                                            <div class="hover-actions">
                                                <a href="{{route('admin.course.view', [$course->uuid])}}" class="btn btn-primary">{{__('View')}}</a>
                                                <button class="btn btn-danger deleteItem" data-formid="delete_row_form_{{$course->uuid}}">{{__('Delete')}}</button>
                                            </div>
                                        @elseif($course->status == 3)
                                            <span class="badge" style="background-color: #f8d7da; color: #721c24; padding: 6px 12px; border-radius: 20px; font-size: 12px; cursor: pointer;">
                                                <span class="status-dot" style="width: 8px; height: 8px; background-color: #dc3545; border-radius: 50%; display: inline-block; margin-right: 6px;"></span>
                                                {{__('Pending')}}
                                            </span>
                                            <!-- Hover Actions -->
                                            <div class="hover-actions">
                                                <a href="{{route('admin.course.view', [$course->uuid])}}" class="btn btn-primary">{{__('View')}}</a>
                                                <button class="btn btn-danger deleteItem" data-formid="delete_row_form_{{$course->uuid}}">{{__('Delete')}}</button>
                                            </div>
                                        @elseif($course->status == 4)
                                            <span class="badge" style="background-color: #fff3cd; color: #856404; padding: 6px 12px; border-radius: 20px; font-size: 12px; cursor: pointer;">
                                                <span class="status-dot" style="width: 8px; height: 8px; background-color: #ffc107; border-radius: 50%; display: inline-block; margin-right: 6px;"></span>
                                                {{__('Draft')}}
                                            </span>
                                            <!-- Hover Actions -->
                                            <div class="hover-actions">
                                                <a href="{{route('admin.course.view', [$course->uuid])}}" class="btn btn-primary">{{__('View')}}</a>
                                                <button class="btn btn-danger deleteItem" data-formid="delete_row_form_{{$course->uuid}}">{{__('Delete')}}</button>
                                            </div>
                                        @elseif($course->status == 6)
                                            <span class="badge" style="background-color: #d1ecf1; color: #0c5460; padding: 6px 12px; border-radius: 20px; font-size: 12px; cursor: pointer;">
                                                <span class="status-dot" style="width: 8px; height: 8px; background-color: #17a2b8; border-radius: 50%; display: inline-block; margin-right: 6px;"></span>
                                                {{__('Upcoming')}}
                                            </span>
                                            <!-- Hover Actions -->
                                            <div class="hover-actions">
                                                <a href="{{route('admin.course.view', [$course->uuid])}}" class="btn btn-primary">{{__('View')}}</a>
                                                <button class="btn btn-danger deleteItem" data-formid="delete_row_form_{{$course->uuid}}">{{__('Delete')}}</button>
                                            </div>
                                        @elseif($course->status == 7)
                                            <span class="badge" style="background-color: #d1ecf1; color: #0c5460; padding: 6px 12px; border-radius: 20px; font-size: 12px; cursor: pointer;">
                                                <span class="status-dot" style="width: 8px; height: 8px; background-color: #17a2b8; border-radius: 50%; display: inline-block; margin-right: 6px;"></span>
                                                {{__('Upcoming')}}
                                            </span>
                                            <!-- Hover Actions -->
                                            <div class="hover-actions">
                                                <a href="{{route('admin.course.view', [$course->uuid])}}" class="btn btn-primary">{{__('View')}}</a>
                                                <button class="btn btn-danger deleteItem" data-formid="delete_row_form_{{$course->uuid}}">{{__('Delete')}}</button>
                                            </div>
                                        @else
                                            <span class="badge" style="background-color: #e2e3e5; color: #383d41; padding: 6px 12px; border-radius: 20px; font-size: 12px; cursor: pointer;">
                                                <span class="status-dot" style="width: 8px; height: 8px; background-color: #6c757d; border-radius: 50%; display: inline-block; margin-right: 6px;"></span>
                                                {{__('Pending')}}
                                            </span>
                                            <!-- Hover Actions -->
                                            <div class="hover-actions">
                                                <a href="{{route('admin.course.view', [$course->uuid])}}" class="btn btn-primary">{{__('View')}}</a>
                                                <button class="btn btn-danger deleteItem" data-formid="delete_row_form_{{$course->uuid}}">{{__('Delete')}}</button>
                                            </div>
                                        @endif
                                    </div>
                                    
                                    <!-- Action Buttons -->
                                    <div class="action-buttons d-flex align-items-center">
                                        <a href="{{route('admin.course.view', [$course->uuid])}}" class="btn btn-link p-2" title="View Course" style="color: #6c757d;">
                                            <i class="fas fa-eye"></i>
                                        </a>
                                        <div class="dropdown">
                                            <button class="btn btn-link p-2 dropdown-toggle" type="button" data-bs-toggle="dropdown" style="color: #6c757d; border: none;">
                                                <i class="fas fa-ellipsis-v"></i>
                                            </button>
                                            <ul class="dropdown-menu dropdown-menu-end">
                                                <li>
                                                    <a class="dropdown-item" href="{{route('admin.course.view', [$course->uuid])}}">
                                                        <i class="fas fa-eye me-2"></i>{{__('View Details')}}
                                                    </a>
                                                </li>
                                                @if($course->status == 1)
                                                <li>
                                                    <a class="dropdown-item" href="{{route('admin.course.status-change', [$course->uuid, 3])}}">
                                                        <i class="fas fa-pause me-2"></i>{{__('Put on Hold')}}
                                                    </a>
                                                </li>
                                                @elseif($course->status == 3)
                                                <li>
                                                    <a class="dropdown-item" href="{{route('admin.course.status-change', [$course->uuid, 1])}}">
                                                        <i class="fas fa-check me-2"></i>{{__('Approve')}}
                                                    </a>
                                                </li>
                                                @endif
                                                <li><hr class="dropdown-divider"></li>
                                                <li>
                                                    <button class="dropdown-item text-danger deleteItem" data-formid="delete_row_form_{{$course->uuid}}">
                                                        <i class="fas fa-trash me-2"></i>{{__('Delete')}}
                                                    </button>
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    @endforeach
                @else
                    <!-- No Results Found -->
                    <div class="col-12">
                        @include('admin.components.not-found', [
                            'type' => 'courses',
                            'showClearFilters' => request()->hasAny(['search', 'price', 'category', 'instructor']),
                            'size' => 'large'
                        ])
                    </div>
                @endif
            </div>

            <!-- Pagination -->
            <div class="row">
                <div class="col-md-12">
                    <div class="d-flex justify-content-center">
                        {{$courses->links()}}
                    </div>
                </div>
            </div>
        </div>
    </div>
    <!-- Page content area end -->

    <!-- Hidden Forms for Actions -->
    @foreach($courses as $course)
    <form action="{{route('admin.course.delete', [$course->uuid])}}" method="get" id="delete_row_form_{{ $course->uuid }}" style="display: none;">
    </form>
    @endforeach
@endsection

@push('style')
    <style>
        .course-card {
            transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
        }
        
        .course-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 16px rgba(0,0,0,0.15) !important;
        }
        
        .status-badge:hover {
            position: relative;
        }
        
        .status-badge:hover::after {
            content: '';
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            z-index: 10;
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            padding: 8px 0;
            margin-top: 4px;
        }
        
        .hover-actions {
            display: none;
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            z-index: 10;
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            padding: 8px 0;
            margin-top: 4px;
        }
        
        .status-badge:hover .hover-actions {
            display: block;
        }
        
        .hover-actions .btn {
            width: 100%;
            border-radius: 0;
            border: none;
            padding: 8px 16px;
            font-size: 14px;
            text-align: left;
        }
        
        .hover-actions .btn:hover {
            background-color: #f8f9fa;
        }
        
        .hover-actions .btn.btn-primary {
            background-color: #e3f2fd;
            color: #1976d2;
        }
        
        .hover-actions .btn.btn-danger {
            background-color: #ffebee;
            color: #c62828;
        }
        
        .alert-success {
            border-left: 4px solid #28a745;
        }
        
        .btn-outline-primary.active {
            background-color: #007bff;
            color: white;
        }
        
        .dropdown-menu {
            border-radius: 8px;
            border: 1px solid #e9ecef;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        
        .dropdown-item {
            padding: 8px 16px;
            font-size: 14px;
        }
        
        .dropdown-item:hover {
            background-color: #f8f9fa;
        }
        
        .dropdown-item.text-danger:hover {
            background-color: #ffebee;
            color: #c62828 !important;
        }

        /* Dark Mode Styles */
        .dark-mode .search-input {
            background-color: #374151 !important;
            color: #f9fafb !important;
        }

        .dark-mode .search-icon {
            color: #f9fafb !important;
        }

        .dark-mode .filter-btn {
            background-color: #374151 !important;
            color: #f9fafb !important;
        }

        .dark-mode .layout-btn {
            background-color: #374151 !important;
            color: #f9fafb !important;
        }

        .dark-mode .layout-btn.active {
            background-color: #1f2937 !important;
            color: #ffffff !important;
        }

        .dark-mode .dropdown-menu {
            background-color: #374151 !important;
            border: 1px solid #4b5563 !important;
        }

        .dark-mode .dropdown-item {
            color: #f9fafb !important;
        }

        .dark-mode .dropdown-item:hover {
            background-color: #4b5563 !important;
            color: #ffffff !important;
        }

        .dark-mode .hover-actions {
            background-color: #374151 !important;
            border-color: #4b5563 !important;
        }

        .dark-mode .course-card {
            background-color: #374151 !important;
            border-color: #4b5563 !important;
        }

        .dark-mode .card-title {
            color: #f9fafb !important;
        }

        .dark-mode .card-body {
            color: #d1d5db !important;
        }
    </style>
@endpush

@push('script')
    <script>
        $(document).ready(function() {
            // Delete functionality
            $('.deleteItem').on('click', function() {
                var formId = $(this).data('formid');
                
                Swal.fire({
                    title: "Êtes-vous sûr?",
                    text: "Cette action ne peut pas être annulée!",
                    icon: "warning",
                    showCancelButton: true,
                    confirmButtonColor: "#d33",
                    cancelButtonColor: "#3085d6",
                    confirmButtonText: "Oui, supprimer!",
                    cancelButtonText: "Annuler"
                }).then((result) => {
                    if (result.isConfirmed) {
                        $('#' + formId).submit();
                    }
                });
            });
            
            // Layout toggle functionality
            $('#gridView, #listView').on('click', function() {
                // Remove active state from both buttons
                $('#gridView, #listView').removeClass('active');
                
                // Check if dark mode is active
                const isDarkMode = $('body').hasClass('dark-mode');
                
                if (isDarkMode) {
                    $('#gridView').css({
                        'background-color': '#374151',
                        'color': '#f9fafb',
                        'border': 'none'
                    });
                    $('#listView').css({
                        'background-color': '#374151',
                        'color': '#f9fafb',
                        'border': 'none'
                    });
                } else {
                    $('#gridView').css({
                        'background-color': '#E3F2FD',
                        'color': '#0F172A',
                        'border': 'none'
                    });
                    $('#listView').css({
                        'background-color': '#E3F2FD',
                        'color': '#0F172A',
                        'border': 'none'
                    });
                }
                
                // Add active state to clicked button
                $(this).addClass('active');
                if (isDarkMode) {
                    $(this).css({
                        'background-color': '#1f2937',
                        'color': '#ffffff',
                        'border': 'none'
                    });
                } else {
                    $(this).css({
                        'background-color': '#0F172A',
                        'color': '#ffffff',
                        'border': 'none'
                    });
                }
                
                if ($(this).attr('id') === 'listView') {
                    // Switch to list view
                    $('.course-item').removeClass('col-lg-6 col-md-6 col-sm-12').addClass('col-12');
                    $('.course-card').css('display', 'flex').css('flex-direction', 'row');
                    $('.course-image').css('width', '200px').css('height', '150px').css('flex-shrink', '0');
                    $('.card-body').css('flex', '1');
                } else {
                    // Switch to grid view
                    $('.course-item').removeClass('col-12').addClass('col-lg-6 col-md-6 col-sm-12');
                    $('.course-card').css('display', 'block').css('flex-direction', '');
                    $('.course-image').css('width', '100%').css('height', '200px').css('flex-shrink', '');
                    $('.card-body').css('flex', '');
                }
            });
            
            // Auto-submit form on search input change (with debounce)
            let searchTimeout;
            $('input[name="search"]').on('keyup', function() {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(function() {
                    $('#filterForm').submit();
                }, 500); // Wait 500ms after user stops typing
            });
        });
    </script>
@endpush
