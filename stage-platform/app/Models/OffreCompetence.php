<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\Pivot;

class OffreCompetence extends Pivot{
    protected $table = 'offre_competence';
    protected $fillable = ['priorite'];
}