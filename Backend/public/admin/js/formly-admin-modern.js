/**
 * Formly Modern Admin Panel JavaScript
 * Handles sidebar toggle, responsive behavior, and modern UI interactions
 */

(function($) {
    'use strict';

    // Initialize when DOM is ready
    $(document).ready(function() {
        
        // ============================================
        // THEME TOGGLE FUNCTIONALITY
        // ============================================
        
        const themeToggle = $('#theme-toggle');
        const sunIcon = $('.sun-icon');
        const moonIcon = $('.moon-icon');
        
        // Initialize theme
        function initTheme() {
            const savedTheme = localStorage.getItem('admin-theme') || 'light';
            applyTheme(savedTheme);
        }
        
        // Apply theme
        function applyTheme(theme) {
            if (theme === 'dark') {
                $('html').attr('data-theme', 'dark');
                sunIcon.show();
                moonIcon.hide();
            } else {
                $('html').attr('data-theme', 'light');
                sunIcon.hide();
                moonIcon.show();
            }
        }
        
        // Toggle theme
        themeToggle.on('click', function(e) {
            e.preventDefault();
            const currentTheme = $('html').attr('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            applyTheme(newTheme);
            localStorage.setItem('admin-theme', newTheme);
        });
        
        // Initialize theme on page load
        initTheme();
        
        // ============================================
        // SIDEBAR TOGGLE FUNCTIONALITY
        // ============================================
        
        const sidebar = $('.sidebar__area');
        const mainContent = $('.main-content');
        const sidebarToggler = $('.sidebar-toggler');
        const sidebarClose = $('.sidebar__close .close-btn');
        let sidebarOverlay = $('.sidebar-overlay');
        
        // Create overlay if it doesn't exist
        if (sidebarOverlay.length === 0) {
            $('body').append('<div class="sidebar-overlay"></div>');
            sidebarOverlay = $('.sidebar-overlay');
        }
        
        // Desktop sidebar collapse/expand
        if ($(window).width() >= 1200) {
            
            // Function to apply collapsed state
            function applyCollapsedState() {
                sidebar.addClass('collapsed');
                sidebar.find('.sidebar__brand__text').css({
                    'opacity': '0',
                    'width': '0',
                    'overflow': 'hidden'
                });
                sidebar.find('.sidebar__menu > li > a span:last-child').css({
                    'opacity': '0',
                    'width': '0',
                    'overflow': 'hidden',
                    'margin-left': '0'
                });
                sidebar.find('.sidebar__menu > li > a').css({
                    'justify-content': 'center',
                    'padding': '0.875rem 0.5rem'
                });
                sidebar.find('.sidebar__menu > li > a .iconify, .sidebar__menu > li > a svg').css({
                    'margin-right': '0'
                });
                localStorage.setItem('sidebarCollapsed', 'true');
            }
            
            // Function to apply expanded state
            function applyExpandedState() {
                sidebar.removeClass('collapsed');
                sidebar.find('.sidebar__brand__text').css({
                    'opacity': '1',
                    'width': 'auto',
                    'overflow': 'visible'
                });
                sidebar.find('.sidebar__menu > li > a span:last-child').css({
                    'opacity': '1',
                    'width': 'auto',
                    'overflow': 'visible',
                    'margin-left': '0.875rem'
                });
                sidebar.find('.sidebar__menu > li > a').css({
                    'justify-content': 'flex-start',
                    'padding': '0.875rem 1.25rem'
                });
                sidebar.find('.sidebar__menu > li > a .iconify, .sidebar__menu > li > a svg').css({
                    'margin-right': '0.875rem'
                });
                localStorage.setItem('sidebarCollapsed', 'false');
            }
            
            // Toggle functionality
            sidebarToggler.on('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                console.log('Toggle clicked. Current state:', sidebar.hasClass('collapsed') ? 'collapsed' : 'expanded');
                
                if (sidebar.hasClass('collapsed')) {
                    console.log('Applying expanded state');
                    applyExpandedState();
                } else {
                    console.log('Applying collapsed state');
                    applyCollapsedState();
                }
                
                console.log('New state:', sidebar.hasClass('collapsed') ? 'collapsed' : 'expanded');
            });
            
            // Initialize sidebar state
            if (localStorage.getItem('sidebarCollapsed') === 'true') {
                applyCollapsedState();
            } else {
                applyExpandedState();
            }
        }
        
        // Mobile sidebar toggle
        if ($(window).width() < 1200) {
            sidebarToggler.on('click', function() {
                sidebar.addClass('show');
                sidebarOverlay.addClass('show');
                $('body').css('overflow', 'hidden');
            });
        }
        
        // Close sidebar on mobile
        function closeMobileSidebar() {
            sidebar.removeClass('show');
            sidebarOverlay.removeClass('show');
            $('body').css('overflow', '');
        }
        
        sidebarClose.on('click', closeMobileSidebar);
        sidebarOverlay.on('click', closeMobileSidebar);
        
        // Close mobile sidebar when clicking on a menu item
        if ($(window).width() < 1200) {
            $('.sidebar__menu > li > a:not(.has-arrow)').on('click', function() {
                setTimeout(closeMobileSidebar, 200);
            });
        }
        
        // ============================================
        // METISMENU INTEGRATION
        // ============================================
        
        // Ensure metisMenu works properly
        if (typeof $.fn.metisMenu !== 'undefined') {
            $('#sidebar-menu').metisMenu({
                toggle: true,
                preventDefault: false
            });
        }
        
        // ============================================
        // DROPDOWN IMPROVEMENTS
        // ============================================
        
        // Let Bootstrap handle dropdowns automatically
        // Remove conflicting handlers
        
        // ============================================
        // RESPONSIVE HANDLING
        // ============================================
        
        let windowWidth = $(window).width();
        
        $(window).on('resize', function() {
            const newWidth = $(window).width();
            
            // Switching from mobile to desktop
            if (windowWidth < 1200 && newWidth >= 1200) {
                closeMobileSidebar();
                sidebar.removeClass('collapsed');
                
                // Reattach desktop toggle
                sidebarToggler.off('click').on('click', function() {
                    sidebar.toggleClass('collapsed');
                    
                    if (sidebar.hasClass('collapsed')) {
                        localStorage.setItem('sidebarCollapsed', 'true');
                    } else {
                        localStorage.setItem('sidebarCollapsed', 'false');
                    }
                });
                
                // Restore collapsed state
                if (localStorage.getItem('sidebarCollapsed') === 'true') {
                    sidebar.addClass('collapsed');
                }
            }
            
            // Switching from desktop to mobile
            if (windowWidth >= 1200 && newWidth < 1200) {
                sidebar.removeClass('collapsed');
                
                // Reattach mobile toggle
                sidebarToggler.off('click').on('click', function() {
                    sidebar.addClass('show');
                    sidebarOverlay.addClass('show');
                    $('body').css('overflow', 'hidden');
                });
            }
            
            windowWidth = newWidth;
        });
        
        // ============================================
        // HEADER BUTTONS FUNCTIONALITY
        // ============================================
        
        // Help Button
        $('#helpButton').on('click', function(e) {
            e.preventDefault();
            alert('Help functionality - you can implement your help system here');
        });
        
        // Messages Button
        $('#messagesButton').on('click', function(e) {
            e.preventDefault();
            alert('Messages functionality - you can implement your messaging system here');
        });
        
        // AI Content Toggle (if exists) - Let Bootstrap handle this
        // Remove our custom handler to let Bootstrap work
        
        // ============================================
        // BOOTSTRAP DROPDOWN INTEGRATION
        // ============================================
        
        // Let Bootstrap handle all dropdowns automatically
        // Remove custom dropdown handlers to prevent conflicts
        
        // ============================================
        // ACTIVE MENU HIGHLIGHTING
        // ============================================
        
        // Get current URL path
        const currentPath = window.location.pathname;
        
        // Highlight active menu item
        $('.sidebar__menu a').each(function() {
            const href = $(this).attr('href');
            
            if (href && currentPath.includes(href.replace(window.location.origin, ''))) {
                $(this).closest('li').addClass('mm-active');
                
                // Open parent menu if it's a submenu item
                if ($(this).closest('ul').parent('li').length) {
                    $(this).closest('ul').parent('li').addClass('mm-active');
                    $(this).closest('ul').addClass('mm-show');
                }
            }
        });
        
        // ============================================
        // SMOOTH SCROLLING FOR SIDEBAR
        // ============================================
        
        $('.sidebar__menu').on('scroll', function() {
            // Add shadow when scrolled
            if ($(this).scrollTop() > 0) {
                $(this).addClass('scrolled');
            } else {
                $(this).removeClass('scrolled');
            }
        });
        
        // ============================================
        // ADMIN PANEL IS ALWAYS DARK THEME
        // ============================================
        
        // Admin panel uses dark theme by default
        // No theme toggle needed - static moon icon only
        
        // ============================================
        // KEYBOARD SHORTCUTS
        // ============================================
        
        $(document).on('keydown', function(e) {
            // Ctrl/Cmd + B to toggle sidebar
            if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
                e.preventDefault();
                sidebarToggler.trigger('click');
            }
            
            // ESC to close mobile sidebar
            if (e.key === 'Escape' && $(window).width() < 1200) {
                closeMobileSidebar();
            }
        });
        
        // ============================================
        // TOOLTIP INITIALIZATION (for collapsed sidebar)
        // ============================================
        
        function initTooltips() {
            if (sidebar.hasClass('collapsed')) {
                $('.sidebar__menu > li > a').each(function() {
                    const text = $(this).find('span:last-child').text().trim();
                    if (text && !$(this).attr('title')) {
                        $(this).attr('title', text);
                        $(this).attr('data-bs-toggle', 'tooltip');
                        $(this).attr('data-bs-placement', 'right');
                    }
                });
                
                // Initialize Bootstrap tooltips
                if (typeof bootstrap !== 'undefined') {
                    $('[data-bs-toggle="tooltip"]').each(function() {
                        new bootstrap.Tooltip(this);
                    });
                }
            } else {
                // Remove tooltips when expanded
                $('.sidebar__menu > li > a').removeAttr('title data-bs-toggle data-bs-placement');
                $('[data-bs-toggle="tooltip"]').each(function() {
                    const tooltip = bootstrap.Tooltip.getInstance(this);
                    if (tooltip) {
                        tooltip.dispose();
                    }
                });
            }
        }
        
        // Initialize tooltips on load
        initTooltips();
        
        // Re-initialize tooltips when sidebar is toggled
        sidebarToggler.on('click', function() {
            setTimeout(initTooltips, 350);
        });
        
        // ============================================
        // PREVENT DROPDOWN CLOSE ON INSIDE CLICK
        // ============================================
        
        // Let Bootstrap handle this automatically
        
        // ============================================
        // LOADING STATE FOR LINKS
        // ============================================
        
        $('.sidebar__menu a:not(.has-arrow)').on('click', function(e) {
            const $this = $(this);
            
            // Don't add loading state for dropdowns or javascript links
            if (!$this.attr('href') || $this.attr('href') === '#') {
                return;
            }
            
            // Add loading class
            $this.addClass('loading');
        });
        
        // Ensure submenu is open when clicking on submenu items
        $('.sidebar__menu ul li a').on('click', function(e) {
            const $this = $(this);
            const $parentLi = $this.closest('li');
            const $parentMenu = $parentLi.closest('ul');
            const $parentArrow = $parentMenu.prev('a.has-arrow');
            
            // If this is a submenu item, ensure parent menu is open
            if ($parentArrow.length > 0) {
                $parentArrow.addClass('mm-active');
                $parentMenu.addClass('mm-show');
            }
        });
        
    });
    
})(jQuery);

