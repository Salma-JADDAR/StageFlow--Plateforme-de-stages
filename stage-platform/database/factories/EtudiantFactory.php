<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class EtudiantFactory extends Factory
{
    protected $model = \App\Models\Etudiant::class;

    public function definition()
    {
        return [
            'user_id' => User::factory()->create(['role' => 'etudiant'])->id,
            'photo' => $this->faker->imageUrl(200, 200, 'people'),
            'description' => $this->faker->paragraph,
            'ville' => $this->faker->city,
            'telephone' => $this->faker->phoneNumber,
        ];
    }
}