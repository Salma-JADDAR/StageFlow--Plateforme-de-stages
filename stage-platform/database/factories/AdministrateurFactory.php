<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class AdministrateurFactory extends Factory{
    protected $model = \App\Models\Administrateur::class;

    public function definition(){
        return [
            'user_id' => User::factory()->create(['role' => 'admin'])->id,
        ];
    }
}