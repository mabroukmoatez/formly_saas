<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class LibraryTemplate extends Model
{
    use HasFactory;

    protected $table = 'library_templates';

    protected $fillable = [
        'organization_id',
        'name',
        'description',
        'type',
        'category',
        'content',
        'fields',
        'variables',
        'subject',
        'from_email',
        'from_name',
        'cc',
        'bcc',
        'body',
        'preview_image',
        'source',
        'is_active',
        'usage_count',
    ];

    protected $casts = [
        'fields' => 'array',
        'variables' => 'array',
        'is_active' => 'boolean',
        'usage_count' => 'integer',
    ];

    const TYPE_DOCUMENT = 'document';
    const TYPE_QUESTIONNAIRE = 'questionnaire';
    const TYPE_EMAIL = 'email';

    const SOURCE_ORGANIZATION = 'organization';
    const SOURCE_FORMLY = 'formly';

    // Relationships
    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeForOrganization($query, $organizationId)
    {
        return $query->where(function($q) use ($organizationId) {
            $q->where('organization_id', $organizationId)
              ->orWhereNull('organization_id'); // Include Formly templates
        });
    }

    public function scopeOfType($query, $type)
    {
        return $query->where('type', $type);
    }

    public function scopeFormlyTemplates($query)
    {
        return $query->whereNull('organization_id')->where('source', self::SOURCE_FORMLY);
    }

    // Accessors
    public function getPreviewImageUrlAttribute()
    {
        if ($this->preview_image) {
            return Storage::disk('public')->exists($this->preview_image)
                ? asset('storage/' . $this->preview_image)
                : null;
        }
        return null;
    }

    public function isEmailTemplate()
    {
        return $this->type === self::TYPE_EMAIL;
    }

    public function isDocumentTemplate()
    {
        return $this->type === self::TYPE_DOCUMENT;
    }

    public function isQuestionnaireTemplate()
    {
        return $this->type === self::TYPE_QUESTIONNAIRE;
    }

    public function incrementUsage()
    {
        $this->increment('usage_count');
    }
}
