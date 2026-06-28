<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class RecommendationResource extends JsonResource{
    public function toArray($request){
        return [
            'idRecommendation' => $this->idRecommendation,
            'scoreMatching' => $this->scoreMatching,
            'dateGeneration' => $this->dateGeneration,
            'offre' => new OffreStageResource($this->whenLoaded('offre')),
        ];
    }
}