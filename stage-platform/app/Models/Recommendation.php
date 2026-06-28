<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Recommendation extends Model{
    use HasFactory;

    protected $primaryKey = 'idRecommendation';
    protected $fillable = ['etudiant_id', 'offre_id', 'scoreMatching'];

    protected $casts = [
        'dateGeneration' => 'date',
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