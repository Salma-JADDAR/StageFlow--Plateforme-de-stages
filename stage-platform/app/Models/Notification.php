<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'type',
        'titre',
        'message',
        'lien',
        'est_lu',
         'icone'
    ];

    protected $casts = [
        'est_lu' => 'boolean',
    ];

    // Relation avec l'utilisateur
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Marquer comme lue
    public function markAsRead()
    {
        $this->update(['est_lu' => true]);
    }

    // Scope pour les notifications non lues
    public function scopeUnread($query)
    {
        return $query->where('est_lu', false);
    }
}