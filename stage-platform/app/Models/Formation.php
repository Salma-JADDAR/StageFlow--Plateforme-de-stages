<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Formation extends Model{
    use HasFactory;

    protected $primaryKey = 'idFormation';
    protected $fillable = [
        'etudiant_id', 'diplome', 'etablissement', 'niveau',
        'anneeDebut', 'anneeFin'
    ];

    public function etudiant()
    {
        return $this->belongsTo(Etudiant::class, 'etudiant_id', 'idEtudiant');
    }
}