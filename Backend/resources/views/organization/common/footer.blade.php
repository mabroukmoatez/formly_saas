<footer class="footer__area">
    <div class="container-fluid">
        <div class="row">
            <div class="col-md-12">
                <div class="footer__copyright">
                    <div class="footer__copyright__left">
                        <h2>&copy; {{ date('Y') }} 
                            @if($current_organization ?? false)
                                {{ $current_organization->organization_name }}
                            @else
                                {{ get_option('app_name', 'Formly') }}
                            @endif
                            . {{ __('All rights reserved.') }}
                        </h2>
                    </div>
                    <div class="footer__copyright__right">
                        <h2>{{ __('Powered by') }} <a class="link-primary" target="_blank" href="#">{{ get_option('app_name', 'Formly') }}</a></h2>
                    </div>
                </div>
            </div>
        </div>
    </div>
</footer>

<style>
/* Footer Dark Mode Styles */
.footer__area {
    background: #f8fafc;
    border-top: 1px solid #e2e8f0;
    padding: 20px 0;
    transition: background-color 0.3s ease, border-color 0.3s ease;
}

.footer__copyright {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 20px;
}

.footer__copyright h2 {
    font-size: 14px;
    font-weight: 500;
    color: #64748b;
    margin: 0;
    transition: color 0.3s ease;
}

.footer__copyright__left h2 {
    color: #64748b;
}

.footer__copyright__right h2 {
    color: #64748b;
}

.footer__copyright__right .link-primary {
    color: #3b82f6;
    text-decoration: none;
    transition: color 0.3s ease;
}

.footer__copyright__right .link-primary:hover {
    color: #1d4ed8;
    text-decoration: underline;
}

/* Dark Mode Styles - Only applied when explicitly set via data-theme */

[data-theme="dark"] .footer__area {
    background: #0f172a;
    border-top-color: #1e293b;
}

[data-theme="dark"] .footer__copyright h2 {
    color: #94a3b8;
}

[data-theme="dark"] .footer__copyright__left h2 {
    color: #94a3b8;
}

[data-theme="dark"] .footer__copyright__right h2 {
    color: #94a3b8;
}

[data-theme="dark"] .footer__copyright__right .link-primary {
    color: #60a5fa;
}

[data-theme="dark"] .footer__copyright__right .link-primary:hover {
    color: #93c5fd;
}

/* Responsive Design */
@media (max-width: 768px) {
    .footer__copyright {
        flex-direction: column;
        gap: 10px;
        text-align: center;
    }
    
    .footer__copyright h2 {
        font-size: 13px;
    }
}
</style>