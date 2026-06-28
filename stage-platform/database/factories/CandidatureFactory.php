<?php

namespace Database\Factories;

use App\Models\Etudiant;
use App\Models\OffreStage;
use Illuminate\Database\Eloquent\Factories\Factory;

class CandidatureFactory extends Factory{
    protected $model = \App\Models\Candidature::class;

    public function definition(){
        return [
            'etudiant_id' => Etudiant::factory(),
            'offre_id' => OffreStage::factory(),
            'lettreMotivation' => $this->faker->paragraph,
            'statut' => $this->faker->randomElement(['en_attente', 'acceptée', 'refusée']),
        ];
    }
}