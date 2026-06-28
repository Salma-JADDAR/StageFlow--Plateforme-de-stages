<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Candidature extends Model{
    use HasFactory;

    protected $primaryKey = 'idCandidature';
    protected $fillable = ['etudiant_id', 'offre_id', 'lettreMotivation', 'statut'];

    protected $casts = [
        'dateCandidature' => 'date',
    ];

    public function etudiant()
    {
        return $this->belongsTo(Etudiant::class, 'etudiant_id', 'idEtudiant');
    }

    public function offre()
    {
        return $this->belongsTo(OffreStage::class, 'offre_id', 'idOffre');
    }
}