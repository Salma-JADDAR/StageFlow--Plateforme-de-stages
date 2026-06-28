<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Formation;

class DatabaseSeeder extends Seeder{
    public function run(){
        $this->call([
            FormationSeeder::class,
            CompetenceSeeder::class,
            UserSeeder::class,
            EntrepriseSeeder::class,
            OffreStageSeeder::class,
            CandidatureSeeder::class,
            EtudiantCompetenceSeeder::class,
            OffreCompetenceSeeder::class,
            RecommendationSeeder::class,
        ]);
        


    }
}