<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class EntrepriseResource extends JsonResource{
    public function toArray($request){
        return [
            'idEntreprise' => $this->idEntreprise,
            'nom' => $this->nom,
            'description' => $this->description,
            'adresse' => $this->adresse,
            'ville' => $this->ville,
            'siteWeb' => $this->siteWeb,
            'logo' => $this->logo,
            'emailContact' => $this->emailContact,
            'telephone' => $this->telephone,
        ];
    }
}