<?php

namespace Database\Seeders;

use App\Models\Candidature;
use Illuminate\Database\Seeder;

class CandidatureSeeder extends Seeder{
    public function run(){
        Candidature::factory(50)->create();
    }
}