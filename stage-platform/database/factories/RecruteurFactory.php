<?php

namespace Database\Factories;

use App\Models\User;
use App\Models\Entreprise;
use Illuminate\Database\Eloquent\Factories\Factory;

class RecruteurFactory extends Factory
{
    protected $model = \App\Models\Recruteur::class;

    public function definition()
    {
        return [
            'user_id' => User::factory()->create(['role' => 'recruteur'])->id,
            'entreprise_id' => Entreprise::factory(),
            'poste' => $this->faker->jobTitle,
        ];
    }
}