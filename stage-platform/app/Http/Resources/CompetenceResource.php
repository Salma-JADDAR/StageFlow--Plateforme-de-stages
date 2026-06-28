<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class CompetenceResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'idCompetence' => $this->idCompetence,
            'nom' => $this->nom,
            'categorie' => $this->categorie,
            'pivot' => $this->whenPivotLoaded('etudiant_competence', function() {
                return ['niveau' => $this->pivot->niveau];
            }),
        ];
    }
}