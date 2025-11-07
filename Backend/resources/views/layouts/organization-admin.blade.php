<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ __(@$title) }}</title>

    <!-- Favicon included -->
    <link rel="shortcut icon" href="{{getImageFile(get_option('app_fav_icon'))}}" type="image/x-icon">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <!-- Apple touch icon included -->
    <link rel="apple-touch-icon" href="{{getImageFile(get_option('app_fav_icon'))}}">

    <link rel="stylesheet" href="{{asset('admin/sweetalert2/sweetalert2.css')}}">

    <!-- All CSS files included here -->
    <link rel="stylesheet" href="{{asset('admin/css/all.min.css')}}">
    <link rel="stylesheet" href="{{ asset('frontend/assets/vendor/bootstrap/css/bootstrap.min.css') }}">
    @stack('style')
    <link rel="stylesheet" href="{{asset('admin/css/metisMenu.min.css')}}">
    <link rel="stylesheet" href="{{asset('admin/styles/main.css')}}">
    <link rel="stylesheet" href="{{asset('admin/css/admin-extra.css')}}">
    <link rel="stylesheet" href="{{asset('admin/css/formly-admin-modern.css')}}">
    <link href="{{asset('common/css/select2.css')}}" rel="stylesheet">

    @toastr_css
    <link rel="stylesheet" href="{{asset('admin/css/modern-toast.css')}}">

    @if(!empty(get_option('certificate_regular')) && get_option('certificate_regular') != '' )
    <style>
        .certificateFont {
            @font-face {
                font-family: "certificateFont";
                url: {{ asset(get_option('certificate_font')) }},
            }
        }
    </style>
    @endif

    <!-- Organization Branding Styles -->
    @if($organization_colors ?? false)
    <style>
        :root {
            --primary-color: {{ $organization_colors['primary'] ?? '#007bff' }};
            --secondary-color: {{ $organization_colors['secondary'] ?? '#6c757d' }};
            --accent-color: {{ $organization_colors['accent'] ?? '#28a745' }};
        }
        
        .btn-primary {
            background-color: var(--primary-color) !important;
            border-color: var(--primary-color) !important;
        }
        
        .btn-primary:hover {
            background-color: var(--accent-color) !important;
            border-color: var(--accent-color) !important;
        }
        
        .text-primary {
            color: var(--primary-color) !important;
        }
        
        .bg-primary {
            background-color: var(--primary-color) !important;
        }
        
        .sidebar__brand__text {
            color: var(--primary-color) !important;
        }
        
        .sidebar__menu li.active > a {
            background-color: var(--primary-color) !important;
        }
        
        .sidebar__menu li:hover > a {
            background-color: var(--accent-color) !important;
        }
    </style>
    @endif

    <!-- Force light mode for organization admin -->
    <style>
        /* Override dark mode detection for organization admin */
        @media (prefers-color-scheme: dark) {
            .modern-dashboard {
                background: #f8fafc !important;
                color: #1f2937 !important;
            }
            
            .dashboard-header {
                background: white !important;
                color: #1f2937 !important;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
            }
            
            .welcome-section h1 {
                color: #1f2937 !important;
            }
            
            .welcome-section p {
                color: #6b7280 !important;
            }
            
            .status-item.auto-save {
                background: #f3f4f6 !important;
                color: #374151 !important;
            }
            
            .status-item.draft {
                background: #fef3c7 !important;
                color: #92400e !important;
            }
            
            .progress-text {
                color: #374151 !important;
            }
            
            .organization-card {
                background: white !important;
                color: #1f2937 !important;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
            }
            
            .section-title {
                color: #1f2937 !important;
            }
            
            .action-card {
                background: white !important;
                color: #1f2937 !important;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
            }
            
            .action-card:hover {
                box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05) !important;
            }
            
            .action-content h4 {
                color: #1f2937 !important;
            }
            
            .action-content p {
                color: #6b7280 !important;
            }
            
            /* Management cards - force light mode */
            .management-card {
                background: white !important;
                color: #1f2937 !important;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
            }
            
            .management-card:hover {
                box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05) !important;
            }
            
            .card-header h4 {
                color: #1f2937 !important;
            }
            
            .card-content p {
                color: #6b7280 !important;
            }
            
            .card-icon {
                background: #f3f4f6 !important;
                color: #3b82f6 !important;
            }
        }
    </style>

</head>
<body class=" {{selectedLanguage()->rtl == 1 ? 'direction-rtl' : 'direction-ltr' }} ">

@validUserT
@if(get_option('allow_preloader') == 1)
    <!-- Pre Loader Area start -->
    <div id="preloader">
        <div id="preloader_status"><img src="{{getImageFile(get_option('app_preloader'))}}" alt="img" /></div>
    </div>
    <!-- Pre Loader Area End -->
@endif

<!-- Sidebar area start -->
@include('organization.common.sidebar')
<!-- Sidebar area end -->

<!-- Main Content area start -->
<div class="main-content">

    <!-- Header section start -->
    @include('organization.common.header')
    <!-- Header section end -->

    <!-- page content wrap start -->
    <div class="page-content-wrap">
        <!-- Page content area start -->
        @yield('content')
        <!-- Page content area end -->

        <!-- Footer section start -->
        @include('organization.common.footer')
        <!-- Footer section end -->
    </div>
    <!-- page content wrap end -->

</div>
<!-- Main Content area end -->

<script>
    var deleteTitle = '{{ __("Sure! You want to delete?") }}';
    var deleteText = '{{ __("You wont be able to revert this!") }}';
    var deleteConfirmButton = '{{ __("Yes, Delete It!") }}';
    var deleteSuccessText = '{{ __("Item has been deleted") }}';
    function getLanguage(){
        return {
            "sEmptyTable": "{{ __('No data available in table') }}",
            "sInfo": "{{__('Showing _START_ To _END_ Of _TOTAL_ Entries')}}",
            "sInfoEmpty": "{{__('Showing 0 to 0 of 0 entries')}}",
            "sInfoFiltered": "{{__('(filtered from _MAX_ total entries)')}}",
            "sInfoPostFix": "",
            "sInfoThousands": ",",
            "sLengthMenu": "{{__('Show _MENU_ entries')}}",
            "sLoadingRecords": "{{__('Loading...')}}",
            "sProcessing": "{{__('Processing...')}}",
            "sSearch": "{{__('Search:')}}",
            "sZeroRecords": "{{__('No matching records found')}}",
            "oPaginate": {
                "sFirst": "{{__('First')}}",
                "sLast": "{{__('Last')}}",
                "sNext": "{{__('Next')}}",
                "sPrevious": "{{__('Previous')}}"
            },
            "oAria": {
                "sSortAscending": "{{__(': activate to sort column ascending')}}",
                "sSortDescending": "{{__(': activate to sort column descending')}}"
            }
        };
    }
</script>

<!-- All JS files included here -->
<script src="{{asset('admin/js/jquery.min.js')}}"></script>
<script src="{{asset('admin/js/bootstrap.bundle.min.js')}}"></script>
<script src="{{asset('admin/js/metisMenu.min.js')}}"></script>
<script src="{{asset('admin/js/jquery.slimscroll.min.js')}}"></script>
<script src="{{asset('admin/js/jquery.slimscroll.min.js')}}"></script>
<script src="{{asset('admin/js/jquery.dataTables.min.js')}}"></script>
<script src="{{asset('admin/js/dataTables.bootstrap4.min.js')}}"></script>
<script src="{{asset('admin/js/dataTables.responsive.min.js')}}"></script>
<script src="{{asset('admin/js/responsive.bootstrap4.min.js')}}"></script>
<script src="{{asset('admin/js/dataTables.buttons.min.js')}}"></script>
<script src="{{asset('admin/js/buttons.bootstrap4.min.js')}}"></script>
<script src="{{asset('admin/js/buttons.html5.min.js')}}"></script>
<script src="{{asset('admin/js/buttons.flash.min.js')}}"></script>
<script src="{{asset('admin/js/buttons.print.min.js')}}"></script>
<script src="{{asset('admin/js/jszip.min.js')}}"></script>
<script src="{{asset('admin/js/pdfmake.min.js')}}"></script>
<script src="{{asset('admin/js/vfs_fonts.js')}}"></script>
<script src="{{asset('admin/js/sweetalert2.min.js')}}"></script>
<script src="{{asset('admin/js/admin.js')}}"></script>
<script src="{{asset('admin/js/admin-extra.js')}}"></script>
<script src="{{asset('admin/js/formly-admin-modern.js')}}"></script>
<script src="{{asset('common/js/select2.min.js')}}"></script>

@toastr_js
<script src="{{asset('admin/js/modern-toast.js')}}"></script>
@toastr_render

@stack('script')

</body>
</html>
