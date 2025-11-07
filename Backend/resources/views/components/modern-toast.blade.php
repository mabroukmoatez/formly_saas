@push('styles')
<style>
    /* Animations pour les toasts modernes */
    @keyframes toastProgress {
        from { width: 100%; }
        to { width: 0%; }
    }
    
    @keyframes toastSlideIn {
        from { 
            transform: translateX(100%); 
            opacity: 0; 
        }
        to { 
            transform: translateX(0); 
            opacity: 1; 
        }
    }
    
    @keyframes toastSlideOut {
        from { 
            transform: translateX(0); 
            opacity: 1; 
        }
        to { 
            transform: translateX(100%); 
            opacity: 0; 
        }
    }
    
    .modern-toast {
        animation: toastSlideIn 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards !important;
    }
    
    .modern-toast.toast-exit {
        animation: toastSlideOut 0.4s ease-in forwards !important;
    }
</style>
@endpush

<script>
// Fonction pour créer des toasts modernes
function createModernToast(toast, index) {
    const customContainer = document.getElementById('custom-toast-container');
    if (!customContainer) {
        const container = document.createElement('div');
        container.id = 'custom-toast-container';
        container.style.cssText = `
            position: fixed !important;
            bottom: 0px !important;
            right: 0px !important;
            top: auto !important;
            left: auto !important;
            z-index: 9999999 !important;
            pointer-events: auto !important;
            width: auto !important;
            max-width: 400px !important;
        `;
        document.body.appendChild(container);
    }
    
    const toastDiv = document.createElement('div');
    toastDiv.className = 'modern-toast';
    
    // Configuration des couleurs et icônes selon le type
    const config = {
        error: {
            bg: 'linear-gradient(135deg, #ff6b6b, #ee5a52)',
            icon: 'fa-exclamation-triangle',
            iconBg: '#ff4757',
            border: '#ff3742'
        },
        success: {
            bg: 'linear-gradient(135deg, #51cf66, #40c057)',
            icon: 'fa-check-circle',
            iconBg: '#2f9e44',
            border: '#2b8a3e'
        },
        warning: {
            bg: 'linear-gradient(135deg, #ffd43b, #fab005)',
            icon: 'fa-exclamation-circle',
            iconBg: '#f59f00',
            border: '#e67700'
        },
        info: {
            bg: 'linear-gradient(135deg, #74c0fc, #339af0)',
            icon: 'fa-info-circle',
            iconBg: '#1971c2',
            border: '#1864ab'
        }
    };
    
    const toastConfig = config[toast.type] || config.info;
    
    toastDiv.style.cssText = `
        position: relative !important;
        margin: 12px 0 !important;
        padding: 0 !important;
        background: ${toastConfig.bg} !important;
        color: white !important;
        border-radius: 12px !important;
        box-shadow: 0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08) !important;
        z-index: 9999999 !important;
        min-width: 320px !important;
        max-width: 400px !important;
        border: 1px solid ${toastConfig.border} !important;
        overflow: hidden !important;
        transform: translateX(100%) !important;
        opacity: 0 !important;
        transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55) !important;
        backdrop-filter: blur(10px) !important;
    `;
    
    toastDiv.innerHTML = `
        <div style="
            display: flex !important;
            align-items: center !important;
            padding: 16px 20px !important;
            position: relative !important;
        ">
            <!-- Icône -->
            <div style="
                width: 40px !important;
                height: 40px !important;
                border-radius: 50% !important;
                background: ${toastConfig.iconBg} !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                margin-right: 16px !important;
                flex-shrink: 0 !important;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
            ">
                <i class="fa ${toastConfig.icon}" style="
                    font-size: 18px !important;
                    color: white !important;
                "></i>
            </div>
            
            <!-- Contenu -->
            <div style="
                flex: 1 !important;
                min-width: 0 !important;
            ">
                <div style="
                    font-weight: 600 !important;
                    font-size: 14px !important;
                    margin-bottom: 4px !important;
                    text-transform: uppercase !important;
                    letter-spacing: 0.5px !important;
                ">${toast.type.toUpperCase()}</div>
                <div style="
                    font-size: 13px !important;
                    line-height: 1.4 !important;
                    opacity: 0.95 !important;
                ">${toast.message}</div>
            </div>
            
            <!-- Bouton de fermeture -->
            <button onclick="this.parentElement.parentElement.remove()" style="
                background: none !important;
                border: none !important;
                color: white !important;
                font-size: 16px !important;
                cursor: pointer !important;
                padding: 4px !important;
                border-radius: 4px !important;
                opacity: 0.7 !important;
                transition: opacity 0.2s !important;
                margin-left: 8px !important;
                flex-shrink: 0 !important;
            " onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.7'">
                <i class="fa fa-times"></i>
            </button>
        </div>
        
        <!-- Barre de progression -->
        <div style="
            position: absolute !important;
            bottom: 0 !important;
            left: 0 !important;
            height: 3px !important;
            background: rgba(255,255,255,0.3) !important;
            width: 100% !important;
            border-radius: 0 0 12px 12px !important;
        ">
            <div class="toast-progress" style="
                height: 100% !important;
                background: rgba(255,255,255,0.8) !important;
                width: 100% !important;
                border-radius: 0 0 12px 12px !important;
                animation: toastProgress 5s linear forwards !important;
            "></div>
        </div>
    `;
    
    customContainer.appendChild(toastDiv);
    console.log('Toast moderne affiché:', toast.type, toast.message);
    
    // Animation d'entrée
    setTimeout(() => {
        toastDiv.style.transform = 'translateX(0)';
        toastDiv.style.opacity = '1';
    }, 50 + (index * 100));
    
    // Auto-supprimer après 5 secondes avec animation de sortie
    setTimeout(function() {
        if (toastDiv.parentNode) {
            toastDiv.style.transform = 'translateX(100%)';
            toastDiv.style.opacity = '0';
            setTimeout(() => {
                if (toastDiv.parentNode) {
                    toastDiv.parentNode.removeChild(toastDiv);
                }
            }, 400);
        }
    }, 5000);
}
</script>
