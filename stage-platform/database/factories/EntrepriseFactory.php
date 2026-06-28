<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class EntrepriseFactory extends Factory
{
    protected $model = \App\Models\Entreprise::class;

    public function definition()
    {
        return [
            'nom' => $this->faker->company,
            'description' => $this->faker->paragraph,
            'adresse' => $this->faker->streetAddress,
            'ville' => $this->faker->city,
            'siteWeb' => $this->faker->url,
            'logo' => $this->faker->imageUrl(200, 200, 'business'),
            'emailContact' => $this->faker->companyEmail,
            'telephone' => $this->faker->phoneNumber,
        ];
    }
}