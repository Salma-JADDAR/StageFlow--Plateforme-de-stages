<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CV extends Model
{
    use HasFactory;
    
    // Force le nom de la table (important !)
    protected $table = 'cvs';
    
    protected $primaryKey = 'idCV';
    
    protected $fillable = [
        'etudiant_id',
        'nomFichier',
        'cheminFichier',
        'taille'
    ];
    
    public function etudiant()
    {
        return $this->belongsTo(Etudiant::class, 'etudiant_id', 'idEtudiant');
    }
}