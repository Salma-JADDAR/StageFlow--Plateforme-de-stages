<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Recruteur extends Model{
    use HasFactory;

    protected $primaryKey = 'idRecruteur';
    protected $fillable = ['user_id', 'entreprise_id', 'poste'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function entreprise()
    {
        return $this->belongsTo(Entreprise::class, 'entreprise_id', 'idEntreprise');
    }
}