<?php

namespace Database\Factories;

use App\Models\Etudiant;
use App\Models\OffreStage;
use Illuminate\Database\Eloquent\Factories\Factory;

class RecommendationFactory extends Factory{
    protected $model = \App\Models\Recommendation::class;

    public function definition(){
        return [
            'etudiant_id' => Etudiant::factory(),
            'offre_id' => OffreStage::factory(),
            'scoreMatching' => $this->faker->randomFloat(2, 20, 100),
        ];
    }
}