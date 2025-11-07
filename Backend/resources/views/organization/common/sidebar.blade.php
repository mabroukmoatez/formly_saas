<div class="sidebar__area">
    <div class="sidebar__close">
        <button class="close-btn">
            <i class="fa fa-close"></i>
        </button>
    </div>

    <!-- Sidebar Brand with Organization Logo -->
    <div class="sidebar__brand">
        <a href="{{ route('organization.dashboard') }}">
            <div class="sidebar__brand__content">
                @if($current_organization ?? false)
                    @if($current_organization->organization_logo)
                        @php
                            $logoPath = $current_organization->organization_logo;
                            if (substr($logoPath, 0, 8) !== 'uploads/') {
                                $logoPath = 'uploads/' . ltrim($logoPath, '/');
                            }
                            $logoUrl = url($logoPath);
                        @endphp
                        <img src="{{ $logoUrl }}" alt="{{ $current_organization->organization_name }}" style="width: 32px; height: 32px; object-fit: cover; border-radius: 6px;">
                    @else
                        <div class="sidebar__brand__logo-placeholder">
                            <span style="font-size: 14px; color: white; font-weight: 600;">{{ substr($current_organization->organization_name, 0, 2) }}</span>
                        </div>
                    @endif
                @elseif(get_option('app_logo') != '')
                    <img src="{{getImageFile(get_option('app_logo'))}}" alt="">
                @else
                    <div class="sidebar__brand__logo-placeholder"></div>
                @endif
                <span class="sidebar__brand__text">
                    @if($current_organization ?? false)
                        {{ $current_organization->organization_name }}
                    @else
                        {{ get_option('app_name', 'Formly') }}
                    @endif
                </span>
            </div>
        </a>
    </div>

    <!-- Sidebar Toggler Button -->
    <div class="sidebar__toggler__wrapper">
        <button class="sidebar-toggler">
            <img src="{{asset('frontend/assets/img/collapse.png')}}" alt="Toggle Sidebar">
        </button>
    </div>

    <ul id="sidebar-menu" class="sidebar__menu compact-sidebar">

        <!-- 🏠 Dashboard -->
        <li class=" {{ active_if_full_match('organization/dashboard') }} ">
            <a href="{{route('organization.dashboard')}}">
                <span class="iconify" data-icon="mdi:view-grid"></span>
                <span>{{__('Dashboard')}}</span>
            </a>
        </li>

        <!-- 1️⃣ 📊 Gestion Commerciale -->
        <li>
            <a class="has-arrow" href="#">
                <span class="iconify" data-icon="mdi:view-grid-outline"></span>
                <span>{{ __('Commercial Management') }}</span>
            </a>
            <ul>
                <li>
                    <a class="has-arrow" href="#">
                        <span class="iconify" data-icon="mdi:view-grid-outline"></span>
                        <span>{{ __('Companies') }}</span>
                    </a>
                    <ul>
                        <li class="{{ active_if_match('organization/companies') }}">
                            <a href="#">
                                <span class="iconify" data-icon="mdi:view-grid-outline"></span>
                                <span>{{ __('All Companies') }}</span>
                            </a>
                        </li>
                    </ul>
                </li>
                <li>
                    <a class="has-arrow" href="#">
                        <span class="iconify" data-icon="mdi:view-grid-outline"></span>
                        <span>{{ __('Financial') }}</span>
                    </a>
                    <ul>
                        <li class="{{ active_if_match('organization/finance') }}">
                            <a href="{{route('organization.finance.analysis.index')}}">
                                <span class="iconify" data-icon="mdi:view-grid-outline"></span>
                                <span>{{__('Finance')}}</span>
                            </a>
                        </li>
                        <li class="{{ active_if_match('organization/settings/subscription') }}">
                            <a href="{{ route('organization.settings.subscription') }}">
                                <span class="iconify" data-icon="mdi:view-grid-outline"></span>
                                <span>{{ __('Subscription Settings') }}</span>
                            </a>
                        </li>
                        <li class="{{ active_if_match('organization/refund') }}">
                            <a href="{{route('organization.refund.index')}}">
                                <span class="iconify" data-icon="mdi:view-grid-outline"></span>
                                <span>{{__('Refund List')}}</span>
                            </a>
                        </li>
                    </ul>
                </li>
            </ul>
        </li>

        <!-- 2️⃣ ⚙️ Gestion Administrative -->
        <li>
            <a class="has-arrow" href="#">
                <span class="iconify" data-icon="mdi:account-outline"></span>
                <span>{{ __('Administrative Management') }}</span>
            </a>
            <ul>
                <li>
                    <a class="has-arrow" href="#">
                        <span class="iconify" data-icon="mdi:view-grid-outline"></span>
                        <span>{{ __('Users') }}</span>
                    </a>
                    <ul>
                        @can('organization_manage_user')
                        <li class="{{ active_if_match('organization/user-management') }}">
                            <a href="{{ route('organization.user-management.index') }}">
                                <span class="iconify" data-icon="mdi:view-grid-outline"></span>
                                <span>{{ __('All Users') }}</span>
                            </a>
                        </li>
                        @can('organization_create_user')
                        <li class="{{ active_if_match('organization/user-management/create') }}">
                            <a href="{{ route('organization.user-management.create') }}">
                                <span class="iconify" data-icon="mdi:view-grid-outline"></span>
                                <span>{{ __('Add User') }}</span>
                            </a>
                        </li>
                        @endcan
                        @endcan
                    </ul>
                </li>
                <li>
                    <a class="has-arrow" href="#">
                        <span class="iconify" data-icon="mdi:view-grid-outline"></span>
                        <span>{{ __('Learners') }}</span>
                    </a>
                    <ul>
                        <li class="{{ active_if_match('organization/student') }}">
                            <a href="{{ route('organization.student.index') }}">
                                <span class="iconify" data-icon="mdi:view-grid-outline"></span>
                                <span>{{ __('All Student') }}</span>
                            </a>
                        </li>
                        <li class="{{ active_if_match('organization/student/create') }}">
                            <a href="{{ route('organization.student.create') }}">
                                <span class="iconify" data-icon="mdi:view-grid-outline"></span>
                                <span>{{ __('Add Student') }}</span>
                            </a>
                        </li>
                    </ul>
                </li>
                <li>
                    <a class="has-arrow" href="#">
                        <span class="iconify" data-icon="mdi:view-grid-outline"></span>
                        <span>{{ __('Trainers') }}</span>
                    </a>
                    <ul>
                        <li class="{{ active_if_match('organization/instructor') }}">
                            <a href="{{ route('organization.instructor.index') }}">
                                <span class="iconify" data-icon="mdi:view-grid-outline"></span>
                                <span>{{ __('All Instructor') }}</span>
                            </a>
                        </li>
                        <li class="{{ active_if_match('organization/instructor/create') }}">
                            <a href="{{ route('organization.instructor.create') }}">
                                <span class="iconify" data-icon="mdi:view-grid-outline"></span>
                                <span>{{ __('Add Instructor') }}</span>
                            </a>
                        </li>
                    </ul>
                </li>
                <li>
                    <a class="has-arrow" href="#">
                        <span class="iconify" data-icon="mdi:view-grid-outline"></span>
                        <span>{{ __('Messaging') }}</span>
                    </a>
                    <ul>
                        <li class="{{ active_if_match('organization/chat') }}">
                            <a href="{{route('organization.chat.index')}}">
                                <span class="iconify" data-icon="mdi:view-grid-outline"></span>
                                <span>{{__('Chat')}}</span>
                            </a>
                        </li>
                        <li class="{{ active_if_match('organization/discussion') }}">
                            <a href="{{route('organization.discussion.index')}}">
                                <span class="iconify" data-icon="mdi:view-grid-outline"></span>
                                <span>{{__('Discussion')}}</span>
                            </a>
                        </li>
                    </ul>
                </li>
                <li class="{{ active_if_match('organization/email-config') }}">
                    <a href="#">
                        <span class="iconify" data-icon="mdi:view-grid-outline"></span>
                        <span>{{ __('Email Configuration') }}</span>
                    </a>
                </li>
                <li>
                    <a class="has-arrow" href="#">
                        <span class="iconify" data-icon="mdi:view-grid-outline"></span>
                        <span>{{ __('Organization') }}</span>
                    </a>
                    <ul>
                        <li class="{{ active_if_match('organization/settings') }}">
                            <a href="{{ route('organization.settings.index') }}">
                                <span class="iconify" data-icon="mdi:view-grid-outline"></span>
                                <span>{{ __('Main Settings') }}</span>
                            </a>
                        </li>
                        <li class="{{ active_if_match('organization/settings/general') }}">
                            <a href="{{ route('organization.settings.general') }}">
                                <span class="iconify" data-icon="mdi:view-grid-outline"></span>
                                <span>{{ __('General Settings') }}</span>
                            </a>
                        </li>
                        <li class="{{ active_if_match('organization/settings/branding') }}">
                            <a href="{{ route('organization.settings.branding') }}">
                                <span class="iconify" data-icon="mdi:view-grid-outline"></span>
                                <span>{{ __('Branding Settings') }}</span>
                            </a>
                        </li>
                        <li class="{{ active_if_match('organization/role-management') }}">
                            <a href="{{ route('organization.role-management.index') }}">
                                <span class="iconify" data-icon="mdi:account-key"></span>
                                <span>{{ __('Role Management') }}</span>
                            </a>
                        </li>
                    </ul>
                </li>
                <li>
                    <a class="has-arrow" href="#">
                        <span class="iconify" data-icon="mdi:view-grid-outline"></span>
                        <span>{{ __('Settings') }}</span>
                    </a>
                    <ul>
                        @can('account_setting')
                        <li class="{{ active_if_full_match('organization/profile') }}">
                            <a href="{{route('organization.profile')}}">
                                <span class="iconify" data-icon="mdi:view-grid-outline"></span>
                                <span>{{__('Profile')}}</span>
                            </a>
                        </li>
                        <li class="{{ active_if_full_match('organization/profile/change-password') }}">
                            <a href="{{ route('organization.change-password') }}">
                                <span class="iconify" data-icon="mdi:view-grid-outline"></span>
                                <span>{{__('Change Password')}}</span>
                            </a>
                        </li>
                        @endcan
                        <li class="{{ active_if_match('organization/settings/preview') }}">
                            <a href="{{ route('organization.settings.preview') }}">
                                <span class="iconify" data-icon="mdi:view-grid-outline"></span>
                                <span>{{ __('Preview Settings') }}</span>
                            </a>
                        </li>
                        <li class="{{ active_if_match('organization/zoom-setting') }}">
                            <a href="{{route('organization.zoom-setting.update')}}">
                                <span class="iconify" data-icon="mdi:view-grid-outline"></span>
                                <span>{{ __('Zoom Settings') }}</span>
                            </a>
                        </li>
                        @if(get_option('gmeet_status'))
                        <li class="{{ active_if_match('organization/gmeet_setting') }}">
                            <a href="{{route('organization.gmeet_setting.update')}}">
                                <span class="iconify" data-icon="mdi:view-grid-outline"></span>
                                <span>{{ __('Gmeet Settings') }}</span>
                            </a>
                        </li>
                        @endif
                    </ul>
                </li>
            </ul>
        </li>

        <!-- 3️⃣ 📚 Gestion Formations -->
        <li>
            <a class="has-arrow" href="#">
                <span class="iconify" data-icon="mdi:view-grid-outline"></span>
                <span>{{ __('Training Management') }}</span>
            </a>
            <ul>
                <li class="{{ active_if_match('organization/analytics') }}">
                    <a href="#">
                        <span class="iconify" data-icon="mdi:view-grid-outline"></span>
                        <span>{{ __('Statistics') }}</span>
                    </a>
                </li>
                <li>
                    <a class="has-arrow" href="#">
                        <span class="iconify" data-icon="mdi:play"></span>
                        <span>{{ __('Courses') }}</span>
                    </a>
                    <ul>
                        <li class="{{ active_if_match('organization/course') }}">
                            <a href="{{ route('organization.course.index') }}">
                                <span class="iconify" data-icon="mdi:view-grid-outline"></span>
                                <span>{{ __('All Course') }}</span>
                            </a>
                        </li>
                        <li class="{{ active_if_match('organization/course/create') }}">
                            <a href="{{ route('organization.course.create') }}">
                                <span class="iconify" data-icon="mdi:view-grid-outline"></span>
                                <span>{{ __('Add Course') }}</span>
                            </a>
                        </li>
                        <li class="{{ active_if_match('organization/bundle-course') }}">
                            <a href="{{ route('organization.bundle-course.index') }}">
                                <span class="iconify" data-icon="mdi:view-grid-outline"></span>
                                <span>{{__('Bundles Courses')}}</span>
                            </a>
                        </li>
                    </ul>
                </li>
                <li>
                    <a class="has-arrow" href="#">
                        <span class="iconify" data-icon="mdi:calendar-text"></span>
                        <span>{{ __('Sessions') }}</span>
                    </a>
                    <ul>
                        <li class="{{ active_if_match('organization/live-class') }}">
                            <a href="{{ route('organization.live-class.course-live-class.index') }}">
                                <span class="iconify" data-icon="mdi:view-grid-outline"></span>
                                <span>{{__('Live Class')}}</span>
                            </a>
                        </li>
                    </ul>
                </li>
                <li class="{{ active_if_match('organization/quiz-management') }}">
                    <a href="#">
                        <span class="iconify" data-icon="mdi:check-all"></span>
                        <span>{{ __('Quiz Management') }}</span>
                    </a>
                </li>
                <li>
                    <a class="has-arrow" href="#">
                        <span class="iconify" data-icon="mdi:book-multiple"></span>
                        <span>{{ __('Educational Materials') }}</span>
                    </a>
                    <ul>
                        @can('organization_manage_certificate')
                            <li>
                                <a class="has-arrow" href="#">
                                    <span class="iconify" data-icon="mdi:view-grid-outline"></span>
                                    <span>{{ __('Certificate Management') }}</span>
                                </a>
                            <ul>
                                <li class="{{ active_if_match('organization/certificate-management') }}">
                                    <a href="{{ route('organization.certificate-management.index') }}">
                                        <span class="iconify" data-icon="mdi:view-grid-outline"></span>
                                        <span>{{ __('All Certificates') }}</span>
                                    </a>
                                </li>
                                @can('organization_create_certificate')
                                <li class="{{ active_if_match('organization/certificate-management/create') }}">
                                    <a href="{{ route('organization.certificate-management.create') }}">
                                        <span class="iconify" data-icon="mdi:view-grid-outline"></span>
                                        <span>{{ __('Create Certificate') }}</span>
                                    </a>
                                </li>
                                @endcan
                            </ul>
                        </li>
                        @endcan
                    </ul>
                </li>
            </ul>
        </li>

        <!-- 4️⃣ 🤝 Parties Prenantes -->
        <li>
            <a class="has-arrow" href="#">
                <span class="iconify" data-icon="mdi:account-group"></span>
                <span>{{ __('Stakeholder Management') }}</span>
            </a>
            <ul>
                <li>
                    <a class="has-arrow" href="#">
                        <span class="iconify" data-icon="mdi:view-grid-outline"></span>
                        <span>{{ __('Consultation') }}</span>
                    </a>
                    <ul>
                        <li class="{{ active_if_match('organization/consultation/dashboard') }}">
                            <a href="{{ route('organization.consultation.dashboard') }}">
                                <span class="iconify" data-icon="mdi:view-grid-outline"></span>
                                <span>{{ __('Dashboard') }}</span>
                            </a>
                        </li>
                        <li class="{{ active_if_match('organization/bookingRequest') }}">
                            <a href="{{ route('organization.bookingRequest') }}">
                                <span class="iconify" data-icon="mdi:view-grid-outline"></span>
                                <span>{{ __('Booking Request') }}</span>
                            </a>
                        </li>
                        <li class="{{ active_if_match('organization/bookingHistory') }}">
                            <a href="{{ route('organization.bookingHistory') }}">
                                <span class="iconify" data-icon="mdi:view-grid-outline"></span>
                                <span>{{ __('Booking History') }}</span>
                            </a>
                        </li>
                    </ul>
                </li>
                <li class="{{ active_if_match('organization/followings') }}">
                    <a href="{{ route('organization.followings') }}">
                        <span class="iconify" data-icon="mdi:view-grid-outline"></span>
                        <span>{{__('Followings')}}</span>
                    </a>
                </li>
                <li class="{{ active_if_match('organization/followers') }}">
                    <a href="{{ route('organization.followers') }}">
                        <span class="iconify" data-icon="mdi:view-grid-outline"></span>
                        <span>{{__('Followers')}}</span>
                    </a>
                </li>
            </ul>
        </li>

        <!-- 5️⃣ 🎨 Marque Blanche -->
        <li class="{{ active_if_match('organization/settings/branding') }}">
            <a href="{{ route('organization.settings.branding') }}">
                <span class="iconify" data-icon="mdi:palette-swatch"></span>
                <span>{{ __('White Label') }}</span>
            </a>
        </li>

        <!-- 📢 Notice Board -->
        <li class="{{ active_if_match('organization/notice-board') }}">
            <a href="{{ route('organization.notice-board.course-notice.index') }}">
                <span class="iconify" data-icon="mdi:view-grid-outline"></span>
                <span>{{__('Notice Board')}}</span>
            </a>
        </li>

        <!-- 🎫 Support Ticket -->
        @can('support_ticket')
        <li class="{{ active_if_match('organization/support-ticket') }}">
            <a href="{{route('organization.support-ticket.index')}}">
                <span class="iconify" data-icon="mdi:view-grid-outline"></span>
                <span>{{__('Support Ticket')}}</span>
            </a>
        </li>
        @endcan

        <!-- 👤 Profile -->
        <li>
            <a class="has-arrow" href="#">
                <span class="iconify" data-icon="mdi:view-grid-outline"></span>
                <span>{{__('Profile')}}</span>
            </a>
            <ul>
                <li class="{{ active_if_match('organization/profile') }}">
                    <a href="{{ route('organization.profile') }}">
                        <span class="iconify" data-icon="mdi:view-grid-outline"></span>
                        <span>{{__('Basic Information')}}</span>
                    </a>
                </li>
                <li class="{{ active_if_match('organization/address') }}">
                    <a href="{{ route('organization.address') }}">
                        <span class="iconify" data-icon="mdi:view-grid-outline"></span>
                        <span>{{__('Address & Location')}}</span>
                    </a>
                </li>
            </ul>
        </li>

    </ul>
</div>

<style>
    /* Compact sidebar styling to match the image */
    .sidebar {
        width: 240px !important;
        min-width: 240px !important;
    }

    .sidebar__menu.compact-sidebar {
        padding: 0;
    }

    .sidebar__menu.compact-sidebar li a {
        color: #4a5568;
        font-size: 13px;
        font-weight: 400;
        padding: 10px 15px;
        display: flex;
        align-items: center;
        text-decoration: none;
        transition: all 0.2s ease;
        border-radius: 4px;
        margin: 1px 8px;
        line-height: 1.3;
    }

    .sidebar__menu.compact-sidebar li a:hover {
        background-color: #e0f2ff;
        color: #007bff;
    }

    .sidebar__menu.compact-sidebar li.active > a {
        background-color: #e0f2ff;
        color: #007bff;
        font-weight: 500;
    }

    .sidebar__menu.compact-sidebar li.active > a:hover {
        background-color: #e0f2ff;
        color: #007bff;
    }

    /* Remove arrows */
    .sidebar__menu.compact-sidebar .has-arrow:after {
        display: none;
    }

    .sidebar__menu.compact-sidebar ul ul {
        background-color: transparent !important;
        border-radius: 0;
        margin: 0;
        padding-left: 10px;
    }

    .sidebar__menu.compact-sidebar ul ul li a {
        padding: 8px 12px;
        font-size: 12px;
        margin: 1px 6px;
        color: #6b7280;
    }

    .sidebar__menu.compact-sidebar ul ul ul li a {
        padding: 6px 10px;
        font-size: 11px;
        margin: 1px 4px;
        color: #9ca3af;
    }

    .sidebar__menu.compact-sidebar .iconify {
        margin-right: 10px;
        font-size: 16px;
        width: 16px;
        height: 16px;
        flex-shrink: 0;
    }

    .sidebar__menu.compact-sidebar ul ul .iconify {
        margin-right: 8px;
        font-size: 14px;
        width: 14px;
        height: 14px;
    }

    .sidebar__menu.compact-sidebar ul ul ul .iconify {
        margin-right: 6px;
        font-size: 12px;
        width: 12px;
        height: 12px;
    }

    /* Active sub-menu item styling */
    .sidebar__menu.compact-sidebar ul ul li.active > a {
        background-color: transparent;
        color: #007bff;
        font-weight: 500;
    }

    /* Ensure proper spacing and alignment */
    .sidebar__menu.compact-sidebar li {
        margin: 0;
    }

    .sidebar__menu.compact-sidebar li a span {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    /* Main menu items should be slightly larger */
    .sidebar__menu.compact-sidebar > li > a {
        font-size: 14px;
        font-weight: 500;
        padding: 12px 15px;
    }

    .sidebar__menu.compact-sidebar > li > a .iconify {
        font-size: 18px;
        width: 18px;
        height: 18px;
    }

    /* Brand styling to match image */
    .sidebar__brand__content {
        display: flex;
        align-items: center;
        padding: 8px 12px;
    }

    .sidebar__brand__text {
        font-size: 16px;
        font-weight: 600;
        color: #1f2937;
        margin-left: 8px;
    }

    .sidebar__brand__logo-placeholder {
        width: 32px;
        height: 32px;
        background: linear-gradient(135deg, #3b82f6, #1d4ed8);
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: 600;
    }
</style>