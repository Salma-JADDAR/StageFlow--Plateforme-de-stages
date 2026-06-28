<?php

namespace Database\Factories;

use App\Models\Entreprise;
use Illuminate\Database\Eloquent\Factories\Factory;

class OffreStageFactory extends Factory{
    protected $model = \App\Models\OffreStage::class;

    public function definition(){
        return [
            'entreprise_id' => Entreprise::factory(),
            'titre' => $this->faker->jobTitle,
            'description' => $this->faker->paragraphs(3, true),
            'ville' => $this->faker->city,
            'duree' => $this->faker->numberBetween(1, 6),
            'typeStage' => $this->faker->randomElement(['PFE', 'stage d\'été', 'stage ouvrier']),
            'dateLimite' => $this->faker->dateTimeBetween('+1 week', '+3 months'),
            'statut' => 'publiée',
        ];
    }
}