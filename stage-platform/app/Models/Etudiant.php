<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Etudiant extends Model{
    use HasFactory;

    protected $primaryKey = 'idEtudiant';

protected $fillable = [
    'user_id', 'photo', 'description', 'ville', 'telephone', 'formation_id', 'competence_id'
];

   public function user()
    {
        return $this->belongsTo(User::class, 'user_id'); 
    }

  

    public function formations()
    {
        return $this->hasMany(Formation::class, 'etudiant_id', 'idEtudiant');
    }

    public function competences()
{
    return $this->belongsToMany(Competence::class, 'etudiant_competence', 'etudiant_id', 'competence_id')
                ->withPivot('niveau')
                ->withTimestamps();
}

    public function candidatures()
    {
        return $this->hasMany(Candidature::class, 'etudiant_id', 'idEtudiant');
    }

    public function recommendations()
    {
        return $this->hasMany(Recommendation::class, 'etudiant_id', 'idEtudiant');
    }
       public function cv()
    {
        return $this->hasOne(CV::class, 'etudiant_id', 'idEtudiant');
    }
}