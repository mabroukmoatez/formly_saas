<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OrganizationMailingList extends Model
{
    use HasFactory;

    protected $fillable = [
        'organization_id',
        'name',
        'description',
        'type',
        'course_id',
        'session_id',
        'recipients',
        'is_editable',
        'is_active',
        'created_by',
    ];

    protected $casts = [
        'recipients' => 'array',
        'is_editable' => 'boolean',
        'is_active' => 'boolean',
    ];

    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }

    public function course()
    {
        return $this->belongsTo(Course::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function messages()
    {
        return $this->hasMany(OrganizationMessage::class, 'mailing_list_id');
    }

    public function scopeByOrganization($query, $organizationId)
    {
        return $query->where('organization_id', $organizationId);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeEditable($query)
    {
        return $query->where('is_editable', true);
    }

    public function scopeByType($query, $type)
    {
        return $query->where('type', $type);
    }

    public function getRecipientsCount()
    {
        return is_array($this->recipients) ? count($this->recipients) : 0;
    }

    public function addRecipient($userId)
    {
        $recipients = $this->recipients ?? [];
        if (!in_array($userId, $recipients)) {
            $recipients[] = $userId;
            $this->update(['recipients' => $recipients]);
        }
    }

    public function removeRecipient($userId)
    {
        $recipients = $this->recipients ?? [];
        $recipients = array_filter($recipients, fn($id) => $id != $userId);
        $this->update(['recipients' => array_values($recipients)]);
    }
}

