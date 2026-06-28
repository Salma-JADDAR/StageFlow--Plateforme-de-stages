<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Entreprise extends Model
{
    use HasFactory;

    protected $primaryKey = 'idEntreprise';
    protected $fillable = [
        'nom', 'description', 'adresse', 'ville', 'siteWeb', 'logo',
        'emailContact', 'telephone'
    ];

    public function recruteurs()
    {
        return $this->hasMany(Recruteur::class, 'entreprise_id', 'idEntreprise');
    }

    public function offres()
    {
        return $this->hasMany(OffreStage::class, 'entreprise_id', 'idEntreprise');
    }
    
    // Accesseur pour l'URL complète du logo
    public function getLogoUrlAttribute()
    {
        if ($this->logo) {
            if (filter_var($this->logo, FILTER_VALIDATE_URL)) {
                return $this->logo;
            }
            return asset('storage/' . $this->logo);
        }
        return null;
    }
}