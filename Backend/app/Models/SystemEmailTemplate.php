<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\View;
use Illuminate\Support\Facades\Blade;

class SystemEmailTemplate extends Model
{
    use HasFactory;

    protected $table = 'system_email_templates';

    protected $fillable = [
        'type',
        'name',
        'subject',
        'body',
        'variables',
        'is_active',
    ];

    protected $casts = [
        'variables' => 'array',
        'is_active' => 'boolean',
    ];

    /**
     * Types d'emails système disponibles
     */
    const TYPE_WELCOME = 'welcome';
    const TYPE_PASSWORD_RESET = 'password_reset';
    const TYPE_USER_CREATED = 'user_created';
    const TYPE_PASSWORD_CHANGED = 'password_changed';
    const TYPE_COURSE_ENROLLED = 'course_enrolled';
    const TYPE_COURSE_COMPLETED = 'course_completed';
    const TYPE_CERTIFICATE_ISSUED = 'certificate_issued';
    const TYPE_SESSION_REMINDER = 'session_reminder';

    /**
     * Remplacer les variables dans le sujet et le corps
     * Supporte les templates Blade
     */
    public function render(array $data): array
    {
        $subject = $this->subject;
        $body = $this->body;

        // Remplacer les variables simples {{variable}}
        foreach ($data as $key => $value) {
            $subject = str_replace("{{{$key}}}", $value, $subject);
            $body = str_replace("{{{$key}}}", $value, $body);
        }

        // Si le body contient du code Blade, le compiler
        if ($this->isBladeTemplate($body)) {
            try {
                $body = Blade::render($body, $data);
            } catch (\Exception $e) {
                // En cas d'erreur Blade, utiliser le remplacement simple
                \Log::warning("Blade rendering failed for template {$this->type}: " . $e->getMessage());
            }
        }

        // Compiler aussi le sujet si nécessaire
        if ($this->isBladeTemplate($subject)) {
            try {
                $subject = Blade::render($subject, $data);
            } catch (\Exception $e) {
                \Log::warning("Blade rendering failed for subject {$this->type}: " . $e->getMessage());
            }
        }

        return [
            'subject' => $subject,
            'body' => $body,
        ];
    }

    /**
     * Vérifier si le contenu contient du code Blade
     */
    private function isBladeTemplate(string $content): bool
    {
        // Détecter les directives Blade communes
        $bladePatterns = [
            '/@if\s*\(/',
            '/@foreach\s*\(/',
            '/@for\s*\(/',
            '/@while\s*\(/',
            '/@isset\s*\(/',
            '/@empty\s*\(/',
            '/@auth/',
            '/@guest/',
            '/\{\{.*\|.*\}\}/', // Filtres Blade
        ];

        foreach ($bladePatterns as $pattern) {
            if (preg_match($pattern, $content)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Scope pour les templates actifs
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope pour un type spécifique
     */
    public function scopeOfType($query, string $type)
    {
        return $query->where('type', $type);
    }
}

