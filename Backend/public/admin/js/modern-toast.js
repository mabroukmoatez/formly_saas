/**
 * Modern Toast Notifications - Formly 2025 Design System
 * Enhanced JavaScript for modern toast interactions
 */

(function() {
    'use strict';

    // Wait for DOM to be ready
    document.addEventListener('DOMContentLoaded', function() {
        initializeModernToasts();
    });

    function initializeModernToasts() {
        // Override default toastr options
        if (typeof toastr !== 'undefined') {
            // Configuration simplifiée basée sur la config par défaut
            toastr.options = {
                closeButton: true,
                debug: false,
                newestOnTop: false,
                progressBar: true,
                positionClass: "toast-top-left",
                preventDuplicates: true,
                onclick: null,
                showDuration: "300",
                hideDuration: "1000",
                timeOut: "5000",
                extendedTimeOut: "1000",
                showEasing: "swing",
                hideEasing: "swing",
                showMethod: "fadeIn",
                hideMethod: "fadeOut"
            };

            // Override toastr methods to add modern styling
            const originalSuccess = toastr.success;
            const originalError = toastr.error;
            const originalWarning = toastr.warning;
            const originalInfo = toastr.info;

            toastr.success = function(message, title, options) {
                return showModernToast('success', message, title, options, originalSuccess);
            };

            toastr.error = function(message, title, options) {
                return showModernToast('error', message, title, options, originalError);
            };

            toastr.warning = function(message, title, options) {
                return showModernToast('warning', message, title, options, originalWarning);
            };

            toastr.info = function(message, title, options) {
                return showModernToast('info', message, title, options, originalInfo);
            };
        }

        // Add click-to-dismiss functionality
        document.addEventListener('click', function(e) {
            if (e.target.closest('#toast-container > div')) {
                const toast = e.target.closest('#toast-container > div');
                if (!e.target.closest('.toast-close-button')) {
                    dismissToast(toast);
                }
            }
        });

        // Add keyboard navigation
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                dismissAllToasts();
            }
        });
    }

    function showModernToast(type, message, title, options, originalMethod) {
        // Add modern icons
        const icons = {
            success: '<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"/></svg>',
            error: '<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"/></svg>',
            warning: '<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"/></svg>',
            info: '<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"/></svg>'
        };

        // Create custom options with icon
        const customOptions = Object.assign({}, options, {
            iconHtml: icons[type] || icons.info
        });

        // Call original method
        const result = originalMethod.call(toastr, message, title, customOptions);

        // Add modern effects after toast is shown
        setTimeout(() => {
            const container = document.getElementById('toast-container');
            if (container) {
                const toasts = container.querySelectorAll('> div');
                const latestToast = toasts[toasts.length - 1];
                if (latestToast) {
                    addModernToastEffects(latestToast);
                }
            }
        }, 100);

        return result;
    }

    function addModernToastEffects(toastElement) {
        if (!toastElement) return;

        // Add modern class for animations
        toastElement.classList.add('toast-enter');

        // Add ripple effect on click
        toastElement.addEventListener('click', function(e) {
            if (!e.target.closest('.toast-close-button')) {
                createRippleEffect(e, toastElement);
            }
        });

        // Add hover effects
        toastElement.addEventListener('mouseenter', function() {
            this.style.transform = 'translateX(0) scale(1.02)';
        });

        toastElement.addEventListener('mouseleave', function() {
            this.style.transform = 'translateX(0) scale(1)';
        });

        // Add swipe-to-dismiss on mobile
        if ('ontouchstart' in window) {
            addSwipeToDismiss(toastElement);
        }
    }

    function createRippleEffect(event, element) {
        const ripple = document.createElement('div');
        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;

        ripple.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
            background: rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            transform: scale(0);
            animation: ripple 0.6s ease-out;
            pointer-events: none;
            z-index: 1000;
        `;

        element.style.position = 'relative';
        element.style.overflow = 'hidden';
        element.appendChild(ripple);

        setTimeout(() => {
            ripple.remove();
        }, 600);
    }

    function addSwipeToDismiss(element) {
        let startX = 0;
        let currentX = 0;
        let isDragging = false;

        element.addEventListener('touchstart', function(e) {
            startX = e.touches[0].clientX;
            isDragging = true;
            element.style.transition = 'none';
        });

        element.addEventListener('touchmove', function(e) {
            if (!isDragging) return;
            currentX = e.touches[0].clientX;
            const deltaX = currentX - startX;
            
            if (deltaX < 0) {
                element.style.transform = `translateX(${deltaX}px)`;
            }
        });

        element.addEventListener('touchend', function(e) {
            if (!isDragging) return;
            isDragging = false;
            element.style.transition = '';

            const deltaX = currentX - startX;
            if (deltaX < -50) {
                dismissToast(element);
            } else {
                element.style.transform = 'translateX(0)';
            }
        });
    }

    function dismissToast(toastElement) {
        if (!toastElement) return;

        toastElement.style.transform = 'translateX(-100%)';
        toastElement.style.opacity = '0';

        setTimeout(() => {
            if (toastElement.parentNode) {
                toastElement.parentNode.removeChild(toastElement);
            }
        }, 300);
    }

    function dismissAllToasts() {
        const container = document.getElementById('toast-container');
        if (container) {
            const toasts = container.querySelectorAll('> div');
            toasts.forEach(toast => dismissToast(toast));
        }
    }

    // Add CSS for ripple animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes ripple {
            to {
                transform: scale(2);
                opacity: 0;
            }
        }
        
        /* Enhanced toast animations */
        #toast-container > div {
            will-change: transform, opacity;
        }
        
        /* Smooth transitions for all interactions */
        #toast-container > div * {
            transition: all 0.2s ease;
        }
    `;
    document.head.appendChild(style);

    // Expose utility functions globally
    window.ModernToast = {
        dismissAll: dismissAllToasts,
        dismiss: dismissToast,
        show: function(type, message, title, options) {
            if (typeof toastr !== 'undefined') {
                return toastr[type](message, title, options);
            }
        }
    };

})();
