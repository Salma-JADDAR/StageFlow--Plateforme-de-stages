<?php

namespace Database\Factories;

use App\Models\Etudiant;
use Illuminate\Database\Eloquent\Factories\Factory;

class CVFactory extends Factory
{
    protected $model = \App\Models\CV::class;

    public function definition()
    {
        return [
            'etudiant_id' => Etudiant::factory(),
            'nomFichier' => $this->faker->word . '.pdf',
            'cheminFichier' => 'cvs/' . $this->faker->uuid . '.pdf',
            'taille' => $this->faker->numberBetween(100, 5000),
        ];
    }
}