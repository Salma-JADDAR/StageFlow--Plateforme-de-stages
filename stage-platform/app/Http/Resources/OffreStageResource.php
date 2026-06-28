<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class OffreStageResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'idOffre' => $this->idOffre,
            'titre' => $this->titre,
            'description' => $this->description,
            'ville' => $this->ville,
            'duree' => $this->duree,
            'typeStage' => $this->typeStage,
            'datePublication' => $this->datePublication,
            'dateLimite' => $this->dateLimite,
            'statut' => $this->statut,
            'entreprise' => new EntrepriseResource($this->whenLoaded('entreprise')),
            'competences' => CompetenceResource::collection($this->whenLoaded('competences')),
        ];
    }
}