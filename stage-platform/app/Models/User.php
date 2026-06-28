<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
class User extends Authenticatable
{
     use HasApiTokens, HasFactory, Notifiable;

    // app/Models/User.php
protected $fillable = [
    'nom', 'prenom', 'email', 'password', 'role', 'dernierAcces'
];

    protected $hidden = ['password', 'remember_token'];

    protected $casts = [
        'dateCreation' => 'datetime',
        'dernierAcces' => 'datetime',
    ];

    public function etudiant()
    {
        return $this->hasOne(Etudiant::class, 'user_id');
    }

    public function recruteur()
    {
        return $this->hasOne(Recruteur::class, 'user_id');
    }

    public function administrateur()
    {
        return $this->hasOne(Administrateur::class, 'user_id');
    }

    public function notifications()
    {
        return $this->hasMany(Notification::class);
    }
}