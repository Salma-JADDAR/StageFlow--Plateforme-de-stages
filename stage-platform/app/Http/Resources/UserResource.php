<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id' => $this->id,
            'nom' => $this->nom,
            'prenom' => $this->prenom,
            'email' => $this->email,
            'role' => $this->role,
            'dateCreation' => $this->dateCreation,
            'dernierAcces' => $this->dernierAcces,
            'ville' => $this->ville ?? null,
            'telephone' => $this->telephone ?? null,
            'etudiant' => new EtudiantResource($this->whenLoaded('etudiant')),
            'recruteur' => $this->whenLoaded('recruteur'),
            'administrateur' => $this->whenLoaded('administrateur'),
        ];
    }
}