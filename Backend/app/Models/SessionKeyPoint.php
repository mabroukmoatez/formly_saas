<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SessionKeyPoint extends Model
{
    use HasFactory;

    protected $table = 'session_key_points';
    protected $fillable = ['session_id', 'name'];

    public function session()
    {
        return $this->belongsTo(Session::class, 'session_id');
    }
}

