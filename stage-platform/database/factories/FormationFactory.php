<?php

namespace Database\Factories;

use App\Models\Etudiant;
use Illuminate\Database\Eloquent\Factories\Factory;

class FormationFactory extends Factory
{
    protected $model = \App\Models\Formation::class;

    public function definition()
    {
        return [
            'etudiant_id' => Etudiant::factory(),
            'diplome' => $this->faker->randomElement(['Baccalauréat', 'DUT', 'Licence', 'Master', 'Doctorat']),
            'etablissement' => $this->faker->university,
            'niveau' => $this->faker->randomElement(['Bac+0', 'Bac+2', 'Bac+3', 'Bac+5', 'Bac+8']),
            'anneeDebut' => $this->faker->year,
            'anneeFin' => $this->faker->year,
        ];
    }
}