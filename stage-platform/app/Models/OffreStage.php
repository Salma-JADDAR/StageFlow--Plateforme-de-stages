<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes; 

class OffreStage extends Model{
   use HasFactory, SoftDeletes; 

    protected $table = 'offres_stage';
    protected $primaryKey = 'idOffre';
    
    protected $fillable = [
        'entreprise_id', 
        'titre', 
        'description', 
        'ville', 
        'duree',
        'typeStage', 
        'dateLimite', 
        'statut',
        'motif_rejet',
        'dateRejet',
        'dateValidation'
    ];

   protected $casts = [
        'datePublication' => 'date',
        'dateLimite' => 'date',
        'dateRejet' => 'date',
        'dateValidation' => 'date',
    ];
const STATUTS = ['publiée', 'archivée', 'en_attente', 'refusée'];

    public function entreprise()
    {
        return $this->belongsTo(Entreprise::class, 'entreprise_id', 'idEntreprise');
    }

    public function competences()
    {
        return $this->belongsToMany(
            Competence::class,
            'offre_competence',
            'offre_id',
            'competence_id'
        )->withPivot('priorite')->withTimestamps();
    }

    public function candidatures()
    {
        return $this->hasMany(Candidature::class, 'offre_id', 'idOffre');
    }

    public function recommendations()
    {
        return $this->hasMany(Recommendation::class, 'offre_id', 'idOffre');
    }
}