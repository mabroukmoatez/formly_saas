<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ChatMessage extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'uuid',
        'conversation_id',
        'sender_id',
        'content',
        'message', // Legacy field
        'edited_at',
        'reply_to_id'
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
        'edited_at' => 'datetime'
    ];

    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($message) {
            if (empty($message->uuid)) {
                $message->uuid = \Str::uuid();
            }
        });
    }

    // Relations
    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class);
    }

    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    public function replyTo(): BelongsTo
    {
        return $this->belongsTo(ChatMessage::class, 'reply_to_id');
    }

    public function replies(): HasMany
    {
        return $this->hasMany(ChatMessage::class, 'reply_to_id');
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(ChatAttachment::class, 'message_id');
    }

    // Scopes
    public function scopeByConversation($query, $conversationId)
    {
        return $query->where('conversation_id', $conversationId);
    }

    public function scopeBySender($query, $senderId)
    {
        return $query->where('sender_id', $senderId);
    }

    public function scopeRecent($query, $limit = 50)
    {
        return $query->orderBy('created_at', 'desc')->limit($limit);
    }

    // Methods
    public function isFromUser($userId)
    {
        return $this->sender_id === $userId;
    }

    public function canBeEditedBy($userId)
    {
        // Messages can be edited by sender within 5 minutes
        if ($this->sender_id !== $userId) {
            return false;
        }

        return $this->created_at->diffInMinutes(now()) <= 5;
    }

    public function canBeDeletedBy($userId)
    {
        // Messages can be deleted by sender within 5 minutes or by admin
        if ($this->sender_id === $userId) {
            return $this->created_at->diffInMinutes(now()) <= 5;
        }

        // Check if user is admin (this would need to be implemented based on your role system)
        $user = User::find($userId);
        return $user && $user->role === 'admin';
    }

    public function editContent($newContent)
    {
        $this->update([
            'content' => $newContent,
            'edited_at' => now()
        ]);
    }

    public function getFormattedContent()
    {
        // Basic formatting for links and mentions
        $content = $this->content;
        
        // Convert URLs to links
        $content = preg_replace(
            '/(https?:\/\/[^\s]+)/',
            '<a href="$1" target="_blank" rel="noopener">$1</a>',
            $content
        );
        
        // Convert @mentions (basic implementation)
        $content = preg_replace(
            '/@(\w+)/',
            '<span class="mention">@$1</span>',
            $content
        );
        
        return $content;
    }
}