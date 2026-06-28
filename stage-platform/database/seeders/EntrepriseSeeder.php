<?php

namespace Database\Seeders;

use App\Models\Entreprise;
use Illuminate\Database\Seeder;

class EntrepriseSeeder extends Seeder{
    public function run(){
        Entreprise::factory(10)->create();
    }
}