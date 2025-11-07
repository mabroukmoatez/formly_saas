<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TicketMessages extends Model
{
    use HasFactory;

    protected $fillable = [
        'ticket_id',
        'sender_user_id',
        'reply_admin_user_id',
        'message',
        'file',
    ];

    public function ticket()
    {
        return $this->belongsTo(Ticket::class, 'ticket_id');
    }

    public function sendUser()
    {
        return $this->belongsTo(User::class, 'sender_user_id', 'id');
    }

    public function replyUser()
    {
        return $this->belongsTo(User::class, 'reply_admin_user_id', 'id');
    }

    /**
     * Obtenir l'utilisateur qui a envoyé le message (peut être l'expéditeur ou l'admin qui répond)
     */
    public function getUser()
    {
        if ($this->reply_admin_user_id) {
            return $this->replyUser;
        }
        return $this->sendUser;
    }

    /**
     * Vérifier si le message est une réponse de l'admin
     */
    public function isAdminReply()
    {
        return !is_null($this->reply_admin_user_id);
    }
}
