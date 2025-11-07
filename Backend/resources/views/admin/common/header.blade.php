<header class="header__area">
    <div class="container-fluid">
        <div class="row">
            <div class="col-md-12">
                <div class="header__navbar">
                    <div class="header__navbar__left">
                        <!-- Sidebar toggler moved to sidebar -->
                    </div>

                    <div class="header__navbar__right">
                        <ul class="header__menu">

                            @if(isEnableOpenAI()) 
                            <!-- AI Option Start -->
                            <li>
                               <a id="ai-content-toggle" class="btn btn-dropdown" title="AI Assistant" aria-current="page">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                                </svg>
                               </a>
                           </li>
                           <!-- AI Option End -->
                           @endif

                            <!-- Dark/Light Mode Switcher -->
                            <li>
                                <button id="theme-toggle" class="btn btn-dropdown" title="Toggle Theme">
                                    <svg class="sun-icon w-5 h-5" style="display: none;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>
                                    </svg>
                                    <svg class="moon-icon w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>
                                    </svg>
                                </button>
                            </li>

                            <!-- Help Circle Icon -->
                            <li>
                                <a href="#" class="btn btn-dropdown" title="Help" id="helpButton">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                    </svg>
                                </a>
                            </li>

                            <!-- Message Circle Icon -->
                            <li>
                                <a href="#" class="btn btn-dropdown" title="Messages" id="messagesButton">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                                    </svg>
                                </a>
                            </li>

                            <!-- Bell Icon -->
                            <li class="admin-notification-menu position-relative">
                                <a href="#" class="btn btn-dropdown site-language" id="dropdownNotification" data-bs-toggle="dropdown" aria-expanded="false">
                                    <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">{{ @$totalAdminNotifications }}</span>
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
                                    </svg>
                                </a>
                                <!-- Notification Dropdown Start -->
                                <div class="dropdown-menu" aria-labelledby="dropdownNotification">
                                    <ul class="dropdown-list custom-scrollbar">
                                    @forelse(@$adminNotifications as $notification)
                                        @if($notification->sender)
                                            <li>
                                                <a href="{{route('notification.url', [$notification->uuid])}}" class="message-user-item dropdown-item">
                                                    <div class="message-user-item-left">
                                                        <div class="single-notification-item d-flex align-items-center">
                                                            <div class="flex-shrink-0">
                                                                <div class="user-img-wrap position-relative radius-50">
                                                                    <img src="{{ asset($notification->sender->image_path) }}" alt="img" class="radius-50">
                                                                </div>
                                                            </div>
                                                            <div class="flex-grow-1 ms-2">
                                                                <h6 class="color-heading font-14">{{$notification->sender->name}}</h6>
                                                                <p class="font-13 mb-0">{{ __($notification->text) }}</p>
                                                                <div class="font-11 color-gray mt-1">{{$notification->created_at->diffForHumans()}}</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </a>
                                            </li>
                                        @endif
                                    @empty
                                        <p class="text-center">{{__('No Data Found')}}</p>
                                    @endforelse
                                    </ul>
                                    @if(count($adminNotifications))
                                    <div class="dropdown-divider"></div>
                                    <form action="{{ route('notification.all-read') }}" method="POST">
                                        @csrf
                                        <button type="submit" class="dropdown-item dropdown-footer">Mark all as read</button>
                                    </form>
                                    @endif
                                </div>
                                <!-- Notification Dropdown End -->
                            </li>

                            <li>
                                <a href="#" class="btn btn-dropdown site-language" id="dropdownLanguage" data-bs-toggle="dropdown" aria-expanded="false">
                                    <img src="{{asset(selectedLanguage()->flag)}}" alt="icon">
                                </a>
                                <ul class="dropdown-menu" aria-labelledby="dropdownLanguage">
                                    @foreach(appLanguages() as $app_lang)
                                        <li>
                                            <a class="dropdown-item" href="{{ url('/local/'.$app_lang->iso_code) }}">
                                                <img src="{{asset($app_lang->flag)}}" alt="icon">
                                                <span>{{$app_lang->language}}</span>
                                            </a>
                                        </li>
                                    @endforeach

                                </ul>
                            </li>
                            <li>
                                <a href="#" class="btn btn-dropdown user-profile" id="dropdownUser" data-bs-toggle="dropdown" aria-expanded="false">
                                    <img src="{{getImageFile(auth::user()->image_path)}}" alt="icon">
                                </a>
                                <ul class="dropdown-menu" aria-labelledby="dropdownUser">
                                    <li>
                                        <a class="dropdown-item" href="{{route('admin.profile')}}">
                                            <img src="{{asset('admin/images/icons/user.svg')}}" alt="icon">
                                            <span>{{__('Profile')}}</span>
                                        </a>
                                    </li>
                                    <li>
                                        <a class="dropdown-item" href="{{ route('admin.change-password') }}">
                                            <img src="{{asset('admin/images/icons/settings.svg')}}" alt="icon">
                                            <span>{{__('Change Password')}}</span>
                                        </a>
                                    </li>
                                    <li>
                                        <a class="dropdown-item" href="{{route('logout')}}">
                                            <img src="{{asset('admin/images/icons/logout.svg')}}" alt="icon">
                                            <span>{{__('Logout')}}</span>
                                        </a>
                                    </li>
                                </ul>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    </div>
</header>
