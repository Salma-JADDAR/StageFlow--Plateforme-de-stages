<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class CompetenceFactory extends Factory
{
    protected $model = \App\Models\Competence::class;

    public function definition()
    {
        return [
            'nom' => $this->faker->randomElement(['PHP', 'Laravel', 'React', 'MySQL', 'Python', 'Java', 'UML', 'Git']),
            'categorie' => $this->faker->randomElement(['Langage', 'Framework', 'Base de données', 'Outils']),
        ];
    }
}