<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class OrganizationMessage extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'organization_id',
        'sender_id',
        'sender_type',
        'recipient_id',
        'recipient_type',
        'mailing_list_id',
        'subject',
        'message',
        'attachments',
        'is_read',
        'read_at',
        'reply_to',
        'is_archived',
    ];

    protected $casts = [
        'attachments' => 'array',
        'is_read' => 'boolean',
        'is_archived' => 'boolean',
        'read_at' => 'datetime',
    ];

    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }

    public function sender()
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    public function recipient()
    {
        return $this->belongsTo(User::class, 'recipient_id');
    }

    public function mailingList()
    {
        return $this->belongsTo(OrganizationMailingList::class, 'mailing_list_id');
    }

    public function parentMessage()
    {
        return $this->belongsTo(OrganizationMessage::class, 'reply_to');
    }

    public function replies()
    {
        return $this->hasMany(OrganizationMessage::class, 'reply_to');
    }

    public function scopeByOrganization($query, $organizationId)
    {
        return $query->where('organization_id', $organizationId);
    }

    public function scopeForUser($query, $userId)
    {
        return $query->where(function($q) use ($userId) {
            $q->where('sender_id', $userId)
              ->orWhere('recipient_id', $userId);
        });
    }

    public function scopeUnread($query)
    {
        return $query->where('is_read', false);
    }

    public function markAsRead()
    {
        $this->update([
            'is_read' => true,
            'read_at' => now()
        ]);
    }
}

