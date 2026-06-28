<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Competence extends Model
{
    use HasFactory;

    protected $primaryKey = 'idCompetence';
    protected $fillable = ['nom', 'categorie'];

  public function etudiants()
{
    return $this->belongsToMany(Etudiant::class, 'etudiant_competence', 'competence_id', 'etudiant_id')
                ->withPivot('niveau')
                ->withTimestamps();
}

    public function offres()
    {
        return $this->belongsToMany(
            OffreStage::class,
            'offre_competence',
            'competence_id',
            'offre_id'
        )->withPivot('priorite')->withTimestamps();
    }
}