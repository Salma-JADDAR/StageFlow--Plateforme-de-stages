<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\Pivot;

class EtudiantCompetence extends Pivot{
    protected $table = 'etudiant_competence';
    protected $fillable = ['niveau'];
}