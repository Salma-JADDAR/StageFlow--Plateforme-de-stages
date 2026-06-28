<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class EtudiantResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'idEtudiant' => $this->idEtudiant,
            'photo' => $this->photo,
            'photo_url' => $this->photo ? asset('storage/' . $this->photo) : null,  // ← AJOUTEZ CETTE LIGNE
            'description' => $this->description,
            'ville' => $this->ville,
            'telephone' => $this->telephone,
            'user' => new UserResource($this->whenLoaded('user')),
            'formations' => FormationResource::collection($this->whenLoaded('formations')),
            'competences' => CompetenceResource::collection($this->whenLoaded('competences')),
            'cv' => $this->whenLoaded('cv'),
        ];
    }
}